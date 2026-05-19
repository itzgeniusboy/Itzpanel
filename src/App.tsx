import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { LicenseManager } from './components/LicenseManager';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { Register } from './components/Register';

import { AdminResellers } from './components/AdminResellers';
import { Marketplace } from './components/Marketplace';
import { Landing } from './components/Landing';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-10 text-center">
          <h1 className="text-4xl font-bold mb-4">Protocol Termination</h1>
          <p className="text-zinc-500 mb-8">An unexpected exception occurred in the matrix core.</p>
          <button onClick={() => window.location.hash = '/'} className="px-6 py-3 bg-blue-600 rounded-xl font-bold">Restart Terminal</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-blue-500 shadow-[0_0_20_rgba(59,130,246,0.3)] mb-4" />
        <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse">Initializing Terminal Matrix...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Profile check - graceful loading
  if (!profile) {
    if (isAdmin) return <>{children}</>;
    
    // Explicit check for owner provisioning
    const isOwner = user.email?.toLowerCase() === 'itzraviking@gmail.com';
    if (isOwner) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-blue-500 mb-4" />
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em]">Deploying Owner Matrix...</p>
        </div>
      );
    }
    return <Navigate to="/register" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
    const { user, profile, loading } = useAuth();
    const isOwner = user?.email?.toLowerCase() === 'itzraviking@gmail.com';

    if (loading) {
        return (
          <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-4" />
            <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse">Initializing Terminal Matrix...</p>
          </div>
        );
    }

    return (
        <Routes>
            <Route path="/" element={user && (profile || isOwner) ? <Navigate to="/dashboard" replace /> : <Landing />} />
            <Route path="/home" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Dashboard />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/licenses"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <LicenseManager />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/plans"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Marketplace />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/resellers"
                element={
                    <ProtectedRoute requireAdmin>
                        <Layout>
                            <AdminResellers />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Settings />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;
