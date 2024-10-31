import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Popconfirm, Table, Typography, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { IndexedDBManager } from '../../utils/indexedDB';

const { Title } = Typography;

const NetworkConfig = () => {
  const [networks, setNetworks] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState(null);
  const [form] = Form.useForm();
  const [dbManager, setDbManager] = useState(null);

  // 初始化数据库
  useEffect(() => {
    const initDB = async () => {
      try {
        const manager = new IndexedDBManager('NetworkDB', 1);
        await manager.init('networks', 'chainId');
        setDbManager(manager);
        await loadNetworks(manager);
      } catch (error) {
        console.error('初始化数据库失败:', error);
        message.error('初始化数据库失败');
      }
    };

    initDB();
  }, []);

  // 加载网络配置
  const loadNetworks = async (manager) => {
    try {
      const savedNetworks = await manager.getAllItems('networks');
      setNetworks(savedNetworks);
    } catch (error) {
      console.error('加载网络配置失败:', error);
      message.error('加载网络配置失败');
    }
  };

  // 处理添加/编辑网络
  const handleSubmit = async (values) => {
    try {
      const networkData = {
        ...values,
        chainId: parseInt(values.chainId),
        key: editingNetwork ? editingNetwork.key : values.chainId
      };

      await dbManager.addItem('networks', networkData);
      await loadNetworks(dbManager);
      
      setIsModalVisible(false);
      form.resetFields();
      setEditingNetwork(null);
      message.success(`${editingNetwork ? '编辑' : '添加'}网络成功`);
    } catch (error) {
      console.error('保存网络配置失败:', error);
      message.error('保存网络配置失败');
    }
  };

  // 处理删除网络
  const handleDelete = async (chainId) => {
    try {
      await dbManager.deleteItem('networks', chainId);
      await loadNetworks(dbManager);
      message.success('删除网络成功');
    } catch (error) {
      console.error('删除网络失败:', error);
      message.error('删除网络失败');
    }
  };

  // 编辑网络
  const handleEdit = (network) => {
    setEditingNetwork(network);
    form.setFieldsValue(network);
    setIsModalVisible(true);
  };

  // 表格列配置
  const columns = [
    {
      title: '网络名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '链ID',
      dataIndex: 'chainId',
      key: 'chainId',
    },
    {
      title: 'RPC URL',
      dataIndex: 'rpc',
      key: 'rpc',
      ellipsis: true,
    },
    {
      title: '代币符号',
      dataIndex: 'symbol',
      key: 'symbol',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个网络吗？"
            onConfirm={() => handleDelete(record.chainId)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Title level={2}>网络配置</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingNetwork(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            添加网络
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={networks}
          pagination={false}
        />

        <Modal
          title={`${editingNetwork ? '编辑' : '添加'}网络`}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
            setEditingNetwork(null);
          }}
          footer={null}
        >
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
          >
            <Form.Item
              name="name"
              label="网络名称"
              rules={[{ required: true, message: '请输入网络名称' }]}
            >
              <Input placeholder="例如: Ethereum" />
            </Form.Item>

            <Form.Item
              name="chainId"
              label="链ID"
              rules={[
                { required: true, message: '请输入链ID' },
                { pattern: /^\d+$/, message: '链ID必须是数字' }
              ]}
            >
              <Input placeholder="例如: 1" />
            </Form.Item>

            <Form.Item
              name="rpc"
              label="RPC URL"
              rules={[
                { required: true, message: '请输入RPC URL' },
                { type: 'url', message: '请输入有效的URL' }
              ]}
            >
              <Input placeholder="例如: https://ethereum.example.com" />
            </Form.Item>

            <Form.Item
              name="symbol"
              label="代币符号"
              rules={[{ required: true, message: '请输入代币符号' }]}
            >
              <Input placeholder="例如: ETH" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                {editingNetwork ? '保存' : '添加'}
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default NetworkConfig; 