import { useState, useEffect } from 'react';
import { notification } from 'antd';

export const useWalletOperations = ({
  storageKey,
  fetchData,
  batchSize = 2
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem(storageKey);
    if (storedData) {
      setData(JSON.parse(storedData));
    }
    setInitialized(true);
  }, [storageKey]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data, initialized, storageKey]);

  const handleRefresh = async (singleKey) => {
    const keys = singleKey ? [singleKey] : selectedKeys;
    if (!keys.length) {
      notification.error({
        message: "错误",
        description: "请先选择要刷新的地址",
        duration: 1,
      });
      return;
    }

    setLoading(true);
    try {
      const processAddresses = async () => {
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (key) => {
              const index = data.findIndex((item) => item.key === key);
              if (index !== -1) {
                const response = await fetchData(data[index].address);
                setData(prev => {
                  const updated = [...prev];
                  updated[index] = { ...updated[index], ...response };
                  return updated;
                });
              }
            })
          );
        }
      };

      await processAddresses();
      notification.success({
        message: "完成",
        description: "刷新地址数据完成",
        duration: 1,
      });
    } catch (error) {
      notification.error({
        message: "错误",
        description: error.message,
        duration: 1,
      });
    } finally {
      setLoading(false);
      if (!singleKey) {
        setSelectedKeys([]);
      }
    }
  };

  const handleDelete = async (address) => {
    setData(prev => prev.filter(item => item.address !== address));
  };

  const handleDeleteSelected = async () => {
    if (!selectedKeys.length) {
      notification.error({
        message: "错误",
        description: "请先选择要删除的地址",
        duration: 1,
      });
      return;
    }
    setData(prev => prev.filter(item => !selectedKeys.includes(item.key)));
    setSelectedKeys([]);
  };

  return {
    data,
    setData,
    loading,
    batchLoading,
    setBatchLoading,
    selectedKeys,
    setSelectedKeys,
    handleRefresh,
    handleDelete,
    handleDeleteSelected,
  };
}; 