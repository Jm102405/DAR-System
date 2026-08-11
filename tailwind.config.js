export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#401631',
          light: '#673251',
          dark: '#27101f',
        },
        gold: {
          DEFAULT: '#b88942',
          soft: '#d3ae6c',
          pale: '#f3e7cf',
        },
        canvas: '#faf7f5',
        success: {
          DEFAULT: '#2f9e6b',
          soft: '#e6f2ea',
          border: '#a9d8c1',
        },
        danger: {
          DEFAULT: '#c0392b',
          strong: '#8e1e12',
          soft: '#fbeae8',
          border: '#eec3bd',
        },
        warning: {
          DEFAULT: '#c98a1b',
          soft: '#fdf3e0',
          border: '#eecf9a',
        },
        neutral: {
          soft: '#f1eeeb',
        },
      },
    },
  },
}