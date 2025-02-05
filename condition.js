/********************************************************************************
 * condition.js
 *
 * Calculates the overall condition of an item (0–100%) based on long-term wear
 * factors (age, usage, washes) combined with temporary wear factors (stains,
 * dryness, pilling, color fade, etc.). This updated version checks for undefined
 * temporary wear properties to prevent runtime errors.
 ********************************************************************************/

// Helper function to clamp values between min and max
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates the wear & tear condition as a percentage (0–100%).
 * The calculation uses:
 *  - Long-term factors: timeFactor (weeks owned / maxWeeks), usageFactor, washFactor.
 *  - Temporary wear factors: wrinkles, odors, stains, dryness, pilling, colorFade,
 *    and surfaceDirt.
 *
 * This version ensures that if an item's temporary wear data is missing or its
 * sub‑properties (like stains.level) are undefined, default values are used.
 */
window.calculateCondition = function (item) {
  // Basic stats
  const totalWashes = item.washHistory ? item.washHistory.length : 0;
  const totalUses = item.usageHistory ? item.usageHistory.length : 0;

  // Retrieve category-specific durability thresholds or use defaults
  const catDur = window.categoryDurability[item.category] || {
    maxUses: 100,
    maxWashes: 50,
    maxYears: 2
  };

  // Calculate weighted multiplier from fabrics
  let weightedMultiplier = 0;
  if (Array.isArray(item.fabrics)) {
    item.fabrics.forEach(fab => {
      const fabricData = window.fabricDurability[fab.type] || { durabilityMultiplier: 1.0 };
      const fraction = (fab.percentage || 0) / 100;
      weightedMultiplier += fabricData.durabilityMultiplier * fraction;
    });
  } else {
    weightedMultiplier = 1.0;
  }

  // Scale category thresholds by weighted multiplier:
  const maxWeeks = catDur.maxYears * 52 * weightedMultiplier;
  const maxUses = catDur.maxUses * weightedMultiplier;
  const maxWashes = catDur.maxWashes * weightedMultiplier;

  // Calculate age in weeks
  const purchaseDate = new Date(item.purchaseDate);
  const now = new Date();
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const weeksOwned = (now - purchaseDate) / msPerWeek;

  // Base factors (normalized to 0..1)
  const timeFactor = clamp(weeksOwned / maxWeeks, 0, 1);
  const usageFactor = clamp(totalUses / maxUses, 0, 1);
  const washFactor = clamp(totalWashes / maxWashes, 0, 1);

  /**************************************************************************
   * Temporary Wear Factor Calculation
   *
   * We first ensure that item.wearAndTear exists and that each property is
   * defined. If not, we substitute default values.
   **************************************************************************/
  const tempWear = item.wearAndTear || {};
  const wrinkles = (tempWear.wrinkles !== undefined) ? tempWear.wrinkles : false;
  const odors = (tempWear.odors !== undefined) ? tempWear.odors : false;
  
  // For level-based properties, if the property or its "level" is missing, default to 0.
  const stainsLevel = (tempWear.stains && typeof tempWear.stains.level === 'number')
    ? tempWear.stains.level : 0;
  const drynessLevel = (tempWear.dryness && typeof tempWear.dryness.level === 'number')
    ? tempWear.dryness.level : 0;
  const pillingLevel = (tempWear.pilling && typeof tempWear.pilling.level === 'number')
    ? tempWear.pilling.level : 0;
  const colorFadeLevel = (tempWear.colorFade && typeof tempWear.colorFade.level === 'number')
    ? tempWear.colorFade.level : 0;
  const surfaceDirtLevel = (tempWear.surfaceDirt && typeof tempWear.surfaceDirt.level === 'number')
    ? tempWear.surfaceDirt.level : 0;

  // Calculate temporary impact using weights for each factor.
  let tempImpact = 0;
  if (wrinkles) tempImpact += 0.05;
  if (odors) tempImpact += 0.1;
  tempImpact += 0.1 * stainsLevel;
  tempImpact += 0.1 * drynessLevel;
  tempImpact += 0.1 * pillingLevel;
  tempImpact += 0.05 * colorFadeLevel;
  tempImpact += 0.05 * surfaceDirtLevel;

  tempImpact = clamp(tempImpact, 0, 1);

  /**************************************************************************
   * Combine All Factors into Final Wear Score
   *
   * We assign weights to each component:
   *   - Time Factor: 30%
   *   - Usage Factor: 25%
   *   - Wash Factor: 25%
   *   - Temporary Wear: 20%
   *
   * Additionally, if any advanced condition (dryness, pilling, colorFade)
   * is critical (level 3), apply a synergy penalty.
   **************************************************************************/
  let wearScore = 1
    - (0.3 * timeFactor)
    - (0.25 * usageFactor)
    - (0.25 * washFactor)
    - (0.2 * tempImpact);

  // Optional synergy: If any advanced condition is at the maximum level (3),
  // apply an extra penalty of 5% per condition.
  let synergyPenalty = 0;
  if (drynessLevel === 3) synergyPenalty += 0.05;
  if (pillingLevel === 3) synergyPenalty += 0.05;
  if (colorFadeLevel === 3) synergyPenalty += 0.05;
  wearScore -= synergyPenalty;

  wearScore = clamp(wearScore, 0, 1);

  const conditionPercent = wearScore * 100;
  return parseFloat(conditionPercent.toFixed(1));
};
