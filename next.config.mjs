/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "maps.googleapis.com" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["leaflet", "leaflet-heat"],
  },
};

export default nextConfig;
