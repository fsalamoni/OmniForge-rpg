import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import path from 'path';

const requiredFirebaseEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const isMissingOrPlaceholder = (value) =>
  !value || /^(your_|.*_here$)/i.test(value) || value.includes('your_project_id');

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  if (command === 'build' && process.env.CI) {
    const invalidVars = requiredFirebaseEnvVars.filter((key) => isMissingOrPlaceholder(env[key]));

    if (invalidVars.length > 0) {
      throw new Error(
        `Firebase configuration is missing or uses placeholder values: ${invalidVars.join(', ')}. ` +
        'Configure these GitHub Actions secrets before deploying.'
      );
    }
  }

  return {
    plugins: [react()],
    base: '/omniforge/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  };
});
