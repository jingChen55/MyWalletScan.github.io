import React from 'react';
import { Button, Popconfirm, Card } from 'antd';
import { 
  UploadOutlined, 
  SyncOutlined, 
  DeleteOutlined, 
  DownloadOutlined 
} from '@ant-design/icons';

const ActionButtons = ({
  loading,
  onAddClick,
  onRefreshClick,
  onDeleteClick,
  onExportClick,
  selectedCount
}) => {
  return (
    <div className="linea_footer">
      <Card size={"small"} style={{ width: "100%" }}>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Button
            type="primary"
            onClick={onAddClick}
            size={"large"}
            style={{ width: "25%" }}
            icon={<UploadOutlined />}
            loading={loading.batch}
          >
            {loading.batch ? "添加中..." : "添加地址"}
          </Button>
          <Button
            type="primary"
            onClick={onRefreshClick}
            loading={loading.refresh}
            size={"large"}
            style={{ width: "25%" }}
            icon={<SyncOutlined />}
          >
            {`刷新选中地址 (${selectedCount})`}
          </Button>
          <Popconfirm
            title={`确认删除选中的 ${selectedCount} 个地址？`}
            onConfirm={onDeleteClick}
          >
            <Button
              type="primary"
              danger
              size={"large"}
              style={{ width: "25%" }}
              icon={<DeleteOutlined />}
            >
              {`删除选中地址 (${selectedCount})`}
            </Button>
          </Popconfirm>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            size={"large"}
            style={{ width: "8%" }}
            onClick={onExportClick}
          />
        </div>
      </Card>
    </div>
  );
};

export default ActionButtons;
