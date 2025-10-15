// src/components/beneficiary/BeneficiaryList.js
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Button,
} from '@mui/material';
import { Edit, CreditCard, Visibility } from '@mui/icons-material';
import api from '../../services/api';

const BeneficiaryList = ({ onCardProduction, onEditBeneficiary }) => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const fetchBeneficiaries = async () => {
    try {
      const response = await api.get('/beneficiaries/');
      setBeneficiaries(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
      setError('Erreur lors du chargement des bénéficiaires');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'suspended': return 'Suspendu';
      case 'inactive': return 'Inactif';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Liste des bénéficiaires ({beneficiaries.length})
      </Typography>
      
      {beneficiaries.length === 0 ? (
        <Alert severity="info">
          Aucun bénéficiaire trouvé. Ajoutez des bénéficiaires pour commencer.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nom complet</strong></TableCell>
                <TableCell><strong>Numéro de carte</strong></TableCell>
                <TableCell><strong>Village</strong></TableCell>
                <TableCell><strong>Téléphone</strong></TableCell>
                <TableCell><strong>Statut</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {beneficiaries.map((beneficiary) => (
                <TableRow 
                  key={beneficiary.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {beneficiary.first_name} {beneficiary.last_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={beneficiary.card_number} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {beneficiary.village_name || 'Non spécifié'}
                  </TableCell>
                  <TableCell>
                    {beneficiary.phone || (
                      <Typography variant="body2" color="textSecondary">
                        Non renseigné
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(beneficiary.status)} 
                      size="small"
                      color={getStatusColor(beneficiary.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => onEditBeneficiary(beneficiary)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => onCardProduction(beneficiary)}
                        color="secondary"
                      >
                        <CreditCard />
                      </IconButton>
                      <Button 
                        size="small" 
                        variant="outlined"
                        startIcon={<Visibility />}
                      >
                        Voir
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default BeneficiaryList;