import React, { useEffect } from 'react';
import WrapperRouter from './router';
import { dbManager } from './utils/indexedDB';

// 立即执行数据库初始化
(async () => {
  try {
    console.log('正在初始化数据库...');
    await dbManager.init();
    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
})();

const App = () => {
  // 在组件挂载时也尝试初始化数据库，以确保数据库已准备就绪
  useEffect(() => {
    const initDB = async () => {
      try {
        await dbManager.init();
      } catch (error) {
        console.error('数据库初始化失败:', error);
      }
    };

    initDB();
  }, []);

  return <WrapperRouter />;
};

export default App;
