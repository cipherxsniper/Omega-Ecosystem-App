import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppLayout from '@/components/omega/AppLayout';
import Dashboard from '@/pages/Dashboard';
import WalletPage from '@/pages/WalletPage';
import GalleryPage from '@/pages/GalleryPage';
import ExplorerPage from '@/pages/ExplorerPage';
import TradingPage from '@/pages/TradingPage';
import LanternRPG from '@/pages/LanternRPG';
import ProvenancePage from '@/pages/ProvenancePage';
import BrainPage from '@/pages/BrainPage';
import B2BPage from '@/pages/B2BPage';
import CodeExportPage from '@/pages/CodeExportPage';
import GitHubPage from '@/pages/GitHubPage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center cosmic-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground mt-4 font-heading tracking-widest">OMEGA</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/explorer" element={<ExplorerPage />} />
          <Route path="/trading" element={<TradingPage />} />
          <Route path="/lantern" element={<LanternRPG />} />
          <Route path="/provenance" element={<ProvenancePage />} />
          <Route path="/brain" element={<BrainPage />} />
          <Route path="/b2b" element={<B2BPage />} />
          <Route path="/code-export" element={<CodeExportPage />} />
          <Route path="/github" element={<GitHubPage />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App