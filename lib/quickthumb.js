const fs    = require("fs"),
    path    = require("path"),
    debug   = require("debug")("quickthumb:lib"),
    mkdirp  = require("mkdirp"),
    im      = require("imagemagick");

module.exports = {

    /**
     * res.sendfile compatibility fix
     * @param res
     * @param file
     * @private
     */
    _sendFile(res, file) {
        return res[res.sendFile?"sendFile":"sendfile"](file);
    },

    /**
     * Send image from cache directory or trigger callback
     * @param file
     * @param callback
     * @private
     */
    _getFromCache(orig, file, callback) {
        fs.exists(file, (exists) => {
            if (!exists) return callback();

            debug(`Cache exists for ${file}, checking stat...`);
            fs.stat(file, (err, stats) => {
                if (err) {
                    debug(`Wrong cache entry for ${file}`);
                    return callback();
                }
                fs.stat(orig, (err, origStats) => {
                    if (err || origStats.mtime.getTime() > stats.mtime.getTime()) {
                        debug(`Origin file for ${file} differs from cached one, not returning`);
                        return callback();
                    }
                    return callback(file);
                });
            });
        });
    },

    /**
     * Conversion function, use ImageMagick
     * @param options
     * @param callback
     */
    convert(options, callback) {
        const src = options.src,
            dst = options.dst,
            width = options.width,
            height = options.height,
            quality = options.quality,
            type = options.type || "crop";

        mkdirp(path.dirname(dst));

        var im_options = { srcPath: src, dstPath: dst };

        if (options.width) im_options.width = width;
        if (options.height) im_options.height = height;
        if (options.quality) im_options.quality = quality;

        try {
            im[type](im_options, (err) => {
                if (err) return callback(err);
                callback(null, dst);
            });
        } catch (err) {
            debug(`Error converting ${src} : ${err.message}`);
            callback("quickthumb.convert() ERROR: " + err.message);
        }
    },

    /**
     * Middleware to handle resized pictures
     * @param options
     * @return {Function} Express Middleware
     */
    static (options) {

        let rootDir = path.normalize(options.dirname);
        options.cacheDir = options.cachedir || path.join(rootDir, ".cache");
        options.sizes = options.sizes || {
            small: {width: 320, height: 9999, type: "crop", slug: "small"},
            medium: {width: 768, height: 9999, type: "crop", slug: "medium"},
            large: {width: 1200, height: 9999, type: "crop", slug: "large"}
        };

        return (req, res, next) => {
            let pattern = req.url.match(/^(.*)(?:-([a-z0-9]*))(\.(?:gif|jpg|png|jpeg))$/);
            if (!pattern) return next();

            debug(`Pattern matched for ${req.url}`);
            let type = pattern[2];
            if (typeof options.sizes[type] === "undefined") {
                debug(`Not processing ${req.url}, unmatched format`);
                return next();
            }

            let file = decodeURI(pattern[1] + pattern[3]),
                orig = path.normalize(rootDir + file),
                dst = path.join(options.cacheDir, options.sizes[type].type, pattern[2], file);

            debug(`Trying to query cache for ${file}...`);
            this._getFromCache(orig, dst, (file) => {
                if (file) {
                    debug(`File ${file} sent from cache`);
                    return this._sendFile(res, file);
                }

                const opts = {
                    src: orig,
                    dst: dst,
                    width: options.sizes[type].width,
                    height: options.sizes[type].height,
                    type: options.sizes[type].type,
                    quality: options.quality
                };

                debug(`No cache found for ${file}, converting...`);
                this.convert(opts, (err, dst) => {
                    if (err) {
                        console.error(err);
                        debug(err);
                        return next();
                    }
                    this._sendFile(res, dst);
                });
            });
        };
    }

};
