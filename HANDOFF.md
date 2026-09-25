# Thakur's portfolio — project handoff

Context for an agent or chat session continuing this project. It covers what exists, where it
lives, how the pieces connect, the decisions already made (and rejected), and what's open.

- **Owner:** Thakur Sameer Shetty Tammana — UI/UX designer at Spotmies LLP who grew into full
  stack. Based in Visakhapatnam, India. Email `thakursst5002810@gmail.com`, LinkedIn
  `linkedin.com/in/thakur-sameer-shetty-tammana/`. Phone number is deliberately kept off the site.
- **Repo:** `https://github.com/thakursameershetty/new-portfolio` (branch `main`, all work
  committed as of commit `02d4a5d`).
- **Inspiration:** `https://www.dsnikhil.com/` (red grid hero, "I'M NAME" type, Disket Mono).
  The owner explicitly does **not** want to copy it; ideas are borrowed, never layouts. The
  owner does point at it for specific behaviours (the session-only splash, the contact keys'
  layout on phones, the footer credits), which were then built in this site's own way.

## Stack and conventions

- **Next.js 16.3.6** (App Router, Turbopack), React 19, TypeScript. Read `AGENTS.md`: this Next
  version differs from older training data; check `node_modules/next/dist/docs/` before using
  Next APIs.
- **Styling:** CSS Modules only (no Tailwind). Global tokens in `src/app/globals.css`:
  `--ground: #0a0a0a` (page black), `--ink: #f5f1ea` (cream), `--ink-muted`.
- **Animation:** `framer-motion` (not the `motion` package; pasted snippets that import from
  `motion/react` are adapted to `framer-motion`) plus the Web Animations API (`element.animate`)
  for FLIP flights and morphs. WebGL for the grid. **three.js** (`three@0.186`, plain three, no
  react-three-fiber) for the 3D disk boxes, loaded with a dynamic `import()` only when the
  Work section gets near. Web Audio for all sound (synthesized, no audio files).
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
| `--font-hero` | Disket Mono (regular + bold, `public/disket-mono-free-font/`) | Hero "HI", "I'M THAKUR", headline, section labels and headings, floppy labels (HTML and 3D textures) |
| `--font-display` | Google Sans (variable 400–700, `src/fonts/`) | Nav, role line, small uppercase labels |
| `--font-sans` | Google Sans Flex (variable 1–1000, `src/fonts/`) | Body text |

Google Sans files are self-hosted (Latin subset, SIL OFL) because Turbopack ignored
`adjustFontFallback: false` and kept warning when they came from `next/font/google`. The 3D
disk textures read these same families from the CSS variables (`diskBox3d.ts` → `loadFonts`).

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
- Enter screen (Enter / Enter without sound) over the dark rotated grid.
- **Shown once per visit, like dsnikhil.com:** `intro-seen` lives in **sessionStorage** (it was
  localStorage, which made the splash appear only once ever). Reloads in the same tab skip the
  Enter screen and the hero loads finished (`instant` mode); a new tab / new visit shows it
  again. The pre-paint script in `layout.tsx` reads sessionStorage and sets
  `html[data-intro-seen]` so nothing flashes. The sound preference (`sound`) stays in
  localStorage and is restored on the first click/keypress of a reload.
- Scroll is locked for ~4.2s during the intro.
- Publishes `--grid-cell` (px) on `:root` for sizing type in cells.
- `useIntro()` context: `entered`, `instant`, `soundOn`, `getSounds`, `playRipple`,
  `playFlap`, `playCue`, `setHum` (CRT monitor hum on/off). `useGridPointerSounds(ref,
  enabled, getSounds, isReady?)` gives any grid hover ticks and press clacks.
