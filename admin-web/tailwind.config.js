/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      flexGrow: {
        '1': 1,
        '2': 2,
        '3': 3,
        '4': 4,
        '5': 5,
      },
      flexBasis: {
        '1/5': '20%',
        '3/5': '60%',
      }
    },
  },
  plugins: [],
}

