import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Plans from './pages/Plans';
import Settings from './pages/Settings';

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout><Dashboard /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <AdminLayout><Users /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:id"
        element={
          <ProtectedRoute>
            <AdminLayout><UserDetail /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/plans"
        element={
          <ProtectedRoute>
            <AdminLayout><Plans /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AdminLayout><Settings /></AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <div className="flex items-center justify-center h-full min-h-screen">
                <div className="text-center">
                  <h1 className="text-5xl font-bold text-gray-200 mb-3">404</h1>
                  <p className="text-gray-500">Page not found</p>
                </div>
              </div>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
