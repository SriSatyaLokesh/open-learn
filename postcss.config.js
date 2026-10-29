/**
 * @file postcss.config.js
 * @description PostCSS configuration for OpenLearn.
 * Sets up Tailwind CSS compilation pipeline and vendor autoprefixer for cross-browser support.
 */

const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
