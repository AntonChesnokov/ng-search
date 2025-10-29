# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-29

### Added
- Initial release of @ng-search/core
- SearchBox component with debouncing and keyboard navigation
- Suggestions component with custom templates and keyboard navigation
- Results component with pagination and virtual scrolling support
- SearchStateService for signal-based state management
- SearchCoordinatorService for search orchestration
- FacetRegistryService for plugin system
- SSRSafeService for server-side rendering support
- BaseHttpAdapter and RestApiAdapter for backend integration
- Comprehensive TypeScript types and interfaces
- Utility functions for debouncing, keyboard navigation, and text highlighting
- Full SSR compatibility
- Zone-less compatible implementation
- 85+ unit tests with full coverage

### Features
- ✨ Modern Angular 20 APIs (signals, input/output functions, standalone components)
- 🎯 Signal-based state management
- ⚡ Deferrable views with @defer blocks
- 🌐 Full SSR support
- 🔌 Backend-agnostic adapter pattern
- 🎨 Customizable templates for all components
- ⌨️ Full keyboard navigation support
- ♿ ARIA accessibility support
- 📱 Responsive design
- 🚀 Performance optimized with virtual scrolling
- 🌳 Tree-shakeable architecture

## [Unreleased]

### Planned
- Facet components (checkbox, range, toggle)
- Enhanced plugin system
- More adapters (Elasticsearch, OpenSearch, Algolia)
- Additional examples and documentation
- Performance benchmarks
- E2E tests
- Accessibility audit
