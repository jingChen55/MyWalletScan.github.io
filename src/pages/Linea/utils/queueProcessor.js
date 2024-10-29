export const processQueue = async ( tasks, concurrency = 2, onProgress ) => {
  const results = [];
  let completed = 0;
  const total = tasks.length;

  // 创建一个执行任务的函数
  const executeTask = async ( task ) => {
    try {
      const result = await task();
      results.push( result );
      completed++;
      onProgress?.( completed, total );
      return result;
    } catch ( error ) {
      console.error( 'Task execution failed:', error );
      throw error;
    }
  };

  // 按并发数分批执行任务
  for ( let i = 0; i < total; i += concurrency ) {
    const batch = tasks.slice( i, i + concurrency );
    const promises = batch.map( task => executeTask( task ) );
    
    try {
      await Promise.all( promises );
    } catch ( error ) {
      console.error( 'Batch execution failed:', error );
      throw error;
    }
  }

  console.log( 'All tasks completed:', results );
  return results;
};
