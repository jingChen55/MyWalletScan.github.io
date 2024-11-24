import { Space, Spin } from 'antd';
import React, { useMemo } from 'react';

const useLineaColumns = ( {
  hideColumn,
  lineaTotalPoints,
  handleDelete,
  handleRefresh
} ) => {
  const columns = useMemo( () => [
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      fixed: 'left',
      width: 380,
      render: ( text ) => <span className="address-cell">{text}</span>
    },
    {
      title: 'ETH余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      sorter: ( a, b ) => ( parseFloat( a.balance ) || 0 ) - ( parseFloat( b.balance ) || 0 ),
      render: ( _, record ) => (
        <Spin spinning={record.loading || false} size="small">
          <span>{record.balance ? parseFloat( record.balance ).toFixed( 4 ) : '0.0000'}</span>
        </Spin>
      )
    },
    {
      title: "LXP-L总积分(xp)",
      dataIndex: [ "xp", "lxp" ],
      align: "center",
      render: ( text, record ) => (
        <Spin spinning={record.loading || false} size="small">
          <span>{text || '-'}</span>
        </Spin>
      )
    },
    {
      title: '总积分',
      dataIndex: 'totalPoints',
      key: 'totalPoints',
      width: 100,
      sorter: ( a, b ) => ( lineaTotalPoints[ a.address ] || 0 ) - ( lineaTotalPoints[ b.address ] || 0 ),
      render: ( _, record ) => (
        <Spin spinning={record.loading || false} size="small">
          <span>{lineaTotalPoints[ record.address ] || 0}</span>
        </Spin>
      )
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: ( _, record ) => (
        <Space size="middle">
          <a
            onClick={() => handleRefresh( record.address )}
            style={{ opacity: record.loading ? 0.5 : 1 }}
            disabled={record.loading}
          >
            {record.loading ? '刷新中' : '刷新'}
          </a>
          <a
            onClick={() => handleDelete( record.address )}
            style={{ opacity: record.loading ? 0.5 : 1 }}
            disabled={record.loading}
          >
            删除
          </a>
        </Space>
      )
    }
  ], [ lineaTotalPoints, handleDelete, handleRefresh ] );

  const visibleColumns = useMemo( () => {
    if ( hideColumn ) {
      return columns.filter( col => col.key !== 'hiddenColumn' );
    }
    return columns;
  }, [ columns, hideColumn ] );

  return visibleColumns;
};

export default useLineaColumns;
