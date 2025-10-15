// src/components/distribution/DistributionForm.js
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  IconButton,
} from '@mui/material';
import { QrCodeScanner, Save, Add, Delete } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const DistributionForm = () => {
  const { user } = useAuth();
  const [beneficiary, setBeneficiary] = useState(null);
  const [distributionItems, setDistributionItems] = useState([]);
  const [availableInputs, setAvailableInputs] = useState([]);
  const [sites, setSites] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    site: '',
    campaign: '',
    payment_method: 'free',
    notes: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [inputsResponse, sitesResponse, campaignsResponse] = await Promise.all([
        api.get('/agricultural-inputs/?is_active=true'),
        api.get('/sites/?is_active=true'),
        api.get('/campaigns/?status=active'),
      ]);

      setAvailableInputs(inputsResponse.data.results || inputsResponse.data);
      setSites(sitesResponse.data.results || sitesResponse.data);
      setCampaigns(campaignsResponse.data.results || campaignsResponse.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Erreur lors du chargement des données');
    }
  };

  const handleScanBeneficiary = async (cardNumber) => {
    try {
      setError('');
      const response = await api.post('/beneficiaries/search_by_card/', {
        card_number: cardNumber
      });
      setBeneficiary(response.data);
    } catch (error) {
      setError('Bénéficiaire non trouvé. Vérifiez le numéro de carte.');
      setBeneficiary(null);
    }
  };

  const addDistributionItem = () => {
    setDistributionItems([
      ...distributionItems,
      {
        id: Date.now(),
        agricultural_input: '',
        allocated_quantity: '',
        distributed_quantity: '',
        unit_price: 0,
      }
    ]);
  };

  const removeDistributionItem = (id) => {
    setDistributionItems(distributionItems.filter(item => item.id !== id));
  };

  const updateDistributionItem = (id, field, value) => {
    setDistributionItems(distributionItems.map(item => {
      if (item.id === id) {
        // Si on change l'intrant, mettre à jour le prix unitaire
        if (field === 'agricultural_input') {
          const selectedInput = availableInputs.find(input => input.id === value);
          return {
            ...item,
            [field]: value,
            unit_price: selectedInput ? selectedInput.subsidized_price : 0
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return distributionItems.reduce((total, item) => {
      const quantity = parseFloat(item.distributed_quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      return total + (quantity * price);
    }, 0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!beneficiary) {
      setError('Veuillez sélectionner un bénéficiaire');
      return;
    }

    if (distributionItems.length === 0) {
      setError('Veuillez ajouter au moins un intrant à distribuer');
      return;
    }

    setLoading(true);

    try {
      const distributionData = {
        beneficiary: beneficiary.id,
        agent: user.id,
        site: formData.site,
        campaign: formData.campaign,
        payment_method: formData.payment_method,
        total_amount: calculateTotal(),
        amount_paid: formData.payment_method === 'free' ? 0 : calculateTotal(),
        notes: formData.notes,
        items: distributionItems.map(item => ({
          agricultural_input: item.agricultural_input,
          allocated_quantity: parseFloat(item.allocated_quantity),
          distributed_quantity: parseFloat(item.distributed_quantity),
          unit_price: parseFloat(item.unit_price),
        }))
      };

      await api.post('/distributions/', distributionData);
      
      setSuccess('Distribution enregistrée avec succès !');
      resetForm();
      
      // Simuler une synchronisation
      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (error) {
      console.error('Error creating distribution:', error);
      setError('Erreur lors de l\'enregistrement de la distribution');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBeneficiary(null);
    setDistributionItems([]);
    setFormData({
      site: '',
      campaign: '',
      payment_method: 'free',
      notes: '',
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Nouvelle distribution
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Section Bénéficiaire */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  1. Sélection du bénéficiaire
                </Typography>
                
                {!beneficiary ? (
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                      label="Rechercher par numéro de carte"
                      placeholder="Scanner ou saisir le numéro de carte"
                      fullWidth
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleScanBeneficiary(e.target.value);
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<QrCodeScanner />}
                      size="large"
                      onClick={() => document.getElementById('scan-trigger').click()}
                    >
                      Scanner
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">
                        {beneficiary.first_name} {beneficiary.last_name}
                      </Typography>
                      <Typography color="textSecondary">
                        Carte: {beneficiary.card_number} | Village: {beneficiary.village_name}
                      </Typography>
                    </Box>
                    <Button onClick={() => setBeneficiary(null)}>
                      Changer
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Section Configuration - Cases agrandies */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  2. Configuration de la distribution
                </Typography>
                <Grid container spacing={3}>
                  {/* Site de distribution - Case agrandie */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="medium">
                      <InputLabel 
                        sx={{ 
                          fontSize: '1rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Site de distribution
                      </InputLabel>
                      <Select
                        value={formData.site}
                        label="Site de distribution"
                        onChange={(e) => setFormData({...formData, site: e.target.value})}
                        required
                        sx={{
                          minHeight: '56px',
                          '& .MuiSelect-select': {
                            padding: '12px 130px',
                            fontSize: '1rem'
                          }
                        }}
                      >
                        {sites.map(site => (
                          <MenuItem 
                            key={site.id} 
                            value={site.id}
                            sx={{ fontSize: '1rem' }}
                          >
                            {site.name} - {site.village_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Campagne - Case agrandie */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="medium">
                      <InputLabel 
                        sx={{ 
                          fontSize: '1rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Campagne
                      </InputLabel>
                      <Select
                        value={formData.campaign}
                        label="Campagne"
                        onChange={(e) => setFormData({...formData, campaign: e.target.value})}
                        required
                        sx={{
                          minHeight: '56px',
                          '& .MuiSelect-select': {
                            padding: '12px 130px',
                            fontSize: '1rem'
                          }
                        }}
                      >
                        {campaigns.map(campaign => (
                          <MenuItem 
                            key={campaign.id} 
                            value={campaign.id}
                            sx={{ fontSize: '1rem' }}
                          >
                            {campaign.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Section Intrants */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="primary">
                    3. Intrants à distribuer
                  </Typography>
                  <Button
                    startIcon={<Add />}
                    onClick={addDistributionItem}
                    disabled={!beneficiary}
                  >
                    Ajouter un intrant
                  </Button>
                </Box>

                {distributionItems.map((item, index) => (
                  <Box key={item.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Intrant</InputLabel>
                          <Select
                            value={item.agricultural_input}
                            label="Intrant"
                            onChange={(e) => updateDistributionItem(item.id, 'agricultural_input', e.target.value)}
                          >
                            {availableInputs.map(input => (
                              <MenuItem key={input.id} value={input.id}>
                                {input.name} ({input.package_size} {input.unit})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={6} md={2}>
                        <TextField
                          label="Quantité allouée"
                          type="number"
                          size="small"
                          value={item.allocated_quantity}
                          onChange={(e) => updateDistributionItem(item.id, 'allocated_quantity', e.target.value)}
                          fullWidth
                        />
                      </Grid>
                      
                      <Grid item xs={6} md={2}>
                        <TextField
                          label="Quantité distribuée"
                          type="number"
                          size="small"
                          value={item.distributed_quantity}
                          onChange={(e) => updateDistributionItem(item.id, 'distributed_quantity', e.target.value)}
                          fullWidth
                          required
                        />
                      </Grid>
                      
                      <Grid item xs={6} md={2}>
                        <TextField
                          label="Prix unitaire"
                          type="number"
                          size="small"
                          value={item.unit_price}
                          InputProps={{ readOnly: true }}
                          fullWidth
                        />
                      </Grid>
                      
                      <Grid item xs={6} md={1}>
                        <TextField
                          label="Total"
                          type="number"
                          size="small"
                          value={(parseFloat(item.distributed_quantity) || 0) * (parseFloat(item.unit_price) || 0)}
                          InputProps={{ readOnly: true }}
                          fullWidth
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={1}>
                        <IconButton 
                          onClick={() => removeDistributionItem(item.id)}
                          color="error"
                          disabled={distributionItems.length === 1}
                        >
                          <Delete />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))}

                {distributionItems.length === 0 && (
                  <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
                    {beneficiary 
                      ? "Ajoutez des intrants à distribuer" 
                      : "Sélectionnez d'abord un bénéficiaire"
                    }
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Section Paiement et Total */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  4. Paiement et total
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="medium">
                      <InputLabel>Mode de paiement</InputLabel>
                      <Select
                        value={formData.payment_method}
                        label="Mode de paiement"
                        onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                        sx={{
                          minHeight: '56px',
                          '& .MuiSelect-select': {
                            padding: '12px 14px',
                            fontSize: '1rem'
                          }
                        }}
                      >
                        <MenuItem value="free">Gratuit/Subventionné</MenuItem>
                        <MenuItem value="cash">Espèces</MenuItem>
                        <MenuItem value="mobile_money">Mobile Money</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 2, 
                      border: '2px solid', 
                      borderColor: 'primary.main',
                      borderRadius: 1,
                      backgroundColor: 'primary.light',
                      textAlign: 'center'
                    }}>
                      <Typography variant="h5" gutterBottom fontWeight="bold">
                        Total: {calculateTotal().toFixed(2)} FCFA
                      </Typography>
                      {formData.payment_method === 'free' && (
                        <Chip 
                          label="Distribution subventionnée" 
                          color="success" 
                          size="medium"
                          sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                        />
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  5. Notes supplémentaires
                </Typography>
                <TextField
                  label="Notes (optionnel)"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  fullWidth
                  sx={{
                    '& .MuiInputBase-input': {
                      fontSize: '1rem'
                    }
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Actions */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                onClick={resetForm}
                disabled={loading}
                size="large"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                startIcon={<Save />}
                disabled={loading || !beneficiary || distributionItems.length === 0}
                sx={{ minWidth: 200 }}
                size="large"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer la distribution'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

      {/* Trigger caché pour le scan */}
      <div id="scan-trigger" style={{ display: 'none' }} />
    </Paper>
  );
};

export default DistributionForm;