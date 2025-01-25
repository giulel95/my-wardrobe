/**
 * condition.js
 *
 * Revised to:
 *  1) Use weeks for time-based calculations.
 *  2) Incorporate frequency of usage (uses per week).
 *  3) Return partial percentages (e.g., 72.3%) instead of rounding to integers.
 */

/////////////////////////////////////////////////////////////
// A small helper to clamp values between a given min & max
/////////////////////////////////////////////////////////////
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/////////////////////////////////////////////////////////////
// The main function to calculate wear & tear in [0..100]%
/////////////////////////////////////////////////////////////
window.calculateCondition = function (item) {
  // Basic usage/wash stats
  const totalWashes = item.washHistory.length;
  const totalUses   = item.usageHistory.length;

  // Retrieve category-specific durability or default fallback
  const catDur = window.categoryDurability[item.category] || {
    maxUses: 100,
    maxWashes: 50,
    maxYears: 2,
  };

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

  // Convert category "maxYears" to weeks to get "maxWeeks"
  // e.g., 1 year ~ 52 weeks
  const weeksPerYear = 52;
  const maxWeeks = (catDur.maxYears * weeksPerYear) * weightedMultiplier;

  // Also scale the "maxUses" and "maxWashes" by the same multiplier
  const maxUses   = catDur.maxUses   * weightedMultiplier;
  const maxWashes = catDur.maxWashes * weightedMultiplier;

  // Age in weeks
  const purchaseDate = new Date(item.purchaseDate);
  const now = new Date();
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const weeksOwned = (now - purchaseDate) / msPerWeek;

  // If the item is extremely new (less than 1 day old), short-circuit:
  if (weeksOwned < 0.14) {
    // ~1 day is ~0.14 weeks => basically brand new
    return 100.0; // near-perfect condition
  }

  /////////////////////////////////////////////////////////////////////
  // 1) Time Factor: ageFactor = (weeksOwned / maxWeeks)
  //    Range [0..1], but clamp if it exceeds 1
  /////////////////////////////////////////////////////////////////////
  const timeFactor = clamp(weeksOwned / maxWeeks, 0, 1);

  /////////////////////////////////////////////////////////////////////
  // 2) Usage Factor: usageFactor = (totalUses / maxUses)
  //    Range [0..1]
  /////////////////////////////////////////////////////////////////////
  const usageFactor = clamp(totalUses / maxUses, 0, 1);

  /////////////////////////////////////////////////////////////////////
  // 3) Wash Factor: washFactor = (totalWashes / maxWashes)
  //    Range [0..1]
  /////////////////////////////////////////////////////////////////////
  const washFactor = clamp(totalWashes / maxWashes, 0, 1);

  /////////////////////////////////////////////////////////////////////
  // 4) Usage Frequency Factor: how many uses/week vs. threshold
  //    Example threshold: 3 uses/week => "high frequency"
  //    If usageFrequencyFactor is 1 => "very frequent usage"
  /////////////////////////////////////////////////////////////////////
  const usagePerWeek = totalUses / weeksOwned;
  const freqThreshold = 3; // e.g., 3 uses/week is "high"
  let usageFrequencyFactor = usagePerWeek / freqThreshold;
  if (usageFrequencyFactor > 1) usageFrequencyFactor = 1; // clamp to [0..1]

  /////////////////////////////////////////////////////////////////////
  // Combine all factors into a single "wearScore" in [0..1]
  // The higher the sum of factors, the lower the final condition.
  //
  // Weighted approach:
  //   timeFactor: 30%
  //   usageFactor: 25%
  //   washFactor: 25%
  //   usageFrequencyFactor: 20%
  /////////////////////////////////////////////////////////////////////
  let wearScore = 1.0;
  wearScore -= 0.30 * timeFactor;
  wearScore -= 0.25 * usageFactor;
  wearScore -= 0.25 * washFactor;
  wearScore -= 0.20 * usageFrequencyFactor;

  // Now wearScore might be in [-∞..1].
  // We clamp it to [0..1].
  wearScore = clamp(wearScore, 0, 1);

  // Convert to 0..100 percentage
  let conditionPercent = wearScore * 100;

  /////////////////////////////////////////////////////////////////////
  // Return partial decimal. E.g. 72.3 => "72.3%" in the UI
  /////////////////////////////////////////////////////////////////////
  return parseFloat(conditionPercent.toFixed(1));
};