- **Haptics** are fired here, from `playCue` (per-cue table `cueHaptics`, each hit a separate
  `[delay, ms]` buzz so a later one can't cancel an earlier one) and from the ripple
  (`buzzRipple`). They follow the sound toggle: sound off → no haptics.
- **Phone tilt permission** (`requestTilt` from `deviceTilt.ts`) is asked from the Enter tap,
  or from the first click on a reload (iOS only allows the prompt from a gesture).
- Renders `SiteNav` and `ClickSpark`.

### Sound — `src/components/revealSound.ts`
All synthesized, through one limiter bus. Character: **dry, mechanical, tactile** (relay clicks,
thump, keycaps, split-flap, plastic). Pieces:
- `playRevealSound(context, duration, from)`: Enter press clack, thump, ring clicks timed to the
  reveal, noise swell.
- `createPointerSounds` → `tick` (hover per cell; speed-aware, stereo-panned, fatigue softening,
  `hoverVolume = 1.5`), `press` (shockwave clack + outward clicks), `flap` (split-flap),
  `hum(on)` (CRT monitor hum), and `cue(...)`:
  - Intro/nav: `swap`, `land`, `arrive`, `tap` (nav hover, footer row ticks).
  - Floppy: `shutter` (hover), `insert` (window open: a soft rising Mac-OS-style "zwip", the one
    tonal sound the owner chose).
  - Disk box: `boxOpen` (catch release → hinge creak rising → hollow plastic thock + ring at
    0.4s), `boxClose` (**the open sound reversed**, then a real catch snap at 0.6s), `diskOut`
    (edge scrape + tick, random pitch per disk), `diskIn` (scrape reversed + seating clack),
    `rattle` (box hover), `diskRattle` (faint ticks while disks sway), `diskTap` (a disk
    knocking a neighbour/wall).
  - CRT monitor: `crtOn` (soft pop + tube tick), `channel` (switching projects).
- The box and disk sounds are rendered **once, offline** (`record()` with an
  `OfflineAudioContext`) into a forward buffer and a reversed copy — that's how "close = open
  played backwards" works.
- **CRT hum** (`startHum`): flyback whine at 15,625 Hz (PAL) + 50 Hz mains buzz (overtones via
  a low-passed sawtooth) + sparse random static crackle ticks. Very quiet on purpose:
  `humVolume = 0.003` (≈ 0.008 peak). The owner rejected an earlier broadband "hiss" version.

### Haptics — `src/components/haptics.ts`
`buzz(pattern, delay)` over the Vibration API; touch screens only. **Android browsers only** —
iOS Safari doesn't let websites vibrate (an iOS 18 hidden-switch hack exists but can't do timed
patterns; deliberately not used). Patterns are short (4–28 ms) so they read as mechanical ticks.

