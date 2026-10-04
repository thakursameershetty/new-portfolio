# Handoff: case study restructure for the portfolio

Read this (and `HANDOFF.md` for the whole site) before continuing. Next.js here is newer than
most training data: read `node_modules/next/dist/docs/` before touching Next-specific APIs (see
`AGENTS.md`). Nothing below is committed yet; the owner wants **one commit at the end**, and
asked to keep both handoff files.

## The goal

Restructure every project's case study so it reads like a hiring-ready Product Designer case
study, with animated diagrams that explain the decisions. The data is `src/components/projects.ts`
(a `Project` per disk, each with a `caseStudy` of `headline`, `brief`, `reel` and `sections`),
rendered by `ProjectView.tsx`.

## Rules agreed with the owner

- **Never invent** facts, metrics, quotes or research. Ask; mark unknowns `// Confirm:`. When the
  owner says "write the lesson yourself", draft from things they've said, and say so.
- **Credit precisely** who did what (team lead, Spotmies developers, Dworak, the client).
  Several claims were corrected along the way; see "Facts settled" below.
- **Template, main projects** (MutinyX, TMN · Satara Today, Nova UPI, Rao Bahadur): brief grid →
  Brief/problem → Constraints → My part → (groundwork) → 2–4 decisions, each with a diagram where
  it earns one → the craft / design language → Outcome → Reflection (paragraph + "What I
  learned / What I'd change / What I'd do next" points).
- **Slim template, the rest:** brief, my part, one or two decisions, outcome, a reflection.
- **Diagram style** (memory note `diagram-widget-style.md`): Apple-widget look, dark rounded
  cards `#171614` on a warm grey `#d3d0cb`, big sentence-case display type, pills, **one accent
  per product** used only where you can act. Status green/red allowed where the product uses
  them. No monospace caps, no dashed wire boxes. Use real values from the real screens.
- The owner prefers **light verification** (they test on their own devices) and wants the
  original sounds in `revealSound.ts` kept; add new named sounds, never rebuild old ones.

## What exists now

### Page features (`ProjectView.tsx`, `ProjectView.module.css`)
- **Numbered points:** `points` render as 01, 02… with a title when a point starts
  `"Title: …"` (`splitPoint`). Two columns when every point is under 120 characters.
- **Stats table:** a section's optional `stats: { value, label }[]` renders as a ruled table
  (Peddi's launch post, Rao Bahadur's outcome).
- **Inline links:** `[text](https://…)` inside paragraphs and points (`linked`), e.g.
  spotmies.com, amerox.io.
- **Contents sidebar** (≥1280px): "Scroll to top" + every part's label, sticky; a dot beside the
  current part **hops in an arc** to the next (Web Animations) with a new `"hop"` sound cue
  (`revealSound.ts`). A click holds the target until scrolling stops (`releaseRef`), so the dot
  doesn't run through the parts in between.
- **Widget diagrams are capped at 680px** (`figureCompact`, `isCompactDiagram` in
  `diagrams/Diagram.tsx`); the three older lab diagrams keep full width.

### Diagram kit (`src/components/diagrams/`)
- `widget.tsx`: `VersionWidget` (the card, Before/After switch on top, play/replay/look closer
  under it, `tabs` and `accent` per product) and helpers `pill`, `button`, `badge`, `typed`,
  `glyph` (Material Symbols paths). `Widget.module.css` holds its type and controls.
- `SystemCard.tsx` + `.module.css`: the **design language card** (colour swatches named by job,
  type specimen in the real fonts, shapes). Colours are **picked from a source picture**: dots
  land on each colour (logo, poster or style guide), then fly into their swatches. Several
  pictures are balanced by equal area and split by a rule (TMN + Satara Today).
- Registering a diagram: an id in the `DiagramId` union (`projects.ts`), a `case` in
  `Diagram.tsx`, and a section `lead` of `type: "diagram"`. The monitor can't play diagrams; a
  section shows its `figures` or `screen` there instead.
- Icons: `src/components/icons/MaterialIcon.tsx` (inlined Material Symbols Rounded paths,
  including favorite, comment and bookmark).
- Fonts self-hosted in `src/fonts/` for the cards: Epilogue, Inter, Cinzel, Outfit (OFL) and
  General Sans (Fontshare free licence). New dependency: `facehash` (MIT), used by `RaoJoin`.

### Per project
| Project | Diagrams / cards | State |
|---|---|---|
| MutinyX | `submission-flow`, `quote-flow` (green/red budget chip), `sign-in-flow`, `mutiny-system` | Full template, owner's answers in |
| TMN · Satara Today | `feed-styles` (Inshorts → Instagram), `two-scripts`, `tmn-system` (both logos) | Full template |
| Nova UPI | `nova-home`, `nova-cards`, `nova-system` (from the style guide panel) | Full template |
| Rao Bahadur | `rao-join` (real FaceHash), `rao-system` (from the film poster), stats table | Full template |
| Spotmies site | `spotmies-system` (values read from the live site's CSS) | Slim, done |
| Amero X | none yet (design card waiting on Figma values) | Slim, done |
| Peddi | stats table | Slim, done |
| The Newspaper | none (TMN covers it) | Slim, done |
| SamudraGupt-Q | three older lab diagrams, brief grid added | Slim; reflection missing |
| Gesture Shop · Aura | none | Not restructured |
| AI Gym Trainer | none | No case study |

## Facts settled with the owner (don't re-ask)

- **MutinyX:** team = owner + team lead + client. V1 designed Feb 25–28, 2026; owner built some
  v1 screens (opening, sign-in, campaigns list, transactions, profile), the team lead and
  Spotmies developers built the rest and the release (which changed the design). V2: owner
  designed it and built the whole frontend. Instagram connection, backend and the brands'
  desktop dashboard are the team lead's/developers'. V2 in testing, no users yet. App is pure
  black `#000000`, yellow `#FACB03`, v1 SF Pro → v2 General Sans, cards 25px, buttons 50px.
- **TMN · Satara Today:** owner designed only, never involved in development. Brief came from the
  client through the project manager ("Gen Z news app like Inshorts"); first draft in 3 days was
  ~80% The Newspaper; client half liked it; final in a week after asking for brand assets, with
  Instagram's scroll as the reference. Website opens on a briefing by the client's call. Red
  `#DB0D14`, black `#1A1C1C`, white; Epilogue headings, Inter body (owner says Marathi uses the
  same fonts; Epilogue/Inter have no Devanagari, so the developers should pick a Devanagari face).
- **Nova:** a 48-hour solo sprint (no date), problems seen in PhonePe/GPay/Paytm, card fetching is
  a reimagined concept, swipe to pay so you mean it, **it got the owner hired at Spotmies**.
  Colours `#0171FF`, `#92D5FF`, `#FFFFFF`, `#000000`; Product Sans only.
- **Rao Bahadur:** chain film team → MutinyX → Spotmies → owner. Postgres on Railway, Cloudinary
  and UploadThing. No-sign-up rule was the client's, the nickname approach the owner's; spoiler
  question and easter egg the owner's. Colours from the poster (`public/work/raobahadur/poster.jpg`).
- **Peddi:** Roblox proposed by the owner and Dworak; the owner built the world, character
  designs, clothes and the cricket pitch + logic; Dworak helped early and the wrestling pitch
  was cut by the client.
- **SamudraGupt-Q:** built solo; three teammates only pitched. Demo, paper, and a talk at GITAM's
  Quantumisers club (LinkedIn post linked in the brief).

## Still open

See the owner-facing list in the last message of the session; in short: Amero X's Figma values,
SamudraGupt-Q's reflection, Gesture Shop · Aura and the gym trainer questions, a few drafted
lines to confirm, a browser pass, and the final commit (excluding nothing but `.DS_Store`).
