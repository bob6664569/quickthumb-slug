# QuickThumb-Slug

QuickThumb-Slug is an on the fly, thumbnail creation middleware for express based on the [QuickThumb lib](https://github.com/zivester/node-quickthumb) but using pre-defined sizes to avoid malicious exploitation of the library.
It utilizes the popular *nix image library, ImageMagick. It allows for the automatic creation of thumbnails by adding a final slug to image filenames.
It's ideal for web developers who would like to easily experiment with different size thumbnails, wihout having to worry about pre-generating an entire library.

## Examples

```js
import express from 'express';
import quickThumbs from 'quickthumb-slug';

const app = express();

app.use(quickThumbs.static({
    baseDir: process.cwd() + "/public",
    sizes: {
        square: { width: 400, height: 400, type: "crop" },
        landscape: { width: 1200, height: 600, type: "crop" },
        fitinportrait: { width: 400, height: 700, type: "resize" }
    }
}));

```

```html
<img src="/images/red-square.gif" />
```

## Install

    npm install quickthumb-slug

ImageMagick is required for this module, so make sure it is installed.

Ubuntu

    apt-get install imagemagick

Mac OS X

    brew install imagemagick

Fedora/CentOS

    yum install imagemagick


## Usage

### qt.static(options)

Middleware to replace `express.static()` or `connect.static()`.

`options` is an object to specify customizations. It currently has the following options:

* `baseDir` is the original directory where source images are located.
* `cacheDir` The directory where generated images will be created.  If not supplied, images will be created in `[baseDir]/.cache/`
* `sizes` Object containing configurations for image outputs, **properties are the slugs that will be used in filenames**
    * `width` Width of resized image
    * `height` Height of resized image
    * `type` The type of imagemagick conversion to take place.  There are currently only two options:
        * `crop` (default) Crops and zooms images to the exact size specified. Proxy to *imagemagick.crop*.
        * `resize` Resizes an image to fit within the specified dimensions, but actual dimensions may not be exactly as specified. Proxy to *imagemagick.resize*.
* `quality` The quality to use when resizing the image.  Values should be between 0 (worst quality) and 1 (best quality)

Resizing of images is directed by the image name.  This is in the format `[filename-without-ext]-[slug][original-ext]`. E.g. `red-square.gif`

Resized images will be created on an as needed basis, and stored in `[cacheDir]/[slug]/[dim]`.

If the `slug` is not present, the original image will be served.
