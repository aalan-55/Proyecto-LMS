<template>
  <div class="grades-container">
    <div class="bg-glow"></div>

    <main class="main-content">
      <header class="top-nav">
        <button @click="router.push('/dashboard')" class="btn-back">
          ← {{ i18n.t('Back to Dashboard') }}
        </button>
        <div class="spacer"></div>
      </header>

      <div class="content-body">
        <div class="header-flex">
          <div>
            <h1 class="page-title">{{ i18n.t('Grades') }}</h1>
            <p class="sub-title">
              {{ i18n.t('Review your grades by class and assignment') }}
            </p>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <p>{{ i18n.t('Loading grades...') }}</p>
        </div>

        <div v-else-if="!classes.length" class="empty-state">
          <p>{{ i18n.t('No classes assigned yet.') }}</p>
        </div>

        <div v-else class="grades-layout">
          <aside class="classes-list">
            <h3 class="section-title">{{ i18n.t('Your Classes') }}</h3>

            <button
              v-for="cls in classes"
              :key="cls.class_uuid"
              class="class-pill"
              :class="{ active: selectedClass && selectedClass.class_uuid === cls.class_uuid }"
              @click="selectClass(cls)"
            >
              <span class="class-name">{{ cls.class_name }}</span>
              <span class="badge">
                {{ cls.tasks.length }}
              </span>
            </button>
          </aside>

          <section class="tasks-panel" v-if="selectedClass">
            <div class="panel-header">
              <h2>{{ selectedClass.class_name }}</h2>
            </div>

            <div v-if="!selectedClass.tasks.length" class="empty-tasks">
              {{ i18n.t('No tasks for this class yet.') }}
            </div>

            <div v-else class="tasks-table">
              <div class="tasks-table-header">
                <span>{{ i18n.t('Assignment') }}</span>
                <span>{{ i18n.t('Due') }}</span>
                <span>{{ i18n.t('Status') }}</span>
              </div>

              <div
                v-for="task in selectedClass.tasks"
                :key="task.uuid"
                class="tasks-table-row"
              >
                <div class="col-title">
                  <div class="task-title">{{ task.title }}</div>
                  <div class="task-desc" v-if="task.description">
                    {{ task.description }}
                  </div>
                </div>

                <div class="col-due">
                  <span class="due-label">
                    {{ task.due_date ? format_date(task.due_date) : i18n.t('No due date') }}
                  </span>
                </div>

                <div class="col-status">
                  <span
                    v-if="task.status === 'graded' && task.grade !== null && task.grade !== undefined"
                    class="status-pill graded"
                  >
                    {{ i18n.t('Grade') }}: {{ task.grade }}/100
                  </span>
                  <span
                    v-else-if="task.status === 'missing'"
                    class="status-pill missing"
                  >
                    {{ i18n.t('Missing') }}
                  </span>
                  <span
                    v-else-if="task.status === 'submitted'"
                    class="status-pill submitted"
                  >
                    {{ i18n.t('Submitted') }}
                  </span>
                  <span
                    v-else
                    class="status-pill not-submitted"
                  >
                    {{ i18n.t('Not submitted') }}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { i18n } from '../scripts/translation.script';

const router = useRouter();
const classes = ref([]);
const selectedClass = ref(null);
const loading = ref(false);

const selectClass = (cls) => {
  selectedClass.value = cls;
};

const format_date = (d) => (d ? new Date(d).toLocaleDateString() : '--');

const load_grades = async () => {
  const token = localStorage.getItem('Access-Token');
  if (!token) {
    router.push('/login');
    return;
  }

  loading.value = true;

  try {
    // Ensure only students can view this page
    const me = await axios.get('/me', {
      headers: { Authorization: token }
    });

    if (me.data?.user?.level !== 2) {
      router.push('/dashboard');
      return;
    }

    const res = await axios.get('/grades', {
      headers: { Authorization: token }
    });

    if (res.data.success) {
      classes.value = res.data.data || [];
      if (classes.value.length) {
        selectedClass.value = classes.value[0];
      }
    }
  } catch (err) {
    console.error('Failed to load grades', err);
  } finally {
    loading.value = false;
  }
};

onMounted(load_grades);
</script>

<style scoped>
.grades-container {
  min-height: 100vh;
  background: #000;
  color: #fff;
  position: relative;
}

.bg-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, #001a33, transparent 50%);
  pointer-events: none;
}

.main-content {
  position: relative;
  z-index: 1;
  padding: 2rem 4rem;
}

.top-nav {
  display: flex;
  align-items: center;
  margin-bottom: 3rem;
}

.btn-back {
  background: none;
  border: none;
  color: #555;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}

.btn-back:hover {
  color: #fff;
}

.spacer {
  flex: 1;
}

.header-flex {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  border-bottom: 1px solid #111;
  padding-bottom: 1.5rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
}

.sub-title {
  color: #555;
  margin-top: 0.5rem;
}

.content-body {
  display: flex;
  flex-direction: column;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 0;
  color: #444;
}

.grades-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 2rem;
  margin-top: 1.5rem;
}

.classes-list {
  background: #050505;
  border-radius: 18px;
  border: 1px solid #111;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #777;
  margin-bottom: 0.75rem;
}

.class-pill {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  border: 1px solid #111;
  background: #0a0a0a;
  color: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  transition: 0.2s;
}

.class-pill:hover {
  border-color: #333;
}

.class-pill.active {
  border-color: #007bff;
  background: linear-gradient(to right, #001a33, #050505);
}

.class-name {
  font-weight: 600;
}

.badge {
  min-width: 26px;
  height: 22px;
  border-radius: 999px;
  background: #111;
  border: 1px solid #222;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.tasks-panel {
  background: #050505;
  border-radius: 18px;
  border: 1px solid #111;
  padding: 1.5rem 1.75rem;
}

.panel-header h2 {
  margin: 0 0 1rem 0;
  font-size: 1.4rem;
}

.empty-tasks {
  color: #555;
  padding: 2rem 0;
}

.tasks-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tasks-table-header {
  display: grid;
  grid-template-columns: 3fr 1.5fr 1.5fr;
  padding: 0.75rem 0.75rem 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: #777;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.tasks-table-row {
  display: grid;
  grid-template-columns: 3fr 1.5fr 1.5fr;
  gap: 0.5rem;
  padding: 0.9rem 0.75rem;
  border-radius: 12px;
  background: #0a0a0a;
  border: 1px solid #111;
}

.col-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.task-title {
  font-weight: 600;
  font-size: 0.95rem;
}

.task-desc {
  font-size: 0.8rem;
  color: #777;
}

.col-due {
  display: flex;
  align-items: center;
}

.due-label {
  font-size: 0.85rem;
  color: #aaa;
}

.col-status {
  display: flex;
  align-items: center;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-pill.graded {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.status-pill.missing {
  background: rgba(255, 77, 77, 0.1);
  color: #ff4d4d;
}

.status-pill.submitted {
  background: rgba(0, 123, 255, 0.1);
  color: #007bff;
}

.status-pill.not-submitted {
  background: rgba(102, 102, 102, 0.15);
  color: #aaa;
}
</style>

