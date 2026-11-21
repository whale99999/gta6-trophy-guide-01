// Roadmap, missables and planner pages — all built from the trophy data and your progress.

import { isEarned, setEarned } from './store.js';
import { STAGES, missableTrophies, stageTrophies } from './trophydata.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

export function renderRoadmap(leedeEl, listEl, trophies, progress, onSelectTrophy) {
  const totalEarned = Object.keys(progress.earned).length;
  leedeEl.textContent =
    `Five stages, in order, from the first mission to the platinum. You are ${totalEarned} of 55 in — ` +
    'finish a stage before the next one, and do the missables inside stage 1 while the story is still running.';
  listEl.textContent = '';
  for (const stage of STAGES) {
    const members = stageTrophies(trophies, stage.stage);
    const earned = members.filter((t) => isEarned(progress, t.id)).length;
    const card = el('li', 'stage-card');
    const head = el('div', 'stage-head');
    head.appendChild(el('h3', null, stage.title));
    head.appendChild(el('span', 'stage-count', `${earned} / ${members.length} earned`));
    card.appendChild(head);
    card.appendChild(el('p', null, stage.blurb));
    const chips = el('div', 'stage-trophies');
    for (const trophy of members) {
      const chip = el('button', 'stage-trophy' + (isEarned(progress, trophy.id) ? ' is-earned' : ''), (trophy.missable ? '⚠ ' : '') + trophy.name);
      chip.type = 'button';
      chip.addEventListener('click', () => onSelectTrophy(trophy.id));
      chips.appendChild(chip);
    }
    card.appendChild(chips);
    const bar = el('div', 'stage-bar');
    const fill = el('div', 'stage-fill');
    fill.style.width = (members.length ? (earned / members.length) * 100 : 0) + '%';
    bar.appendChild(fill);
    card.appendChild(bar);
    listEl.appendChild(card);
  }
}

export function renderMissables(gridEl, trophies, progress, onSelectTrophy) {
  gridEl.textContent = '';
  for (const trophy of missableTrophies(trophies)) {
    const earned = isEarned(progress, trophy.id);
    const card = el('article', 'missable-card' + (earned ? ' is-earned' : ''));
    card.appendChild(el('span', 'missable-flag', '⚠ MISSABLE'));
    card.appendChild(el('h3', null, trophy.name));
    card.appendChild(el('p', 'detail-official', trophy.description));
    if (trophy.window) {
      const win = el('p', 'detail-window');
      win.appendChild(el('strong', null, 'Closes: '));
      win.appendChild(document.createTextNode(trophy.window));
      card.appendChild(win);
    }
    card.appendChild(el('p', null, trophy.guide));
    const open = el('button', null, earned ? '✓ Earned — read the guide' : 'Read the full guide');
    open.type = 'button';
    open.addEventListener('click', () => onSelectTrophy(trophy.id));
    card.appendChild(open);
    const toggle = el('button', 'btn-quiet', earned ? 'Unmark earned' : 'Mark as earned');
    toggle.type = 'button';
    toggle.addEventListener('click', () => {
      setEarned(progress, trophy.id, !earned);
      renderMissables(gridEl, trophies, progress, onSelectTrophy);
    });
    card.appendChild(toggle);
    gridEl.appendChild(card);
  }
}

export function renderPlanner(bodyEl, trophies, progress, onSelectTrophy) {
  bodyEl.textContent = '';
  let shown = 0;
  for (const stage of STAGES) {
    const next = stageTrophies(trophies, stage.stage).filter((t) => !isEarned(progress, t.id));
    const section = el('div', 'planner-stage');
    section.appendChild(el('h3', null, stage.title));
    if (next.length === 0) {
      section.appendChild(el('p', 'planner-done', '✓ Stage complete — every trophy in this stage is earned.'));
    } else {
      const list = el('div', 'planner-list');
      for (const trophy of next.slice(0, 5)) {
        shown += 1;
        const row = el('button', 'trophy-row');
        row.type = 'button';
        row.addEventListener('click', () => onSelectTrophy(trophy.id));
        row.appendChild(el('span', 'trophy-check', ''));
        const main = el('span');
        main.appendChild(el('span', 'trophy-name', trophy.name));
        const desc = el('span', 'trophy-desc', trophy.description + (trophy.missable ? ' — MISSABLE, do it before its window closes.' : ''));
        desc.style.display = 'block';
        main.appendChild(desc);
        row.appendChild(main);
        row.appendChild(el('span', 'grade-badge grade-' + trophy.grade, trophy.grade));
        list.appendChild(row);
      }
      section.appendChild(list);
      if (next.length > 5) {
        section.appendChild(el('p', 'planner-empty', `+ ${next.length - 5} more in this stage — see the checklist.`));
      }
    }
    bodyEl.appendChild(section);
  }
  if (shown === 0) {
    bodyEl.appendChild(el('p', 'planner-done', '✓ Everything is earned — the platinum is yours, Leonida Legend.'));
  }
}
