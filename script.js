/**
 * script.js
 *
 * Main entry point: handles form submission and wiring up the "Scrape Product" feature.
 * This file uses global functions from data.js, fabric.js, condition.js, history.js, ui.js, and scraper.js.
 */

// When the page loads, load data and build the table.
window.addEventListener('load', () => {
  window.loadWardrobeItemsFromStorage();
  window.updateWardrobeTable();
});

// --- Event Listener for Scraping Product Data ---
document.getElementById('scrape-button').addEventListener('click', async function() {
  const urlInput = document.getElementById('product-url').value.trim();
  if (!urlInput) {
    alert("Please enter a product URL.");
    return;
  }
  try {
    const productData = await window.scrapeProductData(urlInput);
    // If productData was successfully fetched, populate the form.
    // For example, update the item name field with the product title.
    if (productData.title) {
      document.getElementById('item-name').value = productData.title;
    }
    // Optionally, you can store the product image URL somewhere or show a preview.
    // For example, you might auto-fill an image field if you have one.
    // Note: For security reasons, you may need to download the image or allow user confirmation.
    alert("Scraped product data successfully! Please verify and complete other fields if needed.");
  } catch (error) {
    alert("Failed to scrape product data. See console for details.");
  }
});

// --- Form Submission for Adding/Editing an Item ---
document.getElementById('wardrobe-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const itemName = document.getElementById('item-name').value.trim();
  const category = document.getElementById('category').value;
  const purchaseDate = document.getElementById('purchase-date').value;

  // Gather fabrics from fabric inputs.
  const fabricGroups = document.querySelectorAll('.fabric-group');
  const fabrics = [];
  fabricGroups.forEach(group => {
    const type = group.querySelector('.fabric-type').value;
    const perc = parseInt(group.querySelector('.fabric-percentage').value, 10);
    fabrics.push({ type, percentage: perc });
  });
  // Check that fabrics sum to 100%
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

  if (window.editingItemId) {
    // Edit existing item.
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
    // Create new item.
    const newItem = {
      id: Date.now(),
      name: itemName,
      category,
      purchaseDate,
      fabrics,
      image: imageData,
      usageHistory: [],
      washHistory: [],
      // Optionally, you can add default temporary wear:
      wearAndTear: {
        wrinkles: false,
        odors: false,
        stains: { level: 0 },
        elasticityLoss: false,
        surfaceDirt: { level: 0 },
      }
    };
    window.wardrobeItems.push(newItem);
  }

  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
  this.reset();
});

/** Helper: Convert file to base64 string. */
async function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}
