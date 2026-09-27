import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The link preview (Open Graph, and X's large card): the hero's red cell grid, the name in
// Disket Mono, the role, and the floppy disk from the favicon. Rendered once at build time.

export const alt =
  "Thakur Sameer Shetty, Product Designer: designs and prototypes in code. thakursameershetty.com";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const red = "#e54b45";
const cream = "#f5f1ea";
// Square cells, laid out from the center like the hero's grid.
const cell = 60;

export default async function Image() {
  const [bold, regular, disk] = await Promise.all([
    readFile(join(process.cwd(), "public/disket-mono-free-font/disket-mono-bold.ttf")),
    readFile(join(process.cwd(), "public/disket-mono-free-font/disket-mono-regular.ttf")),
    readFile(join(process.cwd(), "src/assets/floppy-disk.png")),
  ]);
  const diskSrc = `data:image/png;base64,${disk.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: red,
          backgroundImage:
            "linear-gradient(90deg, rgba(150,32,30,0.22) 1px, transparent 1px), linear-gradient(0deg, rgba(150,32,30,0.22) 1px, transparent 1px)",
          backgroundSize: `${cell}px ${cell}px`,
          backgroundPosition: `${(size.width / 2) % cell}px ${(size.height / 2) % cell}px`,
          color: cream,
          fontFamily: "Disket Mono",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: "0.3em", opacity: 0.85 }}>
          THAKURSAMEERSHETTY.COM
        </div>

        {/* The favicon's disk, dropped on the grid (its shadow is part of the image). */}
        <img
          src={diskSrc}
          width={300}
          height={300}
          alt=""
          style={{ position: "absolute", top: 12, right: 40, transform: "rotate(8deg)" }}
        />

        <div style={{ display: "flex" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 104,
                fontWeight: 700,
                lineHeight: 0.95,
                letterSpacing: "-0.05em",
              }}
            >
              <span>THAKUR SAMEER</span>
              <span>SHETTY</span>
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 36,
                fontSize: 22,
                letterSpacing: "0.22em",
                opacity: 0.9,
              }}
            >
              PRODUCT DESIGNER · DESIGNS AND PROTOTYPES IN CODE
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Disket Mono", data: bold, weight: 700, style: "normal" },
        { name: "Disket Mono", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
