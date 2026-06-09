import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/plans', label: 'Plans', icon: CreditCard },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 min-h-screen bg-gray-900 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Uniflux</span>
          <span className="text-xs bg-brand-900 text-brand-300 px-1.5 py-0.5 rounded font-medium">Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="px-3 py-2 mb-1">
          <p className="text-white text-sm font-medium truncate">{user?.name}</p>
          <p className="text-gray-500 text-xs truncate">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
