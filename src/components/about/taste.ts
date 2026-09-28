// What Thakur's listening to, watching and playing, for the About page.
//
// All Thakur's own: swap any list wholesale and nothing else needs to change.

/** A song, with a 30-second preview and artwork from the iTunes Search API
 *  (itunes.apple.com/search?entity=song&term=...): `artworkUrl100` with 100x100 swapped for
 *  600x600, `previewUrl`, and `trackViewUrl` (the Apple Music page). */
export interface Track {
  artist: string;
  title: string;
  album: string;
  artwork: string;
  preview: string;
  link: string;
}

// Thakur's top songs, in his order.
export const tracks: Track[] = [
  {
    artist: "The Smiths",
    title: "There Is a Light That Never Goes Out",
    album: "The Queen Is Dead",
    artwork:
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/1a/e8/70/1ae870c3-b402-096b-c4c4-8022af5a2ed9/745099189662.jpg/600x600bb.jpg",
    preview:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/4e/c9/1d/4ec91df8-8524-b6ac-812c-fb38054be09d/mzaf_3253228293752173874.plus.aac.p.m4a",
    link: "https://music.apple.com/us/album/there-is-a-light-that-never-goes-out/800092985?i=800157892",
  },
  {
    artist: "Tame Impala",
    title: "Let It Happen",
    album: "Currents",
    artwork:
      "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a8/2e/b4/a82eb490-f30a-a321-461a-0383c88fec95/15UMGIM23316.rgb.jpg/600x600bb.jpg",
    preview:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/25/fe/60/25fe60d3-3e30-c6f9-fdcb-97058fed0c38/mzaf_1903612753893368017.plus.aac.p.m4a",
    link: "https://music.apple.com/us/album/let-it-happen/1440838039?i=1440838060",
  },
  {
    artist: "Gorillaz",
    title: "Feel Good Inc.",
    album: "Demon Days",
    artwork:
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/1c/0f/81/1c0f818a-e458-dd84-6f1b-ccbdf5fe14d6/825646291045.jpg/600x600bb.jpg",
    preview:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/9a/a7/90/9aa790e3-651e-9674-26ac-14aba4d3b8d1/mzaf_10454527198707970464.plus.aac.p.m4a",
    link: "https://music.apple.com/us/album/feel-good-inc-feat-david-jolicoeur-kelvin-mercer-vincent/850571319?i=850571371",
  },
  {
    artist: "Her's",
    title: "What Once Was",
    album: "Songs of Her's",
    artwork:
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/4a/84/e5/4a84e597-25f2-5129-a0b0-a11e00b7756e/5065002066657.jpg/600x600bb.jpg",
    preview:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d5/5c/8b/d55c8b4c-6fd2-9a58-3bfe-c3003d39e422/mzaf_12921127738953175872.plus.aac.p.m4a",
    link: "https://music.apple.com/us/album/what-once-was/1206909430?i=1206911819",
  },
  {
    artist: "ABBA",
    title: "Mamma Mia",
    album: "ABBA Gold: Greatest Hits",
    artwork:
      "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/60/f8/a6/60f8a6bc-e875-238d-f2f8-f34a6034e6d2/14UMGIM07615.rgb.jpg/600x600bb.jpg",
    preview:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/59/c0/7a/59c07a69-4243-af5e-320a-ccb0495b870b/mzaf_8435063535972083873.plus.aac.p.m4a",
    link: "https://music.apple.com/in/album/mamma-mia/1422648512?i=1422648821",
  },
  {
    artist: "The Weeknd",
    title: "Dancing In The Flames",
    album: "Dancing In The Flames",
    artwork:
      "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/03/75/e4/0375e4fa-9331-3906-76a1-216478606608/24UMGIM95646.rgb.jpg/600x600bb.jpg",
    preview:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/73/6b/36/736b36f8-7b99-4248-6a0b-32cb3c9739ed/mzaf_2964307400316673500.plus.aac.p.m4a",
    link: "https://music.apple.com/in/album/dancing-in-the-flames/1767417935?i=1767418043",
  },
  {
    artist: "Shreya Ghoshal, Nikhil Paul George & Pritam",
    title: "Aashiyan",
    album: "Barfi!",
    artwork:
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/5b/65/4a/5b654a60-886f-8bbf-2f39-5ea0dacb8022/886443625099.jpg/600x600bb.jpg",
    preview:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ed/88/79/ed8879dc-6b99-081c-7fa7-b773b7c95723/mzaf_6101746706585069584.plus.aac.p.m4a",
    link: "https://music.apple.com/in/album/aashiyan/554640982?i=554641154",
  },
  {
    artist: "Djo",
    title: "Delete Ya",
    album: "The Crux",
    artwork:
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/3e/20/c4/3e20c433-92a9-8866-ee86-b6dc6bc5e76d/199066503560.jpg/600x600bb.jpg",
    preview:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/7f/a4/7e/7fa47e41-b8be-ed0f-8316-136c31c66d09/mzaf_13728700389116458412.plus.aac.p.m4a",
    link: "https://music.apple.com/us/album/delete-ya/1791184860?i=1791184871",
  },
  {
    artist: "Rick Astley",
    title: "Never Gonna Give You Up",
    album: "Whenever You Need Somebody",
    artwork:
      "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/ce/6d/5b/ce6d5b48-8c36-b990-3b9c-81862fadb459/0859381157694.jpg/600x600bb.jpg",
    preview:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/62/ff/3a/62ff3abe-bc6d-a7d0-31b0-71cbec9aaa24/mzaf_13802296211720217737.plus.aac.p.m4a",
    link: "https://music.apple.com/us/album/never-gonna-give-you-up/1559885420?i=1559885421",
  },
];

