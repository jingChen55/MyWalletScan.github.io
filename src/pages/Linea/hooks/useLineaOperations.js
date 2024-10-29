import { getLineaData } from '@utils/getLinea/main.js';
import { useCallback } from 'react';
import { processQueue } from '../utils/queueProcessor';
import { useBatchAdd } from '@/hooks/useBatchAdd';

export const useLineaOperations = ( {
  data,
  setData,
  loading,
  setLoading,
  selectedKeys,
  setSelectedKeys,
  showSuccess,
  showError
} ) => {
  // 使用 useBatchAdd hook
  const handleBatchAdd = useBatchAdd({
    data,
    setData,
    fetchData: getLineaData,
    setLoading: (loading) => setLoading({ ...loading, batch: loading }),
    showSuccess,
    showError
  });

  // 修改 handleRefresh 函数
  const handleRefresh = useCallback( async ( address ) => {
    try {
      // 设置表格加载状态
      setLoading( prev => ( {
        ...prev,
        refresh: true,
        table: true  // 添加表格加载状态
      } ) );

      // 如果是单个地址刷新
      if ( typeof address === 'string' ) {
        console.log( '刷新单个地址:', address );
        // 先清空数据，显示加载状态
        setData( prevData => {
          const updatedData = [ ...prevData ];
          const index = updatedData.findIndex( item => item.address === address );
          if ( index !== -1 ) {
            updatedData[ index ] = {
              ...updatedData[ index ],
              loading: true,
              result: "pending",
              balance: null,
              activity: null,
              points: null,
              rank: null,
              xp: null,
              fee: null,
              lastTx: null,
              contractActivity: null,
              totalExchangeAmount: null,
              bridge: null,
            };
          }
          return updatedData;
        } );

        try {
          const response = await getLineaData( address );
          const formattedResponse = {
            ...response,
            points: response.points || response.totalPoints || 0,
            rank: response.rank || '-',
            balance: response.balance || '0',
            loading: false,
            result: "success"
          };

          setData( prevData => {
            const updatedData = [ ...prevData ];
            const index = updatedData.findIndex( item => item.address === address );
            if ( index !== -1 ) {
              updatedData[ index ] = {
                ...updatedData[ index ],
                ...formattedResponse,
              };
            }
            return updatedData;
          } );
          showSuccess( '刷新成功' );
        } catch ( error ) {
          setData( prevData => {
            const updatedData = [ ...prevData ];
            const index = updatedData.findIndex( item => item.address === address );
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
          throw error;
        }
      }
      // 批量刷新
      else {
        if ( !selectedKeys.length ) {
          showError( '请选择要刷新的地址' );
          return;
        }

        // 先清空所有选中地址的数据，显示加载状态
        setData( prevData => {
          const updatedData = [ ...prevData ];
          selectedKeys.forEach( key => {
            const index = updatedData.findIndex( item => item.key === key );
            if ( index !== -1 ) {
              updatedData[ index ] = {
                ...updatedData[ index ],
                loading: true,
                result: "pending",
                balance: null,
                activity: null,
                points: null,
                rank: null,
                xp: null,
                fee: null,
                lastTx: null,
                contractActivity: null,
                totalExchangeAmount: null,
                bridge: null,
              };
            }
          } );
          return updatedData;
        } );

        const addressesToRefresh = data.filter( item =>
          selectedKeys.includes( item.key )
        ).map( item => item.address );

        console.log( '要刷新的地址:', addressesToRefresh );

        const tasks = addressesToRefresh.map( addr => async () => {
          try {
            const response = await getLineaData( addr );
            const formattedResponse = {
              ...response,
              points: response.points || response.totalPoints || 0,
              rank: response.rank || '-',
              balance: response.balance || '0',
              loading: false,
              result: "success"
            };

            setData( prevData => {
              const updatedData = [ ...prevData ];
              const index = updatedData.findIndex( item => item.address === addr );
              if ( index !== -1 ) {
                updatedData[ index ] = {
                  ...updatedData[ index ],
                  ...formattedResponse,
                };
              }
              return updatedData;
            } );
            return { address: addr, success: true };
          } catch ( error ) {
            console.error( `刷新地址 ${ addr } 失败:`, error );
            setData( prevData => {
              const updatedData = [ ...prevData ];
              const index = updatedData.findIndex( item => item.address === addr );
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
            return { address: addr, success: false, error };
          }
        } );

        const results = await processQueue( tasks, 2, ( completed, total ) => {
          console.log( `刷新进度: ${ completed }/${ total }` );
        } );

        const successCount = results.filter( r => r?.success ).length;
        showSuccess( `批量刷新完成，成功：${ successCount }/${ results.length }` );
      }
    } catch ( error ) {
      console.error( '刷新错误:', error );
      showError( error.message );
    } finally {
      // 完成后移除所有加载状态
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
