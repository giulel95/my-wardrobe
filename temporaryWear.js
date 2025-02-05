/******************************************************************************
 * temporaryWear.js
 *
 * Manages advanced multi-level "stains" for each item, plus other temporary
 * wear conditions (wrinkles, odors, etc.) if you want to expand them similarly.
 *
 * This version introduces a "stains.level" property (0..3) by default.
 ******************************************************************************/

// Default structure for temporary wear (when none exists yet).
function defaultWearAndTear() {
  return {
    wrinkles: false,
    odors: false,
    // NEW: multi-level stains, 0..3 (you can allow higher if you want)
    stains: { level: 0 },
    elasticityLoss: false,
    // Example of multi-level surfaceDirt too, if you want:
    surfaceDirt: { level: 0 },
  };
}

/**
 * Add or update ANY temporary wear condition for an item:
 *  e.g., set wrinkles => true, or set an advanced stain level.
 *
 * For multi-level stains, pass { level: X }, where 0..3 are typical.
 */
window.addTemporaryWear = function (itemId, condition, value = true) {
  const item = window.wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  // Ensure the wearAndTear object exists
  if (!item.wearAndTear) {
    item.wearAndTear = defaultWearAndTear();
  }

  // If the condition is "stains" or "surfaceDirt" or any "level-based" property:
  if (condition === "stains" || condition === "surfaceDirt") {
    if (typeof value === "object" && value.level !== undefined) {
      // e.g. { level: 2 }
      item.wearAndTear[condition] = { level: value.level };
    } else if (typeof value === "number") {
      item.wearAndTear[condition] = { level: value };
    } else {
      // fallback if missing
      item.wearAndTear[condition] = { level: 1 };
    }
  } else {
    // e.g. wrinkles = true, odors = true, elasticityLoss = true
    item.wearAndTear[condition] = value;
  }

  // (Optional) if user is wearing an item with a high stain level again,
  // auto-escalate it if you want:
  // if (condition === 'stains' && item.wearAndTear.stains.level >= 3) {
  //   // you could degrade permanent condition or do more logic here
  // }

  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
};

/**
 * Reset (clear) all temporary wear for an item, e.g. after a thorough wash/clean.
 */
window.resetTemporaryWear = function (itemId) {
  const item = window.wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  item.wearAndTear = defaultWearAndTear();
  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
};

/**
 * (Optional) If you want a helper to *increment* the stain level:
 */
window.incrementStainLevel = function(itemId, increment = 1) {
  const item = window.wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  if (!item.wearAndTear) {
    item.wearAndTear = defaultWearAndTear();
  }
  const currentLevel = item.wearAndTear.stains?.level || 0;
  let newLevel = currentLevel + increment;

  // cap at 3, for example
  if (newLevel > 3) newLevel = 3;
  item.wearAndTear.stains = { level: newLevel };

  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
};
