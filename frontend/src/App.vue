<template>
  <div id="app-root">
    <nav class="top-nav">
      <div class="nav-section-left">
        <router-link v-if="!isLoggedIn" to="/" class="nav-item">
          {{ i18n.t('Home') }}
        </router-link>

        <template v-if="isLoggedIn">
          <router-link to="/dashboard" class="nav-item">
            {{ i18n.t('Dashboard') }}
          </router-link>
          
          <router-link
            v-if="isStudent"
            to="/grades"
            class="nav-item"
          >
            {{ i18n.t('Grades') }}
          </router-link>
        </template>
      </div>
      
      <div class="nav-section-right">
        <span class="brand-logo">{{ i18n.t('LMS') }}</span>
      </div>
    </nav>

    <main class="main-body">
      <router-view />
    </main>

    <div class="corner-controls">
      <button class="glass-btn" @click="toggleLang">
        {{ i18n.lang === 'en' ? i18n.t('ES') : i18n.t('EN') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { i18n } from './scripts/translation.script'

const route = useRoute()
const isLoggedIn = ref(false)
const userLevel = ref(null)

const isStudent = computed(() => userLevel.value === 2)

const syncAuth = async () => {
  const token = localStorage.getItem('Access-Token')
  if (!token) {
    isLoggedIn.value = false
    userLevel.value = null
    return
  }

  isLoggedIn.value = true

  try {
    const res = await axios.get('/me', {
      headers: { Authorization: token }
    })
    userLevel.value = res.data.user.level
  } catch (err) {
    console.error('Failed to fetch user info', err)
    userLevel.value = null
  }
}

onMounted(syncAuth)

// Watch the route path so the nav updates immediately when switching pages
watch(() => route.path, () => {
  syncAuth()
})

const toggleLang = () => {
  i18n.setLang(i18n.lang === 'en' ? 'es' : 'en')
}
</script>

<style>
/* GLOBAL STYLES */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  background-color: #000000;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
}

#app-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* NAVIGATION */
.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 3rem;
  background: #050505;
  border-bottom: 1px solid #1a1a1a;
  height: 60px;
}

.nav-section-left {
  display: flex;
  align-items: center;
  gap: 25px; /* Spacing between Dashboard and Grades */
}

.nav-item {
  color: #ffffff;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: 0.3s ease;
}

.nav-item:hover, .router-link-active {
  color: #007bff;
}

.brand-logo {
  font-weight: 900;
  font-size: 1.3rem;
  background: linear-gradient(45deg, #00d4ff, #007bff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.main-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}


.corner-controls {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999;
}

.glass-btn {
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid #333;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  backdrop-filter: blur(5px);
  transition: 0.2s;
}

.glass-btn:hover {
  border-color: #007bff;
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.4);
}
</style>