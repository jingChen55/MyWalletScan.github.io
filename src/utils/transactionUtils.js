import { ethers } from 'ethers';

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 获取钱包的交易记录
 * @param {string} address - 钱包地址
 * @param {ethers.Provider} provider - 网络提供者
 * @param {number} [blockCount=20] - 查询的区块数量
 * @returns {Promise<Array>} 交易记录数组
 */
export const fetchTransactions = async (address, provider, blockCount = 20) => {
  try {
    // 获取当前区块
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - blockCount);

    // 分批获取区块，每批5个
    const batchSize = 5;
    const transactions = [];
    
    for (let i = 0; i < blockCount; i += batchSize) {
      const endBlock = Math.min(currentBlock, fromBlock + i + batchSize);
      const startBlock = fromBlock + i;
      
      // 获取这批区块
      for (let blockNumber = startBlock; blockNumber < endBlock; blockNumber++) {
        try {
          // 添加延迟，避免请求过快
          await delay(500);
          
          const block = await provider.getBlock(blockNumber, true);
          if (!block || !block.transactions) continue;

          // 过滤与地址相关的交易
          const relevantTxs = block.transactions.filter(tx =>
            tx.from?.toLowerCase() === address.toLowerCase() ||
            tx.to?.toLowerCase() === address.toLowerCase()
          );

          // 获取交易详情
          for (const tx of relevantTxs) {
            try {
              // 添加延迟，避免请求过快
              await delay(500);
              
              const receipt = await provider.getTransactionReceipt(tx.hash);
              if (!receipt) continue;

              transactions.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: ethers.formatEther(tx.value || 0n),
                timestamp: block.timestamp * 1000,
                status: receipt.status === 1 ? 'success' : 'failed',
                gasPrice: ethers.formatUnits(tx.gasPrice || 0n, 'gwei'),
                gasUsed: receipt.gasUsed.toString(),
                blockNumber: tx.blockNumber,
                type: tx.from.toLowerCase() === address.toLowerCase() ? '转出' : '转入'
              });
            } catch (error) {
              console.error('获取交易详情失败:', error);
              continue;
            }
          }
        } catch (error) {
          console.error(`获取区块 ${blockNumber} 失败:`, error);
          continue;
        }
      }
    }

    // 按时间戳排序，最新的在前
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('获取交易记录失败:', error);
    throw error;
  }
};

/**
 * 获取交易详情
 * @param {string} txHash - 交易哈希
 * @param {ethers.Provider} provider - 网络提供者
 * @returns {Promise<Object>} 交易详情
 */
export const getTransactionDetails = async (txHash, provider) => {
  try {
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    const block = await provider.getBlock(tx.blockNumber);

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: ethers.formatEther(tx.value || 0),
      timestamp: block.timestamp * 1000,
      status: receipt.status === 1 ? 'success' : 'failed',
      gasPrice: ethers.formatUnits(tx.gasPrice || 0, 'gwei'),
      gasUsed: receipt.gasUsed.toString(),
      blockNumber: tx.blockNumber,
      nonce: tx.nonce,
      data: tx.data,
      confirmations: await provider.getBlockNumber() - tx.blockNumber + 1
    };
  } catch (error) {
    console.error('获取交易详情失败:', error);
    throw error;
  }
}; 