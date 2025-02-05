/********************************************************************************
 * condition.js
 *
 * Integrates advanced dryness, pilling, colorFade into the temporary wear 
 * calculation. We also add an optional synergy penalty for critical levels.
 ********************************************************************************/

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * calculateCondition(item):
 *  - Long-term factors: age/timeFactor, usageFactor, washFactor
 *  - Temporary wear factors: dryness/pilling/colorFade levels, stains, wrinkles, etc.
 *  - Optional synergy: if dryness/pilling/colorFade = 3, further degrade final condition.
 */
window.calculateCondition = function (item) {
  const totalWashes = item.washHistory.length;
  const totalUses   = item.usageHistory.length;

  // Category thresholds
  const catDur = window.categoryDurability[item.category] || {
    maxUses: 100, maxWashes: 50, maxYears: 2
  };

  // Fabric multiplier
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

  // Convert category years => weeks => scaled
  const maxWeeks  = catDur.maxYears  * 52 * weightedMultiplier;
  const maxUses   = catDur.maxUses   * weightedMultiplier;
  const maxWashes = catDur.maxWashes * weightedMultiplier;

  // Age in weeks
  const purchaseDate = new Date(item.purchaseDate);
  const now = new Date();
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const weeksOwned = (now - purchaseDate) / msPerWeek;

  // Base factors
  const timeFactor  = clamp(weeksOwned / maxWeeks, 0, 1);
  const usageFactor = clamp(totalUses / maxUses, 0, 1);
  const washFactor  = clamp(totalWashes / maxWashes, 0, 1);

  // TEMPORARY WEAR
  const tempWear = item.wearAndTear || {
    wrinkles: false,
    odors: false,
    stains: { level: 0 },
    elasticityLoss: false,
    surfaceDirt: { level: 0 },
    dryness: { level: 0 },
    pilling: { level: 0 },
    colorFade: { level: 0 },
  };

  let tempImpact = 0;

  // wrinkles => +0.05
  if (tempWear.wrinkles) {
    tempImpact += 0.05;
  }
  // odors => +0.1
  if (tempWear.odors) {
    tempImpact += 0.1;
  }
  // stains => each level +0.1
  const stainLevel = tempWear.stains.level || 0;
  if (stainLevel > 0) {
    tempImpact += 0.1 * stainLevel;
  }
  // dryness => each level +0.1
  const drynessLevel = tempWear.dryness.level || 0;
  if (drynessLevel > 0) {
    tempImpact += 0.1 * drynessLevel;
  }
  // pilling => each level +0.1
  const pillingLevel = tempWear.pilling.level || 0;
  if (pillingLevel > 0) {
    tempImpact += 0.1 * pillingLevel;
  }
  // colorFade => each level +0.05
  const fadeLevel = tempWear.colorFade.level || 0;
  if (fadeLevel > 0) {
    tempImpact += 0.05 * fadeLevel;
  }
  // surfaceDirt => each level +0.05
  const dirtLevel = tempWear.surfaceDirt.level || 0;
  if (dirtLevel > 0) {
    tempImpact += 0.05 * dirtLevel;
  }

  // clamp tempImpact to [0..1]
  tempImpact = clamp(tempImpact, 0, 1);

  // Weighted approach
  let wearScore = 1
    - (0.3 * timeFactor)
    - (0.25 * usageFactor)
    - (0.25 * washFactor)
    - (0.2 * tempImpact);

  // Optional synergy for critical levels
  // If dryness or pilling or colorFade is at level 3 => further degrade final
  if (drynessLevel === 3 || pillingLevel === 3 || fadeLevel === 3) {
    // For each advanced condition at level 3, degrade wearScore by 0.05
    let synergyPenalty = 0;
    if (drynessLevel === 3) synergyPenalty += 0.05;
    if (pillingLevel === 3) synergyPenalty += 0.05;
    if (fadeLevel === 3) synergyPenalty += 0.05;
    wearScore -= synergyPenalty;
  }

  wearScore = clamp(wearScore, 0, 1);

  const conditionPercent = wearScore * 100;
  return parseFloat(conditionPercent.toFixed(1));
};
