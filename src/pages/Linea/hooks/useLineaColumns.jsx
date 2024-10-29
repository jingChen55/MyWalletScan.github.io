import { createBaseColumns } from '@/columns/baseColumns';
import { Spin } from 'antd';

const useLineaColumns = (options) => {
  const baseColumns = createBaseColumns({
    type: 'linea',
    ...options
  });

  const lineaSpecificColumns = [
    {
      title: "LXP-L总积分(xp)",
      dataIndex: ["xp", "lxp"],
      align: "center",
      render: (text, record) => (
        <Spin spinning={record.loading || false} size="small">
          <span>{text || '-'}</span>
        </Spin>
      ),
      sorter: {
        compare: (a, b) => {
          const aValue = a.xp?.lxp || 0;
          const bValue = b.xp?.lxp || 0;
          return aValue - bValue;
        },
        multiple: 1
      },
      defaultSortOrder: 'descend', // 默认降序排序
    },
  ];

  const ethColumnIndex = baseColumns.findIndex(col => col.key === 'linea_eth_balance');
  const firstPart = baseColumns.slice(0, ethColumnIndex + 1);
  const secondPart = baseColumns.slice(ethColumnIndex + 1);

  return [...firstPart, ...lineaSpecificColumns, ...secondPart];
};

export default useLineaColumns;
