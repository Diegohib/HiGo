import { View, Image, StyleSheet } from 'react-native';
import Text from './Text';

type Props = {
  name?: string;
  photoUri?: string;
  size?: number;
  bg?: string;
  textColor?: string;
};

export default function Avatar({ name, photoUri, size = 46, bg = 'rgba(255,255,255,0.2)', textColor = '#FFFFFF' }: Props) {
  const style = { width: size, height: size, borderRadius: size / 2 };

  if (photoUri) {
    return <Image source={{ uri: photoUri }} style={[styles.image, style]} />;
  }

  return (
    <View style={[styles.circle, style, { backgroundColor: bg }]}>
      <Text style={[styles.initial, { fontSize: size * 0.42, color: textColor }]}>
        {name?.[0]?.toUpperCase() ?? '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    backgroundColor: '#EDE7F6',
  },
  initial: {
    fontWeight: '800',
  },
});
