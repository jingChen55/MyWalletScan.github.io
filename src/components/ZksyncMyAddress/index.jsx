import { Area, Column } from '@antv/g2plot';
import { getEthPrice } from "@utils";
import { dbConfig, get, getAllKeys, initDB } from "@utils/indexedDB/main.js";
import { Card, Col, Row, Select } from "antd";
import moment from "moment";
import { useEffect, useRef, useState, useMemo } from "react";

const CHART_CONFIG = {
  height: 300,
  slider: {
    start: 0,
    end: 1,
    formatter: (v) => moment(v).format('YYYY-MM-DD'),
  }
}

const useDateRange = (transactions) => {
  return useMemo(() => {
    if (!transactions.length) return []
    const sortedTransactions = transactions.sort((a, b) => 
      moment(a.receivedAt).isAfter(b.receivedAt) ? 1 : -1
    )
    const startDate = sortedTransactions[0].receivedAt
    const endDate = sortedTransactions[sortedTransactions.length - 1].receivedAt
    
    let currentDate = moment(startDate).startOf('day')
    const endMoment = moment(endDate).startOf('day')
    const dateRange = []

    while (currentDate.isSameOrBefore(endMoment)) {
      dateRange.push({
        date: currentDate.format('YYYY-MM-DD'),
        value: 0
      })
      currentDate = currentDate.add(1, 'days')
    }
    return dateRange
  }, [transactions])
}

const DailyTransaction = ({transactions, ethPrice}) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (transactions.length === 0) {
            return;
        }
        const sortedTransactions = transactions.sort((a, b) => moment(a.receivedAt).isAfter(b.receivedAt) ? 1 : -1);
        const startDate = sortedTransactions[0].receivedAt;
        const endDate = sortedTransactions[sortedTransactions.length - 1].receivedAt;
        const dateRange = createDateRange(startDate, endDate);

        let transactionData = {};
        transactions.forEach(item => {
            const dateOnly = moment(item.receivedAt).format('YYYY-MM-DD');
            transactionData[dateOnly] = {
                date: dateOnly,
                value: parseInt(item.fee, 16) / 10 ** 18 * ethPrice
            };
        });

        let data = dateRange.map(item => transactionData[item.date] || item);

        if (containerRef.current) {
            const chart = new Column(containerRef.current, {
                data,
                xField: 'date',
                yField: 'value',
                slider: {
                    start: 0,
                    end: 1,
                    formatter: (v) => moment(v).format('YYYY-MM-DD'),
                },
            });

            chart.render();
        }
        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        }
    }, [transactions]);

    return (
        <Card title={"每日Gas消耗统计(U)"}>
            <div ref={containerRef} style={{height: 300}}></div>
        </Card>
    );
}


