import * as ImagePicker from 'expo-image-picker';
import type { JobDescriptionImagePicker } from '../../domain/jobDescriptionImport';

export class ExpoJobDescriptionImagePicker implements JobDescriptionImagePicker {
  async pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    return result.canceled ? null : { uri: result.assets[0]?.uri ?? '' };
  }
}
