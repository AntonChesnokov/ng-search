# Publishing Guide for @ng-search/core

## Pre-Publishing Checklist

- [ ] All tests passing (`ng test ng-search-lib`)
- [ ] Production build successful (`ng build ng-search-lib --configuration production`)
- [ ] README.md is complete and accurate
- [ ] CHANGELOG.md is updated with latest changes
- [ ] package.json version is incremented
- [ ] LICENSE file is present
- [ ] Code is committed and pushed to repository

## Build for Production

```bash
# Clean previous builds
rm -rf dist/ng-search-lib

# Build the library
ng build ng-search-lib --configuration production

# Verify the build output
ls -la dist/ng-search-lib/
```

## Test the Package Locally

Before publishing to npm, test the package locally:

```bash
# Create a tarball
cd dist/ng-search-lib
npm pack

# This creates ng-search-core-0.1.0.tgz

# Install in another Angular project for testing
cd /path/to/test-project
npm install /path/to/ng-search/dist/ng-search-lib/ng-search-core-0.1.0.tgz
```

## Publishing to npm

### First Time Setup

1. Create an npm account at https://www.npmjs.com/signup
2. Login to npm CLI:
   ```bash
   npm login
   ```

### Publish the Package

```bash
# Navigate to dist folder
cd dist/ng-search-lib

# Dry run to see what will be published
npm publish --dry-run

# Publish to npm (public package)
npm publish --access public

# Or for scoped packages
npm publish
```

### Version Management

Follow semantic versioning (semver):

- **Patch** (0.1.0 → 0.1.1): Bug fixes, minor changes
- **Minor** (0.1.0 → 0.2.0): New features, backwards compatible
- **Major** (0.1.0 → 1.0.0): Breaking changes

Update version in `projects/ng-search-lib/package.json`:

```bash
# Patch version
npm version patch

# Minor version
npm version minor

# Major version
npm version major
```

## Post-Publishing

1. Verify package on npm: https://www.npmjs.com/package/@ng-search/core
2. Test installation:
   ```bash
   npm install @ng-search/core
   ```
3. Create a Git tag:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
4. Create a GitHub release with the CHANGELOG

## Continuous Deployment

For automated publishing, set up GitHub Actions:

```.github/workflows/publish.yml
name: Publish to NPM

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: ng build ng-search-lib --configuration production
      - run: cd dist/ng-search-lib && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Troubleshooting

### "package already exists"
The version is already published. Increment the version number.

### "403 Forbidden"
Check your npm authentication:
```bash
npm whoami
npm login
```

### "ENEEDAUTH"
Your npm authentication token expired. Run `npm login` again.

### Build errors
Ensure all peer dependencies versions are correct and tests pass.

## Distribution Package Contents

The published package should include:

```
@ng-search/core/
├── fesm2022/           # Flat ESM bundles
├── lib/                # Component type definitions
├── CHANGELOG.md        # Version history
├── LICENSE             # MIT license
├── README.md           # Documentation
├── package.json        # Package metadata
├── index.d.ts          # Main type definitions
└── public-api.d.ts     # Public API types
```

## Package Size

Check the package size before publishing:

```bash
cd dist/ng-search-lib
npm pack --dry-run
```

Target: Keep package under 1MB for optimal install times.

## Support

For issues or questions:
- GitHub Issues: [your-repo-url]/issues
- npm: https://www.npmjs.com/package/@ng-search/core
