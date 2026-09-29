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
  unwinds when the intro starts.
- **`topEdgeRows`:** dissolving top edge; on such grids unlit cells are exactly the page black
  with grain fading in from the top (no seam).
- `trackWindowPointer`: listens on window, ignores pointer outside the canvas.
- `WebsiteShaderBackground` wraps it for full-bleed use.

### Intro, sound state and shared context — `src/components/SiteIntro.tsx`
- **No Enter screen** (removed: the owner felt it read as generic to recruiters). The intro
  plays on its own ~300ms after `document.fonts.ready`: the dark rotated grid unwinds and the
  hero timeline runs. It's **silent** (no gesture yet, so browsers block audio); the nav's
  sound key turns sound on. Don't bring a click-to-enter gate back.
- **Played once per visit:** `intro-seen` lives in **sessionStorage**. Reloads in the same tab
  load the hero finished (`instant` mode); a new tab / new visit plays it again. The sound
  preference (`sound`) stays in localStorage and, if on, is restored on the first
  click/keypress.
- Scroll is locked for ~4.2s during the intro.
- Publishes `--grid-cell` (px) on `:root` for sizing type in cells.
- `useIntro()` context: `entered`, `instant`, `soundOn`, `getSounds`, `playRipple`,
  `playFlap`, `playCue`, `setHum` (CRT monitor hum on/off). `useGridPointerSounds(ref,
  enabled, getSounds, isReady?)` gives any grid hover ticks and press clacks.
