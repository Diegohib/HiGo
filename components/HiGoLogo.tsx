import { Image, Text, View } from 'react-native';

// ─── Marca HiGo ───────────────────────────────────────────────────────────────
// El higo del logo original (el mismo de assets/icon.png). logo-mark.png es esa
// marca recortada en blanco sobre fondo transparente, así que `tintColor` la
// pinta del color que se pida.

const MARK = require('../assets/logo-mark.png');

export function HiGoMark({ size = 40, color = '#5C2A7A' }: { size?: number; color?: string }) {
  return (
    <Image
      source={MARK}
      style={{ width: size, height: size, tintColor: color }}
      resizeMode="contain"
    />
  );
}

// ─── Logotipo integrado: HIG + higo como "O" ──────────────────────────────────
// `size` es la altura total del bloque; el alto de las mayúsculas ronda
// 0.62 · size.

export default function HiGoLogo({
  size = 36,
  color = '#5C2A7A',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: size }}>
      <Text
        style={{
          fontFamily: 'Poppins_800ExtraBold',
          fontSize: size * 0.92,
          lineHeight: size,
          letterSpacing: -size * 0.03,
          color,
          includeFontPadding: false,
        }}
      >
        HIG
      </Text>
      <View style={{ marginLeft: size * 0.04, marginTop: -size * 0.08 }}>
        <HiGoMark size={size * 0.84} color={color} />
      </View>
    </View>
  );
}
