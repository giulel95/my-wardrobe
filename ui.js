/********************************************************************************
 * ui.js
 *
 * Full updated UI file that:
 *  - Builds the table, displaying:
 *    - Item image, name, category, usage/wash stats, condition, and 
 *      advanced temp wear (stains, dryness, pilling, colorFade, etc.).
 *  - Offers action buttons for usage, wash, temporary wear increments, 
 *    and editing/deleting items.
 *
 * Make sure your HTML table has matching <th> columns:
 *   1. Image
 *   2. Item Name
 *   3. Category
 *   4. Purchase Date
 *   5. Usage Count
 *   6. Last Used
 *   7. Total Washes
 *   8. Last Wash
 *   9. Condition
 *   10. Temp Wear
 *   11. Actions
 ********************************************************************************/

window.updateWardrobeTable = function() {
  const tbody = document.querySelector('#wardrobe-table tbody');
  tbody.innerHTML = '';

  window.wardrobeItems.forEach(item => {
    // 1) Compute the condition percentage (0..100)
    const condPercent = window.calculateCondition(item);

    // 2) Basic usage/wash stats
    const usageCount = item.usageHistory ? item.usageHistory.length : 0;
    const lastUse = usageCount > 0 ? item.usageHistory[usageCount - 1] : 'Never';

    const washCount = item.washHistory ? item.washHistory.length : 0;
    const lastWash = washCount > 0 ? item.washHistory[washCount - 1] : 'Never';

    // 3) Advanced temporary wear data
    const tw = item.wearAndTear || {};
    const wrinkles       = tw.wrinkles || false;
    const odors          = tw.odors || false;
    const stainsLevel    = (tw.stains && typeof tw.stains.level === 'number') ? tw.stains.level : 0;
    const drynessLevel   = (tw.dryness && typeof tw.dryness.level === 'number') ? tw.dryness.level : 0;
    const pillingLevel   = (tw.pilling && typeof tw.pilling.level === 'number') ? tw.pilling.level : 0;
    const fadeLevel      = (tw.colorFade && typeof tw.colorFade.level === 'number') ? tw.colorFade.level : 0;
    const dirtLevel      = (tw.surfaceDirt && typeof tw.surfaceDirt.level === 'number') ? tw.surfaceDirt.level : 0;
    const elasticityLoss = tw.elasticityLoss || false;

    // 4) Build the "Temp Wear" description
    const tempWearDesc = [];
    if (wrinkles) tempWearDesc.push("Wrinkles");
    if (odors) tempWearDesc.push("Odors");
    if (stainsLevel > 0)  tempWearDesc.push(`Stains (L${stainsLevel})`);
    if (drynessLevel > 0) tempWearDesc.push(`Dryness (L${drynessLevel})`);
    if (pillingLevel > 0) tempWearDesc.push(`Pilling (L${pillingLevel})`);
    if (fadeLevel > 0)    tempWearDesc.push(`ColorFade (L${fadeLevel})`);
    if (dirtLevel > 0)    tempWearDesc.push(`Dirt (L${dirtLevel})`);
    if (elasticityLoss)   tempWearDesc.push("Elasticity Loss");

    // 5) Create a table row with 11 columns
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
        <!-- Usage & Wash buttons -->
        <button class="action-btn usage-btn" onclick="addUsage(${item.id})">Use</button>
        <button class="action-btn wash-btn" onclick="addWash(${item.id})">Wash</button>
        <button class="action-btn history-btn" onclick="viewUsageHistory(${item.id})">Usage Hist</button>
        <button class="action-btn history-btn" onclick="viewWashHistory(${item.id})">Wash Hist</button>

        <!-- Advanced Temp Wear increments -->
        <button onclick="incrementWearLevel(${item.id}, 'stains', 1)">Stain++</button>
        <button class="dry-btn" onclick="incrementWearLevel(${item.id}, 'dryness', 1)">Dry++</button>
        <button class="pilling-btn" onclick="incrementWearLevel(${item.id}, 'pilling', 1)">Pill++</button>
        <button class="fade-btn" onclick="incrementWearLevel(${item.id}, 'colorFade', 1)">Fade++</button>

        <button onclick="resetTemporaryWear(${item.id})">Resolve Wear</button>

        <!-- Edit & Delete -->
        <button class="action-btn edit-btn" onclick="editItem(${item.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteItem(${item.id})">Delete</button>
      </td>
    `;

    tbody.appendChild(row);
  });

  // If you have reminders to check after building table:
  // checkReminders();
};

/*****************************************************************************
 * SORTING & SEARCH
 *****************************************************************************/

// Sorting: Name, # of Washes, # of Uses
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

/** Searching by item name in real-time. */
document.getElementById('search-bar').addEventListener('keyup', filterTable);
function filterTable() {
  const query = document.getElementById('search-bar').value.toLowerCase();
  const rows = document.querySelectorAll('#wardrobe-table tbody tr');
  rows.forEach(row => {
    const itemName = row.cells[1].textContent.toLowerCase(); // Name is col 1
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

  // Rebuild the fabric inputs for editing
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
 * ADDING & REMOVING FABRIC ROWS
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
