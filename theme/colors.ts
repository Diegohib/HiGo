export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  primaryDark: string;
  primaryFaint: string;
  text: string;
  textSoft: string;
  textFaint: string;
  border: string;
  white: string;
  success: string;
  successFaint: string;
  danger: string;
  dangerFaint: string;
  warning: string;
  warningFaint: string;
  headerGradient: [string, string];
  statusBarStyle: 'light-content' | 'dark-content';
}

export const lightColors: ThemeColors = {
  background:    '#F7F5FF',
  surface:       '#FFFFFF',
  surfaceAlt:    '#EDE7F6',
  primary:       '#3D1F8B',
  primaryDark:   '#2D1570',
  primaryFaint:  '#EDE9F8',
  text:          '#1A1A1A',
  textSoft:      '#666666',
  textFaint:     '#9B8EC4',
  border:        '#E0D9F5',
  white:         '#FFFFFF',
  success:       '#2ECC71',
  successFaint:  '#EAFAF1',
  danger:        '#E74C3C',
  dangerFaint:   '#FDECEA',
  warning:       '#F2C94C',
  warningFaint:  '#FFF3CD',
  headerGradient: ['#3D1F8B', '#5B3FB0'],
  statusBarStyle: 'light-content',
};

export const darkColors: ThemeColors = {
  // Antes el fondo y las superficies quedaban casi al mismo tono (poca
  // separación real) y el morado principal era un lila muy aclarado, más
  // genérico que el violeta de marca — igual que se corrigió en el admin-web,
  // acá se profundiza el fondo y se separa mejor de las tarjetas.
  background:    '#100C1C',
  surface:       '#201A38',
  surfaceAlt:    '#2C2450',
  primary:       '#7C4FE0',
  primaryDark:   '#5B35B0',
  primaryFaint:  '#2A2149',
  text:          '#F5F3FF',
  textSoft:      '#B3A6D9',
  textFaint:     '#9184BE',
  border:        '#3A2F63',
  white:         '#FFFFFF',
  success:       '#3DDC84',
  successFaint:  '#1B3324',
  danger:        '#FF6B6B',
  dangerFaint:   '#3A1E1E',
  warning:       '#F2C94C',
  warningFaint:  '#3A3218',
  headerGradient: ['#1E1832', '#3D1F8B'],
  statusBarStyle: 'light-content',
};
