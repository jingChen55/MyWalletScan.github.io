import { processQueue } from '@utils/queueProcessor';

export const useBatchAdd = ({ 
  data, 
  setData, 
  fetchData,
  setLoading, 
  showSuccess, 
  showError 
}) => {
  const handleBatchAdd = async (processedAddresses, form = null) => {
    try {
      setLoading(true);
      let updatedData = [...data];

      // 先添加所有地址到数组中
      for (const { address, name } of processedAddresses) {
        const existingIndex = updatedData.findIndex(item => item.address === address);
        if (existingIndex === -1) {
          updatedData.push({
            key: address,
            address: address,
            name: name,
            result: "pending",
            loading: true
          });
        }
      }

      // 一次性更新所有新添加的地址
      setData(updatedData);

      // 创建任务队列
      const tasks = processedAddresses.map(({ address, name }) => async () => {
        try {
          const response = await fetchData(address);
          setData(prev => {
            const newData = [...prev];
            const index = newData.findIndex(item => item.address === address);
            if (index !== -1) {
              newData[index] = {
                ...newData[index],
                ...response,
                name: name,
                result: "success",
                loading: false
              };
            }
            return newData;
          });
          return { address, success: true };
        } catch (error) {
          console.error(`Error fetching data for address ${address}:`, error);
          setData(prev => {
            const newData = [...prev];
            const index = newData.findIndex(item => item.address === address);
            if (index !== -1) {
              newData[index] = {
                ...newData[index],
                result: "error",
                reason: error.message,
                loading: false
              };
            }
            return newData;
          });
          return { address, success: false, error };
        }
      });

      // 使用队列处理器执行任务
      const results = await processQueue(tasks, 2, (completed, total) => {
        console.log(`添加进度: ${completed}/${total}`);
      });

      const successCount = results.filter(r => r?.success).length;
      showSuccess(`批量添加完成，成功：${successCount}/${results.length}`);

      // 重置表单
      if (form && typeof form.resetFields === 'function') {
        try {
          form.resetFields();
        } catch (error) {
          console.error('Error resetting form:', error);
        }
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return handleBatchAdd;
}; 