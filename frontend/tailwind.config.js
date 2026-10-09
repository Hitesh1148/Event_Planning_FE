/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F4F1EA',
        surface: {
          primary: '#FBF9F4',
          secondary: '#EAE7DF',
        },
        primary: {
          DEFAULT: '#294D68',
          hover: '#1e384d',
          light: '#3b688c',
        },
        text: {
          primary: '#222D38',
          secondary: '#65717A',
        },
        accent: {
          secondary: '#527C75',
          warm: '#C17A43',
        },
        border: '#D9D6CD',
        status: {
          success: '#477B62',
          warning: '#B77B35',
          error: '#A64F49',
        }
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        heading: ['"Manrope"', 'sans-serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '12px',
      }
    },
  },
  plugins: [],
}
