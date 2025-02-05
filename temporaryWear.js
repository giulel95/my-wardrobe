/******************************************************************************
 * temporaryWear.js
 *
 * Manages new multi-level "stains" (0..3) and possibly other conditions
 * like dryness, pilling, colorFade. If "stains" was a boolean before,
 * your data migration code in data.js ensures it's now { level: 0..3 }.
 ******************************************************************************/

// Default structure for advanced temporary wear
function defaultWearAndTear() {
  return {
    wrinkles: false,
    odors: false,
    stains: { level: 0 },      // multi-level for stains
    elasticityLoss: false,
    surfaceDirt: { level: 0 },
    dryness: { level: 0 },
    pilling: { level: 0 },
    colorFade: { level: 0 },
  };
}

/**
 * addTemporaryWear(itemId, condition, value):
 *  - If condition is "stains", we set { level: X }.
 *  - If condition is dryness/pilling/colorFade => set { level: X }
 *  - If condition is boolean-based => set true/false
 */
window.addTemporaryWear = function (itemId, condition, value = true) {
  const item = window.wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  if (!item.wearAndTear) {
    item.wearAndTear = defaultWearAndTear();
  }

  // If it's a level-based property
  if (["stains","surfaceDirt","dryness","pilling","colorFade"].includes(condition)) {
    if (typeof value === "object" && value.level !== undefined) {
      // e.g. addTemporaryWear(itemId, 'stains', { level:2 })
      item.wearAndTear[condition] = { level: value.level };
    } else if (typeof value === "number") {
      // e.g. addTemporaryWear(itemId, 'stains', 2)
      item.wearAndTear[condition] = { level: value };
    } else {
      // fallback => set to 1
      item.wearAndTear[condition] = { level: 1 };
    }
  } else {
    // e.g. wrinkles, odors => boolean
    item.wearAndTear[condition] = value;
  }

  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
};

/**
 * incrementWearLevel(itemId, condition, increment):
 *  - Easy way to bump up dryness/pilling/stains/colorFade by a certain increment
 */
window.incrementWearLevel = function(itemId, condition, increment = 1) {
  const item = window.wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  if (!item.wearAndTear) {
    item.wearAndTear = defaultWearAndTear();
  }
  const oldLevel = item.wearAndTear[condition]?.level || 0;
  let newLevel = oldLevel + increment;
  if (newLevel > 3) newLevel = 3; // cap at 3
  item.wearAndTear[condition] = { level: newLevel };

  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
};

/**
 * resetTemporaryWear(itemId):
 *  - Clear all advanced wear states (wrinkles, odors, dryness, pilling, colorFade, etc.)
 */
window.resetTemporaryWear = function (itemId) {
  const item = window.wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  item.wearAndTear = defaultWearAndTear();
  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
};
