import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return <Navigate to="/register" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
    const { user, profile } = useAuth();

    return (
        <Routes>
            <Route path="/" element={user && profile ? <Navigate to="/dashboard" replace /> : <Landing />} />
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
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
