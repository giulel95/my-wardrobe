// Global array
window.wardrobeItems = [];

// Load with migration for purchasePrice
window.loadWardrobeItemsFromStorage = function() {
  const raw = localStorage.getItem('wardrobeItems');
  if (raw) {
    window.wardrobeItems = JSON.parse(raw);
    window.wardrobeItems.forEach(item => {
      // Ensure fabrics/history exist (your existing migrations)
      if (!item.fabrics)        item.fabrics = [{ type:'Cotton', percentage:100 }];
      if (!item.usageHistory)   item.usageHistory = [];
      if (!item.washHistory)    item.washHistory = [];
      // Migrate old boolean stains if needed (you already have this)
      if (item.wearAndTear && typeof item.wearAndTear.stains === 'boolean') {
        item.wearAndTear.stains = { level: item.wearAndTear.stains ? 1 : 0 };
      }
      // **NEW:** Ensure purchasePrice
      if (typeof item.purchasePrice !== 'number') {
        item.purchasePrice = 0;
      }
    });
  }
};

// Save
window.saveWardrobeItemsToStorage = function() {
  localStorage.setItem('wardrobeItems', JSON.stringify(window.wardrobeItems));
};

// Export / Import (unchanged)
window.exportData = function() { /* … */ };
window.importData = function(e) { /* … */ };

// Track editing state
window.editingItemId = null;
