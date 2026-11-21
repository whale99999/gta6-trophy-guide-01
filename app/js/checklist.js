// Checklist view: the trophy rows and the detail pane with the selected trophy's guide.
// A row shows the official name, description and grade; the detail pane adds the guide,
// its steps, the missable window, the PSN counter, sources and a personal note.

import { getCount, getNote, isEarned, setCount, setEarned, setNote } from './store.js';
import { gradeLabel, kindOf, KIND_LABELS } from './trophydata.js';
import { spoilerHides } from './filters.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

export function renderChecklist(listEl, trophies, state, progress, selectedId, onSelect) {
  listEl.textContent = '';
  if (trophies.length === 0) {
    listEl.appendChild(el('p', 'empty-note', 'No trophies match these filters.'));
    return;
  }
  for (const trophy of trophies) {
    const hidden = spoilerHides(state, trophy, progress);
    const earned = isEarned(progress, trophy.id);
    const row = el('button', 'trophy-row' + (earned ? ' is-earned' : '') + (trophy.id === selectedId ? ' is-selected' : ''));
    row.type = 'button';
    row.setAttribute('role', 'listitem');
    row.addEventListener('click', () => onSelect(trophy.id));

    const check = el('span', 'trophy-check', earned ? '✓' : '');
    check.setAttribute('aria-hidden', 'true');
    row.appendChild(check);

    const main = el('span');
    const name = el('span', 'trophy-name', hidden ? 'Hidden trophy' : trophy.name);
    const desc = el('span', 'trophy-desc' + (hidden ? ' is-hidden-spoiler' : ''), hidden ? 'A story trophy — earn it to reveal its name.' : trophy.description);
    desc.style.display = 'block';
    main.appendChild(name);
    main.appendChild(desc);
    row.appendChild(main);

    const meta = el('span');
    const badge = el('span', 'grade-badge grade-' + trophy.grade, gradeLabel(trophy.grade));
    meta.appendChild(badge);
    if (trophy.missable) {
      const flag = el('span', 'missable-flag', ' MISSABLE');
      meta.appendChild(flag);
    }
    const kind = el('span', 'kind-tag', ' ' + (KIND_LABELS[kindOf(trophy)] || kindOf(trophy)));
    meta.appendChild(kind);
    row.appendChild(meta);

    listEl.appendChild(row);
  }
}

export function renderDetail(detailEl, trophy, state, progress, onProgressChange) {
  detailEl.textContent = '';
  if (!trophy) {
    detailEl.appendChild(el('p', 'detail-empty', 'Select a trophy on the left to read its guide, sources and missable window.'));
    return;
  }
  const hidden = spoilerHides(state, trophy, progress);
  const earned = isEarned(progress, trophy.id);

  const head = el('div', 'detail-head');
  head.appendChild(el('h3', null, hidden ? 'Hidden trophy' : trophy.name));
  head.appendChild(el('span', 'grade-badge grade-' + trophy.grade, gradeLabel(trophy.grade)));
  detailEl.appendChild(head);

  if (hidden) {
    detailEl.appendChild(
      el('p', 'detail-official', 'A story trophy. Its name and description stay hidden until you earn it — turn “Hide story spoilers” off to reveal it now.'),
    );
    const actions = el('div', 'detail-actions');
    const reveal = el('button', null, 'Reveal it anyway');
    reveal.type = 'button';
    reveal.addEventListener('click', () => onProgressChange({ revealSpoiler: true }));
    actions.appendChild(reveal);
    detailEl.appendChild(actions);
    return;
  }

  detailEl.appendChild(el('p', 'detail-official', trophy.description + ' — ' + (KIND_LABELS[kindOf(trophy)] || kindOf(trophy)) + ' · Stage ' + trophy.stage + (trophy.missable ? ' · Missable' : '')));

  if (trophy.missable && trophy.window) {
    const win = el('p', 'detail-window');
    win.innerHTML = '';
    win.appendChild(el('strong', null, 'Missable — closes: '));
    win.appendChild(document.createTextNode(trophy.window));
    detailEl.appendChild(win);
  }

  detailEl.appendChild(el('p', 'detail-guide', trophy.guide));

  if (Array.isArray(trophy.steps) && trophy.steps.length) {
    const steps = el('ol', 'detail-steps');
    for (const step of trophy.steps) steps.appendChild(el('li', null, step));
    detailEl.appendChild(steps);
  }

  if (trophy.target) {
    const target = el('p', 'detail-target');
    const current = getCount(progress, trophy.id);
    const done = current >= trophy.target.count;
    target.appendChild(document.createTextNode(`PSN tracks this: ${current.toLocaleString()} / ${trophy.target.count.toLocaleString()} ${trophy.target.label}${done ? ' — done' : ''}`));
    const bar = el('div', 'target-bar');
    const fill = el('div', 'target-fill');
    fill.style.width = Math.min(100, (current / trophy.target.count) * 100) + '%';
    bar.appendChild(fill);
    target.appendChild(bar);
    detailEl.appendChild(target);

    const counterRow = el('div', 'counter-row');
    counterRow.appendChild(el('label', null, 'Your count:'));
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = String(trophy.target.count);
    input.value = String(current);
    input.setAttribute('aria-label', 'Your progress toward ' + trophy.target.count + ' ' + trophy.target.label);
    input.addEventListener('change', () => {
      setCount(progress, trophy.id, input.value);
      onProgressChange({ refreshDetail: true });
    });
    counterRow.appendChild(input);
    detailEl.appendChild(counterRow);
  }

  const sources = el('div', 'detail-sources');
  sources.appendChild(el('strong', null, 'Sources: '));
  if (Array.isArray(trophy.sources) && trophy.sources.length) {
    const list = el('ul');
    for (const source of trophy.sources) {
      const item = el('li');
      const link = document.createElement('a');
      link.href = source.url;
      link.textContent = source.label;
      link.target = '_blank';
      link.rel = 'noopener';
      item.appendChild(link);
      list.appendChild(item);
    }
    sources.appendChild(list);
    sources.appendChild(
      document.createTextNode('Guide method: our own reading of the official description — not yet verified in-game where the description leaves the trigger open.'),
    );
  } else {
    sources.appendChild(document.createTextNode('Official trophy list (Exophase, PSNProfiles).'));
  }
  detailEl.appendChild(sources);

  const noteLabel = el('label', 'detail-note-label', 'Your note (saved in this browser):');
  noteLabel.htmlFor = 'trophyNote';
  detailEl.appendChild(noteLabel);
  const note = document.createElement('textarea');
  note.id = 'trophyNote';
  note.className = 'detail-note';
  note.placeholder = 'e.g. best spot, loadout, what worked…';
  note.value = getNote(progress, trophy.id);
  note.addEventListener('change', () => setNote(progress, trophy.id, note.value));
  detailEl.appendChild(note);

  const actions = el('div', 'detail-actions');
  const toggle = el('button', 'btn-earned' + (earned ? ' is-earned' : ''), earned ? '✓ Earned — tap to unmark' : 'Mark as earned');
  toggle.type = 'button';
  toggle.addEventListener('click', () => {
    setEarned(progress, trophy.id, !earned);
    onProgressChange({});
  });
  actions.appendChild(toggle);
  detailEl.appendChild(actions);
}
