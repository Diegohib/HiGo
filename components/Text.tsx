import { forwardRef } from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { fontFamilyForStyle } from '../theme/fontFamily';

// Reemplazo drop-in de <Text> de react-native: aplica automáticamente la
// variante de Poppins que corresponde al fontWeight del estilo, sin tener
// que declarar fontFamily a mano en cada pantalla. Si el estilo ya trae un
// fontFamily explícito, ese gana porque va después
// en el array de estilos.
const Text = forwardRef<RNText, TextProps>(function Text({ style, ...rest }, ref) {
  return <RNText ref={ref} {...rest} style={[{ fontFamily: fontFamilyForStyle(style) }, style]} />;
});

export default Text;
