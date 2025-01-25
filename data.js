export let wardrobeItems = [];

/**
 * Load items from local storage.
 * If old data lacks 'fabrics', 'usageHistory', or 'washHistory',
 * we add them to keep code consistent.
 */
export function loadWardrobeItemsFromStorage() {
  const data = localStorage.getItem('wardrobeItems');
  if (data) {
    wardrobeItems = JSON.parse(data);
    // Migrate old data
    wardrobeItems.forEach((item) => {
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
}

/** Save items to local storage. */
export function saveWardrobeItemsToStorage() {
  localStorage.setItem('wardrobeItems', JSON.stringify(wardrobeItems));
}

/** Export data as JSON file. */
export function exportData() {
  const dataStr = JSON.stringify(wardrobeItems, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'wardrobe-data.json';
  a.click();
}

/** Import data from selected JSON file. */
export function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (Array.isArray(importedData)) {
        wardrobeItems = importedData;
        saveWardrobeItemsToStorage();
      } else {
        alert("Invalid file format.");
      }
    } catch (err) {
      alert("Error parsing JSON file.");
    }
  };
  reader.readAsText(file);
}
