/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'meow-primary': "#2d4c57",     // Fondo principal
        'meow-accent': "#B65E3E",      // Botones, enlaces
        'meow-form': "#F0E5D8",        // Fondo formularios
        'meow-text': "#1A2B34",        // Texto principal
        'meow-border': "#6F888B",      // Bordes
        'meow-buttonText': "#FFFFFF",  // Texto en botones
        'meow-bg': "#F0E5D8",          // Bg test
        'meow-background': "#dce6e9",  // Gris azulado claro - fondo principal
      }
    }
  },
  plugins: []
}
