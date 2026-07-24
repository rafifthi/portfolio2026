// Content for the Netflix app window.
// Edit the two arrays below to change the Top 10 lists — ranks drive the big
// numerals, `poster`/`backdrop` are TMDB image file paths (copy them from any
// title page on themoviedb.org).
//
// These arrays are the fallback shown when the CMS has no published Netflix
// entries (or the database is unavailable). Published entries edited in
// /admin take precedence via `buildNetflixLists`.

import type { CmsEntry, NetflixTitleData } from "./cms";

export interface NetflixTitle {
  id: string;
  rank: number;
  kind: "movie" | "series";
  myList?: boolean;
  title: string;
  year: number;
  maturity: string;
  duration: string;
  match: number;
  genres: string[];
  cast: string[];
  description: string;
  poster: string;
  backdrop: string;
}

const TMDB = "https://image.tmdb.org/t/p";

export const posterUrl = (path: string) => `${TMDB}/w500${path}`;
export const backdropUrl = (path: string, size: "w780" | "w1280" = "w780") =>
  `${TMDB}/${size}${path}`;

export const netflixMovies: NetflixTitle[] = [
  {
    id: "inception",
    rank: 1,
    kind: "movie",
    title: "Inception",
    year: 2010,
    maturity: "PG-13",
    duration: "2h 28m",
    match: 98,
    genres: ["Sci-Fi", "Action", "Thriller"],
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
    description:
      "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O. — but his tragic past may doom the mission from the start.",
    poster: "/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg",
    backdrop: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
  },
  {
    id: "the-dark-knight",
    rank: 2,
    kind: "movie",
    title: "The Dark Knight",
    year: 2008,
    maturity: "PG-13",
    duration: "2h 32m",
    match: 97,
    genres: ["Action", "Crime", "Drama"],
    cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart"],
    description:
      "Batman raises the stakes in his war on crime, but soon finds himself prey to a reign of chaos unleashed by a rising criminal mastermind known as the Joker.",
    poster: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop: "/dqK9Hag1054tghRQSqLSfrkvQnA.jpg",
  },
  {
    id: "interstellar",
    rank: 3,
    kind: "movie",
    title: "Interstellar",
    year: 2014,
    maturity: "PG-13",
    duration: "2h 49m",
    match: 97,
    genres: ["Sci-Fi", "Adventure", "Drama"],
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"],
    description:
      "With humanity's time on Earth coming to an end, a team of explorers travels through a wormhole in search of a new home among the stars — while a father races time itself to keep a promise to his daughter.",
    poster: "/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg",
    backdrop: "/5XNQBqnBwPA9yT0jZ0p3s8bbLh0.jpg",
  },
  {
    id: "parasite",
    rank: 4,
    kind: "movie",
    title: "Parasite",
    year: 2019,
    maturity: "R",
    duration: "2h 12m",
    match: 96,
    genres: ["Thriller", "Drama", "Dark Comedy"],
    cast: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong"],
    description:
      "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan — until a hidden secret upends everything.",
    poster: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    backdrop: "/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg",
  },
  {
    id: "whiplash",
    rank: 5,
    kind: "movie",
    title: "Whiplash",
    year: 2014,
    maturity: "R",
    duration: "1h 47m",
    match: 95,
    genres: ["Drama", "Music"],
    cast: ["Miles Teller", "J.K. Simmons", "Melissa Benoist"],
    description:
      "A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by a ruthless instructor who will stop at nothing to realize a student's potential.",
    poster: "/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
    backdrop: "/wbQa0EnWUyRzQ5d1pHLNRlmsCUP.jpg",
  },
  {
    id: "mad-max-fury-road",
    rank: 6,
    kind: "movie",
    title: "Mad Max: Fury Road",
    year: 2015,
    maturity: "R",
    duration: "2h 1m",
    match: 94,
    genres: ["Action", "Sci-Fi", "Adventure"],
    cast: ["Tom Hardy", "Charlize Theron", "Nicholas Hoult"],
    description:
      "In a post-apocalyptic wasteland, Max teams up with the mysterious Furiosa to flee a tyrannical warlord in a high-octane road war aboard an armored war rig.",
    poster: "/ulcAi4dKpAjHwYGS08vNyx9H6I9.jpg",
    backdrop: "/uT895WNwm0aIJRtGizcQhrejWUo.jpg",
  },
  {
    id: "spirited-away",
    rank: 7,
    kind: "movie",
    title: "Spirited Away",
    year: 2001,
    maturity: "PG",
    duration: "2h 5m",
    match: 96,
    genres: ["Animation", "Fantasy", "Adventure"],
    cast: ["Rumi Hiiragi", "Miyu Irino", "Mari Natsuki"],
    description:
      "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits — a world where humans are changed into beasts.",
    poster: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    backdrop: "/dyJvKsNs2KP8qQnAXbRwDjblViy.jpg",
  },
  {
    id: "the-social-network",
    rank: 8,
    kind: "movie",
    title: "The Social Network",
    year: 2010,
    maturity: "PG-13",
    duration: "2h 0m",
    match: 93,
    genres: ["Drama", "Biography"],
    cast: ["Jesse Eisenberg", "Andrew Garfield", "Justin Timberlake"],
    description:
      "The story of how Harvard student Mark Zuckerberg created the social networking site that would become Facebook — and the lawsuits and broken friendships that followed.",
    poster: "/n0ybibhJtQ5icDqTp8eRytcIHJx.jpg",
    backdrop: "/1PXwh3nJzgRkkYnqfWInJNypeL4.jpg",
  },
  {
    id: "everything-everywhere",
    rank: 9,
    kind: "movie",
    title: "Everything Everywhere All at Once",
    year: 2022,
    maturity: "R",
    duration: "2h 19m",
    match: 95,
    genres: ["Sci-Fi", "Comedy", "Drama"],
    cast: ["Michelle Yeoh", "Ke Huy Quan", "Stephanie Hsu"],
    description:
      "An aging Chinese immigrant is swept up in an insane adventure, in which she alone can save the multiverse by exploring the lives she could have led.",
    poster: "/u68AjlvlutfEIcpmbYpKcdi09ut.jpg",
    backdrop: "/ss0Os3uWJfQAENILHZUdX8Tt1OC.jpg",
  },
  {
    id: "dune-part-two",
    rank: 10,
    kind: "movie",
    title: "Dune: Part Two",
    year: 2024,
    maturity: "PG-13",
    duration: "2h 47m",
    match: 94,
    genres: ["Sci-Fi", "Adventure"],
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
    description:
      "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family — and faces a choice between the love of his life and the fate of the known universe.",
    poster: "/uOYAbN3F5n3ne8TzWjzVEvQ7XGX.jpg",
    backdrop: "/eZ239CUp1d6OryZEBPnO2n87gMG.jpg",
  },
];

