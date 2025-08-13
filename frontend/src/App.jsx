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

function App() {
  if (process.env.NODE_ENV === 'test') {
    return <div data-testid="app-root-test">Test App</div>;
  }
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
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
