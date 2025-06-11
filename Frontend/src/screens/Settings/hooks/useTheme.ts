import { useState, useEffect } from "react";

type Theme = "light" | "dark" | "system";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme") as Theme;
      if (saved && ["light", "dark", "system"].includes(saved)) {
        return saved;
      }
    }
    return "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const updateTheme = () => {
      const root = document.documentElement;

      let isDark = false;

      if (theme === "system") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        isDark = theme === "dark";
      }

      root.classList.toggle("dark", isDark);
      setResolvedTheme(isDark ? "dark" : "light");

      if (theme === "system") {
        localStorage.removeItem("theme");
      } else {
        localStorage.setItem("theme", theme);
      }
    };

    // Initial theme application
    updateTheme();

    // Listen for system theme changes when in system mode
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => updateTheme();

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  useEffect(() => {
    const applyInitialTheme = () => {
      const savedTheme = localStorage.getItem("theme") as Theme;
      const isDark =
        savedTheme === "dark" ||
        (!savedTheme &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      document.documentElement.classList.toggle("dark", isDark);
    };

    applyInitialTheme();
  }, []);

  return {
    theme,
    setTheme,
    resolvedTheme,
  };
};
