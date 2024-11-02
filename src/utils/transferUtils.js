import { ethers } from 'ethers';

/**
 * 执行ETH转账
 * @param {Object} params - 转账参数对象
 * @param {string} params.fromAddress - 发送方地址
 * @param {string} params.toAddress - 接收方地址
 * @param {ethers.Provider} params.provider - 网络提供者
 * @param {string} params.privateKey - 发送方私钥
 * @param {string} [params.reserveAmount='0'] - 保留金额，默认为0
 * @returns {Promise<Object>} 转账结果
 * @returns {boolean} result.success - 交易是否成功
 * @returns {Object} result.tx - 交易详情
 * @returns {string} result.amount - 转账金额
 * @returns {string} result.gasCost - gas费用（ETH单位）
 * @throws {Error} 当余额不足或交易失败时抛出错误
 */
export const executeTransfer = async ({
  fromAddress,
  toAddress,
  provider,
  privateKey,
  reserveAmount = '0'
}) => {
  try {
    // 创建钱包实例
    const wallet = new ethers.Wallet(privateKey, provider);

    // 获取当前余额
    const balance = await provider.getBalance(fromAddress);
    console.log('当前余额:', balance.toString());
    const reserveEther = ethers.parseEther(reserveAmount.toString());
    console.log('保留金额:', reserveEther.toString());

    // 估算gas费用（增加 50% 的缓冲）
    const feeData = await provider.getFeeData();
    const gasLimit = 21000n;
    const gasPrice = feeData.maxFeePerGas || feeData.gasPrice;
    const baseGasCost = gasPrice * gasLimit;
    const gasCost = (baseGasCost * 150n) / 100n; // 增加50%的gas费用作为缓冲
    console.log('Gas价格:', gasPrice.toString());
    console.log('预估gas费用:', gasCost.toString());

    // 计算可用金额：当前余额减去保留金额和gas费用
    const availableAmount = balance - reserveEther - gasCost;
    console.log('可用金额:', availableAmount.toString());

    // 检查可用金额是否足够
    if (availableAmount <= 0n) {
      throw new Error('余额不足（考虑保留金额和gas费用）');
    }

    // 创建交易对象，使用95%的可用金额作为转账金额，以留出更多gas费用缓冲
    const transferAmount = (availableAmount * 95n) / 100n;
    const tx = {
      to: toAddress,
      value: transferAmount,
      gasLimit,
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      type: 2
    };

    // 发送交易并等待确认
    const transactionResponse = await wallet.sendTransaction(tx);
    await transactionResponse.wait();

    // 返回交易结果
    return {
      success: true,
      tx,
      amount: transferAmount.toString(),
      gasCost: ethers.formatEther(gasCost)
    };
  } catch (error) {
    console.error('转账执行失败:', error);
    throw error;
  }
};

/**
 * 执行代币转账
 * @param {Object} params - 转账参数对象
 * @param {string} params.fromAddress - 发送方地址
 * @param {string} params.toAddress - 接收方地址
 * @param {ethers.Provider} params.provider - 网络提供者
 * @param {string} params.privateKey - 发送方私钥
 * @param {string} params.tokenAddress - 代币合约地址
 * @param {string|number} params.tokenAmount - 转账代币数量
 * @param {number} [params.tokenDecimals=18] - 代币精度，默认18位
 * @returns {Promise<Object>} 转账结果
 * @returns {boolean} result.success - 交易是否成功
 * @returns {Object} result.tx - 交易详情
 * @returns {string|number} result.amount - 转账代币数量
 * @returns {string} result.gasCost - gas费用（ETH单位）
 * @throws {Error} 当代币余额不足、ETH余额不足或交易失败时抛出错误
 */
export const executeTokenTransfer = async ({
  fromAddress,
  toAddress,
  provider,
  privateKey,
  tokenAddress,
  tokenAmount,
  tokenDecimals = 18
}) => {
  try {
    // 创建钱包实例
    const wallet = new ethers.Wallet(privateKey, provider);

    // 创建代币合约实例
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function balanceOf(address account) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)'
      ],
      wallet
    );

    // 获取代币余额
    const balance = await tokenContract.balanceOf(fromAddress);
    console.log('代币余额:', ethers.formatUnits(balance, tokenDecimals));

    // 检查代币余额是否足够
    const transferAmountBN = ethers.utils.parseUnits(tokenAmount.toString(), tokenDecimals);
    if (balance.lt(transferAmountBN)) {
      throw new Error('代币余额不足');
    }

    // 估算gas费用
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.maxFeePerGas || feeData.gasPrice;
    const gasLimit = await tokenContract.estimateGas.transfer(toAddress, transferAmountBN);
    const gasCost = gasPrice.mul(gasLimit);
    
    console.log('Gas价格:', ethers.formatEther(gasPrice));
    console.log('预估gas费用:', ethers.formatEther(gasCost));

    // 检查ETH余额是否足够支付gas费用
    const ethBalance = await provider.getBalance(fromAddress);
    if (ethBalance.lt(gasCost)) {
      throw new Error('ETH余额不足以支付gas费用');
    }

    // 发送代币转账交易并等待确认
    const tx = await tokenContract.transfer(toAddress, transferAmountBN, {
      gasLimit,
      gasPrice
    });
    await tx.wait();

    // 返回交易结果
    return {
      success: true,
      tx,
      amount: tokenAmount,
      gasCost: ethers.formatEther(gasCost)
    };

  } catch (error) {
    console.error('代币转账执行失败:', error);
    throw error;
  }
};
