import GasFeeDisplay from '@/components/GasFeeDisplay';
import TransactionDetail from '@/components/TransactionDetail';
import { dbManager } from '@/utils/indexedDB';
import { convertEthToUsdt, convertUsdtToEth, formatAmount, useEthPrice } from '@/utils/priceUtils';
import { executeTransfer } from '@/utils/transferUtils';
import { DeleteOutlined, ImportOutlined, MinusCircleOutlined, PlusCircleOutlined, SendOutlined, SyncOutlined } from '@ant-design/icons';
import { decryptFromStorage } from '@utils/cryptoUtils';
import { Button, Card, Collapse, Empty, Form, Input, InputNumber, message, Modal, Select, Spin, Table, Tag, Tooltip, Typography } from 'antd';
import { ethers, formatEther } from 'ethers';
import React, { useEffect, useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;

// 添加地址脱敏函数
const maskAddress = ( address ) => {
  if ( !address ) return '';
  return `${ address.slice( 0, 6 ) }...${ address.slice( -4 ) }`;
};


// 表格保留金额显示组件
const ReserveAmountDisplay = ( { amount, type, ethPrice, networkSymbol } ) => {
  const ethAmount = type === 'USDT'
    ? convertUsdtToEth( parseFloat( amount ), ethPrice )
    : amount;

  const usdAmount = type === 'USDT'
    ? amount
    : convertEthToUsdt( amount, ethPrice );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Text style={{ fontSize: '12px' }}>
        {formatAmount( ethAmount, 'ETH' )} {networkSymbol || 'ETH'}
      </Text>
      <Text type="secondary" style={{ fontSize: '12px' }}>
        ≈ ${formatAmount( usdAmount, 'USDT' )}
      </Text>
    </div>
  );
};

// 创建一个独立的展开行组件
const ExpandedRow = ( { record, selectedNetwork, provider } ) => {
  const [ loading, setLoading ] = useState( false );
  const [ transactions, setTransactions ] = useState( [] );

  useEffect( () => {
    const loadTransactions = async () => {
      if ( !selectedNetwork || !provider || !record.fromAddress ) return;

      setLoading( true );
      try {
        const address = record.fromAddress.toLowerCase();

        console.log( '获取到交易记录:', txs );
        setTransactions( txs );
      } catch ( error ) {
        console.error( '加载交易记录失败:', error );
        message.error( '加载交易记录失败' );
      } finally {
        setLoading( false );
      }
    };

    loadTransactions();
  }, [ record.fromAddress, selectedNetwork, provider ] );

  return (
    <div style={{ margin: '20px 0' }}>
      <Title level={5}>
        交易记录 - {record.fromAddress}
      </Title>
      <Spin spinning={loading}>
        {transactions.length > 0 ? (
          <Collapse>
            {transactions.map( tx => (
              <Collapse.Panel
                header={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <Tag color={tx.type === '转出' ? 'red' : 'green'}>
                        {tx.type}
                      </Tag>
                      {tx.hash}
                    </span>
                    <span>{new Date( tx.timestamp ).toLocaleString()}</span>
                  </div>
                }
                key={tx.hash}
              >
                <TransactionDetail transaction={tx} />
              </Collapse.Panel>
            ) )}
          </Collapse>
        ) : (
          <Empty description={`暂无交易记录 (${ record.fromAddress })`} />
        )}
      </Spin>
    </div>
  );
};
/**
 * 批量转账页面
 * @returns 
 */
