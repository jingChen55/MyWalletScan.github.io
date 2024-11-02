# 项目概述

## 项目简介
这是一个基于 React + Vite 开发的 Web3 钱包管理工具,主要用于管理以太坊钱包和执行批量转账操作。

## 技术栈
- React 18
- Vite
- Ant Design
- ethers.js
- IndexedDB
- CryptoJS

## 项目结构

### 主要目录
- src/
  - components/         # React组件
    - BatchTransfer/    # 批量转账相关组件
    - WalletList/      # 钱包列表组件
    - common/          # 通用组件
  - utils/             # 工具函数
    - cryptoUtils.js   # 加密相关工具
    - priceUtils.js    # 价格计算工具
    - transferUtils.js # 转账相关工具
  - hooks/             # 自定义Hooks
  - store/             # 状态管理
  - services/          # 服务层
  - constants/         # 常量定义
  - types/            # TypeScript类型定义

### 文档目录
- Doc/
  - overview.md       # 项目概述
  - workflow.md       # 工作流程文档
  - security.md       # 安全设计文档
  - testing.md        # 测试文档
  - project-structure.md # 项目结构文档

### 配置文件
- vite.config.js      # Vite配置
- package.json        # 项目依赖
- .env               # 环境变量
- .gitignore         # Git忽略配置
- tsconfig.json      # TypeScript配置

### 测试目录
- tests/
  - unit/            # 单元测试
  - integration/     # 集成测试
  - e2e/             # 端到端测试
### 构建目录
- dist/              # 生产构建输出
  - assets/          # 静态资源
  - index.html       # 入口HTML
- build/             # 构建相关脚本
  - scripts/         # 构建脚本
  - config/          # 构建配置

### 资源目录
- public/            # 静态资源
  - images/          # 图片资源
  - fonts/           # 字体资源
  - locales/         # 国际化资源
- assets/            # 项目资源
  - styles/          # 样式文件
  - icons/           # 图标文件

### 其他
- .vscode/          # VSCode配置
- .github/          # GitHub配置
  - workflows/      # GitHub Actions
- docs/             # 补充文档
  - api/            # API文档
  - deployment/     # 部署文档

