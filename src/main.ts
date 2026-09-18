import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'

// Register routing before mounting the shared app shell.
createApp(App).use(router).mount('#app')
