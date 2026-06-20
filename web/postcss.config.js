// PostCSS pipeline for Tailwind: tailwindcss expands the utility/component
// layers, autoprefixer adds vendor prefixes for the evergreen target browsers.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
