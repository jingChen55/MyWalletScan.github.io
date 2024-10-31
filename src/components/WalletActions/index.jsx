import {
  DeleteOutlined,
  DownloadOutlined,
  SyncOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { exportToExcel } from "@utils";
import { Button, Card, Form, Input, Modal, Popconfirm, notification } from 'antd';
import React from 'react';
import './index.css';
const { TextArea } = Input;

const WalletActions = ( {
  // 基础属性
  type, // 'scroll' | 'linea' 用于区分不同页面
  data,
  loading,
  selectedKeys,
  // 状态控制
  isBatchModalVisible,
  setIsBatchModalVisible,
  // 操作函数
  onBatchAdd,
  onRefresh,
  onDelete,
  // Form 相关
  form,
} ) => {
  const handleBatchOk = async () => {
    try {
      const values = await form.validateFields();
      const lines = values.addresses.split( "\n" );

      const processedAddresses = lines.map( line => {
        line = line.trim();
        let address, name;

        const parts = line.split( /[\s\t]+/ );
        if ( parts.length > 1 ) {
          address = parts[ parts.length - 1 ].trim();
          name = parts.slice( 0, -1 ).join( " " ).trim();
        } else {
          address = line;
          name = "";
        }

        if ( !address.startsWith( "0x" ) ) {
          address = "0x" + address;
        }

        return { address, name };
      } );

      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      const invalidAddresses = processedAddresses.filter(
        ( { address } ) => !addressRegex.test( address )
      );

      if ( invalidAddresses.length > 0 ) {
        throw new Error( "存在无效的地址格式" );
      }

      setIsBatchModalVisible( false );
      await onBatchAdd( processedAddresses );
    } catch ( error ) {
      notification.error( {
        message: "错误",
        description: error.message,
        duration: 1,
      } );
    }
  };

  const handleExport = () => {
    exportToExcel( data, `${ type }Info` );
  };

  return (
    <>
      <Modal
        title="批量添加地址"
        open={isBatchModalVisible}
        onOk={handleBatchOk}
        onCancel={() => {
          setIsBatchModalVisible( false );
          form.resetFields();
        }}
        okText="添加地址"
        cancelText="取消"
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="地址"
            name="addresses"
            rules={[
              {
                required: true,
                validator: async ( _, value ) => {
                  if ( !value ) {
                    return Promise.reject( '请输入地址' );
                  }
                  const lines = value.split( "\n" ).filter( line => line.trim() );
                  const invalidLines = [];

                  lines.forEach( ( line, index ) => {
                    let address;
                    const parts = line.split( /[\s\t]+/ );
                    if ( parts.length > 1 ) {
                      address = parts[ parts.length - 1 ].trim();
                    } else {
                      address = line.trim();
                    }

                    if ( !address.startsWith( "0x" ) ) {
                      address = "0x" + address;
                    }

                    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
                    if ( !addressRegex.test( address ) ) {
                      invalidLines.push( index + 1 );
                    }
                  } );

                  if ( invalidLines.length ) {
                    return Promise.reject(
                      `第 ${ invalidLines.join( ", " ) } 行的地址格式错误，请输入正确的地址`
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <TextArea
              placeholder="请输入地址，每行一个。支持格式：
1. 仅地址：0x123... 或 123...
2. 备注+地址：备注内容 0x123... 或 备注内容 123...
3. 支持使用Tab或空格分隔备注和地址"
              style={{ width: "100%", height: "300px", resize: "none" }}
            />
          </Form.Item>
        </Form>
      </Modal>

      <div className={`${ type }_footer footer-btn-list`}>
        <Card size="small" style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Button
              type="primary"
              onClick={() => setIsBatchModalVisible( true )}
              size="large"
              style={{ width: "25%" }}
              icon={<UploadOutlined />}
              loading={loading.batch}
            >
              {loading.batch ? "添加中..." : "添加地址"}
            </Button>
            <Button
              type="primary"
              onClick={onRefresh}
              loading={loading.refresh}
              size="large"
              style={{ width: "25%" }}
              icon={<SyncOutlined />}
            >
              {`刷新选中地址 (${ selectedKeys.length })`}
            </Button>
            <Popconfirm
              title={`确认删除选中的 ${ selectedKeys.length } 个地址？`}
              onConfirm={onDelete}
            >
              <Button
                type="primary"
                danger
                size="large"
                style={{ width: "25%" }}
                icon={<DeleteOutlined />}
              >
                {`删除选中地址 (${ selectedKeys.length })`}
              </Button>
            </Popconfirm>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              size="large"
              style={{ width: "8%" }}
              onClick={handleExport}
            />
          </div>
        </Card>
      </div>
    </>
  );
};

export default WalletActions; 