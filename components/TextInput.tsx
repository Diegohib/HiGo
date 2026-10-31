import { forwardRef } from 'react';
import { TextInput as RNTextInput, TextInputProps } from 'react-native';
import { fontFamilyForStyle } from '../theme/fontFamily';

// Mismo reemplazo drop-in que components/Text.tsx, para inputs.
const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput({ style, ...rest }, ref) {
  return <RNTextInput ref={ref} {...rest} style={[{ fontFamily: fontFamilyForStyle(style) }, style]} />;
});

export default TextInput;
