
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MultiStepRegister from './pages/MultiStepRegister';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import MyBikes from './pages/MyBikes';
import AddBike from './pages/AddBike';
import BikeDetail from './pages/BikeDetail';
import EditBike from './pages/EditBike';
import AppLayout from './components/AppLayout';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import NewOrder from './pages/NewOrder';
// Mechanic module (new consolidated folder)
import MechanicLayout from './mechanic/components/MechanicLayout';
import MechanicDashboard from './mechanic/pages/MechanicDashboard';
import MechanicPanel from './mechanic/pages/MechanicPanel';
import MechanicRequests from './mechanic/pages/MechanicRequests';
import MechanicRequestDetail from './mechanic/pages/MechanicRequestDetail';
import MechanicClients from './mechanic/pages/MechanicClients';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Navigate to="/register" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<MultiStepRegister />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-bikes" element={<MyBikes />} />
          <Route path="/add-bike" element={<AddBike />} />
          <Route path="/bikes/:id" element={<BikeDetail />} />
          <Route path="/bikes/:id/edit" element={<EditBike />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/new" element={<NewOrder />} />
        </Route>
        {/* Separate mechanic environment */}
        <Route element={<MechanicLayout />}>
          <Route path="/mechanic/dashboard" element={<MechanicDashboard />} />
          <Route path="/mechanic/profile" element={<MechanicPanel />} />
          <Route path="/mechanic/requests" element={<MechanicRequests />} />
          <Route path="/mechanic/requests/:id" element={<MechanicRequestDetail />} />
          <Route path="/mechanic/clients" element={<MechanicClients />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
