import { ethers } from 'ethers';

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
const delay = ( ms ) => new Promise( resolve => setTimeout( resolve, ms ) );

/**
 * 获取钱包的交易记录
 * @param {string} address - 钱包地址
 * @param {ethers.Provider} provider - 网络提供者
 * @param {number} [blockCount=20] - 查询的区块数量
 * @returns {Promise<Array>} 交易记录数组
 */
export const fetchTransactions = async ( address, provider ) => {
  try {
    const transactions = await provider.getTransactions( address )
    return transactions.sort( ( a, b ) => b.timestamp - a.timestamp );
  } catch ( error ) {
    console.error( '获取交易记录失败:', error );
    throw error;
  }
};

/**
 * 获取交易详情
 * @param {string} txHash - 交易哈希
 * @param {ethers.Provider} provider - 网络提供者
 * @returns {Promise<Object>} 交易详情
 */
export const getTransactionDetails = async ( txHash, provider ) => {
  try {
    const tx = await provider.getTransaction( txHash );
    const receipt = await provider.getTransactionReceipt( txHash );
    const block = await provider.getBlock( tx.blockNumber );

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: ethers.formatEther( tx.value || 0 ),
      timestamp: block.timestamp * 1000,
      status: receipt.status === 1 ? 'success' : 'failed',
      gasPrice: ethers.formatUnits( tx.gasPrice || 0, 'gwei' ),
      gasUsed: receipt.gasUsed.toString(),
      blockNumber: tx.blockNumber,
      nonce: tx.nonce,
      data: tx.data,
      confirmations: await provider.getBlockNumber() - tx.blockNumber + 1
    };
  } catch ( error ) {
    console.error( '获取交易详情失败:', error );
    throw error;
  }
}; 