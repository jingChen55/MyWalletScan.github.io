import { Table } from 'antd';
import React from 'react';

const LineaTable = ( {
  data,
  loading,
  columns,
  selectedKeys,
  onSelectChange,
  onRefresh,
  onDelete
} ) => {
  const rowSelection = {
    selectedRowKeys: selectedKeys,
    onChange: onSelectChange,
  };

  return (
    <Table
      rowSelection={rowSelection}
      columns={columns}
      dataSource={data}
      loading={loading}
      scroll={{ x: 1300 }}
      rowKey={(record) => record.address}
    />
  );
};

export default LineaTable;
