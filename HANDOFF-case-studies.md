# Handoff: the portfolio's case studies

For an agent or a fresh session picking up the case studies. Read it with `HANDOFF.md` (the
whole site) and `AGENTS.md` (this Next.js is newer than most training data: read
`node_modules/next/dist/docs/` before touching Next APIs). Keep both handoff files in the repo;
the owner asked for that. State as of commit `b076211` on `main`, pushed (2026-10-04).

## The goal, and where it stands

Every project's case study was restructured into a hiring-ready Product Designer case study,
with animated diagrams that explain each decision. **All 11 are done** and the owner has
checked them on laptop and phone. New work is likely to be tweaks the owner sees in the
browser (they send screenshots), or a new project.

## Rules agreed with the owner (follow these)

1. **Never invent** facts, metrics, quotes, research, dates, UI copy or reasons. Ask. Mark
   anything unconfirmed `// Confirm:` in `projects.ts` (none are left). When the owner says
   "write it yourself", draft only from things they've said, then say what you drafted.
2. **Credit precisely** who did what (the owner, their team lead, Spotmies developers, Dworak,
   clients). Several credits were corrected; see "Facts settled". Don't move them.
3. **Reflections:** a paragraph in the owner's words, then points "What I learned: …",
   "What I'd change: …", optionally "What I'd do next: …". Read them as a hiring manager: no
   blaming the client, no self-proclaimed expertise.
4. **Templates.** Main projects (MutinyX, TMN · Satara Today, Nova UPI, Rao Bahadur): brief grid
   → Brief → Constraints → My part → (groundwork) → 2–4 decisions, each with a diagram where it
   earns one → craft / design language → Outcome → Reflection. Other projects: brief, my part,
   one or two decisions, outcome, reflection.
5. **Diagram style** (memory note `diagram-widget-style.md`): Apple-widget look, dark rounded
   cards `#171614` on warm grey `#d3d0cb`, sentence-case display type, pills, **one accent per
   product**, used only where you can act; status green/red only where the product has them.
   No monospace caps, dashed wire boxes or chevrons. The owner rejected an earlier version as
   "AI slop".
6. **Realism:** app diagrams are drawn on a real-size phone screen at real app sizes, laid out
   from the project's actual screens (in `public/work/<project>/`), with its real words and
   numbers. Every tap shows a fingertip.
7. **Colours and fonts come from the source:** read a live site's CSS (custom properties,
   most-used hex values, `font-family` per selector), or measure pixels with ffmpeg (shrink the
   image to a grid, find the pixels nearest each colour, prefer flat patches). Say when something
   is inferred.
8. **Light verification:** `npx tsc --noEmit -p .` and `npx eslint src/components` after every
   change; no long headless runs; the owner tests on their devices. Don't touch the CRT set
   unless asked. Keep `revealSound.ts`'s existing sounds; add new, named ones only.
9. **Commit only when asked**; the owner sometimes commits themself. Push only when asked.

## Data model (`src/components/projects.ts`)

A `Project` has `id`, `disciplines`, `title`, `kind`, `role`, `context` (`"Spotmies"` |
`"Project"`), `summary`, `blurb` (two lines in the Work list), `highlights`, `stack`, optional
`link` / `alsoLink`, `media`, `disk` / `ink` colours, and `caseStudy`:

- `timeframe`, optional `client` (logo, or a list split by a rule), `headline`, `tldr`, `brief`,
  `reel` (what the CRT plays first), `sections`.
