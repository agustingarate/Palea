import type { ExpoConfig } from 'expo/config';
import process from 'node:process';
import { z } from 'zod';

const appVariantSchema = z.enum(['development', 'preview', 'production']);
const paleaEnvironmentSchema = z.enum(['development', 'staging', 'production']);

export function createAppConfig(input: {
  appVariant?: string;
  paleaEnvironment?: string;
}): ExpoConfig {
  const appVariant = appVariantSchema.parse(input.appVariant ?? 'development');
  const paleaEnvironment = paleaEnvironmentSchema.parse(
    input.paleaEnvironment ?? 'development',
  );
  const variants = {
    development: {
      name: 'Palea Staging Dev',
      scheme: 'palea-stg',
      identifier: 'com.palea.app.stg',
    },
    preview: {
      name:
        paleaEnvironment === 'production'
          ? 'Palea Preview PROD'
          : 'Palea Staging',
      scheme: paleaEnvironment === 'production' ? 'palea' : 'palea-stg',
      identifier:
        paleaEnvironment === 'production'
          ? 'com.palea.app'
          : 'com.palea.app.stg',
    },
    production: {
      name: 'Palea',
      scheme: 'palea',
      identifier: 'com.palea.app',
    },
  } as const;
  const variant = variants[appVariant];

  return {
    name: variant.name,
    slug: 'palea',
    version: '0.1.0',
    orientation: 'portrait',
    scheme: variant.scheme,
    userInterfaceStyle: 'automatic',
    platforms: ['ios', 'android', 'web'],
    ios: { bundleIdentifier: variant.identifier },
    android: { package: variant.identifier },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-document-picker',
      [
        'expo-image-picker',
        {
          photosPermission:
            'Palea accede a una imagen elegida para extraer localmente el texto de una descripción.',
          microphonePermission: false,
        },
      ],
      '@react-native-community/datetimepicker',
      ['expo-dev-client', { addGeneratedScheme: appVariant === 'development' }],
    ],
    experiments: {
      typedRoutes: true,
      autolinkingModuleResolution: true,
    },
    web: { bundler: 'metro', output: 'single' },
    extra: {
      router: {},
      appVariant,
      paleaEnvironment,
      eas: { projectId: 'a4373e66-0bae-4b80-8717-fbf8be37c363' },
    },
  };
}

export default createAppConfig({
  appVariant: process.env.APP_VARIANT,
  paleaEnvironment: process.env.EXPO_PUBLIC_PALEA_ENV,
});
