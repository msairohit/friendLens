// ============================================================
// FriendLens — Design System Colors (Multi-theme support)
// ============================================================

export const CyberpunkTheme = {
  colors: {
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
  },
  gradients: {
    primary: ['#6C5CE7', '#A855F7'] as const,
    accent: ['#00D2FF', '#7B68EE'] as const,
    card: ['rgba(20, 20, 31, 0.9)', 'rgba(30, 30, 46, 0.7)'] as const,
    hero: ['#6C5CE7', '#A855F7', '#00D2FF'] as const,
    dark: ['#0A0A0F', '#14141F'] as const,
  }
};

export const EmeraldTheme = {
  colors: {
    background: '#050C08',
    surface: '#0D1C14',
    surfaceElevated: '#152C20',
    surfaceHover: '#1D3C2C',

    primaryStart: '#10B981',
    primaryEnd: '#34D399',
    primary: '#10B981',

    accentStart: '#059669',
    accentEnd: '#14B8A6',
    accent: '#059669',

    success: '#00E676',
    warning: '#FFD600',
    error: '#FF5252',
    info: '#3B82F6',

    textPrimary: '#ECFDF5',
    textSecondary: '#A7F3D0',
    textMuted: '#6EE7B7',
    textInverse: '#050C08',

    starActive: '#FFD700',
    starInactive: '#1E3F30',

    glassBorder: 'rgba(255, 255, 255, 0.08)',
    glassBackground: 'rgba(13, 28, 20, 0.7)',
    glassBorderLight: 'rgba(255, 255, 255, 0.15)',

    graphNodeSelf: '#34D399',
    graphNodeFriend: '#10B981',
    graphNodeFoF: '#059669',
    graphNodeAnonymous: '#1E3F30',
    graphEdgeSolid: 'rgba(16, 185, 129, 0.6)',
    graphEdgeDashed: 'rgba(5, 150, 105, 0.4)',

    depthFriend: '#10B981',
    depthFoF: '#059669',

    divider: 'rgba(255, 255, 255, 0.06)',
    overlay: 'rgba(0, 0, 0, 0.6)',
    shimmer: 'rgba(255, 255, 255, 0.05)',
  },
  gradients: {
    primary: ['#10B981', '#34D399'] as const,
    accent: ['#059669', '#14B8A6'] as const,
    card: ['rgba(13, 28, 20, 0.9)', 'rgba(21, 44, 32, 0.7)'] as const,
    hero: ['#10B981', '#34D399', '#14B8A6'] as const,
    dark: ['#050C08', '#0D1C14'] as const,
  }
};

export const SunsetTheme = {
  colors: {
    background: '#0F0A0A',
    surface: '#1F1414',
    surfaceElevated: '#2F1E1E',
    surfaceHover: '#3F2828',

    primaryStart: '#EF4444',
    primaryEnd: '#F97316',
    primary: '#EF4444',

    accentStart: '#F59E0B',
    accentEnd: '#EC4899',
    accent: '#F59E0B',

    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    textPrimary: '#FFF5F5',
    textSecondary: '#FFD2D2',
    textMuted: '#FFA3A3',
    textInverse: '#0F0A0A',

    starActive: '#FFD700',
    starInactive: '#3F2222',

    glassBorder: 'rgba(255, 255, 255, 0.08)',
    glassBackground: 'rgba(31, 20, 20, 0.7)',
    glassBorderLight: 'rgba(255, 255, 255, 0.15)',

    graphNodeSelf: '#EF4444',
    graphNodeFriend: '#F97316',
    graphNodeFoF: '#EC4899',
    graphNodeAnonymous: '#3F2222',
    graphEdgeSolid: 'rgba(249, 115, 22, 0.6)',
    graphEdgeDashed: 'rgba(236, 72, 153, 0.4)',

    depthFriend: '#F97316',
    depthFoF: '#EC4899',

    divider: 'rgba(255, 255, 255, 0.06)',
    overlay: 'rgba(0, 0, 0, 0.6)',
    shimmer: 'rgba(255, 255, 255, 0.05)',
  },
  gradients: {
    primary: ['#EF4444', '#F97316'] as const,
    accent: ['#F59E0B', '#EC4899'] as const,
    card: ['rgba(31, 20, 20, 0.9)', 'rgba(47, 30, 30, 0.7)'] as const,
    hero: ['#EF4444', '#F97316', '#EC4899'] as const,
    dark: ['#0F0A0A', '#1F1414'] as const,
  }
};

