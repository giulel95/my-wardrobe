/********************************************************************************
 * ui.js
 *
 * Builds or rebuilds the wardrobe table, handles display of item data,
 * sorting, searching, and integration with temporary wear & tear.
 ********************************************************************************/

/**
 * Rebuild the main wardrobe table in the DOM.
 * Called after any data changes (wash, use, editing an item, etc.).
 */
window.updateWardrobeTable = function() {
  const tbody = document.querySelector('#wardrobe-table tbody');
  tbody.innerHTML = '';

  window.wardrobeItems.forEach((item) => {
    // 1) Calculate condition (0..100%)
    const condPercent = window.calculateCondition(item);

    // 2) Usage/wash stats
    const usageCount = item.usageHistory.length;
    const lastUse = usageCount > 0 ? item.usageHistory[usageCount - 1] : 'Never';

    const washCount = item.washHistory.length;
    const lastWash = washCount > 0 ? item.washHistory[washCount - 1] : 'Never';

    // 3) Temporary Wear description
    const tempWear = item.wearAndTear || {
      wrinkles: false,
      odors: false,
      stains: { level: 0 },
      elasticityLoss: false,
      surfaceDirt: { level: 0 },
    };
    const tempWearDesc = [];
    if (tempWear.wrinkles)               tempWearDesc.push("Wrinkles");
    if (tempWear.odors)                  tempWearDesc.push("Odors");
    if (tempWear.stains.level > 0)       tempWearDesc.push(`Stains (L${tempWear.stains.level})`);
    if (tempWear.elasticityLoss)         tempWearDesc.push("Elasticity Loss");
    if (tempWear.surfaceDirt.level > 0)  tempWearDesc.push(`Dirt (L${tempWear.surfaceDirt.level})`);

    // 4) Create row for this item
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="image-cell">
        ${
          item.image
            ? `<img src="${item.image}" alt="${item.name}" class="item-image" />`
            : `<div style="width:50px; height:50px; background:#ccc; border-radius:3px;"></div>`
        }
      </td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.purchaseDate || 'N/A'}</td>
      <td>${usageCount}</td>
      <td>${lastUse}</td>
      <td>${washCount}</td>
      <td>${lastWash}</td>
      <td>${condPercent}%</td>
      <td>${tempWearDesc.join(", ") || "None"}</td>
      <td>
        <!-- Basic action buttons for usage/wash -->
        <button class="action-btn usage-btn" onclick="addUsage(${item.id})">Use</button>
        <button class="action-btn wash-btn" onclick="addWash(${item.id})">Wash</button>

        <!-- Access usage/wash history in separate sections -->
        <button class="action-btn history-btn" onclick="viewUsageHistory(${item.id})">Usage Hist</button>
        <button class="action-btn history-btn" onclick="viewWashHistory(${item.id})">Wash Hist</button>

        <!-- Example: add wrinkles / odor / stain L2 to demonstrate temporary wear -->
        <button onclick="addTemporaryWear(${item.id}, 'wrinkles', true)">Wrinkle+</button>
        <button onclick="addTemporaryWear(${item.id}, 'odors', true)">Odor+</button>
        <button onclick="addTemporaryWear(${item.id}, 'stains', { level:2 })">Stain L2</button>
        <button onclick="resetTemporaryWear(${item.id})">Resolve All</button>

        <!-- Edit/Delete item -->
        <button class="action-btn edit-btn" onclick="editItem(${item.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteItem(${item.id})">Delete</button>
      </td>
    `;

    // Add row to table body
    tbody.appendChild(row);
  });

  // Optionally check for wash reminders
  checkWashReminders();
};

/**
 * Check if any item hasn't been washed for over 30 days and log a reminder.
 */
function checkWashReminders() {
  const today = new Date();
  window.wardrobeItems.forEach(item => {
    if (item.washHistory && item.washHistory.length > 0) {
      const lastWashDateStr = item.washHistory[item.washHistory.length - 1];
      const lastWashDate = new Date(lastWashDateStr);
      const diffDays = Math.floor((today - lastWashDate) / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        console.log(`Reminder: ${item.name} was last washed ${diffDays} days ago!`);
      }
    }
  });
}

/**
 * Event listener for adding a new fabric row on the form.
 * This matches the short list of fabrics from fabric.js
 */
document.getElementById('add-fabric-btn').addEventListener('click', function() {
  const fabricInputs = document.getElementById('fabric-inputs');
  const newField = document.createElement('div');
  newField.className = 'fabric-group';
  newField.innerHTML = `
    <select class="fabric-type">
      <option value="Cotton">Cotton</option>
      <option value="Linen">Linen</option>
      <option value="Wool">Wool</option>
      <option value="Silk">Silk</option>
      <option value="Polyester">Polyester</option>
      <option value="Nylon (Polyamide)">Nylon (Polyamide)</option>
      <option value="Spandex (Elastane)">Spandex (Elastane)</option>
      <option value="Viscose (Rayon)">Viscose (Rayon)</option>
      <option value="Acrylic">Acrylic</option>
      <option value="Leather">Leather</option>
      <option value="Hemp">Hemp</option>
      <option value="Denim">Denim</option>
    </select>
    <input type="number" class="fabric-percentage" placeholder="%" min="1" max="100" required />
    <button type="button" onclick="removeFabricField(this)">Remove</button>
  `;
  fabricInputs.appendChild(newField);
});

/** Called by "Remove" button in the new fabric row. */
window.removeFabricField = function(button) {
  button.parentElement.remove();
};

// =============================
// Sorting & Searching
// =============================

/** Sort by name/washes/usage when user clicks the respective button. */
document.getElementById('sort-name-btn').addEventListener('click', () => sortItems('name'));
document.getElementById('sort-wash-btn').addEventListener('click', () => sortItems('washHistory'));
document.getElementById('sort-usage-btn').addEventListener('click', () => sortItems('usageHistory'));

function sortItems(field) {
  if (field === 'name') {
    window.wardrobeItems.sort((a, b) => a.name.localeCompare(b.name));
  } else if (field === 'washHistory') {
    window.wardrobeItems.sort((a, b) => b.washHistory.length - a.washHistory.length);
  } else if (field === 'usageHistory') {
    window.wardrobeItems.sort((a, b) => b.usageHistory.length - a.usageHistory.length);
  }
  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
}

/** Filter items by name in real time. */
document.getElementById('search-bar').addEventListener('keyup', filterTable);

function filterTable() {
  const query = document.getElementById('search-bar').value.toLowerCase();
  const rows = document.querySelectorAll('#wardrobe-table tbody tr');
  rows.forEach(row => {
    const itemName = row.cells[1].textContent.toLowerCase(); // name is col index 1
    row.style.display = itemName.includes(query) ? '' : 'none';
  });
}

// =============================
// Editing & Deleting Items
// =============================

/** When editing an item, pre-fill the form with its data. */
window.editItem = function(id) {
  const item = window.wardrobeItems.find(i => i.id === id);
  if (!item) return;

  window.editingItemId = item.id;

  // Pre-fill the form fields
  document.getElementById('item-name').value = item.name;
  document.getElementById('category').value = item.category;
  document.getElementById('purchase-date').value = item.purchaseDate;
  document.getElementById('image-input').value = ''; // reset

  // Rebuild the fabric inputs
  const fabricArea = document.getElementById('fabric-inputs');
  fabricArea.innerHTML = '';
  if (Array.isArray(item.fabrics)) {
    item.fabrics.forEach(f => {
      const field = document.createElement('div');
      field.className = 'fabric-group';
      field.innerHTML = `
        <select class="fabric-type">
          <option value="Cotton">Cotton</option>
          <option value="Linen">Linen</option>
          <option value="Wool">Wool</option>
          <option value="Silk">Silk</option>
          <option value="Polyester">Polyester</option>
          <option value="Nylon (Polyamide)">Nylon (Polyamide)</option>
          <option value="Spandex (Elastane)">Spandex (Elastane)</option>
          <option value="Viscose (Rayon)">Viscose (Rayon)</option>
          <option value="Acrylic">Acrylic</option>
          <option value="Leather">Leather</option>
          <option value="Hemp">Hemp</option>
          <option value="Denim">Denim</option>
        </select>
        <input type="number" class="fabric-percentage" placeholder="%" min="1" max="100" required />
        <button type="button" onclick="removeFabricField(this)">Remove</button>
      `;
      fabricArea.appendChild(field);

      // Set actual values
      field.querySelector('.fabric-type').value = f.type;
      field.querySelector('.fabric-percentage').value = f.percentage;
    });
  }

  document.getElementById('form-title').textContent = 'Edit Wardrobe Item';
  document.getElementById('submit-button').textContent = 'Save Changes';
};

/** Delete an item from the global array. */
window.deleteItem = function(id) {
  const idx = window.wardrobeItems.findIndex(i => i.id === id);
  if (idx !== -1) {
    window.wardrobeItems.splice(idx, 1);
    window.saveWardrobeItemsToStorage();
    window.updateWardrobeTable();
  }
};
