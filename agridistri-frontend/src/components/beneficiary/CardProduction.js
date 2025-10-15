// src/components/beneficiary/CardProduction.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  Avatar,
} from '@mui/material';
import { Print, Download } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import api from '../../services/api';

const CardProduction = ({ beneficiary, onSuccess, onCancel }) => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(beneficiary);
  const [cardTemplate, setCardTemplate] = useState('standard');
  const [quantity, setQuantity] = useState(1);
  const cardRef = useRef();

  useEffect(() => {
    if (!beneficiary) {
      fetchBeneficiaries();
    }
  }, [beneficiary]);

  const fetchBeneficiaries = async () => {
    try {
      const response = await api.get('/beneficiaries/');
      setBeneficiaries(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
    }
  };

  const generateQRData = (beneficiary) => {
    return JSON.stringify({
      id: beneficiary.id,
      card_number: beneficiary.card_number, 
      name: `${beneficiary.first_name} ${beneficiary.last_name}`,
      type: 'beneficiary',
      system: 'AgriDistriConnect'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (cardRef.current) {
      try {
        const canvas = await html2canvas(cardRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true
        });
        
        const link = document.createElement('a');
        link.download = `carte_${selectedBeneficiary.card_number}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error('Error generating card image:', error);
      }
    }
  };

  const handleDownloadPDF = () => {
    // Pour une vraie application, vous généreriez un PDF côté serveur
    alert('Fonctionnalité PDF à implémenter avec une bibliothèque comme jsPDF');
  };

  const CardPreview = () => {
    if (!selectedBeneficiary) return null;

    const qrData = generateQRData(selectedBeneficiary);

    return (
      <Paper 
        ref={cardRef}
        sx={{ 
          p: 3, 
          border: '2px solid #1976d2',
          borderRadius: 2,
          maxWidth: 400,
          mx: 'auto',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%)',
          position: 'relative'
        }}
      >
        {/* En-tête de la carte */}
        <Box sx={{ textAlign: 'center', mb: 2, pb: 2, borderBottom: '2px solid #1976d2' }}>
          <Typography variant="h6" color="primary" gutterBottom fontWeight="bold">
            CARTE BÉNÉFICIAIRE
          </Typography>
          <Typography variant="body2" color="textSecondary">
            AgriDistriConnect - Programme National
          </Typography>
        </Box>

        <Grid container spacing={2} alignItems="center">
          {/* Photo du bénéficiaire */}
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                src={selectedBeneficiary.photo}
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto',
                  border: '2px solid #1976d2'
                }}
              >
                {selectedBeneficiary.first_name?.[0]}{selectedBeneficiary.last_name?.[0]}
              </Avatar>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Photo
              </Typography>
            </Box>
          </Grid>
          
          {/* Informations du bénéficiaire */}
          <Grid item xs={8}>
            <Typography variant="body1" fontWeight="bold" gutterBottom>
              {selectedBeneficiary.first_name} {selectedBeneficiary.last_name}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>N° Carte:</strong> {selectedBeneficiary.card_number}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Village:</strong> {selectedBeneficiary.village_name || 'Non spécifié'}
            </Typography>
            <Typography variant="body2">
              <strong>Crée le:</strong> {new Date().toLocaleDateString('fr-FR')}
            </Typography>
          </Grid>
        </Grid>

        {/* QR Code - Fixed: Using QRCodeSVG */}
        <Box sx={{ textAlign: 'center', mt: 2, pt: 2, borderTop: '1px dashed #ccc' }}>
          <Typography variant="caption" display="block" gutterBottom>
            Scanner pour vérification
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <QRCodeSVG 
              value={qrData}
              size={80}
              level="M"
              includeMargin={false}
            />
          </Box>
        </Box>

        {/* Pied de page */}
        <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed #ccc' }}>
          <Typography variant="caption" color="textSecondary" align="center" display="block">
            Cette carte permet d'accéder aux distributions d'intrants agricoles subventionnés
          </Typography>
          <Typography variant="caption" color="textSecondary" align="center" display="block">
            Valide jusqu'au: {new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('fr-FR')}
          </Typography>
        </Box>
      </Paper>
    );
  };

  return (
    <Box>
      {!beneficiary && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sélection du bénéficiaire
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Bénéficiaire</InputLabel>
              <Select
                value={selectedBeneficiary?.id || ''}
                label="Bénéficiaire"
                onChange={(e) => {
                  const selected = beneficiaries.find(b => b.id === e.target.value);
                  setSelectedBeneficiary(selected);
                }}
              >
                {beneficiaries.map((benef) => (
                  <MenuItem key={benef.id} value={benef.id}>
                    {benef.first_name} {benef.last_name} - {benef.card_number}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      )}

      {selectedBeneficiary ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Options de production
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Modèle de carte</InputLabel>
                  <Select
                    value={cardTemplate}
                    label="Modèle de carte"
                    onChange={(e) => setCardTemplate(e.target.value)}
                  >
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="premium">Premium (Couleur)</MenuItem>
                    <MenuItem value="economique">Économique (N&B)</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  label="Quantité de cartes"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  InputProps={{ inputProps: { min: 1, max: 10 } }}
                  helperText="Nombre de cartes à générer"
                />

                <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Informations encodées dans le QR Code:</strong>
                  </Typography>
                  <Typography variant="caption" component="div">
                    • ID: {selectedBeneficiary.id}
                  </Typography>
                  <Typography variant="caption" component="div">
                    • N° Carte: {selectedBeneficiary.card_number}
                  </Typography>
                  <Typography variant="caption" component="div">
                    • Nom: {selectedBeneficiary.first_name} {selectedBeneficiary.last_name}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDownload}
                fullWidth
              >
                Télécharger Image
              </Button>
              <Button
                variant="outlined"
                onClick={handleDownloadPDF}
                fullWidth
              >
                Télécharger PDF
              </Button>
              <Button
                variant="contained"
                startIcon={<Print />}
                onClick={handlePrint}
                fullWidth
              >
                Imprimer
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Aperçu de la carte
            </Typography>
            <CardPreview />
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Instructions:</strong> Le QR code contient les informations du bénéficiaire 
                et peut être scanné par l'application mobile pour validation rapide.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info">
          Veuillez sélectionner un bénéficiaire pour produire sa carte
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel} variant="outlined">
          Annuler
        </Button>
        <Button 
          variant="contained" 
          onClick={onSuccess}
          disabled={!selectedBeneficiary}
        >
          Terminer la production
        </Button>
      </Box>

      {/* Styles d'impression */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-card, .print-card * {
              visibility: visible;
            }
            .print-card {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default CardProduction;