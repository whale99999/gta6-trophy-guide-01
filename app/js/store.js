// Saved progress: the set of earned trophy names in localStorage, with export/import.
const KEY = 'leonida-platinum-progress-v1';
const SETTINGS_KEY = 'leonida-platinum-settings-v1';

export function loadEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return new Set(Array.isArray(raw) ? raw.filter((n) => typeof n === 'string') : []);
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
}

export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Export progress as a JSON file the reader can keep or move to another browser.
export function exportProgress(earned, settings) {
  const payload = { app: 'leonida-platinum', version: 1, earned: [...earned], settings };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

// Import a progress file: only names that exist in the official list are kept.
export function importProgress(text, knownNames) {
  const parsed = JSON.parse(text);
  const names = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(names)) throw new Error('Not a progress file: no earned list found.');
  const kept = names.filter((n) => knownNames.has(n));
  return { earned: new Set(kept), settings: parsed.settings ?? null };
}
