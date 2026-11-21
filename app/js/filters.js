// Filters: search text, kind, grade, sort order, spoiler masking and unearned-only.
// The spoiler rule hides the name and description of an unearned STORY trophy;
// earned story trophies, and every other kind, always show in full.

import { isEarned } from './store.js';
import { isMissable, kindOf } from './trophydata.js';

export function blankFilterState() {
  return { query: '', kind: 'all', grade: 'all', sort: 'roadmap', spoiler: false, unearnedOnly: false };
}

export function spoilerHides(state, trophy, progress) {
  if (!state.spoiler) return false;
  if (isEarned(progress, trophy.id)) return false;
  return kindOf(trophy) === 'story';
}

export function matchesKind(state, trophy) {
  if (state.kind === 'all') return true;
  if (state.kind === 'missable') return isMissable(trophy);
  if (state.kind === 'online') return false; // This list has no online trophies.
  return kindOf(trophy) === state.kind;
}

export function matchesQuery(state, trophy) {
  const q = state.query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [trophy.name, trophy.description, trophy.guide || '', (trophy.steps || []).join(' ')]
    .join(' ')
    .toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

export function sortTrophies(state, trophies) {
  const gradeRank = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  const list = [...trophies];
  if (state.sort === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (state.sort === 'grade') {
    list.sort((a, b) => gradeRank[a.grade] - gradeRank[b.grade] || a.name.localeCompare(b.name));
  } else if (state.sort === 'earned') {
    list.sort((a, b) => (b._earned ? 1 : 0) - (a._earned ? 1 : 0) || a.stage - b.stage || a.id - b.id);
  } else {
    list.sort((a, b) => a.stage - b.stage || a.id - b.id);
  }
  return list;
}

export function applyFilters(state, trophies, progress) {
  const filtered = trophies.filter((t) => {
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (!matchesKind(state, t)) return false;
    if (state.unearnedOnly && isEarned(progress, t.id)) return false;
    if (!matchesQuery(state, t)) return false;
    return true;
  });
  for (const t of filtered) t._earned = isEarned(progress, t.id);
  return sortTrophies(state, filtered);
}

export function filterSummary(state, shown, total) {
  const parts = [];
  if (state.kind !== 'all') parts.push(state.kind === 'missable' ? 'missable' : state.kind);
  if (state.grade !== 'all') parts.push(state.grade);
  if (state.query.trim()) parts.push(`matching “${state.query.trim()}”`);
  if (state.unearnedOnly) parts.push('unearned only');
  if (state.spoiler) parts.push('spoilers hidden');
  const label = parts.length ? parts.join(' · ') : 'all trophies';
  return `${shown} of ${total} — ${label}`;
}
