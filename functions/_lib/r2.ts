/**
 * Minimal S3-compatible client for Cloudflare R2, using AWS SigV4.
 *
 * R2 is addressed over its S3 API (`<account>.r2.cloudflarestorage.com`) rather
 * than a bucket binding, because the Rork Worker Loader runtime does not expose
 * R2 bindings. Credentials stay server-side in project envs and are never sent
 * to the browser; the browser only ever receives short-lived presigned PUT URLs
 * for uploads, and permanent unsigned public URLs for reading.
 */

const encoder = new TextEncoder();

const SERVICE = "s3";
const REGION = "auto";
const UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

/** Reads R2 settings from the Worker env. Returns null when not configured yet. */
export const readR2Config = (env: Record<string, unknown>): R2Config | null => {
  const accountId = typeof env.R2_ACCOUNT_ID === "string" ? env.R2_ACCOUNT_ID.trim() : "";
  const accessKeyId = typeof env.R2_ACCESS_KEY_ID === "string" ? env.R2_ACCESS_KEY_ID.trim() : "";
  const secretAccessKey = typeof env.R2_SECRET_ACCESS_KEY === "string" ? env.R2_SECRET_ACCESS_KEY.trim() : "";
  const bucket = typeof env.R2_BUCKET === "string" ? env.R2_BUCKET.trim() : "";

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket };
};

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const sha256Hex = async (data: string): Promise<string> =>
  toHex(await crypto.subtle.digest("SHA-256", encoder.encode(data)));

const hmac = async (key: ArrayBuffer, data: string): Promise<ArrayBuffer> => {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
};

/** RFC 3986 encoding for a single path segment (S3 canonicalisation rules). */
const encodeSegment = (segment: string): string =>
  encodeURIComponent(segment).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);

const encodeKey = (key: string): string => key.split("/").map(encodeSegment).join("/");

const timestamps = (): { amzDate: string; dateStamp: string } => {
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
};

const signingKey = async (config: R2Config, dateStamp: string): Promise<ArrayBuffer> => {
  const initial = encoder.encode(`AWS4${config.secretAccessKey}`);
  // `.slice()` normalises the view into a standalone ArrayBuffer for the WebCrypto types.
  const dateKey = await hmac(initial.slice().buffer, dateStamp);
  const regionKey = await hmac(dateKey, REGION);
  const serviceKey = await hmac(regionKey, SERVICE);
  return hmac(serviceKey, "aws4_request");
};

const host = (config: R2Config): string => `${config.accountId}.r2.cloudflarestorage.com`;

const objectUrl = (config: R2Config, key: string): string =>
  `https://${host(config)}/${encodeSegment(config.bucket)}/${encodeKey(key)}`;

/**
 * Canonical URI for the request being signed. Omitting the key targets the
 * bucket itself, which is how sub-resource operations such as `?cors` work.
 */
const canonicalPath = (config: R2Config, key?: string): string =>
  key === undefined
    ? `/${encodeSegment(config.bucket)}`
    : `/${encodeSegment(config.bucket)}/${encodeKey(key)}`;

/**
 * Builds a presigned URL the browser can upload to directly, so large videos
 * never pass through (or get buffered by) the Worker.
 *
 * `content-type` is part of the signature, which forces the uploader to send
 * exactly the type we validated — R2 then stores it and replays it on GET.
 */
