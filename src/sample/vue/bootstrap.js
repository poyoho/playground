import { createApp as _createApp } from "vue"
import App from "./App.vue"
import enhanceApp from "./main.ts"

if (window.__app__) {
  window.__app__.unmount()
  document.getElementById('app').innerHTML = ''
}
document.getElementById('__sfc-styles').innerHTML = window.__css__

const app = window.__app__ = _createApp(App)
app.config.errorHandler = e => console.error(e)

await enhanceApp({ app })

app.mount('#app')

