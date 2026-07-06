import { NavLink, Outlet } from "react-router-dom";

const navItem =
  "px-3 py-2 rounded-md text-sm font-medium transition-colors";

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-gray-100">
      <header className="border-b border-white/10 sticky top-0 bg-[#0b0f17]/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
          <span className="font-semibold text-lg tracking-tight">📈 MyInvest</span>
          <nav className="flex gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${navItem} ${isActive ? "bg-indigo-500/20 text-indigo-300" : "text-gray-400 hover:text-gray-200"}`
              }
            >
              대시보드
            </NavLink>
            <NavLink
              to="/strategies"
              className={({ isActive }) =>
                `${navItem} ${isActive ? "bg-indigo-500/20 text-indigo-300" : "text-gray-400 hover:text-gray-200"}`
              }
            >
              전략
            </NavLink>
            <NavLink
              to="/backtest"
              className={({ isActive }) =>
                `${navItem} ${isActive ? "bg-indigo-500/20 text-indigo-300" : "text-gray-400 hover:text-gray-200"}`
              }
            >
              백테스트
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
