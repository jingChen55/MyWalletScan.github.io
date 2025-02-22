# 功能模块说明

## 1. 钱包管理
### 1.1 钱包列表(WalletList)
- 显示钱包列表
- 支持添加/删除钱包
- 支持批量导入钱包
- 查看钱包私钥(加密存储)
- 更新钱包余额
- 导出钱包配置

### 1.2 钱包详情(WalletDetail)  
- 显示钱包详细信息
- 显示各网络余额
- 支持 ETH/USDT 单位切换
- 自动更新余额

## 2. 网络管理(NetworkConfig)
- 配置多链网络
- 添加/编辑/删除网络
- 设置 RPC 节点
- 设置链 ID 和代币符号

## 3. 批量转账(BatchTransfer)
### 3.1 转账对管理
- 添加转账对
- 批量导入转账对
- 删除转账对
- 数据持久化存储

### 3.2 转账执行
- 支持单笔转账
- 支持批量转账
- 自动计算转账金额
- 显示预估 Gas 费用
- 显示实际 Gas 消耗

### 3.3 Gas 费用显示
- 显示高速/标准/缓慢三档 Gas 费用
- 同时显示 ETH 和 USDT 价格
- 自动更新 Gas 价格
- 紧凑型卡片展示 