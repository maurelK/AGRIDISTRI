// src/components/maps/GeoPortal.js
import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Sample data for demonstration
const sampleSites = [
  {
    id: 1,
    name: 'Centre Agricole Yamoussoukro',
    lat: 6.8276,
    lng: -5.2893,
    region: 'Yamoussoukro',
    department: 'Yamoussoukro',
    commune: 'Yamoussoukro',
    stocks: {
      'Semence Maïs': { quantity: 150, unit: 'kg' },
      'Engrais NPK': { quantity: 200, unit: 'kg' },
      'Insecticide': { quantity: 50, unit: 'L' },
    },
    agents: 3,
    beneficiaries: 245,
    distributions: 89,
  },
  {
    id: 2,
    name: 'Site Katiola',
    lat: 8.1373,
    lng: -5.1009,
    region: 'Vallée du Bandama',
    department: 'Katiola',
    commune: 'Katiola',
    stocks: {
      'Semence Maïs': { quantity: 120, unit: 'kg' },
      'Engrais NPK': { quantity: 180, unit: 'kg' },
    },
    agents: 2,
    beneficiaries: 156,
    distributions: 67,
  },
  {
    id: 3,
    name: 'Point de collecte Bouaké',
    lat: 7.6938,
    lng: -5.0301,
    region: 'Gbêkê',
    department: 'Bouaké',
    commune: 'Bouaké',
    stocks: {
      'Semence Maïs': { quantity: 200, unit: 'kg' },
      'Engrais NPK': { quantity: 300, unit: 'kg' },
      'Insecticide': { quantity: 75, unit: 'L' },
      'Fongicide': { quantity: 25, unit: 'kg' },
    },
    agents: 4,
    beneficiaries: 312,
    distributions: 134,
  },
];

const GeoPortal = () => {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedIntrant, setSelectedIntrant] = useState('all');
  const [filteredSites, setFilteredSites] = useState(sampleSites);

  // Côte d'Ivoire center coordinates
  const center = [7.54, -5.547];

  useEffect(() => {
    let filtered = sampleSites;

    if (selectedRegion !== 'all') {
      filtered = filtered.filter(site => site.region === selectedRegion);
    }

    if (selectedIntrant !== 'all') {
      filtered = filtered.filter(site =>
        Object.keys(site.stocks).some(intrant =>
          selectedIntrant === 'all' || intrant.toLowerCase().includes(selectedIntrant.toLowerCase())
        )
      );
    }

    setFilteredSites(filtered);
  }, [selectedRegion, selectedIntrant]);

  const regions = [...new Set(sampleSites.map(site => site.region))];
  const intrants = [...new Set(sampleSites.flatMap(site => Object.keys(site.stocks)))];

  const getMarkerColor = (site) => {
    const stockLevel = Object.values(site.stocks).reduce((sum, stock) => sum + stock.quantity, 0);
    if (stockLevel > 300) return '#4caf50'; // green
    if (stockLevel > 150) return '#ff9800'; // orange
    return '#f44336'; // red
  };

  const createCustomIcon = (color) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Région</InputLabel>
              <Select
                value={selectedRegion}
                label="Région"
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <MenuItem value="all">Toutes les régions</MenuItem>
                {regions.map(region => (
                  <MenuItem key={region} value={region}>{region}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Type d'intrant</InputLabel>
              <Select
                value={selectedIntrant}
                label="Type d'intrant"
                onChange={(e) => setSelectedIntrant(e.target.value)}
              >
                <MenuItem value="all">Tous les intrants</MenuItem>
                {intrants.map(intrant => (
                  <MenuItem key={intrant} value={intrant}>{intrant}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`${filteredSites.length} site${filteredSites.length > 1 ? 's' : ''}`}
                color="primary"
                size="small"
              />
              <Chip
                label={`${filteredSites.reduce((sum, site) => sum + site.agents, 0)} agent${filteredSites.reduce((sum, site) => sum + site.agents, 0) > 1 ? 's' : ''}`}
                color="secondary"
                size="small"
              />
              <Chip
                label={`${filteredSites.reduce((sum, site) => sum + site.beneficiaries, 0)} bénéficiaire${filteredSites.reduce((sum, site) => sum + site.beneficiaries, 0) > 1 ? 's' : ''}`}
                color="info"
                size="small"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Map */}
      <Box sx={{ flex: 1, borderRadius: 1, overflow: 'hidden' }}>
        <MapContainer
          center={center}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredSites.map(site => (
            <Marker
              key={site.id}
              position={[site.lat, site.lng]}
              icon={createCustomIcon(getMarkerColor(site))}
            >
              <Popup>
                <Card sx={{ minWidth: 300 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {site.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {site.region} - {site.department}
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Stocks disponibles:
                      </Typography>
                      {Object.entries(site.stocks).map(([intrant, stock]) => (
                        <Box key={intrant} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">{intrant}:</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {stock.quantity} {stock.unit}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="textSecondary">Agents</Typography>
                        <Typography variant="h6">{site.agents}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">Bénéficiaires</Typography>
                        <Typography variant="h6">{site.beneficiaries}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">Distributions</Typography>
                        <Typography variant="h6">{site.distributions}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
    </Box>
  );
};

export default GeoPortal;
