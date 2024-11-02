import CryptoJS from "crypto-js";

// 加密私钥用于存储
export const encryptForStorage = ( privateKey, password ) => {
  try {
    if ( !privateKey || !password ) return null;
    const inputStr = privateKey.toString();
    return CryptoJS.AES.encrypt( inputStr, password, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    } ).toString();
  } catch ( error ) {
    console.error( '存储加密失败:', error );
    throw new Error( '私钥加密失败' );
  }
};

// 从存储中解密私钥
export const decryptFromStorage = ( encryptedPrivateKey, password ) => {
  try {
    if ( !encryptedPrivateKey || !password ) {
      throw new Error( '加密私钥或密码为空' );
    }

    // 尝试多种解密方式
    let decrypted = null;
    let error = null;

    // 方式1: ECB模式
    try {
      const bytes = CryptoJS.AES.decrypt( encryptedPrivateKey, password, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      } );
      decrypted = bytes.toString( CryptoJS.enc.Utf8 );
      if ( decrypted ) return decrypted;
    } catch ( e ) {
      error = e;
      console.log( 'ECB模式解密失败，尝试其他方式' );
    }

    // 方式3: 默认配置
    try {
      const bytes = CryptoJS.AES.decrypt( encryptedPrivateKey, password );
      decrypted = bytes.toString( CryptoJS.enc.Utf8 );
      if ( decrypted ) return decrypted;
    } catch ( e ) {
      error = e;
      console.log( '默认配置解密失败' );
    }

    // 如果所有方式都失败
    throw error || new Error( '解密失败' );
  } catch ( error ) {
    console.error( '存储解密失败:', error );
    throw new Error( '密码错误或解密失败' );
  }
};

// 解密导入的私钥 - 修改解密逻辑
export const decryptPrivateKey = ( encryptedPrivateKey, password ) => {
  try {
    if ( !encryptedPrivateKey || !password ) return null;

    // 尝试多种解密方式
    let decrypted = null;

    try {
      // 方式1: 直接解密
      const bytes = CryptoJS.AES.decrypt( encryptedPrivateKey, password );
      decrypted = bytes.toString( CryptoJS.enc.Utf8 );
    } catch ( e ) {
      console.log( '直接解密失败，尝试其他方式' );
    }

    if ( !decrypted ) {
      throw new Error( '无法解密私钥' );
    }

    return decrypted;
  } catch ( error ) {
    console.error( '解密失败:', error );
    throw new Error( '私钥解密失败' );
  }
};