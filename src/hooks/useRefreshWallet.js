import { useCallback } from 'react';

export const useRefreshWallet = ({
  data,
  setData,
  fetchData,
  setLoading,
  selectedKeys,
  showSuccess,
  showError,
  processQueue
}) => {
  const refreshSingleAddress = async (address) => {
    setData(prevData => {
      return prevData.map(item => 
        item.address === address 
          ? {
              ...item,
              loading: true,
              result: "pending",
              balance: null,
              activity: null,
              sessions: null,
              fee: null,
              lastTx: null,
              contractActivity: null,
            }
          : item
      );
    });
    
    try {
      const response = await fetchData(address);
      setData(prevData => updateAddressData(prevData, address, response));
      showSuccess('刷新成功');
    } catch (error) {
      setData(prevData => updateErrorState(prevData, address, error));
      throw error;
    }
  };

  const refreshMultipleAddresses = async () => {
    if (!selectedKeys?.length) {
      showError('请选择要刷新的地址');
      return;
    }

    if (!data?.length) {
      showError('数据列表为空');
      return;
    }

    setData(prevData => {
      return prevData.map(item => 
        selectedKeys.includes(item.key) 
          ? {
              ...item,
              loading: true,
              result: "pending",
              balance: null,
              activity: null,
              sessions: null,
              fee: null,
              lastTx: null,
              contractActivity: null,
            }
          : item
      );
    });

    try {
      const addressesToRefresh = data
        .filter(item => selectedKeys.includes(item.key))
        .map(item => item.address);

      if (!addressesToRefresh.length) {
        showError('没有找到要刷新的地址');
        return;
      }

      const tasks = addressesToRefresh.map(addr => async () => {
        try {
          const response = await fetchData(addr);
          setData(prevData => updateAddressData(prevData, addr, response));
          return { address: addr, success: true };
        } catch (error) {
          setData(prevData => updateErrorState(prevData, addr, error));
          return { address: addr, success: false, error };
        }
      });

      const results = await processQueue(tasks, 2);
      const successCount = results.filter(r => r?.success).length;
      showSuccess(`批量刷新完成，成功：${successCount}/${results.length}`);
    } catch (error) {
      console.error('批量刷新错误:', error);
      showError('批量刷新失败');
    }
  };

  const handleRefresh = useCallback(async (address) => {
    try {
      setLoading(prev => ({
        ...prev,
        refresh: true,
        table: true
      }));

      if (typeof address === 'string') {
        await refreshSingleAddress(address);
      } else {
        await refreshMultipleAddresses();
      }
    } catch (error) {
      console.error('刷新错误:', error);
      showError(error.message);
    } finally {
      setLoading(prev => ({
        ...prev,
        refresh: false,
        table: false
      }));
    }
  }, [data, selectedKeys, setData, setLoading, showSuccess, showError]);

  return handleRefresh;
};

const updateLoadingState = (data, address, loading) => {
  return data.map(item => 
    item.address === address 
      ? { ...item, loading, result: "pending" }
      : item
  );
};

const updateAddressData = (data, address, response) => {
  return data.map(item => 
    item.address === address 
      ? {
          ...item,
          ...response,
          loading: false,
          result: "success"
        }
      : item
  );
};

const updateErrorState = (data, address, error) => {
  return data.map(item => 
    item.address === address 
      ? {
          ...item,
          loading: false,
          result: "error",
          reason: error.message
        }
      : item
  );
}; 