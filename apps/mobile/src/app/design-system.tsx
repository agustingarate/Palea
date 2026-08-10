import { Redirect } from 'expo-router';
import { DesignSystemCatalogScreen } from '@/common/presentation/DesignSystemCatalogScreen';

export default function DesignSystemRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <DesignSystemCatalogScreen />;
}
