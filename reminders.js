/******************************************************************************
 * reminders.js
 *
 * Adds "Automatic Wash Suggestions" and "Ironing/Wrinkle Alerts":
 *  - If an item has odors or high stain level, we suggest washing it.
 *  - If an item has wrinkles, we suggest ironing it.
 *  - Also checks how long since last wash, if > X days => suggest washing.
 ******************************************************************************/

// You can tweak these thresholds:
const MAX_DAYS_WITHOUT_WASH = 14;   // e.g., 14 days
const STAIN_LEVEL_WASH = 2;        // level 2 or more => wash recommended

/**
 * Check if items have conditions needing wash or ironing
 * and display a reminder in the console or UI.
 */
window.checkReminders = function() {
  checkWashSuggestions();
  checkWrinkleAlerts();
};

/** Suggest a wash if item has strong odors/stains or hasn't been washed in 2+ weeks. */
function checkWashSuggestions() {
  const today = new Date();

  window.wardrobeItems.forEach(item => {
    const tempWear = item.wearAndTear || {
      wrinkles: false,
      odors: false,
      stains: { level: 0 },
      elasticityLoss: false,
      surfaceDirt: { level: 0 }
    };

    // 1) Check for strong odors or stain level >= threshold
    if (tempWear.odors || (tempWear.stains.level || 0) >= STAIN_LEVEL_WASH) {
      console.log(`Wash Suggestion: ${item.name} => odors or heavy stains (level ${tempWear.stains.level}).`);
      return; // no need to check days if we already found odors/stains
    }

    // 2) Check days since last wash
    if (item.washHistory && item.washHistory.length > 0) {
      const lastWashDateStr = item.washHistory[item.washHistory.length - 1];
      const lastWashDate = new Date(lastWashDateStr);
      const diffDays = Math.floor((today - lastWashDate) / (1000 * 60 * 60 * 24));

      if (diffDays > MAX_DAYS_WITHOUT_WASH) {
        console.log(`Wash Suggestion: ${item.name} => last wash was ${diffDays} days ago.`);
      }
    } else {
      // never washed
      console.log(`Wash Suggestion: ${item.name} => never washed, consider washing soon.`);
    }
  });
}

/** Suggest ironing/steaming if the item has wrinkles. */
function checkWrinkleAlerts() {
  window.wardrobeItems.forEach(item => {
    const tempWear = item.wearAndTear || {
      wrinkles: false,
      odors: false,
      stains: { level: 0 },
      elasticityLoss: false,
      surfaceDirt: { level: 0 }
    };

    if (tempWear.wrinkles) {
      console.log(`Ironing Suggestion: ${item.name} => currently wrinkled.`);
    }
  });
}
