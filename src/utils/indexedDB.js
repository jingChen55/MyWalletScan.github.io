let dbInstance = null;

class IndexedDBManager {
  constructor(dbName = 'WalletDB', version = 1) {
    if (dbInstance) {
      return dbInstance;
    }

    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.stores = new Set(['wallets', 'networks', 'transferPairs']);
    dbInstance = this;
  }

  async init() {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const checkRequest = indexedDB.open(this.dbName);

      checkRequest.onsuccess = (event) => {
        const db = event.target.result;
        const currentVersion = db.version;
        db.close();

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

  async getAllWallets() {
    return this.getAllItems('wallets');
  }

  async addItem(storeName, item) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onerror = () => reject(new Error(`添加${storeName}项目失败`));
      request.onsuccess = () => resolve(item);
    });
  }

  async addTransferPair(pair) {
    return this.addItem('transferPairs', pair);
  }

  async addTransferPairs(pairs) {
    return Promise.all(pairs.map(pair => this.addTransferPair(pair)));
  }

  async deleteItem(storeName, key) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!key) {
        reject(new Error('No key specified for deletion'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        console.log(`Item with key ${key} deleted from ${storeName}`);
        resolve();
      };

      request.onerror = (event) => {
        console.error(`Failed to delete item with key ${key} from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  async deleteTransferPair(id) {
    try {
      await this.deleteItem('transferPairs', id);
    } catch (error) {
      console.error('Failed to delete transfer pair:', error);
      throw error;
    }
  }

  /**
   * 批量添加或更新钱包
   * @param {Array} wallets - 钱包数组
   * @returns {Promise<Array>} 添加或更新后的钱包数组
   */
  async addWallets(wallets) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['wallets'], 'readwrite');
      const store = transaction.objectStore('wallets');
      let completed = 0;
      let failed = 0;
      const results = [];

      wallets.forEach(wallet => {
        const request = store.put(wallet); // 使用 put 而不是 add，这样可以更新已存在的钱包

        request.onsuccess = () => {
          completed++;
          results.push(wallet);
          if (completed + failed === wallets.length) {
            if (failed > 0) {
              reject(new Error(`${failed} 个钱包更新失败`));
            } else {
              resolve(results);
            }
          }
        };

        request.onerror = (event) => {
          console.error('添加/更新钱包失败:', event.target.error);
          failed++;
          if (completed + failed === wallets.length) {
            reject(new Error(`${failed} 个钱包更新失败`));
          }
        };
      });

      transaction.onerror = (event) => {
        reject(new Error('批量更新钱包事务失败: ' + event.target.error));
      };
    });
  }
}

export const dbManager = new IndexedDBManager();
export { IndexedDBManager };