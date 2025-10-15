// src/App.js
import React from 'react';
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
const AppLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header />
      <Sidebar width={SIDEBAR_WIDTH} />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          padding: 3,
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
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/beneficiaries"
          element={
            <ProtectedRoute>
              <AppLayout>
                <BeneficiaryPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/distribution"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DistributionPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <ProtectedRoute>
              <AppLayout>
                <StatisticsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/maps"
          element={
            <ProtectedRoute>
              <AppLayout>
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