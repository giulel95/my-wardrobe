/********************************************************************************
 * ui.js
 *
 * Builds and updates the wardrobe table UI, including columns for:
 *  - Basic item info (name, category, dates)
 *  - Condition percentage
 *  - Temporary wear details (wrinkles, odors, stains, dryness, pilling, color fade, dirt)
 *  - Action buttons for usage, wash, temporary wear adjustments, edit, and delete.
 ********************************************************************************/

window.updateWardrobeTable = function() {
  const tbody = document.querySelector('#wardrobe-table tbody');
  tbody.innerHTML = '';

  window.wardrobeItems.forEach((item) => {
    // 1) Calculate permanent condition
    const condPercent = window.calculateCondition(item);

    // 2) Basic usage and wash stats
    const usageCount = item.usageHistory ? item.usageHistory.length : 0;
    const lastUse = usageCount > 0 ? item.usageHistory[usageCount - 1] : 'Never';

    const washCount = item.washHistory ? item.washHistory.length : 0;
    const lastWash = washCount > 0 ? item.washHistory[washCount - 1] : 'Never';

    // 3) Build temporary wear description
    const tempWear = item.wearAndTear || {
      wrinkles: false,
      odors: false,
      stains: { level: 0 },
      elasticityLoss: false,
      surfaceDirt: { level: 0 },
      dryness: { level: 0 },
      pilling: { level: 0 },
      colorFade: { level: 0 },
    };

    const tempWearDesc = [];
    if (tempWear.wrinkles) tempWearDesc.push("Wrinkles");
    if (tempWear.odors) tempWearDesc.push("Odors");
    if ((tempWear.stains && tempWear.stains.level) > 0) tempWearDesc.push(`Stains (L${tempWear.stains.level})`);
    if ((tempWear.dryness && tempWear.dryness.level) > 0) tempWearDesc.push(`Dryness (L${tempWear.dryness.level})`);
    if ((tempWear.pilling && tempWear.pilling.level) > 0) tempWearDesc.push(`Pilling (L${tempWear.pilling.level})`);
    if ((tempWear.colorFade && tempWear.colorFade.level) > 0) tempWearDesc.push(`ColorFade (L${tempWear.colorFade.level})`);
    if ((tempWear.surfaceDirt && tempWear.surfaceDirt.level) > 0) tempWearDesc.push(`Dirt (L${tempWear.surfaceDirt.level})`);

    // 4) Create table row with 11 columns:
    //    Image | Name | Category | Purchase Date | Usage Count | Last Used |
    //    Total Washes | Last Wash | Condition | Temp Wear | Actions
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
        <!-- Action Buttons -->
        <button class="action-btn usage-btn" onclick="addUsage(${item.id})">Use</button>
        <button class="action-btn wash-btn" onclick="addWash(${item.id})">Wash</button>
        <button class="action-btn history-btn" onclick="viewUsageHistory(${item.id})">Usage Hist</button>
        <button class="action-btn history-btn" onclick="viewWashHistory(${item.id})">Wash Hist</button>
        <!-- Advanced Temporary Wear Buttons -->
        <button class="dry-btn" onclick="incrementWearLevel(${item.id}, 'dryness', 1)">Dry++</button>
        <button class="pilling-btn" onclick="incrementWearLevel(${item.id}, 'pilling', 1)">Pill++</button>
        <button class="fade-btn" onclick="incrementWearLevel(${item.id}, 'colorFade', 1)">Fade++</button>
        <button onclick="addTemporaryWear(${item.id}, 'stains', { level:2 })">Set Stain L2</button>
        <button onclick="resetTemporaryWear(${item.id})">Resolve Wear</button>
        <!-- Edit and Delete -->
        <button class="action-btn edit-btn" onclick="editItem(${item.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteItem(${item.id})">Delete</button>
      </td>
    `;

    tbody.appendChild(row);
  });

  // Optionally, run any reminder checks here if needed.
  // e.g., checkReminders();
};

/*****************************************************************************
 * Sorting & Searching
 *****************************************************************************/
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

document.getElementById('search-bar').addEventListener('keyup', filterTable);
function filterTable() {
  const query = document.getElementById('search-bar').value.toLowerCase();
  const rows = document.querySelectorAll('#wardrobe-table tbody tr');
  rows.forEach(row => {
    const itemName = row.cells[1].textContent.toLowerCase(); // name in column index 1
    row.style.display = itemName.includes(query) ? '' : 'none';
  });
}

/*****************************************************************************
 * Editing & Deleting Items
 *****************************************************************************/
window.editItem = function(id) {
  const item = window.wardrobeItems.find(i => i.id === id);
  if (!item) return;

  window.editingItemId = item.id;

  // Pre-fill the form fields
  document.getElementById('item-name').value = item.name;
  document.getElementById('category').value = item.category;
  document.getElementById('purchase-date').value = item.purchaseDate;
  document.getElementById('image-input').value = '';

  // Rebuild fabric inputs from item.fabrics
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
 * Fabric Row Management
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
