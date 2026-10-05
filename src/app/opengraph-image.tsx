import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { tracks } from "@/components/about/taste";

// The link preview (Open Graph, and X's large card): the site in one frame, on its black
// ground, like a desk. The name and the hero's headline on the left, the About page's ID card
// hanging on its red lanyard on the right with a few of its stickers slapped around it, two
// floppies tossed down, and the corner music player, playing. Rendered once at build time.

export const alt =
  "Thakur Sameer Shetty, UI/UX Designer & Developer: making things feel right. A portfolio ID card with stickers, floppy disks and a music player. thakursameershetty.com";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const red = "#e54b45";
const ground = "#0a0a0a";
const cream = "#f5f1ea";
const metal = "linear-gradient(90deg, #a9afb3, #eef0f1 42%, #c2c7ca 70%, #a4aaae)";
const cell = 60;

// The stickers from the ID card's back, and where each lands (the size is its width).
const stickers = [
  { file: "pixels-code.png", left: 648, top: 332, width: 118, rotate: -10 },
  { file: "controller.png", left: 1060, top: 372, width: 118, rotate: 14 },
  { file: "damn.png", left: 948, top: 506, width: 196, rotate: -5 },
];

// The Figma practice tone, for the design tool bits (selection, cursor, pen handles).
const lavender = "#b4a4f5";

// The two tossed floppies: in the site's cream and lavender, which sit on the black and
// beside the red card better than any one project's colours; where and how they landed.
const tossed = [
  { color: "#ebe3d1", left: 640, top: 412, size: 168, rotate: -13 },
  { color: "#9d8ae8", left: 772, top: 448, size: 150, rotate: 9 },
];

// The site's tones, as swatches.
const swatches = [red, cream, "#f0c44c", "#7bd8c4", lavender];

// The corner music player, drawn bigger than on the page so it reads at a glance.
const mini = 104;

// The ID card, at the About page's proportions (sizes there are in percent of its width).
const card = 400;
const cq = card / 100;

