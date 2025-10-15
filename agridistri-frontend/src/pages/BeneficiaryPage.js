// src/pages/BeneficiaryPage.js
import React, { useState } from 'react';
import {
  Typography,
  Box,
  Button,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
} from '@mui/material';
import { 
  QrCodeScanner, 
  Add, 
  People, 
  Assignment,
  CreditCard 
} from '@mui/icons-material';
import BeneficiaryScan from '../components/beneficiary/BeneficiaryScan';
import BeneficiaryList from '../components/beneficiary/BeneficiaryList';
import BeneficiaryForm from '../components/beneficiary/BeneficiaryForm';
import CardProduction from '../components/beneficiary/CardProduction';

const BeneficiaryPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [scanOpen, setScanOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [cardProductionOpen, setCardProductionOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleScan = (cardNumber) => {
    console.log('Carte scannée:', cardNumber);
    showSnackbar(`Carte ${cardNumber} scannée avec succès`, 'success');
    // Ici vous pouvez rechercher le bénéficiaire par son numéro de carte
  };

  const handleAddBeneficiary = () => {
    setFormOpen(true);
  };

  const handleFormSuccess = (beneficiary) => {
    setFormOpen(false);
    showSnackbar(`Bénéficiaire ${beneficiary.first_name} ${beneficiary.last_name} créé avec succès`, 'success');
    // Recharger la liste si nécessaire
  };

  const handleCardProduction = (beneficiary = null) => {
    setSelectedBeneficiary(beneficiary);
    setCardProductionOpen(true);
  };

  const handleCardProductionSuccess = () => {
    setCardProductionOpen(false);
    setSelectedBeneficiary(null);
    showSnackbar('Carte produite avec succès', 'success');
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête de page */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Gestion des Bénéficiaires
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Gérez les bénéficiaires, scannez les cartes et produisez de nouvelles cartes
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<QrCodeScanner />}
            onClick={() => setScanOpen(true)}
            size="large"
          >
            Scanner Carte
          </Button>
          <Button
            variant="outlined"
            startIcon={<CreditCard />}
            onClick={() => handleCardProduction()}
            size="large"
          >
            Production Cartes
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddBeneficiary}
            size="large"
          >
            Nouveau Bénéficiaire
          </Button>
        </Box>
      </Box>

      {/* Navigation par onglets */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab 
            icon={<People />} 
            label="Liste des Bénéficiaires" 
          />
          <Tab 
            icon={<Assignment />} 
            label="Bénéficiaires Oubliés" 
          />
        </Tabs>
      </Paper>

      {/* Contenu des onglets */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <BeneficiaryList 
            onCardProduction={handleCardProduction}
            onEditBeneficiary={(beneficiary) => {
              setSelectedBeneficiary(beneficiary);
              setFormOpen(true);
            }}
          />
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Gestion des Bénéficiaires Oubliés
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Cette section permet d'ajouter des bénéficiaires non pré-enregistrés ou oubliés.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600, mx: 'auto' }}>
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Ajouter un bénéficiaire oublié
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Créez un nouveau bénéficiaire avec génération immédiate de carte QR
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddBeneficiary}
                size="large"
              >
                Ajouter un Bénéficiaire Oublié
              </Button>
            </Paper>

            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Processus d'ajout
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2" paragraph>
                  <strong>Saisie des informations :</strong> Nom complet, commune, village, téléphone
                </Typography>
                <Typography component="li" variant="body2" paragraph>
                  <strong>Capture photo :</strong> Photo du bénéficiaire via l'appareil photo
                </Typography>
                <Typography component="li" variant="body2" paragraph>
                  <strong>Génération automatique :</strong> ID unique et QR code générés automatiquement
                </Typography>
                <Typography component="li" variant="body2" paragraph>
                  <strong>Validation :</strong> Peut nécessiter une validation superviseur selon les paramètres
                </Typography>
                <Typography component="li" variant="body2">
                  <strong>Distribution immédiate :</strong> Carte temporaire disponible pour distribution
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Paper>
      )}

      {/* Modales */}
      <BeneficiaryScan
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onScan={handleScan}
      />

      <Dialog 
        open={formOpen} 
        onClose={() => setFormOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedBeneficiary ? 'Modifier le Bénéficiaire' : 'Nouveau Bénéficiaire'}
        </DialogTitle>
        <DialogContent>
          <BeneficiaryForm
            beneficiary={selectedBeneficiary}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setFormOpen(false);
              setSelectedBeneficiary(null);
            }}
            isForgotten={activeTab === 1}
          />
        </DialogContent>
      </Dialog>

      <Dialog 
        open={cardProductionOpen} 
        onClose={() => setCardProductionOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Production de Cartes Bénéficiaires
        </DialogTitle>
        <DialogContent>
          <CardProduction
            beneficiary={selectedBeneficiary}
            onSuccess={handleCardProductionSuccess}
            onCancel={() => {
              setCardProductionOpen(false);
              setSelectedBeneficiary(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BeneficiaryPage;