#!/usr/bin/env node
import { promises as fs } from 'fs';
import debug from 'debug';
import path from 'path';
import quickthumb from '../index.js';

const log = debug('quickthumb-slug');

function exit(msg) {
    console.error(msg);
    process.exit(1);
}

async function main() {
    if (process.argv.length < 5) {
        exit("Usage: make-thumb.js src dst (<width>x<height>|<width>|x<height>) [-r] [-p] [--resize]");
    }

    const [,, src, dst, dimensions, ...options] = process.argv;
    const createDimensionDir = options.includes("-p");
    const recursive = options.includes("-r");
    const type = options.includes("--resize") ? "resize" : "crop";

    // Parse dimensions
    const [, width = "", height = ""] = dimensions.match(/(\d*)x?(\d*)/) || [];
    if (!width && !height) {
        exit("dimensions must be <width>x<height>");
    }

    log(`Converting to ${width} x ${height}`);

    // Check source exists
    try {
        await fs.access(src);
    } catch {
        exit(`Cannot read ${src}`);
    }

    const targetDir = createDimensionDir ? path.join(dst, dimensions) : dst;

    async function convert(srcPath, dstPath) {
        try {
            await quickthumb.convert({
                src: srcPath,
                dst: path.join(dstPath, path.basename(srcPath)),
                width: parseInt(width) || undefined,
                height: parseInt(height) || undefined,
                type
            });
            log("CREATED", dstPath);
        } catch (err) {
            console.error(`Error processing ${srcPath}:`, err);
        }
    }

    async function processDir(srcPath, dstPath) {
        const files = await fs.readdir(srcPath);

        await Promise.all(files.map(async (filename) => {
            const sourcePath = path.join(srcPath, filename);
            const stats = await fs.stat(sourcePath);

            if (stats.isFile()) {
                await convert(sourcePath, dstPath);
            } else if (recursive && stats.isDirectory()) {
                const targetPath = path.join(dstPath, filename);
                await fs.mkdir(targetPath, { recursive: true });
                await processDir(sourcePath, targetPath);
            }
        }));
    }

    try {
        await fs.mkdir(targetDir, { recursive: true });
        const stats = await fs.stat(src);

        if (stats.isFile()) {
            await convert(src, targetDir);
        } else {
            await processDir(src, targetDir);
        }
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});