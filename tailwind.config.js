/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        sand: '#E8DFD0',
        charcoal: '#3E3D38',
        coral: '#FF6B35',
        turquoise: '#00A896',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
      },
      boxShadow: {
        soft: '0 4px 12px rgba(62, 61, 56, 0.08)',
        lift: '0 8px 24px rgba(62, 61, 56, 0.12)',
      },
    },
  },
  plugins: [],
};
