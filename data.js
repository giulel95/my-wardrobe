window.wardrobeItems = []; // Global array attached to window for simplicity

// Load from local storage, migrate old data if needed
window.loadWardrobeItemsFromStorage = function() {
  const data = localStorage.getItem('wardrobeItems');
  if (data) {
    window.wardrobeItems = JSON.parse(data);
    window.wardrobeItems.forEach((item) => {
      // Migrate old data
      if (!item.fabrics) {
        item.fabrics = [{ type: 'Cotton', percentage: 100 }];
      }
      if (!item.usageHistory) {
        item.usageHistory = [];
      }
      if (!item.washHistory) {
        item.washHistory = [];
      }
    });
  }
};

// Save to local storage
window.saveWardrobeItemsToStorage = function() {
  localStorage.setItem('wardrobeItems', JSON.stringify(window.wardrobeItems));
};

// Export data as JSON
window.exportData = function() {
  const dataStr = JSON.stringify(window.wardrobeItems, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'wardrobe-data.json';
  a.click();
};

// Import from JSON file
window.importData = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (Array.isArray(importedData)) {
        window.wardrobeItems = importedData;
        window.saveWardrobeItemsToStorage();
        window.updateWardrobeTable(); // Refresh UI
      } else {
        alert("Invalid file format.");
      }
    } catch (err) {
      alert("Error parsing JSON file.");
    }
  };
  reader.readAsText(file);
};

// We'll store ID of item being edited here
window.editingItemId = null;
