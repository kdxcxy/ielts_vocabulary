/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#b4005d',
        'primary-container': '#ff6fa2',
        tertiary: '#554db5',
        surface: '#fff4f7',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#ffecf3',
        'surface-container': '#ffe6ef',
        'surface-container-high': '#ffdfe9',
        'surface-container-highest': '#ffd9e4',
        'on-surface': '#482139',
        'on-primary': '#ffffff',
        'on-primary-container': '#3d0020',
        'outline-variant': 'rgba(72, 33, 57, 0.15)',
      },
      borderRadius: {
        'full': '9999px',
        'xl': '2rem',
      },
      backdropBlur: {
        'glass': '20px',
      },
      fontSize: {
        'display-lg': '3.5rem',
        'display-md': '2.5rem',
        'headline-sm': '1.5rem',
        'headline-md': '1.75rem',
        'body-lg': '1rem',
        'body-md': '0.875rem',
        'body-sm': '0.75rem',
        'label-sm': '0.6875rem',
      },
    },
  },
  plugins: [],
}
