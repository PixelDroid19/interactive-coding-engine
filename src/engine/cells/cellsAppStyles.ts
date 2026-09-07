export const APP_COMPONENT_STYLES: Record<string, string> = {
  'academy-home-page': `
:host { display: block; min-height: 100vh; background: #eef2f6; color: #102a43; font-family: Inter, system-ui, sans-serif; }
main { max-width: 64rem; margin: auto; padding: clamp(1.5rem,5vw,4rem); }
header { display: grid; gap: 1rem; margin-bottom: 2rem; }
.eyebrow { color: #067a6f; font-size: .72rem; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; }
h1 { margin: 0; max-width: 12ch; font-size: clamp(2.2rem,7vw,4.5rem); line-height: .95; }
nav { display: flex; gap: .65rem; flex-wrap: wrap; }
nav button { border: 1px solid #b8c6d4; border-radius: 999px; padding: .65rem 1rem; background: white; color: #102a43; cursor: pointer; }
.language { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
.language span { font-weight: 800; }
.language button[aria-pressed="true"] { border-color: #067a6f; background: #d9f4ed; color: #045c54; }
.grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(15rem,1fr)); gap: 1rem; }
`,
  'academy-product-detail-page': `
:host { display: grid; min-height: 100vh; place-items: center; background: #e6eff7; color: #102a43; font-family: Inter, system-ui, sans-serif; }
main { width: min(38rem, calc(100% - 2rem)); padding: 2.5rem; border-radius: 1.5rem; background: white; box-shadow: 0 1.2rem 3rem rgb(16 42 67 / 16%); }
.visual { display: grid; height: 12rem; place-items: center; border-radius: 1rem; background: linear-gradient(135deg, #ffe4a8, #f7b267); font-size: 4rem; }
button { margin-top: 1rem; border: 0; border-radius: 999px; padding: .75rem 1rem; background: #0b6e69; color: white; font-weight: 800; cursor: pointer; }
`,
  'academy-not-found-page': `
:host { display: grid; min-height: 100vh; place-items: center; background: #102a43; color: white; font-family: Inter, system-ui, sans-serif; text-align: center; }
main { padding: 2rem; }
.code { color: #7ee0cf; font-size: clamp(5rem, 18vw, 10rem); font-weight: 950; line-height: 1; }
button { border: 1px solid #7ee0cf; border-radius: 999px; padding: .8rem 1.2rem; background: transparent; color: white; font-weight: 800; cursor: pointer; }
`,
  'academy-favorites-page': `
:host { display: block; min-height: 100vh; background: #fff2e2; color: #3f2d20; font-family: Inter, system-ui, sans-serif; }
main { max-width: 56rem; margin: auto; padding: 3rem 1.5rem; }
.shelf { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 1rem; }
button { border: 0; background: transparent; color: #8a3b12; font-weight: 800; cursor: pointer; }
`,
  'academy-cart-page': `
:host { display: block; min-height: 100vh; background: #f3f8f4; color: #173b2c; font-family: Inter, system-ui, sans-serif; }
main { max-width: 46rem; margin: auto; padding: 3rem 1.5rem; }
.row, .total { display: flex; justify-content: space-between; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid #b8cfc1; }
.total { margin-top: 1rem; border: 0; font-size: 1.25rem; font-weight: 900; }
button { border: 0; border-radius: 999px; padding: .75rem 1rem; background: #176b4d; color: white; font-weight: 800; cursor: pointer; }
`,
  'academy-search-page': `
:host { display: block; min-height: 100vh; background: #eef1ff; color: #20234a; font-family: Inter, system-ui, sans-serif; }
main { max-width: 58rem; margin: auto; padding: 3rem 1.5rem; }
label { display: grid; gap: .5rem; font-weight: 800; }
input { min-height: 3.25rem; border: 2px solid #5962c8; border-radius: 1rem; padding: 0 1rem; background: white; }
.results { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 1rem; margin-top: 1.5rem; }
button { border: 0; background: transparent; color: #343b9b; font-weight: 800; cursor: pointer; }
`,
  'academy-product-card': `
:host { display: block; }
article { display: grid; gap: .8rem; min-height: 12rem; padding: 1.25rem; border: 1px solid #cbd6e2; border-radius: 1.25rem; background: white; box-shadow: 0 .7rem 1.8rem rgb(16 42 67 / 10%); }
h2, p { margin: 0; }
.price { color: #067a6f; font-size: 1.25rem; font-weight: 900; }
button { align-self: end; justify-self: start; border: 0; border-radius: 999px; padding: .7rem 1rem; background: #102a43; color: white; font-weight: 800; cursor: pointer; }
`,
};
