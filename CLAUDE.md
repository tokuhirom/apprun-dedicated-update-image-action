# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript-based GitHub Action for updating Sakura Cloud AppRun Dedicated application images. The action creates a new application version with an updated container image and activates it via the Sakura AppRun API.

## Build and Test Commands

```bash
# Install dependencies
npm install

# Run TypeScript compilation only
npm run build

# Bundle TypeScript + dependencies into dist/index.js
npm run package

# Run both build and package (required before committing)
npm run all

# Run tests
npm test
```

**CRITICAL**: Always run `npm run all` before committing changes. The `dist/` directory must be committed because GitHub Actions executes the bundled `dist/index.js` file, not the TypeScript source.

## Architecture

### Image Update Workflow

The action performs a **blue-green deployment** by creating a new version rather than modifying the existing one:

1. **List versions** (GET `/applications/{applicationID}/versions`) - Find the currently active version
2. **Get version details** (GET `/applications/{applicationID}/versions/{version}`) - Retrieve full configuration of active version
3. **Clone configuration** - Copy all settings (CPU, memory, scaling, ports, env vars) from active version
4. **Update image only** - Replace the `image` field with the new image name
5. **Create new version** (POST `/applications/{applicationID}/versions`) - API auto-increments version number
6. **Activate new version** (PUT `/applications/{applicationID}`) - Set `activeVersion` to the newly created version number

### Key Implementation Details

**API Authentication**: Uses HTTP Basic Auth with `sakuraAccessToken` (username) and `sakuraAccessTokenSecret` (password).

**Configuration Preservation**: When creating a new version, ALL existing configuration must be copied:
- Resource limits (cpu, memory)
- Scaling settings (scalingMode, minScale, maxScale, fixedScale, scaleInThreshold, scaleOutThreshold)
- Container settings (cmd, registryUsername)
- Network (exposedPorts with health checks)
- Environment variables

**Secret Handling**:
- Set `registryPasswordAction: 'keep'` to preserve existing registry credentials (API returns `null` for security)
- Set `env[].valueAction: 'keep'` for all environment variables to preserve secret values

**Naming Conventions**: Use `applicationID` (not `applicationId`) to match the OpenAPI specification and API URLs.

### Module Structure

- `src/main.ts` - Entry point, orchestrates the workflow
- `src/api-client.ts` - Handles all HTTP requests to Sakura AppRun API
- `src/types.ts` - TypeScript interfaces matching OpenAPI schema
- `src/utils.ts` - Input validation and configuration cloning logic
- `__tests__/main.test.ts` - Unit tests for validation and helper functions

### Build Output

- `lib/` - TypeScript compilation output (gitignored)
- `dist/index.js` - Bundled file with all dependencies (961kB, **must be committed**)
- `dist/` also contains type definitions and source maps

## API Endpoints Reference

Base URL: `https://secure.sakura.ad.jp/cloud/api/apprun-dedicated/1.0`

- List versions: `GET /applications/{applicationID}/versions`
- Get version: `GET /applications/{applicationID}/versions/{version}`
- Create version: `POST /applications/{applicationID}/versions`
- Activate version: `PUT /applications/{applicationID}` (body: `{"activeVersion": <number>}`)

Documentation: https://manual.sakura.ad.jp/api/cloud/apprun-dedicated/
