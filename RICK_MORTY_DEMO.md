# Rick and Morty Search Demo

This demo showcases the `@ng-search/core` library integrated with the [Rick and Morty API](https://rickandmortyapi.com/).

## Features

### Real API Integration
- Connects to the official Rick and Morty REST API
- Searches through 826+ characters from the multiverse
- Real-time data fetching with HttpClient

### Search Capabilities
- **Name Search**: Search characters by name (e.g., "Rick", "Morty", "Summer")
- **Filters**: 
  - **Status**: Alive, Dead, Unknown
  - **Gender**: Male, Female, Genderless, Unknown
- **Pagination**: Browse through results with built-in pagination (20 items per page)

### Auto-Suggestions
- Type-ahead suggestions as you search
- Shows character avatars inline
- Displays species and status information
- Automatically fetches matching characters from the API

### Visual Design
- Dark theme inspired by the show's aesthetic
- Character cards with:
  - High-quality character images
  - Status badges (Alive/Dead/Unknown)
  - Detailed information (species, gender, origin, location)
  - Episode appearance counts
  - Direct links to API data

## Technical Implementation

### Adapter Pattern
The `RickMortySearchAdapter` implements the `SearchAdapter` interface to:
- Transform search queries into API-compatible requests
- Handle pagination (converting from/size to page numbers)
- Apply filters (status, species, gender, type)
- Process API responses into the library's `SearchResponse` format
- Provide character suggestions based on name search

### API Integration
```typescript
// Base URL
https://rickandmortyapi.com/api

// Character endpoint
GET /character?name=rick&status=alive&page=1

// Response structure
{
  info: {
    count: 826,
    pages: 42,
    next: "...",
    prev: "..."
  },
  results: [
    {
      id: 1,
      name: "Rick Sanchez",
      status: "Alive",
      species: "Human",
      gender: "Male",
      origin: { name: "Earth (C-137)", url: "..." },
      location: { name: "Earth", url: "..." },
      image: "https://...",
      episode: ["...", "..."],
      url: "...",
      created: "..."
    }
  ]
}
```

### Filter Implementation
Filters use the library's `FilterConfig` type and are mapped to API query parameters:

```typescript
// Status filter
addFilter({ field: 'status', value: 'alive', type: 'term' })
→ API: ?status=alive

// Gender filter  
addFilter({ field: 'gender', value: 'male', type: 'term' })
→ API: ?gender=male
```

### Error Handling
- 404 responses (no matches) return empty results instead of throwing errors
- Network errors are properly caught and logged
- Loading states displayed during API calls

## Files Structure

```
src/app/
├── rick-morty-search.adapter.ts       # API adapter implementation
├── rick-morty-demo/
│   ├── rick-morty-demo.component.ts   # Demo component logic
│   ├── rick-morty-demo.component.html # Character card templates
│   └── rick-morty-demo.component.css  # Dark theme styling
└── app.routes.ts                       # Route configuration
```

## Usage

Navigate to `/rick-morty` to access the demo, or click the "Try Rick & Morty Demo" link from the home page.

### Try These Searches
- `rick` - Find all variations of Rick
- `morty` - Find all Morty characters  
- `summer` - Find Summer Smith and variations
- `beth` - Find Beth Smith and clones
- `jerry` - Find Jerry Smith
- Filter by "Alive" + "Male" to find living male characters
- Filter by "Dead" to see deceased characters

## API Credits

This demo uses the free [Rick and Morty API](https://rickandmortyapi.com/) created by [Axel Fuhrmann](https://github.com/afuh).

- 826 Characters
- 126 Locations  
- 51 Episodes
- No authentication required
- Rate limiting: Be respectful with requests

## Learning Points

This demo demonstrates:
1. **Real API Integration**: Unlike the Angular demo with mock data, this connects to a real REST API
2. **HTTP Client Setup**: Shows proper HttpClient configuration with `provideHttpClient(withFetch())`
3. **Filter Mapping**: Transforms library filters to API-specific query parameters
4. **Error Handling**: Graceful handling of API errors and edge cases
5. **Custom Templates**: Rich character cards with images, badges, and metadata
6. **Dark Theme**: Custom styling that matches the component library's flexibility
7. **Navigation**: Multi-page app structure with Angular Router

## Performance

- API responses cached by browser
- Images lazy-loaded
- Debounced search input (300ms)
- Suggestions limited to 8 items
- Pagination reduces data transfer

## Next Steps

To extend this demo, you could add:
- Episode search functionality
- Location search
- Advanced filters (species, type)
- Character comparison feature
- Favorite characters list
- Search history
- Character details modal/page
