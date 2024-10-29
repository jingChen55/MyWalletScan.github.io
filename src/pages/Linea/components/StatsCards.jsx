import { Card, Col, Row, Statistic } from 'antd';
import CountUp from 'react-countup';

import React from 'react';
const formatter = ( value ) => <CountUp end={value} separator="," />;

const StatsCards = ( { lineaTotalPoints, stats } ) => {
  console.log( lineaTotalPoints );

  return (
    <Row gutter={16} className="stats-cards">
      <Col span={8}>
        <Card>
          <Statistic
            title="总积分"
            value={lineaTotalPoints.total_xp}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic
            title="平均积分"
            value={lineaTotalPoints.average_total_xp}
            formatter={formatter}
            precision={2}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic
            title="活跃地址"
            value={lineaTotalPoints.user}
            formatter={formatter}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default StatsCards;
