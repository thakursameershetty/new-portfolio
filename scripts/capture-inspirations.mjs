// Takes a screenshot of every bookmark on the Inspirations page, for the previews that pop
// up beside its rows: each site opened in Chrome at 1280×800, banners waved away where
// they can be, shrunk to a 640×400 WebP in public/inspirations/, and listed in
// src/components/inspirationPreviews.json (the page shows a preview only for the ones
// listed). Re-run it to refresh them all, or pass URLs to retake just those:
//
//   node scripts/capture-inspirations.mjs
//   node scripts/capture-inspirations.mjs https://dribbble.com https://www.pinterest.com
//
// Slow sites can be given longer to settle (in ms; 2500 by default):
//
//   CAPTURE_WAIT=8000 node scripts/capture-inspirations.mjs https://slowroads.io
//
// Uses the Google Chrome already installed (playwright-core brings no browser of its own).

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";
import sharp from "sharp";

const data = "src/components/inspirations.ts";
const folder = "public/inspirations";
const manifest = "src/components/inspirationPreviews.json";

// The same name inspirations.ts's previewSlug gives a URL.
const slug = (url) =>
  url
    .replace(/^https?:\/\/(www\.)?/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

// Buttons that close cookie and consent banners, by what they say.
const dismiss =
  /^(accept( all)?( cookies)?|allow( all)?( cookies)?|agree|i agree|got it|ok(ay)?|close|dismiss|continue|no thanks|reject( all)?)$/i;

const source = await readFile(data, "utf8");
const all = [...new Set([...source.matchAll(/url: "([^"]+)"/g)].map((m) => m[1]))];
const wanted = process.argv.slice(2);
const urls = wanted.length ? all.filter((url) => wanted.includes(url)) : all;

await mkdir(folder, { recursive: true });
let listed = [];
try {
  listed = JSON.parse(await readFile(manifest, "utf8"));
} catch {}
const captured = new Set(wanted.length ? listed : []);

const settle = Number(process.env.CAPTURE_WAIT ?? 2500);

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  // Some sites turn away a browser that says it's automated.
  args: ["--disable-blink-features=AutomationControlled"],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  colorScheme: "dark",
  locale: "en-US",
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
});

const failed = [];

async function capture(url) {
  const page = await context.newPage();
  try {
    await page
      .goto(url, { waitUntil: "load", timeout: 30_000 })
      .catch(() => page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 }));
    await page.waitForTimeout(settle);
    for (const button of await page.getByRole("button").all()) {
      const text = (await button.textContent().catch(() => ""))?.trim() ?? "";
      if (dismiss.test(text) && (await button.isVisible().catch(() => false))) {
        await button.click({ timeout: 1500 }).catch(() => {});
        await page.waitForTimeout(400);
        break;
      }
    }
    await page.waitForTimeout(1200);
    const shot = await page.screenshot({ type: "png" });
    const file = `${folder}/${slug(url)}.webp`;
    await sharp(shot).resize(640, 400).webp({ quality: 74 }).toFile(file);
    captured.add(slug(url));
    console.log("ok   ", url);
  } catch (error) {
    failed.push(url);
    console.log("FAIL ", url, String(error).split("\n")[0]);
  } finally {
    await page.close();
  }
}

// A few at a time.
const queue = [...urls];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length) await capture(queue.shift());
  }),
);

await browser.close();
await writeFile(manifest, JSON.stringify([...captured].sort(), null, 2) + "\n");
console.log(`\n${captured.size} previews listed; ${failed.length} failed.`);
if (failed.length) console.log(failed.join("\n"));
