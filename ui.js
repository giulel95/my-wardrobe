import { wardrobeItems, saveWardrobeItemsToStorage, exportData, importData } from './data.js';
import { calculateCondition } from './condition.js';
import { addUsage, viewUsageHistory, addWash, viewWashHistory } from './history.js';
import { updateWardrobeTable as reRender } from './ui.js'; // circular reference fix if needed (see note)
import { updateWardrobeTable } from './ui.js'; // We'll define below

/**
 * Build or rebuild the wardrobe table in the DOM.
 */
export function updateWardrobeTable() {
  const tbody = document.querySelector('#wardrobe-table tbody');
  tbody.innerHTML = '';

  wardrobeItems.forEach((item) => {
    // Condition in percent
    const condPercent = calculateCondition(item);

    const usageCount = item.usageHistory.length;
    const lastUse = usageCount > 0 ? item.usageHistory[usageCount - 1] : 'Never';

    const washCount = item.washHistory.length;
    const lastWash = washCount > 0 ? item.washHistory[washCount - 1] : 'Never';

    // Build a row
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
      <td>
        <button class="action-btn usage-btn" onclick="addUsage(${item.id})">Use</button>
        <button class="action-btn history-btn" onclick="viewUsageHistory(${item.id})">Usage Hist</button>
        <button class="action-btn wash-btn" onclick="addWash(${item.id})">Wash</button>
        <button class="action-btn history-btn" onclick="viewWashHistory(${item.id})">Wash Hist</button>
        <button class="action-btn edit-btn" onclick="editItem(${item.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteItem(${item.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  checkWashReminders(); // optional
}

/**
 * Setup all event listeners for sorting, searching, etc.
 */
export function setupEventListeners() {
  // Sort buttons
  document.getElementById('sort-name-btn').addEventListener('click', () => sortItems('name'));
  document.getElementById('sort-wash-btn').addEventListener('click', () => sortItems('washHistory'));
  document.getElementById('sort-usage-btn').addEventListener('click', () => sortItems('usageHistory'));

  // Export / Import
  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('import-file').addEventListener('change', importData);

  // Search
  document.getElementById('search-bar').addEventListener('keyup', filterTable);

  // Add Fabric
  document.getElementById('add-fabric-btn').addEventListener('click', addFabricField);

  // Form submission handled in another module, or here if you prefer
}

/**
 * Sorting logic
 */
function sortItems(field) {
  if (field === 'name') {
    wardrobeItems.sort((a, b) => a.name.localeCompare(b.name));
  } else if (field === 'washHistory') {
    wardrobeItems.sort((a, b) => b.washHistory.length - a.washHistory.length);
  } else if (field === 'usageHistory') {
    wardrobeItems.sort((a, b) => b.usageHistory.length - a.usageHistory.length);
  }
  saveWardrobeItemsToStorage();
  updateWardrobeTable();
}

/**
 * Filter the table by item name
 */
function filterTable() {
  const query = document.getElementById('search-bar').value.toLowerCase();
  const rows = document.querySelectorAll('#wardrobe-table tbody tr');
  rows.forEach(row => {
    const itemName = row.cells[1].textContent.toLowerCase(); // Name in col index 1
    row.style.display = itemName.includes(query) ? '' : 'none';
  });
}

/**
 * Fabric Field Management (Add extra rows for multi-fabric)
 */
export function addFabricField() {
  const fabricInputs = document.getElementById('fabric-inputs');
  const newField = document.createElement('div');
  newField.className = 'fabric-group';
  newField.innerHTML = `
    <select class="fabric-type">
      <option value="Cotton">Cotton</option>
      <option value="Polyester">Polyester</option>
      <option value="Wool">Wool</option>
      <option value="Leather">Leather</option>
      <option value="Silk">Silk</option>
      <option value="Nylon">Nylon</option>
      <option value="Linen">Linen</option>
      <option value="Acrylic">Acrylic</option>
      <option value="Spandex">Spandex</option>
      <option value="Cashmere">Cashmere</option>
    </select>
    <input type="number" class="fabric-percentage" placeholder="%" min="1" max="100" required />
    <button type="button" onclick="removeFabricField(this)">Remove</button>
  `;
  fabricInputs.appendChild(newField);
}

/** Called by "Remove" button in the new fabric field. */
window.removeFabricField = function(button) {
  button.parentElement.remove();
};

/**
 * Wash Reminders if last wash is >30 days
 */
function checkWashReminders() {
  const today = new Date();
  wardrobeItems.forEach(item => {
    if (item.washHistory.length > 0) {
      const lastWashDate = new Date(item.washHistory[item.washHistory.length - 1]);
      const diffTime = today - lastWashDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        console.log(`Reminder: ${item.name} was last washed ${diffDays} days ago!`);
      }
    }
  });
}

// ================
// Editing & Deleting Items
// ================
window.editItem = function(id) {
  // Find the item
  const item = wardrobeItems.find(i => i.id === id);
  if (!item) return;

  // Mark the item ID as editing
  window.editingItemId = item.id;

  // Pre-fill form
  document.getElementById('item-name').value = item.name;
  document.getElementById('category').value = item.category;
  document.getElementById('purchase-date').value = item.purchaseDate;
  document.getElementById('image-input').value = '';

  // Rebuild fabric inputs from item.fabrics
  const fabricArea = document.getElementById('fabric-inputs');
  fabricArea.innerHTML = '';
  item.fabrics.forEach(f => {
    const newField = document.createElement('div');
    newField.className = 'fabric-group';
    newField.innerHTML = `
      <select class="fabric-type">
        <option value="Cotton">Cotton</option>
        <option value="Polyester">Polyester</option>
        <option value="Wool">Wool</option>
        <option value="Leather">Leather</option>
        <option value="Silk">Silk</option>
        <option value="Nylon">Nylon</option>
        <option value="Linen">Linen</option>
        <option value="Acrylic">Acrylic</option>
        <option value="Spandex">Spandex</option>
        <option value="Cashmere">Cashmere</option>
      </select>
      <input type="number" class="fabric-percentage" placeholder="%" min="1" max="100" required />
      <button type="button" onclick="removeFabricField(this)">Remove</button>
    `;
    fabricArea.appendChild(newField);
    // Populate
    const typeSelect = newField.querySelector('.fabric-type');
    const percInput  = newField.querySelector('.fabric-percentage');
    typeSelect.value = f.type;
    percInput.value  = f.percentage;
  });

  // Change button & form title
  document.getElementById('form-title').textContent = 'Edit Wardrobe Item';
  document.getElementById('submit-button').textContent = 'Save Changes';
};

window.deleteItem = function(id) {
  const index = wardrobeItems.findIndex(i => i.id === id);
  if (index !== -1) {
    wardrobeItems.splice(index, 1);
    saveWardrobeItemsToStorage();
    updateWardrobeTable();
  }
};