### Phone tilt — `src/components/deviceTilt.ts`
`requestTilt()` (from a tap; iOS asks permission, Android doesn't) and `onTilt(listener)`.
Uses `deviceorientation`, maps axes for the screen orientation (portrait/landscape), and
measures tilt **relative to a resting angle that slowly follows the phone** (`settleRate`), so
holding it at any angle rests level. `fullTilt = 18°` tips the box all the way. Touch screens
only. Needs https (or localhost on the device) on iOS.

### Hero — `src/components/Hero.tsx`
First-visit timeline: "HI" appears in the four center cells → swaps to big "I'M / THAKUR" →
words fly (FLIP) into the small name → headline "MAKING THINGS / FEEL RIGHT" flips in
(`SplitFlapText`) → role line + studio scene rise in. Details:
- Text all in Disket Mono; the name stays Disket (owner rejected switching it).
- Studio image `public/avatar-story.png`. Full width on desktop, capped at `175vh` wide; side
  fade only on very wide screens (`min-aspect-ratio: 7/4`); portrait screens size it by height
  (`80svh`).
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

### Currently (About) — `src/components/Currently.tsx`
One paragraph in the big statement style (the owner asked to cut it down from two):
"Designing and building at [S] **Spotmies**. I started as a UI/UX designer and now lead full
stack builds, *with a soft spot for micro-interactions: the small moments that make a product
feel right.*" The muted second half echoes the hero's "feel right". The Spotmies "S" mark
(`public/spotmies-mark.png`) sits inline like a letter.

### Work — `src/components/Work.tsx`, `diskBox3d.ts`, `CrtPreview.tsx`, `projects.ts`
How it evolved (so nothing rejected comes back): featured rows → two boxes; 2-column
disk+details grid → single-column rows; tap-to-open box → opens on arrival.

**Data (`projects.ts`):** 9 projects from the résumé only (no invented years/stacks). Fields:
title, kind, role, `context` (`"Spotmies"` | `"Project"`), summary, highlights, stack, optional
`link`, `media` (images/videos for the monitor and window), disk colours (`disk`, `ink`).
Shelves are split by `context`: **Spotmies · Client work** (Rao Bahadur, Mutiny Talent,
Spotmies · Amerox, Peddi, TMN · Satara News) and **Personal · Hobby & academic** (SamudraGupt-Q
— the final-year project —, Gesture Shop · Aura, Nova UPI, AI Gym Trainer). Disks are numbered
01–09 straight through both.

**Two disk boxes side by side** (stacked ≤720px), each a `DiskBox`:
- **3D box (`diskBox3d.ts`, plain three.js):** smoky clear plastic tray (transparent
  `MeshPhysicalMaterial` + white edge lines, `RoomEnvironment` reflections), a hinged hood
  (pivots on the back top edge), a paper sticker ("SPOTMIES · 05 DISKS"), and chamfered
  `ExtrudeGeometry` disks whose faces are canvas textures drawn in the site fonts. Renders **on
  demand only** (idle box costs nothing). The canvas is taller/wider than the button so the lid
  and rising disks have room (`.stage`, pointer-events off). Both boxes are framed for the fuller
  one (`fitSlots`) so disks match in size.
- **CSS box** (the old 2D one) is the poster until three.js loads, and the whole box when WebGL
  fails or motion is reduced.
- **Hover (desktop):** box turns, pitches and **rolls** toward the cursor; lid peeks; disks bob;
  `rattle` sound.
- **Disk physics:** each disk leans and slides with its own spring (stiffness/damping vary per
  disk), pulled by gravity toward the low side and lagging behind fast turns; forward/back
  rocking is **shared by the stack** (disks stand against each other). Bouncing off a limit
  fires `onKnock` (`diskTap`); motion energy fires `onRattle` (`diskRattle`).
- **No interpenetration (bug fixed twice — keep it):** disks are turned `+0.1` rad so where
  neighbours overlap they turn *away* from each other (≈0.15 units apart vs 0.035 thickness);
  rocking is shared; box width has `+0.34` margin; and while rising/dropping a disk **keeps its
  depth and its turn** (only lean/tilt straighten). Verified by a script sampling 8,000–12,000
  worst-case poses (see Testing).
- **Phone tilt:** while a box is on screen, `onTilt` drives `scene.tilt(x, y)` (tip only — no
  lid peek/bob).
- **Opening (on arrival, no click needed):** once a box is ≥60% in view for 0.4s (the second
  box +0.5s), it opens itself — once per visit (`openedRef`); flicking past doesn't trigger it;
  if the visitor closes a box by hand it stays closed. It waits for the 3D scene unless that
  failed / motion is reduced. Clicking the box still closes and reopens.
- **Open sequence:** `boxOpen` sound + lid swings up → disks rise out of their slots one by one
  (`diskOut` each, via `onLift`) → at the top each 3D disk **hands off** to its HTML disk at the
  same screen rect (`rectOf` projects the face) → the HTML disk flies (FLIP) into its row → the
  empty box settles back to rest (`arrive`). The list's height **grows open** (`growRoom`, even
  ease-in-out, 850ms) so the page below glides; each row's copy fades in as its disk lands.
- **Close sequence (reverse):** copy fades → box returns to front → each HTML disk flies to just
  above its slot, hands off, the 3D disk drops in (`diskIn`) → lid closes over 580ms with the
  reversed `boxClose` → list height shrinks (`shrinkRoom`).
