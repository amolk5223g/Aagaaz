import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { AdminLayout } from './components/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { StudentImportPage } from './pages/StudentImportPage';
import { StudentListPage } from './pages/StudentListPage';
import { CouponListPage } from './pages/CouponListPage';
import { VolunteerManagementPage } from './pages/VolunteerManagementPage';
import { QrScannerPage } from './pages/QrScannerPage';
import { api } from './services/api';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const user = api.getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/scanner" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              api.getCurrentUser()?.role === 'ADMIN' ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/scanner" replace />
              )
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute adminOnly>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="import"
            element={
              <ProtectedRoute adminOnly>
                <StudentImportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="students"
            element={
              <ProtectedRoute adminOnly>
                <StudentListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="coupons"
            element={
              <ProtectedRoute adminOnly>
                <CouponListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="volunteers"
            element={
              <ProtectedRoute adminOnly>
                <VolunteerManagementPage />
              </ProtectedRoute>
            }
          />
          <Route path="scanner" element={<QrScannerPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