const CumulativeGasFee = ({transactions, ethPrice}) => {
    const containerRef = useRef(null);
    useEffect(() => {
        if (transactions.length === 0) {
            return;
        }
        let transactionData = [];
        let cumulativeValue = 0;
        transactions.forEach(item => {
            cumulativeValue += parseInt(item.fee, 16) / 10 ** 18 * ethPrice;
            transactionData.push({
                date: moment(item.receivedAt).format('YYYY-MM-DD'),
                value: cumulativeValue
            });
        });
        if (containerRef.current) {
            const chart = new Area(containerRef.current, {
                data: transactionData,
                xField: 'date',
                yField: 'value',
                smooth: true,
                isStack: true,
                slider: {
                    start: 0,
                    end: 1,
                    formatter: (v) => moment(v).format('YYYY-MM-DD'),
                },
                label: {
                    formatter: (v) => {
                        return v.value.toFixed(2)
                    },
                }
            });
            chart.render();
        }
        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [transactions]);

    return (
        <Card title={"累计Gas消耗统计(U)"}>
            <div ref={containerRef} style={{height: 300}}></div>
        </Card>
    );
}

const DailyTransactions = ({transactions}) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (transactions.length === 0) {
            return;
        }
        const sortedTransactions = transactions.sort((a, b) => moment(a.receivedAt).isAfter(b.receivedAt) ? 1 : -1);
        const startDate = sortedTransactions[0].receivedAt;
        const endDate = sortedTransactions[sortedTransactions.length - 1].receivedAt;
        const dateRange = createDateRange(startDate, endDate);

        let transactionData = {};
        transactions.forEach(item => {
            const dateOnly = moment(item.receivedAt).format('YYYY-MM-DD');
            if (!transactionData[dateOnly]) {
                transactionData[dateOnly] = {
                    date: dateOnly,
                    value: 1
                };
            } else {
                transactionData[dateOnly].value += 1;
            }
        });

        let data = dateRange.map(item => transactionData[item.date] || item);

        if (containerRef.current) {
            const chart = new Column(containerRef.current, {
                data,
                xField: 'date',
                yField: 'value',
                slider: {
                    start: 0,
                    end: 1,
                    formatter: (v) => moment(v).format('YYYY-MM-DD'),
                },
            });
            chart.render();
        }

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [transactions]);

    return (
        <Card title={"每日交易Tx"}>
            <div ref={containerRef} style={{height: 300}}></div>
        </Card>
    );
};
const getTransactionVolume = ({transaction}) => {
    const transfers = transaction.transfers.sort(
        (a, b) =>
            parseInt(b.amount) * 10 ** -b.token.decimals * b.token.price -
            parseInt(a.amount) * 10 ** -a.token.decimals * a.token.price,
    );
    if (transfers.length === 0) return 0;
    return parseInt(transfers[0].amount) * 10 ** -transfers[0].token.decimals * transfers[0].token.price;
}
const CumulativeVolume = ({transactions}) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (transactions.length === 0) {
            return;
        }

        let transactionData = {};
        let cumulativeValue = 0;

        transactions.forEach(transaction => {
            const dateOnly = moment(transaction.receivedAt).format('YYYY-MM-DD');
            const volume = getTransactionVolume({transaction});
            cumulativeValue += volume;
            transactionData[dateOnly] = {
                date: dateOnly,
                value: cumulativeValue
            };
        });

        let data = Object.values(transactionData);

        if (containerRef.current) {
            const chart = new Area(containerRef.current, {
                data,
                xField: 'date',
                yField: 'value',
                smooth: true,
                isStack: true,
                slider: {
                    start: 0,
                    end: 1,
                    formatter: (v) => moment(v).format('YYYY-MM-DD'),
                },
                label: {
                    formatter: (v) => {
                        return v.value.toFixed(2)
                    },
                }
            });
            chart.render();
        }
        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [transactions]);

    return (
        <Card title={"累计交易量(U)"}>
            <div ref={containerRef} style={{height: 300}}></div>
        </Card>
    );
};

const getZkSyncAllAddress = async () => {
    await initDB(dbConfig)
    const addresses = await getAllKeys("zkTransactions")
    return addresses || []
}
const getAddressTranscation = async (address) => {
    await initDB(dbConfig)
    const transactions = await get("zkTransactions", address)
    const transactionsData = transactions.data ? JSON.parse(transactions.data) : []
    return transactionsData || []
}
const ZksyncMyAddress = () => {
    const [address, setAddress] = useState([])
    const [selectAddress, setSelectAddress] = useState('')
    const [transactions, setTransactions] = useState([])
    const [ethPrice, setEthPrice] = useState(0)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        getEthPrice().then(setEthPrice)
    }, [])

    useEffect(() => {
        getZkSyncAllAddress().then(setAddress)
    }, [])

    const handleAddressChange = async (value) => {
        try {
            setLoading(true)
            setSelectAddress(value)
            const res = await getAddressTranscation(value)
            setTransactions(res)
        } catch (error) {
            console.error('Failed to fetch transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <Select
                value={selectAddress || undefined}
                placeholder="选择地址展示数据"
                style={{ width: "100%", marginTop: "20px" }}
                onChange={handleAddressChange}
                loading={loading}
                notFoundContent="暂无数据,请先刷新您的zkSync获取数据"
                options={address.map((item) => ({
                    value: item,
                    label: item
                }))}
            />
            {selectAddress && (
                <Row gutter={16} style={{marginTop: 20}}>
                    <Col xs={24} md={12}>
                        <DailyTransaction transactions={transactions} ethPrice={ethPrice}/>
                    </Col>
                    <Col xs={24} md={12}>
                        <CumulativeGasFee transactions={transactions} ethPrice={ethPrice}/>
                    </Col>
                    <Col xs={24} md={12}>
                        <DailyTransactions transactions={transactions}/>
                    </Col>
                    <Col xs={24} md={12}>
                        <CumulativeVolume transactions={transactions}/>
                    </Col>
                </Row>
            )}
        </div>
    )
}
export default ZksyncMyAddress;