export const netflixSeries: NetflixTitle[] = [
  {
    id: "breaking-bad",
    rank: 1,
    kind: "series",
    title: "Breaking Bad",
    year: 2008,
    maturity: "TV-MA",
    duration: "5 Seasons",
    match: 99,
    genres: ["Crime", "Drama", "Thriller"],
    cast: ["Bryan Cranston", "Aaron Paul", "Anna Gunn"],
    description:
      "A high school chemistry teacher diagnosed with terminal cancer turns to manufacturing methamphetamine to secure his family's future — and descends into the criminal underworld.",
    poster: "/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
    backdrop: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
  },
  {
    id: "stranger-things",
    rank: 2,
    kind: "series",
    title: "Stranger Things",
    year: 2016,
    maturity: "TV-14",
    duration: "5 Seasons",
    match: 96,
    genres: ["Sci-Fi", "Horror", "Drama"],
    cast: ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder"],
    description:
      "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.",
    poster: "/uOOtwVbSr4QDjAGIifLDwpb2Pdl.jpg",
    backdrop: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
  },
  {
    id: "dark",
    rank: 3,
    kind: "series",
    title: "Dark",
    year: 2017,
    maturity: "TV-MA",
    duration: "3 Seasons",
    match: 97,
    genres: ["Sci-Fi", "Mystery", "Thriller"],
    cast: ["Louis Hofmann", "Lisa Vicari", "Maja Schöne"],
    description:
      "A missing child sets four families on a frantic hunt for answers as they unearth a mind-bending mystery that spans three generations — and breaks the boundaries of time itself.",
    poster: "/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg",
    backdrop: "/3jDXL4Xvj3AzDOF6UH1xeyHW8MH.jpg",
  },
  {
    id: "arcane",
    rank: 4,
    kind: "series",
    title: "Arcane",
    year: 2021,
    maturity: "TV-14",
    duration: "2 Seasons",
    match: 98,
    genres: ["Animation", "Action", "Fantasy"],
    cast: ["Hailee Steinfeld", "Ella Purnell", "Katie Leung"],
    description:
      "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and clashing convictions.",
    poster: "/abf8tHznhSvl9BAElD2cQeRr7do.jpg",
    backdrop: "/q8eejQcg1bAqImEV8jh8RtBD4uH.jpg",
  },
  {
    id: "squid-game",
    rank: 5,
    kind: "series",
    title: "Squid Game",
    year: 2021,
    maturity: "TV-MA",
    duration: "3 Seasons",
    match: 94,
    genres: ["Thriller", "Drama", "Survival"],
    cast: ["Lee Jung-jae", "Park Hae-soo", "Jung Ho-yeon"],
    description:
      "Hundreds of cash-strapped players accept a strange invitation to compete in children's games for a tempting prize — but the stakes are deadly.",
    poster: "/rwzxy5DgbpAEscbzjhJxay5Qvb7.jpg",
    backdrop: "/2meX1nMdScFOoV4370rqHWKmXhY.jpg",
  },
  {
    id: "money-heist",
    rank: 6,
    kind: "series",
    title: "Money Heist",
    year: 2017,
    maturity: "TV-MA",
    duration: "5 Parts",
    match: 93,
    genres: ["Crime", "Thriller", "Drama"],
    cast: ["Úrsula Corberó", "Álvaro Morte", "Itziar Ituño"],
    description:
      "Eight thieves take hostages and lock themselves in the Royal Mint of Spain as a criminal mastermind manipulates the police to carry out his plan.",
    poster: "/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg",
    backdrop: "/gFZriCkpJYsApPZEF3jhxL4yLzG.jpg",
  },
  {
    id: "better-call-saul",
    rank: 7,
    kind: "series",
    title: "Better Call Saul",
    year: 2015,
    maturity: "TV-MA",
    duration: "6 Seasons",
    match: 97,
    genres: ["Crime", "Drama"],
    cast: ["Bob Odenkirk", "Rhea Seehorn", "Jonathan Banks"],
    description:
      "The trials and tribulations of criminal lawyer Jimmy McGill in the years leading up to his fateful run-in with Walter White and Jesse Pinkman.",
    poster: "/zjg4jpK1Wp2kiRvtt5ND0kznako.jpg",
    backdrop: "/rfxryDIv8huejujg4JueDJx8zCz.jpg",
  },
  {
    id: "the-last-of-us",
    rank: 8,
    kind: "series",
    title: "The Last of Us",
    year: 2023,
    maturity: "TV-MA",
    duration: "2 Seasons",
    match: 95,
    genres: ["Drama", "Sci-Fi", "Post-Apocalyptic"],
    cast: ["Pedro Pascal", "Bella Ramsey", "Anna Torv"],
    description:
      "Twenty years after modern civilization has been destroyed, a hardened survivor is hired to smuggle a 14-year-old girl out of an oppressive quarantine zone — a brutal journey that becomes something more.",
    poster: "/dmo6TYuuJgaYinXBPjrgG9mB5od.jpg",
    backdrop: "/acevLdSl5I2MK5RYAm7gwAndt1w.jpg",
  },
  {
    id: "black-mirror",
    rank: 9,
    kind: "series",
    title: "Black Mirror",
    year: 2011,
    maturity: "TV-MA",
    duration: "7 Seasons",
    match: 92,
    genres: ["Sci-Fi", "Anthology", "Thriller"],
    cast: ["Various cast", "Anthology series"],
    description:
      "An anthology series exploring a twisted, high-tech multiverse where humanity's greatest innovations and darkest instincts collide.",
    poster: "/seN6rRfN0I6n8iDXjlSMk1QjNcq.jpg",
    backdrop: "/dg3OindVAGZBjlT3xYKqIAdukPL.jpg",
  },
  {
    id: "narcos",
    rank: 10,
    kind: "series",
    title: "Narcos",
    year: 2015,
    maturity: "TV-MA",
    duration: "3 Seasons",
    match: 93,
    genres: ["Crime", "Drama", "Biography"],
    cast: ["Wagner Moura", "Pedro Pascal", "Boyd Holbrook"],
    description:
      "The true-life story of the growth and spread of cocaine drug cartels across the globe, and the efforts of law enforcement to bring down the infamous Pablo Escobar.",
    poster: "/rTmal9fDbwh5F0waol2hq35U4ah.jpg",
    backdrop: "/y9ekzkPFmWSqUU3Kj0wHmYUM8qu.jpg",
  },
];

// Build the movies/series lists shown in the app from published CMS entries,
// falling back per-kind to the static arrays above when a kind has no entries.
// Entries arrive already ordered by sort_order; rank is derived from position.
export function buildNetflixLists(entries: CmsEntry<NetflixTitleData>[]) {
  const allForKind = (kind: "movie" | "series"): NetflixTitle[] =>
    entries
      .filter((entry) => entry.data.kind === kind)
      .map((entry, index) => ({
        id: entry.slug,
        rank: index + 1,
        title: entry.title,
        ...entry.data,
      }));

  const allMovies = allForKind("movie");
  const allSeries = allForKind("series");
  const forKind = (list: NetflixTitle[], fallback: NetflixTitle[]) => {
    const visible = list.slice(0, 10);
    return visible.length ? visible : fallback;
  };

  return {
    movies: forKind(allMovies, netflixMovies),
    series: forKind(allSeries, netflixSeries),
    myList: [...allMovies, ...allSeries].filter((title) => title.myList),
  };
}
