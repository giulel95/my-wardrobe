/********************************************************************************
 * condition.js
 *
 * Reads new multi-level "stains.level" (0..3) plus dryness/pilling/colorFade
 * in the temporary wear, integrates them into the final condition score.
 * We do null checks so no error occurs if something is undefined.
 ********************************************************************************/

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

window.calculateCondition = function (item) {
  // Basic stats
  const totalWashes = item.washHistory ? item.washHistory.length : 0;
  const totalUses = item.usageHistory ? item.usageHistory.length : 0;

  // Category durability
  const catDur = window.categoryDurability[item.category] || {
    maxUses: 100,
    maxWashes: 50,
    maxYears: 2
  };

  // Weighted multiplier from fabrics
  let weightedMultiplier = 0;
  if (Array.isArray(item.fabrics)) {
    item.fabrics.forEach(f => {
      const data = window.fabricDurability[f.type] || { durabilityMultiplier: 1.0 };
      const fraction = (f.percentage || 0) / 100;
      weightedMultiplier += data.durabilityMultiplier * fraction;
    });
  } else {
    weightedMultiplier = 1.0;
  }

  // Convert to weeks
  const maxWeeks = catDur.maxYears * 52 * weightedMultiplier;
  const maxUses = catDur.maxUses * weightedMultiplier;
  const maxWashes = catDur.maxWashes * weightedMultiplier;

  // Time factor
  const purchaseDate = new Date(item.purchaseDate);
  const now = new Date();
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const weeksOwned = (now - purchaseDate) / msPerWeek;

  const timeFactor  = clamp(weeksOwned / maxWeeks, 0, 1);
  const usageFactor = clamp(totalUses / maxUses, 0, 1);
  const washFactor  = clamp(totalWashes / maxWashes, 0, 1);

  // Temporary wear
  const tw = item.wearAndTear || {};
  // Booleans
  const wrinkles = tw.wrinkles || false;
  const odors = tw.odors || false;

  // Level-based
  const stainsLevel = (tw.stains && typeof tw.stains.level === 'number') ? tw.stains.level : 0;
  const drynessLevel = (tw.dryness && typeof tw.dryness.level === 'number') ? tw.dryness.level : 0;
  const pillingLevel = (tw.pilling && typeof tw.pilling.level === 'number') ? tw.pilling.level : 0;
  const fadeLevel = (tw.colorFade && typeof tw.colorFade.level === 'number') ? tw.colorFade.level : 0;
  const dirtLevel = (tw.surfaceDirt && typeof tw.surfaceDirt.level === 'number') ? tw.surfaceDirt.level : 0;

  let tempImpact = 0;
  if (wrinkles)  tempImpact += 0.05;
  if (odors)     tempImpact += 0.1;
  // each stain level => +0.1
  tempImpact += (0.1 * stainsLevel);
  // dryness => +0.1 each
  tempImpact += (0.1 * drynessLevel);
  // pilling => +0.1 each
  tempImpact += (0.1 * pillingLevel);
  // colorFade => +0.05 each
  tempImpact += (0.05 * fadeLevel);
  // dirt => +0.05 each
  tempImpact += (0.05 * dirtLevel);

  tempImpact = clamp(tempImpact, 0, 1);

  // Weighted approach
  let wearScore = 1
    - (0.3 * timeFactor)
    - (0.25 * usageFactor)
    - (0.25 * washFactor)
    - (0.2 * tempImpact);

  // Optional synergy penalty if dryness/pilling/fade at max level (3)
  let synergy = 0;
  if (drynessLevel === 3) synergy += 0.05;
  if (pillingLevel === 3) synergy += 0.05;
  if (fadeLevel === 3)    synergy += 0.05;
  wearScore -= synergy;

  wearScore = clamp(wearScore, 0, 1);
  return parseFloat((wearScore * 100).toFixed(1));
};
