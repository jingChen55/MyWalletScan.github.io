import { JsonRpcProvider, Wallet, parseEther, formatEther } from 'ethers';

// 执行转账的工具函数
export const executeTransfer = async ({
  fromAddress,
  toAddress,
  provider,
  privateKey,
  reserveAmount = '0'
}) => {
  try {
    // 创建钱包实例
    const signer = new Wallet(privateKey, provider);

    // 获取当前余额
    const balance = await provider.getBalance(fromAddress);
    console.log('当前余额:', formatEther(balance));
    const reserveEther = parseEther(reserveAmount.toString());
    console.log('保留金额:', formatEther(reserveEther));

    // 计算可转账金额：当前余额减去保留金额
    const availableAmount = balance.sub(reserveEther);
    console.log('可转账金额:', formatEther(availableAmount));

    if (availableAmount.lte(0)) {
      throw new Error('余额不足（考虑保留金额）');
    }

    // 估算 gas 费用
    const gasPrice = await provider.getFeeData();
    const gasLimit = await provider.estimateGas({
      to: toAddress,
      value: availableAmount
    });

    const gasCost = gasPrice.gasPrice.mul(gasLimit);
    console.log('预估 gas 费用:', formatEther(gasCost));

    // 实际可转账金额 = 可用金额 - gas 费用
    const transferAmount = availableAmount.sub(gasCost);
    console.log('实际转账金额:', formatEther(transferAmount));

    if (transferAmount.lte(0)) {
      throw new Error('扣除 gas 费用后余额不足');
    }

    // 发送交易
    const tx = await signer.sendTransaction({
      to: toAddress,
      value: transferAmount,
      gasLimit,
      gasPrice: gasPrice.gasPrice
    });

    // 等待交易确认
    const receipt = await tx.wait();

    // 计算实际 gas 费用
    const actualGasCost = receipt.gasUsed * receipt.gasPrice;

    return {
      success: true,
      tx,
      amount: transferAmount,
      gasCost: actualGasCost
    };
  } catch (error) {
    console.error('转账执行失败:', error);
    throw error;
  }
}; 