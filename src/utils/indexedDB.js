// 创建单例数据库实例
let dbInstance = null;

export class IndexedDBManager {
    constructor(dbName = 'WalletDB', version = 1) {
        if (dbInstance) {
            return dbInstance;
        }
        
        this.dbName = dbName;
        this.version = version;
        this.db = null;
        this.stores = new Set(['wallets', 'networks', 'transferPairs']); // 预定义所有需要的存储
        dbInstance = this;
    }

    async init() {
        if (this.db) {
            return this.db;
        }

        return new Promise((resolve, reject) => {
            // 先尝试打开数据库，获取当前版本
            const checkRequest = indexedDB.open(this.dbName);
            
            checkRequest.onsuccess = (event) => {
                const db = event.target.result;
                const currentVersion = db.version;
                db.close();

                // 使用更高版本打开数据库，强制触发升级
                const request = indexedDB.open(this.dbName, currentVersion + 1);

                request.onerror = (event) => {
                    console.error('数据库打开失败:', event.target.error);
                    reject(new Error('无法打开数据库'));
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    console.log('数据库打开成功:', this.db.name, '版本:', this.db.version);
                    resolve(this.db);
                };

                request.onupgradeneeded = (event) => {
                    console.log('数据库升级中...');
                    const db = event.target.result;
                    
                    // 创建所需的存储
                    if (!db.objectStoreNames.contains('networks')) {
                        console.log('创建 networks store');
                        db.createObjectStore('networks', { keyPath: 'chainId' });
                    }
                    if (!db.objectStoreNames.contains('wallets')) {
                        console.log('创建 wallets store');
                        db.createObjectStore('wallets', { keyPath: 'address' });
                    }
                    if (!db.objectStoreNames.contains('transferPairs')) {
                        console.log('创建 transferPairs store');
                        const store = db.createObjectStore('transferPairs', { 
                            keyPath: 'id',
                            autoIncrement: true 
                        });
                        store.createIndex('fromAddress', 'fromAddress', { unique: false });
                        console.log('transferPairs store 创建完成');
                    }
                };
            };

            checkRequest.onerror = (event) => {
                console.error('检查数据库版本失败:', event.target.error);
                reject(new Error('无法检查数据库版本'));
            };
        });
    }

    async ensureStore(storeName, options = { keyPath: 'id' }) {
        if (!this.db) {
            throw new Error('数据库未初始化');
        }

        if (this.db.objectStoreNames.contains(storeName)) {
            return;
        }

        this.db.close();

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.db.version + 1);

            request.onerror = () => reject(new Error('创建存储失败'));

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    const store = db.createObjectStore(storeName, options);
                    if (storeName === 'transferPairs') {
                        store.createIndex('fromAddress', 'fromAddress', { unique: false });
                    }
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.stores.add(storeName);
                resolve();
            };
        });
    }

    async addItem(storeName, item) {
        if (!this.db) {
            throw new Error('数据库未初始化');
        }

        if (!this.db.objectStoreNames.contains(storeName)) {
            await this.ensureStore(storeName, 'chainId');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);

            request.onerror = () => reject(new Error(`添加${storeName}项目失败`));
            request.onsuccess = () => resolve(item);
        });
    }

    async getAllItems(storeName) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            if (!this.db.objectStoreNames.contains(storeName)) {
                console.error(`存储 ${storeName} 不存在`);
                resolve([]); // 如果存储不存在，返回空数组而不是报错
                return;
            }

            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onerror = () => {
                reject(new Error(`获取${storeName}失败`));
            };

            request.onsuccess = () => {
                resolve(request.result || []);
            };
        });
    }

    async deleteItem(storeName, key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }

            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onerror = () => {
                reject(new Error(`删除${storeName}项目失败`));
            };

            request.onsuccess = () => {
                resolve(key);
            };
        });
    }

    async getAllWallets() {
        return this.getAllItems('wallets');
    }

    async addWallet(wallet) {
        return this.addItem('wallets', wallet);
    }

    async addWallets(wallets) {
        return Promise.all(wallets.map(wallet => this.addWallet(wallet)));
    }

    async deleteWallet(address) {
        return this.deleteItem('wallets', address);
    }

    async getTransferPairs(fromAddress) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('数据库未初始化'));
                return;
            }

            const transaction = this.db.transaction(['transferPairs'], 'readonly');
            const store = transaction.objectStore('transferPairs');
            const index = store.index('fromAddress');
            const request = index.getAll(fromAddress);

            request.onerror = () => reject(new Error('获取转账对失败'));
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    async addTransferPair(pair) {
        console.log('添加单个转账对:', pair);
        try {
            // 确保 transferPairs store 存在
            if (!this.db.objectStoreNames.contains('transferPairs')) {
                await this.ensureStore('transferPairs', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
            }
            const result = await this.addItem('transferPairs', pair);
            console.log('添加结果:', result);
            return result;
        } catch (error) {
            console.error('添加转账对失败:', error);
            throw error;
        }
    }

    async addTransferPairs(pairs) {
        console.log('批量添加转账对:', pairs);
        try {
            const results = await Promise.all(pairs.map(pair => this.addTransferPair(pair)));
            console.log('批量添加结果:', results);
            return results;
        } catch (error) {
            console.error('批量添加失败:', error);
            throw error;
        }
    }

    async deleteTransferPair(id) {
        return this.deleteItem('transferPairs', id);
    }
}

// 导出单例实例
export const dbManager = new IndexedDBManager(); 