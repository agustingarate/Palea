import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHUNK_SIZE = 1800;

export const secureSessionStorage =
  Platform.OS === 'web'
    ? AsyncStorage
    : {
        async getItem(key: string) {
          const count =
            Number(await SecureStore.getItemAsync(`${key}.count`)) || 0;
          if (!count) return null;
          const chunks = await Promise.all(
            Array.from({ length: count }, (_, index) =>
              SecureStore.getItemAsync(`${key}.${index}`),
            ),
          );
          return chunks.some((chunk) => chunk === null)
            ? null
            : chunks.join('');
        },
        async setItem(key: string, value: string) {
          await this.removeItem(key);
          const chunks = Array.from(
            { length: Math.ceil(value.length / CHUNK_SIZE) },
            (_, index) =>
              value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
          );
          await Promise.all(
            chunks.map((chunk, index) =>
              SecureStore.setItemAsync(`${key}.${index}`, chunk),
            ),
          );
          await SecureStore.setItemAsync(`${key}.count`, String(chunks.length));
        },
        async removeItem(key: string) {
          const count =
            Number(await SecureStore.getItemAsync(`${key}.count`)) || 0;
          await Promise.all(
            Array.from({ length: count }, (_, index) =>
              SecureStore.deleteItemAsync(`${key}.${index}`),
            ),
          );
          await SecureStore.deleteItemAsync(`${key}.count`);
        },
      };
