// src/components/beneficiary/BeneficiaryForm.js
import React, { useState, useEffect } from 'react';
import {
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
  Typography,
  Alert,
  Avatar,
  IconButton,
} from '@mui/material';
import { PhotoCamera, Save, Cancel } from '@mui/icons-material';
import api from '../../services/api';

const BeneficiaryForm = ({ beneficiary, onSuccess, onCancel, isForgotten = false }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    date_of_birth: '',
    phone: '',
    village: '',
    address: '',
    national_id: '',
    farm_size: '',
    main_crops: '',
    status: 'active'
  });
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => {
    if (beneficiary) {
      setFormData({
        first_name: beneficiary.first_name || '',
        last_name: beneficiary.last_name || '',
        gender: beneficiary.gender || '',
        date_of_birth: beneficiary.date_of_birth || '',
        phone: beneficiary.phone || '',
        village: beneficiary.village?.id || beneficiary.village || '',
        address: beneficiary.address || '',
        national_id: beneficiary.national_id || '',
        farm_size: beneficiary.farm_size || '',
        main_crops: beneficiary.main_crops || '',
        status: beneficiary.status || 'active'
      });
      setPhotoPreview(beneficiary.photo || '');
    }
    fetchVillages();
  }, [beneficiary]);

  const fetchVillages = async () => {
    try {
      const response = await api.get('/villages/');
      setVillages(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching villages:', error);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCardNumber = () => {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BEN${timestamp}${random}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        card_number: beneficiary?.card_number || generateCardNumber(),
        registration_date: new Date().toISOString().split('T')[0]
      };

      let response;
      if (beneficiary) {
        response = await api.put(`/beneficiaries/${beneficiary.id}/`, submitData);
      } else {
        response = await api.post('/beneficiaries/', submitData);
      }

      // Gérer l'upload de photo si une nouvelle photo est sélectionnée
      if (photo && response.data.id) {
        const photoFormData = new FormData();
        photoFormData.append('photo', photo);
        await api.patch(`/beneficiaries/${response.data.id}/`, photoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      onSuccess(response.data);
    } catch (error) {
      console.error('Error saving beneficiary:', error);
      setError('Erreur lors de l\'enregistrement du bénéficiaire');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isForgotten && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Bénéficiaire oublié :</strong> Ce bénéficiaire sera ajouté avec une validation immédiate.
          Une carte temporaire sera générée pour distribution.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Photo du bénéficiaire */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Photo du bénéficiaire
              </Typography>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={photoPreview}
                  sx={{ width: 120, height: 120, mb: 2 }}
                />
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="photo-upload"
                  type="file"
                  onChange={handlePhotoChange}
                />
                <label htmlFor="photo-upload">
                  <IconButton
                    color="primary"
                    aria-label="upload picture"
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      backgroundColor: 'white',
                      boxShadow: 1,
                    }}
                  >
                    <PhotoCamera />
                  </IconButton>
                </label>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Cliquez sur l'icône pour prendre une photo
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Informations personnelles */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Informations Personnelles
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Prénom"
                    value={formData.first_name}
                    onChange={handleChange('first_name')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Nom"
                    value={formData.last_name}
                    onChange={handleChange('last_name')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Genre</InputLabel>
                    <Select
                      value={formData.gender}
                      label="Genre"
                      onChange={handleChange('gender')}
                    >
                      <MenuItem value="M">Masculin</MenuItem>
                      <MenuItem value="F">Féminin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date de naissance"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange('date_of_birth')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Numéro de téléphone"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    placeholder="Ex: +227 98 77 66 22"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Numéro CNI"
                    value={formData.national_id}
                    onChange={handleChange('national_id')}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Informations géographiques */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Localisation
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Village</InputLabel>
                    <Select
                      value={formData.village}
                      label="Village"
                      onChange={handleChange('village')}
                    >
                      {villages.map((village) => (
                        <MenuItem key={village.id} value={village.id}>
                          {village.name} - {village.commune_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Adresse détaillée"
                    multiline
                    rows={2}
                    value={formData.address}
                    onChange={handleChange('address')}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Informations agricoles */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Informations Agricoles
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Superficie agricole (hectares)"
                    type="number"
                    value={formData.farm_size}
                    onChange={handleChange('farm_size')}
                    InputProps={{ endAdornment: 'ha' }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Cultures principales"
                    value={formData.main_crops}
                    onChange={handleChange('main_crops')}
                    placeholder="Ex: Maïs, Riz, Coton"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Statut */}
        {beneficiary && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Statut
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={formData.status}
                    label="Statut"
                    onChange={handleChange('status')}
                  >
                    <MenuItem value="active">Actif</MenuItem>
                    <MenuItem value="suspended">Suspendu</MenuItem>
                    <MenuItem value="inactive">Inactif</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={onCancel}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BeneficiaryForm;