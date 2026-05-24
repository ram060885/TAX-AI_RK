import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.taxai.app',
  appName: 'Indian Tax AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
