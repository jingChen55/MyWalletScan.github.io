import React from 'react';
import { create } from 'zustand';

// 创建全局状态管理
const usePriceStore = create( ( set ) => ( {
  ethPrice: 0,
  lastUpdateTime: null,
  setEthPrice: ( price ) => set( { ethPrice: price, lastUpdateTime: Date.now() } ),
} ) );

// 获取ETH价格
export const fetchEthPrice = async () => {
  try {
    const response = await fetch( 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd' );
    const data = await response.json();
    usePriceStore.getState().setEthPrice( data.ethereum.usd );
    return data.ethereum.usd;
  } catch ( error ) {
    console.error( '获取ETH价格失败:', error );
    return 0;
  }
};

// 自动更新价格的 Hook
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
    const interval = setInterval( updatePrice, 120000 ); // 每分钟更新一次
    return () => clearInterval( interval );
  }, [ lastUpdateTime ] );

  return ethPrice;
};

// 转换 ETH 到 USDT
export const convertEthToUsdt = ( ethAmount ) => {
  const ethPrice = usePriceStore.getState().ethPrice;
  return parseFloat( ethAmount ) * ethPrice;
};

// 格式化金额显示
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