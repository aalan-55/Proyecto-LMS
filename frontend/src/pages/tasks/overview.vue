<template>
  <div class="tasks-overview-container">
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
            <h1 class="page-title">{{ i18n.t('Assignments') }}</h1>
            <p class="sub-title">{{ i18n.t('All your tasks across all enrolled classes') }}</p>
          </div>
          
          <div class="filter-tabs">
            <button 
              :class="{ active: active_tab === 'pending' }" 
              @click="active_tab = 'pending'"
            >
              {{ i18n.t('Pending') }}
            </button>
            <button 
              :class="{ active: active_tab === 'completed' }" 
              @click="active_tab = 'completed'"
            >
              {{ i18n.t('Completed') }}
            </button>
          </div>
        </div>

        <div class="tasks-list">
          <div 
            v-for="item in filtered_tasks" 
            :key="item.uuid" 
            class="task-row"
            @click="router.push(`/class/${item.class_uuid}`)"
          >
            <div class="task-info">
              <span class="class-label" :style="{ color: get_class_color(item.class_name) }">
                {{ item.class_name }}
              </span>
              <h3>{{ item.title }}</h3>
            </div>

            <div class="task-meta">
              <div v-if="item.grade !== undefined" class="grade-badge">
                {{ item.grade }}/100
              </div>
              <div class="due-info" :class="{ 'urgent': is_near_due(item.due_date) && !item.submitted }">
                <span class="label">{{ i18n.t('Due') }}</span>
                <span class="date">{{ format_date(item.due_date) }}</span>
              </div>
              <div class="status-indicator">
                <span v-if="item.submitted" class="status-icon success">✓</span>
                <span v-else class="status-icon alert">!</span>
              </div>
            </div>
          </div>

          <div v-if="filtered_tasks.length === 0" class="empty-state">
            <p>{{ i18n.t('No tasks found in this category.') }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { i18n } from '../../scripts/translation.script';

const router = useRouter();
const all_tasks = ref([]);
const active_tab = ref('pending');
const user_id = ref(null);

const filtered_tasks = computed(() => {
  return all_tasks.value.filter(task => {
    return active_tab.value === 'completed' ? task.submitted : !task.submitted;
  });
});

const load_tasks = async () => {
  const token = localStorage.getItem('Access-Token');
  try {
    const user_res = await axios.get('/me', { headers: { Authorization: token } });
    user_id.value = user_res.data.user._id;

    const class_res = await axios.get('/classes', { headers: { Authorization: token } });
    const enrolled_classes = class_res.data.data;

    let gathered_tasks = [];

    for (const course of enrolled_classes) {
      const task_res = await axios.get(`/tasks/class/${course._id}`, {
        headers: { Authorization: token }
      });

      const class_tasks = task_res.data.data.map(t => {
        const submission = (t.submissions || []).find((s) => {
          if (!s.student) return false;
          // Handle both non-populated ObjectId string and populated student object
          if (typeof s.student === 'string') {
            return s.student === user_id.value;
          }
          return s.student._id === user_id.value;
        });
        return {
          ...t,
          class_name: course.name,
          class_uuid: course.uuid,
          submitted: !!submission,
          grade: submission?.grade
        };
      });
      gathered_tasks = [...gathered_tasks, ...class_tasks];
    }

    all_tasks.value = gathered_tasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  } catch (err) {
    console.error("Failed to load tasks", err);
  }
};

const format_date = (d) => d ? new Date(d).toLocaleDateString() : '--';

const is_near_due = (d) => {
  if (!d) return false;
  const diff = new Date(d) - new Date();
  return diff < (1000 * 60 * 60 * 24 * 2); // Less than 2 days
};

const get_class_color = (name) => {
  const colors = ['#007bff', '#6f42c1', '#28a745', '#fd7e14', '#e83e8c'];
  return colors[name.length % colors.length];
};

onMounted(load_tasks);
</script>

<style scoped>
.tasks-overview-container { min-height: 100vh; background: #000; color: #fff; position: relative; }
.bg-glow { position: absolute; inset: 0; background: radial-gradient(circle at 100% 0%, #001a33, transparent 50%); pointer-events: none; }
.main-content { position: relative; z-index: 1; padding: 2rem 4rem; }
.btn-back { background: none; border: none; color: #555; cursor: pointer; transition: 0.2s; }
.btn-back:hover { color: #fff; }

.header-flex { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3rem; border-bottom: 1px solid #111; padding-bottom: 2rem; }
.page-title { font-size: 2.5rem; font-weight: 800; margin: 0; }
.sub-title { color: #555; margin-top: 0.5rem; }

.filter-tabs { display: flex; background: #0a0a0a; padding: 5px; border-radius: 12px; border: 1px solid #1a1a1a; }
.filter-tabs button { background: none; border: none; color: #555; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.3s; }
.filter-tabs button.active { background: #111; color: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }

.tasks-list { display: flex; flex-direction: column; gap: 12px; }
.task-row { 
  background: #0a0a0a; border: 1px solid #111; padding: 1.5rem 2rem; border-radius: 20px; 
  display: flex; justify-content: space-between; align-items: center; 
  cursor: pointer; transition: 0.2s; 
}
.task-row:hover { border-color: #333; transform: translateX(5px); }

.class-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
.task-info h3 { margin: 5px 0 0 0; font-size: 1.2rem; }

.task-meta { display: flex; align-items: center; gap: 30px; }
.due-info { text-align: right; }
.due-info .label { display: block; font-size: 0.65rem; color: #444; text-transform: uppercase; }
.due-info .date { font-size: 0.9rem; font-weight: 600; color: #888; }
.due-info.urgent .date { color: #ff4d4d; }

.grade-badge { background: rgba(40, 167, 69, 0.1); color: #28a745; padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; }

.status-icon { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; font-weight: bold; font-size: 0.8rem; }
.status-icon.success { background: #28a745; color: #fff; }
.status-icon.alert { background: #333; color: #666; }

.empty-state { text-align: center; padding: 5rem; color: #333; }
</style>