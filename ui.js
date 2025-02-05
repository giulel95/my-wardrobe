/********************************************************************************
 * ui.js
 *
 * Enhanced with a dedicated Reminders system, generating notifications for:
 *  - Overdue washes (item not washed for 14+ days)
 *  - High-level temporary wear (e.g., dryness=3, pilling=3, colorFade=3, etc.)
 *  - Wrinkles or strong odors
 * 
 * The messages are displayed in a Reminders Panel (#reminders-box) in index.html.
 ********************************************************************************/

window.updateWardrobeTable = function() {
  const tbody = document.querySelector('#wardrobe-table tbody');
  tbody.innerHTML = '';

  window.wardrobeItems.forEach(item => {
    // 1) Compute condition percentage
    const condPercent = window.calculateCondition(item);

    // 2) Usage/wash stats
    const usageCount = item.usageHistory ? item.usageHistory.length : 0;
    const lastUse = usageCount > 0 ? item.usageHistory[usageCount - 1] : 'Never';
    const washCount = item.washHistory ? item.washHistory.length : 0;
    const lastWash = washCount > 0 ? item.washHistory[washCount - 1] : 'Never';

    // 3) Temporary wear
    const tw = item.wearAndTear || {};
    const wrinkles       = tw.wrinkles || false;
    const odors          = tw.odors || false;
    const stainsLevel    = (tw.stains && typeof tw.stains.level === 'number') ? tw.stains.level : 0;
    const drynessLevel   = (tw.dryness && typeof tw.dryness.level === 'number') ? tw.dryness.level : 0;
    const pillingLevel   = (tw.pilling && typeof tw.pilling.level === 'number') ? tw.pilling.level : 0;
    const fadeLevel      = (tw.colorFade && typeof tw.colorFade.level === 'number') ? tw.colorFade.level : 0;
    const dirtLevel      = (tw.surfaceDirt && typeof tw.surfaceDirt.level === 'number') ? tw.surfaceDirt.level : 0;
    const elasticityLoss = tw.elasticityLoss || false;

    // Build "Temp Wear" description
    const desc = [];
    if (wrinkles)         desc.push("Wrinkles");
    if (odors)            desc.push("Odors");
    if (stainsLevel > 0)  desc.push(`Stains (L${stainsLevel})`);
    if (drynessLevel > 0) desc.push(`Dryness (L${drynessLevel})`);
    if (pillingLevel > 0) desc.push(`Pilling (L${pillingLevel})`);
    if (fadeLevel > 0)    desc.push(`ColorFade (L${fadeLevel})`);
    if (dirtLevel > 0)    desc.push(`Dirt (L${dirtLevel})`);
    if (elasticityLoss)   desc.push("Elasticity Loss");

    // Create table row (11 columns)
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
      <td>${desc.join(", ") || "None"}</td>
      <td>
        <!-- Usage & Wash -->
        <button class="action-btn usage-btn" onclick="addUsage(${item.id})">Use</button>
        <button class="action-btn wash-btn" onclick="addWash(${item.id})">Wash</button>
        <button class="action-btn history-btn" onclick="viewUsageHistory(${item.id})">Usage Hist</button>
        <button class="action-btn history-btn" onclick="viewWashHistory(${item.id})">Wash Hist</button>

        <!-- Temporary Wear increments (e.g., dryness, pilling, fade, stains++) -->
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

  // After building the table, now check for reminders
  checkReminders();
};

/** 
 * checkReminders():
 *  - Evaluate each item's advanced wear factors and last wash date
 *  - Generate user-friendly suggestions (washing, ironing, conditioning, etc.)
 *  - Display them in #reminders-box 
 */
function checkReminders() {
  const messages = [];
  const today = new Date();
  const DAYS_BEFORE_WASH_REMINDER = 14; // example threshold

  window.wardrobeItems.forEach(item => {
    const name = item.name;
    // Temp wear
    const tw = item.wearAndTear || {};
    const wrinkles       = tw.wrinkles || false;
    const odors          = tw.odors || false;
    const stainsLevel    = (tw.stains && typeof tw.stains.level === 'number') ? tw.stains.level : 0;
    const drynessLevel   = (tw.dryness && typeof tw.dryness.level === 'number') ? tw.dryness.level : 0;
    const pillingLevel   = (tw.pilling && typeof tw.pilling.level === 'number') ? tw.pilling.level : 0;
    const fadeLevel      = (tw.colorFade && typeof tw.colorFade.level === 'number') ? tw.colorFade.level : 0;
    const dirtLevel      = (tw.surfaceDirt && typeof tw.surfaceDirt.level === 'number') ? tw.surfaceDirt.level : 0;

    // 1) Wash reminders
    if (item.washHistory && item.washHistory.length > 0) {
      const lastWashDateStr = item.washHistory[item.washHistory.length - 1];
      const lastWashDate = new Date(lastWashDateStr);
      const diffDays = Math.floor((today - lastWashDate) / (1000 * 60 * 60 * 24));
      if (diffDays > DAYS_BEFORE_WASH_REMINDER) {
        messages.push(`Wash Reminder: ${name} was last washed ${diffDays} days ago.`);
      }
    } else {
      messages.push(`Wash Reminder: ${name} has never been washed.`);
    }

    // 2) Wrinkles => suggest ironing
    if (wrinkles) {
      messages.push(`Ironing Suggestion: ${name} is wrinkled.`);
    }

    // 3) Odors => suggest washing
    if (odors) {
      messages.push(`Odor Suggestion: ${name} has a strong odor. Consider washing soon.`);
    }

    // 4) High-level dryness => suggest conditioning
    if (drynessLevel === 3) {
      messages.push(`Conditioning Reminder: ${name} (Dryness L3). Consider leather conditioner.`);
    }

    // 5) High-level pilling => suggest fabric shaver or gentle brushing
    if (pillingLevel >= 2) {
      messages.push(`${name} is pilling (L${pillingLevel}). Use a fabric shaver or gentle brush.`);
    }

    // 6) High-level color fade => might suggest special dye or fade-preventing wash
    if (fadeLevel >= 2) {
      messages.push(`${name} is losing color (L${fadeLevel}). Consider color-safe detergent or re-dyeing.`);
    }

    // 7) High-level stains => spot-treat or wash
    if (stainsLevel >= 2) {
      messages.push(`${name} has significant stains (L${stainsLevel}). Consider spot-treating or washing.`);
    }

    // 8) High-level dirt => cleaning reminder
    if (dirtLevel >= 2) {
      messages.push(`${name} has visible dirt (L${dirtLevel}). Consider a quick clean or brushing.`);
    }
  });

  displayReminders(messages);
}

/** displayReminders(msgs):
 *  - Populate #reminders-box with each message, or "No reminders" if none
 */
function displayReminders(msgs) {
  const box = document.getElementById('reminders-box');
  if (!box) {
    // fallback if #reminders-box is not in the HTML
    console.warn("No #reminders-box found. Reminders will be logged to console.");
    msgs.forEach(m => console.log("Reminder:", m));
    return;
  }

  box.innerHTML = "";

  if (msgs.length === 0) {
    const p = document.createElement('p');
    p.textContent = "No reminders! Your wardrobe looks good.";
    box.appendChild(p);
    return;
  }

  msgs.forEach(reminder => {
    const p = document.createElement('p');
    p.textContent = reminder;
    box.appendChild(p);
  });
}

/*****************************************************************************
 * SORTING & SEARCH
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
    const itemName = row.cells[1].textContent.toLowerCase();
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