/** A film or series. `poster` is a portrait image (2:3, 600×900) in /public/about/films.
 *  In focus, a poster is lit by a blurred copy of itself; `glow` is its most prominent
 *  saturated colour, lifted (picked from its pixels by hue, weighted by saturation, then
 *  tuned by eye), which stands in for that light when there's no poster. `tint` shows while
 *  it loads. `rating`, if given, is Thakur's own, out of 10. */
export interface Film {
  title: string;
  kind: "film" | "series";
  year: string;
  length: string;
  poster?: string;
  glow: string;
  tint: string;
  rating?: number;
}

// Oldest first, within films and within series.
export const films: Film[] = [
  {
    title: "Fight Club",
    kind: "film",
    year: "1999",
    length: "2h 19m",
    poster: "/about/films/fight-club.webp",
    glow: "#e0508a",
    tint: "#3a2a2a",
  },
  {
    title: "Athadu",
    kind: "film",
    year: "2005",
    length: "2h 52m",
    poster: "/about/films/athadu.webp",
    glow: "#1dbfe1",
    tint: "#1a2230",
  },
  {
    title: "Cars",
    kind: "film",
    year: "2006",
    length: "1h 57m",
    poster: "/about/films/cars.webp",
    glow: "#e11e2e",
    tint: "#e81828",
  },
  {
    title: "(500) Days of Summer",
    kind: "film",
    year: "2009",
    length: "1h 35m",
    poster: "/about/films/500-days-of-summer.webp",
    glow: "#48a2e1",
    tint: "#d8d0c0",
  },
  {
    title: "Interstellar",
    kind: "film",
    year: "2014",
    length: "2h 49m",
    poster: "/about/films/interstellar.webp",
    glow: "#ccdae1",
    tint: "#d8e8e8",
  },
  {
    title: "Coco",
    kind: "film",
    year: "2017",
    length: "1h 45m",
    poster: "/about/films/coco.webp",
    glow: "#e17b1d",
    tint: "#180858",
  },
  {
    title: "The Lion King",
    kind: "film",
    year: "2019",
    length: "1h 58m",
    poster: "/about/films/the-lion-king.webp",
    glow: "#e19a4c",
    tint: "#5a4020",
  },
  {
    title: "The Batman",
    kind: "film",
    year: "2022",
    length: "2h 56m",
    poster: "/about/films/the-batman.webp",
    glow: "#e11716",
    tint: "#380808",
  },
  {
    title: "The Big Bang Theory",
    kind: "series",
    year: "2007–2019",
    length: "12 seasons",
    poster: "/about/films/the-big-bang-theory.webp",
    glow: "#e18738",
    tint: "#d86828",
  },
  {
    title: "Breaking Bad",
    kind: "series",
    year: "2008–2013",
    length: "5 seasons",
    poster: "/about/films/breaking-bad.webp",
    glow: "#e1c90e",
    tint: "#2a3a1a",
  },
  {
    title: "Brooklyn Nine-Nine",
    kind: "series",
    year: "2013–2021",
    length: "8 seasons",
    poster: "/about/films/brooklyn-nine-nine.webp",
    glow: "#e1cd49",
    tint: "#f8e848",
  },
  {
    title: "Loki",
    kind: "series",
    year: "2021–2023",
    length: "2 seasons",
    poster: "/about/films/loki.webp",
    glow: "#e18b39",
    tint: "#3a2a10",
  },
];

/** A game, ranked by how much it's played. `icon` is a square app icon in
 *  /public/about/games; until one exists the card draws a placeholder from `color`. */
export interface Game {
  name: string;
  genre: string;
  color: string;
  icon?: string;
  link?: string;
}

// Thakur's most-played, in his order.
export const games: Game[] = [
  {
    name: "Red Dead Redemption 2",
    genre: "Outlaw western",
    color: "#a8261b",
    icon: "/about/games/red-dead-redemption-2.avif",
  },
  {
    name: "Call of Duty: Mobile",
    genre: "Multiplayer shooter",
    color: "#4a5160",
    icon: "/about/games/call-of-duty-mobile.jpg",
  },
  {
    name: "Batman: Arkham Knight",
    genre: "Open-world action",
    color: "#27344c",
    icon: "/about/games/batman-arkham-knight.avif",
  },
  {
    name: "Stray",
    genre: "Neon cat adventure",
    color: "#c45a24",
    icon: "/about/games/stray.jpg",
  },
];
