<template>
  <div class="dashboard-container">
    <div class="bg-glow"></div>

    <main class="main-content">
      <header class="top-nav">
        <div class="spacer"></div>
        
        <div 
          v-if="user.username" 
          class="account-section" 
          @mouseenter="show_dropdown = true" 
          @mouseleave="show_dropdown = false"
        >
          <div class="user-pill">
            <div class="user-text">
              <span class="full-name">{{ user.username }}</span>
              <span class="user-level" :class="{ 'root-text': user.level === 0 }">
                {{ get_role_label() }}
              </span>
            </div>
            <div class="avatar">{{ user.username?.charAt(0).toUpperCase() }}</div>
          </div>

          <Transition name="fade-slide">
            <div v-if="show_dropdown" class="dropdown-menu">
              <router-link to="/account" class="dropdown-item">{{ i18n.t('Account Settings') }}</router-link>
              <div class="divider"></div>
              <button @click="logout" class="dropdown-item logout-text">{{ i18n.t('Logout') }}</button>
            </div>
          </Transition>
        </div>
      </header>

      <div class="content-body">
        <div class="header-flex">
          <h1 class="page-title">{{ i18n.t('Overview') }}</h1>
          
          <button v-if="is_staff" class="btn-primary" @click="is_modal_open = true">
            + {{ i18n.t('Create New Class') }}
          </button>
        </div>

        <div class="dashboard-grid">
          <div class="stats-row">
            <template v-if="user.level === 2">
              <div class="stat-card">
                <label>{{ i18n.t('Current Average') }}</label>
                <div class="value blue-text">{{ calculate_average() }}</div>
              </div>
              
              <div class="stat-card clickable" @click="go_to_tasks">
                <label>{{ i18n.t('Assignments Due') }}</label>
                <div class="value">{{ user.assignments?.length || 0 }}</div>
                <span class="hint">{{ i18n.t('Click to view tasks') }}</span>
              </div>
            </template>

            <template v-else>
              <div class="stat-card">
                <label>{{ i18n.t('Total Classes Managed') }}</label>
                <div class="value blue-text">{{ user.classes?.length || 0 }}</div>
              </div>
              
              <div class="stat-card clickable" @click="go_to_tasks">
                <label>{{ i18n.t('Active Tasks Created') }}</label>
                <div class="value">{{ user.assignments?.length || 0 }}</div>
                <span class="hint">{{ i18n.t('Manage your assignments') }}</span>
              </div>
            </template>
          </div>

          <section class="classes-container">
            <h3>{{ i18n.t('Your Classes') }}</h3>
            
            <div class="classes-grid">
              <div 
                v-for="course in user.classes" 
                :key="course.uuid" 
                class="class-card"
                @click="enter_class(course.uuid)"
              >
                <div class="class-header" :style="{ background: get_gradient(course.name) }"></div>
                <div class="class-info">
                  <h4>{{ course.name }}</h4>
                  
                  <p v-if="user.level === 2" class="sub-text">
                    {{ course.teacher_name || i18n.t('Instructor') }}
                  </p>
                  
                  <p v-else class="sub-text">
                    {{ course.student_count || 0 }} {{ i18n.t('Students enrolled') }}
                  </p>
                  
                  <button class="btn-view">
                    {{ is_staff ? i18n.t('Manage Class') : i18n.t('Enter Class') }}
                  </button>
                </div>
              </div>
              
              <div v-if="!user.classes?.length" class="empty-state">
                {{ i18n.t('No classes assigned yet.') }}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>

    <Transition name="fade">
      <div v-if="is_modal_open" class="modal-overlay" @click.self="is_modal_open = false">
        <div class="modal-content">
          <h2 class="modal-title">{{ i18n.t('Create New Class') }}</h2>
          
          <div class="form-group">
            <label>{{ i18n.t('Class Name') }}</label>
            <input 
              v-model="form.class_name" 
              type="text" 
              :placeholder="i18n.t('e.g. Mathematics 101')"
            />
          </div>

          <div class="form-group">
            <label>{{ i18n.t('Students (Comma separated names)') }}</label>
            <textarea 
              v-model="form.student_input" 
              :placeholder="i18n.t('John Doe, Jane Smith, Alex Vane')"
            ></textarea>
            <span class="input-hint">{{ i18n.t('Add one or multiple students by their full names.') }}</span>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" @click="is_modal_open = false">
              {{ i18n.t('Cancel') }}
            </button>
            <button 
              class="btn-primary" 
              @click="handle_create_class" 
              :disabled="loading"
            >
              {{ loading ? '...' : i18n.t('Create Class') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { i18n } from '../scripts/translation.script'

const router = useRouter()
const show_dropdown = ref(false)
const is_modal_open = ref(false)
const loading = ref(false)

const user = reactive({ 
  username: '', 
  level: null, 
  classes: [], 
  assignments: [] 
})

const form = reactive({
  class_name: '',
  student_input: ''
})

const is_staff = computed(() => user.level !== null && user.level <= 1)

const get_role_label = () => {
  if (user.level === 0) return 'Root'
  if (user.level === 1) return i18n.t('Teacher')
  return i18n.t('Student')
}

const calculate_average = () => {
  // Placeholder logic - can be updated to average task grades
  return "A-"
}

const logout = () => {
  localStorage.clear()
  window.location.href = '/login'
}

const go_to_tasks = () => {
  // Directs to the task view based on automation
  const path = is_staff.value ? '/teacher/tasks' : '/assignments/due'
  router.push(path)
}

const enter_class = (uuid) => {
  // This uses the UUID from your model to enter the automated page
  console.log(uuid)
  router.push(`/${uuid}`)
}

const get_gradient = (name) => {
  const themes = [
    'linear-gradient(45deg, #001a33, #007bff)',
    'linear-gradient(45deg, #1a0033, #6f42c1)',
    'linear-gradient(45deg, #00331a, #28a745)',
    'linear-gradient(45deg, #331a00, #fd7e14)'
  ]
  return themes[(name?.length || 0) % themes.length]
}

const handle_create_class = async () => {
  if (!form.class_name) return
  
  loading.value = true
  const token = localStorage.getItem('Access-Token')

  const student_names = form.student_input
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0)

  try {
    // Hit backend class creation route
    const res = await axios.post('/classes/create', {
      class_name: form.class_name,
      student_names: student_names
    }, { 
      headers: { Authorization: token } 
    })

    if (res.data.success) {
      user.classes.push(res.data.data)
      is_modal_open.value = false
      form.class_name = ''
      form.student_input = ''
    }
  } catch (err) {
    console.error("Creation error:", err)
    alert(err.response?.data?.message || "Failed to create class")
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const token = localStorage.getItem('Access-Token')
  if (!token) return router.push('/login')

  try {
    const user_res = await axios.get('/me', { headers: { Authorization: token } })
    Object.assign(user, user_res.data.user)

    const class_res = await axios.get('/classes', { headers: { Authorization: token } })
    user.classes = class_res.data.data
  } catch (err) {
    console.error("Auth error:", err)
    router.push('/login')
  }
})
</script>

<style scoped>
.dashboard-container { min-height: 100vh; background: #000; color: #fff; font-family: 'Inter', sans-serif; position: relative; overflow-x: hidden; }
.bg-glow { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 50% -20%, #001a33, transparent); pointer-events: none; z-index: 0; }

.main-content { position: relative; z-index: 1; }
.top-nav { display: flex; align-items: center; padding: 1.5rem 4rem; }
.spacer { flex: 1; }

.account-section { position: relative; display: inline-block; }
.user-pill { 
  display: flex; align-items: center; gap: 12px; background: #0a0a0a; 
  padding: 6px 15px; border-radius: 50px; border: 1px solid #222; 
  cursor: pointer; transition: 0.3s; 
}
.user-pill:hover { border-color: #007bff; }
.user-text { display: flex; flex-direction: column; text-align: right; }
.full-name { font-size: 0.85rem; font-weight: 600; }
.user-level { font-size: 0.65rem; color: #007bff; text-transform: uppercase; }
.root-text { color: #ffcc00 !important; font-weight: bold; }
.avatar { width: 32px; height: 32px; background: #007bff; border-radius: 50%; display: grid; place-items: center; font-weight: bold; }

.dropdown-menu { 
  position: absolute; top: calc(100% + 10px); right: 0; background: #0a0a0a; 
  border: 1px solid #222; border-radius: 12px; width: 190px; padding: 6px; 
  z-index: 100; box-shadow: 0 10px 30px rgba(0,0,0,0.8); 
}
.dropdown-item { 
  display: block; width: 100%; padding: 10px 12px; color: #ccc; 
  text-decoration: none; border-radius: 8px; font-size: 0.85rem; 
  background: none; border: none; text-align: left; cursor: pointer; transition: 0.2s; 
}
.dropdown-item:hover { background: #1a1a1a; color: #fff; }
.divider { height: 1px; background: #222; margin: 6px 8px; }
.logout-text { color: #ff4d4d; }

.content-body { padding: 0 4rem 4rem 4rem; }
.header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.page-title { font-size: 2.5rem; font-weight: 800; }
.btn-primary { background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-primary:hover:not(:disabled) { background: #0056b3; transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.stats-row { display: flex; gap: 20px; margin-bottom: 40px; }
.stat-card { background: #050505; border: 1px solid #111; padding: 1.5rem; border-radius: 20px; flex: 1; }
.stat-card.clickable { cursor: pointer; transition: 0.3s; }
.stat-card.clickable:hover { border-color: #007bff; }
.value { font-size: 2.5rem; font-weight: 800; margin-top: 5px; }
.blue-text { color: #007bff; }
.hint { font-size: 0.7rem; color: #444; }

.classes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px; }
.class-card { background: #0a0a0a; border-radius: 20px; border: 1px solid #181818; overflow: hidden; transition: 0.3s; }
.class-card:hover { border-color: #333; transform: translateY(-5px); }
.class-header { height: 100px; }
.class-info { padding: 1.5rem; }
.sub-text { font-size: 0.8rem; color: #666; margin: 5px 0; }
.btn-view { width: 100%; margin-top: 15px; padding: 10px; background: #111; border: 1px solid #222; color: #fff; border-radius: 8px; cursor: pointer; transition: 0.2s; }
.btn-view:hover { background: #1a1a1a; border-color: #444; }
.empty-state { grid-column: 1/-1; text-align: center; padding: 4rem; color: #444; border: 1px dashed #222; border-radius: 20px; }

/* MODAL STYLES */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: #0a0a0a; border: 1px solid #222; padding: 2.5rem; border-radius: 24px; width: 100%; max-width: 480px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
.modal-title { margin: 0 0 1.5rem 0; font-size: 1.5rem; font-weight: 700; }
.form-group { margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 0.8rem; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.form-group input, .form-group textarea { background: #111; border: 1px solid #333; padding: 12px 16px; border-radius: 12px; color: #fff; outline: none; font-family: inherit; transition: 0.2s; }
.form-group input:focus, .form-group textarea:focus { border-color: #007bff; background: #161616; }
.form-group textarea { height: 120px; resize: none; }
.input-hint { font-size: 0.7rem; color: #444; }
.modal-actions { display: flex; justify-content: flex-end; gap: 15px; margin-top: 2rem; }
.btn-secondary { background: transparent; color: #888; border: none; padding: 10px 20px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-secondary:hover { color: #fff; }

/* TRANSITIONS */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>