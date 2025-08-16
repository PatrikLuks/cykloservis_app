
import React, { Suspense, lazy } from 'react';
import Loader from './components/Loader';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Eager (critical path) screens
import Login from './pages/Login';
import Landing from './pages/Landing';
import MultiStepRegister from './pages/MultiStepRegister';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import MyBikes from './pages/MyBikes';
import AppLayout from './components/AppLayout';

// Lazy loaded (less frequent) screens
const AddBike = lazy(()=> import('./pages/AddBike'));
const BikeDetail = lazy(()=> import('./pages/BikeDetail'));
const EditBike = lazy(()=> import('./pages/EditBike'));
const Profile = lazy(()=> import('./pages/Profile'));
const Orders = lazy(()=> import('./pages/Orders'));
const NewOrder = lazy(()=> import('./pages/NewOrder'));

// Mechanic module (lazy group)
const MechanicLayout = lazy(()=> import('./mechanic/components/MechanicLayout'));
const MechanicDashboard = lazy(()=> import('./mechanic/pages/MechanicDashboard'));
const MechanicPanel = lazy(()=> import('./mechanic/pages/MechanicPanel'));
const MechanicRequests = lazy(()=> import('./mechanic/pages/MechanicRequests'));
const MechanicRequestDetail = lazy(()=> import('./mechanic/pages/MechanicRequestDetail'));
const MechanicClients = lazy(()=> import('./mechanic/pages/MechanicClients'));

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  <Suspense fallback={<Loader message="Načítám modul…" />}> 
      <Routes>
  <Route path="/" element={<Landing />} />
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
      </Suspense>
    </Router>
  );
}

export default App;