- Scroll anchoring is off in `.shelves` so the page doesn't jump while things move.

**Opened list = single-column rows** (`.entries`), every row the same shape:
- Desktop: small disk · number + title (Disket, word-spacing pulled in so "TMN · SATARA NEWS"
  reads as one name) · kind · summary capped at **2 lines** · role + stack as plain text ·
  small cream keycap link (only if the project has one). Hover slides the disk's shutter.
- Phones (≤560px): an index — disk, title, kind, and a 40px ↗ key for links; summary/role/stack
  hidden (they're in the window). **The whole row is tappable** (title button's `::after`
  covers the row; the disk and link sit above it).
- Clicking the title or disk opens the **retro `<dialog>` window** morphing out of the disk
  (✕, Esc, backdrop to close): meta, title, a swipeable **media strip** (images + clips with
  controls, `preload="none"`), full summary, highlights, stack chips, link.

**CRT preview monitor (`CrtPreview.tsx`, desktop/mouse only):** hovering a row brings a beige
CRT beside the cursor (trails it with a spring, leans with velocity, flips side near the right
edge). Screen: scanlines, vignette, glass reflection, a static burst on every channel change
(keyed element replays the CSS animation). Chin shows `CH 0N`, the title and a power LED. Plays
the project's `media` (clip to its end, stills 1.8s each). Sounds: `crtOn`, `channel`, and the
hum while visible. Hidden on `(hover: none)`.

**Media are placeholders:** `public/work/<id>-1.jpg`, `<id>-2.jpg` (from picsum.photos,
Unsplash-licensed) and two CC0 MDN clips re-encoded with ffmpeg (`demo-flower.mp4`,
`demo-friday.mp4` + `.jpg` posters). Links for Mutiny Talent and SamudraGupt-Q are
`example.com` placeholders; only `raobahadur.in` is real. Each is marked "Placeholder" in
`projects.ts`. Recommended real clips: 5–10s, silent, ~640px wide H.264 MP4.

### Contact — `src/components/Contact.tsx`
- Its own red grid; the red **grows down with scroll** (`revealControl`, row ticks with `tap`
  sound + haptic), dissolving top edge. It also recalculates on **page height changes**
  (`ResizeObserver` on `document.body`) — fix for the red not appearing when a disk box closed
  above it without any scroll.
- Split-flap "LET'S MAKE SOMETHING / FEEL RIGHT", status line (green pulse, live India time
  with animated map pin).
- Keycap buttons: cream email key (copies the address → "COPIED ✓"; the ↗ segment opens
  mail) and dark LinkedIn key. **Phones:** keys stack left-aligned, each as wide as its content
  (like dsnikhil); the email address **always stays on one line** and scales down to fit
  (`font-size: min(1em, calc((100vw - 152px) / 14.2))` — 17px from 414px wide, ~11.8px at 320px).
  Top padding on phones is 170px (was ~270px).
- Footer: "© year Thakur Sameer Shetty" and "Designed and built by me · Next.js, Three.js,
  WebGL, Web Audio, Claude, Gemini".

### Other
- `ClickSpark.tsx`: site-wide cream spark burst on press (adapted from React Bits, MIT +
  Commons Clause; credited in file).
- `SplitFlapText.tsx`: fixed-width tiles per final character, flip sounds, `instant` prop.
- `useInView.ts`: shared once-only in-view hook.

## Owner preferences (learned)

- Tactile, mechanical, physical feel; sounds must stay dry/mechanical — the Mac-style "zwip"
  on floppy open is the one tonal exception the owner chose. Wants sound + haptics on physical
  moments, but ambient sound (the CRT hum) barely audible.
- UX first: fewer clicks (asked to remove the click to open the box, and to show details
  without opening disks), no snapping layout (everything around a change should glide), no
  clumsy/ragged layouts, full text never truncated with "…".
- Honest, modest copy (rejected "I design it. I build it." as bragging); concise sections.
- Don't copy the reference; don't add unasked features; keep changes scoped. Recommend an
  approach (with a pick) before large changes; the owner usually takes the recommendation.
