import React from 'react';
import { Card, Typography } from 'antd';
import ReactFlow, { MiniMap, Controls, Background } from 'react-flow-renderer';
import { useEthPrice } from '@/utils/priceUtils';

const { Text } = Typography;

const TransactionDetail = ({ transaction }) => {
  const { hash, status, timestamp, from, to, gasPrice, gasUsed, value } = transaction;
  const ethPrice = useEthPrice();

  const gasCostEth = parseFloat(gasPrice) * parseFloat(gasUsed) / 1e9;
  const gasCostUsd = (gasCostEth * ethPrice).toFixed(2);

  // 定义流程图的节点和边
  const elements = [
    { id: '1', type: 'input', data: { label: `创建: ${hash}` }, position: { x: 0, y: 0 } },
    { id: '2', data: { label: `发送: ${from}` }, position: { x: 200, y: 0 } },
    { id: '3', data: { label: `接收: ${to}` }, position: { x: 400, y: 0 } },
    { id: '4', type: 'output', data: { label: `完成: ${status}` }, position: { x: 600, y: 0 } },
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e2-3', source: '2', target: '3', animated: true },
    { id: 'e3-4', source: '3', target: '4', animated: true },
  ];

  return (
    <Card title={`交易详情`} style={{ marginBottom: '16px' }}>
      <div style={{ height: 150 }}>
        <ReactFlow elements={elements}>
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
      <div style={{ marginTop: '16px' }}>
        <p><Text strong>时间戳:</Text> {new Date(timestamp).toLocaleString()}</p>
        <p><Text strong>交易金额:</Text> {value} ETH</p>
        <p><Text strong>Gas 价格:</Text> {gasPrice} Gwei</p>
        <p><Text strong>交易费用:</Text> {gasCostEth.toFixed(6)} ETH (${gasCostUsd})</p>
      </div>
    </Card>
  );
};

export default TransactionDetail; 