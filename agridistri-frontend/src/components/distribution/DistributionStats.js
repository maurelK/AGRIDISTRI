// src/components/distribution/DistributionStats.js
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Button,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Download,
} from '@mui/icons-material';

// Sample data for demonstration
const sampleStats = [
  {
    id: 1,
    date: '2024-01-15',
    site: 'Centre Agricole Yamoussoukro',
    department: 'Yamoussoukro',
    commune: 'Yamoussoukro',
    agent: 'KOUADIO Jean',
    intrant: 'Semence Maïs',
    quantityToRemit: 50,
    quantityRemitted: 45,
    unit: 'kg',
    beneficiary: 'Bamba Mariam',
  },
  {
    id: 2,
    date: '2024-01-15',
    site: 'Site Katiola',
    department: 'Katiola',
    commune: 'Katiola',
    agent: 'TRAORE Awa',
    intrant: 'Engrais NPK',
    quantityToRemit: 100,
    quantityRemitted: 95,
    unit: 'kg',
    beneficiary: 'Coulibaly Moussa',
  },
  {
    id: 3,
    date: '2024-01-16',
    site: 'Point de collecte Bouaké',
    department: 'Bouaké',
    commune: 'Bouaké',
    agent: 'DIALLO Ibrahim',
    intrant: 'Insecticide',
    quantityToRemit: 20,
    quantityRemitted: 18,
    unit: 'L',
    beneficiary: 'Konaté Fatou',
  },
  {
    id: 4,
    date: '2024-01-16',
    site: 'Centre Agricole Yamoussoukro',
    department: 'Yamoussoukro',
    commune: 'Yamoussoukro',
    agent: 'KOUADIO Jean',
    intrant: 'Engrais NPK',
    quantityToRemit: 75,
    quantityRemitted: 70,
    unit: 'kg',
    beneficiary: 'Diarrassouba Adama',
  },
  {
    id: 5,
    date: '2024-01-17',
    site: 'Site Katiola',
    department: 'Katiola',
    commune: 'Katiola',
    agent: 'TRAORE Awa',
    intrant: 'Semence Maïs',
    quantityToRemit: 40,
    quantityRemitted: 38,
    unit: 'kg',
    beneficiary: 'Sangaré Bakary',
  },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const DistributionStats = () => {
  const [filterSite, setFilterSite] = useState('all');
  const [filterIntrant, setFilterIntrant] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [filteredData, setFilteredData] = useState(sampleStats);

  React.useEffect(() => {
    let filtered = sampleStats;

    if (filterSite !== 'all') {
      filtered = filtered.filter(item => item.site === filterSite);
    }

    if (filterIntrant !== 'all') {
      filtered = filtered.filter(item => item.intrant === filterIntrant);
    }

    // Sort data
    filtered.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredData(filtered);
  }, [filterSite, filterIntrant, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sites = [...new Set(sampleStats.map(item => item.site))];
  const intrants = [...new Set(sampleStats.map(item => item.intrant))];

  // Prepare chart data
  const chartData = intrants.map(intrant => {
    const data = filteredData.filter(item => item.intrant === intrant);
    return {
      name: intrant,
      quantityRemitted: data.reduce((sum, item) => sum + item.quantityRemitted, 0),
      quantityToRemit: data.reduce((sum, item) => sum + item.quantityToRemit, 0),
    };
  });

  const pieData = sites.map(site => {
    const data = filteredData.filter(item => item.site === site);
    return {
      name: site,
      value: data.reduce((sum, item) => sum + item.quantityRemitted, 0),
    };
  });

  const exportToExcel = () => {
    // In a real app, this would generate and download an Excel file
    console.log('Exporting to Excel...', filteredData);
    alert('Fonctionnalité d\'export Excel à implémenter');
  };

  const totalDistributed = filteredData.reduce((sum, item) => sum + item.quantityRemitted, 0);
  const totalToDistribute = filteredData.reduce((sum, item) => sum + item.quantityToRemit, 0);
  const coverageRate = totalToDistribute > 0 ? ((totalDistributed / totalToDistribute) * 100).toFixed(1) : 0;

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total distribué
              </Typography>
              <Typography variant="h4" component="div">
                {totalDistributed.toLocaleString()} kg/L
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Taux de couverture
              </Typography>
              <Typography variant="h4" component="div">
                {coverageRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Sites actifs
              </Typography>
              <Typography variant="h4" component="div">
                {sites.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Bénéficiaires servis
              </Typography>
              <Typography variant="h4" component="div">
                {filteredData.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtres
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Site</InputLabel>
              <Select
                value={filterSite}
                label="Site"
                onChange={(e) => setFilterSite(e.target.value)}
              >
                <MenuItem value="all">Tous les sites</MenuItem>
                {sites.map(site => (
                  <MenuItem key={site} value={site}>{site}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Type d'intrant</InputLabel>
              <Select
                value={filterIntrant}
                label="Type d'intrant"
                onChange={(e) => setFilterIntrant(e.target.value)}
              >
                <MenuItem value="all">Tous les intrants</MenuItem>
                {intrants.map(intrant => (
                  <MenuItem key={intrant} value={intrant}>{intrant}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={exportToExcel}
              fullWidth
            >
              Exporter Excel
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Distribution par intrant
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantityRemitted" fill="#8884d8" name="Quantité distribuée" />
                <Bar dataKey="quantityToRemit" fill="#82ca9d" name="Quantité à distribuer" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Répartition par site
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Data Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Détail des distributions
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'date'}
                    direction={sortConfig.key === 'date' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('date')}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'site'}
                    direction={sortConfig.key === 'site' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('site')}
                  >
                    Site
                  </TableSortLabel>
                </TableCell>
                <TableCell>Agent</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'intrant'}
                    direction={sortConfig.key === 'intrant' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('intrant')}
                  >
                    Intrant
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortConfig.key === 'quantityToRemit'}
                    direction={sortConfig.key === 'quantityToRemit' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('quantityToRemit')}
                  >
                    À remettre
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortConfig.key === 'quantityRemitted'}
                    direction={sortConfig.key === 'quantityRemitted' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('quantityRemitted')}
                  >
                    Distribué
                  </TableSortLabel>
                </TableCell>
                <TableCell>Unité</TableCell>
                <TableCell>Bénéficiaire</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{new Date(row.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{row.site}</TableCell>
                  <TableCell>{row.agent}</TableCell>
                  <TableCell>{row.intrant}</TableCell>
                  <TableCell align="right">{row.quantityToRemit}</TableCell>
                  <TableCell align="right">{row.quantityRemitted}</TableCell>
                  <TableCell>{row.unit}</TableCell>
                  <TableCell>{row.beneficiary}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default DistributionStats;
