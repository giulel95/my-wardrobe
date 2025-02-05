/********************************************************************************
 * ui.js
 *
 * This file handles the display and interaction of items in the table, plus
 * "Automatic Wash Suggestions" and "Ironing/Wrinkle Alerts" (the new features).
 ********************************************************************************/

/*****************************************************************************
 * CONFIGURABLE REMINDER THRESHOLDS
 *****************************************************************************/
const MAX_DAYS_WITHOUT_WASH = 14;  // e.g., 14 days
const STAIN_LEVEL_WASH = 2;       // e.g., stain level >=2 suggests wash


/**
 * Rebuild the main wardrobe table in the DOM.
 */
window.updateWardrobeTable = function() {
  const tbody = document.querySelector('#wardrobe-table tbody');
  tbody.innerHTML = '';

  window.wardrobeItems.forEach((item) => {
    // 1) Calculate condition (0..100%)
    const condPercent = window.calculateCondition(item);

    // 2) Basic usage/wash stats
    const usageCount = item.usageHistory.length;
    const lastUse = usageCount > 0 ? item.usageHistory[usageCount - 1] : 'Never';

    const washCount = item.washHistory.length;
    const lastWash = washCount > 0 ? item.washHistory[washCount - 1] : 'Never';

    // 3) Temporary wear (wrinkles, odors, stains, etc.)
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

    // 4) Build a row with columns:
    //    Image | Name | Category | Purchase Date | Usage Count | Last Used
    //    | Total Washes | Last Wash | Condition | Temp Wear | Actions
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

        <!-- Buttons for demonstration of temporary wear -->
        <button onclick="addTemporaryWear(${item.id}, 'wrinkles', true)">Wrinkle+</button>
        <button onclick="addTemporaryWear(${item.id}, 'odors', true)">Odor+</button>
        <button onclick="addTemporaryWear(${item.id}, 'stains', { level:2 })">Stain L2</button>
        <button onclick="resetTemporaryWear(${item.id})">Resolve Wear</button>
        
        <!-- Edit/Delete -->
        <button class="action-btn edit-btn" onclick="editItem(${item.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteItem(${item.id})">Delete</button>
      </td>
    `;

    tbody.appendChild(row);
  });

  // After building the table, run the new reminders logic:
  checkReminders();
};

/*****************************************************************************
 * AUTOMATIC WASH & IRONING REMINDERS
 *****************************************************************************/

/**
 * checkReminders():
 * - Suggest washing if odors or high stain level, or not washed in X days
 * - Suggest ironing if wrinkles are present
 * Displays messages in #reminders-box (if present), else logs to console.
 */
function checkReminders() {
  const suggestions = [];

  // Today for date comparisons
  const today = new Date();

  window.wardrobeItems.forEach(item => {
    const name = item.name;
    const tempWear = item.wearAndTear || {
      wrinkles: false,
      odors: false,
      stains: { level: 0 },
      elasticityLoss: false,
      surfaceDirt: { level: 0 }
    };

    // (A) Check if strong odors or stain level >= STAIN_LEVEL_WASH
    if (tempWear.odors) {
      suggestions.push(`Wash Suggestion: ${name} (odors detected).`);
    } else if ((tempWear.stains.level || 0) >= STAIN_LEVEL_WASH) {
      suggestions.push(`Wash Suggestion: ${name} (stains level ${tempWear.stains.level}).`);
    } else {
      // (B) Check days since last wash
      if (item.washHistory && item.washHistory.length > 0) {
        const lastWashDateStr = item.washHistory[item.washHistory.length - 1];
        const lastWashDate = new Date(lastWashDateStr);
        const diffDays = Math.floor((today - lastWashDate) / (1000 * 60 * 60 * 24));
        if (diffDays > MAX_DAYS_WITHOUT_WASH) {
          suggestions.push(`Wash Suggestion: ${name} (last wash was ${diffDays} days ago).`);
        }
      } else {
        // never washed
        suggestions.push(`Wash Suggestion: ${name} (never washed yet).`);
      }
    }

    // (C) Check for wrinkles => ironing suggestion
    if (tempWear.wrinkles) {
      suggestions.push(`Ironing Suggestion: ${name} (wrinkled).`);
    }
  });

  // Display suggestions in #reminders-box or console
  displayReminders(suggestions);
}

/** 
 * Render the suggestions in a <div id="reminders-box"> if it exists, 
 * otherwise just log to console.
 */
function displayReminders(messages) {
  const box = document.getElementById('reminders-box');
  if (!box) {
    // Fallback: log to console
    messages.forEach(msg => console.log(msg));
    return;
  }

  // Clear old suggestions
  box.innerHTML = '';

  // If no messages
  if (messages.length === 0) {
    const p = document.createElement('p');
    p.textContent = "No new suggestions. Your wardrobe is in good shape!";
    box.appendChild(p);
    return;
  }

  // Otherwise, display each suggestion
  messages.forEach(msg => {
    const p = document.createElement('p');
    p.textContent = msg;
    box.appendChild(p);
  });
}

/*****************************************************************************
 * SORTING & SEARCHING
 *****************************************************************************/

/** Sorting by name, usageHistory length, or washHistory length. */
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
    const itemName = row.cells[1].textContent.toLowerCase(); // name in col index 1
    row.style.display = itemName.includes(query) ? '' : 'none';
  });
}

/*****************************************************************************
 * EDITING & DELETING ITEMS
 *****************************************************************************/

/** Pre-fill form fields to edit an existing item. */
window.editItem = function(id) {
  const item = window.wardrobeItems.find(i => i.id === id);
  if (!item) return;

  window.editingItemId = item.id;

  // Fill basic fields
  document.getElementById('item-name').value = item.name;
  document.getElementById('category').value = item.category;
  document.getElementById('purchase-date').value = item.purchaseDate;
  document.getElementById('image-input').value = '';

  // Rebuild the fabric input rows
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

      // set actual values
      field.querySelector('.fabric-type').value = f.type;
      field.querySelector('.fabric-percentage').value = f.percentage;
    });
  }

  document.getElementById('form-title').textContent = 'Edit Wardrobe Item';
  document.getElementById('submit-button').textContent = 'Save Changes';
};

/** Delete item from the global array. */
window.deleteItem = function(id) {
  const idx = window.wardrobeItems.findIndex(i => i.id === id);
  if (idx !== -1) {
    window.wardrobeItems.splice(idx, 1);
    window.saveWardrobeItemsToStorage();
    window.updateWardrobeTable();
  }
};
