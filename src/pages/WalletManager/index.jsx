import { Card, Tabs } from 'antd';
import React from 'react';
import NetworkConfig from './NetworkConfig';
import WalletList from './WalletList';

const WalletManager = () => {
  const items = [
    {
      key: 'wallets',
      label: '钱包列表',
      children: <WalletList />,
    },
    {
      key: 'networks',
      label: '网络管理',
      children: <NetworkConfig />,
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Tabs defaultActiveKey="wallets" items={items} />
      </Card>
    </div>
  );
};

export default WalletManager; 