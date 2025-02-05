/********************************************************************************
 * condition.js
 *
 * Updated to account for multi-level stains. The rest of your logic remains,
 * but we specifically highlight how "stains.level" factors into the wear score.
 ********************************************************************************/

// A helper clamp function, if not already present
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates wear & tear (0..100%) factoring in:
 *  - Time factor, usage factor, wash factor
 *  - Multi-level stains (0..3)
 *  - Other temp wear like wrinkles, odors, etc. if you want
 */
window.calculateCondition = function (item) {
  // Basic usage/wash stats
  const totalWashes = item.washHistory.length;
  const totalUses = item.usageHistory.length;

  // Retrieve category durability or fallback
  const catDur = window.categoryDurability[item.category] || {
    maxUses: 100,
    maxWashes: 50,
    maxYears: 2,
  };

  // Weighted multiplier from fabrics
  let weightedMultiplier = 0;
  if (Array.isArray(item.fabrics) && item.fabrics.length > 0) {
    item.fabrics.forEach((fab) => {
      const fabricData = window.fabricDurability[fab.type] || { durabilityMultiplier: 1.0 };
      const fraction = (fab.percentage || 0) / 100;
      weightedMultiplier += fabricData.durabilityMultiplier * fraction;
    });
  } else {
    weightedMultiplier = 1.0;
  }

  // Convert category "maxYears" to weeks * multiplier
  const maxWeeks = catDur.maxYears * 52 * weightedMultiplier;
  const maxUses = catDur.maxUses * weightedMultiplier;
  const maxWashes = catDur.maxWashes * weightedMultiplier;

  // Time in weeks since purchase
  const purchaseDate = new Date(item.purchaseDate);
  const now = new Date();
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const weeksOwned = (now - purchaseDate) / msPerWeek;

  // Base factors (range 0..1)
  const timeFactor = clamp(weeksOwned / maxWeeks, 0, 1);
  const usageFactor = clamp(totalUses / maxUses, 0, 1);
  const washFactor = clamp(totalWashes / maxWashes, 0, 1);

  // =========== TEMPORARY WEAR FACTOR =============
  // multi-level approach for stains (0..3)
  const tempWear = item.wearAndTear || {
    wrinkles: false,
    odors: false,
    stains: { level: 0 },
    elasticityLoss: false,
    surfaceDirt: { level: 0 },
  };

  let tempImpact = 0;

  // Wrinkles => +0.05 if present
  if (tempWear.wrinkles) {
    tempImpact += 0.05;
  }

  // Odors => +0.1 if present
  if (tempWear.odors) {
    tempImpact += 0.1;
  }

  // Stains => level-based, e.g. each level is +0.1
  const stainLevel = tempWear.stains?.level || 0;
  if (stainLevel > 0) {
    tempImpact += 0.1 * stainLevel;
  }

  // elasticityLoss => +0.15 if true
  if (tempWear.elasticityLoss) {
    tempImpact += 0.15;
  }

  // surfaceDirt => each level is +0.05
  const dirtLevel = tempWear.surfaceDirt?.level || 0;
  if (dirtLevel > 0) {
    tempImpact += 0.05 * dirtLevel;
  }

  // clamp the total tempImpact so it doesn't exceed 1
  tempImpact = clamp(tempImpact, 0, 1);

  // Weighted approach for the final wear score
  // e.g., 30% time factor, 25% usageFactor, 25% washFactor, 20% temp
  let wearScore = 1
    - (0.3 * timeFactor)
    - (0.25 * usageFactor)
    - (0.25 * washFactor)
    - (0.2 * tempImpact);

  // clamp final wearScore to 0..1
  wearScore = clamp(wearScore, 0, 1);

  // convert to 0..100
  const conditionPercent = wearScore * 100;
  return parseFloat(conditionPercent.toFixed(1));
};
