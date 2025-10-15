// src/components/beneficiary/BeneficiaryScan.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { QrCodeScanner, Search } from '@mui/icons-material';
import { Html5QrcodeScanner } from 'html5-qrcode';

const BeneficiaryScan = ({ onScan, open, onClose }) => {
  const [manualSearch, setManualSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  const onScanSuccess = useCallback((decodedText, decodedResult) => {
    console.log(`Scan réussi: ${decodedText}`, decodedResult);
    setScanning(false);
    
    if (scannerRef.current) {
      scannerRef.current.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner.", error);
      });
    }
    
    onScan(decodedText);
    onClose();
  }, [onScan, onClose]);

  const onScanFailure = useCallback((error) => {
    // Les erreurs de scan sont normales, on les ignore silencieusement
    if (error && !error.includes('NotFoundException')) {
      console.warn('Scan error:', error);
    }
  }, []);

  const initializeScanner = useCallback(() => {
    try {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
        },
        false
      );

      scannerRef.current.render(
        onScanSuccess,
        onScanFailure
      );
      setScanning(true);
    } catch (err) {
      console.error('Error initializing scanner:', err);
      setError('Erreur lors de l\'initialisation du scanner');
    }
  }, [onScanSuccess, onScanFailure]);

  useEffect(() => {
    if (open && !scannerRef.current) {
      initializeScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner.", error);
        });
        scannerRef.current = null;
      }
    };
  }, [open, initializeScanner]);

  const handleManualSearch = async () => {
    if (manualSearch.trim()) {
      setError('');
      try {
        onScan(manualSearch.trim());
        setManualSearch('');
        onClose();
      } catch (err) {
        setError('Bénéficiaire non trouvé');
      }
    }
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner.", error);
      });
      scannerRef.current = null;
    }
    setScanning(false);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCodeScanner />
          Scanner carte bénéficiaire
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Scanner QR Code */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Scan QR Code
            </Typography>
            <Box 
              id="qr-reader"
              sx={{ 
                width: '100%',
                minHeight: 300,
                border: scanning ? '2px dashed #1976d2' : '2px dashed #ddd',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fafafa'
              }}
            >
              {!scanning && (
                <Typography color="textSecondary" align="center">
                  Le scanner va s'initialiser...
                  <br />
                  <small>Assurez-vous d'autoriser l'accès à la caméra</small>
                </Typography>
              )}
              {scanning && (
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress size={24} sx={{ mb: 1 }} />
                  <Typography variant="body2">
                    Scanner en cours...
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Séparateur */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ flex: 1, height: 1, backgroundColor: '#ddd' }} />
            <Typography variant="body2" color="textSecondary">
              OU
            </Typography>
            <Box sx={{ flex: 1, height: 1, backgroundColor: '#ddd' }} />
          </Box>

          {/* Recherche manuelle */}
          <Box>
            <Typography variant="h6" gutterBottom>
              <Search sx={{ mr: 1, verticalAlign: 'middle' }} />
              Recherche manuelle
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                label="Numéro de carte du bénéficiaire"
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                placeholder="Ex: BEN20240001"
              />
              <Button 
                variant="contained" 
                onClick={handleManualSearch}
                disabled={!manualSearch.trim()}
                sx={{ minWidth: 120 }}
              >
                Rechercher
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default BeneficiaryScan;