function starburst(spikes: number, radius: number, depth: number) {
  const points: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? radius : radius - depth;
    const angle = (Math.PI * i) / spikes - Math.PI / 2;
    points.push(
      `${(50 + r * Math.cos(angle)).toFixed(2)},${(50 + r * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return points.join(" ");
}

// The Work section's floppy, redrawn in the card's flat terms: shell, metal shutter, write
// protect hole and a blank paper label, ruled, under a band of the disk's colour.
function Disk({ color, disk }: { color: string; disk: number }) {
  const u = disk / 100;
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: disk,
        height: disk,
      }}
    >
      {/* The shell with its chamfered corner, drawn (a clip-path doesn't survive rotating). */}
      <svg
        viewBox="0 0 100 100"
        width={disk}
        height={disk}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="sheen" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
            <stop offset="0.38" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="shade" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity="0.16" />
            <stop offset="0.3" stopColor="#000" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M4.5 0H91L100 9V95.5Q100 100 95.5 100H4.5Q0 100 0 95.5V4.5Q0 0 4.5 0Z" fill={color} />
        <path d="M4.5 0H91L100 9V95.5Q100 100 95.5 100H4.5Q0 100 0 95.5V4.5Q0 0 4.5 0Z" fill="url(#sheen)" />
        <path d="M4.5 0H91L100 9V95.5Q100 100 95.5 100H4.5Q0 100 0 95.5V4.5Q0 0 4.5 0Z" fill="url(#shade)" />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 22 * u,
          width: 52 * u,
          height: 34 * u,
          display: "flex",
          borderRadius: `0 0 ${2 * u}px ${2 * u}px`,
          backgroundImage: metal,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 5 * u,
            left: 6 * u,
            width: 10 * u,
            height: 22 * u,
            borderRadius: u,
            backgroundColor: "rgba(0,0,0,0.22)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 42 * u,
          left: 9 * u,
          right: 9 * u,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          borderRadius: `${2 * u}px ${2 * u}px 0 0`,
          overflow: "hidden",
          backgroundColor: "#f4f0e6",
          backgroundImage: `repeating-linear-gradient(180deg, transparent 0 ${8 * u - 1}px, rgba(40,60,120,0.14) ${8 * u - 1}px ${8 * u}px)`,
        }}
      >
        <div style={{ display: "flex", height: 7 * u, backgroundColor: color }} />
      </div>
      <div
        style={{
          position: "absolute",
          right: 5 * u,
          bottom: 4 * u,
          width: 7 * u,
          height: 7 * u,
          borderRadius: u,
          backgroundColor: "rgba(0,0,0,0.55)",
        }}
      />
    </div>
  );
}

// The corner music player (MiniPlayer): a frosted MiniDisc with screws in its corners, the
// record inside labelled with the song's art, and the metal shutter whose foot fills in red
// as the preview runs.
function MiniDisc({ artwork }: { artwork: string | null }) {
  const u = mini / 72;
  const screw = (spot: { top?: number; bottom?: number; left?: number; right?: number }) => (
    <div
      style={{
        position: "absolute",
        ...spot,
        width: 6 * u,
        height: 6 * u,
        borderRadius: "50%",
        backgroundImage:
          "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.9), rgba(150,140,175,0.9) 70%)",
      }}
    />
  );
  const record = mini - 14 * u;
  const label = record * 0.38;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          width: mini,
          height: mini,
          borderRadius: 19 * u,
          border: "1px solid rgba(255,255,255,0.55)",
          backgroundColor: "rgb(196,189,214)",
          backgroundImage:
            "linear-gradient(160deg, rgba(255,255,255,0.5), rgba(255,255,255,0.08) 55%)",
          boxShadow: "0 14px 24px rgba(0,0,0,0.55)",
        }}
      >
        {screw({ top: 5 * u, left: 5 * u })}
        {screw({ top: 5 * u, right: 5 * u })}
        {screw({ bottom: 5 * u, left: 5 * u })}
        {screw({ bottom: 5 * u, right: 5 * u })}
        <div
          style={{
            position: "absolute",
            top: 7 * u - 1,
            left: 7 * u - 1,
            width: record,
            height: record,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            backgroundColor: "#111",
            backgroundImage:
              "radial-gradient(circle, #111 0 30%, #1f1f1f 31%, #121212 38%, #1f1f1f 46%, #121212 54%, #1f1f1f 62%, #121212 70%, #1c1c1c 100%)",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: label,
              height: label,
              borderRadius: "50%",
              overflow: "hidden",
              backgroundColor: red,
              border: "1.5px solid #0c0c0c",
            }}
          >
            {artwork && (
              <img
                src={artwork}
                width={label}
                height={label}
                alt=""
                style={{ position: "absolute", top: 0, left: 0 }}
              />
            )}
            <div
              style={{
                display: "flex",
                width: label * 0.16,
                height: label * 0.16,
                borderRadius: "50%",
                backgroundColor: "#0c0c0c",
              }}
            />
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: mini * 0.34,
            right: 3 * u,
            width: mini * 0.42,
            height: mini * 0.32,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 4 * u,
            backgroundImage: metal,
            boxShadow: "-2px 1px 4px rgba(0,0,0,0.3)",
          }}
        >
          <svg viewBox="0 0 24 12" width={mini * 0.42 * 0.6} height={mini * 0.42 * 0.3}>
            <path
              d="M12 6c-2-3-4.2-4.2-6.3-4.2A4.2 4.2 0 0 0 1.5 6a4.2 4.2 0 0 0 4.2 4.2C7.8 10.2 10 9 12 6Zm0 0c2 3 4.2 4.2 6.3 4.2A4.2 4.2 0 0 0 22.5 6a4.2 4.2 0 0 0-4.2-4.2C16.2 1.8 14 3 12 6Z"
              fill="none"
              stroke="rgba(70,76,80,0.55)"
              strokeWidth={1.4}
            />
          </svg>
          <div
            style={{
              display: "flex",
              width: "70%",
              height: 2 * u,
              marginTop: 3 * u,
              borderRadius: 1,
              backgroundColor: "rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ display: "flex", width: "45%", height: "100%", backgroundColor: red }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// A little editor window: what Thakur does, as code, with the syntax picked out in the site's
// tones (lavender keywords, yellow strings).
function CodeWindow() {
  const muted = "rgba(245,241,234,0.45)";
  const line = (children: React.ReactNode) => (
    <div style={{ display: "flex", whiteSpace: "pre" }}>{children}</div>
  );
  const string = (text: string) => <span style={{ color: "#f0c44c" }}>{text}</span>;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 300,
        borderRadius: 12,
        border: "1px solid rgba(245,241,234,0.1)",
        backgroundColor: "#151514",
        boxShadow: "0 18px 36px rgba(0,0,0,0.55)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "9px 12px",
          borderBottom: "1px solid rgba(245,241,234,0.07)",
        }}
      >
        {[red, "#f0c44c", "#7bd8c4"].map((color) => (
          <div
            key={color}
            style={{ display: "flex", width: 9, height: 9, marginRight: 6, borderRadius: "50%", backgroundColor: color }}
          />
        ))}
        <div style={{ display: "flex", marginLeft: 8, fontSize: 11, letterSpacing: "0.1em", color: muted }}>
          THAKUR.TS
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "12px 16px 14px",
          fontFamily: "Courier Prime",
          fontSize: 14,
          lineHeight: 1.4,
          color: cream,
        }}
      >
        {line(
          <>
            <span style={{ color: "#b4a4f5" }}>const </span>thakur = {"{"}
          </>,
        )}
        {line(<>  designs: {string('"in figma"')},</>)}
        {line(<>  builds: {string('"in code"')},</>)}
        {line(<>  sweats: {string('"the details"')},</>)}
        {line(<span style={{ color: muted }}>{"};"}</span>)}
      </div>
    </div>
  );
}

// A design tool's selection, drawn round a line of the headline: the frame, its four handles,
// and a named cursor on it, as if someone's mid-edit.
function Selection({ left, top, width, height }: { left: number; top: number; width: number; height: number }) {
  const handle = (x: number, y: number) => (
    <div
      style={{
        position: "absolute",
        left: x - 4,
        top: y - 4,
        width: 8,
        height: 8,
        border: `1.5px solid ${lavender}`,
        backgroundColor: ground,
      }}
    />
  );
  return (
    <div style={{ position: "absolute", left, top, width, height, display: "flex" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          border: `1.5px solid ${lavender}`,
        }}
      />
      {handle(0, 0)}
      {handle(width, 0)}
      {handle(0, height)}
      {handle(width, height)}
      <div
        style={{
          position: "absolute",
          left: width + 10,
          top: height / 2 - 6,
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <svg width="20" height="22" viewBox="0 0 20 22">
          <path
            d="M2 2L17 10.5L10.2 12.2L6.8 19Z"
            fill={lavender}
            stroke={ground}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            padding: "3px 8px",
            borderRadius: "2px 8px 8px 8px",
            backgroundColor: lavender,
            color: "#1a1530",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          THAKUR
        </div>
      </div>
    </div>
  );
}

// The pen tool's curve: a path with its anchors and the handles pulled out of them.
function PenPath() {
  const stroke = "rgba(245,241,234,0.55)";
  const anchor = (x: number, y: number) => (
    <rect x={x - 4} y={y - 4} width="8" height="8" fill={ground} stroke={cream} strokeWidth="1.5" />
  );
  const knob = (x: number, y: number) => <circle cx={x} cy={y} r="3.5" fill={lavender} />;
  return (
    <svg width="240" height="77" viewBox="0 0 300 96">
      <path d="M10 70 C70 70 90 16 150 22 S250 80 290 30" fill="none" stroke={stroke} strokeWidth="2" />
      <line x1="150" y1="22" x2="104" y2="17" stroke={lavender} strokeWidth="1" />
      <line x1="150" y1="22" x2="196" y2="27" stroke={lavender} strokeWidth="1" />
      <line x1="10" y1="70" x2="58" y2="70" stroke={lavender} strokeWidth="1" />
      {knob(104, 17)}
      {knob(196, 27)}
      {knob(58, 70)}
      {anchor(10, 70)}
      {anchor(150, 22)}
      {anchor(290, 30)}
    </svg>
  );
}

// The ID card's front, as on the About page: the title, the typed details with the name
// written in, and the photo in black and white on a starburst.
function IdCard({ photo }: { photo: string }) {
  const typed = { fontFamily: "Courier Prime", fontSize: 3.1 * cq, lineHeight: 1.1 };
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: card,
        height: card / 1.586,
        borderRadius: 22,
        backgroundColor: red,
        backgroundImage:
          "linear-gradient(160deg, rgba(255,255,255,0.16), transparent 42%), linear-gradient(0deg, rgba(0,0,0,0.14), transparent 40%)",
        color: "#fff8f3",
        boxShadow: "0 24px 50px rgba(0,0,0,0.6)",
        overflow: "hidden",
      }}
    >
      {/* The punched slot, showing the black behind the card. */}
      <div
        style={{
          position: "absolute",
          top: 3.4 * cq,
          left: (card - 15 * cq) / 2,
          width: 15 * cq,
          height: 3.6 * cq,
          borderRadius: 2 * cq,
          backgroundColor: ground,
        }}
      />
      <div
        style={{
          display: "flex",
          margin: `${8.4 * cq}px ${5.4 * cq}px 0`,
          fontSize: 7.3 * cq,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "-0.03em",
        }}
      >
        PORTFOLIO ID CARD
      </div>
      <div style={{ display: "flex", margin: `${2.6 * cq}px ${5.4 * cq}px 0` }}>
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <div style={{ display: "flex", ...typed }}>hello my name is...</div>
          <div
            style={{
              display: "flex",
              margin: `${-0.6 * cq}px 0 ${0.8 * cq}px`,
              fontFamily: "Kaushan Script",
              fontSize: 8.6 * cq,
              lineHeight: 1,
              transform: "rotate(-4deg)",
              transformOrigin: "left center",
            }}
          >
            Thakur
          </div>
          <div style={{ display: "flex", ...typed }}>dob: 10.08.2005</div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 1.9 * cq,
              ...typed,
              lineHeight: 1.02,
            }}
          >
            <span>position:</span>
            <span>ui/ux designer</span>
            <span>and full stack</span>
            <span>developer</span>
          </div>
          <div style={{ display: "flex", marginTop: 1.9 * cq, ...typed }}>
            expire date: never
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            width: 29 * cq,
            marginLeft: 3 * cq,
          }}
        >
          <div style={{ position: "relative", display: "flex", width: 29 * cq, height: 29 * cq }}>
            <svg
              viewBox="0 0 100 100"
              width={26 * cq}
              height={26 * cq}
              style={{ position: "absolute", bottom: -9 * cq, left: -13 * cq }}
            >
              <polygon points={starburst(12, 50, 22)} fill="#ff8a80" />
            </svg>
            <img
              src={photo}
              width={29 * cq}
              height={29 * cq}
              alt=""
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                boxShadow: `0 0 0 ${0.5 * cq}px rgba(0,0,0,0.35)`,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 1.4 * cq,
              fontFamily: "Courier Prime",
              fontSize: 2.8 * cq,
            }}
          >
            FRONTAL VIEW
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Image() {
  const [bold, regular, script, typewriter, photoPng] = await Promise.all([
    readFile(join(process.cwd(), "public/disket-mono-free-font/disket-mono-bold.ttf")),
    readFile(join(process.cwd(), "public/disket-mono-free-font/disket-mono-regular.ttf")),
    readFile(join(process.cwd(), "src/assets/og/kaushan-script.ttf")),
    readFile(join(process.cwd(), "src/assets/og/courier-prime.ttf")),
    // The card's photo in black and white, like the About page's grayscale filter (the
    // renderer takes neither WebP nor CSS filters).
    sharp(join(process.cwd(), "public/about/id/photo.webp"))
      .resize(240, 240)
      .grayscale()
      .linear(1.12, -(128 * 0.12) + 3)
      .png()
      .toBuffer(),
  ]);
  const photo = `data:image/png;base64,${photoPng.toString("base64")}`;
  const png = (data: Buffer) => `data:image/png;base64,${data.toString("base64")}`;
  const stickerImages = await Promise.all(
    stickers.map(async ({ file }) =>
      png(await readFile(join(process.cwd(), "public/about/id/stickers", file))),
    ),
  );

  // The player's song: the first of the About page's list. Its art lives on Apple's servers,
  // so if it can't be fetched at build time the label is left plain red.
  const track = tracks[0];
  const artwork = await fetch(track.artwork, { signal: AbortSignal.timeout(8000) })
    .then(async (response) => {
      if (!response.ok) return null;
      const art = await sharp(Buffer.from(await response.arrayBuffer()))
        .resize(96, 96)
        .png()
        .toBuffer();
      return png(art);
    })
    .catch(() => null);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: ground,
          backgroundImage:
            "linear-gradient(90deg, rgba(245,241,234,0.045) 1px, transparent 1px), linear-gradient(0deg, rgba(245,241,234,0.045) 1px, transparent 1px)",
          backgroundSize: `${cell}px ${cell}px`,
          backgroundPosition: `${(size.width / 2) % cell}px ${(size.height / 2) % cell}px`,
          color: cream,
          fontFamily: "Disket Mono",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 64,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", fontSize: 18, letterSpacing: "0.28em", opacity: 0.6 }}>
            THAKURSAMEERSHETTY.COM
          </div>
          <div style={{ display: "flex", marginTop: 44, fontSize: 26, fontWeight: 700 }}>
            I&apos;M THAKUR SAMEER SHETTY
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 16,
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 0.95,
              letterSpacing: "-0.05em",
            }}
          >
            <span>MAKING THINGS</span>
            <span style={{ color: red }}>FEEL RIGHT</span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 17,
              letterSpacing: "0.2em",
              opacity: 0.6,
            }}
          >
            UI/UX DESIGNER & DEVELOPER
          </div>
        </div>

        {/* The ID card on its lanyard: the red strap runs up out of the frame to the clip. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 64,
            width: card,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: "rotate(-2deg)",
            transformOrigin: "50% 0",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 30,
              height: 70,
              backgroundColor: "#bc3e39",
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 1px, transparent 1px 3px), linear-gradient(90deg, rgba(0,0,0,0.3), transparent 30%, transparent 70%, rgba(0,0,0,0.3))",
            }}
          />
          <div
            style={{
              display: "flex",
              width: 38,
              height: 28,
              marginTop: -2,
              borderRadius: "6px 6px 10px 10px",
              backgroundImage: metal,
              boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
            }}
          />
          <div style={{ display: "flex", width: 8, height: 22, backgroundImage: metal }} />
          <div style={{ display: "flex", marginTop: -14 }}>
            <IdCard photo={photo} />
          </div>
        </div>

        {tossed.map(({ color, left, top, size: disk, rotate }) => (
          <div
            key={color}
            style={{
              position: "absolute",
              left,
              top,
              display: "flex",
              transform: `rotate(${rotate}deg)`,
              
            }}
          >
            <Disk color={color} disk={disk} />
          </div>
        ))}

        <Selection left={56} top={234} width={484} height={72} />

        <div style={{ position: "absolute", left: 380, top: 372, display: "flex" }}>
          <PenPath />
        </div>

        <div style={{ position: "absolute", left: 500, top: 64, display: "flex" }}>
          {swatches.map((color) => (
            <div
              key={color}
              style={{
                display: "flex",
                width: 18,
                height: 18,
                marginRight: -4,
                borderRadius: "50%",
                border: `2px solid ${ground}`,
                backgroundColor: color,
              }}
            />
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            left: 70,
            top: 480,
            display: "flex",
            transform: "rotate(-8deg)",
          }}
        >
          <MiniDisc artwork={artwork} />
        </div>

        <div
          style={{
            position: "absolute",
            left: 206,
            top: 452,
            display: "flex",
            transform: "rotate(3deg)",
          }}
        >
          <CodeWindow />
        </div>

        {stickerImages.map((src, index) => {
          const { left, top, width, rotate } = stickers[index];
          return (
            <img
              key={stickers[index].file}
              src={src}
              width={width}
              alt=""
              style={{ position: "absolute", left, top, transform: `rotate(${rotate}deg)` }}
            />
          );
        })}
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Disket Mono", data: bold, weight: 700, style: "normal" },
        { name: "Disket Mono", data: regular, weight: 400, style: "normal" },
        { name: "Kaushan Script", data: script, weight: 400, style: "normal" },
        { name: "Courier Prime", data: typewriter, weight: 400, style: "normal" },
      ],
    },
  );
}
