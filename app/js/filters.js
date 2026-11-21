// Filters for the checklist: kind chips, grade, search, and the spoiler rule.
export const KINDS = ['all', 'story', 'missable', 'collectibles', 'activities', 'online', 'completion'];

// A story trophy is a spoiler until earned: with the spoiler setting on, its name and
// description stay hidden in the list and only its grade shows.
export function isSpoilerHidden(trophy, spoilerOn, earned) {
  return spoilerOn && trophy.kind === 'story' && !earned.has(trophy.name);
}

export function applyFilters(trophies, { kind, grade, query, spoilerOn, earned }) {
  const q = query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (kind === 'missable' && !t.missable) return false;
    if (kind === 'online') return false; // No online trophies in this list: all 55 are offline.
    if (kind !== 'all' && kind !== 'missable' && t.kind !== kind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (q && !`${t.name} ${t.description}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function filterNoteFor({ kind, grade, query, shown, total, kindNotes }) {
  if (kind === 'online') return 'Online: this list has no online trophies — all 55 are earned offline.';
  const parts = [];
  if (kind !== 'all') parts.push(kindNotes[kind] ?? '');
  if (grade !== 'all') parts.push(`Grade: ${grade}.`);
  if (query.trim()) parts.push(`Matching “${query.trim()}”.`);
  parts.push(`Showing ${shown} of ${total} trophies.`);
  return parts.join(' ');
}
