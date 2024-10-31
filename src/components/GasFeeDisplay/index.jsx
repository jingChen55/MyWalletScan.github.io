import React, { useEffect, useState } from 'react';
import { Card, Typography } from 'antd';
import { formatEther } from 'ethers';
import { useEthPrice, convertEthToUsdt, formatAmount } from '../../utils/priceUtils';

const { Text } = Typography;

const GasFeeDisplay = ({ provider, selectedNetwork }) => {
  const [gasFees, setGasFees] = useState({
    fast: null,
    standard: null,
    slow: null
  });
  const ethPrice = useEthPrice();

  useEffect(() => {
    const fetchGasFees = async () => {
      if (!provider || !selectedNetwork) return;

      try {
        const feeData = await provider.getFeeData();
        const baseGasLimit = 21000n;

        const standardGasPrice = feeData.maxFeePerGas || feeData.gasPrice;
        const fastGasPrice = standardGasPrice * 120n / 100n;
        const slowGasPrice = standardGasPrice * 80n / 100n;

        const fees = {
          fast: formatEther(fastGasPrice * baseGasLimit),
          standard: formatEther(standardGasPrice * baseGasLimit),
          slow: formatEther(slowGasPrice * baseGasLimit)
        };

        setGasFees(fees);
      } catch (error) {
        console.error('获取 Gas 费用失败:', error);
      }
    };

    fetchGasFees();
    const interval = setInterval(fetchGasFees, 30000);
    return () => clearInterval(interval);
  }, [provider, selectedNetwork]);

  const convertToUSDT = (ethAmount) => {
    return formatAmount(convertEthToUsdt(ethAmount), 'USDT');
  };

  if (!provider || !selectedNetwork) return null;

  return (
    <div style={{ marginLeft: '16px', height: '60px', display: 'flex', alignItems: 'center' }}>
      <Text type="secondary" style={{ fontSize: '12px', marginRight: '8px', whiteSpace: 'nowrap' }}>Gas:</Text>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Card size="small" bodyStyle={{ padding: '4px 8px', height: '52px' }} style={{ height: '52px' }}>
          <div style={{ height: '44px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Text type="danger" style={{ fontSize: '12px', lineHeight: '1' }}>高速</Text>
            <div>
              <div style={{ fontSize: '12px', lineHeight: '1.2' }}>{gasFees.fast} {selectedNetwork.symbol}</div>
              <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.2' }}>≈${convertToUSDT(gasFees.fast)}</div>
            </div>
          </div>
        </Card>
        <Card size="small" bodyStyle={{ padding: '4px 8px', height: '52px' }} style={{ height: '52px' }}>
          <div style={{ height: '44px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Text type="warning" style={{ fontSize: '12px', lineHeight: '1' }}>标准</Text>
            <div>
              <div style={{ fontSize: '12px', lineHeight: '1.2' }}>{gasFees.standard} {selectedNetwork.symbol}</div>
              <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.2' }}>≈${convertToUSDT(gasFees.standard)}</div>
            </div>
          </div>
        </Card>
        <Card size="small" bodyStyle={{ padding: '4px 8px', height: '52px' }} style={{ height: '52px' }}>
          <div style={{ height: '44px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Text type="success" style={{ fontSize: '12px', lineHeight: '1' }}>缓慢</Text>
            <div>
              <div style={{ fontSize: '12px', lineHeight: '1.2' }}>{gasFees.slow} {selectedNetwork.symbol}</div>
              <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.2' }}>≈${convertToUSDT(gasFees.slow)}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GasFeeDisplay;