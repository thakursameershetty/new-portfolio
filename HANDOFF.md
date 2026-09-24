# Thakur's portfolio — project handoff

Context for an agent or chat session continuing this project. It covers what exists, where it
lives, how the pieces connect, the decisions already made (and rejected), and what's open.

- **Owner:** Thakur Sameer Shetty Tammana — UI/UX designer at Spotmies LLP who grew into full
  stack. Based in Visakhapatnam, India. Email `thakursst5002810@gmail.com`, LinkedIn
  `linkedin.com/in/thakur-sameer-shetty-tammana/`. Phone number is deliberately kept off the site.
- **Repo:** `https://github.com/thakursameershetty/new-portfolio` (branch `main`, all work
  committed and pushed as of commit `cf18353`).
- **Inspiration:** `https://www.dsnikhil.com/` (red grid hero, "I'M NAME" type, Disket Mono).
  The owner explicitly does **not** want to copy it; ideas are borrowed, never layouts.

## Stack and conventions

- **Next.js 16.3.6** (App Router, Turbopack), React 19, TypeScript. Read `AGENTS.md`: this Next
  version differs from older training data; check `node_modules/next/dist/docs/` before using
  Next APIs.
- **Styling:** CSS Modules only (no Tailwind). Global tokens in `src/app/globals.css`:
  `--ground: #0a0a0a` (page black), `--ink: #f5f1ea` (cream), `--ink-muted`.
- **Animation:** `framer-motion` (not the `motion` package; pasted snippets that import from
  `motion/react` are adapted to `framer-motion`). WebGL for the grid. Web Audio for all sound.
- **Utilities:** `clsx`. `next-themes` is installed but the site is forced to its own palette.
- **Checks:** `npx tsc --noEmit -p .` passes. `npx eslint src` reports 2 known errors in
  `WebsiteShaderCanvas.tsx` (`react-hooks/set-state-in-effect` for `setFailed` and `setMounted`),
  inherited from the original component code; everything else is clean.
- **Run:** `npm run dev` (port 3000). A stray `~/package.json` exists in the home folder, so
  `next.config.ts` pins `turbopack.root`.
- **Code style:** comments explain *why*, in the voice already used in the files. Match
  surrounding naming and density.

## Page structure (`src/app/page.tsx`)

`SiteIntro` wraps everything, then in order: `Hero` (`#top`) → `Currently` (`#about`) →
`Work` (`#work`) → `Contact` (`#contact`). The nav lists them in that same order.

## Fonts (`src/app/layout.tsx`, all via `next/font/local`)

| Variable | Font | Used for |
|---|---|---|
| `--font-hero` | Disket Mono (regular + bold, `public/disket-mono-free-font/`) | Hero "HI", "I'M THAKUR", headline, section labels and headings, floppy labels |
| `--font-display` | Google Sans (variable 400–700, `src/fonts/`) | Nav, role line, small uppercase labels |
| `--font-sans` | Google Sans Flex (variable 1–1000, `src/fonts/`) | Body text |

Google Sans files are self-hosted (Latin subset, SIL OFL) because Turbopack ignored
`adjustFontFallback: false` and kept warning when they came from `next/font/google`.

## Key systems

### Kinetic grid shader — `src/components/WebsiteShaderCanvas.tsx`
WebGL fragment shader ("kinetic-dots" preset) drawing a red grid (light tone base ≈ `#E54B45`,
grain, darker idle cells). Features, each a prop or uniform:
- **Square cells everywhere:** `getKineticGrid(width, height)` fits ~216 square cells, counted
  from the center (four cells meet in the middle). Used by the shader, sounds and hover logic.
- **Hover trail + pressed-in bevel**, **click shockwaves** (`shockSpeed`, `shockLifetime`).
- **Reveal:** `revealDuration`, `revealPaused`, `revealFrom` (`"center"` ripple or `"top"`
  pour), `revealControl` (drive progress externally, e.g. from scroll).
- **`introPose`:** grid waits rotated 45° and zoomed 2× (drawn in-shader, so it stays sharp),
  unwinds on Enter.
- **`topEdgeRows`:** dissolving top edge; on such grids unlit cells are exactly the page black
  with grain fading in from the top (no seam).
- `trackWindowPointer`: listens on window, ignores pointer outside the canvas.
- `WebsiteShaderBackground` wraps it for full-bleed use.

### Intro, sound state and shared context — `src/components/SiteIntro.tsx`
- First visit: Enter screen (Enter / Enter without sound) over the dark rotated grid.
- **Return visits** (`localStorage` `intro-seen`): no Enter screen, no intro; the hero loads
  finished (`instant` mode). A pre-paint script in `layout.tsx` sets `html[data-intro-seen]`
  so nothing flashes. Sound preference (`sound`) is restored on the first click/keypress.
- Scroll is locked for ~4.2s during the first-visit intro.
- Publishes `--grid-cell` (px) on `:root` for sizing type in cells.
- `useIntro()` context: `entered`, `instant`, `soundOn`, `getSounds`, `playRipple`,
  `playFlap`, `playCue`. `useGridPointerSounds(ref, enabled, getSounds, isReady?)` gives any
  grid hover ticks and press clacks.
- Renders `SiteNav` and `ClickSpark`.

