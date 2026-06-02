import { CreateItemInput } from '../types';

export interface TMDbItem {
  externalId: string;
  title: string;
  type: 'movie' | 'series';
  releaseYear?: number;
  posterUrl?: string;
  description?: string;
}

// In-memory caches to save API requests
const searchCache = new Map<string, TMDbItem[]>();
const detailsCache = new Map<string, TMDbItem>();

const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
const isMockMode = !API_KEY || API_KEY === 'your-tmdb-api-key';

// Mock database for offline/no-API-key testing
const MOCK_ITEMS: TMDbItem[] = [
  {
    externalId: 'tmdb:movie:27205',
    title: 'Inception',
    type: 'movie',
    releaseYear: 2010,
    posterUrl: 'https://image.tmdb.org/t/p/w500/o0xxnvXh5vJU5r4eHM1I4ccRi5q.jpg',
    description: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life as payment for a task considered to be impossible: "inception", the implantation of another person\'s idea into a target\'s subconscious.',
  },
  {
    externalId: 'tmdb:series:1396',
    title: 'Breaking Bad',
    type: 'series',
    releaseYear: 2008,
    posterUrl: 'https://image.tmdb.org/t/p/w500/ztkUQvmg16736eJvQ6of2Zqd64g.jpg',
    description: 'Walter White, a chemistry teacher, discovers he has cancer and decides to get into the meth-making business to repay his medical debts. His priorities begin to change when he partners with Jesse Pinkman.',
  },
  {
    externalId: 'tmdb:movie:157336',
    title: 'Interstellar',
    type: 'movie',
    releaseYear: 2014,
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QvEOmfcFGlsjH2j2vFj6eJ5.jpg',
    description: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
  },
  {
    externalId: 'tmdb:movie:155',
    title: 'The Dark Knight',
    type: 'movie',
    releaseYear: 2008,
    posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tWw3YiO1NMLssgPo2mHZuV7C.jpg',
    description: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.',
  },
  {
    externalId: 'tmdb:movie:603',
    title: 'The Matrix',
    type: 'movie',
    releaseYear: 1999,
    posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3w7n07E592W7n7e6vzngHQg.jpg',
    description: 'Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.',
  },
  {
    externalId: 'tmdb:series:76479',
    title: 'The Boys',
    type: 'series',
    releaseYear: 2019,
    posterUrl: 'https://image.tmdb.org/t/p/w500/77n5Ur6sbJ02v1o4uc9u9EvI17v.jpg',
    description: 'A fun and irreverent take on what happens when superheroes—who are as popular as celebrities, as influential as politicians, and as revered as gods—abuse their superpowers rather than use them for good.',
  },
  {
    externalId: 'tmdb:series:66732',
    title: 'Stranger Things',
    type: 'series',
    releaseYear: 2016,
    posterUrl: 'https://image.tmdb.org/t/p/w500/49WJfeN0mhmFBQHeeB01JjCklJu.jpg',
    description: 'When a young boy vanishes, a town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
  },
];

/**
 * Searches TMDb for movies and series matching the query.
 * Falls back to local mock data if no API key is configured.
 */
export async function searchTMDb(query: string, type: 'movie' | 'series'): Promise<TMDbItem[]> {
  if (!query.trim()) return [];

  const cacheKey = `${type}:${query.toLowerCase().trim()}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  let results: TMDbItem[] = [];

  if (isMockMode) {
    // Basic local filter for mock support
    const normalizedQuery = query.toLowerCase().trim();
    results = MOCK_ITEMS.filter(
      (item) =>
        item.type === type &&
        item.title.toLowerCase().includes(normalizedQuery)
    );
  } else {
    try {
      const tmdbType = type === 'movie' ? 'movie' : 'tv';
      const url = `https://api.themoviedb.org/3/search/${tmdbType}?api_key=${API_KEY}&query=${encodeURIComponent(
        query
      )}&include_adult=false`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`TMDb API responded with status: ${response.status}`);
      }

      const data = await response.json();
      const rawResults = data.results || [];

      results = rawResults.map((item: any) => {
        const title = type === 'movie' ? item.title : item.name;
        const releaseDate = type === 'movie' ? item.release_date : item.first_air_date;
        const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : undefined;
        const posterUrl = item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : undefined;

        const tmdbItem: TMDbItem = {
          externalId: `tmdb:${type}:${item.id}`,
          title: title || 'Unknown Title',
          type,
          releaseYear,
          posterUrl,
          description: item.overview || undefined,
        };

        // Cache details proactively
        detailsCache.set(tmdbItem.externalId, tmdbItem);

        return tmdbItem;
      });
    } catch (error) {
      console.error('Error fetching from TMDb API:', error);
      // Fail gracefully and return matching mock items instead of crashing
      const normalizedQuery = query.toLowerCase().trim();
      results = MOCK_ITEMS.filter(
        (item) =>
          item.type === type &&
          item.title.toLowerCase().includes(normalizedQuery)
      );
    }
  }

  searchCache.set(cacheKey, results);
  return results;
}

/**
 * Gets details for a specific TMDb item.
 */
export async function getTMDbDetails(externalId: string): Promise<TMDbItem | null> {
  if (detailsCache.has(externalId)) {
    return detailsCache.get(externalId)!;
  }

  // Parse external ID (e.g. tmdb:movie:12345)
  const parts = externalId.split(':');
  if (parts.length !== 3 || parts[0] !== 'tmdb') {
    return null;
  }

  const type = parts[1] as 'movie' | 'series';
  const idStr = parts[2];

  if (isMockMode) {
    const matched = MOCK_ITEMS.find((item) => item.externalId === externalId);
    return matched || null;
  }

  try {
    const tmdbType = type === 'movie' ? 'movie' : 'tv';
    const url = `https://api.themoviedb.org/3/${tmdbType}/${idStr}?api_key=${API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDb API responded with status: ${response.status}`);
    }

    const item = await response.json();
    const title = type === 'movie' ? item.title : item.name;
    const releaseDate = type === 'movie' ? item.release_date : item.first_air_date;
    const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : undefined;
    const posterUrl = item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : undefined;

    const tmdbItem: TMDbItem = {
      externalId,
      title: title || 'Unknown Title',
      type,
      releaseYear,
      posterUrl,
      description: item.overview || undefined,
    };

    detailsCache.set(externalId, tmdbItem);
    return tmdbItem;
  } catch (error) {
    console.error('Error fetching TMDb details:', error);
    // Graceful fallback to mock data
    const matched = MOCK_ITEMS.find((item) => item.externalId === externalId);
    return matched || null;
  }
}
