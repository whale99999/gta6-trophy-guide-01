// Trophy data: loading the official list and the small lookups the views share.
// The five roadmap stages and their blurbs live here, so the pages render from data.

export const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  completion: 'Completion',
  online: 'Online',
};

export const KIND_FILTERS = ['all', 'story', 'missable', 'collectibles', 'activities', 'completion', 'online'];

export const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

export const STAGES = [
  {
    stage: 1,
    title: 'Stage 1 — Play the story',
    blurb:
      'Chapters 1 to 4, the final mission and the named story missions — plus the four missables that need the story still running. Do Hot Together, Retail Therapy, Capital Offense and Personal Best before the finale, or they are gone.',
  },
  {
    stage: 2,
    title: 'Stage 2 — Strangers and side missions',
    blurb:
      'The stranger strands: Andy, Kenton, Billy, Randy and Tyrone each have a final-mission trophy, Bret has a hunt, and eight completed strands earn the silver. Explore every region — stranger markers only appear once you have been near them.',
  },
  {
    stage: 3,
    title: 'Stage 3 — Collectibles and exploration',
    blurb:
      'Meditation spots, card sets, WAiNK at 100 locations, 100 vehicles discovered, every corner of Leonida explored, all garage properties bought and 10 vehicles registered to Scooter Bros. Travel with a checklist, region by region.',
  },
  {
    stage: 4,
    title: 'Stage 4 — Activities and mastery',
    blurb:
      'The long grinds: 250 stunts, gold in all 42 Shooting Range challenges, 20 different race wins, drone races at every Top Fun spot, fishing against Cal, 50 challenges, the robberies and the combat feats. Sample every activity type early — it also earns Master of None.',
  },
  {
    stage: 5,
    title: 'Stage 5 — Cleanup and the platinum',
    blurb:
      'Money and habits: $250,000 laundered, $100,000 spent, choices made at every turn, a fail-and-retry, and the strange sighting. Finish with 100% completion (A Long Road) — and the platinum pops with it.',
  },
];

export async function loadTrophyData() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error('Could not load data/trophies.json');
  const data = await response.json();
  const trophies = Array.isArray(data) ? data : data.trophies;
  return { trophies, sources: data.sources || [] };
}

export function trophyById(trophies, id) {
  return trophies.find((t) => t.id === Number(id)) || null;
}

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function kindOf(trophy) {
  return trophy.kind || 'activities';
}

export function isMissable(trophy) {
  return trophy.missable === true;
}

export function stageTrophies(trophies, stage) {
  return trophies.filter((t) => t.stage === stage);
}

export function missableTrophies(trophies) {
  return trophies.filter(isMissable);
}
