// src/components/dashboard/RecentDistributions.js
import React, { useState, useEffect } from 'react';
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Inventory } from '@mui/icons-material';
import api from '../../services/api';

const RecentDistributions = () => {
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecentDistributions = async () => {
      try {
        const response = await api.get('/distributions/?limit=5');
        const data = response.data.results || response.data || [];
        setDistributions(data);
      } catch (error) {
        console.error('Error fetching recent distributions:', error);
        setError('Erreur lors du chargement des distributions');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentDistributions();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Distributions récentes
      </Typography>
      
      {distributions.length === 0 ? (
        <Alert severity="info">
          Aucune distribution récente
        </Alert>
      ) : (
        <List>
          {distributions.map((distribution) => (
            <ListItem key={distribution.id} divider>
              <ListItemIcon>
                <Inventory color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={distribution.beneficiary_name || distribution.beneficiary?.full_name || 'Bénéficiaire inconnu'}
                secondary={
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">
                      {new Date(distribution.distribution_date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      {distribution.site_name || distribution.site?.name || 'Site inconnu'}
                    </Typography>
                  </Box>
                }
              />
              <Chip 
                label={distribution.status} 
                size="small"
                color={
                  distribution.status === 'completed' ? 'success' : 
                  distribution.status === 'pending' ? 'warning' : 'default'
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default RecentDistributions;