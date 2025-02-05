/**
 * script.js
 * 
 * Initializes the site on load, linking everything together.
 */

window.addEventListener('load', () => {
  window.loadWardrobeItemsFromStorage();
  window.updateWardrobeTable();

  // Form submission for adding/editing an item
  document.getElementById('wardrobe-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const itemName = document.getElementById('item-name').value.trim();
    const category = document.getElementById('category').value;
    const purchaseDate = document.getElementById('purchase-date').value;

    // Gather fabrics
    const fabricGroups = document.querySelectorAll('.fabric-group');
    const fabrics = [];
    fabricGroups.forEach(group => {
      const type = group.querySelector('.fabric-type').value;
      const perc = parseInt(group.querySelector('.fabric-percentage').value, 10);
      fabrics.push({ type, percentage: perc });
    });
    const totalPerc = fabrics.reduce((sum, f) => sum + f.percentage, 0);
    if (totalPerc !== 100) {
      alert("Fabrics must total 100%!");
      return;
    }

    // Handle image
    const imageInput = document.getElementById('image-input');
    let imageData = '';
    if (imageInput.files && imageInput.files[0]) {
      imageData = await readFileAsBase64(imageInput.files[0]);
    }

    if (window.editingItemId) {
      // Edit existing
      const idx = window.wardrobeItems.findIndex(i => i.id === window.editingItemId);
      if (idx > -1) {
        window.wardrobeItems[idx].name = itemName;
        window.wardrobeItems[idx].category = category;
        window.wardrobeItems[idx].purchaseDate = purchaseDate;
        window.wardrobeItems[idx].fabrics = fabrics;
        if (imageData) {
          window.wardrobeItems[idx].image = imageData;
        }
      }
      window.editingItemId = null;
      document.getElementById('form-title').textContent = 'Add a Wardrobe Item';
      document.getElementById('submit-button').textContent = 'Add Item';

    } else {
      // Add new
      const newItem = {
        id: Date.now(),
        name: itemName,
        category,
        purchaseDate,
        fabrics,
        image: imageData,
        usageHistory: [],
        washHistory: [],
        wearAndTear: {
          wrinkles: false,
          odors: false,
          stains: { level: 0 },
          elasticityLoss: false,
          surfaceDirt: { level: 0 },
        },
      };
      window.wardrobeItems.push(newItem);
    }

    window.saveWardrobeItemsToStorage();
    window.updateWardrobeTable();
    this.reset();
  });
});

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}
