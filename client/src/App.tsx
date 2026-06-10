import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Applications from './pages/Applications';
import Plans from './pages/Plans';
import Profile from './pages/Profile';
import OAuthCallback from './pages/OAuthCallback';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ScrollToTop from './components/ScrollToTop';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      {/* Public */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/plans" element={<Layout><Plans /></Layout>} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected */}
      <Route path="/jobs" element={<Layout><ProtectedRoute><Jobs /></ProtectedRoute></Layout>} />
      <Route path="/jobs/:id" element={<Layout><ProtectedRoute><JobDetail /></ProtectedRoute></Layout>} />
      <Route path="/profile" element={<Layout><ProtectedRoute><Profile /></ProtectedRoute></Layout>} />
      <Route path="/applications" element={<Layout><ProtectedRoute><Applications /></ProtectedRoute></Layout>} />

      {/* 404 */}
      <Route path="*" element={
        <Layout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
              <p className="text-gray-500">Page not found</p>
            </div>
          </div>
        </Layout>
      } />
    </Routes>
    </>
  );
}