const BatchTransfer = () => {
  const [ form ] = Form.useForm();
  const [ networks, setNetworks ] = useState( [] );
  const [ wallets, setWallets ] = useState( [] );
  const [ selectedNetwork, setSelectedNetwork ] = useState( null );
  const [ transferPairs, setTransferPairs ] = useState( [] );
  const [ isImportModalVisible, setIsImportModalVisible ] = useState( false );
  const [ executing, setExecuting ] = useState( false );
  const [ provider, setProvider ] = useState( null );
  const [ globalForm ] = Form.useForm();
  const ethPrice = useEthPrice();
  const [ reserveType, setReserveType ] = useState( 'ETH' );
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

  /**
   * 更新钱包余额
   * @returns 
   */
  const refreshBalance = async ( address ) => {
    try {
      message.loading( { content: '正在刷新余额...', key: 'refreshBalance' } );


      // 去重
      const uniqueAddresses = [ ...new Set( address ) ];

      console.log( '需要刷新余额的地址:', uniqueAddresses );

      // 获取所有钱包的余额
      const updatedBalances = await Promise.all(
        uniqueAddresses.map( async address => {
          try {
            const balance = await provider.getBalance( address );
            console.log( `钱包 ${ address } 余额:`, formatEther( balance ) );
            return {
              address,
              balance: formatEther( balance )
            };
          } catch ( error ) {
            message.error( { content: '刷新余额失败', key: 'refreshBalance' } );
            return {
              address,
              balance: null
            };
          }
        } )
      );

      // 更新钱包列表
      const balanceMap = updatedBalances.reduce( ( acc, { address, balance } ) => {
        if ( balance ) {
          acc[ address ] = balance
        } else {
          throw new Error( "刷新余额失败" );
        }
        return acc;
      }, {} );
      console.log( '更新后的钱包列表: 地址 余额', balanceMap );
      // 只更新当前列表中的钱包余额
      const updatedWalletsList = wallets.map( wallet => ( {
        ...wallet,
        balance: balanceMap[ wallet.address ] || wallet.balance
      } ) );

      setWallets( updatedWalletsList ); //数据库更新
      message.success( { content: '余额刷新成功', key: 'refreshBalance' } );
    } catch ( error ) {
      console.error( '刷新余额失败:', error );
      message.error( { content: '刷新余额失败', key: 'refreshBalance' } );
    }
  }

  // 修改额刷新功能
  const refreshBalances = async () => {
    console.log( '刷新余额开始' );
    if ( !selectedNetwork || !provider ) {
      message.error( '请先选择网络' );
      return;
    }
    // 获取当前列表中所有钱的地址
    const addresses = transferPairs.map( pair => pair.fromAddress );
    refreshBalance( addresses )
  };

  // 修改网络选择处理函数
  const handleNetworkChange = async ( value ) => {
    console.log( '选择网络:', value );
    const network = networks.find( n => n.chainId === value );
    setSelectedNetwork( network );
    if ( network ) {
      try {
        // 为选定的网络创建新的 provider
        const newProvider = new ethers.JsonRpcProvider( network.rpc );

        // const newProvider = new JsonRpcProvider( network.rpc );
        setProvider( newProvider );
        message.success( '网络切换成功' );
      } catch ( error ) {
        console.error( '网络切换失败:', error );
        message.error( '网络切换失败' );
      }
    }
  };

  // 修改执行单个转账函数
  const handleSingleTransfer = async ( pair ) => {
    if ( !selectedNetwork || !provider ) {
      message.error( '请先选择网络' );
      return;
    }

    // 使用 Modal.confirm 而不是 Modal.confirm
    Modal.confirm( {
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
        const passwordInput = document.getElementById( 'transfer-password-input' );
        const password = passwordInput?.value;

        if ( !password ) {
          message.error( '请输入密码' );
          return Promise.reject( '请输入密码' );
        }

        try {
          // 获取钱包信息
          const wallet = wallets.find( w => w.address === pair.fromAddress );
          if ( !wallet || !wallet.encryptedPrivateKey ) {
            throw new Error( '找不到钱包或私钥为空' );
          }

          // 解密私钥
          const privateKey = decryptFromStorage( wallet.encryptedPrivateKey, password );
          if ( !privateKey ) {
            throw new Error( '密码错误，解密失败' );
          }

          // 更新状态为执行中
          const updatedPairs = transferPairs.map( p =>
            p.key === pair.key ? { ...p, status: 'pending', error: null } : p
          );
          setTransferPairs( updatedPairs );

          // 执行转账
          const result = await executeTransfer( {
            fromAddress: pair.fromAddress,
            toAddress: pair.toAddress,
            provider,
            privateKey,
            reserveAmount: globalForm.getFieldValue( 'reserveAmount' ) || '0'
          } );

          // 更新状态为成功
          setTransferPairs( prev => prev.map( p =>
            p.key === pair.key ? {
              ...p,
              status: 'success',
              actualGas: result.gasCost,
              error: null
            } : p
          ) );

          message.success( '转账执行成功' );
          await refreshBalance( [ pair.fromAddress ] );
        } catch ( error ) {
          console.error( '转账执行失败:', error );
          // 更新状态为失败
          setTransferPairs( prev => prev.map( p =>
            p.key === pair.key ? {
              ...p,
              status: 'failed',
              error: error.message
            } : p
          ) );
          message.error( '转账执行失败: ' + error.message );
          return Promise.reject( error );
        }
      },
      onCancel() {
        message.info( '已取消转账' );
      },
    } );
  };

  // 修改批量转账函数
  const handleBatchTransfer = async () => {
    if ( !selectedNetwork || !provider ) {
      message.error( '请先选择网络' );
      return;
    }

    Modal.confirm( {
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
        const passwordInput = document.getElementById( 'batch-transfer-password-input' );
        const password = passwordInput?.value;

        if ( !password ) {
          message.error( '请输入密码' );
          return Promise.reject( '请输入密码' );
        }

        setExecuting( true );
        try {
          const updatedPairs = [ ...transferPairs ];
          // 遍历所有待执行的转账对
          for ( let i = 0; i < updatedPairs.length; i++ ) {
            const pair = updatedPairs[ i ];
            if ( pair.status !== 'pending' ) continue;

            try {
              // 获取钱包信息
              const wallet = wallets.find( w => w.address === pair.fromAddress );
              if ( !wallet || !wallet.encryptedPrivateKey ) {
                throw new Error( '找不到钱包或私钥为空' );
              }

              // 解密私钥
              const privateKey = decryptFromStorage( wallet.encryptedPrivateKey, password );
              if ( !privateKey ) {
                throw new Error( '密码错误，解密失败' );
              }

              // 执行转账
              const result = await executeTransfer( {
                fromAddress: pair.fromAddress,
                toAddress: pair.toAddress,
                provider,
                privateKey,
                reserveAmount: globalForm.getFieldValue( 'reserveAmount' ) || '0'
              } );

              // 更新状态为成功
              updatedPairs[ i ] = {
                ...pair,
                status: 'success',
                actualGas: result.gasCost,
                error: null
              };
            } catch ( error ) {
              console.error( `转账失败 (${ pair.fromAddress } -> ${ pair.toAddress }):`, error );
              updatedPairs[ i ] = {
                ...pair,
                status: 'failed',
                error: error.message
              };
            }
            setTransferPairs( [ ...updatedPairs ] );
          }
          message.success( '批量转账执行完成' );
          await refreshBalances();
        } catch ( error ) {
          console.error( '批量转账执行失败:', error );
          message.error( '批量转账执行失败: ' + error.message );
        } finally {
          setExecuting( false );
        }
      },
      onCancel() {
        message.info( '已取消批量转账' );
      },
    } );
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
      await dbManager.addTransferPairs( pairs );
      console.log( '数据库保存成功' );

      // 重新加载转账对
      await loadTransferPairs();
      setIsImportModalVisible( false );
      message.success( `成功导入 ${ pairs.length } 个转账对` );
    } catch ( error ) {
      console.error( '批量导入失败:', error );
      message.error( '批量导入失: ' + error.message );
    }
  };

  // 加载转账对的函数
  const loadTransferPairs = async () => {
    try {
      const pairs = await dbManager.getAllItems( 'transferPairs' );
      setTransferPairs( pairs.map( pair => ( { ...pair, key: pair.id } ) ) );
    } catch ( error ) {
      console.error( '加载转账对失败:', error );
      message.error( '加载转账对失败' );
    }
  };

  // 在组件挂时加载转账对
  useEffect( () => {
    loadTransferPairs();
  }, [] );

  // 修改删除功能
  const handleDelete = async ( id ) => {
    if ( !id ) {
      message.error( '无效的ID' );
      return;
    }

    try {
      await dbManager.deleteTransferPair( id );
      setTransferPairs( ( pairs ) => pairs.filter( ( p ) => p.id !== id ) );
      message.success( '删除成功' );
    } catch ( error ) {
      console.error( '删除失败:', error );
      message.error( '删除失败' );
    }
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
            <div>{wallet?.name || '知钱包'}</div>
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
        const usdtBalance = wallet ? formatAmount( convertEthToUsdt( wallet.balance, ethPrice ), 'USDT' ) : '0';
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
      editable: true,
      render: ( text, record ) => {
        const isEditing = record.key === editingKey;
        return isEditing ? (
          <Form.Item
            name="toAddress"
            style={{ margin: 0 }}
            rules={[ { required: true, message: '请输入接收地址' } ]}
          >
            <Input />
          </Form.Item>
        ) : (
          <Text copyable={{ text }}>
            {maskAddress( text )}
          </Text>
        );
      }
    },
    {
      title: '保留数量',
      width: 150,
      key: 'reserveAmount',
      editable: true,
      render: ( _, record ) => {
        const isEditing = record.key === editingKey;
        return isEditing ? (
          <Form.Item
            name="reserveAmount"
            style={{ margin: 0 }}
            rules={[ { required: true, message: '请输入保留数量' } ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="保留数量"
            />
          </Form.Item>
        ) : (
          <ReserveAmountDisplay
            amount={record.reserveAmount || globalForm.getFieldValue( 'reserveAmount' ) || '0'}
            type={reserveType}
            ethPrice={ethPrice}
            networkSymbol={selectedNetwork?.symbol}
          />
        );
      }
    },
    {
      title: '转账数量',
      width: 150,
      key: 'transferAmount',
      editable: true,
      render: ( _, record ) => {
        const isEditing = record.key === editingKey;
        return isEditing ? (
          <Form.Item
            name="transferAmount"
            style={{ margin: 0 }}
            rules={[ { required: true, message: '请输入转账数量' } ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="转账数量"
            />
          </Form.Item>
        ) : (
          <TransferAmountDisplay
            record={record}
            selectedNetwork={selectedNetwork}
            provider={provider}
            globalForm={globalForm}
            ethPrice={ethPrice}
          />
        );
      }
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
      title: '实际Gas费',
      width: 180,
      dataIndex: 'actualGas',
      key: 'actualGas',
      render: ( actualGas, record ) => {
        if ( !actualGas ) return '-';

        try {
          // 如果 actualGas 已经是字符串形式的数字，直接使用
          const ethAmount = actualGas;
          const usdAmount = ( parseFloat( ethAmount ) * ethPrice ).toFixed( 2 );

          return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Text style={{ fontSize: '12px' }}>
                {ethAmount} {selectedNetwork?.symbol || 'ETH'}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ≈ ${usdAmount}
              </Text>
            </div>
          );
        } catch ( error ) {
          console.error( 'Gas费用显示错误:', error );
          return '-';
        }
      }
    },
    {
      title: '操作',
      key: 'action',
      render: ( _, record ) => {
        const isEditing = record.key === editingKey;
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            {isEditing ? (
              <>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleSave( record.key )}
                >
                  保存
                </Button>
                <Button
                  size="small"
                  onClick={() => handleCancel()}
                >
                  取消
                </Button>
              </>
            ) : (
              <>
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
                  size="small"
                  onClick={() => handleEdit( record )}
                >
                  编辑
                </Button>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete( record.id )}
                >
                  删除
                </Button>
              </>
            )}
          </div>
        );
      },
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

  // 添加 TransferAmountDisplay 组件
  const TransferAmountDisplay = ( { record, selectedNetwork, provider, globalForm, ethPrice } ) => {
    const [ amount, setAmount ] = useState( '-' );
    const [ usdtAmount, setUsdtAmount ] = useState( '-' );

    useEffect( () => {
      const calculateAmount = async () => {
        if ( !selectedNetwork || !provider ) return;
        try {
          const balance = await provider.getBalance( record.fromAddress );
          const reserveAmount = record.reserveAmount || globalForm.getFieldValue( 'reserveAmount' );
          if ( !reserveAmount && reserveAmount !== 0 ) {
            setAmount( '请设置保留金额' );
            return;
          }

          const reserveEther = ethers.parseEther( reserveAmount.toString() );
          const feeData = await provider.getFeeData();
          const gasLimit = 21000n;
          const gasPrice = feeData.maxFeePerGas || feeData.gasPrice;
          const gasCost = gasPrice * gasLimit;
          const availableAmount = balance - reserveEther - gasCost;

          if ( availableAmount <= 0n ) {
            setAmount( '余额不足' );
            setUsdtAmount( '-' );
          } else {
            const ethAmount = ethers.formatEther( availableAmount );
            setAmount( ethAmount );
            setUsdtAmount( ( parseFloat( ethAmount ) * ethPrice ).toFixed( 2 ) );
          }
        } catch ( error ) {
          setAmount( '计算失败' );
          setUsdtAmount( '-' );
        }
      };

      calculateAmount();
    }, [ selectedNetwork, provider, record.fromAddress, globalForm, ethPrice, record.reserveAmount ] );

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

  // 添加编辑相关的状态和函数
  const [ editingKey, setEditingKey ] = useState( '' );


  const handleEdit = ( record ) => {
    form.setFieldsValue( {
      toAddress: record.toAddress,
      reserveAmount: record.reserveAmount,
      transferAmount: record.transferAmount,
    } );
    setEditingKey( record.key );
  };

  const handleCancel = () => {
    setEditingKey( '' );
  };

  const handleSave = async ( key ) => {
    try {
      const row = await form.validateFields();
      const newData = [ ...transferPairs ];
      const index = newData.findIndex( item => key === item.key );
      if ( index > -1 ) {
        const item = newData[ index ];
        newData.splice( index, 1, {
          ...item,
          ...row,
        } );
        setTransferPairs( newData );
        setEditingKey( '' );
      }
    } catch ( errInfo ) {
      console.log( 'Validate Failed:', errInfo );
    }
  };

  // 修改表格配置，添加可展开功能
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
                label="选择网"
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

              <Form.Item
                name="reserveType"
                label="保留类型"
                initialValue="ETH"
              >
                <Select
                  style={{ width: 100 }}
                  onChange={setReserveType}
                >
                  <Option value="ETH">ETH</Option>
                  <Option value="USDT">USDT</Option>
                </Select>
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

        <Form form={form} component={false}>
          <Table
            columns={columns}
            dataSource={transferPairs}
            pagination={false}
            loading={executing}
            expandable={{
              expandedRowRender: ( record ) => (
                <ExpandedRow record={record} selectedNetwork={selectedNetwork} provider={provider} />
              ),
              expandIcon: ( { expanded, onExpand, record } ) => (
                expanded ? (
                  <MinusCircleOutlined onClick={e => {
                    e.stopPropagation(); // 阻止事件冒泡
                    onExpand( record, e );
                  }} />
                ) : (
                  <PlusCircleOutlined onClick={e => {
                    e.stopPropagation(); // 阻止事件冒泡
                    onExpand( record, e );
                  }} />
                )
              )
            }}
          />
        </Form>

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