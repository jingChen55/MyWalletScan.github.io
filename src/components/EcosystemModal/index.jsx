import React from 'react';
import { Modal } from 'antd';

const EcosystemModal = ({ visible, onCancel }) => {
  return (
    <Modal
      title="生态系统"
      open={visible}
      onCancel={onCancel}
      footer={null}
    >
      {/* 在这里添加你的生态系统内容 */}
    </Modal>
  );
};

export default EcosystemModal; 