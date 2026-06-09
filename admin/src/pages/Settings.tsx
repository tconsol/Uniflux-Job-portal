import { useAuth } from '../context/AuthContext';
import { Shield, User } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" /> Admin Account
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Name</span>
            <span className="text-gray-900 font-medium">{user?.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900 font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-500">Role</span>
            <span className="text-brand-600 font-semibold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Super Admin
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Service Info</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>Admin panel manages users, subscriptions, and plan pricing for Uniflux.</p>
          <p className="text-gray-400 text-xs">API: proxied to <code className="bg-gray-100 px-1 rounded">localhost:5000</code></p>
        </div>
      </div>
    </div>
  );
}
