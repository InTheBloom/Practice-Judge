import { useState, useEffect, createContext, useContext } from 'react';

export const ThemeContext = createContext(undefined);

export function useColorMode () {
    return useContext(ThemeContext);
}

export function ColorModeProvider ({ children }) {
    // 状態は undefined | light | dark
    // を取るようにして、useEffectでlocalStorageにある値をセット
    // この際、もしlocalStorageに値が無ければlightに設定
    // 各コンポーネントではundefinedの間はモード切替をどちらにもセットしない。

    const [colorMode, _setColorMode] = useState(undefined);

    const setColorMode = (mode) => {
        _setColorMode(mode);
        window.localStorage.setItem("colormode", mode);
    };

    useEffect(() => {
        const storageVal = window.localStorage.getItem("colormode");
        if (storageVal == "light" || storageVal == "dark") {
            _setColorMode(storageVal);
        }
        else {
            setColorMode("light");
        }
    }, []);

    return (
        <ThemeContext value={{ colorMode, setColorMode }}>
            {children}
        </ThemeContext>
    );
}
