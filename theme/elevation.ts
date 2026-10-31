// Deliberadamente `any`: estos helpers reciben tanto ThemeColors como las
// paletas locales de cada pantalla (useScreenColors, con distintos shapes,
// muchas sin campo `primary`) — intentar tipar esa unión exactamente termina
// peleando con TS por casos límite. Cuando la paleta no tiene `primary`, hay
// que pasar `tint` explícito.
type Tintable = any;
const FALLBACK_TINT = '#000000';

// ─── Escala de radios y espaciados ─────────────────────────────────────────────
// Usar estos valores en vez de números sueltos mantiene el mismo "ritmo"
// visual (esquinas y aire entre elementos) en toda la app.

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

// ─── Sombras ────────────────────────────────────────────────────────────────
// Sombra difusa y tenue, teñida con el color de marca, en vez del negro plano
// de alta opacidad que se usaba antes — se siente más "premium" y menos dura.
// (En Android, `elevation` es lo único que realmente se ve; los demás campos
// solo aplican en iOS, pero se incluyen igual por si acaso.)

export function cardShadow(C: Tintable, tint?: string) {
  return {
    shadowColor: tint ?? C.primary ?? FALLBACK_TINT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  } as const;
}

export function floatingShadow(C: Tintable, tint?: string) {
  return {
    shadowColor: tint ?? C.primary ?? FALLBACK_TINT,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  } as const;
}
