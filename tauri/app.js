// ─── State ───────────────────────────────────────────────
const STORAGE_KEY = 'todo-app-tasks';

let tasks = [];
let filter = 'all';
let search = '';

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch {
    tasks = [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ─── DOM refs ────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const taskList = $('#taskList');
const empty = $('#empty');
const addForm = $('#addForm');
const inputTitle = $('#inputTitle');
const inputPriority = $('#inputPriority');
const inputCategory = $('#inputCategory');
const inputDue = $('#inputDue');
const catList = $('#catList');
const searchInput = $('#search');
const btnClearDone = $('#btnClearDone');
const statTotal = $('#statTotal');
const statActive = $('#statActive');
const statDone = $('#statDone');

// ─── Helpers ─────────────────────────────────────────────
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function priorityLabel(v) {
  const map = { 10: '低', 20: '普通', 30: '较高', 40: '紧急' };
  return map[v] || '普通';
}

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${m}月${day}日`;
}

function isOverdue(d) {
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(d + 'T00:00:00') < today;
}

function getCategories() {
  const set = new Set();
  tasks.forEach((t) => { if (t.category) set.add(t.category); });
  return [...set].sort();
}

// ─── Render ──────────────────────────────────────────────
function render() {
  let filtered = tasks;

  if (filter === 'active') {
    filtered = filtered.filter((t) => !t.done);
  } else if (filter === 'completed') {
    filtered = filtered.filter((t) => t.done);
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.category && t.category.toLowerCase().includes(q))
    );
  }

  // sort: incomplete first (overdue on top), then by priority desc, then completed
  filtered = [...filtered].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (!a.done) {
      const aOver = isOverdue(a.due) ? 1 : 0;
      const bOver = isOverdue(b.due) ? 1 : 0;
      if (aOver !== bOver) return bOver - aOver;
      if (a.priority !== b.priority) return b.priority - a.priority;
      if (a.due && b.due && a.due !== b.due) return a.due.localeCompare(b.due);
    }
    if (a.done && b.done) {
      if (a.completedAt && b.completedAt) return b.completedAt - a.completedAt;
    }
    return b.createdAt - a.createdAt;
  });

  taskList.innerHTML = '';
  if (filtered.length === 0) {
    empty.style.display = 'block';
    taskList.style.display = 'none';
  } else {
    empty.style.display = 'none';
    taskList.style.display = '';
    filtered.forEach((t) => taskList.appendChild(buildTaskEl(t)));
  }

  updateStats();
  updateCatDatalist();
}

function updateStats() {
  statTotal.textContent = tasks.length;
  statActive.textContent = tasks.filter((t) => !t.done).length;
  statDone.textContent = tasks.filter((t) => t.done).length;
  btnClearDone.disabled = tasks.every((t) => !t.done);
}

function updateCatDatalist() {
  catList.innerHTML = getCategories().map((c) => `<option value="${escapeHtml(c)}">`).join('');
}

function buildTaskEl(t) {
  const li = document.createElement('li');
  li.className = 'task' + (t.done ? ' completed' : '');
  li.dataset.id = t.id;

  const dueStr = t.due ? formatDate(t.due) : '';
  const overdueCls = !t.done && isOverdue(t.due) ? ' overdue' : '';

  li.innerHTML = `
    <div class="circle" data-action="toggle"></div>
    <div class="task-content">
      <div class="task-title">${escapeHtml(t.title)}</div>
      <div class="task-meta">
        <span class="badge badge-p${t.priority}">${priorityLabel(t.priority)}</span>
        ${t.category ? `<span class="badge badge-cat">${escapeHtml(t.category)}</span>` : ''}
        ${dueStr ? `<span class="due-text${overdueCls}">${isOverdue(t.due) && !t.done ? '⚠ ' : ''}📅 ${dueStr}</span>` : ''}
      </div>
    </div>
    <div class="task-actions">
      <button class="btn-edit" data-action="edit">编辑</button>
      <button class="btn-del" data-action="delete">删除</button>
    </div>
  `;

  li.querySelector('[data-action="toggle"]').addEventListener('click', () => toggleTask(t.id));
  li.querySelector('[data-action="edit"]').addEventListener('click', () => openEditModal(t.id));
  li.querySelector('[data-action="delete"]').addEventListener('click', () => deleteTask(t.id));
  return li;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ─── Actions ─────────────────────────────────────────────
function addTask(title, priority, category, due) {
  tasks.unshift({
    id: genId(),
    title: title.trim(),
    priority: Number(priority) || 20,
    category: category.trim(),
    due: due || '',
    done: false,
    createdAt: Date.now(),
    completedAt: null,
  });
  saveTasks();
  render();
}

function toggleTask(id) {
  const t = tasks.find((t) => t.id === id);
  if (!t) return;
  t.done = !t.done;
  t.completedAt = t.done ? Date.now() : null;
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
}

function updateTask(id, updates) {
  const t = tasks.find((t) => t.id === id);
  if (!t) return;
  Object.assign(t, updates);
  saveTasks();
  render();
}

function clearDone() {
  tasks = tasks.filter((t) => !t.done);
  saveTasks();
  render();
}

// ─── Edit modal ──────────────────────────────────────────
function openEditModal(id) {
  const t = tasks.find((t) => t.id === id);
  if (!t) return;

  const existing = $('#editModal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay show';
  overlay.id = 'editModal';
  overlay.innerHTML = `
    <div class="modal">
      <h2>编辑任务</h2>
      <div class="field">
        <label>任务名称</label>
        <input type="text" id="editTitle" value="${escapeHtml(t.title)}">
      </div>
      <div class="field">
        <label>优先级</label>
        <select id="editPriority">
          <option value="10" ${t.priority === 10 ? 'selected' : ''}>低优先级</option>
          <option value="20" ${t.priority === 20 ? 'selected' : ''}>普通</option>
          <option value="30" ${t.priority === 30 ? 'selected' : ''}>较高</option>
          <option value="40" ${t.priority === 40 ? 'selected' : ''}>紧急</option>
        </select>
      </div>
      <div class="field">
        <label>分类</label>
        <input type="text" id="editCategory" value="${escapeHtml(t.category)}" list="catList">
      </div>
      <div class="field">
        <label>截止日期</label>
        <input type="date" id="editDue" value="${t.due}">
      </div>
      <div class="modal-btns">
        <button class="btn-cancel">取消</button>
        <button class="btn-save">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const save = () => {
    updateTask(id, {
      title: $('#editTitle').value.trim() || t.title,
      priority: Number($('#editPriority').value),
      category: $('#editCategory').value.trim(),
      due: $('#editDue').value,
    });
    overlay.remove();
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.querySelector('.btn-cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('.btn-save').addEventListener('click', save);
  overlay.querySelector('#editTitle').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') overlay.remove();
  });
  overlay.querySelector('#editTitle').focus();
  overlay.querySelector('#editTitle').select();
}

// ─── Events ──────────────────────────────────────────────
addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = inputTitle.value.trim();
  if (!title) return;
  addTask(title, inputPriority.value, inputCategory.value, inputDue.value);
  inputTitle.value = '';
  inputDue.value = '';
  inputTitle.focus();
});

searchInput.addEventListener('input', () => {
  search = searchInput.value;
  render();
});

$$('.filters button').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.filters button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    filter = btn.dataset.filter;
    render();
  });
});

btnClearDone.addEventListener('click', clearDone);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    inputTitle.focus();
  }
  if (e.key === 'Escape') {
    inputTitle.blur();
    searchInput.blur();
  }
});

// Date display
function updateDate() {
  const now = new Date();
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const str = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${days[now.getDay()]}`;
  const el = $('#currentDate');
  if (el) el.textContent = str;
}

// ─── Init ────────────────────────────────────────────────
loadTasks();
updateDate();
render();
inputTitle.focus();
