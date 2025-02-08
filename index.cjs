// CommonJS wrapper for ESM module
const importESM = async () => {
    try {
        const module = await import('./index.js');
        return module.default;
    } catch (error) {
        console.error('Failed to load QuickThumb ESM module:', error);
        throw error;
    }
};

// Create proxy object to handle async module loading
const quickthumb = {
    static: async (...args) => {
        const qt = await importESM();
        return qt.static(...args);
    },
    convert: async (...args) => {
        const qt = await importESM();
        return qt.convert(...args);
    },
    _sendFile: async (...args) => {
        const qt = await importESM();
        return qt._sendFile(...args);
    },
    _getFromCache: async (...args) => {
        const qt = await importESM();
        return qt._getFromCache(...args);
    }
};

module.exports = quickthumb;