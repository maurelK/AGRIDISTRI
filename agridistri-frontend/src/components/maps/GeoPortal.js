// src/components/maps/GeoPortal.js
import React from 'react';
import {
  Typography,
  Box,
} from '@mui/material';

const GeoPortal = () => {
  return (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h6" color="textSecondary">
        Carte interactive à implémenter avec Leaflet
      </Typography>
    </Box>
  );
};

export default GeoPortal;