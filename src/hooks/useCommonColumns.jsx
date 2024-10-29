import { Tag, Tooltip, Spin, Space, Button, Popconfirm, notification, Input } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  DeleteOutlined, 
  EditOutlined,
  ReloadOutlined, 
  CopyOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { formatNumber } from '@utils/format';

export const useCommonColumns = ({
  type, // 'scroll' | 'linea'
  hideColumn,
  onRefresh,
  onDelete,
}) => {
  const commonColumns = [
    {
      title: "#",
      key: "index",
      align: "center",
      render: (text, record, index) => index + 1,
    },
    {
      title: "备注",
      dataIndex: "name",
      key: "name",
      align: "center",
      className: "name",
      render: (text, record) => {
        const displayText = text || <EditOutlined />;
        return (
          <Popconfirm
            title={
              <div>
                <Input
                  placeholder={"请输入备注"}
                  defaultValue={text}
                  onChange={(e) => {
                    record.name = e.target.value;
                  }}
                  allowClear
                  bordered
                />
              </div>
            }
            icon={<EditOutlined />}
            onConfirm={() => record.onNameChange?.(record.name)}
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
      key: "address",
      align: "center",
      render: (text) => {
        const displayText = hideColumn ? text.slice(0, 4) + "***" + text.slice(-4) : text;
        return (
          <Space>
            <span>{displayText}</span>
            <Button
              size="small"
              type="link"
              onClick={() => {
                navigator.clipboard.writeText(text);
                notification.success({
                  message: "复制成功",
                  description: "地址已复制到剪贴板",
                  duration: 1,
                });
              }}
              icon={<CopyOutlined />}
            />
          </Space>
        );
      },
    },
    {
      title: "ETH",
      dataIndex: "balance",
      key: `${type}_eth_balance`,
      align: "center",
      render: (text, record) => (
        <Spin spinning={record.loading || false} size="small">
          <span>{formatNumber(text || 0)}</span>
        </Spin>
      ),
      sorter: (a, b) => (parseFloat(a.balance) || 0) - (parseFloat(b.balance) || 0),
    },
    {
      title: "最后交易",
      dataIndex: ["activity", "lastTx"],
      key: `${type}_latest_tx`,
      align: "center",
      render: (text, record) => (
        <Spin spinning={record.loading || false} size="small">
          <a href={`https://${type}scan.com/address/${record.address}`}
             target="_blank"
             rel="noopener noreferrer"
             style={{ opacity: record.loading ? 0.5 : 1 }}>
            {text || '-'}
          </a>
        </Spin>
      ),
    },
    {
      title: "合约",
      dataIndex: ["activity", "contractActivity"],
      align: "center",
      render: (text, record) => (
        <Spin spinning={record.loading || false} size="small">
          <span>{text || 0}</span>
        </Spin>
      ),
      sorter: (a, b) => (a.activity?.contractActivity || 0) - (b.activity?.contractActivity || 0),
    },
    {
      title: "fee(E)",
      dataIndex: ["activity", "fee"],
      align: "center",
      render: (text, record) => (
        <Spin spinning={record.loading || false} size="small">
          {text ? (
            <Tooltip title={`${text}ETH`}>
              <Tag color="red">{formatNumber(text)}</Tag>
            </Tooltip>
          ) : '0'}
        </Spin>
      ),
      sorter: (a, b) => (parseFloat(a.activity?.fee) || 0) - (parseFloat(b.activity?.fee) || 0),
    },
    {
      title: "状态",
      key: "result",
      align: "center",
      render: (text, record) => (
        <Space>
          {record["result"] === "success" && (
            <Tag icon={<CheckCircleOutlined />} color="success">
              成功
            </Tag>
          )}
          {record["result"] === "error" && (
            <Tooltip title={record["reason"]}>
              <Tag icon={<CloseCircleOutlined />} color="error">
                失败
              </Tag>
            </Tooltip>
          )}
          {record["result"] === "pending" && (
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
      render: (text, record) => (
        <Space>
          <Popconfirm
            title={"确认删除？"}
            onConfirm={() => onDelete?.(record.address)}
          >
            <Button icon={<DeleteOutlined />} />
          </Popconfirm>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => onRefresh?.(record.address)}
            loading={record.loading}
          />
        </Space>
      ),
    },
  ];

  return commonColumns;
}; 