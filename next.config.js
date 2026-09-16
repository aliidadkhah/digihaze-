/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/shop/salt",
        destination: "/shop/salt-nicotine",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
