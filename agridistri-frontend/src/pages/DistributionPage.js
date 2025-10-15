// src/pages/DistributionPage.js
import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { Add, History } from '@mui/icons-material';
import DistributionForm from '../components/distribution/DistributionForm';
import DistributionHistory from '../components/distribution/DistributionHistory';

const DistributionPage = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Distribution d'intrants
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            icon={<Add />} 
            label="Nouvelle distribution" 
          />
          <Tab 
            icon={<History />} 
            label="Historique" 
          />
        </Tabs>
      </Paper>

      {activeTab === 0 && <DistributionForm />}
      {activeTab === 1 && <DistributionHistory />}
    </Box>
  );
};

export default DistributionPage;