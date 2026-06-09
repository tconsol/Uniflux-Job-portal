import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useBilling';

const PLAN_COLORS: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-700',
  standard: 'bg-blue-100 text-blue-700',
  premium: 'bg-purple-100 text-purple-700',
  elite: 'bg-amber-100 text-amber-700',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { data: subData } = useSubscription();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const planSlug = subData?.subscription?.planSlug ?? 'basic';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Uniflux</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/jobs" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Jobs
            </Link>
            <Link to="/plans" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Pricing
            </Link>
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.name.split(' ')[0]}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PLAN_COLORS[planSlug]}`}>
                    {planSlug}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-10">
                    <Link
                      to="/profile"
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <Link
                      to="/plans"
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Briefcase className="w-4 h-4" /> Upgrade Plan
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-2">
          <Link to="/jobs" onClick={() => setOpen(false)} className="block py-2 text-gray-700 font-medium">Jobs</Link>
          <Link to="/plans" onClick={() => setOpen(false)} className="block py-2 text-gray-700 font-medium">Pricing</Link>
          {user ? (
            <>
              <Link to="/profile" onClick={() => setOpen(false)} className="block py-2 text-gray-700">Profile</Link>
              <button onClick={handleLogout} className="block py-2 text-red-600 w-full text-left">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block py-2 text-gray-700">Sign In</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="block py-2 text-brand-600 font-medium">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
