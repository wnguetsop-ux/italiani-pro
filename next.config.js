/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'firebase-admin',
      '@google-cloud/firestore',
      '@google-cloud/storage',
      '@opentelemetry/sdk-trace-node',
    ],
  },
}
module.exports = nextConfig