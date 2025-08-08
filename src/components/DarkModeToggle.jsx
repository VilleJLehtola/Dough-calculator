// src/components/DarkModeToggle.jsx
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(() =>
    localStorage.theme === "dark" ||
    (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      html.classList.remove("dark");
      localStorage.theme = "light";
    }
  }, [isDark]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setIsDark(!isDark)}
            className="toggle-switch"
            aria-label="Toggle dark mode"
          >
            <input
              type="checkbox"
              checked={isDark}
              onChange={() => setIsDark(!isDark)}
              className="sr-only"
            />
            <span className="toggle-slider"></span>
            <span className="ml-2">{isDark ? <Moon size={16} /> : <Sun size={16} />}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isDark ? "Vaihda vaaleaan tilaan" : "Vaihda tummaan tilaan"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DarkModeToggle;
