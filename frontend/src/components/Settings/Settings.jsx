import { useState, useEffect, useLayoutEffect, useRef } from "react";
export default function Settings() {
  // Lazy initialization to avoid SSR localStorage errors
  const getStoredTheme = () => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  };
  const [theme, setTheme] = useState(getStoredTheme);
  const dropdownRef = useRef(null);

  // Apply theme synchronously before paint to prevent reset flash
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Persist to localStorage when theme changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        dropdownRef.current.classList.remove("dropdown-open");
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const toggleDropdown = () => {
    dropdownRef.current.classList.toggle("dropdown-open");
  };

  const themes = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-base-100 p-4 md:p-6">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
      </header>

      {/* Label and dropdown with spacing */}
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-2xl font-semibold">Appearance</h2>
        <div className="dropdown relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={toggleDropdown}
            className="btn flex items-center"
          >
            {themes.find((t) => t.value === theme)?.label || "Theme"}
            <svg
              width="12px"
              height="12px"
              className="inline-block h-2 w-2 fill-current opacity-60 ml-2"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 2048 2048"
            >
              <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z" />
            </svg>
          </button>
          <ul className="dropdown-content bg-base-300 rounded-box z-1 w-52 p-2 shadow-2xl">
            {themes.map(({ value, label }) => (
              <li key={value}>
                <label className="w-full btn btn-sm btn-block btn-ghost justify-start text-primary">
                  <input
                    type="radio"
                    name="theme-dropdown"
                    className="theme-controller mr-2"
                    value={value}
                    checked={theme === value}
                    onChange={handleThemeChange}
                    aria-label={label}
                  />
                  {label}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
