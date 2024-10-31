import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Typography, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { dbManager } from '../../utils/indexedDB';

const { Title } = Typography;

const NetworkConfig = () => {
  const [networks, setNetworks] = useState([]);
  const [editingNetwork, setEditingNetwork] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(true);

  // 初始化数据库和加载数据
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await dbManager.init();
        const savedNetworks = await dbManager.getAllItems('networks') || [];
        console.log('加载的网络配置:', savedNetworks);
        setNetworks(savedNetworks);
      } catch (error) {
        console.error('加载网络配置失败:', error);
        message.error('加载网络配置失败');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // 处理表单提交
  const handleSubmit = async (values) => {
    try {
      const networkData = {
        ...values,
        chainId: parseInt(values.chainId),
        key: editingNetwork ? editingNetwork.chainId : parseInt(values.chainId)
      };

      // 检查是否已存在相同的 chainId
      const existingNetworks = await dbManager.getAllItems('networks') || [];
      const isDuplicate = existingNetworks.some(
        network => network.chainId === networkData.chainId && 
        (!editingNetwork || network.chainId !== editingNetwork.chainId)
      );

      if (isDuplicate) {
        message.error('该链ID已存在');
        return;
      }

      await dbManager.addItem('networks', networkData);
      const updatedNetworks = await dbManager.getAllItems('networks') || [];
      setNetworks(updatedNetworks);
      
      setIsModalVisible(false);
      form.resetFields();
      setEditingNetwork(null);
      message.success(`${editingNetwork ? '编辑' : '添加'}网络成功`);
    } catch (error) {
      console.error('保存网络配置失败:', error);
      message.error('保存网络配置失败: ' + error.message);
    }
  };

  // 处理删除
  const handleDelete = async (chainId) => {
    try {
      await dbManager.deleteItem('networks', chainId);
      const updatedNetworks = await dbManager.getAllItems('networks') || [];
      setNetworks(updatedNetworks);
      message.success('删除网络成功');
    } catch (error) {
      console.error('删除网络失败:', error);
      message.error('删除网络失败');
    }
  };

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
            onClick={() => {
              setEditingNetwork(record);
              form.setFieldsValue(record);
              setIsModalVisible(true);
            }}
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
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Title level={3}>网络配置</Title>
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
        loading={isLoading}
        locale={{ emptyText: '暂无数据' }}
      />

      <Modal
        title={editingNetwork ? '编辑网络' : '添加网络'}
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
          initialValues={editingNetwork}
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
            <Input placeholder="例如: 1" disabled={!!editingNetwork} />
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
    </>
  );
};

export default NetworkConfig; 