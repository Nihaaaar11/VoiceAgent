/**
 * Amethyst, Violet, Indigo & Mauve Color System
 */
export const COLOR_SYSTEM = {
  darkAmethystDeep: {
    DEFAULT: "#10002b",
    100: "#030008",
    200: "#060010",
    300: "#090018",
    400: "#0c0021",
    500: "#10002b",
    600: "#310087",
    700: "#5400e4",
    800: "#8843ff",
    900: "#c4a1ff",
  },
  darkAmethyst: {
    DEFAULT: "#240046",
    100: "#07000e",
    200: "#0f001d",
    300: "#16002b",
    400: "#1e0039",
    500: "#240046",
    600: "#52009f",
    700: "#8000f7",
    800: "#aa50ff",
    900: "#d5a7ff",
  },
  indigoInk: {
    DEFAULT: "#3c096c",
    100: "#0c0216",
    200: "#18042b",
    300: "#240541",
    400: "#300757",
    500: "#3c096c",
    600: "#650fb5",
    700: "#8d25ed",
    800: "#b36ef3",
    900: "#d9b6f9",
  },
  indigoVelvet: {
    DEFAULT: "#5a189a",
    100: "#12051f",
    200: "#240a3e",
    300: "#360e5d",
    400: "#47137c",
    500: "#5a189a",
    600: "#7a21d4",
    700: "#9c53e4",
    800: "#bd8ced",
    900: "#dec6f6",
  },
  royalViolet: {
    DEFAULT: "#7b2cbf",
    100: "#180926",
    200: "#31114c",
    300: "#491a73",
    400: "#622399",
    500: "#7b2cbf",
    600: "#954bd6",
    700: "#b078e0",
    800: "#caa5eb",
    900: "#e5d2f5",
  },
  lavenderPurple: {
    DEFAULT: "#9d4edd",
    100: "#200a33",
    200: "#401365",
    300: "#601d98",
    400: "#8127ca",
    500: "#9d4edd",
    600: "#b172e4",
    700: "#c596eb",
    800: "#d8b9f2",
    900: "#ecdcf8",
  },
  mauveMagic: {
    DEFAULT: "#c77dff",
    100: "#2b004d",
    200: "#570099",
    300: "#8200e6",
    400: "#a733ff",
    500: "#c77dff",
    600: "#d399ff",
    700: "#deb3ff",
    800: "#e9ccff",
    900: "#f4e5ff",
  },
  mauve: {
    DEFAULT: "#e0aaff",
    100: "#360055",
    200: "#6b00a9",
    300: "#a100fe",
    400: "#c054ff",
    500: "#e0aaff",
    600: "#e6baff",
    700: "#eccbff",
    800: "#f2dcff",
    900: "#f9eeff",
  },
} as const;

/**
 * Semantic Palette mappings for the Voice Agent
 */
export const PALETTE = {
  // Core UI Roles
  primary: COLOR_SYSTEM.mauveMagic.DEFAULT,       // #c77dff - Active voice & highlight
  accent: COLOR_SYSTEM.mauve.DEFAULT,             // #e0aaff - Glow & bright accents
  secondary: COLOR_SYSTEM.lavenderPurple.DEFAULT, // #9d4edd - Badges & active pills
  textPrimary: COLOR_SYSTEM.mauve[900],           // #f9eeff - Crisp light mauve text
  textSecondary: COLOR_SYSTEM.mauveMagic[800],    // #e9ccff - Subtitles & transcripts
  textMuted: COLOR_SYSTEM.royalViolet[800],       // #caa5eb - Timestamps & subtle telemetry
  surface: COLOR_SYSTEM.darkAmethyst.DEFAULT,     // #240046 - Glass panels & cards
  surfaceElevated: COLOR_SYSTEM.indigoInk.DEFAULT,// #3c096c - Drawers & dropdowns
  background: COLOR_SYSTEM.darkAmethystDeep.DEFAULT, // #10002b - Base deep canvas

  // Compatibility aliases for existing component tokens
  mint: COLOR_SYSTEM.mauve.DEFAULT,              // #e0aaff (Active pulse & glowing text)
  sage: COLOR_SYSTEM.mauveMagic.DEFAULT,         // #c77dff (Secondary accents)
  eucalyptus: COLOR_SYSTEM.royalViolet[800],     // #caa5eb (Muted labels & borders)
  slateDusk: COLOR_SYSTEM.darkAmethyst.DEFAULT,  // #240046 (Card background)
  midnight: COLOR_SYSTEM.darkAmethystDeep.DEFAULT, // #10002b (App canvas background)

  // RGBA Helpers for Canvas, dynamic glows & waveforms
  rgba: {
    primary: (alpha: number) => `rgba(199, 125, 255, ${alpha})`,
    accent: (alpha: number) => `rgba(224, 170, 255, ${alpha})`,
    lavender: (alpha: number) => `rgba(157, 78, 221, ${alpha})`,
    mint: (alpha: number) => `rgba(224, 170, 255, ${alpha})`,
    sage: (alpha: number) => `rgba(199, 125, 255, ${alpha})`,
    eucalyptus: (alpha: number) => `rgba(202, 165, 235, ${alpha})`,
    slateDusk: (alpha: number) => `rgba(36, 0, 70, ${alpha})`,
    midnight: (alpha: number) => `rgba(16, 0, 43, ${alpha})`,
    violetGlow: (alpha: number) => `rgba(123, 44, 191, ${alpha})`,
  },
} as const;
