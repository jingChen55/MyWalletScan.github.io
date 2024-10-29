import { createBaseColumns } from '@/columns/baseColumns';
import WalletActions from '@/components/WalletActions';
import WalletTable from '@/components/WalletTable';
import getScrollData from "@utils/getScroll/main.js";
import { processQueue } from '@utils/queueProcessor';
import { Form, Layout, notification, Spin, Tag } from 'antd';
import { useEffect, useState } from 'react';

const { Content } = Layout;

const Scroll = () => {
  // 初始化数据
  const [ data, setData ] = useState( () => {
    const stored = localStorage.getItem( 'Scroll_addresses' );
    return stored ? JSON.parse( stored ) : [];
  } );

  const [ loading, setLoading ] = useState( {
    table: false,
    batch: false,
    refresh: false,
  } );
  const [ selectedKeys, setSelectedKeys ] = useState( [] );
  const [ isBatchModalVisible, setIsBatchModalVisible ] = useState( false );
  const [ batchForm ] = Form.useForm();
  const [ hideColumn, setHideColumn ] = useState( true );

  // 保存数据到 localStorage
  useEffect( () => {
    if ( data ) {
      localStorage.setItem( 'Scroll_addresses', JSON.stringify( data ) );
    }
  }, [ data ] );

  const showSuccess = ( message ) => {
    notification.success( {
      message: "成功",
      description: message,
      duration: 1,
    } );
  };

  const showError = ( message ) => {
    notification.error( {
      message: "错误",
      description: message,
      duration: 1,
    } );
  };

  const handleBatchAdd = async ( processedAddresses ) => {
    try {
      setLoading( prev => ( { ...prev, batch: true } ) );
      let currentData = [ ...( data || [] ) ]; // 确保 data 不为 undefined

      // 先添加所有地址
      for ( const { address, name } of processedAddresses ) {
        const existingIndex = currentData.findIndex( item => item?.address === address );
        if ( existingIndex === -1 ) {
          currentData.push( {
            key: address,
            address: address,
            name: name,
            result: "pending",
            loading: true
          } );
        }
      }

      // 更新状态和本地存储
      setData( currentData );
      localStorage.setItem( 'Scroll_addresses', JSON.stringify( currentData ) );

      // 逐个获取数据
      for ( const { address, name } of processedAddresses ) {
        try {
          const response = await getScrollData( address );

          setData( prevData => {
            const newData = [ ...( prevData || [] ) ];
            const index = newData.findIndex( item => item?.address === address );
            if ( index !== -1 ) {
              newData[ index ] = {
                ...newData[ index ],
                ...response,
                name: name,
                result: "success",
                loading: false
              };
            }
            localStorage.setItem( 'Scroll_addresses', JSON.stringify( newData ) );
            return newData;
          } );
        } catch ( error ) {
          console.error( `Error fetching data for address ${ address }:`, error );

          setData( prevData => {
            const newData = [ ...( prevData || [] ) ];
            const index = newData.findIndex( item => item?.address === address );
            if ( index !== -1 ) {
              newData[ index ] = {
                ...newData[ index ],
                result: "error",
                reason: error.message,
                loading: false
              };
            }
            localStorage.setItem( 'Scroll_addresses', JSON.stringify( newData ) );
            return newData;
          } );
        }
      }

      showSuccess( '批量添加完成' );
    } catch ( error ) {
      showError( error.message );
    } finally {
      setLoading( prev => ( { ...prev, batch: false } ) );
      setSelectedKeys( [] );
    }
  };

  const handleRefresh = async ( address ) => {
    try {
      setLoading( prev => ( {
        ...prev,
        refresh: true,
        table: true
      } ) );

      // 单个地址刷新
      if ( typeof address === 'string' ) {
        setData( prev => {
          const updatedData = [ ...prev ];
          const index = updatedData.findIndex( item => item.address === address );
          if ( index !== -1 ) {
            updatedData[ index ] = {
              ...updatedData[ index ],
              loading: true,
              result: "pending",
              balance: null,
              activity: null,
              sessions: null,
              fee: null,
              lastTx: null,
              contractActivity: null,
            };
          }
          return updatedData;
        } );

        const response = await getScrollData( address );
        setData( prev => {
          const updatedData = [ ...prev ];
          const index = updatedData.findIndex( item => item.address === address );
          if ( index !== -1 ) {
            updatedData[ index ] = {
              ...updatedData[ index ],
              ...response,
              loading: false,
              result: "success"
            };
          }
          return updatedData;
        } );
        showSuccess( '刷新成功' );
      }
      // 批量刷新
      else {
        if ( !selectedKeys?.length ) {
          showError( '请选择要刷新的地址' );
          return;
        }

        // 设置选中地址的加载状态
        setData( prev => {
          const updatedData = [ ...prev ];
          selectedKeys.forEach( key => {
            const index = updatedData.findIndex( item => item.key === key );
            if ( index !== -1 ) {
              updatedData[ index ] = {
                ...updatedData[ index ],
                loading: true,
                result: "pending",
                balance: null,
                activity: null,
                sessions: null,
                fee: null,
                lastTx: null,
                contractActivity: null,
              };
            }
          } );
          return updatedData;
        } );

        const addressesToRefresh = data
          .filter( item => selectedKeys.includes( item.key ) )
          .map( item => item.address );

        if ( !addressesToRefresh.length ) {
          showError( '没有找到要刷新的地址' );
          return;
        }

        const tasks = addressesToRefresh.map( addr => async () => {
          try {
            const response = await getScrollData( addr );
            setData( prev => {
              const updatedData = [ ...prev ];
              const index = updatedData.findIndex( i => i.address === addr );
              if ( index !== -1 ) {
                updatedData[ index ] = {
                  ...updatedData[ index ],
                  ...response,
                  loading: false,
                  result: "success"
                };
              }
              return updatedData;
            } );
            return { address: addr, success: true };
          } catch ( error ) {
            setData( prev => {
              const updatedData = [ ...prev ];
              const index = updatedData.findIndex( i => i.address === addr );
              if ( index !== -1 ) {
                updatedData[ index ] = {
                  ...updatedData[ index ],
                  loading: false,
                  result: "error",
                  reason: error.message
                };
              }
              return updatedData;
            } );
            return { address: addr, success: false, error };
          }
        } );

        const results = await processQueue( tasks, 2 );
        const successCount = results.filter( r => r?.success ).length;
        showSuccess( `批量刷新完成，成功：${ successCount }/${ results.length }` );
      }
    } catch ( error ) {
      console.error( '刷新错误:', error );
      showError( error.message );
    } finally {
      setLoading( prev => ( {
        ...prev,
        refresh: false,
        table: false
      } ) );
    }
  };

  const handleDelete = async ( address ) => {
    setData( prev => prev.filter( item => item.address !== address ) );
  };

  const handleDeleteSelected = async () => {
    if ( !selectedKeys.length ) {
      showError( "请先选择要删除的地址" );
      return;
    }
    setData( prev => prev.filter( item => !selectedKeys.includes( item.key ) ) );
    setSelectedKeys( [] );
    showSuccess( "删除选中地址成功" );
  };

  const baseColumns = createBaseColumns( {
    type: 'scroll',
    hideColumn,
    onRefresh: handleRefresh,
    onDelete: handleDelete,
    onNameChange: ( record ) => {
      setData( [ ...data ] );
      localStorage.setItem( 'Scroll_addresses', JSON.stringify( data ) );
    }
  } );

  const scrollSpecificColumns = [
    {
      title: "积分",
      dataIndex: "sessions",
      key: "Scroll_eth_sessions",
      align: "center",
      width: 100,
      render: ( text, record ) => (
        <Spin spinning={record.loading || false} size="small">
          {text > 200 ? <Tag color="success">{text}</Tag> : text || 0}
        </Spin>
      ),
      sorter: {
        compare: ( a, b ) => ( a.sessions || 0 ) - ( b.sessions || 0 ),
        multiple: 1
      },
      filters: [
        { text: '> 200', value: '200' },
        { text: '> 100', value: '100' },
        { text: '> 50', value: '50' },
        { text: '> 20', value: '20' },
      ],
      onFilter: ( value, record ) => {
        const sessions = record.sessions || 0;
        return sessions > Number( value );
      },
      filterMultiple: true,
    },
  ];

  const allColumns = [
    ...baseColumns.slice( 0, 3 ),
    ...scrollSpecificColumns,
    ...baseColumns.slice( 3 ),
  ];

  return (
    <div>
      <Content>
        <div style={{ marginBottom: "50px" }}>
          <WalletTable
            data={data}
            loading={loading.table}
            selectedKeys={selectedKeys}
            onRefresh={handleRefresh}
            onDelete={handleDelete}
            columns={allColumns}
            scroll={{ x: 1500, y: '80vh' }}
            onSelectChange={setSelectedKeys}
          />
        </div>

        <WalletActions
          type="scroll"
          data={data}
          loading={loading}
          selectedKeys={selectedKeys}
          isBatchModalVisible={isBatchModalVisible}
          setIsBatchModalVisible={setIsBatchModalVisible}
          onBatchAdd={handleBatchAdd}
          onRefresh={handleRefresh}
          onDelete={handleDeleteSelected}
          form={batchForm}
        />
      </Content>
    </div>
  );
};

export default Scroll;
