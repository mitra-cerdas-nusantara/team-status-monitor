import { Link, Outlet, useLocation } from "react-router-dom";
import { Users, LayoutDashboard, BarChart3, Lock, Key } from "lucide-react";
import { cn } from "../lib/utils";
import { useSettings } from "../context/SettingsContext";

export default function Layout() {
  const location = useLocation();
  const { settings, isSuperAdmin, lockSuperAdmin } = useSettings();

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Reports", path: "/reports", icon: BarChart3 },
    { name: "Settings", path: "/settings", icon: Users },
  ];

  const logoMark = settings.app_logo ? (
    <img 
      src={settings.app_logo} 
      alt={settings.app_name} 
      className="w-8 h-8 rounded-lg object-contain shadow-sm shrink-0" 
    />
  ) : (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0 select-none">
      {settings.app_name.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-3.5 bg-white border-b sticky top-0 z-20 shadow-sm">
        <Link to="/" className="flex items-center gap-2.5">
          {logoMark}
          <span className="font-bold text-lg text-gray-900 tracking-tight truncate max-w-[150px]">
            {settings.app_name}
          </span>
        </Link>
        
        {/* Dynamic Superadmin Role Switcher Badge */}
        {isSuperAdmin ? (
          <button
            onClick={lockSuperAdmin}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors shadow-sm cursor-pointer select-none"
            title="Lock Privileges (Return to Member)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            Admin
          </button>
        ) : (
          <Link
            to="/settings"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 border border-gray-200/50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm cursor-pointer select-none"
            title="Elevate Privileges"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
            Member
          </Link>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r sticky top-0 h-screen shrink-0 z-10">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3">
            {logoMark}
            <span className="font-bold text-xl text-gray-900 tracking-tight truncate max-w-[160px]">
              {settings.app_name}
            </span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const isLockedSetting = item.name === "Settings" && !isSuperAdmin;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600 transition-colors"} />
                  <span>{item.name}</span>
                </div>
                {isLockedSetting && (
                  <Lock 
                    size={12} 
                    className="text-amber-600 bg-amber-50 border border-amber-200/50 rounded p-0.5 w-4.5 h-4.5 shrink-0 shadow-sm" 
                    title="Superadmin passcode required" 
                  />
                )}
              </Link>
            )
          })}
        </nav>
        
        {/* Privilege Control Center Card */}
        <div className="mt-auto p-4 border-t border-gray-150 bg-gray-50/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full shadow-sm shrink-0",
                isSuperAdmin ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
              )} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 select-none">
                {isSuperAdmin ? "Superadmin Mode" : "Member View"}
              </span>
            </div>
            {isSuperAdmin ? (
              <button 
                onClick={lockSuperAdmin}
                className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                title="Lock Settings (Return to Member)"
              >
                <Lock size={14} />
              </button>
            ) : (
              <Link 
                to="/settings"
                className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-all border border-transparent hover:border-indigo-100 cursor-pointer"
                title="Elevate Privileges"
              >
                <Key size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-150 px-4 py-2.5 flex items-center justify-around z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const isLockedSetting = item.name === "Settings" && !isSuperAdmin;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-xs font-semibold transition-all relative shrink-0",
                isActive ? "text-indigo-600 animate-pulse" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <div className="relative">
                <Icon size={20} className={isActive ? "text-indigo-600" : "text-gray-400"} />
                {isLockedSetting && (
                  <Lock 
                    size={8} 
                    className="absolute -top-1 -right-1.5 text-amber-600 bg-amber-50 border border-amber-200/50 rounded-full p-0.5 w-3 h-3 shrink-0 shadow-sm" 
                  />
                )}
              </div>
              <span className="text-[10px] tracking-wider font-bold mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
