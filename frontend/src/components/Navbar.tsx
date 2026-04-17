import { useState } from "react";
import { Moon, Sun, Zap } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

interface NavItem {
  to: string;
  label: string;
}

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/predictions", label: "Predictions" },
  { to: "/about", label: "About Us" },
];

const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
  [
    "px-2 py-3 text-sm border-b-2 transition-all duration-200 ease-in-out",
    isActive
      ? "border-[var(--pastel-blue)] text-[var(--text-primary)] font-semibold"
      : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]",
  ].join(" ");

function Navbar(): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { theme, toggleTheme } = useTheme();
  const nextThemeLabel = theme === "light" ? "dark" : "light";

  const closeMobileMenu = (): void => {
    setIsOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border-soft)] bg-[var(--bg-card)]">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between px-3 sm:px-6 lg:px-8">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-2 text-base font-semibold tracking-tight text-[var(--text-primary)]"
          onClick={closeMobileMenu}
        >
          <Zap className="h-4 w-4 text-[var(--pastel-blue)]" aria-hidden="true" />
          <span>VoltWise</span>
        </NavLink>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            className="interactive-lift rounded-md border border-[var(--border-soft)] px-2 py-1 text-[var(--text-primary)]"
            onClick={toggleTheme}
            aria-label={`Switch to ${nextThemeLabel} mode`}
            title={`Switch to ${nextThemeLabel} mode`}
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <button
            type="button"
            className="interactive-lift rounded-md border border-[var(--border-soft)] px-3 py-1 text-sm text-[var(--text-primary)]"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            Menu
          </button>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <nav className="flex items-center gap-5">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            className="interactive-lift flex items-center gap-2 rounded-md border border-[var(--border-soft)] px-3 py-1.5 text-xs uppercase tracking-[0.08em] text-[var(--text-primary)]"
            onClick={toggleTheme}
            aria-label={`Switch to ${nextThemeLabel} mode`}
            title={`Switch to ${nextThemeLabel} mode`}
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span>{theme === "light" ? "Dark" : "Light"}</span>
          </button>
        </div>
      </div>

      {isOpen ? (
        <nav className="card mx-3 mb-3 flex flex-col rounded-lg bg-[var(--bg-card)] px-4 py-3 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={navLinkClass}
              onClick={closeMobileMenu}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

export default Navbar;
