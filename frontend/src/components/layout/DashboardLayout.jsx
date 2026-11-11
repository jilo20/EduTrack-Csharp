/*
 * ==========================================================================
 * FILE:    src/components/layout/DashboardLayout.jsx
 * OWNER:   Uytico, Felleandrei
 * WBS:     14.2 Layout & Navigation
 * PURPOSE: The frame around every page after login: sidebar, top bar, and the page itself.
 *
 * TODO: sidebar menu that changes by role (see src/navigation.js), top bar with the user's name, logout, and
 *       <NotificationPanel /> (Mary Vincent builds that component), responsive drawer on small screens.
 * NOTE: the version below is only a bare list of links so the team can move between pages. Replace it.
 * MUI:  Drawer, AppBar, Toolbar, List, ListItemButton, Avatar, Menu
 *
 * RULE:    Material UI components only. See frontend/README.md.
 * STATUS:  EMPTY - not started. Delete this line when you begin.
 * ==========================================================================
 */
import { Box, Button, Stack, Typography } from '@mui/material';
import { Link, Outlet } from 'react-router-dom';
import { NAV } from '../../navigation';

export default function DashboardLayout() {
  const links = [...new Map(Object.values(NAV).flat().map((item) => [item.path, item])).values()];
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6">EduTrack</Typography>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', my: 2 }}>
        {links.map((item) => (
          <Button key={item.path} component={Link} to={`/dashboard/${item.path}`} variant="outlined" size="small">
            {item.label}
          </Button>
        ))}
      </Stack>
      <Outlet />
    </Box>
  );
}