export const OceanTheme = {
  colors: {
    background: '#0A0F14',
    surface: '#141F2B',
    surfaceElevated: '#1E2E40',
    surfaceHover: '#283C52',

    primaryStart: '#2563EB',
    primaryEnd: '#38BDF8',
    primary: '#2563EB',

    accentStart: '#06B6D4',
    accentEnd: '#4F46E5',
    accent: '#06B6D4',

    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    textPrimary: '#F0F7FF',
    textSecondary: '#B8D9FF',
    textMuted: '#80BBFF',
    textInverse: '#0A0F14',

    starActive: '#FFD700',
    starInactive: '#24384E',

    glassBorder: 'rgba(255, 255, 255, 0.08)',
    glassBackground: 'rgba(20, 31, 43, 0.7)',
    glassBorderLight: 'rgba(255, 255, 255, 0.15)',

    graphNodeSelf: '#38BDF8',
    graphNodeFriend: '#2563EB',
    graphNodeFoF: '#4F46E5',
    graphNodeAnonymous: '#24384E',
    graphEdgeSolid: 'rgba(37, 99, 235, 0.6)',
    graphEdgeDashed: 'rgba(79, 70, 229, 0.4)',

    depthFriend: '#2563EB',
    depthFoF: '#4F46E5',

    divider: 'rgba(255, 255, 255, 0.06)',
    overlay: 'rgba(0, 0, 0, 0.6)',
    shimmer: 'rgba(255, 255, 255, 0.05)',
  },
  gradients: {
    primary: ['#2563EB', '#38BDF8'] as const,
    accent: ['#06B6D4', '#4F46E5'] as const,
    card: ['rgba(20, 31, 43, 0.9)', 'rgba(30, 46, 64, 0.7)'] as const,
    hero: ['#2563EB', '#38BDF8', '#4F46E5'] as const,
    dark: ['#0A0F14', '#141F2B'] as const,
  }
};

export const RoseTheme = {
  colors: {
    background: '#120A14',
    surface: '#201224',
    surfaceElevated: '#2E1B33',
    surfaceHover: '#3B2342',

    primaryStart: '#DB2777',
    primaryEnd: '#F472B6',
    primary: '#DB2777',

    accentStart: '#8B5CF6',
    accentEnd: '#F43F5E',
    accent: '#8B5CF6',

    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    textPrimary: '#FFF0F5',
    textSecondary: '#FFB8D1',
    textMuted: '#FF80A9',
    textInverse: '#120A14',

    starActive: '#FFD700',
    starInactive: '#3E2346',

    glassBorder: 'rgba(255, 255, 255, 0.08)',
    glassBackground: 'rgba(32, 18, 36, 0.7)',
    glassBorderLight: 'rgba(255, 255, 255, 0.15)',

    graphNodeSelf: '#F472B6',
    graphNodeFriend: '#DB2777',
    graphNodeFoF: '#F43F5E',
    graphNodeAnonymous: '#3E2346',
    graphEdgeSolid: 'rgba(219, 39, 119, 0.6)',
    graphEdgeDashed: 'rgba(244, 63, 94, 0.4)',

    depthFriend: '#DB2777',
    depthFoF: '#F43F5E',

    divider: 'rgba(255, 255, 255, 0.06)',
    overlay: 'rgba(0, 0, 0, 0.6)',
    shimmer: 'rgba(255, 255, 255, 0.05)',
  },
  gradients: {
    primary: ['#DB2777', '#F472B6'] as const,
    accent: ['#8B5CF6', '#F43F5E'] as const,
    card: ['rgba(32, 18, 36, 0.9)', 'rgba(46, 27, 51, 0.7)'] as const,
    hero: ['#DB2777', '#F472B6', '#F43F5E'] as const,
    dark: ['#120A14', '#201224'] as const,
  }
};

export const Themes = {
  cyberpunk: CyberpunkTheme,
  emerald: EmeraldTheme,
  sunset: SunsetTheme,
  ocean: OceanTheme,
  rose: RoseTheme,
};

export type ThemeKey = keyof typeof Themes;
export type ThemeColors = typeof CyberpunkTheme.colors;
export type ThemeGradients = {
  readonly primary: readonly string[] | readonly [string, string] | readonly [string, string, string];
  readonly accent: readonly string[] | readonly [string, string] | readonly [string, string, string];
  readonly card: readonly string[] | readonly [string, string] | readonly [string, string, string];
  readonly hero: readonly string[] | readonly [string, string] | readonly [string, string, string];
  readonly dark: readonly string[] | readonly [string, string] | readonly [string, string, string];
};

let activeThemeName: ThemeKey = 'cyberpunk';

export const getActiveThemeName = (): ThemeKey => activeThemeName;
export const setActiveThemeName = (theme: ThemeKey) => {
  activeThemeName = theme;
};

// Dynamic Proxies for backward compatibility and static use cases
export const Colors = new Proxy({} as ThemeColors, {
  get(_, prop) {
    const currentTheme = Themes[activeThemeName] || CyberpunkTheme;
    return (currentTheme.colors as any)[prop];
  }
});

export const Gradients = new Proxy({} as ThemeGradients, {
  get(_, prop) {
    const currentTheme = Themes[activeThemeName] || CyberpunkTheme;
    return (currentTheme.gradients as any)[prop];
  }
});
