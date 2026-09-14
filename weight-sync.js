function propagateWeightChange(sets, index, value) {
  const next = sets.map(s => ({...s}));
  for (let i = index; i < next.length; i++) next[i].weight = value;
  return next;
}
if (typeof module !== 'undefined') module.exports = { propagateWeightChange };
if (typeof window !== 'undefined') window.BarbarianWeightSync = { propagateWeightChange };
