/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ant Design Color System
        foreground: "#000000E0",
        background: "#ffffff",
        muted: "#f5f5f5",
        "muted-foreground": "#00000073",
        border: "#d9d9d9",
        input: "#ffffff",
        primary: "#1677FF", // Ant Design Brand Color (Blue-6)
        "primary-foreground": "#ffffff",
        secondary: "#f5f5f5",
        "secondary-foreground": "#000000E0",
        destructive: "#ff4d4f", // Ant Design Error Color
        "destructive-foreground": "#ffffff",
        ring: "#1677FF",
        // Ant Design Blue Palette
        blue: {
          1: "#E6F4FF",
          2: "#BAE0FF",
          3: "#91CAFF",
          4: "#69B1FF",
          5: "#4096FF",
          6: "#1677FF",
          7: "#0958D9",
          8: "#003EB3",
          9: "#002C8C",
          10: "#001D66",
        },
        // Ant Design Functional Colors
        success: "#52c41a",
        warning: "#faad14",
        error: "#ff4d4f",
        info: "#1677FF",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      spacing: {
        "18": "4.5rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
