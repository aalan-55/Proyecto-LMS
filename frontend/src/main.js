import { createApp } from 'vue'
import App from './App.vue'
import axios from 'axios'

import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

axios.defaults.baseURL = 'http://localhost:3000/v1' 
axios.defaults.headers.common['Content-Type'] = 'application/json'

const app = createApp(App)

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('Access-Token')
  
  if (to.path.includes('dashboard') && !token) {
    next('/login')
  } 
  // If logged in and trying to go to login page, send to dashboard
  else if (to.path === '/login' && token) {
    next('/dashboard')
  }
  else {
    next()
  }
})

// 3. Make Axios available globally (optional but helpful)
app.config.globalProperties.$axios = axios

app.use(router)
app.mount('#app')