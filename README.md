# Vue 3 + Vite + Typescript + Tailwindcss + Fontawesome

This template should help get you started developing with Vue 3 in Vite. The template uses [Vue 3](https://vuejs.org/), [Vite](https://vitejs.dev/), [Tailwind css](https://tailwindcss.com/) and [Fontawesome 6](https://fontawesome.com/).

## Vite

- @ path is defined as ./src
- ~ path is defined as ./node_modules
- § path is defined as ./fontawesome
- npm run dev : launch development environment and serve it to http://localhost:5173
- npm run build : compile, optimize and minify to dist/ directory
- npm run preview : serve dist/ directory to http://localhost:4173

## Howto

- Simply copy this repo with "Use this template" or fork it
- Clone your new repo
- issue "npm i" in your local clone 
- issue "npm run dev"
- browser http://localhost:5173

## Tailwind css

- Tailwind is embedded with my default theme in tailwindcss.config.cjs
- All classes are availables in development environment (usefull for UI debug with devtools)
- Built css is parsed by Purgecss for removing all unused classes, take a look to postcss.config.cjs 

## Fontawesome 6

- Fontawesome 6 Free is embedded
- Please use fas, fal, fab… classes rather thant fa-solid, fa-light… (see §/fontawesome/fontawesomeminify.ts)
- When you build your app, §/fontawesome/fontawesomeminify.ts is run for subsetting roughly all Fontawesome fonts.
- The main idea is to scan the produced css files, extract all unicode codes and try to subsetting all fa-*.ttf fonts with this unicode list. When done woff/woff2 are derived from the minifyied Truetype font.
- It is very usefull if you use a few icon and probably divide by 30 your Fontawesome fonts size. (remove the task in package.json if you don't want)

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## License

- [MIT](https://github.com/eltorio/vue-vite-tailwindcss-fontawesome/blob/main/LICENSE.md) for my work
- others are under their own license
