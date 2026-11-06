import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

async function pickFromCamera(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permiso necesario', 'Activa el acceso a la cámara para tomar la foto.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true, aspect: [1, 1] });
  return !result.canceled && result.assets[0] ? result.assets[0].uri : null;
}

async function pickFromLibrary(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permiso necesario', 'Activa el acceso a tus fotos para elegir la imagen.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: true, aspect: [1, 1] });
  return !result.canceled && result.assets[0] ? result.assets[0].uri : null;
}

export function pickAvatarPhoto(onPicked: (uri: string) => void) {
  Alert.alert('Foto de perfil', '¿Cómo quieres agregar la imagen?', [
    { text: 'Tomar foto', onPress: async () => { const uri = await pickFromCamera();  if (uri) onPicked(uri); } },
    { text: 'Elegir de galería', onPress: async () => { const uri = await pickFromLibrary(); if (uri) onPicked(uri); } },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}
