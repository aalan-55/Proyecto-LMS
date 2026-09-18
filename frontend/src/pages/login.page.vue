<template>
  <div class="page-container">
    <div class="bg-glow"></div>

    <Transition name="slide-fade">
      <div v-if="showErrorPopup" class="error-popup">
        <div class="popup-content">
          <span class="warning-icon">⚠️</span>
          <p>{{ i18n.t('Invalid Credentials') }}</p>
          <button @click="showErrorPopup = false" class="close-popup">×</button>
        </div>
        <div class="progress-bar"></div>
      </div>
    </Transition>

    <div class="login-card">
      <h1 class="login-title">{{ i18n.t('Login') }}</h1>
      
      <form class="login-form" @submit.prevent="performLogin">
        <div class="input-group">
          <label>{{ i18n.t('Full Name / Email') }}</label>
          <input 
            v-model="loginForm.username" 
            type="text" 
            :placeholder="i18n.t('e.g., John Doe / john@example.com')"
            :disabled="isLoggingIn"
            required
          />
          <span v-if="loginFormErrors.username" class="error-text">{{ loginFormErrors.username }}</span>
        </div>

        <div class="input-group">
          <label>{{ i18n.t('Password') }}</label>
          <input 
            v-model="loginForm.password" 
            type="password" 
            :placeholder="i18n.t('Enter your password')"
            :disabled="isLoggingIn"
            required
          />
          <span v-if="loginFormErrors.password" class="error-text">{{ loginFormErrors.password }}</span>
        </div>

        <button type="submit" class="login-action-btn" :disabled="isLoggingIn">
          <span v-if="!isLoggingIn">{{ i18n.t('Login') }}</span>
          <span v-else class="loader"></span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import joi from 'joi'
import { i18n } from '../scripts/translation.script'

const router = useRouter()
const showErrorPopup = ref(false)
const isLoggingIn = ref(false) // For the loading state

const loginForm = reactive({ username: '', password: '' })
const loginFormErrors = reactive({ username: '', password: '' })

const loginSchema = joi.object({
  username: joi.string().min(3).required(),
  password: joi.string().min(6).required()
})

const performLogin = async () => {
  loginFormErrors.username = ''
  loginFormErrors.password = ''
  isLoggingIn.value = true

  try {
    await loginSchema.validateAsync(loginForm, { abortEarly: false })
    
    // Make sure your axios baseURL is pointing to your backend /v1/ path
    const response = await axios.post('/login', loginForm)
    
    // MATCHED WITH BACKEND: access_token and refresh_token
    if (response.data.access_token) {
      localStorage.setItem('Access-Token', response.data.access_token)
      localStorage.setItem('Refresh-Token', response.data.refresh_token)
      
      // Navigate to dashboard
      router.push('/dashboard')
    }
  } catch (error) {
    if (error.isJoi) {
      error.details.forEach(err => { loginFormErrors[err.context.key] = err.message })
    } else {
      showErrorPopup.value = true
      setTimeout(() => { showErrorPopup.value = false }, 4000)
    }
  } finally {
    isLoggingIn.value = false
  }
}
</script>

<style scoped>
/* Keeping all your previous styles */
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

.login-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 400px;
  padding: 3.5rem;
  background: rgba(10, 10, 10, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.login-title {
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 2rem;
  background: linear-gradient(to bottom, #fff, #888);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.input-group {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 0.75rem;
  color: #777;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.input-group input {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #222;
  border-radius: 12px;
  padding: 14px;
  color: white;
  transition: 0.3s;
}

.input-group input:focus {
  outline: none;
  border-color: #007bff;
}

.login-action-btn {
  width: 100%;
  padding: 16px;
  margin-top: 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-action-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Loading Spinner */
.loader {
  width: 20px;
  height: 20px;
  border: 2px solid #FFF;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Popup and Error Styles */
.error-popup {
  position: absolute;
  top: 30px;
  right: 30px;
  z-index: 100;
  background: rgba(20, 10, 10, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 77, 77, 0.3);
  padding: 16px 20px;
  border-radius: 14px;
}
.popup-content { display: flex; align-items: center; gap: 12px; color: #fff; }
.progress-bar {
  position: absolute;
  bottom: 0; left: 0; height: 3px;
  background: #ff4d4d; width: 100%;
  animation: timer 4s linear forwards;
}
@keyframes timer { from { width: 100%; } to { width: 0%; } }
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.4s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(50px); opacity: 0; }
.error-text { color: #ff4d4d; font-size: 0.8rem; }
</style>