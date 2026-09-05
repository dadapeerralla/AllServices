import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import EntryPage from './pages/EntryPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ServiceProviders from './pages/ServiceProviders';
import ProviderDetail from './pages/ProviderDetail';
import BookingForm from './pages/BookingForm';
import ConsumerDashboard from './pages/ConsumerDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<EntryPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/service/:serviceKey" element={<ServiceProviders />} />
          <Route path="/service/:serviceKey/provider/:id" element={<ProviderDetail />} />
          <Route
            path="/service/:serviceKey/book/:providerId"
            element={
              <ProtectedRoute userType="consumer">
                <BookingForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute userType="consumer">
                <ConsumerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute userType="provider">
                <ProviderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
