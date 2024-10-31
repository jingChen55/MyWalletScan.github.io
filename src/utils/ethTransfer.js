import { ethers } from 'ethers';

/**
 * ETH转账函数
 * @param {string} toAddress - 接收方地址
 * @param {string} amount - 转账金额(ETH)
 * @returns {Promise} - 返回包含状态和详细信息的Promise
 */
export const transferETH = async (toAddress, amount) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 检查是否安装了MetaMask
      if (!window.ethereum) {
        throw new Error('请安装MetaMask钱包');
      }

      // 初始状态
      resolve({
        status: 'START',
        message: '开始转账',
        timestamp: new Date().toISOString(),
      });

      // 连接到以太坊提供者
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // 获取当前账户
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      const fromAddress = accounts[0];

      // 转换ETH为Wei
      const amountWei = ethers.utils.parseEther(amount.toString());

      // 构建交易对象
      const transaction = {
        from: fromAddress,
        to: toAddress,
        value: amountWei,
      };

      // 转账中状态
      resolve({
        status: 'PENDING',
        message: '转账处理中',
        timestamp: new Date().toISOString(),
        details: {
          from: fromAddress,
          to: toAddress,
          amount: amount,
          amountWei: amountWei.toString()
        }
      });

      // 发送交易
      const tx = await signer.sendTransaction(transaction);
      
      // 等待交易确认
      const receipt = await tx.wait();

      // 转账成功状态
      resolve({
        status: 'SUCCESS',
        message: '转账成功',
        timestamp: new Date().toISOString(),
        details: {
          from: fromAddress,
          to: toAddress,
          amount: amount,
          amountWei: amountWei.toString(),
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        }
      });

    } catch (error) {
      reject({
        status: 'ERROR',
        message: '转账失败',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });
}; 