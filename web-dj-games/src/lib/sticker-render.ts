import { normalizeStickerText, stickerColor, type CustomSticker, type StickerFont } from "@/data/store";

/**
 * Draws custom text stickers exactly the way PRESS HOUSE does, so the preview
 * the shopper sees is the same file that gets printed.
 */

const STICKER_FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Anton&family=Baloo+2:wght@700&family=Pacifico&display=swap";

let fontsReady: Promise<void> | null = null;

/** Loads the four sticker fonts once (only when someone opens a sticker builder). */
export const ensureStickerFonts = (): Promise<void> => {
  if (typeof document === "undefined") return Promise.resolve();
  if (fontsReady) return fontsReady;

  fontsReady = new Promise<void>((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = STICKER_FONT_CSS;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  })
    .then(() =>
      Promise.all([
        document.fonts.load("800 64px Archivo"),
        document.fonts.load("400 64px Anton"),
        document.fonts.load('700 64px "Baloo 2"'),
        document.fonts.load("400 64px Pacifico"),
      ]),
    )
    .then(() => undefined)
    .catch((error: unknown) => {
      console.warn("sticker fonts failed to load", error);
    });

  return fontsReady;
};

const fontFor = (font: StickerFont, size: number): string => {
  switch (font) {
    case "condensed":
      return `400 ${size}px Anton, sans-serif`;
    case "rounded":
      return `700 ${size}px "Baloo 2", sans-serif`;
    case "script":
      return `400 ${size}px Pacifico, cursive`;
    default:
      return `800 ${size}px Archivo, sans-serif`;
  }
};

const breakWord = (ctx: CanvasRenderingContext2D, word: string, maxWidth: number): string[] => {
  const pieces: string[] = [];
  let current = "";
  for (const char of word) {
    if (current && ctx.measureText(current + char).width > maxWidth) {
      pieces.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  if (current) pieces.push(current);
  return pieces;
};

const wrap = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(" ").filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !current) current = next;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.flatMap((line) =>
    ctx.measureText(line).width <= maxWidth || line.length <= 3 ? [line] : breakWord(ctx, line, maxWidth),
  );
};

const drawLabel = (
  ctx: CanvasRenderingContext2D,
  font: StickerFont,
  label: string,
  cx: number,
  cy: number,
  width: number,
  height: number,
  padding: number,
  fill: string,
): void => {
  const maxW = width * (1 - padding * 2);
  const maxH = height * (1 - padding * 2);
  let size = maxH * 0.5;
  let lines: string[] = [label];

  // Shrink until the text fits in at most four lines.
  for (; size > maxH * 0.08; size *= 0.94) {
    ctx.font = fontFor(font, size);
    lines = wrap(ctx, label, maxW);
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width), 1);
    if (lines.length <= 4 && widest <= maxW && lines.length * size * 1.08 <= maxH) break;
  }

  ctx.font = fontFor(font, size);
  ctx.fillStyle = fill;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lineHeight = size * 1.08;
  const top = cy - (lines.length * lineHeight) / 2 + lineHeight / 2;
  lines.forEach((line, index) => ctx.fillText(line, cx, top + index * lineHeight));
};

/** Paints the sticker onto `canvas` at `width` x `height`, transparent around the shape. */
export const drawSticker = (canvas: HTMLCanvasElement, spec: CustomSticker, width: number, height: number): void => {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);

  const color = stickerColor(spec.color);
  const shaped = spec.shape !== "text";
  const label = normalizeStickerText(spec.text) || "Your text";
  const margin = shaped ? 0.04 : 0.02;
  const x0 = width * margin;
  const y0 = height * margin;
  const w = width - width * margin * 2;
  const h = height - height * margin * 2;
  const cx = width / 2;
  const cy = height / 2;

  if (shaped) {
    ctx.fillStyle = color.hex;
    ctx.beginPath();
    switch (spec.shape) {
      case "circle":
        ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
        break;
      case "square":
        ctx.roundRect(x0, y0, w, h, Math.min(w, h) * 0.2);
        break;
      case "star": {
        const outer = Math.min(w, h) / 2;
        const inner = outer * 0.44;
        for (let point = 0; point < 10; point += 1) {
          const angle = -Math.PI / 2 + (point * Math.PI) / 5;
          const radius = point % 2 === 0 ? outer : inner;
          const px = cx + Math.cos(angle) * radius;
          const py = cy + Math.sin(angle) * radius;
          if (point === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      }
      case "heart": {
        const s = Math.min(w, h) * 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(w / (s * 0.72), h / (s * 0.78));
        ctx.moveTo(0, s * 0.3);
        ctx.bezierCurveTo(0, s * 0.22, -s * 0.18, s * 0.02, -s * 0.18, -s * 0.1);
        ctx.bezierCurveTo(-s * 0.18, -s * 0.26, -s * 0.04, -s * 0.3, 0, -s * 0.16);
        ctx.bezierCurveTo(s * 0.04, -s * 0.3, s * 0.18, -s * 0.26, s * 0.18, -s * 0.1);
        ctx.bezierCurveTo(s * 0.18, s * 0.02, 0, s * 0.22, 0, s * 0.3);
        ctx.closePath();
        ctx.restore();
        break;
      }
      default:
        break;
    }
    ctx.fill();
  }

  drawLabel(ctx, spec.font, label, cx, cy, w, h, shaped ? 0.3 : 0.02, shaped ? color.textHex : color.hex);
};

/** Full-resolution print file as raw base64 PNG (no data: prefix). */
export const renderStickerPng = async (spec: CustomSticker, width: number, height: number): Promise<string> => {
  await ensureStickerFonts();
  const canvas = document.createElement("canvas");
  drawSticker(canvas, spec, width, height);
  const dataUrl = canvas.toDataURL("image/png");
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
};