- **Haptics** are fired here, from `playCue` (per-cue table `cueHaptics`, each hit a separate
  `[delay, ms]` buzz so a later one can't cancel an earlier one) and from the ripple
  (`buzzRipple`). They follow the sound toggle: sound off → no haptics.
- **Phone tilt permission** (`armTilt` from `deviceTilt.ts`) starts tilt at once where it can
  (Android, or iOS already granted) and otherwise asks on every `touchend`/`click` until answered
  (iOS only allows the prompt from a gesture, and Safari sends no `click` for taps on plain content).
- Renders `SiteNav` and `ClickSpark`.

### Sound — `src/components/revealSound.ts`
All synthesized, through one limiter bus. Character: **dry, mechanical, tactile** (relay clicks,
thump, keycaps, split-flap, plastic). Pieces:
- `playRevealSound(context, duration, from)`: press clack, thump, ring clicks timed to the
  reveal, noise swell (used by grids revealed while sound is on; the hero's intro now plays
  before any gesture, so silently).
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
`armTilt()` / `requestTilt()` (from a tap; iOS asks permission, Android doesn't) and `onTilt(listener)`.
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

**Timeline (`AboutTimeline.tsx`):** a ruler from 2020 to now with a bar per entry; the needle
rests on now, glides to a hovered row's start, and scrubs with the pointer (drag on touch).
**Entrance:** once ≥60% on screen, the needle sweeps from Jan 2020 to now in 2.2s (detent
click per year), uncovering the axis, each bar from its start, the hackathon dots (pop) and
labels (wipe) behind it via `--sweep`/`--progress` CSS variables; it lands red on NOW with a
small bounce. Once per visit; skipped for reduced motion (headless Chrome reports reduced
motion, so emulate `no-preference` to test it); touching the ruler mid-sweep finishes it.

### Work — `src/components/Work.tsx`, `diskBox3d.ts`, `CrtPreview.tsx`, `projects.ts`
**Discipline tags:** each row shows DESIGN · DEV · 3D from `disciplines` in `projects.ts`. A
"View by" lens filter (with disks shut away in the boxes, empty boxes docking beside the switch,
a tuck key) was built and dropped: it barely narrowed the list (most projects are design and
development) and made the section too complicated. Don't bring filtering back; the tags do
that job.

How it evolved (so nothing rejected comes back): featured rows → two boxes; 2-column
disk+details grid → single-column rows; tap-to-open box → opens on arrival.

**Data (`projects.ts`):** 9 projects from the résumé only (no invented years/stacks). Fields:
title, kind, role, `context` (`"Spotmies"` | `"Project"`), summary, highlights, stack, optional
`link`, `media` (images/videos for the monitor and window), disk colours (`disk`, `ink`).
Shelves are split by `context`: **Spotmies · Client work** (Rao Bahadur, Mutiny Talent,
Spotmies · Amerox, Peddi, TMN · Satara Today) and **Personal · Hobby & academic** (SamudraGupt-Q
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
- Desktop: small disk · number + title (Disket, word-spacing pulled in so "TMN · SATARA TODAY"
  reads as one name) · kind · the project's `blurb` (a line written to fit **2 lines** whole;
  never the case-study `summary`, which ran long and got cut off with "…") · role + stack as plain text ·
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

**Media:** real for every project except AI Gym Trainer (still `demo-friday.mp4` and
`gym-1/2.jpg` placeholders) and parts of SamudraGupt-Q (test cards, `samudragupt-1.jpg`).
SamudraGupt-Q has no link until there's a real one. `public/` holds only what the code uses:
raw originals (screen recordings, Figma exports, uncropped photos) were moved out on
2026-09-27 (to the owner's Trash, `portfolio-unused-assets-2026-09-27`); keep new originals
outside `public/`, which ships with the site.

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
  onto two lines, a faster Work open with every row's copy fading in together and
  off-screen disks dropping instead of flying (tried and rolled back 2026-09-27; the owner
  kept the original disk-by-disk choreography).

## Open items / next steps

1. **Real media:** AI Gym Trainer's placeholders and SamudraGupt-Q's test cards, once the
   owner supplies them.
2. **Case studies (in progress):** one per project, written up in `projects.ts`
   (`caseStudy`). Peddi (the Roblox world, made with Dworak) is written from the owner's
   screenshots in `public/work/peddi/` (resized to 1680px, the player list blurred since it
   shows other players' names); its outcome shows two YouTubers' videos as `youtube` items (a
   local thumbnail in the story and on the monitor, the real player only in `ScreenViewer`).
   It launched June 5, 2026 via @PeddiMovieOffl on X (post shown in the outcome, a 4:3 black-framed
   copy for the monitor). A reflection and who did what with Dworak are still to confirm.
   TMN · Satara Today is written from the owner's Figma recordings (`public/work/tmn-satara/`):
   the website scrolls at 1280px, and each app clip as a 1200×900 board with the English (TMN)
   and Marathi (Satara Today) phones side by side, the shorter clip holding its last frame. The app is
   in production with the Spotmies dev team, who also built the website (unlinked until it launches on its own domain; its Vercel preview isn't shared). Designed
   May 2026. Credits read Spotmies × TMN | Satara Today: `client` takes a list, split by a rule,
   and a squarer mark can set its own `height`.
   Gesture Shop · Aura is written from the owner's phone videos (`public/work/guesture-shop/`,
   `guesture-aura/`, square, shown as a centred pair of one); Gesture Shop leads, with Aura as a
   second link (`alsoLink`). A clearer Gesture Shop video is coming. Nova UPI is written from its
   Figma recording (cut into three single-phone boards, 1200×900) and 52 screen exports (four
   1600×1200 boards of three); design only, in 48 hours as a challenge the owner set themself (not a hackathon); date still to confirm. Also wireframes, a design-system sheet (colours, glass, icon and type composed on Figma grey) and three Mockuuups photo mockups (corners cropped, credited in captions). Rao Bahadur is done (bar a line on what they'd change, and whether fans'
   nicknames in screenshots should be blurred); SamudraGupt-Q is written; the rest fall back to
   a single overview. Layout (`ProjectView.tsx`), chosen over an earlier version where the
   story sat beside a sticky CRT and each part was a channel (the work was too small to see,
   and it read as a wall of text): a first screen with the meta line (with a read time worked
   out from the text), the title, a story `headline` (the summary only shows without one),
   link and tools, kept sparse on purpose (the owner found a fuller version clumsy), beside
   the CRT standing on a faint grid floor that fades out (channel 1 is the project's `reel`,
   then a channel per part with pictures, its `screen` or else its `figures`; the remote's
   keys tune the TV without scrolling the page, and its ◀ ▶ step through the channel's
   pictures); then a `brief` band across the page under the fold (label, value, note, 3
   across; after a reference the owner liked); then the story in a 680px column, each part's
   `figures` large under its text (`layout`: wide, pair, grid, row, or carousel: one at a
   time with a tab per picture, for clips that would compete side by side; the owner found two
   scrolling clips playing together distracting); a part's `lead` shows one picture full width before its
   figures (MutinyX's Submissions: the flow clip first, then the before → after pair side by
   side; a carousel would never show both sides at once), with a `caption` each.
   Spotmies work opens with a credits row of logos above the meta line (`public/logos/`:
   Spotmies, darkened for the cream page, × the client's `caseStudy.client.logo`).
   A part's `act` names a new act of the story above it (The brief, The decisions, The build,
   What happened). Any picture, or the set's screen, opens `ScreenViewer`. The how-to hints
   live in the hero's empty top-right corner (a "? Hide hints" switch with a dark card of
   hints under it; just above the set on narrow screens). The owner rejected them under the set,
   under the title, and inside the top bar. The card opens by itself on wide screens with a
   mouse until the set is used, and only on request elsewhere. Shape per
   project: brief → 2–3 key decisions (the bulk) → everything else as a grid of screens →
   the hard part → outcome → reflection. Say plainly the work was solo. Don't quote numbers
   the client sets for marketing (Rao Bahadur's home page counter). The monitor's screen is
   4:3 and covers, so portrait pictures for the `reel` are paired side by side on black.
   Phone screens are shown as 4:3 "boards" (`public/work/mutiny/boards/`): 1600×1200 on
   Figma grey #1e1e1e, up to three screens (top 1748px of each 804px-wide 2x export) at
   1008px tall with 64px rounded corners, 56px apart; portrait clips framed the same way at
   1200×900. Built with ffmpeg (a rounded-rect mask via `geq`, then `alphamerge`); with a
   looped still mask, pass `alphamerge=shortest=1` and `-t`, or it never ends. One shape
   means the page and the monitor show the same picture, uncropped.
3. Optional résumé download key in Contact (needs `public/resume.pdf`).
4. At 320px, the status line wraps awkwardly ("10:27 / PM" beside "IN VISAKHAPATNAM, / INDIA");
   offered a tidy-up, not done.
5. Optional: skip the splash for `prefers-reduced-motion` visitors (dsnikhil does); offered, not
   done.
6. If the CRT hum or the hinge creak still don't feel real, swap in a short real recording
   (loop it quietly / play it as a buffer through the same bus).
7. Launch prep: performance check on low-end devices (3 WebGL contexts: hero, contact, two
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
