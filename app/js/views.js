// Renders the checklist, the trophy detail pane, the roadmap and the missables page.
import { applyFilters, isSpoilerHidden } from './filters.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function gradeBadge(grade) {
  return el('span', `gradebadge grade-${grade}`, grade);
}

function kindTag(label) {
  return el('span', 'kindtag', label);
}

// The checklist: one row a trophy, with its official name, description, grade and kind.
// Ticking a box saves the trophy as earned; clicking a row opens its guide beside the list.
export function renderChecklist(rowsEl, emptyEl, data, state, onToggle, onSelect) {
  const shown = applyFilters(data.trophies, state);
  rowsEl.replaceChildren();
  emptyEl.hidden = shown.length > 0;
  for (const t of shown) {
    const tr = document.createElement('tr');
    if (state.earned.has(t.name)) tr.classList.add('earned');
    if (state.selectedId === t.id) tr.classList.add('selected');
    const boxCell = document.createElement('td');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.earned.has(t.name);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('change', (e) => { e.stopPropagation(); onToggle(t, box.checked); });
    box.addEventListener('click', (e) => e.stopPropagation());
    boxCell.append(box);
    const nameCell = document.createElement('td');
    if (isSpoilerHidden(t, state.spoilerOn, state.earned)) {
      nameCell.append(el('span', 'hidden-name', 'Hidden trophy — earn it to reveal'));
      nameCell.append(document.createElement('br'));
      nameCell.append(el('span', 'tdesc', 'Story trophy, hidden by the spoiler setting.'));
    } else {
      nameCell.append(el('div', 'tname', t.name));
      nameCell.append(el('div', 'tdesc', t.description));
      if (t.target_label) nameCell.append(el('div', 'tcount', `Target: ${t.target_label}`));
      if (t.missable) nameCell.append(el('span', 'missflag', '⚠ Missable'));
    }
    const gradeCell = document.createElement('td');
    gradeCell.append(gradeBadge(t.grade));
    const kindCell = document.createElement('td');
    kindCell.append(kindTag(data.kindLabels[t.kind] ?? t.kind));
    tr.append(boxCell, nameCell, gradeCell, kindCell);
    tr.addEventListener('click', () => onSelect(t.id));
    rowsEl.append(tr);
  }
  return shown.length;
}

// The detail pane: the official name, description and grade, then our guide in our own
// words with its sources named, and the missable warning when the trophy has one.
export function renderDetail(detailEl, data, trophy, earned) {
  detailEl.replaceChildren();
  if (!trophy) {
    detailEl.append(el('p', 'hint', 'Pick a trophy from the list to see its guide, its sources, and when it can be missed.'));
    return;
  }
  detailEl.append(el('h3', null, trophy.name));
  detailEl.append(el('p', 'odesc', `“${trophy.description}” — official description`));
  const meta = el('div', 'meta');
  meta.append(gradeBadge(trophy.grade));
  meta.append(kindTag(data.kindLabels[trophy.kind] ?? trophy.kind));
  if (trophy.target_label) meta.append(el('span', 'tcount', `Target: ${trophy.target_label}`));
  if (trophy.missable) meta.append(el('span', 'missflag', '⚠ Missable'));
  detailEl.append(meta);
  if (trophy.missable && trophy.missable_note) {
    detailEl.append(el('div', 'warnbox', `Missable: ${trophy.missable_note}`));
  }
  detailEl.append(el('h4', null, 'Guide'));
  detailEl.append(el('p', null, trophy.guide));
  detailEl.append(el('h4', null, 'Sources'));
  const src = el('p', 'sources');
  for (const key of trophy.sources ?? []) {
    const s = data.sources[key];
    if (!s) continue;
    const a = document.createElement('a');
    a.href = s.url;
    a.textContent = s.label;
    a.target = '_blank';
    a.rel = 'noopener';
    src.append(a, document.createElement('br'));
  }
  const note = el('span', null, 'Guide text is our own words, built from the official description above.');
  src.append(note);
  detailEl.append(src);
  const state = el('p', 'hint', earned.has(trophy.name)
    ? '✓ Earned — ticked in your checklist.'
    : 'Not earned yet — tick the box in the list when you get it.');
  detailEl.append(state);
}

// The roadmap: five stages in order, each with its steps and the trophies it covers,
// chips crossed out as you earn them.
export function renderRoadmap(stagesEl, titleEl, subEl, data, earned) {
  const roadmap = data.roadmap;
  titleEl.textContent = roadmap.title;
  subEl.textContent = roadmap.subtitle;
  stagesEl.replaceChildren();
  for (const stage of roadmap.stages) {
    const li = document.createElement('li');
    const h = el('h3', null, stage.title);
    const num = el('span', 'stagenum', String(stage.n));
    h.prepend(num);
    li.append(h);
    const steps = document.createElement('ol');
    for (const s of stage.steps) steps.append(el('li', null, s));
    li.append(steps);
    const chips = el('div', 'stagechips');
    for (const id of stage.trophy_ids) {
      const t = data.byId.get(id);
      if (!t) continue;
      const chip = el('span', `stagechip${earned.has(t.name) ? ' done' : ''}`, `${t.name} · ${t.grade}`);
      chips.append(chip);
    }
    li.append(chips);
    stagesEl.append(li);
  }
}

// The missables page: every flagged trophy with its window, in roadmap order.
export function renderMissables(listEl, introEl, methodEl, data, earned) {
  const roadmap = data.roadmap;
  introEl.textContent = roadmap.missable_intro;
  methodEl.textContent = data.missableMethod;
  listEl.replaceChildren();
  for (const id of roadmap.missable_ids) {
    const t = data.byId.get(id);
    if (!t) continue;
    const card = el('div', 'misscard');
    card.append(el('h3', null, `${t.name} — ${t.grade}`));
    card.append(el('div', 'when', `When it can be missed: ${t.missable_note ?? ''}`));
    card.append(el('p', null, t.description));
    card.append(el('p', null, t.guide));
    card.append(el('p', 'hint', earned.has(t.name) ? '✓ Earned.' : 'Not earned yet.'));
    listEl.append(card);
  }
}

// The header progress: earned count, the bar, and the percent to the platinum.
export function updateProgress(countEl, barEl, lineEl, earned, total) {
  countEl.textContent = String(earned.size);
  const pct = Math.round((earned.size / total) * 100);
  barEl.style.width = `${pct}%`;
  lineEl.textContent = earned.size === total
    ? 'Platinum earned — Vice Got a Price!'
    : `${pct}% to the platinum — ${total - earned.size} to go`;
}
