import WrapperRouter from "@routes";
import { ConfigProvider } from "antd";
import enUS from "antd/es/locale/en_US";
import zhCN from "antd/es/locale/zh_CN";
import i18n from "i18next";
import { useEffect, useState } from "react";
import { initReactI18next } from "react-i18next";
import "./App.css";
import en from "./locales/en";
import zh from "./locales/zh";
i18n.use( initReactI18next ).init( {
  resources: {
    en,
    zh,
  },
  lng: localStorage.getItem( "i18nextLng" ) || "zh",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
} );

function App() {
  const [ locale, setLocale ] = useState( i18n.language === "zh" ? zhCN : enUS );
  useEffect( () => {
    const changeLanguage = ( lng ) => {
      setLocale( lng === "zh" ? zhCN : enUS );
    };

    i18n.on( "languageChanged", changeLanguage );

    return () => {
      i18n.off( "languageChanged", changeLanguage );
    };
  }, [] );
  return (
    <ConfigProvider locale={locale}>
      <div className="App">
        <WrapperRouter />
      </div>
    </ConfigProvider>
  );
}

export default App;
