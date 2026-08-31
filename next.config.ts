import type { NextConfig } from 'next';

const isGitHubPagesBuild = process.env.GITHUB_PAGES_BUILD === 'true';

const nextConfig: NextConfig = isGitHubPagesBuild
  ? {
      output: 'export',
      basePath: process.env.PAGES_BASE_PATH,
      trailingSlash: true,
    }
  : {};

export default nextConfig;
