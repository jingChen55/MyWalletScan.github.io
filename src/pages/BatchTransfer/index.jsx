import { DeleteOutlined, ImportOutlined, PlusOutlined, SendOutlined, SyncOutlined } from '@ant-design/icons';
import { decryptFromStorage } from '@utils/cryptoUtils';
import { Button, Card, Form, Input, InputNumber, message, Modal, Select, Table, Tooltip, Typography } from 'antd';
import { formatEther, JsonRpcProvider, parseEther } from 'ethers';
import React, { useEffect, useState } from 'react';
import GasFeeDisplay from '../../components/GasFeeDisplay';
import { dbManager } from '../../utils/indexedDB';
import { convertEthToUsdt, formatAmount, useEthPrice } from '../../utils/priceUtils';
import { executeTransfer } from '../../utils/transferUtils';

const { Title, Text } = Typography;
const { Option } = Select;

// 添加地址脱敏函数
const maskAddress = ( address ) => {
  if ( !address ) return '';
  return `${ address.slice( 0, 6 ) }...${ address.slice( -4 ) }`;
};

// 添加重试函数
const retryWithDelay = async ( fn, retries = 3, delay = 1000 ) => {
  for ( let i = 0; i < retries; i++ ) {
    try {
      return await fn();
    } catch ( error ) {
      if ( i === retries - 1 ) throw error;
      console.log( `尝败，${ delay / 1000 }秒后重试...` );
      await new Promise( resolve => setTimeout( resolve, delay ) );
    }
  }
};

