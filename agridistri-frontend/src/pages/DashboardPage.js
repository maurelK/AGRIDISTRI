// src/pages/DashboardPage.js
import React, { useState, useEffect } from "react";
import {
  Grid,
  Typography,
  Box,
  Paper,
  Divider,
  CircularProgress,
  useTheme,
} from "@mui/material";
import {
  People,
  Inventory,
  Place,
  Campaign,
  WarningAmber,
  Sync,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import StatsCard from "../components/dashboard/StatsCard";
import RecentDistributions from "../components/dashboard/RecentDistributions";
import api from "../services/api";

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get("/dashboard/overview/");
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Tableau de bord
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 1, fontSize: "1rem" }}
        >
          Bonjour <b>{user?.first_name} {user?.last_name}</b>, voici une vue d’ensemble de vos activités.
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Bénéficiaires"
            value={stats?.total_beneficiaries || 0}
            icon={<People />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Sites de distribution"
            value={stats?.total_sites || 0}
            icon={<Place />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Campagnes actives"
            value={stats?.active_campaigns || 0}
            icon={<Campaign />}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Distributions du jour"
            value={stats?.today_distributions || 0}
            icon={<Inventory />}
            color={theme.palette.secondary.main}
          />
        </Grid>
      </Grid>

      {/* Main Grid */}
      <Grid container spacing={3}>
        {/* Alertes */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}
            >
              Alertes
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {stats?.low_stock_count > 0 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <WarningAmber color="warning" />
                  <Typography>
                    <b>{stats.low_stock_count}</b> produit(s) en stock faible
                  </Typography>
                </Box>
              )}
              {stats?.pending_sync > 0 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Sync color="info" />
                  <Typography>
                    <b>{stats.pending_sync}</b> distribution(s) en attente de synchronisation
                  </Typography>
                </Box>
              )}
              {!stats?.low_stock_count && !stats?.pending_sync && (
                <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                  Aucune alerte pour le moment 🎉
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Distributions récentes */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}
            >
              Distributions récentes
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <RecentDistributions />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
