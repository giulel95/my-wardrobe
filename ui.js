/********************************************************************************
 * ui.js
 *
 * Updated to incorporate multi-level stains in the table, plus a "Stain++" button
 * that increments the stain level for demonstration. The rest remains the same
 * as your standard wardrobe UI code (sorting, searching, usage/wash, etc.).
 ********************************************************************************/

/**
 * Rebuild the main wardrobe table in the DOM.
 */
window.updateWardrobeTable = function() {
  const tbody = document.querySelector('#wardrobe-table tbody');
  tbody.innerHTML = '';

  window.wardrobeItems.forEach((item) => {
    // 1) Condition (0..100%)
    const condPercent = window.calculateCondition(item);

    // 2) Usage stats
    const usageCount = item.usageHistory.length;
    const lastUse = usageCount > 0 ? item.usageHistory[usageCount - 1] : 'Never';

    // 3) Wash stats
    const washCount = item.washHistory.length;
    const lastWash = washCount > 0 ? item.washHistory[washCount - 1] : 'Never';

    // 4) Temporary wear (with multi-level stains)
    const tempWear = item.wearAndTear || {
      wrinkles: false,
      odors: false,
      stains: { level: 0 },
      elasticityLoss: false,
      surfaceDirt: { level: 0 },
    };

    // Build a text description for each condition
    const tempWearDesc = [];
    if (tempWear.wrinkles) {
      tempWearDesc.push("Wrinkles");
    }
    if (tempWear.odors) {
      tempWearDesc.push("Odors");
    }
    // multi-level stains
    const stainLevel = tempWear.stains?.level || 0;
    if (stainLevel > 0) {
      tempWearDesc.push(`Stains (L${stainLevel})`);
    }
    if (tempWear.elasticityLoss) {
      tempWearDesc.push("Elasticity Loss");
    }
    const dirtLevel = tempWear.surfaceDirt?.level || 0;
    if (dirtLevel > 0) {
      tempWearDesc.push(`Dirt (L${dirtLevel})`);
    }

    // 5) Create table row
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
        <!-- Basic usage/wash buttons -->
        <button class="action-btn usage-btn" onclick="addUsage(${item.id})">Use</button>
        <button class="action-btn wash-btn" onclick="addWash(${item.id})">Wash</button>
        <button class="action-btn history-btn" onclick="viewUsageHistory(${item.id})">Usage Hist</button>
        <button class="action-btn history-btn" onclick="viewWashHistory(${item.id})">Wash Hist</button>

        <!-- Buttons for new multi-level stain approach -->
        <button onclick="addTemporaryWear(${item.id}, 'stains', { level:1 })">Set Stain L1</button>
        <button onclick="addTemporaryWear(${item.id}, 'stains', { level:2 })">Set Stain L2</button>
        <!-- Or increment approach -->
        <button onclick="incrementStainLevel(${item.id}, 1)">Stain++</button>

        <button onclick="resetTemporaryWear(${item.id})">Resolve Wear</button>
        
        <!-- Edit/Delete -->
        <button class="action-btn edit-btn" onclick="editItem(${item.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteItem(${item.id})">Delete</button>
      </td>
    `;

    tbody.appendChild(row);
  });

  // If you have wash or ironing reminders, call them here
  // e.g. checkReminders();
};

/*****************************************************************************
 * SORTING & SEARCH
 *****************************************************************************/

/** Sort by name/washes/usage. */
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

/** Filter items by name in real-time. */
document.getElementById('search-bar').addEventListener('keyup', filterTable);
function filterTable() {
  const query = document.getElementById('search-bar').value.toLowerCase();
  const rows = document.querySelectorAll('#wardrobe-table tbody tr');
  rows.forEach(row => {
    const itemName = row.cells[1].textContent.toLowerCase(); // name = col index 1
    row.style.display = itemName.includes(query) ? '' : 'none';
  });
}

/*****************************************************************************
 * EDIT & DELETE
 *****************************************************************************/

window.editItem = function(id) {
  const item = window.wardrobeItems.find(i => i.id === id);
  if (!item) return;

  window.editingItemId = item.id;

  document.getElementById('item-name').value = item.name;
  document.getElementById('category').value = item.category;
  document.getElementById('purchase-date').value = item.purchaseDate;
  document.getElementById('image-input').value = '';

  // Rebuild fabric inputs
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

      field.querySelector('.fabric-type').value = f.type;
      field.querySelector('.fabric-percentage').value = f.percentage;
    });
  }

  document.getElementById('form-title').textContent = 'Edit Wardrobe Item';
  document.getElementById('submit-button').textContent = 'Save Changes';
};

window.deleteItem = function(id) {
  const idx = window.wardrobeItems.findIndex(i => i.id === id);
  if (idx !== -1) {
    window.wardrobeItems.splice(idx, 1);
    window.saveWardrobeItemsToStorage();
    window.updateWardrobeTable();
  }
};

/*****************************************************************************
 * FABRIC ROW MANAGEMENT
 *****************************************************************************/

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

window.removeFabricField = function(button) {
  button.parentElement.remove();
};
