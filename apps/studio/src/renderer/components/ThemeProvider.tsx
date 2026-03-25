import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Theme } from "../../shared/models/AppSettings";
import type { AppContext } from "../models/Context";
import { useSetAppSettings } from "../utils/appSettings";

interface ThemeContextValue {
	theme: Theme;
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const applyThemeToDocument = (theme: Theme, systemPrefersLight: boolean) => {
	const isLight = theme === "light" || (theme === "system" && systemPrefersLight);

	if (isLight) {
		document.documentElement.classList.add("theme-light");
	} else {
		document.documentElement.classList.remove("theme-light");
	}
};

interface ThemeProviderProps {
	children: React.ReactNode;
	context: AppContext;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, context }) => {
	const { appSettings, main } = context;

	const setAppSettings = useSetAppSettings(main);

	const [systemPrefersLight, setSystemPrefersLight] = useState(() => window.matchMedia("(prefers-color-scheme: light)").matches);

	useEffect(() => {
		const media = window.matchMedia("(prefers-color-scheme: light)");

		const handleChange = (event: MediaQueryListEvent) => {
			setSystemPrefersLight(event.matches);
		};

		media.addEventListener("change", handleChange);

		return () => media.removeEventListener("change", handleChange);
	}, []);

	useEffect(() => {
		applyThemeToDocument(appSettings.theme, systemPrefersLight);
	}, [appSettings.theme, systemPrefersLight]);

	const setTheme = useCallback(
		(newTheme: Theme) => {
			setAppSettings.mutate({ theme: newTheme });
		},
		[setAppSettings],
	);

	const value = useMemo(() => ({ theme: appSettings.theme, setTheme }), [appSettings.theme, setTheme]);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
	const context = useContext(ThemeContext);

	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}

	return context;
};
