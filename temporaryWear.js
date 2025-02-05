function defaultWearAndTear() {
  return {
    wrinkles: false,
    odors: false,
    stains: { level: 0 },
    elasticityLoss: false,
    surfaceDirt: { level: 0 },
  };
}

window.addTemporaryWear = function (itemId, condition, value = true) {
  const item = window.wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  if (!item.wearAndTear) {
    item.wearAndTear = defaultWearAndTear();
  }

  if (condition === "stains" || condition === "surfaceDirt") {
    if (typeof value === "object" && value.level !== undefined) {
      item.wearAndTear[condition] = { level: value.level };
    } else if (typeof value === "number") {
      item.wearAndTear[condition] = { level: value };
    } else {
      item.wearAndTear[condition] = { level: 1 };
    }
  } else {
    item.wearAndTear[condition] = value;
  }

  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
};

window.resetTemporaryWear = function (itemId) {
  const item = window.wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  item.wearAndTear = defaultWearAndTear();
  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
};
