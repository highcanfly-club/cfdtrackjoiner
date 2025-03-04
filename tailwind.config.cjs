/*!
=========================================================
* © 2024 Ronan LE MEILLAT for High Can Fly
=========================================================
This website use:
- Vite, Vue3, FontAwesome 6, TailwindCss 3
- And many others
*/
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  // safelist: (process.env.NODE_ENV !== 'development') ? [] : [{ pattern: /.*/ }], // DON'T DO THAT FOR NORMAL DEVELOPMENT - ONLY FOR LIVE MODIFICATIONS IN DEVTOOLS
  theme: {
    extend: {
      colors: {
        hcfdark: "#0e6835",
        hcflight: "#95be1f",
        hcfcardinal: "#882647",
        hcfgreen: "#39B54A",
        "gdt": {
          "50": "#646470",
          "100": "#5a5a66",
          "200": "#50505c",
          "300": "#464652",
          "400": "#3c3c48",
          "500": "#32323e",
          "600": "#282834",
          "700": "#1e1e2a",
          "800": "#141420",
          "900": "#0a0a16"
        },
        camelot: {
          "50": "#f9f4f6",
          "100": "#f3e9ed",
          "200": "#e1c9d1",
          "300": "#cfa8b5",
          "400": "#ac677e",
          "500": "#882647",
          "600": "#7a2240",
          "700": "#661d35",
          "800": "#52172b",
          "900": "#431323"
        },
        watermelon: {
          "50": "#f3f7f5",
          "100": "#e7f0eb",
          "200": "#c3d9cd",
          "300": "#9fc3ae",
          "400": "#569572",
          "500": "#0e6835",
          "600": "#0d5e30",
          "700": "#0b4e28",
          "800": "#083e20",
          "900": "#07331a"
        },
        pistachio: {
          "50": "#fafcf4",
          "100": "#f4f9e9",
          "200": "#e5efc7",
          "300": "#d5e5a5",
          "400": "#b5d262",
          "500": "#95be1f",
          "600": "#86ab1c",
          "700": "#708f17",
          "800": "#597213",
          "900": "#495d0f"
        },
        apple: {
          "50": "#f5fbf6",
          "100": "#ebf8ed",
          "200": "#ceedd2",
          "300": "#b0e1b7",
          "400": "#74cb80",
          "500": "#39B54A",
          "600": "#33a343",
          "700": "#2b8838",
          "800": "#226d2c",
          "900": "#1c5924"
        }
      },
      fontSize: {
        "55": "55rem",
        'xs': '.75rem',
      },
      opacity: {
        "80": ".8"
      },
      zIndex: {
        "2": 2,
        "3": 3
      },
      inset: {
        "-100": "-100%",
        "-225-px": "-225px",
        "-160-px": "-160px",
        "-150-px": "-150px",
        "-94-px": "-94px",
        "-50-px": "-50px",
        "-29-px": "-29px",
        "-20-px": "-20px",
        "25-px": "25px",
        "40-px": "40px",
        "95-px": "95px",
        "145-px": "145px",
        "195-px": "195px",
        "210-px": "210px",
        "260-px": "260px"
      },
      height: {
        "95-px": "95px",
        "70-px": "70px",
        "350-px": "350px",
        "500-px": "500px",
        "600-px": "600px",
        "screen-1/2": "50vh",
        "screen-1/3": "calc(100vh / 3)",
        "screen-2/3": "calc(2 * 100vh / 3)",
        "screen-1/4": "calc(100vh / 4)",
        "screen-3/4": "calc(3 * 100vh / 4)",
        "screen-1/5": "calc(100vh / 5)",
        "screen-2/5": "calc(2 * 100vh / 5)",
        "screen-3/5": "calc(3 * 100vh / 5)",
        "screen-4/5": "calc(4 * 100vh / 5)",
        "screen-1/6": "calc(100vh / 6)",
        "screen-5/6": "calc(5 * 100vh / 6)",
        "screen-1/7": "calc(100vw / 7)",
        "screen-1/8": "calc(100vw / 8)",
      },
      minHeight: {
        "95-px": "95px",
        "70-px": "70px",
        "350-px": "350px",
        "500-px": "500px",
        "600-px": "600px",
        "screen-75": "75vh",
        "screen-1/2": "50vh",
        "screen-1/3": "calc(100vh / 3)",
        "screen-2/3": "calc(2 * 100vh / 3)",
        "screen-1/4": "calc(100vh / 4)",
        "screen-3/4": "calc(3 * 100vh / 4)",
        "screen-1/5": "calc(100vh / 5)",
        "screen-2/5": "calc(2 * 100vh / 5)",
        "screen-3/5": "calc(3 * 100vh / 5)",
        "screen-4/5": "calc(4 * 100vh / 5)",
        "screen-1/6": "calc(100vh / 6)",
        "screen-5/6": "calc(5 * 100vh / 6)",
        "screen-1/8": "calc(100vh / 8)"
      },
      maxHeight: {
        "860-px": "860px"
      },
      maxWidth: {
        "100-px": "100px",
        "120-px": "120px",
        "150-px": "150px",
        "180-px": "180px",
        "200-px": "200px",
        "210-px": "210px",
        "580-px": "580px"
      },
      minWidth: {
        "140-px": "140px",
        "48": "12rem",
        "1/2": "50%",
        "1/3": "33.33%",
        "2/3": "66.66%",
        "3/4": "75%"
      },
      backgroundSize: {
        full: "100%"
      }
    }
  },
  variants: [
    "responsive",
    "group-hover",
    "focus-within",
    "first",
    "last",
    "odd",
    "even",
    "hover",
    "focus",
    "active",
    "visited",
    "disabled"
  ],
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
}
