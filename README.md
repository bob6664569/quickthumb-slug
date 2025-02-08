# QuickThumb-Slug

Fast and secure on-the-fly thumbnail generation middleware for Express, based on [QuickThumb](https://github.com/zivester/node-quickthumb). Uses pre-defined sizes to prevent malicious exploitation. Built with Sharp for optimal performance and memory efficiency.

## Features

- On-demand thumbnail generation
- Pre-defined size configurations for security
- High-performance image processing with Sharp
- Support for modern image formats (including WebP)
- Compatible with Express and Connect
- Simple slug-based URL format

## Installation

```bash
npm install quickthumb-slug
```

## Usage

### ESM (Recommended)

```javascript
import express from 'express';
import quickthumb from 'quickthumb-slug';

const app = express();

app.use(quickthumb.static({
    baseDir: new URL('.', import.meta.url).pathname + "/public",
    sizes: {
        square: { width: 400, height: 400, type: "crop" },
        landscape: { width: 1200, height: 600, type: "crop" },
        fitinportrait: { width: 400, height: 700, type: "resize" }
    }
}));
```

### CommonJS (Legacy)

```javascript
const express = require('express');
const qt = require('quickthumb-slug');

const app = express();

app.use(qt.static({
    baseDir: __dirname + "/public",
    sizes: {
        square: { width: 400, height: 400, type: "crop" },
        landscape: { width: 1200, height: 600, type: "crop" },
        fitinportrait: { width: 400, height: 700, type: "resize" }
    }
}));
```

### Usage in HTML

```html
<!-- Original image -->
<img src="/images/photo.jpg" />

<!-- Thumbnailed version using 'square' configuration -->
<img src="/images/photo-square.jpg" />
```

## Configuration

The `static()` middleware accepts an options object with the following properties:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `baseDir` | string | Source images directory | Required |
| `cacheDir` | string | Generated thumbnails directory | `[baseDir]/.cache/` |
| `sizes` | object | Size configurations (see below) | Default sizes |
| `quality` | number | JPEG quality (0-100) | 80 |

### Size Configuration

Each size configuration in the `sizes` object can have:

- `width`: Width in pixels
- `height`: Height in pixels
- `type`: Processing type
    - `"crop"` (default): Exact dimensions using center crop
    - `"resize"`: Maintain aspect ratio, fit within dimensions

### Default Sizes

```javascript
{
    small: { width: 320, height: 9999, type: "crop" },
    medium: { width: 768, height: 9999, type: "crop" },
    large: { width: 1200, height: 9999, type: "crop" }
}
```

## File Naming

Thumbnails are automatically generated based on the filename format:
`[original-name]-[size-slug].[extension]`

Examples:
- Original: `photo.jpg`
- Square thumbnail: `photo-square.jpg`
- Landscape version: `photo-landscape.jpg`

## Supported Formats

- JPEG/JPG
- PNG
- GIF
- WebP

## Caching

Generated thumbnails are cached in `[cacheDir]/[type]/[slug]/`. The cache is automatically invalidated when the source image is modified.

## Performance

This library uses Sharp for image processing, which provides:
- 4-5x faster processing than ImageMagick
- Lower memory usage
- Better image quality
- Native WebP support

## Migration from v1.x

If you're upgrading from version 1.x:
1. No code changes required - API remains compatible
2. ImageMagick is no longer required
3. Better memory management and performance
4. Added WebP support

## License

MIT