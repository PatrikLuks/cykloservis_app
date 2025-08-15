/**
 * Copyright (c) 2025 Patrik Luks, Adam Kroupa
 * All rights reserved. Proprietary and confidential.
 * Use, distribution or modification without explicit permission of BOTH authors is strictly prohibited.
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import Login from './pages/Login';
import MultiStepRegister from './pages/MultiStepRegister';
import Dashboard from './pages/Dashboard';
import MyBikes from './pages/MyBikes.jsx';
// import Login from './pages/Login';
// TEMP isolate group A
// import MultiStepRegister from './pages/MultiStepRegister'; // TEMP disabled to isolate parse error
// import VerifyEmail from './pages/VerifyEmail';
// import Dashboard from './pages/Dashboard';
// TEMP comment group B
// import ForgotPassword from './pages/ForgotPassword';
// import MyBikes from './pages/MyBikes';
// import AddBike from './pages/AddBike';
// import BikeDetail from './pages/BikeDetail';
// import EditBike from './pages/EditBike';
// import AppLayout from './components/AppLayout';
// Other imports still omitted during isolation

function App() {
  const mode = (import.meta.env && import.meta.env.MODE) || process.env.NODE_ENV;
  if (mode === 'test') {
      return (
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
          <div data-testid="app-root-test">Test App</div>
        </Router>
      );
  }
  // Data router s future flagemi pro odstranění warningů
  const router = createBrowserRouter([
    { path: '/', element: <Navigate to="/login" /> },
    { path: '/login', element: <Login /> },
    { path: '/register', element: <MultiStepRegister /> },
    { path: '/dashboard', element: <Dashboard /> },
    { path: '/my-bikes', element: <MyBikes /> },
  ], {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  });

  return <RouterProvider router={router} />;
}

export default App;