- Iterates from screenshots (often phone-sized); prefers seeing a result then tuning numbers.
- Rejected before (don't reintroduce): pixel-mosaic portrait, glass nav variants with white
  frosting, red side-tint fade on the scene, Google Sans for the name, click sound on floppy
  open, split-flap flutter for floppy open, center ripple for Contact, timed pour for Contact,
  featured-project rows above the boxes (all projects are equal effort), 2-column disk+details
  grid, chips wrapping in rows, a CRT "hiss", disks passing through each other, email wrapping
  onto two lines.

## Open items / next steps

1. **Real media and links:** replace the placeholder images/clips in `public/work/` and the
   `example.com` links (Mutiny Talent, SamudraGupt-Q) in `projects.ts`. The owner will supply
   them.
2. **Case studies (planned):** one per project. Agreed shape: header (role, timeframe, tools,
   link) → context → "my role" (say plainly it was built solo, especially Spotmies work) → 2–3
   key decisions → the hard part → outcome → reflection → visuals/clips. Company work: check
   what Spotmies allows to be shown. SamudraGupt-Q: the owner will share the final-year
   documentation; condense it, explain the quantum ideas in plain language, and confirm which
   parts were theirs (role says "Lead designer + developer"). The owner is preparing answers to:
   who it was for, when/how long, what they did, hardest part, a proud decision, what happened
   after, what they'd change, what media they can share. Likely a page per project, linked from
   the row/window.
3. Optional résumé download key in Contact (needs `public/resume.pdf`).
4. `public/spotmies_banner.webp` is unused (kept as an asset).
5. At 320px, the status line wraps awkwardly ("10:27 / PM" beside "IN VISAKHAPATNAM, / INDIA");
   offered a tidy-up, not done.
6. Optional: skip the splash for `prefers-reduced-motion` visitors (dsnikhil does); offered, not
   done.
7. If the CRT hum or the hinge creak still don't feel real, swap in a short real recording
   (loop it quietly / play it as a buffer through the same bus).
8. Launch prep: performance check on low-end devices (3 WebGL contexts: hero, contact, two
   boxes), social preview image, deployment (Vercel). **Test phone tilt (iOS permission
   prompt) and Android haptics on the deployed https site** — neither can be verified in
   headless Chrome.

## Testing notes

There's no test suite; changes were verified by driving the site in headless Chrome with
`puppeteer-core` against the local dev server (installed in a scratch folder, not in the repo;
`executablePath` = `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`). Useful
patterns:
- Skip the intro: `evaluateOnNewDocument(() => sessionStorage.setItem("intro-seen", "1"))`.
- Phone: `setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })` makes
  `(pointer: coarse)` true.
- Sound levels: wrap `AudioNode.prototype.connect` to route the **real** `AudioContext`
  destination (not the `OfflineAudioContext` renders) through an `AnalyserNode` and log peaks.
- Haptics: replace `navigator.vibrate` with a recorder and log patterns with timestamps.
- Tilt: dispatch `deviceorientation` events with `beta`/`gamma`.
- Screenshot pitfalls: `clip` is in **page** coordinates (add `scrollY`), and a clip beyond the
  viewport briefly resizes it, which fires IntersectionObservers (it once made the boxes stop
  following tilt mid-test); use `captureBeyondViewport: false` for viewport shots.
- Disk overlap checks: rebuild the disk transforms from `diskBox3d.ts` with three in Node and
  sample points of each disk against its neighbours' slabs over random extreme poses.

## Known quirks

- Bluetooth audio adds ~150–250ms latency that the site can't remove.
- The "N" badge in the corner is Next.js dev tools (dev only); on phones it covers the start of
  the footer's last lines in dev.
- After changing `next.config.ts`, restart `npm run dev`.
- Browsers reset `word-spacing` on `<button>`; the row title button sets `word-spacing:
  inherit` so the Disket spacing fix applies.
