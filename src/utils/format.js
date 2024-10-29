/**
 * 格式化数字，保留指定小数位
 * @param {number} number - 要格式化的数字
 * @param {number} decimals - 小数位数，默认为 4
 * @returns {string} 格式化后的数字字符串
 */
export const formatNumber = (number, decimals = 4) => {
  if (!number) return '0';
  
  // 确保 number 是数字类型
  const num = typeof number === 'string' ? parseFloat(number) : number;
  
  if (isNaN(num)) return '0';
  
  // 处理科学计数法
  if (Math.abs(num) < 0.00001) {
    return num.toExponential(decimals);
  }

  // 常规数字格式化
  return num.toFixed(decimals).replace(/\.?0+$/, '');
};

/**
 * 格式化地址，显示前几位和后几位
 * @param {string} address - 要格式化的地址
 * @param {number} start - 开始显示的位数，默认为 4
 * @param {number} end - 结束显示的位数，默认为 4
 * @returns {string} 格式化后的地址
 */
export const formatAddress = (address, start = 4, end = 4) => {
  if (!address) return '';
  if (address.length <= start + end) return address;
  
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

/**
 * 格式化时间戳为日期字符串
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/**
 * 格式化金额，添加千分位
 * @param {number} amount - 要格式化的金额
 * @param {number} decimals - 小数位数，默认为 2
 * @returns {string} 格式化后的金额字符串
 */
export const formatAmount = (amount, decimals = 2) => {
  if (!amount) return '0';
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}; 