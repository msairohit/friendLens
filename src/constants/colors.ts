// ============================================================
// FriendLens — Design System Colors
// ============================================================

export const Colors = {
  // ---- Backgrounds ----
  background: '#0A0A0F',
  surface: '#14141F',
  surfaceElevated: '#1E1E2E',
  surfaceHover: '#252538',

  // ---- Primary Gradient ----
  primaryStart: '#6C5CE7',
  primaryEnd: '#A855F7',
  primary: '#6C5CE7',

  // ---- Accent Gradient ----
  accentStart: '#00D2FF',
  accentEnd: '#7B68EE',
  accent: '#00D2FF',

  // ---- Semantic ----
  success: '#00E676',
  warning: '#FFD600',
  error: '#FF5252',
  info: '#448AFF',

  // ---- Text ----
  textPrimary: '#F0F0F5',
  textSecondary: '#8888AA',
  textMuted: '#555577',
  textInverse: '#0A0A0F',

  // ---- Star Rating ----
  starActive: '#FFD700',
  starInactive: '#333355',

  // ---- Glassmorphism ----
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBackground: 'rgba(20, 20, 31, 0.7)',
  glassBorderLight: 'rgba(255, 255, 255, 0.15)',

  // ---- Graph / Network ----
  graphNodeSelf: '#A855F7',
  graphNodeFriend: '#00D2FF',
  graphNodeFoF: '#7B68EE',
  graphNodeAnonymous: '#555577',
  graphEdgeSolid: 'rgba(0, 210, 255, 0.6)',
  graphEdgeDashed: 'rgba(123, 104, 238, 0.4)',

  // ---- Depth Badges ----
  depthFriend: '#00D2FF',
  depthFoF: '#A855F7',

  // ---- Misc ----
  divider: 'rgba(255, 255, 255, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shimmer: 'rgba(255, 255, 255, 0.05)',
} as const;

// Gradient presets for LinearGradient components
export const Gradients = {
  primary: [Colors.primaryStart, Colors.primaryEnd] as const,
  accent: [Colors.accentStart, Colors.accentEnd] as const,
  card: ['rgba(20, 20, 31, 0.9)', 'rgba(30, 30, 46, 0.7)'] as const,
  hero: ['#6C5CE7', '#A855F7', '#00D2FF'] as const,
  dark: ['#0A0A0F', '#14141F'] as const,
} as const;
