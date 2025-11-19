
import React from 'react';
import { LayoutDashboard, Archive, Settings, LogOut, Box, Info, Trash2 } from 'lucide-react';
import { ViewState, User } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isMobileOpen: boolean;
  toggleMobile: () => void;
  user: User;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isMobileOpen, toggleMobile, user, onLogout }) => {
  const navItems: { id: ViewState; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'storage', label: 'Storage', icon: Archive },
    { id: 'trash', label: 'Recently Deleted', icon: Trash2 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-72 
        glass-panel border-r border-white/10
        transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static
        flex flex-col
      `}>
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12 px-2 pt-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <Box className="text-slate-900 w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">
              ReturnOS
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-3">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onChangeView(item.id);
                    if (window.innerWidth < 1024) toggleMobile();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-5 py-4 rounded-full transition-all duration-300 group relative overflow-hidden
                    ${isActive 
                      ? 'text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] bg-white/10 border border-white/10' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}
                  `}
                >
                  <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-gray-500 group-hover:text-gray-300'}`} />
                  <span className="font-medium tracking-wide relative z-10">{item.label}</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User / Bottom Action */}
          <div className="mt-auto pt-6 border-t border-white/10">
            <div className="glass-button rounded-full p-1.5">
              <div className="w-full flex items-center gap-3 px-3 py-2 rounded-full hover:bg-white/5 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold border border-white/10 shadow-inner">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <button 
                  onClick={onLogout}
                  title="Logout"
                  className="p-1.5 rounded-full hover:bg-red-500/20 hover:text-red-300 text-gray-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
