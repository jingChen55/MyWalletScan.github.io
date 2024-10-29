import { useCommonColumns } from './useCommonColumns';

export const useColumnGenerator = (type = 'scroll', options) => {
  const commonColumns = useCommonColumns({ type, ...options });

  const generateSpecificColumns = () => {
    // 这里只添加特定于 scroll 的列
    const specificColumns = [];
    return specificColumns;
  };

  return {
    commonColumns,
    specificColumns: generateSpecificColumns(),
  };
}; 