const BatchTransfer = () => {
  const [ form ] = Form.useForm();
  const [ networks, setNetworks ] = useState( [] );
  const [ wallets, setWallets ] = useState( [] );
  const [ loading, setLoading ] = useState( false );
  const [ selectedNetwork, setSelectedNetwork ] = useState( null );
  const [ transferPairs, setTransferPairs ] = useState( [] );
  const [ isModalVisible, setIsModalVisible ] = useState( false );
  const [ isImportModalVisible, setIsImportModalVisible ] = useState( false );
  const [ executing, setExecuting ] = useState( false );
  const [ provider, setProvider ] = useState( null );
  const [ globalForm ] = Form.useForm();
  const ethPrice = useEthPrice();

  // 加载网络和钱包数据
  useEffect( () => {
    const loadData = async () => {
      try {
        const [ networkList, walletList ] = await Promise.all( [
          dbManager.getAllItems( 'networks' ),
          dbManager.getAllWallets()
        ] );
        setNetworks( networkList );
        setWallets( walletList );
      } catch ( error ) {
        message.error( '加载数据失败' );
      }
    };
    loadData();
  }, [] );

  // 修改余额刷新功能
  const refreshBalances = async () => {
    console.log( '刷新余额开始' );
    if ( !selectedNetwork || !provider ) {
      message.error( '请先选择网络' );
      return;
    }

    try {
      message.loading( { content: '正在刷新余额...', key: 'refreshBalance' } );

      // 获取当前列表中所有钱包的地址
      const addresses = transferPairs.map( pair => pair.fromAddress );
      // 去重
      const uniqueAddresses = [ ...new Set( addresses ) ];

      console.log( '需要刷新余额的地址:', uniqueAddresses );

      // 获取所有钱包的余额
      const updatedBalances = await Promise.all(
        uniqueAddresses.map( async address => {
          try {
            console.log( `获取钱包 ${ address } 的余额` );
            const balance = await provider.getBalance( address );
            console.log( `钱包 ${ address } 余额:`, formatEther( balance ) );
            return {
              address,
              balance: formatEther( balance )
            };
          } catch ( error ) {
            console.error( `获取钱包 ${ address } 余额失败:`, error );
            return {
              address,
              balance: '0'
            };
          }
        } )
      );

      // 更新钱包列表
      const balanceMap = updatedBalances.reduce( ( acc, { address, balance } ) => {
        acc[ address ] = balance;
        return acc;
      }, {} );

      // 只更新当前列表中的钱包余额
      const updatedWalletsList = wallets.map( wallet => ( {
        ...wallet,
        balance: balanceMap[ wallet.address ] || wallet.balance
      } ) );

      console.log( '更新后的钱包列表:', updatedWalletsList );
      setWallets( updatedWalletsList );
      message.success( { content: '余额刷新成功', key: 'refreshBalance' } );
    } catch ( error ) {
      console.error( '刷新余额失败:', error );
      message.error( { content: '刷新余额失败', key: 'refreshBalance' } );
    }
  };

  // 修改网络选择处理函数
  const handleNetworkChange = async ( value ) => {
    console.log( '选择网络:', value );
    const network = networks.find( n => n.chainId === value );
    setSelectedNetwork( network );
    if ( network ) {
      try {
        // 为选定的网络创建新的 provider
        const newProvider = new JsonRpcProvider( network.rpc );
        setProvider( newProvider );
        message.success( '网络切换成功' );
      } catch ( error ) {
        console.error( '网络切换失败:', error );
        message.error( '网络切换失败' );
      }
    }
  };

  // 修改执行单个转账函数
  const handleSingleTransfer = async (pair) => {
    if (!selectedNetwork || !provider) {
      message.error('请先选择网络');
      return;
    }

    // 使用 Modal.confirm 而不是 Modal.confirm
    Modal.confirm({
      title: '请输入密码',
      content: (
        <Input.Password
          id="transfer-password-input"  // 添加 id 以便获取
          placeholder="请输入密码"
        />
      ),
      okText: '确认',
      cancelText: '取消',
      async onOk() {
        const passwordInput = document.getElementById('transfer-password-input');
        const password = passwordInput?.value;
        
        if (!password) {
          message.error('请输入密码');
          return Promise.reject('请输入密码');
        }

        try {
          // 获取钱包信息
          const wallet = wallets.find(w => w.address === pair.fromAddress);
          if (!wallet || !wallet.encryptedPrivateKey) {
            throw new Error('找不到钱包或私钥为空');
          }

          // 解密私钥
          const privateKey = decryptFromStorage(wallet.encryptedPrivateKey, password);
          if (!privateKey) {
            throw new Error('密码错误，解密失败');
          }

          // 更新状态为执行中
          const updatedPairs = transferPairs.map(p =>
            p.key === pair.key ? { ...p, status: 'pending', error: null } : p
          );
          setTransferPairs(updatedPairs);

          // 执行转账
          const result = await executeTransfer({
            fromAddress: pair.fromAddress,
            toAddress: pair.toAddress,
            provider,
            privateKey,
            reserveAmount: globalForm.getFieldValue('reserveAmount') || '0'
          });

          // 更新状态为成功
          setTransferPairs(prev => prev.map(p =>
            p.key === pair.key ? {
              ...p,
              status: 'success',
              actualGas: result.gasCost,
              error: null
            } : p
          ));

          message.success('转账执行成功');
          await refreshBalances();
        } catch (error) {
          console.error('转账执行失败:', error);
          // 更新状态为失败
          setTransferPairs(prev => prev.map(p =>
            p.key === pair.key ? {
              ...p,
              status: 'failed',
              error: error.message
            } : p
          ));
          message.error('转账执行失败: ' + error.message);
          return Promise.reject(error);
        }
      },
      onCancel() {
        message.info('已取消转账');
      },
    });
  };

  // 修改批量转账函数
  const handleBatchTransfer = async () => {
    if (!selectedNetwork || !provider) {
      message.error('请先选择网络');
      return;
    }

    Modal.confirm({
      title: '请输入密码',
      content: (
        <Input.Password
          id="batch-transfer-password-input"
          placeholder="请输入密码"
        />
      ),
      okText: '确认',
      cancelText: '取消',
      async onOk() {
        const passwordInput = document.getElementById('batch-transfer-password-input');
        const password = passwordInput?.value;
        
        if (!password) {
          message.error('请输入密码');
          return Promise.reject('请输入密码');
        }

        setExecuting(true);
        try {
          const updatedPairs = [...transferPairs];
          // 遍历所有待执行的转账对
          for (let i = 0; i < updatedPairs.length; i++) {
            const pair = updatedPairs[i];
            if (pair.status !== 'pending') continue;

            try {
              // 获取钱包信息
              const wallet = wallets.find(w => w.address === pair.fromAddress);
              if (!wallet || !wallet.encryptedPrivateKey) {
                throw new Error('找不到钱包或私钥为空');
              }

              // 解密私钥
              const privateKey = decryptFromStorage(wallet.encryptedPrivateKey, password);
              if (!privateKey) {
                throw new Error('密码错误，解密失败');
              }

              // 执行转账
              const result = await executeTransfer({
                fromAddress: pair.fromAddress,
                toAddress: pair.toAddress,
                provider,
                privateKey,
                reserveAmount: globalForm.getFieldValue('reserveAmount') || '0'
              });

              // 更新状态为成功
              updatedPairs[i] = {
                ...pair,
                status: 'success',
                actualGas: result.gasCost,
                error: null
              };
            } catch (error) {
              console.error(`转账失败 (${pair.fromAddress} -> ${pair.toAddress}):`, error);
              updatedPairs[i] = {
                ...pair,
                status: 'failed',
                error: error.message
              };
            }
            setTransferPairs([...updatedPairs]);
          }
          message.success('批量转账执行完成');
          await refreshBalances();
        } catch (error) {
          console.error('批量转账执行失败:', error);
          message.error('批量转账执行失败: ' + error.message);
        } finally {
          setExecuting(false);
        }
      },
      onCancel() {
        message.info('已取消批量转账');
      },
    });
  };

  // 添加转账对
  const handleAddPair = async ( values ) => {
    try {
      const newPair = {
        fromAddress: values.fromAddress,
        toAddress: values.toAddress,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // 保存到数据库
      const savedPair = await dbManager.addTransferPair( newPair );
      setTransferPairs( [ ...transferPairs, { ...savedPair, key: savedPair.id } ] );
      setIsModalVisible( false );
      form.resetFields();
      message.success( '添加转账对成功' );
    } catch ( error ) {
      console.error( '添加转账对失败:', error );
      message.error( '添加转账对失败' );
    }
  };

  // 导入转账对
  const handleImport = async ( values ) => {
    console.log( '开始导入，输入数据:', values );
    try {
      const pairs = values.pairs.trim().split( '\n' )
        .map( line => {
          console.log( '处理行:', line );
          const [ fromAddress, toAddress ] = line.trim().split( /\s+/ );
          console.log( '解析结果:', { fromAddress, toAddress } );
          if ( !fromAddress || !toAddress ) {
            console.log( '无效行，跳过' );
            return null;
          }
          return {
            fromAddress,
            toAddress,
            status: 'pending',
            createdAt: new Date().toISOString()
          };
        } )
        .filter( pair => pair !== null );

      console.log( '解析后的转账对:', pairs );

      // 保存到数据库
      console.log( '开始保存到数据库' );
      const savedPairs = await dbManager.addTransferPairs( pairs );
      console.log( '数据库保存结果:', savedPairs );

      const newPairs = savedPairs.map( pair => ( { ...pair, key: pair.id } ) );
      console.log( '处理后的新转账对:', newPairs );

      setTransferPairs( [ ...transferPairs, ...newPairs ] );
      setIsImportModalVisible( false );
      message.success( `成功导入 ${ pairs.length } 个转账对` );
    } catch ( error ) {
      console.error( '批量导入失败:', error );
      message.error( '批量导入失败: ' + error.message );
    }
  };

  const handleAmountChange = ( value, record ) => {
    const updatedPairs = transferPairs.map( pair =>
      pair.key === record.key ? { ...pair, amount: value } : pair
    );
    setTransferPairs( updatedPairs );
  };

  // 修改 TransferAmount 组件
  const TransferAmount = ( { record, selectedNetwork, provider, globalForm } ) => {
    const [ amount, setAmount ] = useState( '-' );

    useEffect( () => {
      const calculateAmount = async () => {
        if ( !selectedNetwork || !provider ) return;
        try {
          // 获取当前余额
          const balance = await provider.getBalance( record.fromAddress );
          console.log( `钱包 ${ record.fromAddress } 当前余额:`, formatEther( balance ) );

          // 获取保留金额
          const reserveAmount = globalForm.getFieldValue( 'reserveAmount' );
          if ( !reserveAmount && reserveAmount !== 0 ) {
            setAmount( '请设置保留金额' );
            return;
          }

          const reserveEther = parseEther( reserveAmount.toString() );
          console.log( '保留金额:', formatEther( reserveEther ) );

          // 估算 gas 费用
          const feeData = await provider.getFeeData();
          const gasLimit = 21000n; // 基本转账的 gas 限制，使用 BigInt
          const gasPrice = feeData.maxFeePerGas || feeData.gasPrice;
          console.log( 'Gas Price:', formatEther( gasPrice ) );

          const gasCost = gasPrice * gasLimit;
          console.log( '预估 gas 费用:', formatEther( gasCost ) );

          // 计算可转账金额：当前余额 - 保留金额 - gas费用
          const availableAmount = balance - reserveEther - gasCost;
          console.log( '可转账金额:', formatEther( availableAmount ) );

          if ( availableAmount <= 0n ) {
            setAmount( '余额不足' );
          } else {
            setAmount( `${ formatEther( availableAmount ) } ${ selectedNetwork.symbol || 'ETH' }` );
          }
        } catch ( error ) {
          console.error( '计算转账金额失败:', error );
          console.error( '错误详情:', error.message );
          setAmount( '计算失败' );
        }
      };

      calculateAmount();
    }, [ selectedNetwork, provider, record.fromAddress, record.toAddress, globalForm ] );

    return (
      <Text
        type={
          amount === '余额不足' ||
            amount === '计算失败' ||
            amount === '请设置保留金额'
            ? 'danger'
            : undefined
        }
      >
        {amount}
      </Text>
    );
  };

  // 添加 GasEstimate 组件
  const GasEstimate = ( { provider, selectedNetwork } ) => {
    const [ gasEstimate, setGasEstimate ] = useState( '-' );

    useEffect( () => {
      const estimateGas = async () => {
        if ( !selectedNetwork || !provider ) return;
        try {
          // 获取 gas 价格
          const feeData = await provider.getFeeData();
          const gasLimit = 21000n; // 基本转账的 gas 限制
          const gasPrice = feeData.maxFeePerGas || feeData.gasPrice;
          const gasCost = gasPrice * gasLimit;
          setGasEstimate( `${ formatEther( gasCost ) } ${ selectedNetwork.symbol || 'ETH' }` );
        } catch ( error ) {
          console.error( '计算 Gas 费用失败:', error );
          setGasEstimate( '计算失败' );
        }
      };

      estimateGas();
    }, [ selectedNetwork, provider ] );

    return <Text>{gasEstimate}</Text>;
  };

  // 添加 ETH 价格获取函数
  useEffect( () => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch( 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd' );
        const data = await response.json();
        setEthPrice( data.ethereum.usd );
      } catch ( error ) {
        console.error( '获取ETH价格失败:', error );
      }
    };

    fetchEthPrice();
    const interval = setInterval( fetchEthPrice, 60000 ); // 每分钟更新一次价格
    return () => clearInterval( interval );
  }, [] );

  // 创建独立的组件来显示转账金额
  const TransferAmountCell = ( { record, selectedNetwork, provider, globalForm, ethPrice } ) => {
    const [ amount, setAmount ] = useState( '-' );
    const [ usdtAmount, setUsdtAmount ] = useState( '-' );

    useEffect( () => {
      const calculateAmount = async () => {
        if ( !selectedNetwork || !provider ) return;
        try {
          const balance = await provider.getBalance( record.fromAddress );
          const reserveAmount = globalForm.getFieldValue( 'reserveAmount' );
          if ( !reserveAmount && reserveAmount !== 0 ) {
            setAmount( '请设置保留金额' );
            return;
          }

          const reserveEther = parseEther( reserveAmount.toString() );
          const feeData = await provider.getFeeData();
          const gasLimit = 21000n;
          const gasPrice = feeData.maxFeePerGas || feeData.gasPrice;
          const gasCost = gasPrice * gasLimit;
          const availableAmount = balance - reserveEther - gasCost;

          if ( availableAmount <= 0n ) {
            setAmount( '余额不足' );
            setUsdtAmount( '-' );
          } else {
            const ethAmount = formatEther( availableAmount );
            setAmount( ethAmount );
            setUsdtAmount( ( parseFloat( ethAmount ) * ethPrice ).toFixed( 2 ) );
          }
        } catch ( error ) {
          setAmount( '计算失败' );
          setUsdtAmount( '-' );
        }
      };

      calculateAmount();
    }, [ selectedNetwork, provider, record.fromAddress, globalForm, ethPrice ] );

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Text
          type={amount === '余额不足' || amount === '计算失败' ? 'danger' : undefined}
          style={{ fontSize: '12px' }}
        >
          {amount === '余额不足' || amount === '计算失败' ? amount : `${ amount } ${ selectedNetwork?.symbol || 'ETH' }`}
        </Text>
        {amount !== '余额不足' && amount !== '计算失败' && amount !== '请设置保留金额' && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ≈ ${usdtAmount}
          </Text>
        )}
      </div>
    );
  };

  // 创建独立的组件来显示预估 Gas 费用
  const GasEstimateCell = ( { provider, selectedNetwork, ethPrice } ) => {
    const [ gasEstimate, setGasEstimate ] = useState( '-' );
    const [ usdtGasEstimate, setUsdtGasEstimate ] = useState( '-' );

    useEffect( () => {
      const estimateGas = async () => {
        if ( !selectedNetwork || !provider ) return;
        try {
          const feeData = await provider.getFeeData();
          const gasLimit = 21000n;
          const gasPrice = feeData.maxFeePerGas || feeData.gasPrice;
          const gasCost = gasPrice * gasLimit;
          const ethAmount = formatEther( gasCost );
          setGasEstimate( ethAmount );
          setUsdtGasEstimate( ( parseFloat( ethAmount ) * ethPrice ).toFixed( 2 ) );
        } catch ( error ) {
          setGasEstimate( '计算失败' );
          setUsdtGasEstimate( '-' );
        }
      };

      estimateGas();
    }, [ selectedNetwork, provider, ethPrice ] );

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Text style={{ fontSize: '12px' }}>
          {gasEstimate} {selectedNetwork?.symbol || 'ETH'}
        </Text>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          ≈ ${usdtGasEstimate}
        </Text>
      </div>
    );
  };

  // 修改表格列配置
  const columns = [
    {
      title: '发送地址',
      width: 180,
      dataIndex: 'fromAddress',
      key: 'fromAddress',
      render: ( address ) => {
        const wallet = wallets.find( w => w.address === address );
        return (
          <div>
            <div>{wallet?.name || '未知钱包'}</div>
            <Text type="secondary" copyable={{ text: address }}>
              {maskAddress( address )}
            </Text>
          </div>
        );
      }
    },
    {
      title: '钱包余额',
      width: 150,
      key: 'balance',
      render: ( _, record ) => {
        const wallet = wallets.find( w => w.address === record.fromAddress );
        const ethBalance = wallet ? formatAmount( wallet.balance, 'ETH' ) : '0';
        const usdtBalance = wallet ? formatAmount( convertEthToUsdt( wallet.balance ), 'USDT' ) : '0';
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text style={{ fontSize: '12px' }}>
              {ethBalance} {selectedNetwork?.symbol || 'ETH'}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ≈ ${usdtBalance}
            </Text>
          </div>
        );
      }
    },
    {
      title: '接收地址',
      dataIndex: 'toAddress',
      width: 180,
      key: 'toAddress',
      render: ( address ) => (
        <Text copyable={{ text: address }}>
          {maskAddress( address )}
        </Text>
      )
    },
    {
      title: '保留数量',
      width: 150,
      key: 'reserveAmount',
      render: () => {
        const reserveAmount = globalForm.getFieldValue( 'reserveAmount' ) || '0';
        const usdtAmount = ( parseFloat( reserveAmount ) * ethPrice ).toFixed( 2 );
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text style={{ fontSize: '12px' }}>
              {reserveAmount} {selectedNetwork?.symbol || 'ETH'}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ≈ ${usdtAmount}
            </Text>
          </div>
        );
      }
    },
    {
      title: '转账金额',
      width: 180,
      key: 'transferAmount',
      render: ( _, record ) => (
        <TransferAmountCell
          record={record}
          selectedNetwork={selectedNetwork}
          provider={provider}
          globalForm={globalForm}
          ethPrice={ethPrice}
        />
      )
    },
    {
      title: '状态',
      width: 80,
      dataIndex: 'status',
      key: 'status',
      render: ( status, record ) => {
        switch ( status ) {
          case 'success':
            return <Text type="success">成功</Text>;
          case 'failed':
            return record.error ? (
              <Tooltip title={record.error}>
                <Text type="danger">失败</Text>
              </Tooltip>
            ) : (
              <Text type="danger">失败</Text>
            );
          default:
            return <Text>待执行</Text>;
        }
      }
    },
    {
      title: '预估Gas费',
      width: 180,
      key: 'estimatedGas',
      render: () => (
        <GasEstimateCell
          provider={provider}
          selectedNetwork={selectedNetwork}
          ethPrice={ethPrice}
        />
      )
    },
    {
      title: '实际Gas费',
      width: 180,
      dataIndex: 'actualGas',
      key: 'actualGas',
      render: ( actualGas, record ) => (
        <Text>
          {actualGas ? `${ formatEther( actualGas ) } ${ selectedNetwork?.symbol || 'ETH' }` : '-'}
        </Text>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: ( _, record ) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="primary"
            size="small"
            disabled={record.status === 'success' || executing}
            onClick={() => handleSingleTransfer( record )}
          >
            执行
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete( record.id )}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  // 添加加载转账对的函数
  useEffect( () => {
    const loadTransferPairs = async () => {
      try {
        const pairs = await dbManager.getAllItems( 'transferPairs' );
        setTransferPairs( pairs.map( pair => ( { ...pair, key: pair.id } ) ) );
      } catch ( error ) {
        console.error( '加载转账对失败:', error );
        message.error( '加载转账对失败' );
      }
    };

    loadTransferPairs();
  }, [] );

  // 修改删除功能
  const handleDelete = async ( id ) => {
    try {
      await dbManager.deleteTransferPair( id );
      setTransferPairs( pairs => pairs.filter( p => p.id !== id ) );
      message.success( '删除成功' );
    } catch ( error ) {
      console.error( '删除失败:', error );
      message.error( '删除失败' );
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '100%', margin: '0 auto' }}>
      <Card>
        <div style={{ marginBottom: '20px' }}>
          <Title level={2}>批量转账</Title>

          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
            <Form
              form={globalForm}
              layout="inline"
            >
              <Form.Item
                name="network"
                label="选择网络"
                rules={[ { required: true, message: '请选择网络' } ]}
              >
                <Select
                  style={{ width: 200 }}
                  onChange={handleNetworkChange}
                  placeholder="请选择网络"
                >
                  {networks.map( network => (
                    <Option key={network.chainId} value={network.chainId}>
                      {network.name}
                    </Option>
                  ) )}
                </Select>
              </Form.Item>

              <Form.Item
                name="reserveAmount"
                label="保留数量"
                rules={[ { required: true, message: '请输入保留数量' } ]}
              >
                <InputNumber
                  style={{ width: 200 }}
                  placeholder="每个钱包保留的数量"
                  min={0}
                  onChange={() => {
                    setTransferPairs( [ ...transferPairs ] );
                  }}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  icon={<SyncOutlined />}
                  onClick={refreshBalances}
                >
                  刷新余额
                </Button>
              </Form.Item>
            </Form>

            {/* 添加 Gas 费用显示组件 */}
            <GasFeeDisplay provider={provider} selectedNetwork={selectedNetwork} />
          </div>

          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible( true )}
            >
              添加转账
            </Button>
            <Button
              icon={<ImportOutlined />}
              onClick={() => setIsImportModalVisible( true )}
            >
              批量导入
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleBatchTransfer}
              disabled={!selectedNetwork || transferPairs.length === 0 || executing}
              loading={executing}
            >
              执行所有转账
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={transferPairs}
          pagination={false}
          loading={executing}
        />

        {/* 添加转账对模态框 */}
        <Modal
          title="添加转账"
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible( false );
            form.resetFields();
          }}
          footer={null}
        >
          <Form
            form={form}
            onFinish={handleAddPair}
            layout="vertical"
          >
            <Form.Item
              name="fromAddress"
              label="发送地址"
              rules={[ { required: true, message: '请选择发送地址' } ]}
            >
              <Select placeholder="请选择发送地址">
                {wallets.map( wallet => (
                  <Option key={wallet.address} value={wallet.address}>
                    {wallet.name} ({maskAddress( wallet.address )})
                  </Option>
                ) )}
              </Select>
            </Form.Item>

            <Form.Item
              name="toAddress"
              label="接收地址"
              rules={[
                { required: true, message: '请输入接收地址' },
                { pattern: /^0x[0-9a-fA-F]{40}$/, message: '请输入有效的地址' }
              ]}
            >
              <Input placeholder="请输入接收地址" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                添加
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* 批量导入模态框 */}
        <Modal
          title="批量导入"
          open={isImportModalVisible}
          onCancel={() => setIsImportModalVisible( false )}
          footer={null}
        >
          <Form
            onFinish={( values ) => {
              console.log( '表单提交，值:', values );
              handleImport( values );
            }}
            layout="vertical"
          >
            <Form.Item
              name="pairs"
              rules={[ { required: true, message: '请输入转账列表' } ]}
              extra="格式：发送地址 接收地址，每行一条"
            >
              <Input.TextArea
                rows={10}
                placeholder="例如：
0x123... 0x456...
0x789... 0xabc..."
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                导入
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default BatchTransfer;