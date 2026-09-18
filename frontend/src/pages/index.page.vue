<template>
  <div class="page-container">
    <div class="bg-glow"></div>

    <div class="home-card">
      <h1 class="home-title">{{ i18n.t('LMS') }}</h1>
      <p class="home-subtitle">{{ i18n.t('LMS Project. Login Below.') }}</p>
      
      <router-link to="/login" class="home-action-btn">
        {{ i18n.t('Login') }}
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { i18n } from '../scripts/translation.script'
</script>

<style scoped>
/* Reuse the page-container and bg-glow from Login page */
.page-container {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
  min-height: calc(100vh - 60px);
}

.bg-glow {
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(0, 123, 255, 0.15) 0%, rgba(0,0,0,0) 70%);
  border-radius: 50%;
  filter: blur(60px);
  animation: orbit 15s infinite linear;
}

@keyframes orbit {
  from { transform: rotate(0deg) translateX(150px) rotate(0deg); }
  to { transform: rotate(360deg) translateX(150px) rotate(-360deg); }
}

.home-card {
  position: relative;
  z-index: 10;
  text-align: center;
  width: 100%;
  max-width: 480px;
  padding: 4rem 2rem;
  background: rgba(10, 10, 10, 0.7);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 32px;
}

.home-title {
  font-size: 5rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
  background: linear-gradient(to bottom, #ffffff, #007bff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -2px;
}

.home-subtitle {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 3rem;
}

.home-action-btn {
  display: inline-block;
  padding: 16px 60px;
  background: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 16px;
  font-weight: 700;
  font-size: 1.1rem;
  transition: 0.3s;
  box-shadow: 0 10px 30px rgba(0, 123, 255, 0.3);
}

.home-action-btn:hover {
  background: #0056b3;
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(0, 123, 255, 0.5);
}
</style>