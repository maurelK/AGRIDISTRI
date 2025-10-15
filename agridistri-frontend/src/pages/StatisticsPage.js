// src/pages/StatisticsPage.js
import React from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
} from '@mui/material';
import DistributionStats from '../components/distribution/DistributionStats';

const StatisticsPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Statistiques et rapports
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <DistributionStats />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StatisticsPage;