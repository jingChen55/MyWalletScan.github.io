# API 文档

## 加密工具 (cryptoUtils.js)

### encryptForStorage
加密私钥用于存储

**参数:**
- privateKey: string - 需要加密的私钥
- password: string - 加密密码

**返回值:**
- string - 加密后的私钥字符串

**用途:**
用于将钱包私钥加密后存储到 IndexedDB 中,保证私钥安全性。使用 AES 加密算法。

**示例:**