import { Column } from "@antv/g2plot";
import { Alert, Button, Card, Space, Spin, Typography } from "antd";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";

const { Text } = Typography;

const TotalDataChart = ( { data, change_7d, change_1d, onRefresh, isLoading } ) => {
    const containerRef = useRef( null );
    useEffect( () => {
        if ( containerRef.current ) {
            const chart = new Column( containerRef.current, {
                data,
                xField: 'date',
                yField: 'volume',
                slider: {
                    start: 0,
                    end: 1,
                }
            } )
            chart.render();
        }
        return () => {
            if ( containerRef.current ) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [ data ] ); // 你需要在 useEffect 的依赖数组中添加 data ，当 data 发生改变时 useEffect 中的函数会重新执行
    return (
        <Spin spinning={isLoading} size="large">
            <Card title="Vol(M)" extra={
                <Space>
                    <Button onClick={onRefresh} loading={isLoading}>Refresh</Button>
                    <Text type="secondary">1d: </Text>
                    <Text type={change_1d < 0 ? 'danger' : 'success'}>{change_1d}%</Text>
                    <Text type="secondary">7d: </Text>
                    <Text type={change_7d < 0 ? 'danger' : 'success'}>{change_7d}%</Text>
                </Space>
            }>
                <div ref={containerRef} style={{ height: 500 }}></div>
            </Card>
        </Spin>
    )
}

const StarkVol = () => {
    const [ totalDataChart, setTotalDataChart ] = useState( [] );
    const [ change_1d, setChange_1d ] = useState( 0 );
    const [ change_7d, setChange_7d ] = useState( 0 );
    const [ isLoading, setIsLoading ] = useState( false );
    const [ error, setError ] = useState( null );
    const url = "https://api.llama.fi/overview/dexs/Starknet?excludeTotalDataChart=false&excludeTotalDataChartBreakdown=true&dataType=dailyVolume"
    const fetchData = async () => {
        setIsLoading( true );
        try {
            const response = await axios.get( url );
            let totalDataChartTemp = [];
            for ( let i = 0; i < response.data[ 'totalDataChart' ].length; i++ ) {
                totalDataChartTemp.push( {
                    date: new Date( Number( response.data[ 'totalDataChart' ][ i ][ 0 ] ) * 1000 ).toLocaleDateString(),
                    volume: response.data[ 'totalDataChart' ][ i ][ 1 ] / 1000000,
                } )
            }
            setTotalDataChart( totalDataChartTemp );
            setChange_1d( response.data[ 'change_1d' ] );
            setChange_7d( response.data[ 'change_7d' ] );
        } catch ( e ) {
            setError( "Error fetching data." );
        }
        setIsLoading( false );
    }
    const refreshData = () => {
        fetchData();
    }
    useEffect( () => {
        fetchData()
    }, [] );
    if ( error ) {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }

    return (
        <>
            {
                totalDataChart.length > 0 &&
                <TotalDataChart data={totalDataChart} change_1d={change_1d} change_7d={change_7d}
                    onRefresh={refreshData} isLoading={isLoading} />
            }
        </>
    )
}
export default StarkVol;
