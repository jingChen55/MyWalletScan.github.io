# 系统架构设计

## 整体架构

系统采用前端单页应用架构,主要包含以下几个部分:

### 1. 前端层
- Web前端 (React + Vite)
- 组件库 (Ant Design)
- 状态管理 (React Hooks)
- 路由管理 (React Router)

### 2. 数据层
- 本地存储 (IndexedDB)
- 加密存储 (CryptoJS)
- 状态缓存 (React State)

### 3. 业务服务层
- 钱包管理服务
  - 钱包导入导出
  - 余额查询更新
  - 批量操作处理
- 转账服务
  - 单笔转账
  - 批量转账
  - Gas估算
- Layer2服务
  - Zksync
  - Layer
  - Linea
  - Scroll
  - Base

### 4. Web3交互层
- Provider管理
- 交易处理
- 网络切换
- MetaMask集成

### 5. 工具层
- 加密工具 (cryptoUtils)
- 转账工具 (transferUtils)
- 价格工具 (priceUtils)
- 导出工具 (exportUtils)

## 技术栈选型

### 前端技术栈
- React 18 - 前端框架
- Vite - 构建工具
- Ant Design - UI组件库
- React Router - 路由管理
- ethers.js - 区块链交互
- CryptoJS - 加密算法
- IndexedDB - 本地存储

### 工具库
- xlsx - Excel处理
- bignumber.js - 精确计算
- dayjs - 时间处理
- lodash - 工具函数

## 系统部署架构

### 开发环境
- 本地开发服务器
- Vite开发服务器
- 热更新支持

### 生产环境
- 静态资源部署
- CDN加速
- HTTPS支持

## 安全架构

### 数据安全
- 私钥AES加密存储
- 密码不存储本地
- 敏感数据加密

### 交易安全
- 转账二次确认
- Gas费用预估
- 地址格式校验
- 余额充足检查

## 监控运维

### 错误监控
- 全局错误捕获
- 控制台日志
- 用户反馈

### 性能监控
- 页面加载时间
- 交易响应时间
- 资源占用情况