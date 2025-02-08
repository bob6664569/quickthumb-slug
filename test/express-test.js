import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import request from 'supertest';
import quickthumb from '../index.js';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const baseDir = join(__dirname, '../public');
const filename = encodeURIComponent('cape cod.jpg');

describe('QuickThumb Express Integration', () => {
    let app;
    const cacheDir = '/tmp/cache';

    beforeAll(async () => {
        app = express();

        app.use(quickthumb.static({
            baseDir,
            cacheDir,
            sizes: {
                small: { width: 320, height: 240, type: 'crop' },
                medium: { width: 640, height: 480, type: 'resize' }
            }
        }));
    });

    afterAll(async () => {
        try {
            await fs.rm(cacheDir, { recursive: true, force: true });
        } catch (err) {
            if (err.code !== 'ENOENT') throw err;
        }
    });

    test('should handle 404 for non-existent images', async () => {
        const response = await request(app).get('/images/nonexistent-small.jpg');
        expect(response.status).toBe(404);
    });

    test('should process crop image', async () => {
        const url = `/images/${filename.replace('.jpg', '-small.jpg')}`;
        const response = await request(app).get(url);
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/^image/);
    });

    test('should process resize image', async () => {
        const url = `/images/${filename.replace('.jpg', '-medium.jpg')}`;
        const response = await request(app).get(url);
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/^image/);
    });
});