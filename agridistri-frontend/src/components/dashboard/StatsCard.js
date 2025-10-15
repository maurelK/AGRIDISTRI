// src/components/dashboard/StatsCard.js
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const StatsCard = ({ title, value, icon, color }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              color: color,
              backgroundColor: `${color}20`,
              borderRadius: '50%',
              p: 1,
            }}
          >
            {React.cloneElement(icon, { fontSize: 'large' })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;