### Sound — `src/components/revealSound.ts`
All synthesized (no audio files), through one limiter bus. Character: **dry, mechanical,
tactile** (relay clicks, thump, keycaps, split-flap). Pieces:
- `playRevealSound(context, duration, from)`: Enter press clack, thump, ring clicks timed to the
  reveal, noise swell.
- `createPointerSounds` → `tick` (hover per cell; speed-aware, stereo-panned, fatigue softening,
  `hoverVolume = 1.5`), `press` (shockwave clack + outward clicks), `flap` (split-flap), and
  `cue(...)`: `swap`, `land`, `arrive`, `tap` (nav hover), `shutter` (floppy hover), `insert`
  (floppy open: a soft rising Mac-OS-style "zwip" made of two `playChirp` tones).

### Hero — `src/components/Hero.tsx`
First-visit timeline: "HI" appears in the four center cells → swaps to big "I'M / THAKUR" →
words fly (FLIP) into the small name → headline "MAKING THINGS / FEEL RIGHT" flips in
(`SplitFlapText`) → role line + studio scene rise in. Details:
- Text all in Disket Mono; the name stays Disket (owner rejected switching it).
- Studio image `public/avatar-story.png` (Lego-style figure at a plant-filled desk). Full width
  on desktop, capped at `175vh` wide; side fade only on very wide screens (`min-aspect-ratio:
  7/4`); portrait screens size it by height (`80svh`).
- Scroll parallax via `--hero-scroll`: grid slowest, copy trails and fades, scene moves with
  the page.
- Bottom fade into black: curved (elliptical, `ellipse 120% 100%`), eased stops, `24vh`.
- `data-nav-surface="red"` marker covers the red part (for the nav's colour logic).

### Nav — `src/components/SiteNav.tsx`
Rectangular bar, drops in after the intro. Black tint + `backdrop-filter: blur(20px)` (write only
the unprefixed property; Next's CSS compiler otherwise dropped it). Features:
- Animated icons per tab (`src/components/icons/`): House, ProfileCard (drawn for this site),
  LayoutDashboard, AtSymbol; `VolumeIcon` for the sound toggle (waves ↔ cross).
- One active tile that glides on a **spring** (framer-motion) between tabs; the newly active
  tab's icon animates too.
- `useOverRed`: bar colours follow what's actually under it (`[data-nav-surface="red"]`
  markers) — dark tile over red, cream tile over black.
- ≤420px: icons only (labels kept for screen readers).

### Sections
- **`Currently.tsx` (About):** statement with the Spotmies "S" mark inline
  (`public/spotmies-mark.png`, cropped from `spotmies_banner.webp`) + a micro-interactions
  paragraph.
- **`Work.tsx` + `projects.ts`:** projects as 3.5" floppy disks (CSS-built, `cqw` sizing).
  Hover lifts + shutter slides (with sound); pressing plays the insert sound on
  `pointerdown`; click **morphs** the disk into a retro `<dialog>` window (block grows from the
  disk's rect, disk colour → cream) and back on close (✕, Esc, backdrop). Project copy comes
  only from the résumé (no invented years/stacks); only Rao Bahadur has a link.
- **`Contact.tsx`:** its own red grid; the red **grows down with scroll** (`revealControl`,
  row ticks), dissolving top edge. Split-flap "LET'S MAKE SOMETHING / FEEL RIGHT", status line
  (green pulse, live India time with animated map pin), keycap buttons (cream email key copies
  address → "COPIED ✓", ↗ opens mail; dark LinkedIn key), footer. Keys stack full-width on
  phones.

### Other
- `ClickSpark.tsx`: site-wide cream spark burst on press (adapted from React Bits, MIT +
  Commons Clause; credited in file).
- `SplitFlapText.tsx`: fixed-width tiles per final character, flip sounds, `instant` prop.
- `useInView.ts`: shared once-only in-view hook.

## Owner preferences (learned)

- Tactile, mechanical, physical feel; sounds must stay dry/mechanical — the Mac-style "zwip"
  on floppy open is the one tonal exception the owner chose.
- Honest, modest copy (rejected "I design it. I build it." as bragging).
- Don't copy the reference; don't add unasked features; keep changes scoped.
- Iterates from screenshots; prefers seeing a result then tuning numbers.
- Rejected before (don't reintroduce): pixel-mosaic portrait, glass nav variants with white
  frosting, red side-tint fade on the scene, Google Sans for the name, click sound on floppy
  open, split-flap flutter for floppy open, center ripple for Contact, timed pour for Contact.

## Open items / next steps

1. **Work layout for recruiters:** proposed featuring the top 3 projects as full rows (outcome,
   highlights, stack, link visible without clicking) + a compact shelf for the rest. Awaiting
   the owner's choice of three (suggested Rao Bahadur, Mutiny Talent, SamudraGupt-Q) and
   screenshots.
2. Project screenshots/links: only `raobahadur.in` is confirmed.
3. Optional résumé download key in Contact (needs `public/resume.pdf`).
4. `public/spotmies_banner.webp` is currently unused (kept as an asset).
5. Launch prep: mobile pass, performance check on low-end devices, social preview image,
   deployment (Vercel is the natural fit).

## Known quirks

- Bluetooth audio adds ~150–250ms latency that the site can't remove.
- The "N" badge in the corner is Next.js dev tools (dev only).
- After changing `next.config.ts`, restart `npm run dev`.
