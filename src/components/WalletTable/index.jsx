import { Table } from 'antd';
import PropTypes from 'prop-types';

const WalletTable = ({ 
  data, 
  columns, 
  loading,
  selectedKeys,
  onSelectChange,
  scroll
}) => {
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
      rowKey={(record) => record.address}
      pagination={false}
      scroll={scroll}
    />
  );
};

WalletTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  selectedKeys: PropTypes.array,
  onSelectChange: PropTypes.func,
  scroll: PropTypes.object
};

WalletTable.defaultProps = {
  loading: false,
  selectedKeys: [],
  onSelectChange: () => {},
  scroll: {}
};

export default WalletTable; 