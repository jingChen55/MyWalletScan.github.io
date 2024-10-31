import CryptoJS from "crypto-js";

// 加密私钥用于存储
export const encryptForStorage = (privateKey, password) => {
    try {
        if (!privateKey || !password) return null;
        const inputStr = privateKey.toString();
        return CryptoJS.AES.encrypt(inputStr, password).toString();
    } catch (error) {
        console.error('存储加密失败:', error);
        throw new Error('私钥加密失败');
    }
};

// 从存储中解密私钥
export const decryptFromStorage = (encryptedPrivateKey, password) => {
    try {
        if (!encryptedPrivateKey || !password) return null;
        const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, password);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        
        if (!originalText) {
            throw new Error('解密失败');
        }
        
        return originalText;
    } catch (error) {
        console.error('存储解密失败:', error);
        throw new Error('密码错误');
    }
};

// 解密导入的私钥 - 修改解密逻辑
export const decryptPrivateKey = (encryptedPrivateKey, password) => {
    try {
        if (!encryptedPrivateKey || !password) return null;

        // 尝试多种解密方式
        let decrypted = null;

        try {
            // 方式1: 直接解密
            const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, password);
            decrypted = bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            console.log('直接解密失败，尝试其他方式');
        }

        if (!decrypted) {
            try {
                // 方式2: Base64解码后解密
                const base64 = CryptoJS.enc.Base64.parse(encryptedPrivateKey);
                const decryptedData = CryptoJS.AES.decrypt(
                    { ciphertext: base64 },
                    CryptoJS.enc.Utf8.parse(password),
                    {
                        mode: CryptoJS.mode.ECB,
                        padding: CryptoJS.pad.Pkcs7
                    }
                );
                decrypted = decryptedData.toString(CryptoJS.enc.Utf8);
            } catch (e) {
                console.log('Base64解码解密失败');
            }
        }

        if (!decrypted) {
            throw new Error('无法解密私钥');
        }

        return decrypted;
    } catch (error) {
        console.error('解密失败:', error);
        throw new Error('私钥解密失败');
    }
};

// 加密私钥
export const encryptPrivateKey = (privateKey, password) => {
    try {
        if (!privateKey || !password) return null;
        return CryptoJS.AES.encrypt(privateKey, password).toString();
    } catch (error) {
        console.error('加密失败:', error);
        throw new Error('私钥加密失败');
    }
};

// 创建加密文本
export const createEncryptedText = (address, privateKey, password) => {
    const encrypted = encryptPrivateKey(privateKey, password);
    return `${address} ${encrypted}`;
};

// 解析加密文本
export const parseEncryptedText = (text, password) => {
    try {
        const [address, encrypted] = text.trim().split(/\s+/);
        if (!address || !encrypted) {
            throw new Error('无效的加密文本格式');
        }
        
        const privateKey = decryptPrivateKey(encrypted, password);
        
        if (!privateKey) {
            throw new Error('解密失败');
        }

        return {
            address,
            privateKey
        };
    } catch (error) {
        console.error('解析失败:', error);
        throw new Error(`解析失败: ${error.message}`);
    }
}; 