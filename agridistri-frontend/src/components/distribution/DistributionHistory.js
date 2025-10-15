// src/components/distribution/DistributionHistory.js
import React from 'react';
import {
  Typography,
  Paper,
} from '@mui/material';

const DistributionHistory = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Historique des distributions
      </Typography>
      <Typography color="textSecondary">
        Interface d'historique à implémenter
      </Typography>
    </Paper>
  );
};

export default DistributionHistory;