export const processQueue = async ( tasks, limit = 2 ) => {
  const queue = [ ...tasks ];
  const executing = new Set();

  const runTask = async ( task ) => {
    try {
      await task();
    } finally {
      executing.delete( task );
    }
  };

  while ( queue.length > 0 || executing.size > 0 ) {
    while ( executing.size < limit && queue.length > 0 ) {
      const task = queue.shift();
      executing.add( task );
      runTask( task );
    }
    await Promise.race( [ ...executing ].map( task =>
      new Promise( resolve => setTimeout( resolve, 100 ) )
    ) );
  }
};
