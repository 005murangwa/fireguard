import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';

import AuthSessionHandler from './components/AuthSessionHandler';

import ProtectedRoute from './components/ProtectedRoute';

import RoleRoute from './components/RoleRoute';

import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';

import SignupPage from './pages/SignupPage';

import OtpPage from './pages/OtpPage';

import DashboardPage from './pages/DashboardPage';

import ExtinguishersPage from './pages/ExtinguishersPage';

import InspectionsPage from './pages/InspectionsPage';

import MaintenancePage from './pages/MaintenancePage';

import NotificationsPage from './pages/NotificationsPage';

import ReportsPage from './pages/ReportsPage';

import UsersPage from './pages/UsersPage';



export default function App() {

  return (

    <AuthProvider>

      <AuthSessionHandler />

      <Routes>

        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/signup" element={<SignupPage />} />

        <Route path="/verify-otp" element={<OtpPage />} />



        <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />

        <Route path="/extinguishers" element={<ProtectedRoute><Layout><ExtinguishersPage /></Layout></ProtectedRoute>} />

        <Route path="/inspections" element={<ProtectedRoute><Layout><InspectionsPage /></Layout></ProtectedRoute>} />

        <Route path="/maintenance" element={<ProtectedRoute><Layout><MaintenancePage /></Layout></ProtectedRoute>} />

        <Route path="/notifications" element={<ProtectedRoute><Layout><NotificationsPage /></Layout></ProtectedRoute>} />

        <Route path="/reports" element={<ProtectedRoute><Layout><RoleRoute roles={['ADMIN']}><ReportsPage /></RoleRoute></Layout></ProtectedRoute>} />

        <Route path="/users" element={<ProtectedRoute><Layout><RoleRoute roles={['ADMIN']}><UsersPage /></RoleRoute></Layout></ProtectedRoute>} />



        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>

    </AuthProvider>

  );

}


