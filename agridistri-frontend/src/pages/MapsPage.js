// src/pages/MapsPage.js
import React from 'react';
import {
  Typography,
  Box,
  Paper,
} from '@mui/material';
import GeoPortal from '../components/maps/GeoPortal';

const MapsPage = () => {
  return (
    <Box sx={{ p: 3, height: '80vh' }}>
      <Typography variant="h4" gutterBottom>
        Géoportail
      </Typography>
      
      <Paper sx={{ height: '100%', p: 2 }}>
        <GeoPortal />
      </Paper>
    </Box>
  );
};

export default MapsPage;