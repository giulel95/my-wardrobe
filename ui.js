/**
 * ui.js
 * 
 * Updated to show partial decimal percentages for condition (e.g., "72.3%").
 * 
 * IMPORTANT:
 *  - We assume you replaced `condition.js` with the new version that calculates
 *    partial decimals (using weeks, usage frequency, etc.).
 *  - The rest of the code below is largely the same. The main change is how we
 *    render the condition percentage in the table (no extra rounding).
 */

// Main function to rebuild the wardrobe table in the DOM
window.updateWardrobeTable = function() {
  const tbody = document.querySelector('#wardrobe-table tbody');
  tbody.innerHTML = '';

  window.wardrobeItems.forEach((item) => {
    // Get the partial-decimal condition from the new `calculateCondition`
    const condPercent = window.calculateCondition(item);

    const usageCount = item.usageHistory.length;
    const lastUse = usageCount > 0 ? item.usageHistory[usageCount - 1] : 'Never';

    const washCount = item.washHistory.length;
    const lastWash = washCount > 0 ? item.washHistory[washCount - 1] : 'Never';

    // Build a table row
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
      <!-- Show decimals if the returned value includes them -->
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

  // Check for items needing a wash (30+ days) - optional
  checkWashReminders();
};

// Checks if last wash is older than ~30 days, logs a reminder in the console
function checkWashReminders() {
  const today = new Date();
  window.wardrobeItems.forEach((item) => {
    if (item.washHistory.length > 0) {
      const lastWashDate = new Date(item.washHistory[item.washHistory.length - 1]);
      const diffDays = Math.floor((today - lastWashDate) / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        console.log(`Reminder: ${item.name} was last washed ${diffDays} days ago!`);
      }
    }
  });
}

// Event listener for adding extra fabric rows
document.getElementById('add-fabric-btn').addEventListener('click', function() {
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
      <option value="Bamboo">Bamboo</option>
      <option value="Denim">Denim</option>
      <option value="Rayon">Rayon</option>
      <option value="Viscose">Viscose</option>
      <option value="Modal">Modal</option>
      <option value="Organza">Organza</option>
      <option value="Velvet">Velvet</option>
      <option value="Satin">Satin</option>
      <option value="Lyocell">Lyocell</option>
      <option value="Chiffon">Chiffon</option>
      <option value="Latex">Latex</option>
    </select>
    <input type="number" class="fabric-percentage" placeholder="%" min="1" max="100" required />
    <button type="button" onclick="removeFabricField(this)">Remove</button>
  `;
  fabricInputs.appendChild(newField);
});

// Remove a single fabric input row
window.removeFabricField = function(button) {
  button.parentElement.remove();
};

// Sorting
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

// Searching
document.getElementById('search-bar').addEventListener('keyup', filterTable);
function filterTable() {
  const query = document.getElementById('search-bar').value.toLowerCase();
  const rows = document.querySelectorAll('#wardrobe-table tbody tr');
  rows.forEach(row => {
    const itemName = row.cells[1].textContent.toLowerCase(); // name in col index 1
    row.style.display = itemName.includes(query) ? '' : 'none';
  });
}

// Editing & Deleting Items
window.editItem = function(id) {
  const item = window.wardrobeItems.find(i => i.id === id);
  if (!item) return;

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
    const field = document.createElement('div');
    field.className = 'fabric-group';
    field.innerHTML = `
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
        <option value="Bamboo">Bamboo</option>
        <option value="Denim">Denim</option>
        <option value="Rayon">Rayon</option>
        <option value="Viscose">Viscose</option>
        <option value="Modal">Modal</option>
        <option value="Organza">Organza</option>
        <option value="Velvet">Velvet</option>
        <option value="Satin">Satin</option>
        <option value="Lyocell">Lyocell</option>
        <option value="Chiffon">Chiffon</option>
        <option value="Latex">Latex</option>
      </select>
      <input type="number" class="fabric-percentage" placeholder="%" min="1" max="100" required />
      <button type="button" onclick="removeFabricField(this)">Remove</button>
    `;
    fabricArea.appendChild(field);

    // Set the actual values
    field.querySelector('.fabric-type').value = f.type;
    field.querySelector('.fabric-percentage').value = f.percentage;
  });

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
