/******************************************************************************
 * temporaryWear.js
 *
 * Extends the temporary wear system to include:
 *  - dryness (for leather/suede) => level 0..3
 *  - pilling (for wool/acrylic) => level 0..3
 *  - colorFade => level 0..3
 * 
 * This file manages adding or resetting these advanced wear states, 
 * just like stains, wrinkles, etc.
 ******************************************************************************/

// Default structure for advanced temporary wear
function defaultWearAndTear() {
  return {
    wrinkles: false,
    odors: false,
    stains: { level: 0 },
    elasticityLoss: false,
    surfaceDirt: { level: 0 },
    // NEW advanced conditions:
    dryness: { level: 0 },   // e.g., for leather or suede
    pilling: { level: 0 },   // e.g., for wool, acrylic
    colorFade: { level: 0 }, // for dyed fabrics
  };
}

/**
 * addTemporaryWear(itemId, condition, value):
 *  - Extends the logic to handle dryness, pilling, colorFade with levels.
 */
window.addTemporaryWear = function (itemId, condition, value = true) {
  const item = window.wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  if (!item.wearAndTear) {
    item.wearAndTear = defaultWearAndTear();
  }

  // If the condition is level-based (dryness, pilling, colorFade, stains, surfaceDirt):
  if (["stains","surfaceDirt","dryness","pilling","colorFade"].includes(condition)) {
    if (typeof value === "object" && value.level !== undefined) {
      item.wearAndTear[condition] = { level: value.level };
    } else if (typeof value === "number") {
      item.wearAndTear[condition] = { level: value };
    } else {
      // fallback
      item.wearAndTear[condition] = { level: 1 };
    }
  } else {
    // e.g. wrinkles, odors, elasticityLoss => boolean
    item.wearAndTear[condition] = value;
  }

  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
};

/**
 * incrementWearLevel(itemId, condition, increment):
 *  - Helper to easily increment dryness, pilling, colorFade, or stains.
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
 *  - Clears all advanced temporary wear states, including dryness/pilling/fade.
 */
window.resetTemporaryWear = function (itemId) {
  const item = window.wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  item.wearAndTear = defaultWearAndTear();
  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
};
