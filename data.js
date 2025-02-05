window.wardrobeItems = []; // global array

window.loadWardrobeItemsFromStorage = function() {
  const data = localStorage.getItem('wardrobeItems');
  if (data) {
    window.wardrobeItems = JSON.parse(data);
    // Migrate old data
    window.wardrobeItems.forEach((item) => {
      if (!item.fabrics) {
        item.fabrics = [{ type: 'Cotton', percentage: 100 }];
      }
      if (!item.usageHistory) item.usageHistory = [];
      if (!item.washHistory) item.washHistory = [];
      if (!item.wearAndTear) {
        item.wearAndTear = {
          wrinkles: false,
          odors: false,
          stains: { level: 0 },
          elasticityLoss: false,
          surfaceDirt: { level: 0 },
        };
      }
    });
  }
};

window.saveWardrobeItemsToStorage = function() {
  localStorage.setItem('wardrobeItems', JSON.stringify(window.wardrobeItems));
};

window.exportData = function() {
  const dataStr = JSON.stringify(window.wardrobeItems, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'wardrobe-data.json';
  a.click();
};

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
        window.updateWardrobeTable();
      } else {
        alert("Invalid file format.");
      }
    } catch (err) {
      alert("Error parsing JSON file.");
    }
  };
  reader.readAsText(file);
};

// We'll store editingItemId globally
window.editingItemId = null;
