/********************************************************************************
 * temporaryWear.js
 *
 * Manages the temporary (reversible) wear & tear conditions on items:
 * - wrinkles, odors, stains, elasticityLoss, surfaceDirt
 * - setting them, resetting them, partial levels for certain conditions
 ********************************************************************************/

// Example default wearAndTear structure:
function defaultWearAndTear() {
  return {
    wrinkles: false,
    odors: false,
    stains: { level: 0 },      // 0..3 or more
    elasticityLoss: false,
    surfaceDirt: { level: 0 }, // 0..3 or more
  };
}

/**
 * Add or modify a temporary wear condition for a given item.
 * 
 * @param {number} itemId  The wardrobe item's ID
 * @param {string} condition  One of: "wrinkles" | "odors" | "elasticityLoss" | "stains" | "surfaceDirt"
 * @param {any} value  For booleans => true/false, for level-based => { level: X }
 */
window.addTemporaryWear = function (itemId, condition, value = true) {
  const item = window.wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  if (!item.wearAndTear) {
    item.wearAndTear = defaultWearAndTear();
  }

  // If it's a level-based condition (like stains, surfaceDirt):
  if (condition === "stains" || condition === "surfaceDirt") {
    if (typeof value === "object" && value.level !== undefined) {
      item.wearAndTear[condition] = { level: value.level };
    } else if (typeof value === "number") {
      item.wearAndTear[condition] = { level: value };
    } else {
      // fallback
      item.wearAndTear[condition] = { level: 1 };
    }
  } else {
    // Otherwise it's a boolean: wrinkles, odors, elasticityLoss
    item.wearAndTear[condition] = value;
  }

  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
};

/**
 * Reset (clear) all temporary wear for an item, e.g. after washing/ironing.
 */
window.resetTemporaryWear = function (itemId) {
  const item = window.wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  item.wearAndTear = defaultWearAndTear();
  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
};
