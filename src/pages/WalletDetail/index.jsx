import { ArrowLeftOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Card, Collapse, Radio, Spin, Table, Typography, message } from 'antd';
import { JsonRpcProvider, formatEther } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TransactionDetail from '../../components/TransactionDetail';
import { dbManager } from '../../utils/indexedDB';
import { convertEthToUsdt, formatAmount, useEthPrice } from '../../utils/priceUtils';
import { fetchTransactions } from '@/utils/transactionUtils';

const { Title, Text } = Typography;
const { Panel } = Collapse;

// 添加重试函数
const retryWithDelay = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`尝试失败，${delay / 1000}秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const WalletDetail = () => {
  const { address } = useParams();
  const navigate = useNavigate();
  const [ balances, setBalances ] = useState( {} );
  const [ loading, setLoading ] = useState( true );
  const [ unit, setUnit ] = useState( 'ETH' );
  const [ totalBalance, setTotalBalance ] = useState( '0' );
  const [ refreshing, setRefreshing ] = useState( false );
  const [ networks, setNetworks ] = useState( {} );
  const ethPrice = useEthPrice();
  const [ transactions, setTransactions ] = useState( [] );

  // 加载网络配置
  useEffect( () => {
    const loadNetworks = async () => {
      try {
        const networkList = await dbManager.getAllItems( 'networks' );
        const networksMap = networkList.reduce( ( acc, network ) => {
          acc[ network.chainId ] = {
            name: network.name,
            rpc: network.rpc,
            symbol: network.symbol,
            chainId: network.chainId
          };
          return acc;
        }, {} );
        setNetworks( networksMap );
      } catch ( error ) {
        console.error( '加载网络配置失败:', error );
        message.error( '加载网络配置失败' );
      }
    };

    loadNetworks();
  }, [] );

  useEffect( () => {
    const loadTransactions = async () => {
      try {
        const txs = await fetchTransactions( address );
        setTransactions( txs );
      } catch ( error ) {
        console.error( '获取交易记录失败:', error );
        message.error( '获取交易记录失败' );
      }
    };

    loadTransactions();
  }, [ address ] );

  // 修改获取单个网络的余额函数
  const getNetworkBalance = async ( network ) => {
    try {
      return await retryWithDelay( async () => {
        const provider = new JsonRpcProvider( network.rpc );
        const balance = await provider.getBalance( address );
        return formatEther( balance );
      } );
    } catch ( error ) {
      console.error( `获取${ network.name }余额失败:`, error );
      return '0';
    }
  };

  // 修改获取所有网络的余额函数
  const fetchAllBalances = async () => {
    setRefreshing( true );
    try {
      const newBalances = {};
      // 使用 Promise.allSettled 替代 Promise.all
      const results = await Promise.allSettled(
        Object.values( networks ).map( async network => {
          try {
            const balance = await getNetworkBalance( network );
            return { network, balance };
          } catch ( error ) {
            console.error( `获取${ network.name }余额失败:`, error );
            return { network, balance: '0' };
          }
        } )
      );

      // 处理结果
      results.forEach( result => {
        if ( result.status === 'fulfilled' ) {
          const { network, balance } = result.value;
          newBalances[ network.chainId ] = balance;
        }
      } );

      setBalances( newBalances );

      // 计算总余额
      const total = Object.values( newBalances ).reduce(
        ( sum, balance ) => sum + parseFloat( balance ),
        0
      );
      setTotalBalance( total.toString() );
    } catch ( error ) {
      console.error( '获取余额失败:', error );
      message.error( '部分网络余额获取失败，请稍后重试' );
    } finally {
      setRefreshing( false );
      setLoading( false );
    }
  };

  useEffect( () => {
    if ( Object.keys( networks ).length > 0 ) {
      fetchAllBalances();
    }
  }, [ networks, address ] );

  // 转换余额单位
  const convertBalance = ( balance ) => {
    if ( unit === 'USDT' ) {
      return formatAmount( convertEthToUsdt( balance ), 'USDT' );
    }
    return formatAmount( balance, 'ETH' );
  };

  const columns = [
    {
      title: '网络',
      dataIndex: 'network',
      key: 'network',
    },
    {
      title: `余额 (${ unit })`,
      dataIndex: 'balance',
      key: 'balance',
      render: ( balance ) => convertBalance( balance )
    }
  ];

  const data = Object.entries( balances ).map( ( [ chainId, balance ] ) => ( {
    key: chainId,
    network: networks[ chainId ]?.name || '未知网络',
    balance: balance
  } ) );

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate( '/wallet' )}
            >
              返回
            </Button>
            <Title level={2} style={{ margin: 0 }}>钱包详情</Title>
          </div>
          <Button
            icon={<SyncOutlined spin={refreshing} />}
            onClick={fetchAllBalances}
            loading={refreshing}
          >
            刷新余额
          </Button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <Text strong>钱包地址：</Text>
          <Text copyable>{address}</Text>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <Radio.Group
            value={unit}
            onChange={( e ) => setUnit( e.target.value )}
            style={{ marginBottom: '16px' }}
          >
            <Radio.Button value="ETH">ETH</Radio.Button>
            <Radio.Button value="USDT">USDT</Radio.Button>
          </Radio.Group>

          <div style={{ marginTop: '16px' }}>
            <Text strong>总余额：</Text>
            <Text>
              {convertBalance( totalBalance )} {unit}
            </Text>
          </div>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            pagination={false}
          />
        </Spin>

        <Collapse>
          {transactions.map( tx => (
            <Panel header={`交易哈希: ${ tx.hash }`} key={tx.hash}>
              <TransactionDetail transaction={tx} />
            </Panel>
          ) )}
        </Collapse>
      </Card>
    </div>
  );
};

export default WalletDetail; 