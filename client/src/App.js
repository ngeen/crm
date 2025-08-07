import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import CustomerForm from './components/CustomerForm';
import CarRepairList from './components/CarRepairList';
import CarRepairForm from './components/CarRepairForm';
import DealList from './components/DealList';
import Reports from './components/Reports';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-content-center align-items-center min-h-screen">
      <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
    </div>;
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Main App Component
const AppContent = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/customers" element={
          <ProtectedRoute>
            <Layout>
              <CustomerList />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/customers/new" element={
          <ProtectedRoute>
            <Layout>
              <CustomerForm />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/customers/edit/:id" element={
          <ProtectedRoute>
            <Layout>
              <CustomerForm />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/car-repairs" element={
          <ProtectedRoute>
            <Layout>
              <CarRepairList />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/car-repairs/new" element={
          <ProtectedRoute>
            <Layout>
              <CarRepairForm />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/car-repairs/edit/:id" element={
          <ProtectedRoute>
            <Layout>
              <CarRepairForm />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/deals" element={
          <ProtectedRoute>
            <Layout>
              <DealList />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/reports" element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

// Root App Component with Auth Provider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App; 