import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  ImportOutlined,
  KeyOutlined,
  PlusOutlined,
  SyncOutlined
} from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Table,
  Tooltip,
  Typography,
  message
} from 'antd';
import { JsonRpcProvider, formatEther } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorkingRPC } from '../../config';
import { decryptFromStorage, decryptPrivateKey, encryptForStorage } from '../../utils/cryptoUtils';
import { exportToExcel } from '../../utils/exportUtils';
import { dbManager } from '../../utils/indexedDB';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const WalletList = () => {
  const [ isModalVisible, setIsModalVisible ] = useState( false );
  const [ isBatchModalVisible, setIsBatchModalVisible ] = useState( false );
  const [ form ] = Form.useForm();
  const [ batchForm ] = Form.useForm();
  const [ showPrivateKey, setShowPrivateKey ] = useState( {} );
  const [ selectedRowKeys, setSelectedRowKeys ] = useState( [] );
  const [ viewPrivateKeyModal, setViewPrivateKeyModal ] = useState( false );
  const [ currentAddress, setCurrentAddress ] = useState( null );
  const [ viewPrivateKeyForm ] = Form.useForm();
  const [ wallets, setWallets ] = useState( [] );
  const [ provider, setProvider ] = useState( null );
  const [ isLoading, setIsLoading ] = useState( true );
  const navigate = useNavigate();

  // 复制地址
  const copyAddress = ( address ) => {
    navigator.clipboard.writeText( address );
    message.success( '地址已复制' );
  };

  // 复制私钥
  const copyPrivateKey = ( privateKey ) => {
    navigator.clipboard.writeText( privateKey );
    message.success( '私钥已复制' );
  };

  // 查看私钥
  const handleViewPrivateKey = async ( values ) => {
    try {
      const wallet = wallets.find( w => w.address === currentAddress );
      if ( !wallet || !wallet.encryptedPrivateKey ) {
        throw new Error( '找不到钱包或私钥' );
      }

      const privateKey = decryptFromStorage( wallet.encryptedPrivateKey, values.password );
      if ( !privateKey ) {
        throw new Error( '解密失败' );
      }

      setShowPrivateKey( prev => ( {
        ...prev,
        [ currentAddress ]: privateKey
      } ) );

      setViewPrivateKeyModal( false );
      viewPrivateKeyForm.resetFields();
    } catch ( error ) {
      message.error( '密码错误或解密失败' );
    }
  };

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: ( newSelectedRowKeys ) => {
      setSelectedRowKeys( newSelectedRowKeys );
    },
  };

  const columns = [
    {
      title: '钱包名称',
      dataIndex: 'name',
      key: 'name',
      render: ( name, record ) => (
        <Button
          type="link"
          onClick={() => navigate( `/wallet/${ record.address }` )}
        >
          {name}
        </Button>
      ),
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      render: ( address ) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            type="link"
            onClick={() => navigate( `/wallet/${ address }` )}
          >
            <Text ellipsis style={{ width: '180px' }}>{address}</Text>
          </Button>
          <Tooltip title="复制地址">
            <Button
              icon={<CopyOutlined />}
              type="text"
              onClick={( e ) => {
                e.stopPropagation();
                copyAddress( address );
              }}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: '私钥',
      dataIndex: 'encryptedPrivateKey',
      key: 'privateKey',
      render: ( encryptedPrivateKey, record ) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {encryptedPrivateKey ? (
            <>
              <Text ellipsis style={{ width: '180px' }}>
                {showPrivateKey[ record.address ] ?
                  showPrivateKey[ record.address ] :
                  '************************'}
              </Text>
              <Tooltip title="查看私钥">
                <Button
                  icon={<EyeOutlined />}
                  type="text"
                  onClick={() => {
                    setCurrentAddress( record.address );
                    setViewPrivateKeyModal( true );
                  }}
                />
              </Tooltip>
              {showPrivateKey[ record.address ] && (
                <Tooltip title="复制私钥">
                  <Button
                    icon={<KeyOutlined />}
                    type="text"
                    onClick={() => copyPrivateKey( showPrivateKey[ record.address ] )}
                  />
                </Tooltip>
              )}
            </>
          ) : (
            <Text type="secondary">未设置私钥</Text>
          )}
        </div>
      ),
    },
    {
      title: 'ETH余额',
      dataIndex: 'balance',
      key: 'balance',
      render: ( balance, record ) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{Number( balance ).toFixed( 4 )} ETH</span>
          <Tooltip title="更新余额">
            <Button
              icon={<SyncOutlined />}
              type="text"
              onClick={() => handleUpdateBalance( record.address )}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: ( _, record ) => (
        <Popconfirm
          title="确定要删除这个钱包吗？"
          onConfirm={() => onDeleteWallet( record.address )}
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
      ),
    },
  ];

  // 初始化
  useEffect( () => {
    const init = async () => {
      try {
        // 先加载钱包列表
        const savedWallets = await dbManager.getAllWallets();
        const sortedWallets = savedWallets.sort( ( a, b ) => {
          if ( a.orderIndex !== undefined && b.orderIndex !== undefined ) {
            return a.orderIndex - b.orderIndex;
          }
          if ( a.addedTime && b.addedTime ) {
            return new Date( a.addedTime ) - new Date( b.addedTime );
          }
          return 0;
        } );
        setWallets( sortedWallets || [] );

        // 如果有钱包，使用第一个钱包的地址测试 RPC
        if ( sortedWallets.length > 0 ) {
          const rpcUrl = await getWorkingRPC( sortedWallets[ 0 ].address );
          const provider = new JsonRpcProvider( rpcUrl );
          setProvider( provider );
        }
      } catch ( error ) {
        console.error( '初始化失败:', error );
        message.error( '初始化失败: ' + error.message );
      } finally {
        setIsLoading( false );
      }
    };

    init();
  }, [] );


  // 批量导入钱包
  const handleBatchImport = async ( values ) => {
    try {
      const lines = values.wallets.trim().split( '\n' );
      const newWallets = [];
      const errors = [];

      // 获取当前最大序号
      const maxOrderIndex = Math.max( ...wallets.map( w => w.orderIndex || 0 ), -1 );

      for ( let [ index, line ] of lines.entries() ) {
        try {
          const [ number, address, encryptedPrivateKey ] = line.trim().split( /\s+/ );

          let privateKey = null;
          if ( encryptedPrivateKey ) {
            try {
              privateKey = decryptPrivateKey( encryptedPrivateKey, values.password );
            } catch ( error ) {
              console.error( '解密私钥失败:', error );
              errors.push( `第 ${ number } 个钱包私钥解密失败: ${ error.message }` );
              continue;
            }
          }

          newWallets.push( {
            key: address,
            address: address,
            name: `钱包 ${ number }`,
            encryptedPrivateKey: privateKey ? encryptForStorage( privateKey, values.password ) : null,
            balance: 0,
            orderIndex: maxOrderIndex + index + 1,  // 添加序号
            addedTime: new Date().toISOString()  // 添加时间戳
          } );
        } catch ( error ) {
          console.error( '导入单个钱包失败:', error );
          errors.push( `第 ${ index + 1 } 个钱包导入失败: ${ error.message }` );
        }
      }

      if ( newWallets.length > 0 ) {
        await dbManager.addWallets( newWallets );
        setWallets( prev => [ ...prev, ...newWallets ].sort( ( a, b ) => a.orderIndex - b.orderIndex ) );
        message.success( `成功导入 ${ newWallets.length } 个钱包` );
      }

      if ( errors.length > 0 ) {
        Modal.error( {
          title: '部分导入失败',
          content: errors.join( '\n' )
        } );
      }
    } catch ( error ) {
      console.error( '批量导入失败:', error );
      message.error( '批量导入失败: ' + error.message );
    }
  };

  // 删除钱包
  const handleDeleteWallet = async ( address ) => {
    try {
      await dbManager.deleteWallet( address );
      // 删除后重新计算序号
      const remainingWallets = wallets
        .filter( w => w.address !== address )
        .map( ( wallet, index ) => ( {
          ...wallet,
          orderIndex: index
        } ) );
      await dbManager.addWallets( remainingWallets );
      setWallets( remainingWallets );
      message.success( '删除成功' );
    } catch ( error ) {
      message.error( '删除失败' );
    }
  };

  // 批量删除钱包
  const handleBatchDelete = async ( addresses ) => {
    try {
      for ( const address of addresses ) {
        await dbManager.deleteWallet( address );
      }
      // 删除后重新计算序号
      const remainingWallets = wallets
        .filter( w => !addresses.includes( w.address ) )
        .map( ( wallet, index ) => ( {
          ...wallet,
          orderIndex: index
        } ) );
      await dbManager.addWallets( remainingWallets );
      setWallets( remainingWallets );
      setSelectedRowKeys( [] );
      message.success( '批量删除成功' );
    } catch ( error ) {
      message.error( '批量删除失败' );
    }
  };

  // 修改更新余额函数
  const handleUpdateBalance = async ( address ) => {
    try {
      // 获取所有网络配置
      const networks = await dbManager.getAllItems( 'networks' );
      let totalBalance = 0;

      // 显示加载状态
      message.loading( { content: '正在获取余额...', key: 'updateBalance' } );

      // 获取所有网络的余额
      for ( const network of networks ) {
        try {
          // 为每个网络创建新的 provider
          const provider = new JsonRpcProvider( network.rpc );
          // 添加延迟避免请求过快
          await new Promise( resolve => setTimeout( resolve, 500 ) );
          const balance = await provider.getBalance( address );
          console.log( `${ network.name } 余额:`, formatEther( balance ) );
          totalBalance += parseFloat( formatEther( balance ) );
        } catch ( error ) {
          console.error( `获取 ${ network.name } 余额失败:`, error );
        }
      }

      // 更新钱包余额
      const updatedWallets = wallets.map( w =>
        w.address === address ? { ...w, balance: totalBalance.toString() } : w
      );
      setWallets( updatedWallets );
      await dbManager.addWallets( updatedWallets );
      message.success( { content: '更新余额成功', key: 'updateBalance' } );
    } catch ( error ) {
      console.error( '更新余额失败:', error );
      message.error( { content: '更新余额失败', key: 'updateBalance' } );
    }
  };

  // 修改批量更新余额函数
  const handleBatchUpdateBalance = async () => {
    try {
      const networks = await dbManager.getAllItems( 'networks' );
      message.loading( { content: '正在批量更新余额...', key: 'batchUpdate' } );

      const updatedWallets = await Promise.all(
        wallets.map( async wallet => {
          let totalBalance = 0;
          for ( const network of networks ) {
            try {
              // 为每个网络创建新的 provider
              const provider = new JsonRpcProvider( network.rpc );
              // 添加延迟避免请求过快
              await new Promise( resolve => setTimeout( resolve, 500 ) );
              const balance = await provider.getBalance( wallet.address );
              console.log( `${ wallet.address } 在 ${ network.name } 的余额:`, formatEther( balance ) );
              totalBalance += parseFloat( formatEther( balance ) );
            } catch ( error ) {
              console.error( `获取 ${ network.name } 余额失败:`, error );
            }
          }
          return { ...wallet, balance: totalBalance.toString() };
        } )
      );

      setWallets( updatedWallets );
      await dbManager.addWallets( updatedWallets );
      message.success( { content: '批量更新余额成功', key: 'batchUpdate' } );
    } catch ( error ) {
      console.error( '批量更新余额失败:', error );
      message.error( { content: '批量更新余额失败', key: 'batchUpdate' } );
    }
  };

  // 导出配置
  const handleExport = async () => {
    try {
      const networks = await dbManager.getAllItems( 'networks' );
      exportToExcel( { wallets, networks }, '钱包和网络配置.xlsx' );
      message.success( '导出成功' );
    } catch ( error ) {
      message.error( '导出失败' );
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Title level={2}>钱包管理</Title>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            导出配置
          </Button>
          <Button
            icon={<SyncOutlined />}
            onClick={handleBatchUpdateBalance}
          >
            更新所有余额
          </Button>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`确定要删除选中的 ${ selectedRowKeys.length } 个钱包吗？`}
              onConfirm={() => handleBatchDelete( selectedRowKeys )}
              okText="确定"
              cancelText="取消"
            >
              <Button
                danger
                icon={<DeleteOutlined />}
              >
                批量删除 ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          )}
          <Button
            icon={<ImportOutlined />}
            onClick={() => setIsBatchModalVisible( true )}
          >
            批量导入
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible( true )}
          >
            添加钱包
          </Button>
        </div>
      </div>

      <Table
        loading={isLoading}
        rowSelection={rowSelection}
        columns={columns}
        dataSource={wallets}
        pagination={false}
      />


      {/* 批量导入模态框 */}
      <Modal
        title="批量导入钱包"
        open={isBatchModalVisible}
        onCancel={() => {
          setIsBatchModalVisible( false );
          batchForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={batchForm}
          onFinish={( values ) => {
            handleBatchImport( values );
            setIsBatchModalVisible( false );
            batchForm.resetFields();
          }}
          layout="vertical"
        >
          <Paragraph type="secondary">
            请按照以下格式输入钱包信息，每行一个钱包：<br />
            编号 地址 [加密私钥]（私钥可选）<br />
            例如：<br />
            1 0x123...<br />
            2 0x456... U2FsdGVkX19...<br />
            3 0x789...
          </Paragraph>

          <Form.Item
            name="password"
            label="解密密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 4, message: '密码长度至少4位' }
            ]}
            extra="请输入: 1234"
          >
            <Input.Password placeholder="请输入解密密码" />
          </Form.Item>

          <Form.Item
            name="wallets"
            label="钱包信息"
            rules={[ { required: true, message: '请输入钱包信息' } ]}
          >
            <TextArea
              rows={10}
              placeholder="请输入钱包信息，每行一个钱包"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              导入钱包
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看私钥模态框 */}
      <Modal
        title="查看私钥"
        open={viewPrivateKeyModal}
        onCancel={() => {
          setViewPrivateKeyModal( false );
          viewPrivateKeyForm.resetFields();
          setShowPrivateKey( prev => ( {
            ...prev,
            [ currentAddress ]: null
          } ) );
        }}
        footer={null}
      >
        <Form
          form={viewPrivateKeyForm}
          onFinish={handleViewPrivateKey}
          layout="vertical"
        >
          <Form.Item
            name="password"
            label="请输入密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 4, message: '密码长度至少4位' }
            ]}
            extra="请输入: 1234"
          >
            <Input.Password placeholder="请输入密码查看私钥" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default WalletList; 