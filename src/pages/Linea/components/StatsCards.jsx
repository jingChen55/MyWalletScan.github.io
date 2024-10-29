import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';

const StatsCards = ({ totalPoints, stats }) => {
  return (
    <Row gutter={16} className="stats-cards">
      <Col span={6}>
        <Card>
          <Statistic
            title="总地址数"
            value={stats.totalAddresses}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="总积分"
            value={stats.totalPoints}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="平均积分"
            value={stats.averagePoints}
            precision={2}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="活跃地址"
            value={stats.activeAddresses}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default StatsCards;
