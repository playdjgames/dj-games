"""Rebuild options + variants in presshouse.generated.ts from the real Printify dump."""
import json, re, sys

GEN = "web-dj-games/src/data/presshouse.generated.ts"
VARS = "/tmp/vars.json"

LISTING = {
    "prd_mukpeqbf32cbd2701c": "6ab92ea0a4fc0c9922093aa5",
    "prd_mukpeqoyded617b075": "6ab92ea563d317ccfb0c76d0",
    "prd_mukper6hbf5dc93338": "6ab92ea9dcd154052a0154ef",
    "prd_mukperk07c709455e6": "6ab92eac313d78541609a09c",
    "prd_mukpervr0e0d0cca1b": "6ab92eaf63d317ccfb0c76d4",
    "prd_mukpes37aa2f12bbbe": "6ab92eb2a4fc0c9922093aaf",
    "prd_mukpesdn06c02beffc": "6ab92eb4313d78541609a0a2",
    "prd_mukpespnf14c702060": "6ab92eb7b89b0ed60e0390c1",
    "prd_mukpet1fbe4b319ba7": "6ab92ebd4969eb2e8f085ccd",
    "prd_mukpethze882c4d24b": "6ab92ec10d7900d72c070b74",
    "prd_mukpetn5445d38101c": "6ab92ec3a4fc0c9922093abc",
    "prd_mukpeqgw91c476a628": "6ab948ba7ffd41ee910caa27",
    "prd_mukpeqv6a2e40b1178": "6ab948c57ffd41ee910caa31",
    "prd_mukperca39dc9cb42e": "6ab948cad93c97b61d03328f",
    "prd_mukpetafe0f2fc5d27": "6ab948d1d93c97b61d03329b",
}

POSTERS = {"6ab92ec10d7900d72c070b74", "6ab92ec3a4fc0c9922093abc", "6ab948d1d93c97b61d03329b"}
STICKER = "6ab92ebd4969eb2e8f085ccd"
MUG = "6ab92eb4313d78541609a0a2"

SIZE_NAMES = {"S", "M", "L", "XL", "2XL", "One size"}

def is_size(half: str) -> bool:
    h = half.strip()
    return (
        h in SIZE_NAMES
        or "oz" in h.lower()
        or "size" in h.lower()
        or "″" in h
        or '"' in h
    )

def parse_variant(pid: str, title: str):
    """Return (color, size) parsed from a Printify variant title."""
    halves = [h.strip() for h in title.split(" / ")]
    if pid == STICKER:
        return halves[0], halves[-1]
    if pid in POSTERS:
        return "Default", halves[0]
    if len(halves) == 1:
        return "Default", halves[0]
    a, b = halves[0], halves[-1]
    if is_size(a) and not is_size(b):
        return b, a
    if is_size(b) and not is_size(a):
        return a, b
    # Both or neither look like sizes (long sleeves print "Size / Color"):
    # fall back to half order — first half is the size on those products.
    return b, a

def size_rank(label: str) -> tuple:
    order = ["One size", "S", "M", "L", "XL", "2XL", "12oz", "22oz"]
    if label in order:
        return (0, order.index(label), label)
    nums = re.findall(r"[\d.]+", label)
    return (1, float(nums[0]) if nums else 0.0, label)

src = open(GEN, encoding="utf-8").read()
marker = "export const PRESS_HOUSE_PRODUCTS: StoreProduct[] = "
start = src.index(marker) + len(marker)
json_text = src[start:].rstrip()
assert json_text.endswith("];"), json_text[-20:]
products = json.loads(json_text[:-1])

dump = json.load(open(VARS, encoding="utf-8"))
by_pid = {p["id"]: p for p in dump}

changed = 0
for product in products:
    pid = LISTING.get(product.get("pressHouseId", ""))
    if not pid:
        continue
    real = by_pid[pid]
    parsed = []
    for v in real["variants"]:
        if not v["enabled"]:
            continue
        color, size = parse_variant(pid, v["title"])
        parsed.append({"id": v["id"], "color": color, "size": size, "cents": v["price"]})
    if not parsed:
        sys.exit(f"NO ENABLED VARIANTS for {product['id']} ({pid})")

    base = min(v["cents"] for v in parsed)
    if product["price"] * 100 != base:
        print(f"NOTE {product['id']}: store price {product['price']} vs printify min {base/100}")

    def values(axis):
        seen = []
        for v in parsed:
            if v[axis] not in seen:
                seen.append(v[axis])
        return seen

    colors = values("color")
    sizes = sorted(set(values("size")), key=size_rank)

    def group(gid, name, labels):
        vals = []
        for index, label in enumerate(labels):
            cents = min(v["cents"] for v in parsed if v[gid] == label)
            value = {"id": f"{gid}-{index}", "label": label, "available": True}
            if cents > base:
                value["priceDelta"] = round((cents - base) / 100, 2)
            vals.append(value)
        return {"id": gid, "name": name, "values": vals}

    options = []
    if len(colors) > 1:
        options.append(group("color", "Color", colors))
    if len(sizes) > 1:
        options.append(group("size", "Size", sizes))
    product["options"] = options
    product["variants"] = [{"id": v["id"], "color": v["color"], "size": v["size"]} for v in parsed]
    changed += 1
    print(f"{product['id']}: {len(parsed)} variants, colors={colors}, sizes={sizes}")

print(f"\n{changed} products rebuilt")
out = src[:start] + json.dumps(products, indent=2, ensure_ascii=False) + "];\n"
open(GEN, "w", encoding="utf-8").write(out)
print("written", GEN)