export const presignPut = async (
  config: R2Config,
  key: string,
  contentType: string,
  expiresInSeconds: number,
): Promise<string> => {
  const { amzDate, dateStamp } = timestamps();
  const credential = `${config.accessKeyId}/${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const signedHeaders = "content-type;host";

  const query = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": signedHeaders,
  });
  // S3 requires the canonical query string sorted by key; URLSearchParams.sort
  // gives us exactly that ordering.
  query.sort();

  const canonicalHeaders = `content-type:${contentType}\nhost:${host(config)}\n`;
  const canonicalRequest = [
    "PUT",
    canonicalPath(config, key),
    query.toString(),
    canonicalHeaders,
    signedHeaders,
    UNSIGNED_PAYLOAD,
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    `${dateStamp}/${REGION}/${SERVICE}/aws4_request`,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signature = toHex(await hmac(await signingKey(config, dateStamp), stringToSign));
  query.set("X-Amz-Signature", signature);

  return `${objectUrl(config, key)}?${query.toString()}`;
};

interface SignedRequestOptions {
  method: string;
  /** Object key. Omit to address the bucket itself (sub-resource operations). */
  key?: string;
  /** Canonical query string, e.g. `cors=` for the bucket CORS sub-resource. */
  query?: string;
  extraHeaders?: Record<string, string>;
  body?: BodyInit | null;
  /** Hex sha256 of the body. Defaults to the empty-body digest. */
  payloadHash?: string;
}

const EMPTY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

/** Performs a SigV4 header-signed request against the bucket (server-side only). */
export const signedRequest = async (config: R2Config, options: SignedRequestOptions): Promise<Response> => {
  const { amzDate, dateStamp } = timestamps();
  const payloadHash = options.payloadHash ?? EMPTY_SHA256;

  const headers = new Headers(options.extraHeaders ?? {});
  headers.set("host", host(config));
  headers.set("x-amz-content-sha256", payloadHash);
  headers.set("x-amz-date", amzDate);

  const headerNames = [...headers.keys()].map((name) => name.toLowerCase()).sort();
  const canonicalHeaders = headerNames.map((name) => `${name}:${headers.get(name)?.trim() ?? ""}\n`).join("");
  const signedHeaders = headerNames.join(";");

  const canonicalRequest = [
    options.method,
    canonicalPath(config, options.key),
    options.query ?? "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    `${dateStamp}/${REGION}/${SERVICE}/aws4_request`,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signature = toHex(await hmac(await signingKey(config, dateStamp), stringToSign));
  const credential = `${config.accessKeyId}/${dateStamp}/${REGION}/${SERVICE}/aws4_request`;

  headers.set(
    "Authorization",
    `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  );
  headers.delete("host");

  const base =
    options.key === undefined
      ? `https://${host(config)}/${encodeSegment(config.bucket)}`
      : objectUrl(config, options.key);
  const target = options.query ? `${base}?${options.query}` : base;

  return fetch(target, {
    method: options.method,
    headers,
    body: options.body ?? null,
  });
};

/**
 * Writes the bucket's CORS policy over the S3 API.
 *
 * A browser -> R2 presigned PUT is cross-origin, so without this policy the
 * browser blocks every upload before it leaves the page. Setting it from the
 * Worker (which already holds the credentials) means the studio never has to
 * hand-edit bucket settings in the Cloudflare dashboard.
 */
export const putBucketCors = async (config: R2Config, origins: string[]): Promise<Response> => {
  const rules = origins.map((origin) => `<AllowedOrigin>${origin}</AllowedOrigin>`).join("");
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><CORSRule>' +
    rules +
    "<AllowedMethod>PUT</AllowedMethod><AllowedMethod>GET</AllowedMethod><AllowedMethod>HEAD</AllowedMethod>" +
    "<AllowedHeader>*</AllowedHeader><ExposeHeader>ETag</ExposeHeader><MaxAgeSeconds>3600</MaxAgeSeconds>" +
    "</CORSRule></CORSConfiguration>";

  return signedRequest(config, {
    method: "PUT",
    query: "cors=",
    extraHeaders: { "content-type": "application/xml" },
    body: xml,
    payloadHash: await sha256Hex(xml),
  });
};

/** Reads the bucket's current CORS policy back, used to verify the write. */
export const getBucketCors = (config: R2Config): Promise<Response> =>
  signedRequest(config, { method: "GET", query: "cors=" });

/**
 * Existence check for the bucket itself: 200 when it exists, 404 when it does
 * not. Probing an object cannot tell those apart — a missing object in a real
 * bucket and any object in a missing bucket both answer 404 — so bucket-level
 * checks must address the bucket, not a key.
 */
export const headBucket = (config: R2Config): Promise<Response> =>
  signedRequest(config, { method: "HEAD" });

/** Creates the bucket. Requires a token with bucket-admin permission. */
export const createBucket = (config: R2Config): Promise<Response> =>
  signedRequest(config, { method: "PUT" });

/** Streams an object back, forwarding Range so video scrubbing works. */
export const getObject = async (config: R2Config, key: string, range: string | null): Promise<Response> =>
  signedRequest(config, {
    method: "GET",
    key,
    extraHeaders: range ? { range } : {},
    payloadHash: UNSIGNED_PAYLOAD,
  });

export const headObject = (config: R2Config, key: string): Promise<Response> =>
  signedRequest(config, { method: "HEAD", key });

export const deleteObject = (config: R2Config, key: string): Promise<Response> =>
  signedRequest(config, { method: "DELETE", key });

/** Server-side copy, used by rename so the bytes never round-trip the Worker. */
export const copyObject = (config: R2Config, fromKey: string, toKey: string): Promise<Response> =>
  signedRequest(config, {
    method: "PUT",
    key: toKey,
    extraHeaders: { "x-amz-copy-source": `/${config.bucket}/${fromKey}` },
  });
