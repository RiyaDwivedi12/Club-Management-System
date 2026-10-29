import {
  Users, Calendar, Trophy, Vote, Medal, User, MessageSquare, Award,
  Shield, Crown, Timer, Building2, Swords, CreditCard
} from 'lucide-react';

// Portal navigation shared by the desktop sidebar and the mobile menu.
export const studentNavItems = [
  { name: 'Clubs & Hub', path: '/clubs', icon: Users },
  { name: 'Pay Membership Fee', path: '/membership-fees', icon: CreditCard },
  { name: 'My Profile', path: '/profile', icon: User },
  { name: 'Messages', path: '/chat', icon: MessageSquare },
  { name: 'Events', path: '/events', icon: Calendar },
  { name: 'Matches', path: '/matches', icon: Swords },
  { name: 'Tournaments', path: '/tournaments', icon: Trophy },
  { name: 'Leaderboard', path: '/leaderboard', icon: Medal },
  { name: 'Certificates', path: '/certificates', icon: Award },
  { name: 'Elections', path: '/elections', icon: Vote },
];

const PANELS = {
  admin: { name: 'Admin Panel', path: '/admin', icon: Shield },
  president: { name: 'President Panel', path: '/president', icon: Crown },
  vice_president: { name: 'Vice President Panel', path: '/vice-president', icon: Award },
  faculty: { name: 'Faculty Coordinator', path: '/faculty', icon: Building2 },
  referee: { name: 'Referee Terminal', path: '/referee', icon: Timer },
};

// The role's own management panel (used for the header quick-switch button).
export const getRolePanel = (role) => PANELS[role] || null;

// Management panels visible in the sidebar for a role. Admins can open every panel.
export const getLeadershipItems = (role) => {
  if (role === 'admin') {
    return [
      PANELS.admin,
      { ...PANELS.president, name: 'President Dashboard' },
      { ...PANELS.vice_president, name: 'Vice President' },
      PANELS.faculty,
      PANELS.referee,
    ];
  }
  return PANELS[role] ? [PANELS[role]] : [];
};

export const getPortalTitle = (role) => {
  switch (role) {
    case 'admin': return 'Admin Control';
    case 'president': return 'President Portal';
    case 'vice_president': return 'Vice President';
    case 'faculty': return 'Faculty Portal';
    case 'referee': return 'Referee Terminal';
    default: return 'Student Portal';
  }
};

export const formatRole = (role = 'student') => role.replace('_', ' ');
