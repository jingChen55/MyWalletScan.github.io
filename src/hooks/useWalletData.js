import { useState, useEffect } from 'react';

export const useWalletData = ({
  storageKey,
  initialData = [],
}) => {
  const [data, setData] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : initialData;
  });

  const [loading, setLoading] = useState({
    table: false,
    batch: false,
    refresh: false,
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data, storageKey]);

  const updateData = (updater) => {
    const newData = typeof updater === 'function' ? updater(data) : updater;
    setData(newData);
    localStorage.setItem(storageKey, JSON.stringify(newData));
  };

  const addData = (newItems) => {
    updateData(prev => [...prev, ...newItems]);
  };

  const removeData = (predicate) => {
    updateData(prev => prev.filter(item => !predicate(item)));
  };

  const updateItem = (key, updater) => {
    updateData(prev => prev.map(item => 
      item.key === key ? updater(item) : item
    ));
  };

  return {
    data,
    loading,
    setLoading,
    updateData,
    addData,
    removeData,
    updateItem,
  };
}; 