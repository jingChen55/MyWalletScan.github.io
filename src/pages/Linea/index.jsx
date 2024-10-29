import ErrorBoundary from "@components/ErrorBoundary";
import { exportToExcel } from "@utils";
import { calculateStats } from '@utils/lineaHelpers';
import { Form, Layout, notification, Spin } from "antd";
import { Suspense, useState } from "react";
import { useLineaState } from "../../hooks/useLineaState";
import { useNotification } from "../../hooks/useNotification";
import ActionButtons from "./components/ActionButtons";
import BatchAddModal from "./components/BatchAddModal";
import LineaTable from "./components/LineaTable";
import StatsCards from "./components/StatsCards";
import useLineaColumns from "./hooks/useLineaColumns";
import { useLineaData } from "./hooks/useLineaData";
import { useLineaOperations } from "./hooks/useLineaOperations";
import "./index.css";
import { useWalletOperations } from '@/hooks/useWalletOperations';
import WalletTable from '@/components/WalletTable';
import { getLineaData } from "@utils/getLinea/main.js";
import WalletActions from '@/components/WalletActions';

const { Content } = Layout;

const Linea = () => {
  const [ state, dispatch ] = useLineaState();
  const [ initialized, setInitialized ] = useState(false);
  const [ lineaTotalPoints, setLineaTotalPoints ] = useState({});
  const [ batchForm ] = Form.useForm();
  const { showSuccess, showError } = useNotification();

  // 使用 useWalletOperations hook
  const {
    data: walletData,
    loading,
    batchLoading,
    selectedKeys,
    handleRefresh: baseHandleRefresh,
    handleDelete: baseHandleDelete,
    handleDeleteSelected: baseHandleDeleteSelected,
    setData: setWalletData,
    setBatchLoading,
    setSelectedKeys
  } = useWalletOperations({
    storageKey: 'Linea_addresses',
    fetchData: getLineaData,
  });

  // 使用 useLineaOperations hook，传入正确的参数
  const { handleBatchAdd, handleRefresh: lineaRefresh } = useLineaOperations({
    data: walletData,
    setData: setWalletData,
    loading: loading,
    setLoading: setBatchLoading,
    selectedKeys,
    setSelectedKeys,
    showSuccess,
    showError
  });

  // 创建一个新的刷新函数来处理批量刷新
  const handleBatchRefresh = async () => {
    if (!selectedKeys.length) {
      notification.error({
        message: "错误",
        description: "请先选择要刷新的地址",
        duration: 1,
      });
      return;
    }
    await lineaRefresh();
  };

  // 定义单个地址刷新函数
  const handleRefresh = async (address) => {
    await lineaRefresh(address);
  };

  // 定义 handleDelete
  const handleDelete = async (address) => {
    setWalletData(prev => prev.filter(item => item.address !== address));
    localStorage.setItem(
      "linea_addresses",
      JSON.stringify(walletData.filter(item => item.address !== address))
    );
  };

  // 定义列配置
  const columns = useLineaColumns({
    hideColumn: state.hideColumn,
    toggleHideColumn: () => dispatch({ type: 'TOGGLE_HIDE_COLUMN' }),
    data: walletData,
    setData: setWalletData,
    lineaTotalPoints,
    handleDelete,
    handleRefresh
  });

  const handleBatchOk = async () => {
    try {
      setBatchLoading(true);
      const values = await batchForm.validateFields();
      const lines = values.addresses.split("\n");

      const processedAddresses = lines.map(line => {
        line = line.trim();
        let address, name;
        
        // 处理带备注的地址
        if (line.includes(" ")) {
          const parts = line.split(/\s+/);
          address = parts[parts.length - 1].trim(); // 最后一部分作为地址
          name = parts.slice(0, -1).join(" ").trim(); // 前面的部分作为备注
        } else {
          address = line;
          name = "";
        }

        // 如果地址不以 0x 开头，添加 0x
        if (!address.startsWith("0x")) {
          address = "0x" + address;
        }

        return { address, name };
      });

      // 验证所有地址格式
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      const invalidAddresses = processedAddresses.filter(
        ({ address }) => !addressRegex.test(address)
      );

      if (invalidAddresses.length > 0) {
        throw new Error("存在无效的地址格式");
      }

      dispatch({ type: 'SET_BATCH_MODAL', payload: false });
      await handleBatchAdd(processedAddresses, batchForm);
    } catch (error) {
      notification.error({
        message: "错误",
        description: error.message,
        duration: 1,
      });
    } finally {
      setBatchLoading(false);
      batchForm.resetFields();
      setSelectedKeys([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedKeys.length) {
      notification.error({
        message: "错误",
        description: "请先选择要删除的地址",
        duration: 1,
      });
      return;
    }

    // 修改这里的删除逻辑
    const newData = walletData.filter(item => !selectedKeys.includes(item.key));
    setWalletData(newData);
    localStorage.setItem("linea_addresses", JSON.stringify(newData));
    setSelectedKeys([]);
    
    notification.success({
      message: "成功",
      description: "删除选中地址成功",
      duration: 1,
    });
  };

  const exportToExcelFile = () => {
    exportToExcel(walletData, "lineaInfo");
  };

  return (
    <ErrorBoundary>
      <Layout>
        <Content className="linea-content">
          <StatsCards totalPoints={lineaTotalPoints} stats={calculateStats(walletData)} />

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

          <WalletActions
            type="linea"
            data={walletData}
            loading={loading}
            selectedKeys={selectedKeys}
            isBatchModalVisible={state.isBatchModalVisible}
            setIsBatchModalVisible={(visible) => dispatch({ type: 'SET_BATCH_MODAL', payload: visible })}
            onBatchAdd={handleBatchAdd}
            onRefresh={handleBatchRefresh}
            onDelete={handleDeleteSelected}
            form={batchForm}
          />
        </Content>
      </Layout>
    </ErrorBoundary>
  );
};

export default Linea;
