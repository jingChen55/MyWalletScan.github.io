import { transferETH } from '../../utils/ethTransfer';

const ZkBridge = () => {

    const handleTransfer = async () => {
        try {
            transferETH('0x接收方地址', '0.1')
                .then(result => {
                    switch (result.status) {
                        case 'START':
                            console.log('开始转账:', result);
                            // 处理开始转账状态
                            break;
                        case 'PENDING':
                            console.log('转账处理中:', result);
                            // 处理转账中状态
                            break;
                        case 'SUCCESS':
                            console.log('转账成功:', result);
                            // 处理转账成功状态
                            break;
                    }
                })
                .catch(error => {
                    console.error('转账错误:', error);
                    // 处理错误状态
                });
        } catch (error) {
            console.error('处理错误:', error);
        }
    };

    return (
        <div>

        </div>
    )
}

export default ZkBridge;
