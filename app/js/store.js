// Progress store: earned flags, PSN counters and personal notes, saved in localStorage.
// Export writes a JSON file; import reads one back and validates it before applying.
// Imported files are checked shape-first: a bad file is refused with a reason.

export const PROGRESS_KEY = 'leonida-platinum-progress-v1';

export function blankProgress() {
  return { version: 1, earned: {}, counts: {}, notes: {} };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return blankProgress();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return blankProgress();
    return {
      version: 1,
      earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
    };
  } catch (err) {
    return blankProgress();
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (err) {
    // Storage full or unavailable: progress stays in memory for this session.
  }
}

export function isEarned(progress, id) {
  return Boolean(progress.earned[String(id)]);
}

export function setEarned(progress, id, earned) {
  if (earned) progress.earned[String(id)] = true;
  else delete progress.earned[String(id)];
  saveProgress(progress);
}

export function earnedCount(progress) {
  return Object.keys(progress.earned).length;
}

export function getCount(progress, id) {
  const value = Number(progress.counts[String(id)]);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function setCount(progress, id, value) {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  if (n === 0) delete progress.counts[String(id)];
  else progress.counts[String(id)] = n;
  saveProgress(progress);
}

export function getNote(progress, id) {
  return progress.notes[String(id)] || '';
}

export function setNote(progress, id, text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) delete progress.notes[String(id)];
  else progress.notes[String(id)] = trimmed;
  saveProgress(progress);
}

export function exportProgress(progress) {
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'leonida-platinum-progress.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Returns { ok: true, progress } or { ok: false, reason } — never throws on bad input.
export function parseImportedProgress(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return { ok: false, reason: 'That file is not valid JSON.' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'That file is not a progress export.' };
  }
  const next = blankProgress();
  if (parsed.earned && typeof parsed.earned === 'object') {
    for (const [id, value] of Object.entries(parsed.earned)) {
      if (value === true && /^\d+$/.test(id)) next.earned[id] = true;
    }
  }
  if (parsed.counts && typeof parsed.counts === 'object') {
    for (const [id, value] of Object.entries(parsed.counts)) {
      const n = Math.floor(Number(value));
      if (/^\d+$/.test(id) && Number.isFinite(n) && n > 0) next.counts[id] = n;
    }
  }
  if (parsed.notes && typeof parsed.notes === 'object') {
    for (const [id, value] of Object.entries(parsed.notes)) {
      if (/^\d+$/.test(id) && typeof value === 'string' && value.trim()) next.notes[id] = value.trim();
    }
  }
  return { ok: true, progress: next };
}
