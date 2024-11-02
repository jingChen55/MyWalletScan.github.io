# 数据库设计文档

## 概述
项目使用 IndexedDB 作为本地数据库，用于存储钱包信息、网络配置和转账记录等数据。

## 数据库配置
- 数据库名称: WalletDB
- 当前版本: 1
- 存储对象: wallets, networks, transferPairs

## 存储对象设计

### 1. wallets (钱包存储)
用于存储用户的钱包信息

**键值设计:**
- keyPath: 'address' (主键，钱包地址)
- autoIncrement: false

**字段设计:**

## 数据关系设计

### 钱包与转账对关系
1. 一对多关系：一个钱包地址(wallets.address)可以对应多个转账对的发送地址(transferPairs.fromAddress)
2. 外键关系：transferPairs.fromAddress 参照 wallets.address
3. 级联操作：
   - 删除钱包时，相关的转账对保留（用于历史记录）
   - 更新钱包地址时，相关转账对地址同步更新

### 网络与转账对关系
1. 一对多关系：一个网络(networks.chainId)可以对应多个转账对(transferPairs.chainId)
2. 外键关系：transferPairs.chainId 参照 networks.chainId
3. 级联操作：
   - 删除网络时，检查是否存在相关转账对
   - 禁止删除有关联转账对的网络

### 钱包与网络关系
1. 多对多关系：每个钱包在每个网络都有余额
2. 实现方式：