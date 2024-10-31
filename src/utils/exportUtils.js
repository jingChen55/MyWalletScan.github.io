import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename = 'export.xlsx') => {
  const wb = XLSX.utils.book_new();

  // 如果数据包含钱包列表
  if (data.wallets) {
    const walletsData = data.wallets.map(wallet => ({
      '钱包名称': wallet.name,
      '地址': wallet.address,
      '私钥': wallet.encryptedPrivateKey || '未设置',
      'ETH余额': wallet.balance
    }));
    const wsWallets = XLSX.utils.json_to_sheet(walletsData);
    XLSX.utils.book_append_sheet(wb, wsWallets, "钱包列表");
  }

  // 如果数据包含网络配置
  if (data.networks) {
    const networksData = data.networks.map(network => ({
      '网络名称': network.name,
      '链ID': network.chainId,
      'RPC URL': network.rpc,
      '代币符号': network.symbol
    }));
    const wsNetworks = XLSX.utils.json_to_sheet(networksData);
    XLSX.utils.book_append_sheet(wb, wsNetworks, "网络配置");
  }

  // 导出文件
  XLSX.writeFile(wb, filename);
}; 