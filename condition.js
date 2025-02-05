function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

window.calculateCondition = function (item) {
  const totalWashes = item.washHistory.length;
  const totalUses   = item.usageHistory.length;

  const catDur = window.categoryDurability[item.category] || { maxUses: 100, maxWashes: 50, maxYears: 2 };

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

  // Convert maxYears to weeks
  const maxWeeks = catDur.maxYears * 52 * weightedMultiplier;
  const maxUses   = catDur.maxUses   * weightedMultiplier;
  const maxWashes = catDur.maxWashes * weightedMultiplier;

  // Age in weeks
  const purchaseDate = new Date(item.purchaseDate);
  const now = new Date();
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const weeksOwned = (now - purchaseDate) / msPerWeek;

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
  };

  let tempImpact = 0;

  if (tempWear.wrinkles) tempImpact += 0.05;
  if (tempWear.odors) tempImpact += 0.1;
  tempImpact += (tempWear.stains.level || 0) * 0.1;
  if (tempWear.elasticityLoss) tempImpact += 0.15;
  tempImpact += (tempWear.surfaceDirt.level || 0) * 0.05;

  tempImpact = clamp(tempImpact, 0, 1);

  let wearScore = 1 
    - (0.30 * timeFactor)
    - (0.25 * usageFactor)
    - (0.25 * washFactor)
    - (0.20 * tempImpact);

  wearScore = clamp(wearScore, 0, 1);

  const conditionPercent = wearScore * 100;
  return parseFloat(conditionPercent.toFixed(1));
};
