// Loads the guide's data: the official trophy list with our guides, and the roadmap.
export async function loadGuideData() {
  const trophiesDoc = await (await fetch('data/trophies.json')).json();
  const roadmapDoc = await (await fetch('data/roadmap.json')).json();
  const trophies = trophiesDoc.trophies;
  const byId = new Map(trophies.map((t) => [t.id, t]));
  const byName = new Map(trophies.map((t) => [t.name, t]));
  return {
    trophies,
    byId,
    byName,
    sources: trophiesDoc.sources,
    kindLabels: trophiesDoc.kind_labels,
    kindNotes: trophiesDoc.kind_notes,
    missableMethod: trophiesDoc.missable_method,
    roadmap: roadmapDoc,
  };
}

// Counts of each grade in the official list: 1 platinum, 2 gold, 6 silver, 46 bronze.
export function gradeCounts(trophies) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) counts[t.grade] += 1;
  return counts;
}
