import { Table, Space, Tag, Button, Tooltip, notification, Popconfirm, Input } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  DeleteOutlined, 
  EditOutlined,
  ReloadOutlined, 
  SyncOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import { useState } from 'react';

const WalletTable = ({
  data,
  loading,
  selectedKeys,
  onSelectChange,
  onRefresh,
  onDelete,
  columns,
  scroll
}) => {
  const [hideColumn, setHideColumn] = useState(true);

  const toggleHideColumn = () => {
    setHideColumn(!hideColumn);
  };

  const processedColumns = columns.map(col => {
    if (typeof col.title === 'function') {
      return {
        ...col,
        title: col.title(data)
      };
    }
    return col;
  });

  const rowSelection = {
    selectedRowKeys: selectedKeys,
    onChange: onSelectChange,
  };

  return (
    <Table
      rowSelection={rowSelection}
      dataSource={data}
      columns={processedColumns}
      pagination={false}
      bordered
      size="small"
      scroll={scroll}
      loading={loading}
    />
  );
};

export default WalletTable; 