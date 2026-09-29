import { ConfigProvider, theme } from "antd";
import {
  type PropsWithChildren,
  createContext,
  useEffect,
  useState,
} from "react";

type ColorModeContextType = {
  mode: string;
  setMode: (mode: string) => void;
};

export const ColorModeContext = createContext<ColorModeContextType>(
  {} as ColorModeContextType,
);

export const ColorModeContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const colorModeFromLocalStorage = localStorage.getItem("colorMode");
  const isSystemPreferenceDark = window?.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  const systemPreference = isSystemPreferenceDark ? "dark" : "light";
  const [mode, setMode] = useState(
    colorModeFromLocalStorage || systemPreference,
  );

  useEffect(() => {
    window.localStorage.setItem("colorMode", mode);
  }, [mode]);

  const setColorMode = () => {
    if (mode === "light") {
      setMode("dark");
    } else {
      setMode("light");
    }
  };

  const { defaultAlgorithm } = theme;

  const brandTokens = {
    token: {
      // Brand primary color configuration
      colorPrimary: "#4945FF",
      colorPrimaryHover: "#6B68FF",
      colorLink: "#4945FF",
      colorLinkHover: "#6B68FF",
      // Main app background
      colorBgLayout: "#F6F6F9",
      // Default surface background (cards, tables, etc.)
      colorBgContainer: "#ffffff",
      colorBorder: "#dcd7ec",
      colorText: "#2d2544",
      borderRadius: 12,
      colorTextSecondary: "rgba(165, 165, 186, 1)",
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    components: {
      Button: {
        controlHeight: 40,
        borderRadius: 10,
        primaryShadow: "0 6px 16px rgba(111, 91, 167, 0.25)",
      },
      Input: {
        borderRadius: 10,
        controlHeight: 40,
      },
      Card: {
        borderRadiusLG: 18,
        colorBorderSecondary: "#e7e4f4",
      },
      Select: {
        controlHeight: 40,
        borderRadius: 10,
      },
      DatePicker: {
        controlHeight: 40,
        borderRadius: 10,
      },
      Layout: {
        bodyBg: "#F6F6F9",
        headerBg: "#ffffff",
        footerBg: "#ffffff",
      },
      Segmented: {
        borderRadius: 10,
      },
      Table: {
        colorBgContainer: "#ffffff",
        headerBg: "#F6F6F9",
        headerColor: "#2d2544",
        headerSplitColor: "#E5E7F2",
        borderColor: "#E5E7F2",
        rowHoverBg: "#F3F5FF",
        rowSelectedBg: "#EEF2FF",
        borderRadius: 14,
      },
    },
  } as const;

  return (
    <ColorModeContext.Provider
      value={{
        setMode: setColorMode,
        mode,
      }}>
      <ConfigProvider
        theme={{
          ...brandTokens,
          algorithm: defaultAlgorithm,
        }}>
        {children}
      </ConfigProvider>
    </ColorModeContext.Provider>
  );
};
