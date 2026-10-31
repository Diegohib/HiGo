import { StyleSheet } from 'react-native';

// Mapea cada fontWeight declarado en los estilos existentes a la variante
// estática de Poppins que corresponde. Los archivos .ttf de cada peso se
// cargan una sola vez en App.tsx (@expo-google-fonts/poppins); acá solo se
// elige el nombre de familia correcto según el peso, porque una fuente
// custom cargada como archivo estático no reacciona a `fontWeight` como sí
// lo hace la fuente del sistema.
const WEIGHT_TO_FAMILY: Record<string, string> = {
  '100': 'Poppins_300Light',
  '200': 'Poppins_300Light',
  '300': 'Poppins_300Light',
  normal: 'Poppins_400Regular',
  '400': 'Poppins_400Regular',
  '500': 'Poppins_500Medium',
  '600': 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  '700': 'Poppins_700Bold',
  '800': 'Poppins_800ExtraBold',
  '900': 'Poppins_900Black',
};

export function fontFamilyForStyle(style: unknown): string {
  const flat = (StyleSheet.flatten(style as any) ?? {}) as { fontWeight?: string | number };
  const key = flat.fontWeight == null ? '400' : String(flat.fontWeight);
  return WEIGHT_TO_FAMILY[key] ?? WEIGHT_TO_FAMILY['400'];
}
