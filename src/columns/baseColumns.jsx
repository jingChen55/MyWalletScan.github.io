import { convertEthToUsdt, useEthPrice } from '@/utils/priceUtils';
import { CheckCircleOutlined, CloseCircleOutlined, CopyOutlined, DeleteOutlined, EditOutlined, ReloadOutlined, SyncOutlined, } from '@ant-design/icons';
import { formatNumber } from '@utils/format';
import { Button, Input, notification, Popconfirm, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import { useMemo } from 'react';
const { Text } = Typography;

export const createBaseColumns = ( {
  type, // 'scroll' | 'linea'
  hideColumn,
  onRefresh,
  onDelete,
  onNameChange,
  tableData
} ) => {
  const ethPrice = useEthPrice();

  // 计算 fee 总和的函数
  const calculateTotalFee = ( data ) => {
    console.log( "🚀 ~ file: baseColumns.jsx:17 ~ calculateTotalFee ~ data:", data );
    // 如果传入的是列配置信息，返回 0
    if ( !Array.isArray( data ) || !data.length ) {
      return 0;
    }
    return data.reduce( ( total, item ) => {
      const fee = item.activity?.fee ? parseFloat( item.activity.fee ) : 0;
      const balance = item.balance ? parseFloat( item.balance ) : 0;
      return {
        fee: total.fee + fee,
        balance: total.balance + balance
      }
    }, { fee: 0, balance: 0 } );
  };


  const feeSummary = useMemo( () => {
    return calculateTotalFee( tableData )
  }, [ tableData ] )

  return [
    {
      title: "序号",
      key: "index",
      align: "center",
      width: 70,
      render: ( text, record, index ) => index + 1,
    },
    {
      title: "Ads编号",
      dataIndex: "name",
      width: 100,
      key: "name",
      align: "center",
      className: "name",
      render: ( text, record ) => {
        const displayText = text || <EditOutlined />;
        return (
          <Popconfirm
            title={
              <div>
                <Input
                  placeholder={"请输入ads 编号"}
                  defaultValue={text}
                  onChange={( e ) => {
                    record.name = e.target.value;
                  }}
                  allowClear
                  bordered
                />
              </div>
            }
            icon={<EditOutlined />}
            onConfirm={() => onNameChange?.( record )}
            okText={"确定"}
            cancelText={"取消"}
          >
            <Tag color="blue" style={{ cursor: "pointer" }}>
              {displayText}
            </Tag>
          </Popconfirm>
        );
      },
    },
    {
      title: "钱包地址",
      dataIndex: "address",
      width: 150,
      key: "address",
      align: "center",
      render: ( text ) => {
        const displayText = hideColumn ? text.slice( 0, 4 ) + "***" + text.slice( -4 ) : text;
        return (
          <Space>
            <span>{displayText}</span>
            <Button
              size="small"
              type="link"
              onClick={() => {
                navigator.clipboard.writeText( text );
                notification.success( {
                  message: "复制成功",
                  description: "地址已复制到剪贴板",
                  duration: 1,
                } );
              }}
              icon={<CopyOutlined />}
            />
          </Space>
        );
      },
    },
    {
      dataIndex: "balance",
      key: `${ type }_eth_balance`,
      align: "center",
      render: ( text, record ) => {
        const usdtBalance = convertEthToUsdt( record.balance, ethPrice )
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text style={{ fontSize: '12px' }}>
              {text}e
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ≈ {usdtBalance}
            </Text>
          </div>
        )
      },
      sorter: ( a, b ) => ( parseFloat( a.balance ) || 0 ) - ( parseFloat( b.balance ) || 0 ),
      title: ( _ ) => {
        const usdtBalance = convertEthToUsdt( feeSummary.balance, ethPrice )
        return (
          <div>
            <div>余额（E）</div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              总计: {formatNumber( feeSummary.balance )}
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ≈ {usdtBalance}
              </Text>
            </div>
          </div>
        )
      },
    },
    {
      title: "最后交易",
      dataIndex: [ "activity", "lastTx" ],
      key: `${ type }_latest_tx`,
      align: "center",
      render: ( text, record ) => (
        <Spin spinning={record.loading || false} size="small">
          <a href={`https://${ type }scan.com/address/${ record.address }`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ opacity: record.loading ? 0.5 : 1 }}>
            {text || '-'}
          </a>
        </Spin>
      ),
      sorter: {
        compare: ( a, b ) => {
          const aTime = a.activity?.lastTx ? new Date( a.activity.lastTx ).getTime() : 0;
          const bTime = b.activity?.lastTx ? new Date( b.activity.lastTx ).getTime() : 0;
          return aTime - bTime;
        },
        multiple: 2 // 设置排序优先级
      },
      defaultSortOrder: 'descend', // 默认降序排序
    },
    {
      title: "合约",
      dataIndex: [ "activity", "contractActivity" ],
      align: "center",
      render: ( text, record ) => (
        <Spin spinning={record.loading || false} size="small">
          <span>{text || 0}</span>
        </Spin>
      ),
      sorter: ( a, b ) => ( a.activity?.contractActivity || 0 ) - ( b.activity?.contractActivity || 0 ),
    },
    {
      dataIndex: [ "activity", "fee" ],
      align: "center",
      render: ( text, record ) => (
        <Spin spinning={record.loading || false} size="small">
          {text ? (
            <Tooltip title={`${ text }ETH`}>
              <Tag color="red">{formatNumber( text )}</Tag>
            </Tooltip>
          ) : '0'}
        </Spin>
      ),
      sorter: ( a, b ) => ( parseFloat( a.activity?.fee ) || 0 ) - ( parseFloat( b.activity?.fee ) || 0 ),
      title: ( _ ) => {
        const usdtBalance = convertEthToUsdt( feeSummary.fee, ethPrice )
        return (
          <div>
            <div>fee(E)</div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              总计: {formatNumber( feeSummary.fee )}
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ≈ {usdtBalance}
              </Text>
            </div>
          </div>
        )
      },
    },
    {
      title: "状态",
      key: "result",
      align: "center",
      render: ( text, record ) => (
        <Space>
          {record[ "result" ] === "success" && (
            <Tag icon={<CheckCircleOutlined />} color="success">
              成功
            </Tag>
          )}
          {record[ "result" ] === "error" && (
            <Tooltip title={record[ "reason" ]}>
              <Tag icon={<CloseCircleOutlined />} color="error">
                失败
              </Tag>
            </Tooltip>
          )}
          {record[ "result" ] === "pending" && (
            <Tag icon={<SyncOutlined spin />} color="processing">
              获取中
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "操作",
      key: "action",
      align: "center",
      width: 120,
      render: ( text, record ) => (
        <Space size="small" style={{ display: 'flex', justifyContent: 'center' }}>
          <Popconfirm
            title={"确认删除？"}
            onConfirm={() => onDelete?.( record.address )}
          >
            <Button
              icon={<DeleteOutlined />}
              size="middle"
              style={{ minWidth: '32px' }}
            />
          </Popconfirm>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => onRefresh?.( record.address )}
            loading={record.loading}
            size="middle"
            style={{ minWidth: '32px' }}
          />
        </Space>
      ),
    },
  ];
}; 