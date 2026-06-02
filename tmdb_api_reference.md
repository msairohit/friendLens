# TMDb API Response Reference

This file documents the fields returned by the TMDb API for movies and TV shows, along with sample response objects, to assist in implementing future features like internet ratings or additional metadata.

---

## 1. Available API Response Fields

### Search Results (`/search/movie` & `/search/tv`)
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `integer` | Unique TMDb ID. |
| `title` / `name` | `string` | The title of the movie / TV show. |
| `release_date` / `first_air_date` | `string` | Release date (e.g., `2010-07-16`). |
| `poster_path` | `string` | Path suffix for the poster image (e.g., `/o0xxnvXh5vJU5r4eHM1I4ccRi5q.jpg`). |
| `backdrop_path` | `string` | Path suffix for the banner backdrop image. |
| `vote_average` | `number` | **Average user rating from 0.0 to 10.0.** |
| `vote_count` | `integer` | Total number of user ratings/votes. |
| `overview` | `string` | A brief text synopsis/description. |
| `popularity` | `number` | Popularity score calculated by TMDb. |
| `genre_ids` | `array[integer]` | List of genre IDs mapping to categories. |

### Detail Queries (`/movie/{id}` & `/tv/{id}`)
All the search fields above, plus:
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `genres` | `array[object]` | Full list of genre details, e.g., `[{"id": 28, "name": "Action"}]`. |
| `tagline` | `string` | Short promotional catchphrase/tagline. |
| `runtime` (movie only) | `integer` | Movie length in minutes. |
| `episode_run_time` (tv only) | `array[integer]` | Typical length of an episode in minutes. |
| `number_of_seasons` (tv only) | `integer` | Total count of seasons. |
| `number_of_episodes` (tv only) | `integer` | Total count of episodes. |
| `status` | `string` | Production status (e.g. `Released`, `In Production`). |
| `imdb_id` | `string` | The IMDB identifier (useful to fetch IMDB ratings or link to IMDB). |
| `budget` & `revenue` | `integer` | Budget and box office gross in USD. |
| `production_companies` | `array[object]` | Names and details of studios involved. |

---

## 2. Sample JSON Responses

### Search Results (Movie)
```json
{
  "page": 1,
  "results": [
    {
      "adult": false,
      "backdrop_path": "/s3TBrRGB19xp75hlJukl1m4I7tI.jpg",
      "genre_ids": [28, 12, 878, 53],
      "id": 27205,
      "original_language": "en",
      "original_title": "Inception",
      "overview": "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life as payment for a task considered to be impossible: \"inception\", the implantation of another person's idea into a target's subconscious.",
      "popularity": 83.123,
      "poster_path": "/o0xxnvXh5vJU5r4eHM1I4ccRi5q.jpg",
      "release_date": "2010-07-15",
      "title": "Inception",
      "video": false,
      "vote_average": 8.364,
      "vote_count": 35789
    }
  ],
  "total_pages": 1,
  "total_results": 1
}
```

### Movie Details (Full)
```json
{
  "adult": false,
  "backdrop_path": "/s3TBrRGB19xp75hlJukl1m4I7tI.jpg",
  "belongs_to_collection": null,
  "budget": 160000000,
  "genres": [
    { "id": 28, "name": "Action" },
    { "id": 12, "name": "Adventure" },
    { "id": 878, "name": "Science Fiction" }
  ],
  "homepage": "https://www.warnerbros.com/movies/inception",
  "id": 27205,
  "imdb_id": "tt1375666",
  "original_language": "en",
  "original_title": "Inception",
  "overview": "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life as payment for a task considered to be impossible: \"inception\", the implantation of another person's idea into a target's subconscious.",
  "popularity": 83.123,
  "poster_path": "/o0xxnvXh5vJU5r4eHM1I4ccRi5q.jpg",
  "production_companies": [
    { "id": 923, "name": "Legendary Pictures" },
    { "id": 9996, "name": "Syncopy" }
  ],
  "release_date": "2010-07-15",
  "revenue": 825532764,
  "runtime": 148,
  "status": "Released",
  "tagline": "Your mind is the scene of the crime.",
  "title": "Inception",
  "video": false,
  "vote_average": 8.364,
  "vote_count": 35789
}
```
