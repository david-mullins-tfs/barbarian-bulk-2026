function propagateWeightChange(sets, index, value) {
  const next = sets.map(s => ({...s}));
  for (let i = index; i < next.length; i++) next[i].weight = value;
  return next;
}

function normalizeSetWeights(sets) {
  const next = sets.map(s => ({...s}));
  const firstWeight = next[0]?.weight ?? '';
  if (firstWeight !== '') {
    for (let i = 1; i < next.length; i++) {
      if (next[i].weight === '') next[i].weight = firstWeight;
    }
  }
  return next;
}

if (typeof module !== 'undefined') module.exports = { propagateWeightChange, normalizeSetWeights };
if (typeof window !== 'undefined') window.BarbarianWeightSync = { propagateWeightChange, normalizeSetWeights };
