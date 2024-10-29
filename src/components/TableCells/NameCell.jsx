import { EditOutlined, Input, Popconfirm, Tag } from 'antd';

export const NameCell = ( { text, record, data, setData } ) => {
  const displayText = text || <EditOutlined />;

  return (
    <Popconfirm
      title={
        <Input
          placeholder="请输入备注"
          defaultValue={text}
          onChange={( e ) => {
            record.name = e.target.value;
          }}
          allowClear
          bordered
        />
      }
      icon={<EditOutlined />}
      onConfirm={() => {
        setData( [ ...data ] );
        localStorage.setItem( "linea_addresses", JSON.stringify( data ) );
      }}
      okText="确定"
      cancelText="取消"
    >
      <Tag color="blue" style={{ cursor: "pointer" }}>
        {displayText}
      </Tag>
    </Popconfirm>
  );
};
