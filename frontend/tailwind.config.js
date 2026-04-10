/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1D9BF0',
        secondary: '#0052FF',
        accent: '#F0B90B',
        dark: '#0B0E11',
        darker: '#181A20',
        success: '#0ECB81',
        danger: '#F6465D',
      },
    },
  },
  plugins: [],
}
