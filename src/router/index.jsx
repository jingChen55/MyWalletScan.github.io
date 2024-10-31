import NetworkConfig from '../pages/NetworkConfig';
import WalletDetail from '../pages/WalletDetail';
import BatchTransfer from '@pages/BatchTransfer';

import React, { Suspense } from "react";

import Base from "@pages/Base/index.jsx";
import Linea from "@pages/Linea/index.jsx";
import Scroll from "@pages/Scroll/index.jsx";
import WalletManager from '@pages/WalletManager/index.jsx';
import { Navigate, useRoutes } from "react-router-dom";

const Zksync = React.lazy( () => import( "@pages/Zksync" ) );
const MainPage = React.lazy( () => import( "@layout" ) );
const Layer = React.lazy( () => import( "@pages/Layer" ) );
const ZkInfo = React.lazy( () => import( "@pages/ZkInfo" ) );
const Setting = React.lazy( () => import( "@pages/Setting" ) );

const router = [
  {
    path: "/",
    element: <MainPage />,
    children: [
      {
        path: "/zksync",
        element: <Zksync />,
      },

      // 在路由配置中添加
      {
        path: '/wallet',
        element: <WalletManager />
      },
      // 在路由配置中添加
      {
        path: '/wallet/:address',
        element: <WalletDetail />
      },
      {
        path: '/network-config',
        element: <NetworkConfig />
      },
      {
        path: '/zk_info',
        element: <ZkInfo />
      },
      {
        path: "/linea",
        element: <Linea />,
      },
      {
        path: "/Scroll",
        element: <Scroll />,
      },
      {
        path: "/Base",
        element: <Base />,
      },
      {
        path: '/Layer',
        element: <Layer />,
      },

      {
        path: "/setting",
        element: <Setting />,
      },
      {
        path: '/batch-transfer',
        element: <BatchTransfer />
      },
    ],
  },
  { path: "*", element: <Navigate to="/" /> },
];

const WrapperRouter = () => {
  let result = useRoutes( router );
  return <Suspense>{result}</Suspense>;
};

export default WrapperRouter;
