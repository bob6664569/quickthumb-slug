import { promises as fs } from 'fs';
import path from 'path';
import debug from 'debug';
import sharp from 'sharp';

const log = debug('quickthumb:lib');

export class QuickThumb {
    static async _getFromCache(orig, file, callback) {
        try {
            await fs.access(file);
            log(`Cache exists for ${file}, checking stat...`);

            const [stats, origStats] = await Promise.all([
                fs.stat(file),
                fs.stat(orig)
            ]);

            if (origStats.mtime.getTime() > stats.mtime.getTime()) {
                log(`Origin file for ${file} differs from cached one, not returning`);
                callback && callback();
                return null;
            }
            callback && callback(file);
            return file;
        } catch {
            log(`No cache entry for ${file}`);
            callback && callback();
            return null;
        }
    }

    static _sendFile(res, file) {
        return res[res.sendFile ? 'sendFile' : 'sendfile'](file);
    }

    static async convert(options, callback) {
        const { src, dst, width, height, type = 'crop', quality = 80 } = options;

        try {
            await fs.mkdir(path.dirname(dst), { recursive: true });

            const fit = type === 'crop' ? 'cover' : 'inside';
            await sharp(src)
                .resize({
                    width: width || undefined,
                    height: height || undefined,
                    fit,
                    withoutEnlargement: true
                })
                .jpeg({ quality })
                .toFile(dst);

            if (callback) {
                callback(null, dst);
            }
            return dst;
        } catch (err) {
            log(`Error converting ${src}: ${err.message}`);
            const error = new Error(`quickthumb.convert() ERROR: ${err.message}`);
            if (callback) {
                callback(error);
            }
            throw error;
        }
    }

    static static(options) {
        const rootDir = path.normalize(options.baseDir);
        const cacheDir = options.cacheDir || path.join(rootDir, '.cache');
        const sizes = options.sizes || {
            small: { width: 320, height: 9999, type: 'crop', slug: 'small' },
            medium: { width: 768, height: 9999, type: 'crop', slug: 'medium' },
            large: { width: 1200, height: 9999, type: 'crop', slug: 'large' }
        };

        return async (req, res, next) => {
            try {
                const pattern = req.url.match(/^(.*)(?:-([a-z0-9]*))(\.(?:gif|jpe?g|png|webp))$/i);
                if (!pattern) return next();

                log(`Pattern matched for ${req.url}`);
                const type = pattern[2];
                if (typeof sizes[type] === 'undefined') {
                    log(`Not processing ${req.url}, unmatched format`);
                    return next();
                }

                const file = decodeURI(pattern[1] + pattern[3]);
                const orig = path.normalize(path.join(rootDir, file));

                try {
                    await fs.access(orig);
                } catch {
                    log(`Not processing ${req.url}, origin file does not exist`);
                    return next();
                }

                const dst = path.join(cacheDir, sizes[type].type, pattern[2], file);

                log(`Trying to query cache for ${file}...`);
                const cachedFile = await QuickThumb._getFromCache(orig, dst);
                if (cachedFile) {
                    log(`File ${file} sent from cache`);
                    return QuickThumb._sendFile(res, cachedFile);
                }

                log(`No cache found for ${file}, converting...`);
                const convertedFile = await QuickThumb.convert({
                    src: orig,
                    dst,
                    width: sizes[type].width,
                    height: sizes[type].height,
                    type: sizes[type].type,
                    quality: options.quality
                });

                return QuickThumb._sendFile(res, convertedFile);
            } catch (err) {
                log('Error processing request:', err);
                next(err);
            }
        };
    }
}

export default {
    convert: (options, callback) => {
        if (callback) {
            // Mode callback pour rétrocompatibilité
            QuickThumb.convert(options)
                .then(result => callback(null, result))
                .catch(err => callback(err));
            return;
        }
        // Mode promise pour nouvelle utilisation
        return QuickThumb.convert(options);
    },
    static: QuickThumb.static,
    _sendFile: QuickThumb._sendFile,
    _getFromCache: QuickThumb._getFromCache
};