import React from 'react';
import { Modal, Form, Input } from 'antd';

const BatchAddModal = ({
  visible,
  onOk,
  onCancel,
  form,
  loading
}) => {
  return (
    <Modal
      title="批量添加地址"
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={800}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="地址"
          name="addresses"
          rules={[
            {
              required: true,
              validator: (_, value) => {
                if (!value) {
                  return Promise.reject('请输入地址');
                }
                const lines = value.split('\n');
                let errorLines = [];
                
                for (let i = 0; i < lines.length; i++) {
                  const line = lines[i].trim();
                  if (!line) continue;
                  
                  // 分割备注和地址
                  const parts = line.split(/\s+/);
                  const address = parts.length > 1 ? parts[parts.length - 1] : parts[0];
                  
                  // 验证地址格式
                  const cleanAddress = address.startsWith('0x') ? address : `0x${address}`;
                  if (cleanAddress.length !== 42) {
                    errorLines.push(i + 1);
                  }
                }
                
                if (errorLines.length) {
                  return Promise.reject(
                    `行 ${errorLines.join(', ')} 的地址格式错误，请输入正确的地址`
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input.TextArea
            placeholder="请输入地址，每行一个。支持格式：
1. 纯地址：0x123...
2. 备注+地址：备注 0x123...
每行一个地址"
            autoSize={{ minRows: 4, maxRows: 10 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BatchAddModal;
