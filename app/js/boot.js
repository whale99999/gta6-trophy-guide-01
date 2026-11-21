// Boot: loads the trophy list, wires the toolbar and page nav, and keeps every view
// in step with the saved progress. Hash routes: #/checklist, #/roadmap, #/missables,
// #/planner and #/trophy-<id> (opens the checklist with that trophy's guide).
// Every hash change re-renders, so a deep link always shows the right view.
// Keyboard: pressing / anywhere focuses the search box.

import { loadTrophyData, trophyById, KIND_FILTERS, KIND_LABELS } from './trophydata.js';
import {
  loadProgress,
  saveProgress,
  blankProgress,
  earnedCount,
  exportProgress,
  parseImportedProgress,
} from './store.js';
import { blankFilterState, applyFilters, filterSummary } from './filters.js';
import { renderChecklist, renderDetail } from './checklist.js';
import { renderRoadmap, renderMissables, renderPlanner } from './pages.js';

const PAGES = ['checklist', 'roadmap', 'missables', 'planner'];
const RING_CIRCUMFERENCE = 326.7;

const progress = loadProgress();
const state = blankFilterState();
let trophies = [];
let selectedId = null;

const $ = (id) => document.getElementById(id);

function updateMeter() {
  const earned = earnedCount(progress);
  const pct = Math.round((earned / 55) * 100);
  $('earnedBig').textContent = String(earned);
  $('platinumLine').textContent = earned === 55 ? 'Platinum earned — Leonida Legend!' : `${pct}% to the platinum`;
  $('ringFill').style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - earned / 55));
  $('meterFill').style.width = pct + '%';
}

function renderAll() {
  updateMeter();
  const shown = applyFilters(state, trophies, progress);
  $('filterSummary').textContent = filterSummary(state, shown.length, trophies.length);
  renderChecklist($('trophyList'), shown, state, progress, selectedId, selectTrophy);
  const selected = selectedId ? trophyById(trophies, selectedId) : shown[0] || null;
  if (selected && !selectedId) selectedId = selected.id;
  renderDetail($('trophyDetail'), selected, state, progress, handleProgressChange);
  renderRoadmap($('roadmapLede'), $('stageList'), trophies, progress, selectTrophy);
  renderMissables($('missableGrid'), trophies, progress, selectTrophy);
  renderPlanner($('plannerBody'), trophies, progress, selectTrophy);
}

function handleProgressChange(change) {
  if (change && change.revealSpoiler) {
    state.spoiler = false;
    $('spoilerHide').checked = false;
  }
  saveProgress(progress);
  renderAll();
}

function selectTrophy(id) {
  selectedId = Number(id);
  showPage('checklist');
  renderAll();
  const detail = $('trophyDetail');
  if (detail) detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showPage(page) {
  const target = PAGES.includes(page) ? page : 'checklist';
  for (const name of PAGES) {
    $('page-' + name).hidden = name !== target;
    const button = document.querySelector(`.pagenav-btn[data-page="${name}"]`);
    if (button) button.classList.toggle('is-active', name === target);
  }
  if (location.hash !== '#/' + target) history.replaceState(null, '', '#/' + target);
}

function readHash() {
  const hash = location.hash || '';
  const trophyMatch = hash.match(/^#\/trophy-(\d+)$/);
  if (trophyMatch) {
    const trophy = trophyById(trophies, Number(trophyMatch[1]));
    if (trophy) {
      selectedId = trophy.id;
      showPage('checklist');
      renderAll();
      return;
    }
  }
  const pageMatch = hash.match(/^#\/([a-z]+)$/);
  showPage(pageMatch ? pageMatch[1] : 'checklist');
  renderAll();
}

function buildKindChips() {
  const wrap = $('kindChips');
  wrap.textContent = '';
  for (const kind of KIND_FILTERS) {
    const label = kind === 'all' ? 'All kinds' : kind === 'missable' ? 'Missable' : kind === 'online' ? 'Online (0)' : KIND_LABELS[kind];
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (state.kind === kind ? ' is-active' : '');
    chip.textContent = label;
    chip.addEventListener('click', () => {
      state.kind = kind;
      for (const other of wrap.children) other.classList.remove('is-active');
      chip.classList.add('is-active');
      renderAll();
    });
    wrap.appendChild(chip);
  }
}

function wireToolbar() {
  $('searchBox').addEventListener('input', (event) => {
    state.query = event.target.value;
    renderAll();
  });
  $('gradePick').addEventListener('change', (event) => {
    state.grade = event.target.value;
    renderAll();
  });
  $('sortPick').addEventListener('change', (event) => {
    state.sort = event.target.value;
    renderAll();
  });
  $('spoilerHide').addEventListener('change', (event) => {
    state.spoiler = event.target.checked;
    renderAll();
  });
  $('unearnedOnly').addEventListener('change', (event) => {
    state.unearnedOnly = event.target.checked;
    renderAll();
  });
  $('exportBtn').addEventListener('click', () => exportProgress(progress));
  $('importInput').addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const text = await file.text();
    const result = parseImportedProgress(text);
    if (!result.ok) {
      alert('Import failed: ' + result.reason);
    } else {
      const next = result.progress;
      progress.earned = next.earned;
      progress.counts = next.counts;
      progress.notes = next.notes;
      saveProgress(progress);
      renderAll();
      alert('Progress imported: ' + earnedCount(progress) + ' of 55 earned.');
    }
    event.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('Reset all progress, counters and notes? This cannot be undone.')) return;
    const next = blankProgress();
    progress.earned = next.earned;
    progress.counts = next.counts;
    progress.notes = next.notes;
    selectedId = null;
    saveProgress(progress);
    renderAll();
  });
  // Pressing / focuses search from anywhere on the page (unless already typing).
  document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    event.preventDefault();
    $('searchBox').focus();
  });
}

function wireNav() {
  for (const button of document.querySelectorAll('.pagenav-btn')) {
    button.addEventListener('click', () => showPage(button.dataset.page));
  }
  window.addEventListener('hashchange', readHash);
}

async function boot() {
  try {
    const data = await loadTrophyData();
    trophies = data.trophies;
  } catch (err) {
    $('trophyList').textContent = 'Could not load the trophy list (data/trophies.json). Serve app/ over HTTP and reload.';
    return;
  }
  buildKindChips();
  wireToolbar();
  wireNav();
  readHash();
  renderAll();
}

boot();
