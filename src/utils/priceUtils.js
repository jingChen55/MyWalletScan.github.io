import axios from 'axios';
import React from 'react';
import { create } from 'zustand';
// 创建全局状态管理
const usePriceStore = create( ( set ) => ( {
  ethPrice: 0,
  lastUpdateTime: null,
  setEthPrice: ( price ) => set( { ethPrice: price, lastUpdateTime: Date.now() } ),
} ) );

/**
 * 格式化金额显示为美元
 * @param {number} amount - 金额
 * @returns {string} 格式化后的金额
 */
function formatToUSD( amount ) {
  return new Intl.NumberFormat( 'en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  } ).format( amount );
}
/**
 * 获取ETH价格
 * @returns {number} ETH价格
 */
export const fetchEthPrice = async () => {
  try {
    const response = await axios.get( 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd' );
    const data = response.data
    usePriceStore.getState().setEthPrice( data.ethereum.usd );
    return data.ethereum.usd;
  } catch ( error ) {
    console.error( '获取ETH价格失败:', error );
    return 0;
  }
};

/**
 * 更新ETH价格 每分钟更新一次
 * @returns {number} ETH价格
 */
export const useEthPrice = () => {
  const { ethPrice, lastUpdateTime } = usePriceStore();

  React.useEffect( () => {
    const updatePrice = async () => {
      // 如果从未更新过或者上次更新时间超过1分钟，则更新价格
      if ( !lastUpdateTime || Date.now() - lastUpdateTime > 60000 ) {
        await fetchEthPrice();
      }
    };

    updatePrice();
    const interval = setInterval( updatePrice, 60000 ); // 每分钟更新一次
    return () => clearInterval( interval );
  }, [ lastUpdateTime ] );

  return ethPrice;
};

/**
 * 将 ETH 转换为 USDT
 * @param {number} ethAmount - ETH 金额
 * @returns {string} 转换后的 USDT 金额
 */
export const convertEthToUsdt = ( ethAmount = 0 ) => {
  const ethPrice = usePriceStore.getState().ethPrice;
  return formatToUSD( parseFloat( ethAmount ) * ethPrice );
};

/**
 * 格式化金额显示
 * @param {number} amount - 金额
 * @param {string} type - 类型 'ETH' | 'USDT'
 * @returns {string} 格式化后的金额
 */
export const formatAmount = ( amount, type = 'ETH' ) => {
  const num = parseFloat( amount );
  if ( isNaN( num ) ) return '0';

  if ( type === 'ETH' ) {
    return num.toFixed( 6 );
  } else if ( type === 'USDT' ) {
    const str = num.toString();
    // 如果小数点后都是0，只保留6位
    if ( /\./.test( str ) && !/[1-9]/.test( str.split( '.' )[ 1 ] ) ) {
      return num.toFixed( 6 );
    }
    // 否则保留8位小数
    return num.toFixed( 8 );
  }

  return num.toString();
};

/**
 * 将 USDT 转换为 ETH
 * @param {number} usdtAmount - USDT 金额
 * @param {number} ethPrice - 当前 ETH 价格
 * @returns {string} 转换后的 ETH 金额
 */
export const convertUsdtToEth = ( usdtAmount, ethPrice ) => {
  if ( !ethPrice || ethPrice <= 0 ) {
    throw new Error( '无效的 ETH 价格' );
  }
  return ( usdtAmount / ethPrice ).toFixed( 6 );
}; 