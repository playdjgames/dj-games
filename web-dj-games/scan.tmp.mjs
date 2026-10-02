import { chromium } from "playwright";
const base = process.argv[2];
const routes = ["/","/games","/coming-soon","/about","/news","/support","/store","/shop","/donate","/privacy","/terms","/press-house","/contact","/cart","/marketing","/games/thinksort","/nope-404"];
const b = await chromium.launch();
const seenLinks = new Set();
for (const r of routes) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on("console", m => { if (m.type()==="error") errs.push(m.text().slice(0,140)); });
  p.on("pageerror", e => errs.push("PAGEERR "+e.message.slice(0,140)));
  p.on("response", res => { if (res.status()>=400 && !res.url().includes("favicon")) errs.push(res.status()+" "+res.url().slice(0,120)); });
  try {
    await p.goto(base+r, { waitUntil: "networkidle", timeout: 25000 });
    const info = await p.evaluate(() => ({
      title: document.title, h1: document.querySelector("h1")?.innerText.slice(0,50),
      brokenImgs: [...document.images].filter(i=>i.complete && i.naturalWidth===0).map(i=>i.src.slice(0,100)),
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      links: [...document.querySelectorAll("a[href]")].map(a=>a.href),
    }));
    info.links.forEach(l=>seenLinks.add(l));
    console.log(r, "|", p.url().replace(base,""), "|", info.title, "|", info.h1, "| imgs:", JSON.stringify(info.brokenImgs), "| ovf:", info.overflow, "| errs:", JSON.stringify([...new Set(errs)].slice(0,5)));
  } catch(e) { console.log(r, "FAILED", e.message.slice(0,100)); }
  await p.close();
}
await b.close();
const fs = await import("fs"); fs.writeFileSync("links.tmp.txt", [...seenLinks].join("\n"));
