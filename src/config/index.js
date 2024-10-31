import { JsonRpcProvider } from 'ethers';

export const CONFIG = {
  // 主网 RPC 节点列表
  RPC_URLS: [
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://ethereum.publicnode.com',
    'https://1rpc.io/eth',
    'https://eth-rpc.gateway.pokt.network'
  ],
  
  // 默认使用第一个节点
  RPC_URL: 'https://eth.llamarpc.com',
};

// 添加获取可用 RPC 的函数
export const getWorkingRPC = async (address) => {
  for (const rpc of CONFIG.RPC_URLS) {
    try {
      const provider = new JsonRpcProvider(rpc);
      // 测试连接并获取余额
      await provider.getBalance(address);
      console.log(`RPC ${rpc} 可用，成功获取地址 ${address} 的余额`);
      return rpc;
    } catch (error) {
      console.warn(`RPC ${rpc} 不可用或无法获取地址 ${address} 的余额，尝试下一个`);
      continue;
    }
  }
  throw new Error('没有可用的 RPC 节点');
}; 