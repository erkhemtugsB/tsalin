/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#0A2342",
          800: "#102F5A",
          700: "#173B70"
        }
      }
    }
  },
  plugins: []
};
