// src/components/common/DebugPage.js
import React from 'react';
import { Typography, Box, Paper } from '@mui/material';

const DebugPage = ({ pageName }) => {
  return (
    <Paper sx={{ p: 4, m: 2, backgroundColor: 'white' }}>
      <Typography variant="h4" gutterBottom color="primary">
        {pageName} - Page de Test
      </Typography>
      <Typography variant="body1" paragraph>
        Cette page fonctionne correctement. Si vous voyez ce message, le routage et le layout fonctionnent.
      </Typography>
      <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 1 }}>
        <Typography variant="body2">
          Informations de débogage :
        </Typography>
        <Typography variant="body2">
          - Page: {pageName}
        </Typography>
        <Typography variant="body2">
          - Timestamp: {new Date().toLocaleString()}
        </Typography>
      </Box>
    </Paper>
  );
};

export default DebugPage;