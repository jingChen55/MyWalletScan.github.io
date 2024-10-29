import { processQueue } from '@utils/queueProcessor';
import { useCallback } from 'react';

// 添加超时处理的函数
const fetchWithTimeout = async ( fetchPromise, timeout = 10000 ) => {
  const timeoutPromise = new Promise( ( _, reject ) => {
    setTimeout( () => {
      reject( new Error( '请求超时，请重试' ) );
    }, timeout );
  } );

  return Promise.race( [ fetchPromise, timeoutPromise ] );
};

// 添加重试机制
const fetchWithRetry = async ( fetchFn, maxRetries = 3 ) => {
  for ( let i = 0; i < maxRetries; i++ ) {
    try {
      return await fetchWithTimeout( fetchFn() );
    } catch ( error ) {
      if ( i === maxRetries - 1 ) throw error;
      await new Promise( resolve => setTimeout( resolve, 1000 * ( i + 1 ) ) ); // 递增延迟
    }
  }
};

export const useScrollOperations = ( {
  data,
  setData,
  loading,
  setLoading,
  selectedKeys,
  setSelectedKeys,
  showSuccess,
  showError,
  getScrollData
} ) => {
  const handleBatchAdd = async ( processedAddresses ) => {
    try {
      setLoading( prev => ( { ...prev, batch: true } ) );
      let updatedData = [ ...data ];

      // 先添加所有地址
      for ( const { address, name } of processedAddresses ) {
        const existingIndex = updatedData.findIndex( item => item.address === address );
        if ( existingIndex === -1 ) {
          updatedData.push( {
            key: address,
            address: address,
            name: name,
            result: "pending",
            loading: true
          } );
        }
      }
      setData( updatedData );

      // 创建任务队列，包含重试和超时处理
      const tasks = processedAddresses.map( ( { address, name } ) => async () => {
        try {
          const response = await fetchWithRetry( () => getScrollData( address ) );
          setData( prev => {

            const newData = [ ...prev ];
            const index = newData.findIndex( item => item.address === address );
            if ( index !== -1 ) {
              newData[ index ] = {
                ...newData[ index ],
                ...response,
                name: name,
                result: "success",
                loading: false
              };
            }
            return newData;
          } );
          return { address, success: true };
        } catch ( error ) {
          console.error( `Error fetching data for address ${ address }:`, error );
          setData( prev => {
            const newData = [ ...prev ];
            const index = newData.findIndex( item => item.address === address );
            if ( index !== -1 ) {
              newData[ index ] = {
                ...newData[ index ],
                result: "error",
                reason: error.message,
                loading: false
              };
            }
            return newData;
          } );
          return { address, success: false, error };
        }
      } );

      // 使用队列处理器执行任务
      const results = await processQueue( tasks, 2, ( completed, total ) => {
        console.log( `添加进度: ${ completed }/${ total }` );
      } );

      const successCount = results.filter( r => r?.success ).length;
      showSuccess( `批量添加完成，成功：${ successCount }/${ results.length }` );

      // 保存到 localStorage
      localStorage.setItem( 'Scroll_addresses', JSON.stringify( data ) );
    } catch ( error ) {
      showError( error.message );
    } finally {
      setLoading( prev => ( { ...prev, batch: false } ) );
      setSelectedKeys( [] );
    }
  };

  const handleRefresh = useCallback( async ( address ) => {
    try {
      setLoading( prev => ( {
        ...prev,
        refresh: true,
        table: true
      } ) );

      // 单个地址刷新
      if ( typeof address === 'string' ) {
        setData( prev => {
          const updatedData = [ ...prev ];
          const index = updatedData.findIndex( item => item.address === address );
          if ( index !== -1 ) {
            updatedData[ index ] = {
              ...updatedData[ index ],
              loading: true,
              result: "pending",
              balance: null,
              activity: null,
              sessions: null,
              fee: null,
              lastTx: null,
              contractActivity: null,
            };
          }
          return updatedData;
        } );

        const response = await fetchWithRetry( () => getScrollData( address ) );
        setData( prev => {
          const updatedData = [ ...prev ];
          const index = updatedData.findIndex( item => item.address === address );
          if ( index !== -1 ) {
            updatedData[ index ] = {
              ...updatedData[ index ],
              ...response,
              loading: false,
              result: "success"
            };
          }
          return updatedData;
        } );
        showSuccess( '刷新成功' );
      }
      // 批量刷新
      else {
        if ( !selectedKeys.length ) {
          showError( '请选择要刷新的地址' );
          return;
        }

        // 设置选中地址的加载状态
        setData( prev => {
          const updatedData = [ ...prev ];
          selectedKeys.forEach( key => {
            const index = updatedData.findIndex( item => item.key === key );
            if ( index !== -1 ) {
              updatedData[ index ] = {
                ...updatedData[ index ],
                loading: true,
                result: "pending",
                balance: null,
                activity: null,
                sessions: null,
                fee: null,
                lastTx: null,
                contractActivity: null,
              };
            }
          } );
          return updatedData;
        } );

        const tasks = data
          .filter( item => selectedKeys.includes( item.key ) )
          .map( item => async () => {
            try {
              const response = await fetchWithRetry( () => getScrollData( item.address ) );
              setData( prev => {
                const updatedData = [ ...prev ];
                const index = updatedData.findIndex( i => i.address === item.address );
                if ( index !== -1 ) {
                  updatedData[ index ] = {
                    ...updatedData[ index ],
                    ...response,
                    loading: false,
                    result: "success"
                  };
                }
                return updatedData;
              } );
              return { address: item.address, success: true };
            } catch ( error ) {
              setData( prev => {
                const updatedData = [ ...prev ];
                const index = updatedData.findIndex( i => i.address === item.address );
                if ( index !== -1 ) {
                  updatedData[ index ] = {
                    ...updatedData[ index ],
                    loading: false,
                    result: "error",
                    reason: error.message
                  };
                }
                return updatedData;
              } );
              return { address: item.address, success: false, error };
            }
          } );

        const results = await processQueue( tasks, 2 );
        const successCount = results.filter( r => r?.success ).length;
        showSuccess( `批量刷新完成，成功：${ successCount }/${ results.length }` );
      }
    } catch ( error ) {
      console.error( '刷新错误:', error );
      showError( error.message );
    } finally {
      setLoading( prev => ( {
        ...prev,
        refresh: false,
        table: false
      } ) );
    }
  }, [ data, selectedKeys, setData, setLoading, showSuccess, showError ] );

  return {
    handleBatchAdd,
    handleRefresh
  };
}; 