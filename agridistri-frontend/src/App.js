// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import theme from './styles/theme';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BeneficiaryPage from './pages/BeneficiaryPage';
import DistributionPage from './pages/DistributionPage';
import StatisticsPage from './pages/StatisticsPage';
import MapsPage from './pages/MapsPage';

const SIDEBAR_WIDTH = 240;

// Composant Layout simplifié
const AppLayout = ({ children, mobileOpen, handleDrawerToggle }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header handleDrawerToggle={handleDrawerToggle} />
      <Sidebar width={SIDEBAR_WIDTH} mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          padding: { xs: 1, sm: 2, md: 3 },
          marginTop: '64px', // Pour le header fixe
          backgroundColor: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle}>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/beneficiaries"
          element={
            <ProtectedRoute>
              <AppLayout mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle}>
                <BeneficiaryPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/distribution"
          element={
            <ProtectedRoute>
              <AppLayout mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle}>
                <DistributionPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <ProtectedRoute>
              <AppLayout mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle}>
                <StatisticsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/maps"
          element={
            <ProtectedRoute>
              <AppLayout mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle}>
                <MapsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;