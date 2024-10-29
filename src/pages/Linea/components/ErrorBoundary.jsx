import React from 'react';
import { Result, Button } from 'antd';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="页面出错了"
          subTitle={this.state.error?.message || "未知错误"}
          extra={[
            <Button 
              type="primary" 
              key="refresh"
              onClick={() => window.location.reload()}
            >
              刷新页面
            </Button>
          ]}
        />
      );
    }

    return this.props.children;
  }
}
