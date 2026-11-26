import { useState } from 'react';
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import AssignmentTurnedInOutlined from '@mui/icons-material/AssignmentTurnedInOutlined';
import BarChartOutlined from '@mui/icons-material/BarChartOutlined';
import CampaignOutlined from '@mui/icons-material/CampaignOutlined';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearSession, getCurrentUser } from '../../api/client';
import { NAV } from '../../navigation';
import NotificationPanel from '../common/NotificationPanel';

const DRAWER_WIDTH = 232;

const NAV_ICONS = {
  Dashboard: <DashboardOutlined />,
  'Invite Center': <VpnKeyOutlined />,
  Users: <PeopleAltOutlined />,
  'All Classes': <SchoolOutlined />,
  Broadcast: <CampaignOutlined />,
  'Audit Logs': <HistoryOutlined />,
  'My Classes': <SchoolOutlined />,
  'Grading Hub': <AssignmentTurnedInOutlined />,
  Reports: <BarChartOutlined />,
  Attendance: <EventAvailableOutlined />,
  Performance: <TrendingUpOutlined />,
  Assessments: <AssignmentOutlined />,
  'My Attendance': <EventNoteOutlined />,
  Announcements: <CampaignOutlined />,
};

function initialsFor(user) {
  const name = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  return name
    ? name.split(/\s+/).map((part) => part[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';
}

export default function DashboardLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const links = NAV[user?.role] ?? [];
  const roleColor = user?.role === 'Student' ? 'secondary.main' : 'primary.main';
  const displayName = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'EduTrack user';

  const handleLogout = () => {
    clearSession();
    navigate('/', { replace: true });
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar />
      <Divider />
      <List sx={{ px: 1.5, py: 1.5, flexGrow: 1 }}>
        {links.map((item) => {
          const path = item.path ? `/dashboard/${item.path}` : '/dashboard';
          const selected = item.path
            ? location.pathname === path || location.pathname.startsWith(`${path}/`)
            : location.pathname === '/dashboard';
          return (
            <ListItemButton
              key={item.path || 'dashboard'}
              component={Link}
              to={path}
              selected={selected}
              aria-current={selected ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              sx={{
                mb: 0.5,
                minHeight: 42,
                py: 0.5,
                borderRadius: 1,
                color: selected ? roleColor : 'text.secondary',
                '&.Mui-selected': { bgcolor: (theme) => theme.palette.action.selected, color: roleColor },
                '&.Mui-selected:hover': { bgcolor: 'action.hover' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 34, '& .MuiSvgIcon-root': { fontSize: 20 }, color: 'inherit' }}>{NAV_ICONS[item.label]}</ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 500 } }} />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <List sx={{ px: 1.5, py: 1.5 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{ borderRadius: 1, color: 'error.main', '&:hover': { bgcolor: 'action.hover' } }}
        >
          <ListItemIcon sx={{ minWidth: 34, '& .MuiSvgIcon-root': { fontSize: 20 }, color: 'inherit' }}><LogoutRounded /></ListItemIcon>
          <ListItemText primary="Log Out" slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 600 } }} />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        component="header"
        sx={{
          position: 'fixed',
          zIndex: theme.zIndex.drawer + 1,
          top: 0,
          left: isDesktop ? `${DRAWER_WIDTH}px` : 0,
          width: isDesktop ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', gap: { xs: 0.75, sm: 2 } }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            {!isDesktop && (
              <Tooltip title="Open Navigation Menu"><IconButton aria-label="Open navigation menu" onClick={() => setMobileOpen(true)} edge="start">
                <MenuRounded />
              </IconButton></Tooltip>
            )}
            <Typography variant="h5" component="div" sx={{ fontWeight: 800, letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
              EduTrack<Box component="span" sx={{ color: 'secondary.main' }}>.</Box>
            </Typography>
          </Stack>
          <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} sx={{ alignItems: 'center', minWidth: 0 }}>
            <NotificationPanel />
            <Box sx={{ textAlign: 'right', minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: { xs: 88, sm: 200 } }}>{displayName}</Typography>
              <Typography variant="caption" fontWeight={600} sx={{ color: roleColor }}>
                {user?.role}
              </Typography>
            </Box>
            <Tooltip title={`${displayName} (${user?.role ?? 'user'})`}>
              <Avatar sx={{ bgcolor: roleColor, width: 32, height: 32, fontSize: '0.8rem', fontWeight: 800 }}>
                {initialsFor(user)}
              </Avatar>
            </Tooltip>
          </Stack>
        </Toolbar>
      </Box>

      <Box component="nav" aria-label="Dashboard navigation" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop || mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              bgcolor: 'background.paper',
              borderRight: 1,
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, px: { xs: 2, sm: 2.5 }, pb: 2.5, pt: { xs: 9.5, sm: 10 } }}>
        <Outlet />
      </Box>
    </Box>
  );
}
