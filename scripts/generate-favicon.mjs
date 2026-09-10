// Dev-only helper: rasterizes public/logo.svg into the app favicon
// (public/favicon.ico, 16/32/48 px) and public/icon-192.png / icon-512.png
// for PWA/OG use. Run: bun scripts/generate-favicon.mjs
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const svg = await readFile("public/logo.svg");

const png = async (size) =>
  sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();

await writeFile("public/icon-192.png", await png(192));
await writeFile("public/icon-512.png", await png(512));
await writeFile(
  "public/favicon.ico",
  await pngToIco([await png(16), await png(32), await png(48)]),
);
console.log("favicon.ico + icons regenerated from public/logo.svg");
