# NgSearch

NgSearch is an Angular-first search experience toolkit that helps teams ship rich, faceted search interfaces with minimal setup. The repository hosts both the reusable `@chesnokovtony/ng-search` library and a demo application that showcases typical integrations.

**[🚀 View Live Demo](https://ng-search.vercel.app/)**

## Table of contents

- [Project structure](#project-structure)
- [Features](#features)
- [Getting started](#getting-started)
- [Using the library](#using-the-library)
- [Available scripts](#available-scripts)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Project structure

```
.
├── projects/ng-search-lib   # Source for the publishable Angular library
├── src/                     # Demo application bootstrapping the library
└── public/                  # Static assets served by the demo app
```

## Features

- **Complete search UI** - Search box, autocomplete suggestions, results display, and faceted filtering
- **Modern Angular** - Built with Angular 20+ signals and standalone components
- **Backend agnostic** - Adapter-based design works with any REST API or search service
- **Customizable** - Full template customization and theming support
- **SSR ready** - Server-side rendering compatible

## Getting started

### Prerequisites

- Node.js 18.18 or newer
- npm 9+ (or a compatible package manager)

### Installation

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/AntonChesnokov/ng-search.git
   cd ng-search
   npm install
   ```
2. Start the demo application in development mode:
   ```bash
   npm start
   ```
3. Navigate to [http://localhost:4200](http://localhost:4200) to explore the demo experience. Changes to source files trigger automatic reloads.

### Building for production

- Build the demo application: `npm run build`
- Build the library for distribution: `ng build ng-search-lib`
  The compiled artifacts will be generated under `dist/`.

## Using the library

Install the package (after publishing) in your Angular workspace:

```bash
npm install @chesnokovtony/ng-search
```

Provide the search services at application bootstrap:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideSearch, RestApiAdapter } from '@chesnokovtony/ng-search';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideSearch({
      adapter: () => new RestApiAdapter({ endpoint: 'https://api.example.com/search' }),
      config: {
        debounceTime: 250,
        pageSize: 20,
      },
    }),
  ],
};
```

Consume the search provider and UI components inside a feature component:

```ts
import { Component, inject } from '@angular/core';
import { SearchProvider, SearchBoxComponent, ResultsComponent } from '@chesnokovtony/ng-search';

@Component({
  selector: 'app-catalog-search',
  standalone: true,
  imports: [SearchBoxComponent, ResultsComponent],
  template: `
    <ng-search-box (submit)="onSearch($event)"></ng-search-box>
    <ng-search-results></ng-search-results>
  `,
})
export class CatalogSearchComponent {
  private search = inject(SearchProvider);

  onSearch(query: string) {
    this.search.state.setQuery(query);
    this.search.executeSearch();
  }
}
```

Refer to `projects/ng-search-lib/src/lib` for additional configuration options, adapters, and facet implementations.

## Available scripts

| Command                       | Description                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| `npm start`                   | Run the demo app with live reload at `http://localhost:4200`. |
| `npm run build`               | Produce a production build of the demo application.           |
| `npm run watch`               | Rebuild on file changes using the development configuration.  |
| `npm test`                    | Execute unit tests with Karma.                                |
| `ng build ng-search-lib`      | Build the library into `dist/ng-search-lib`.                  |
| `npm run serve:ssr:ng-search` | Serve the SSR bundle from `dist/ng-search`.                   |

## Testing

- **Unit tests:** `npm test`
- **End-to-end tests:** configure your preferred runner (e.g., Playwright or Cypress) and add scripts under `package.json`.
- **Library consumers:** add integration tests to ensure adapters and facets behave as expected in host applications.

## Contributing

Community contributions are welcome! Before submitting a pull request:

1. Review the project roadmap and open issues.
2. Discuss significant changes by opening a GitHub issue first.
3. Follow the established coding standards and include tests for new behavior.
4. Run the relevant scripts listed above to ensure the build passes locally.

Guides for contributors, code of conduct, and issue templates should live alongside this README to keep the process transparent for newcomers.

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Contributing

Interested in helping out? Please review the [CONTRIBUTING.md](./CONTRIBUTING.md) guide for environment setup, branching strategy, commit conventions, and review expectations. Our community standards are defined in the [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

### GitHub Repository Description

Set the repository description to point new visitors to these resources, for example:

> Developer resources and contribution guidelines — see CONTRIBUTING.md and CODE_OF_CONDUCT.md

Updating the description in GitHub keeps the project homepage aligned with the documentation above.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
