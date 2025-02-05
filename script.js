/**
 * script.js
 * 
 * This final file wires everything together. Because we are using normal <script> tags,
 * there's no "import" statements. We rely on the global functions
 * (e.g., window.updateWardrobeTable, window.wardrobeItems, etc.)
 */

// On page load, do the following:
window.addEventListener('load', () => {
  // Load from localStorage
  window.loadWardrobeItemsFromStorage();
  // Build the table
  window.updateWardrobeTable();
});

// Handle form submission: add or edit an item
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
  // Check total = 100
  const totalPerc = fabrics.reduce((sum, f) => sum + f.percentage, 0);
  if (totalPerc !== 100) {
    alert("Fabrics must total 100%!");
    return;
  }

  // Handle image upload
  const imageInput = document.getElementById('image-input');
  let imageData = '';
  if (imageInput.files && imageInput.files[0]) {
    imageData = await readFileAsBase64(imageInput.files[0]);
  }

  // Determine if editing or adding
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
    };
    window.wardrobeItems.push(newItem);
  }

  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();

  // Reset form
  this.reset();
});

/** Helper: read file as base64 */
async function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}
