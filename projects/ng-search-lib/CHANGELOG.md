# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2025-10-29

### Added

- Initial release of @chesnokovtony/ng-search
- SearchBox component with debouncing and keyboard navigation
- Suggestions component with custom templates and keyboard navigation
- Results component with pagination
- Facet system with built-in components (text, text-typeahead, number, number-range)
- FacetsContainer, FacetWrapper, and AppliedFilters components
- SearchStateService for signal-based state management
- SearchCoordinatorService for search orchestration
- FacetManagerService for facet state management
- FacetRegistryService for plugin system
- SSRSafeService for server-side rendering support
- BaseHttpAdapter and RestApiAdapter for backend integration
- Comprehensive TypeScript types and interfaces
- Utility functions for debouncing, keyboard navigation, text highlighting, and facet operations
- Full SSR compatibility
- Zone-less compatible implementation

### Features

- ✨ Modern Angular 20 APIs (signals, input/output functions, standalone components)
- 🎯 Signal-based state management
- ⚡ Deferrable views with @defer blocks
- 🌐 Full SSR support
- 🔌 Backend-agnostic adapter pattern
- 🎨 Customizable templates for all components
- 🎨 Tokenized styling system with CSS Custom Properties and Cascade Layers
- 🌙 Dark mode and theming support
- 🔍 Complete facet system with plugin architecture
- ⌨️ Full keyboard navigation support
- ♿ ARIA accessibility support
- 📱 Responsive design with logical properties (RTL ready)
- 🌳 Tree-shakeable architecture

## [Unreleased]

### Planned

- Additional facet types (date-range, hierarchical)
- More adapters (Elasticsearch, OpenSearch, Algolia)
- Additional examples and documentation
- Performance benchmarks
- E2E tests
- Enhanced accessibility audit
