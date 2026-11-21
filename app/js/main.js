// Leonida Platinum — boot, wiring and deep links. No network at run time: the only
// fetches are the guide's own data files under app/.
import { loadGuideData } from './data.js';
import { loadEarned, saveEarned, loadSettings, saveSettings, exportProgress, importProgress } from './store.js';
import { KINDS, filterNoteFor } from './filters.js';
import { renderChecklist, renderDetail, renderRoadmap, renderMissables, updateProgress } from './views.js';

// Demo progress for screenshots: 13 of the 55 earned, a spread across the list.
// Only used with ?demo in the address, and only when no progress is saved yet.
const DEMO_EARNED_IDS = [2, 3, 4, 8, 15, 16, 21, 28, 35, 42, 44, 46, 55];

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);

const data = await loadGuideData();
const state = {
  earned: loadEarned(),
  kind: 'all',
  grade: 'all',
  query: '',
  spoilerOn: false,
  selectedId: null,
  view: 'checklist',
};

function applySavedSettings() {
  const settings = loadSettings();
  if (settings.spoilerOn) state.spoilerOn = true;
  if (typeof settings.kind === 'string' && KINDS.includes(settings.kind)) state.kind = settings.kind;
  if (typeof settings.grade === 'string') state.grade = settings.grade;
}

function applyDeepLinks() {
  if (params.get('view') === 'roadmap' || params.get('view') === 'missables') state.view = params.get('view');
  const filter = params.get('filter');
  if (filter && KINDS.includes(filter)) { state.kind = filter; state.view = 'checklist'; }
  if (params.get('spoiler') === 'on') state.spoilerOn = true;
  const trophy = Number(params.get('trophy'));
  if (Number.isInteger(trophy) && data.byId.has(trophy)) state.selectedId = trophy;
  if (params.has('demo') && state.earned.size === 0) {
    for (const id of DEMO_EARNED_IDS) {
      const t = data.byId.get(id);
      if (t) state.earned.add(t.name);
    }
    saveEarned(state.earned);
  }
}

function persistSettings() {
  saveSettings({ spoilerOn: state.spoilerOn, kind: state.kind, grade: state.grade });
}

function renderAll() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === state.view);
  });
  for (const view of ['checklist', 'roadmap', 'missables']) {
    $(`view-${view}`).hidden = state.view !== view;
  }
  if (state.view === 'checklist') {
    const shown = renderChecklist($('rows'), $('emptyNote'), data, state,
      (trophy, checked) => {
        if (checked) state.earned.add(trophy.name);
        else state.earned.delete(trophy.name);
        saveEarned(state.earned);
        renderAll();
      },
      (id) => { state.selectedId = id; renderAll(); });
    $('filterNote').textContent = filterNoteFor({ ...state, shown, total: data.trophies.length, kindNotes: data.kindNotes });
    renderDetail($('detail'), data, state.selectedId ? data.byId.get(state.selectedId) : null, state.earned);
  } else if (state.view === 'roadmap') {
    renderRoadmap($('roadmapStages'), $('roadmapTitle'), $('roadmapSub'), data, state.earned);
  } else {
    renderMissables($('missableList'), $('missableIntro'), $('missableMethod'), data, state.earned);
  }
  updateProgress($('earnedCount'), $('barFill'), $('progressLine'), state.earned, data.trophies.length);
  persistSettings();
}

function buildKindChips() {
  const wrap = $('kindChips');
  for (const kind of KINDS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = kind === 'all' ? 'All kinds' : (data.kindLabels[kind] ?? kind);
    chip.addEventListener('click', () => { state.kind = kind; state.view = 'checklist'; syncControls(); renderAll(); });
    wrap.append(chip);
  }
}

function syncControls() {
  document.querySelectorAll('#kindChips .chip').forEach((chip, i) => {
    chip.classList.toggle('active', KINDS[i] === state.kind);
  });
  $('grade').value = state.grade;
  $('spoiler').checked = state.spoilerOn;
  $('search').value = state.query;
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => { state.view = tab.dataset.view; renderAll(); });
});
$('search').addEventListener('input', (e) => { state.query = e.target.value; renderAll(); });
$('grade').addEventListener('change', (e) => { state.grade = e.target.value; renderAll(); });
$('spoiler').addEventListener('change', (e) => { state.spoilerOn = e.target.checked; renderAll(); });
$('exportBtn').addEventListener('click', () => {
  exportProgress(state.earned, { spoilerOn: state.spoilerOn, kind: state.kind, grade: state.grade });
});
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const result = importProgress(await file.text(), data.byName);
    state.earned = result.earned;
    saveEarned(state.earned);
    renderAll();
  } catch (err) {
    alert(`Could not import that file: ${err.message}`);
  }
  e.target.value = '';
});
$('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies?')) return;
  state.earned = new Set();
  saveEarned(state.earned);
  renderAll();
});

applySavedSettings();
applyDeepLinks();
buildKindChips();
syncControls();
renderAll();
