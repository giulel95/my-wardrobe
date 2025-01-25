import { loadWardrobeItemsFromStorage } from './data.js';
import { setupEventListeners, updateWardrobeTable } from './ui.js';
import { wardrobeItems, saveWardrobeItemsToStorage } from './data.js';

// We'll store the ID of an item being edited here:
window.editingItemId = null;

// ==============
// Form Handling
// ==============
document.getElementById('wardrobe-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Basic fields
  const itemName = document.getElementById('item-name').value.trim();
  const category = document.getElementById('category').value;
  const purchaseDate = document.getElementById('purchase-date').value;

  // Gather fabrics
  const fabricGroups = document.querySelectorAll('.fabric-group');
  const fabrics = [];
  fabricGroups.forEach(group => {
    const fabricType = group.querySelector('.fabric-type').value;
    const fabricPerc = parseInt(group.querySelector('.fabric-percentage').value, 10);
    fabrics.push({ type: fabricType, percentage: fabricPerc });
  });
  // Check total = 100
  const totalPercent = fabrics.reduce((sum, f) => sum + f.percentage, 0);
  if (totalPercent !== 100) {
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
    // ========== EDIT EXISTING ITEM ==========
    const idx = wardrobeItems.findIndex(i => i.id === window.editingItemId);
    if (idx > -1) {
      wardrobeItems[idx].name = itemName;
      wardrobeItems[idx].category = category;
      wardrobeItems[idx].purchaseDate = purchaseDate;
      wardrobeItems[idx].fabrics = fabrics;
      if (imageData) {
        // Only update image if user selected a new file
        wardrobeItems[idx].image = imageData;
      }
    }
    window.editingItemId = null;

    document.getElementById('form-title').textContent = 'Add a Wardrobe Item';
    document.getElementById('submit-button').textContent = 'Add Item';
  } else {
    // ========== ADD NEW ITEM ==========
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
    wardrobeItems.push(newItem);
  }

  saveWardrobeItemsToStorage();
  updateWardrobeTable();

  // Reset
  this.reset();
});

async function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}

// ==================
// Initialization
// ==================
window.addEventListener('load', () => {
  loadWardrobeItemsFromStorage();
  updateWardrobeTable();
  setupEventListeners();
});
