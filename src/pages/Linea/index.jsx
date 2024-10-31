import { exportToExcel } from "@utils";
import { calculateStats } from '@utils/lineaHelpers';
import { Form, Layout, notification } from "antd";
import { useEffect, useState } from "react";
import { useLineaState } from "../../hooks/useLineaState";
import { useNotification } from "../../hooks/useNotification";

import WalletActions from '@/components/WalletActions';
import WalletTable from '@/components/WalletTable';
import { useWalletOperations } from '@/hooks/useWalletOperations';
import { getLineaData, getLineaTotalPoints } from "@utils/getLinea/main.js";
import StatsCards from "./components/StatsCards";
import useLineaColumns from "./hooks/useLineaColumns";
import { useLineaOperations } from "./hooks/useLineaOperations";
import "./index.css";

const { Content } = Layout;

const Linea = () => {
  const [ state, dispatch ] = useLineaState();
  const [ initialized, setInitialized ] = useState( false );
  const [ lineaTotalPoints, setLineaTotalPoints ] = useState( {} );
  const [ batchForm ] = Form.useForm();
  const { showSuccess, showError } = useNotification();

  // 修改这里的 useEffect
  useEffect( () => {
    const fetchTotalPoints = async () => {
      try {
        const res = await getLineaTotalPoints();
        if ( res && res.data && res.data.length > 0 ) {
          const data = res.data[ res.data.length - 1 ];
          // 确保数据格式正确
          const formattedData = {
            average_total_xp: data?.average_total_xp || 0,
            user: data?.user || 0,
            total_xp: data?.total_xp || 0,
          };
          setLineaTotalPoints( formattedData );
        }
      } catch ( error ) {
        console.error( '获取总积分失败:', error );
        // 设置默认值
        setLineaTotalPoints( {
          average_total_xp: 0,
          user: 0,
          total_xp: 0,
        } );
      }
    };

    fetchTotalPoints();
  }, [] ); // 空依赖数组，只在组件挂载时执行一次

  // 使用 useWalletOperations hook
  const {
    data: walletData,
    loading,
    selectedKeys,
    handleRefresh: baseHandleRefresh,
    handleDelete: baseHandleDelete,
    handleDeleteSelected: baseHandleDeleteSelected,
    setData: setWalletData,
    setBatchLoading,
    setSelectedKeys
  } = useWalletOperations( {
    storageKey: 'Linea_addresses',
    fetchData: getLineaData,
  } );

  // 使用 useLineaOperations hook，传入正确的参数
  const { handleBatchAdd, handleRefresh: lineaRefresh } = useLineaOperations( {
    data: walletData,
    setData: setWalletData,
    loading: loading,
    setLoading: setBatchLoading,
    selectedKeys,
    setSelectedKeys,
    showSuccess,
    showError
  } );

  // 创建一个新的刷新函数来处理批量刷新
  const handleBatchRefresh = async () => {
    if ( !selectedKeys.length ) {
      notification.error( {
        message: "错误",
        description: "请先选择要刷新的地址",
        duration: 1,
      } );
      return;
    }
    await lineaRefresh();
  };

  // 定义单个地址刷新函数
  const handleRefresh = async ( address ) => {
    await lineaRefresh( address );
  };

  // 定义 handleDelete
  const handleDelete = async ( address ) => {
    setWalletData( prev => prev.filter( item => item.address !== address ) );
    localStorage.setItem(
      "linea_addresses",
      JSON.stringify( walletData.filter( item => item.address !== address ) )
    );
  };

  // 定义列配置
  const columns = useLineaColumns( {
    hideColumn: state.hideColumn,
    toggleHideColumn: () => dispatch( { type: 'TOGGLE_HIDE_COLUMN' } ),
    data: walletData,
    setData: setWalletData,
    lineaTotalPoints,
    handleDelete,
    handleRefresh
  } );


  const handleDeleteSelected = async () => {
    if ( !selectedKeys.length ) {
      notification.error( {
        message: "错误",
        description: "请先选择要删除的地址",
        duration: 1,
      } );
      return;
    }

    // 修改这里的删除逻辑
    const newData = walletData.filter( item => !selectedKeys.includes( item.key ) );
    setWalletData( newData );
    localStorage.setItem( "linea_addresses", JSON.stringify( newData ) );
    setSelectedKeys( [] );

    notification.success( {
      message: "成功",
      description: "删除选中地址成功",
      duration: 1,
    } );
  };

  const exportToExcelFile = () => {
    exportToExcel( walletData, "lineaInfo" );
  };

  return (

    <Content className="linea-content">
      <div className="linea-container">
        <StatsCards lineaTotalPoints={lineaTotalPoints} stats={calculateStats( walletData )} />

        <WalletTable
          data={walletData}
          loading={loading}
          selectedKeys={selectedKeys}
          onRefresh={handleRefresh}
          onDelete={handleDelete}
          columns={columns}
          scroll={{ x: 1500, y: '80vh' }}
          onSelectChange={setSelectedKeys}
        />
      </div>

      <div className="wallet-actions-wrapper">
        <WalletActions
          type="linea"
          data={walletData}
          loading={loading}
          selectedKeys={selectedKeys}
          isBatchModalVisible={state.isBatchModalVisible}
          setIsBatchModalVisible={( visible ) => dispatch( { type: 'SET_BATCH_MODAL', payload: visible } )}
          onBatchAdd={handleBatchAdd}
          onRefresh={handleBatchRefresh}
          onDelete={handleDeleteSelected}
          form={batchForm}
        />
      </div>
    </Content>
  );
};

export default Linea;
