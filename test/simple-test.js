import { strict as assert } from 'assert';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sharp from 'sharp';
import quickthumb from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicPath = path.normalize(path.join(__dirname, '../public/images'));
const sourceImage = path.join(publicPath, 'cape cod.jpg');

describe('QuickThumb Image Processing', () => {
    test('should process crop operations', async () => {
        const options = {
            src: sourceImage,
            dst: path.join(publicPath, 'red_100x100.gif'),
            width: 100,
            height: 100,
            quality: 1,
        };

        try {
            // Convert image
            await new Promise((resolve, reject) => {
                quickthumb.convert(options, (err, image) => {
                    if (err) reject(err);
                    else resolve(image);
                });
            });

            // Verify dimensions with Sharp
            const metadata = await sharp(options.dst).metadata();
            assert.equal(metadata.width, options.width);
            assert.equal(metadata.height, options.height);

            // Cleanup
            await fs.unlink(options.dst);
        } catch (err) {
            // Cleanup in case of error
            try { await fs.unlink(options.dst); } catch {}
            throw err;
        }
    });

    test('should process resize operations', async () => {
        const options = {
            src: sourceImage,
            dst: path.join(publicPath, 'red_100x50.gif'),
            width: 100,
            height: 50,
            quality: 1,
            type: 'resize'
        };

        try {
            // Convert image
            await new Promise((resolve, reject) => {
                quickthumb.convert(options, (err, image) => {
                    if (err) reject(err);
                    else resolve(image);
                });
            });

            // Verify dimensions with Sharp
            const metadata = await sharp(options.dst).metadata();
            assert(metadata.width <= options.width);
            assert(metadata.height <= options.height);

            // Cleanup
            await fs.unlink(options.dst);
        } catch (err) {
            // Cleanup in case of error
            try { await fs.unlink(options.dst); } catch {}
            throw err;
        }
    });
});