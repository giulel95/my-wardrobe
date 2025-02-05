/**
 * condition.js
 *
 * Adds temporary wear & tear into the calculation.
 * 
 * The rest of your file remains the same. Just replace your old 
 * `window.calculateCondition = function(item) { ... }` 
 * with this new version.
 */

// A small helper clamp function (if you don't have it already):
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates wear & tear as a percentage (0-100) factoring in:
 * - Age, total uses, total washes
 * - Fabric multipliers
 * - Temporary wear & tear from item.wearAndTear
 */
window.calculateCondition = function (item) {
  // Base stats
  const totalWashes = item.washHistory.length;
  const totalUses   = item.usageHistory.length;

  // Retrieve category durability
  const catDur = window.categoryDurability[item.category] || { maxUses: 100, maxWashes: 50, maxYears: 2 };

  // Weighted multiplier from fabrics
  let weightedMultiplier = 0;
  if (Array.isArray(item.fabrics) && item.fabrics.length > 0) {
    item.fabrics.forEach((fab) => {
      const data = window.fabricDurability[fab.type] || { durabilityMultiplier: 1.0 };
      const fraction = (fab.percentage || 0) / 100;
      weightedMultiplier += data.durabilityMultiplier * fraction;
    });
  } else {
    weightedMultiplier = 1.0;
  }

  // Convert maxYears to weeks, then scale
  const maxWeeks = catDur.maxYears * 52 * weightedMultiplier;
  const maxUses   = catDur.maxUses   * weightedMultiplier;
  const maxWashes = catDur.maxWashes * weightedMultiplier;

  // Age in weeks
  const purchaseDate = new Date(item.purchaseDate);
  const now = new Date();
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const weeksOwned = (now - purchaseDate) / msPerWeek;

  // Base factors (range 0..1)
  const timeFactor  = clamp(weeksOwned / maxWeeks, 0, 1);
  const usageFactor = clamp(totalUses / maxUses, 0, 1);
  const washFactor  = clamp(totalWashes / maxWashes, 0, 1);

  //////////////////////////////////////////////////////////////////
  //  TEMPORARY WEAR FACTOR
  //////////////////////////////////////////////////////////////////
  const tempWear = item.wearAndTear || {
    wrinkles: false,
    odors: false,
    stains: { level: 0 },
    elasticityLoss: false,
    surfaceDirt: { level: 0 },
  };

  let tempImpact = 0;

  // Wrinkles => +0.05
  if (tempWear.wrinkles) tempImpact += 0.05;

  // Odors => +0.1
  if (tempWear.odors) tempImpact += 0.1;

  // Stains => scaled by level (0..3?), each level worth +0.1
  tempImpact += (tempWear.stains.level || 0) * 0.1;

  // Elasticity loss => +0.15
  if (tempWear.elasticityLoss) tempImpact += 0.15;

  // Surface dirt => each level (0..3?) worth +0.05
  tempImpact += (tempWear.surfaceDirt.level || 0) * 0.05;

  // Clamp total temp impact to [0..1]
  tempImpact = clamp(tempImpact, 0, 1);

  //////////////////////////////////////////////////////////////////
  // Combine all factors
  // The higher the sum of timeFactor, usageFactor, washFactor, and 
  // tempImpact, the lower the final condition.
  //////////////////////////////////////////////////////////////////
  // Weighted approach:
  //   timeFactor: 30%
  //   usageFactor: 25%
  //   washFactor: 25%
  //   tempWear: 20%
  //////////////////////////////////////////////////////////////////
  let wearScore = 1
    - (0.30 * timeFactor)
    - (0.25 * usageFactor)
    - (0.25 * washFactor)
    - (0.20 * tempImpact);

  // clamp to [0..1]
  wearScore = clamp(wearScore, 0, 1);

  // final condition in [0..100]
  const conditionPercent = wearScore * 100;
  return parseFloat(conditionPercent.toFixed(1));
};
