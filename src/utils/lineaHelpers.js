export const calculateStats = (data) => {
  return {
    totalAddresses: data.length,
    totalPoints: data.reduce((sum, item) => sum + (item.xp?.lxp || 0), 0),
    averagePoints: data.length ? 
      data.reduce((sum, item) => sum + (item.xp?.lxp || 0), 0) / data.length : 0
  };
};

export const formatAddress = (address, hidden) => {
  if (hidden) {
    return `${address.slice(0, 4)}***${address.slice(-4)}`;
  }
  return address;
};
