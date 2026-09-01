import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import type { ResumeFilePicker } from '../../domain/repositories/ResumeFilePicker';

export class ExpoResumeFilePicker implements ResumeFilePicker {
  async pick() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) return null;
    const asset = result.assets[0];
    if (Platform.OS === 'web' && asset.file) URL.revokeObjectURL(asset.uri);
    return {
      name: asset.name,
      mimeType: asset.mimeType,
      sizeBytes: asset.size,
      readBytes: async () =>
        new Uint8Array(
          await (asset.file
            ? asset.file.arrayBuffer()
            : (await fetch(asset.uri)).arrayBuffer()),
        ),
    };
  }
}
