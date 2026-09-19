import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'

// Install routing before rendering so App can use RouterView and RouterLink immediately.
// Mount connects the root component to the empty #app element in index.html.
createApp(App).use(router).mount('#app')
