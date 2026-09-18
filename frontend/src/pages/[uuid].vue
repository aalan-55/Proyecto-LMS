<template>
  <div class="class-detail-container">
    <div class="bg-glow"></div>

    <main class="main-content" v-if="current_class && current_class._id">
      <header class="top-nav">
        <button @click="router.push('/dashboard')" class="btn-back">
          ← {{ i18n.t('Back') }}
        </button>
        <div class="spacer"></div>
      </header>

      <div class="content-body">
        <div class="header-flex">
          <h1 class="page-title">{{ current_class.name }}</h1>

          <button
            v-if="is_teacher"
            class="btn-primary"
            @click="open_create_task_modal"
          >
            {{ i18n.t('Create Task') }}
          </button>
        </div>
        
        <div class="task-grid">
          <div v-for="task in tasks" :key="task.uuid" class="task-card">
            <div class="task-header">
              <span
                v-if="task.due_date"
                class="due-date"
                :class="{ overdue: is_overdue(task.due_date) }"
              >
                {{ i18n.t('Due') }}: {{ format_date(task.due_date) }}
              </span>
            </div>

            <div class="task-header">
              <h3>{{ task.title }}</h3>
            </div>

            <p class="task-desc">{{ task.description }}</p>

            <div
              v-if="task.attachments && task.attachments.length"
              class="attachments-list"
            >
              <p class="attachments-title">{{ i18n.t('Attachments') }}</p>
              <ul>
                <li v-for="(att, index) in task.attachments" :key="index">
                  <a :href="att.url" target="_blank" rel="noopener">
                    {{ att.name }} ({{ att.file_type }})
                  </a>
                </li>
              </ul>
            </div>

            <div class="task-footer">
              <div v-if="is_teacher" class="teacher-controls">
                <span class="count">
                  {{ task.submissions?.length || 0 }} {{ i18n.t('Submissions') }}
                </span>
                <div class="btn-group">
                  <button class="btn-secondary" @click="open_grade_modal(task)">
                    {{ i18n.t('Review & Grade') }}
                  </button>
                  <button
                    class="btn-secondary"
                    @click="download_all_submissions(task.uuid)"
                    :disabled="!(task.submissions && task.submissions.length)"
                  >
                    {{ i18n.t('Download All') }}
                  </button>
                </div>
              </div>

              <div v-else-if="is_student" class="student-controls">
                <span class="count" v-if="task.has_submitted">
                  {{ i18n.t('Submitted') }}
                  <span v-if="task.student_grade !== null && task.student_grade !== undefined">
                    - {{ i18n.t('Grade') }}: {{ task.student_grade }}/100
                  </span>
                </span>
                <span class="count" v-else>
                  {{ i18n.t('Not submitted yet') }}
                </span>

                <div class="btn-group">
                  <button class="btn-primary-sm" @click="open_submit_modal(task)">
                    {{ task.has_submitted ? i18n.t('Resubmit') : i18n.t('Submit Task') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="tasks.length === 0" class="empty-state">
            {{ i18n.t('No tasks found.') }}
          </div>
        </div>
      </div>
    </main>

    <div v-else class="loading-state">
      <p>Loading class data...</p>
    </div>

    <!-- Create Task Modal (Teacher only) -->
    <Transition name="fade">
      <div
        v-if="show_create_task_modal"
        class="modal-overlay"
        @click.self="close_create_task_modal"
      >
        <div class="modal-content">
          <h2>{{ i18n.t('Create Task') }}</h2>

          <div class="form-group">
            <label>{{ i18n.t('Title') }}</label>
            <input
              v-model="new_task.title"
              type="text"
              :placeholder="i18n.t('e.g. Homework 1: Algebra basics')"
            />
          </div>

          <div class="form-group">
            <label>{{ i18n.t('Description') }}</label>
            <textarea
              v-model="new_task.description"
              :placeholder="i18n.t('Describe what students should do')"
            ></textarea>
          </div>

          <div class="form-group">
            <label>{{ i18n.t('Due Date & Time') }}</label>
            <div class="date-time-row">
              <input v-model="new_task.due_date_date" type="date" />
              <input v-model="new_task.due_date_time" type="time" />
            </div>
          </div>

          <div class="form-group">
            <label>{{ i18n.t('Attachments') }}</label>
            <div
              v-for="(att, index) in new_task.attachments"
              :key="index"
              class="attachment-row"
            >
              <input
                v-model="att.name"
                type="text"
                :placeholder="i18n.t('Display name')"
              />
              <input
                v-model="att.url"
                type="url"
                :placeholder="i18n.t('File URL (e.g. Google Drive)')"
              />
              <select v-model="att.file_type">
                <option value="link">Link</option>
                <option value="pdf">PDF</option>
                <option value="doc">DOC</option>
              </select>
              <button
                type="button"
                class="btn-secondary remove-btn"
                @click="remove_attachment_row(index)"
              >
                ×
              </button>
            </div>
            <button type="button" class="btn-secondary" @click="add_attachment_row">
              {{ i18n.t('Add Attachment') }}
            </button>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" type="button" @click="close_create_task_modal">
              {{ i18n.t('Cancel') }}
            </button>
            <button class="btn-primary" type="button" @click="handle_create_task">
              {{ i18n.t('Create Task') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Submit Task Modal (Student) -->
    <Transition name="fade">
      <div
        v-if="show_submit_modal"
        class="modal-overlay"
        @click.self="close_submit_modal"
      >
        <div class="modal-content">
          <h2>{{ i18n.t('Submit Task') }}</h2>
          <p v-if="active_task_for_submit" class="sub-title">
            {{ active_task_for_submit.title }}
          </p>

          <div class="form-group">
            <label>{{ i18n.t('File URL') }}</label>
            <input
              v-model="submit_task.file_url"
              type="url"
              :placeholder="i18n.t('Paste a link to your file (e.g. Google Drive, OneDrive)')"
            />
          </div>

          <div class="form-group">
            <label>{{ i18n.t('Comment (optional)') }}</label>
            <textarea
              v-model="submit_task.comment"
              :placeholder="i18n.t('Add any notes for your teacher')"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" type="button" @click="close_submit_modal">
              {{ i18n.t('Cancel') }}
            </button>
            <button class="btn-primary" type="button" @click="handle_submit_task">
              {{ i18n.t('Submit') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Grade Submissions Modal (Teacher) -->
    <Transition name="fade">
      <div
        v-if="show_grade_modal"
        class="modal-overlay"
        @click.self="close_grade_modal"
      >
        <div class="modal-content">
          <h2 v-if="active_task_for_grading">
            {{ i18n.t('Submissions for') }} {{ active_task_for_grading.title }}
          </h2>

          <div v-if="!active_task_for_grading || !active_task_for_grading.submissions?.length">
            {{ i18n.t('No submissions yet for this task.') }}
          </div>
          <div v-else class="submission-list">
            <div
              v-for="sub in active_task_for_grading.submissions"
              :key="sub.student?.uuid"
              class="submission-row"
            >
              <div class="submission-meta">
                <div class="student-name">
                  {{ sub.student?.username || i18n.t('Unknown student') }}
                </div>
                <a
                  v-if="sub.file_url"
                  :href="sub.file_url"
                  target="_blank"
                  rel="noopener"
                >
                  {{ i18n.t('Open submission') }}
                </a>
              </div>

              <div class="form-group-inline">
                <input
                  type="number"
                  min="0"
                  max="100"
                  v-model.number="sub._tempGrade"
                  :placeholder="i18n.t('Grade (0-100)')"
                />
                <input
                  type="text"
                  v-model="sub._tempFeedback"
                  :placeholder="i18n.t('Feedback')"
                />
                <button
                  class="btn-primary-sm"
                  type="button"
                  @click="submit_grade(active_task_for_grading.uuid, sub)"
                >
                  {{ i18n.t('Save') }}
                </button>
              </div>

              <div class="current-status" v-if="sub.grade !== undefined && sub.grade !== null">
                {{ i18n.t('Current grade') }}: {{ sub.grade }}/100
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" type="button" @click="close_grade_modal">
              {{ i18n.t('Close') }}
            </button>
            <button
              class="btn-secondary"
              type="button"
              :disabled="!active_task_for_grading"
              @click="active_task_for_grading && download_all_submissions(active_task_for_grading.uuid)"
            >
              {{ i18n.t('Download All') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { i18n } from '../scripts/translation.script'; // Adjusted path based on your image

const route = useRoute();
const router = useRouter();

const current_class = ref(null);
const tasks = ref([]);
const user = ref(null);

const show_create_task_modal = ref(false);
const show_submit_modal = ref(false);
const show_grade_modal = ref(false);

const new_task = reactive({
  title: '',
  description: '',
  due_date_date: '',
  due_date_time: '',
  attachments: []
});

const submit_task = reactive({
  task_uuid: '',
  file_url: '',
  comment: ''
});

const active_task_for_submit = ref(null);
const active_task_for_grading = ref(null);

const is_teacher = computed(() => user.value && user.value.level === 1);
const is_student = computed(() => user.value && user.value.level === 2);

const format_date = (d) => d ? new Date(d).toLocaleString() : '--';

const is_overdue = (d) => {
  if (!d) return false;
  const diff = new Date(d) - new Date();
  return diff < 0;
};

const enrich_tasks_for_student = (raw_tasks) => {
  if (!is_student.value || !user.value) return raw_tasks;

  const current_id = user.value._id;

  return raw_tasks.map((t) => {
    const submissions = t.submissions || [];
    const submission = submissions.find((s) => {
      if (!s.student) return false;
      // Handle both ObjectId string and populated object
      if (typeof s.student === 'string') {
        return s.student === current_id;
      }
      return s.student._id === current_id;
    });

    return {
      ...t,
      has_submitted: !!submission,
      student_grade: submission?.grade ?? null
    };
  });
};

const load_data = async () => {
  const token = localStorage.getItem('Access-Token');
  const uuid = route.params.uuid; 

  try {
    const [user_res, class_res] = await Promise.all([
      axios.get('/me', { headers: { Authorization: token } }),
      axios.get(`/${uuid}`, { headers: { Authorization: token } })
    ]);

    user.value = user_res.data.user;

    if (class_res.data.success && class_res.data.data) {
      current_class.value = class_res.data.data;

      // Only proceed if current_class has a valid internal _id
      try {
        const task_res = await axios.get(`/tasks/class/${current_class.value._id}`, {
          headers: { Authorization: token }
        });
        const raw_tasks = task_res.data.data || [];
        tasks.value = enrich_tasks_for_student(raw_tasks);
      } catch (task_err) {
        console.error("Task loading failed, but class loaded:", task_err);
        tasks.value = []; // Set to empty so the page doesn't crash
      }
    }
  } catch (err) {
    console.error("Main class load failed:", err);
    // Instead of letting it stay black, go back
    router.push('/dashboard');
  }
};

const open_create_task_modal = () => {
  if (!is_teacher.value) return;
  show_create_task_modal.value = true;

  if (!new_task.attachments.length) {
    new_task.attachments.push({
      name: '',
      url: '',
      file_type: 'link'
    });
  }
};

const close_create_task_modal = () => {
  show_create_task_modal.value = false;
};

const add_attachment_row = () => {
  new_task.attachments.push({
    name: '',
    url: '',
    file_type: 'link'
  });
};

const remove_attachment_row = (index) => {
  new_task.attachments.splice(index, 1);
};

const reset_new_task_form = () => {
  new_task.title = '';
  new_task.description = '';
  new_task.due_date_date = '';
  new_task.due_date_time = '';
  new_task.attachments = [];
};

const handle_create_task = async () => {
  if (!current_class.value || !current_class.value._id) return;
  if (!new_task.title || !new_task.description || !new_task.due_date_date || !new_task.due_date_time) {
    alert(i18n.t('Please fill in title, description, due date and time.'));
    return;
  }

  const token = localStorage.getItem('Access-Token');

  const combined = `${new_task.due_date_date}T${new_task.due_date_time}`;
  const due = new Date(combined);
  if (isNaN(due.getTime())) {
    alert(i18n.t('Please select a valid due date and time.'));
    return;
  }

  const payload = {
    title: new_task.title,
    description: new_task.description,
    class_id: current_class.value._id,
    due_date: due.toISOString(),
    attachments: new_task.attachments
      .filter(a => a.name && a.url && a.file_type)
      .map(a => ({
        name: a.name,
        url: a.url,
        file_type: a.file_type
      }))
  };

  try {
    const res = await axios.post('/create_task', payload, {
      headers: { Authorization: token }
    });

    if (res.data.success && res.data.task) {
      const updated_tasks = [...tasks.value, res.data.task];
      tasks.value = enrich_tasks_for_student(updated_tasks);
      reset_new_task_form();
      show_create_task_modal.value = false;
    }
  } catch (err) {
    console.error("Failed to create task", err);
    const apiErrors = err.response?.data?.errors;
    if (Array.isArray(apiErrors) && apiErrors.length) {
      const msg = apiErrors.map(e => `${e.key}: ${e.error}`).join('\n');
      alert(msg);
    } else {
      alert(err.response?.data?.message || i18n.t('Failed to create task'));
    }
  }
};

const open_submit_modal = (task) => {
  if (!is_student.value) return;
  active_task_for_submit.value = task;
  submit_task.task_uuid = task.uuid;
  submit_task.file_url = '';
  submit_task.comment = '';
  show_submit_modal.value = true;
};

const close_submit_modal = () => {
  show_submit_modal.value = false;
  active_task_for_submit.value = null;
};

const handle_submit_task = async () => {
  if (!submit_task.task_uuid || !submit_task.file_url) {
    alert(i18n.t('Please provide a file URL.'));
    return;
  }

  const token = localStorage.getItem('Access-Token');

  try {
    const body = {
      task_uuid: submit_task.task_uuid,
      file_url: submit_task.file_url,
      comment: submit_task.comment || ''
    };

    const res = await axios.post(`/${submit_task.task_uuid}/submit`, body, {
      headers: { Authorization: token }
    });

    if (res.data.success) {
      // Mark this task as submitted for the current student
      const updated = tasks.value.map((t) => {
        if (t.uuid !== submit_task.task_uuid) return t;
        return {
          ...t,
          has_submitted: true
        };
      });
      tasks.value = updated;
      show_submit_modal.value = false;
      active_task_for_submit.value = null;
    }
  } catch (err) {
    console.error("Failed to submit task", err);
    alert(err.response?.data?.message || i18n.t('Failed to submit task'));
  }
};

const open_grade_modal = (task) => {
  if (!is_teacher.value) return;

  // Initialize temporary grading fields
  if (task.submissions) {
    task.submissions = task.submissions.map((s) => ({
      ...s,
      _tempGrade: s.grade ?? '',
      _tempFeedback: s.teacher_feedback ?? ''
    }));
  }

  active_task_for_grading.value = task;
  show_grade_modal.value = true;
};

const close_grade_modal = () => {
  show_grade_modal.value = false;
  active_task_for_grading.value = null;
};

const submit_grade = async (task_uuid, submission) => {
  if (!submission.student || !submission.student.uuid) {
    alert(i18n.t('Missing student information for grading.'));
    return;
  }

  const grade = submission._tempGrade;
  if (grade === '' || grade === null || grade === undefined) {
    alert(i18n.t('Please enter a grade.'));
    return;
  }

  const token = localStorage.getItem('Access-Token');

  try {
    const body = {
      student_uuid: submission.student.uuid,
      grade: grade,
      feedback: submission._tempFeedback || ''
    };

    const res = await axios.patch(`/${task_uuid}/grade`, body, {
      headers: { Authorization: token }
    });

    if (res.data.success && res.data.task) {
      const updated_task = res.data.task;

      // Update tasks list
      const updated_tasks = tasks.value.map((t) =>
        t.uuid === updated_task.uuid ? updated_task : t
      );
      tasks.value = enrich_tasks_for_student(updated_tasks);

      // Update active task in modal
      if (active_task_for_grading.value && active_task_for_grading.value.uuid === updated_task.uuid) {
        active_task_for_grading.value = {
          ...updated_task,
          submissions: updated_task.submissions.map((s) => ({
            ...s,
            _tempGrade: s.grade ?? '',
            _tempFeedback: s.teacher_feedback ?? ''
          }))
        };
      }
    }
  } catch (err) {
    console.error("Failed to save grade", err);
    alert(err.response?.data?.message || i18n.t('Failed to save grade'));
  }
};

const download_all_submissions = async (task_uuid) => {
  const token = localStorage.getItem('Access-Token');

  try {
    const res = await axios.get(`/${task_uuid}/download-all`, {
      headers: { Authorization: token },
      responseType: 'blob'
    });

    const blob = new Blob([res.data], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${task_uuid}_submissions.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Failed to download submissions", err);
    alert(err.response?.data?.message || i18n.t('Failed to download submissions'));
  }
};

onMounted(load_data);
</script>

<style scoped>
.class-detail-container { min-height: 100vh; background: #000; color: #fff; position: relative; }
.bg-glow { position: absolute; inset: 0; background: radial-gradient(circle at 0% 0%, #001a33, transparent 40%); pointer-events: none; }
.main-content { position: relative; z-index: 1; padding: 2rem 4rem; }
.top-nav { display: flex; align-items: center; margin-bottom: 3rem; }
.btn-back { background: none; border: none; color: #555; cursor: pointer; font-weight: 600; transition: 0.2s; }
.btn-back:hover { color: #fff; }

.header-flex { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3rem; }
.page-title { font-size: 3rem; font-weight: 800; margin: 0; }
.sub-title { color: #555; font-size: 1.1rem; margin-top: 0.5rem; }

.task-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; }
.task-card { background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 24px; padding: 2rem; transition: 0.3s; }
.task-card:hover { border-color: #007bff; }

.due-date { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #007bff; background: rgba(0, 123, 255, 0.1); padding: 4px 12px; border-radius: 50px; }
.due-date.overdue { color: #ff4d4d; background: rgba(255, 77, 77, 0.1); }

.task-header h3 { margin: 1.5rem 0 0.5rem 0; font-size: 1.4rem; }
.task-desc { color: #888; font-size: 0.95rem; line-height: 1.6; min-height: 3em; }

.task-footer { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #1a1a1a; }
.teacher-controls, .student-controls { display: flex; justify-content: space-between; align-items: center; }
.count { font-size: 0.85rem; color: #444; }
.btn-group { display: flex; gap: 10px; }

.btn-primary { background: #007bff; color: #fff; border: none; padding: 12px 28px; border-radius: 14px; font-weight: 700; cursor: pointer; }
.btn-primary-sm { background: #007bff; color: #fff; border: none; padding: 8px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; }
.btn-secondary { background: #111; color: #ccc; border: 1px solid #222; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-size: 0.85rem; }
.btn-secondary:hover { background: #1a1a1a; color: #fff; }

.status-pill { font-size: 0.9rem; font-weight: 600; color: #28a745; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: #0a0a0a; border: 1px solid #222; padding: 3rem; border-radius: 30px; width: 500px; }
.form-group { margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 10px; }
.form-group input, .form-group textarea { background: #111; border: 1px solid #222; padding: 14px; border-radius: 12px; color: #fff; outline: none; }
.form-group input:focus { border-color: #007bff; }
.modal-actions { display: flex; justify-content: flex-end; gap: 15px; margin-top: 2rem; }

.date-time-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.attachments-list {
  margin-top: 1rem;
}

.attachments-title {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #666;
  margin-bottom: 0.25rem;
}

.attachments-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.attachments-list li a {
  color: #007bff;
  font-size: 0.9rem;
}

.attachments-list li a:hover {
  text-decoration: underline;
}

.attachment-row {
  display: grid;
  grid-template-columns: 1.5fr 2fr 1fr auto;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.attachment-row .remove-btn {
  padding-inline: 0.75rem;
}

.submission-list {
  max-height: 360px;
  overflow-y: auto;
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.submission-row {
  padding: 1rem 1.25rem;
  border-radius: 14px;
  border: 1px solid #222;
  background: #050505;
}

.submission-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.submission-meta a {
  color: #007bff;
  font-size: 0.85rem;
}

.student-name {
  font-weight: 600;
}

.form-group-inline {
  display: grid;
  grid-template-columns: 0.7fr 1.6fr auto;
  gap: 0.5rem;
  align-items: center;
}

.form-group-inline input {
  background: #111;
  border: 1px solid #222;
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  color: #fff;
  outline: none;
}

.form-group-inline input:focus {
  border-color: #007bff;
}

.current-status {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #888;
}
</style>