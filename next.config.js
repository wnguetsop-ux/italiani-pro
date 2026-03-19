/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Empêche Next.js de bundler firebase-admin et ses dépendances
  serverExternalPackages: [
    'firebase-admin',
    '@google-cloud/firestore',
    '@google-cloud/storage',
    '@opentelemetry/sdk-trace-node',
    '@opentelemetry/resources',
    '@opentelemetry/semantic-conventions',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.googleapis.com' },
      { protocol: 'https', hostname: '*.firebasestorage.app' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
}

module.exports = nextConfig