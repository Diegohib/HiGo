// Sustituto de react-native-maps para la web (el paquete solo funciona en iOS/Android).
// metro.config.js redirige el import aquí cuando platform === 'web'.
import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export default class MapView extends React.Component<ViewProps & Record<string, any>> {
  animateToRegion() {}

  render() {
    return (
      <View style={[this.props.style, styles.placeholder]}>
        <Text style={styles.text}>El mapa solo está disponible en la app móvil</Text>
      </View>
    );
  }
}

export const Marker = (_: any) => null;
export const UrlTile = (_: any) => null;

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb' },
  text: { color: '#6b7280', fontSize: 14, textAlign: 'center', padding: 16 },
});
