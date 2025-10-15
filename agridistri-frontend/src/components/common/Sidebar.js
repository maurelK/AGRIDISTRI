import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  Typography,
  Toolbar,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  People,
  Inventory,
  History,
  Assessment,
  Map,
  Settings,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const menuItems = [
  { text: 'Tableau de bord', icon: <Dashboard />, path: '/' },
  { text: 'Bénéficiaires', icon: <People />, path: '/beneficiaries' },
  { text: 'Distribution', icon: <Inventory />, path: '/distribution' },
  { text: 'Historique', icon: <History />, path: '/history' },
  { text: 'Statistiques', icon: <Assessment />, path: '/statistics' },
  { text: 'Géoportail', icon: <Map />, path: '/maps' },
  { text: 'Paramètres', icon: <Settings />, path: '/settings' },
];

const Sidebar = ({ width = 240, mobileOpen, handleDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);

  const toggleDrawer = () => setOpen(!open);

  const drawerContent = (
    <>
      {/* Toolbar avec bouton toggle */}
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          px: 1,
        }}
      >
        {open && (
          <Typography variant="h6" color="primary">
            Menu
          </Typography>
        )}
        <IconButton onClick={toggleDrawer} size="small">
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Toolbar>

      <Divider />

      {/* Liste des liens */}
      <List sx={{ pb: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (mobileOpen) handleDrawerToggle(); // Close mobile drawer after navigation
              }}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {open && <ListItemText primary={item.text} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />
    </>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: width,
            boxSizing: 'border-box',
            backgroundColor: '#f8f9fa',
            borderRight: '1px solid #e0e0e0',
          },
        }}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: open ? width : 70,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? width : 70,
            boxSizing: 'border-box',
            backgroundColor: '#f8f9fa',
            borderRight: '1px solid #e0e0e0',
            overflowX: 'hidden',
            transition: 'width 0.3s ease',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
