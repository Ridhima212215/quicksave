// ============================================
// QuickSave PWA — IndexedDB Storage Layer
// ============================================

const QuickSaveDB = (() => {
    const DB_NAME = 'quicksave';
    const DB_VERSION = 1;
    const STORE_NAME = 'saves';

    /**
     * Open (or create) the IndexedDB database
     */
    function open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    // Create indexes for searching & filtering
                    store.createIndex('url', 'url', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Add a new save entry
     * @param {Object} item - { url, title, note, tags, type }
     * @returns {Promise<number>} - The auto-generated ID
     */
    async function add(item) {
        const db = await open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            const entry = {
                url: item.url || '',
                title: item.title || '',
                note: item.note || '',
                tags: item.tags || [],
                type: item.type || 'other',
                createdAt: new Date().toISOString()
            };

            const request = store.add(entry);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);

            tx.oncomplete = () => db.close();
        });
    }

    /**
     * Get all saved items, newest first
     * @returns {Promise<Array>}
     */
    async function getAll() {
        const db = await open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                // Sort newest first
                const items = request.result.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
                resolve(items);
            };
            request.onerror = () => reject(request.error);

            tx.oncomplete = () => db.close();
        });
    }

    /**
     * Get a single item by ID
     * @param {number} id
     * @returns {Promise<Object>}
     */
    async function getById(id) {
        const db = await open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);

            tx.oncomplete = () => db.close();
        });
    }

    /**
     * Delete a save by ID
     * @param {number} id
     * @returns {Promise<void>}
     */
    async function remove(id) {
        const db = await open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);

            tx.oncomplete = () => db.close();
        });
    }

    /**
     * Search items by query string (searches url, title, note)
     * @param {string} query
     * @returns {Promise<Array>}
     */
    async function search(query) {
        const all = await getAll();
        if (!query || !query.trim()) return all;

        const q = query.toLowerCase().trim();
        return all.filter((item) => {
            return (
                (item.url && item.url.toLowerCase().includes(q)) ||
                (item.title && item.title.toLowerCase().includes(q)) ||
                (item.note && item.note.toLowerCase().includes(q)) ||
                (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(q)))
            );
        });
    }

    /**
     * Get items filtered by type/tag
     * @param {string} type - 'paper', 'github', 'tweet', etc.
     * @returns {Promise<Array>}
     */
    async function getByType(type) {
        const all = await getAll();
        if (!type || type === 'all') return all;
        return all.filter((item) => item.type === type || (item.tags && item.tags.includes(type)));
    }

    /**
     * Get count of all items
     * @returns {Promise<number>}
     */
    async function count() {
        const db = await open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);

            tx.oncomplete = () => db.close();
        });
    }

    /**
     * Get stats — count per type
     * @returns {Promise<Object>}
     */
    async function getStats() {
        const all = await getAll();
        const stats = {
            total: all.length,
            paper: 0,
            github: 0,
            tweet: 0,
            article: 0,
            video: 0,
            other: 0
        };

        all.forEach((item) => {
            if (stats.hasOwnProperty(item.type)) {
                stats[item.type]++;
            } else {
                stats.other++;
            }
        });

        return stats;
    }

    // Public API
    return {
        add,
        getAll,
        getById,
        remove,
        search,
        getByType,
        count,
        getStats
    };
})();
