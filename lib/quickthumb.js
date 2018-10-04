var qt = {},
    fs = require("fs"),
    path = require("path"),
    debug = require("debug")("quickthumb:lib"),
    mkdirp = require("mkdirp"),
    im = require("imagemagick");

module.exports = qt;

function sendfile(res, file) {
    res[ res.sendFile ? 'sendFile' : 'sendfile' ](file);
}

qt.convert = function(options, callback){
    var src = options.src,
        dst = options.dst,
        width = options.width,
        height = options.height,
        quality = options.quality,
        type = options.type || 'crop';

    mkdirp(path.dirname(dst));

    var im_options = {
            srcPath : src,
            dstPath : dst
        };

    if (options.width) im_options.width = width;
    if (options.height) im_options.height = height;
    if (options.quality) im_options.quality = quality;

    try {
        im[type](im_options, function(err, stdout, stderr){
            if (err) return callback(err);
            callback(null, dst);
        });
    } catch (err){
        return callback('qt.convert() ERROR: ' + err.message);
    }
};

// express/connect middleware
qt.static = function(options){

    let rootDir = path.normalize(options.dirname);
    options.cacheDir = options.cachedir || path.join(rootDir, '.cache');
    options.sizes = options.sizes || {
      small: { width: 320, height: 9999, type: "crop", slug: "small" },
      medium: { width: 768, height: 9999, type: "crop", slug: "medium" },
      large: { width: 1200, height: 9999, type: "crop", slug: "large" }
    };

    return function (req, res, next){
        let pattern = req.url.match(/^(.*)(?:-([a-z0-9]*))(\.(?:jpg|png|jpeg))$/);
        if (!pattern) return next();

        let type = pattern[2],
            file = decodeURI(pattern[1]+pattern[3]),
            orig = path.normalize(rootDir + file),
            dst = path.join(options.cacheDir, options.sizes[type].type, pattern[2], file);

        function send_if_exists(file, callback){
            fs.exists(file, function(exists){
                if (!exists){
                    return callback();
                }

                fs.stat(file, function(err, stats){
                    if (err){
                        console.error(err);
                        return callback();
                    } else if (stats.isFile()){
                        fs.stat(orig, function (err, origStats) {
                            if (err) {
                                console.error(err);
                            } else if (origStats.mtime.getTime() > stats.mtime.getTime()) {
                                return callback();
                            }
                            return sendfile(res, file);
                        });
                    } else {
                        callback();
                    }
                });
            });
        }

        send_if_exists(dst, () => {
            var opts = {
                    src : orig,
                    dst : dst,
                    width : options.sizes[type].width,
                    height : options.sizes[type].height,
                    type : options.sizes[type].type,
                    quality : options.quality
                };

            qt.convert(opts, (err, dst) => {
                if (err) {
                    console.error(err);
                    return next();
                }
                sendfile(res, dst);
            });
        });
    };
};