- `tldr: CaseTldr` (every project has one): `{ overview: string[]; problem?: { points,
  insight? }; reframe?: { from, to }; solution?; result?: { metrics?: { kicker?, value, label }[],
  points? }; learnings? }`. Written only from what the case study says; metrics only real ones.
  Keep lines short (one idea each); missing parts are simply left out.
  `visuals?: Partial<Record<TldrPart, image | video | diagram>>` puts one figure under a part
  (one or two per project, by relevance: e.g. MutinyX's v1 board under Problem and
  `submission-flow` under Solution). Diagrams play inside the panel as they scroll into view. The panel is
  900 × 720 (≤ 86svh); phone diagrams sit at 470px there and, through the `CompactDiagrams`
  context in `widget.tsx`, keep their stats beside the phone at any width (their shortest
  layout), so all of one fits at once. On the phone sheet they keep their stacked layout. Under each, "Read the full story →" closes the TL;DR and goes
  to the section that shows the same figure (matched by diagram id or file in `ProjectView`'s
  `findSection`; a figure that's in no section gets no button).
- `brief: CaseFact[]`: `{ label, value, note?, logo?, people?, href? }`. The grid lays out 6 as
  3 + 3, 4 as 2 × 2 and 5 as 3 + 2 (`data-count` in `ProjectView`).
- `sections: CaseSection[]`: `{ id, act?, label, heading, paragraphs, stats?, points?, figures?,
  lead?, screen?, layout? }`.
  - `act` starts a new act ("The decisions", "What happened"…); `label` is the short name in
    the progress pill, sidebar and phone menu.
  - Paragraphs and points accept inline links: `[spotmies.com](https://www.spotmies.com)`.
  - `points` render numbered (01, 02…); `"Title: the rest"` puts the title above the rest. Two
    columns when every point is under 120 characters.
  - `stats: { value, label }[]` render as a ruled table (Peddi's launch, Rao Bahadur's outcome).
  - `lead` is one figure before the others; a diagram is `{ type: "diagram", diagram: <id>,
    alt, caption }`. The CRT can't play diagrams, so it shows the section's `figures` or
    `screen` instead.
  - `layout`: `wide` (default), `pair`, `grid`, `row`, `carousel`.

Section ids per project (for finding things): Rao Bahadur brief, constraints, ownership,
identity, spoilers, easter-egg, design-language, more, hard, outcome, reflection · MutinyX
brief, version-1, goals, constraints, ownership, submissions, quote, sign-in, opening, new-look,
status, reflection, website · Spotmies brief, research, site, design-language, before, outcome,
reflection · Amero X brief, gold, design-language, landing, handoff, reflection · Peddi brief,
roblox, references, places, finds, making, launch, played, reflection · TMN brief, constraints,
ownership, first-draft, languages, article, writing, design-language, website, status,
reflection · The Newspaper brief, front-page, papers, publish, dark, outcome, reflection ·
SamudraGupt-Q overview, problem, how, quantum, privacy, decisions, testing, limits, outcome,
reflection · Gesture idea, shop, steady, aura, smooth, outcome, reflection · Nova brief,
constraints, wireframes, home, cards, pay, system, getting-in, motion, mockups, status,
reflection · Gym brief, counting, dashboard, limits.

## The case study page (`ProjectView.tsx`, `ProjectView.module.css`)

- **Contents, wide screens (≥1280px):** a sticky sidebar ("Scroll to top" + every label). A dot
  beside the current part hops in an arc to the next (Web Animations) with the `"hop"` sound.
  A click holds its target until scrolling has been still for 180ms (`releaseRef`), so the dot
  doesn't run through the parts in between.
- **Contents, narrower:** a floating dark-glass button with a cream dot at the bottom left
  (shown once past the opening) opens a glass menu of the parts; tapping one plays `hop`,
  scrolls there and closes it. Escape, tapping outside or the button also close it. While the
  mini player's disc holds that corner (`html[data-mini-player]`, set by `MiniPlayer.tsx`),
  the button glides up to sit above the disc. A ring round its dot fills from the top as the story is read
  (`--progress`, written onto the button from the scroll handler, so scrolling doesn't
  re-render the page).
- **TL;DR (`Tldr.tsx`, `Tldr.module.css`),** after the reference the owner chose
  (rahulrnadkarni.framer.website/wonders, read from its Framer bundle): a 400 × 48px "TL;DR" key
  made like the phone contents button (dark glass with blur, faint cream edge, soft shadow,
  cream type), fully round like it (rounded ends; the owner settled on this after trying the
  site buttons' 6px corners). On phones it sits on one line with the contents button (both 48px, 16px
  up, 12px apart). 30% of the way through the story (the same measure as the
  contents ring, `readOn` in `ProjectView`) it shrinks, as one framer-motion layout animation,
  into a 48px circle at the bottom right with
  a shredder icon that runs on hover and once as it shrinks (`icons/ShredderIcon.tsx`, from
  Lucide Animated, MIT, adapted to framer-motion); scrolling back above 30% brings the full key back. It floats over everything and
  springs up quickly from 48px below (a light spring, ~0.35s; the reference's overdamped
  spring felt slow) at the foot of the screen once the story starts; it opens an 80% black backdrop and a white panel (840 ×
  600, 36px corners, 48px gaps, 24px headings, 20/32px grey lines with a dot in the project's
  colour, 48px metrics) that springs up from 600px below while growing from 80%, with a round
  close button above it fading in a beat later. On phones the panel is a bottom sheet 90% tall
  that slides up; the pill runs the width beside the contents button (and beside the mini
  player's disc). Esc and the backdrop close it, without closing the case study's `<dialog>`;
  the page underneath holds still and its keys pause.
- **Widget diagrams are capped at 680px** (the text column): `isCompactDiagram` in
  `diagrams/Diagram.tsx` lists the older full-width ones (`packet-flow`, `bell-pair`,
  `fleet-average`).
- **Declined by the owner (don't fix):** the dot appearing only after a move if the window is
  widened past 1280px; the dot stepping back once after clicking a short last part; number
  keys reaching only parts 1–9.

## The diagram kit (`src/components/diagrams/`)

**`widget.tsx`** holds the shared pieces:
- `VersionWidget({ title, icon?, tabs, accent, length, status, stats, draw, phone? })`.
  - It plays version 1, then version 2, once, from the Before/After switch on top. Play,
    replay and "look closer" sit underneath.
  - It starts only once 35% of it is in view (`useDiagramBox(ref, 0.35)` in `shared.tsx`), and
    when it leaves the view it resets to its start (version 1, time 0, playing), so it replays
    from the beginning each time. The older lab diagrams keep their own pause-off-screen
    behaviour.
  - `draw(version, frame)` gets `Frame { cx, cw, y, uid, t, h? }`.
  - Without `phone`, it's a 560 × 428 card (380 wide on a phone), with the header (an optional
    icon and the title) and the content shifted 12px down.
  - With `phone`, it draws a `SCREEN_W × SCREEN_H` (360 × 740pt) screen in a bezel, with the
    status bar, island and home indicator. `cx`/`y` are the screen's top left. On wide screens
    the stats are three tall tiles beside the phone; on narrow ones, a row below it.
- **Phone layout rules:**
  - 20pt side margins, so content is 320 wide.
  - Content starts below the status bar, at about `y + 64`; keep clear of the home indicator
    at `y + 726`.
  - Text classes in `Widget.module.css`: `pTitle` 28, `pHead` 20, `pBody` / `pStrong` 16,
    `pLabel` 13, `pSmall` 12, `pButton` 17, `pHeadline` 22, `pBig` 52, `pBalance` 36,
    `pDigit` 22.
  - Buttons and fields 52–56pt tall, list rows 60pt, avatars and icon circles 48–52pt.
- **Helpers:**
  - `pill` (a progress segment with a glow), `button`, `badge`, `typed(text, k)`.
  - `glyph(name, x, y, size, fill)`: Material Symbols Rounded paths from
    `icons/MaterialIcon.tsx`. Fetch new ones from
    `https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/<name>/default/24px.svg`.
  - `touch(x, y, t, at)`: a fingertip disc landing, then a ripple. Put one on every press.
  - `hold(x, y, t, from, to)`: a fingertip held while dragging.
- **Colours:** `STAGE`, `CARD`, `RAISED`, `TRACK`, `INK`, `MUTED`, `CREAM`, `YELLOW`, `DARK`,
  `GREEN`, `RED`.

**Adding a diagram:** write `diagrams/<Name>.tsx` with `VersionWidget`; add its id to the
`DiagramId` union in `projects.ts` and a `case` in `Diagram.tsx`; put it in a section's
`lead`. Copy timings and structure from a sibling, such as `SignInFlow.tsx`.

**`SystemCard.tsx`** is the design language card, one `System` per brand: `MUTINY`, `TMN`,
`NOVA`, `RAO`, `SPOTMIES`, `AMERO`.
- A `System` is `{ colours, source?, specimen, faces, typeNote?, pills, pillFont, shapeNote,
  footer?, fonts? }`.
- `colours: { name, hex, use, ink, fill? }`: `fill` holds a gradient; `hex` is the label shown.
- `source: { label, backdrop, pictures: [{ src, alt, width, height, picks }] }`. `picks` has one
  entry per colour, either `{ x, y }` in % of the picture or `null`. Dots land on the picks,
  then fly into their swatches; colours with no pick fade in. Several pictures are balanced by
  equal area and split by a rule.
- `pills: { label, kind: "chip" | "tag" | "button", bg, fg, border? }`.
- Fonts are self-hosted in `src/fonts/` and loaded with `localFont` at the top of the file.

**Other:** `facehash` (MIT) draws the avatars in `RaoJoin`. `CurlCount` runs the gym trainer's
real rule frame by frame.

## Per project

| Project | Diagrams / cards | Notes |
|---|---|---|
| MutinyX | `submission-flow`, `quote-flow`, `sign-in-flow`, `mutiny-system` | Full template; phone diagrams after v1/v2 screens in `public/work/mutiny/boards/` |
| TMN · Satara Today | `feed-styles` (Inshorts → Instagram), `two-scripts` (English/मराठी), `tmn-system` (both logos) | Full template |
| Nova UPI | `nova-home`, `nova-cards`, `nova-system` (from the style guide's colour panel) | Full template; "typical UPI app" is generic, no brand shown |
| Rao Bahadur | `rao-join`, `rao-system` (from `public/work/raobahadur/poster.jpg`), stats | Full template |
| Spotmies site | `spotmies-system` (from spotmies.com's CSS) | Slim |
| Amero X | `amero-system` (amerox.io's CSS; logo + `public/work/amerox/coin.png`) | Slim |
| Peddi | stats table | Slim |
| The Newspaper | none (TMN's `feed-styles` tells its story) | Slim |
| SamudraGupt-Q | `packet-flow`, `bell-pair`, `fleet-average` (older lab style, left as is) | Slim |
| Gesture Shop · Aura | none | Slim |
| AI Gym Trainer | `curl-count` (card layout, not a phone), `public/work/gym-trainer/demo.mp4` | Slim; no reflection, by the owner's choice |

## Facts settled with the owner (don't re-ask)

- **MutinyX:** team = owner + team lead + client. V1 designed Feb 25–28, 2026; the owner built
  some v1 screens (opening, sign-in, campaigns list, transactions, profile); the team lead and
  Spotmies developers built the rest and the release, which changed the design. V2: the owner
  designed it and built the whole frontend. Instagram connection, backend and the brands'
  desktop dashboard are the team lead's and developers'. V2 is in testing, no users yet. Pure
  black `#000000`, yellow `#FACB03`, v1 SF Pro → v2 General Sans, cards 25px, buttons 50px.
  Dark theme because the client moved to a black logo (yellow on white looked cheap).
- **TMN · Satara Today:** owner designed only; never involved in development. Brief via the
  project manager ("a Gen Z news app like Inshorts"); first draft in 3 days, ~80% The
  Newspaper; client half liked it; final in a week after asking for brand assets, with
  Instagram's scroll as the reference. The website opens on a briefing by the client's call.
  Red `#DB0D14`, black `#1A1C1C`, white; Epilogue headings, Inter body. The owner says Marathi
  uses the same fonts; Epilogue and Inter have no Devanagari, so the build needs a Devanagari
  face (told to the owner).
- **Nova:** a 48-hour solo sprint (no date); problems seen in PhonePe, GPay and Paytm; card
  fetching is a reimagined concept; swipe to pay so you mean it; **it got the owner hired at
  Spotmies**. `#0171FF`, `#92D5FF`, `#FFFFFF`, `#000000`; the app icon (`public/logos/nova-logo.png`, petals `#9592EA → #1D2B85` on `#C9DFFC`) is
  credited above the title and is a second colour source on the card; Product Sans only (SF Pro Display
  and Plus Jakarta Sans only appear in the style guide as alternatives).
- **Rao Bahadur:** chain film team → MutinyX → Spotmies → owner. Postgres on Railway, Cloudinary,
  UploadThing. The no-sign-up rule was the client's; the nickname approach, the spoiler question
  and the easter egg were the owner's. Colours from the film's main posters. The site carried on
  past the cinema run (the debate, then a Netflix link).
- **Peddi:** Roblox proposed by the owner and Dworak; the owner built the world, character
  designs, clothes and the cricket pitch and logic; Dworak helped early, and his wrestling
  pitch was cut by the client.
- **Spotmies site:** signed off by the CEO and founders; live. Body text in the system font is
  intended.
- **Amero X:** the owner worked with Spotmies' design head; the client chose black and gold.
  Gold `#FCDA7B`, the coin's gradient `#FCDA7B → #E2B649 → #FDB648` (the site's own gradient
  stops), logo `#FDD303`, `#050505`, `#121212`; Gambarino headings (confirmed) and Space
  Grotesk. The developers changed the live site after handoff.
- **SamudraGupt-Q:** built solo; three teammates only pitched. Demo, paper, and a talk at
  GITAM's Quantumisers club.
- **Gesture Shop · Aura:** Gesture Shop started Nov 29, 2025 (Aura's date unknown), while the
  owner was exploring OpenCV. Never posted online; shown to friends.
- **Gym trainer:** source repo `~/Documents/Projects/personal-gym-trainer`; the original video is
  on the owner's Desktop.

## Sources outside the repo

Raw originals stay outside `public/`: the gym video (`~/Desktop/ai-personal-gym-trainer.mov`),
the Rao Bahadur poster and Amero X coin originals (deleted from `src/app/` after web copies were
made). Owner-supplied images dropped into `src/app/` aren't served; copy a web-sized version
into `public/work/<project>/` and remove the original.

## Open / optional

Nothing is required. Things offered and not taken up: a reflection for the gym trainer; real
photos in place of the soft gradient "photos" in the TMN diagrams.
