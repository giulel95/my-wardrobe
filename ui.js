/********************************************************************************
 * ui.js
 *
 * Builds the table (including Temp Wear, Condition, etc.),
 * provides sorting & searching,
 * and includes the "Add from Link" scraping logic on the client side.
 ********************************************************************************/

window.updateWardrobeTable = function() {
  const tbody = document.querySelector('#wardrobe-table tbody');
  tbody.innerHTML = '';

  window.wardrobeItems.forEach((item) => {
    const condPercent = window.calculateCondition(item);
    const usageCount = item.usageHistory.length;
    const lastUse = usageCount > 0 ? item.usageHistory[usageCount - 1] : 'Never';
    const washCount = item.washHistory.length;
    const lastWash = washCount > 0 ? item.washHistory[washCount - 1] : 'Never';

    const tempWear = item.wearAndTear || {
      wrinkles: false,
      odors: false,
      stains: { level: 0 },
      elasticityLoss: false,
      surfaceDirt: { level: 0 },
    };
    const tempWearDesc = [];
    if (tempWear.wrinkles) tempWearDesc.push("Wrinkles");
    if (tempWear.odors) tempWearDesc.push("Odors");
    if ((tempWear.stains.level || 0) > 0) tempWearDesc.push(`Stains (L${tempWear.stains.level})`);
    if (tempWear.elasticityLoss) tempWearDesc.push("Elasticity Loss");
    if ((tempWear.surfaceDirt.level || 0) > 0) tempWearDesc.push(`Dirt (L${tempWear.surfaceDirt.level})`);

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
        <button class="action-btn usage-btn" onclick="addUsage(${item.id})">Use</button>
        <button class="action-btn wash-btn" onclick="addWash(${item.id})">Wash</button>
        <button class="action-btn history-btn" onclick="viewUsageHistory(${item.id})">Usage Hist</button>
        <button class="action-btn history-btn" onclick="viewWashHistory(${item.id})">Wash Hist</button>

        <!-- Temporary Wear example buttons -->
        <button onclick="addTemporaryWear(${item.id}, 'wrinkles', true)">Wrinkle+</button>
        <button onclick="addTemporaryWear(${item.id}, 'odors', true)">Odor+</button>
        <button onclick="addTemporaryWear(${item.id}, 'stains', { level:2 })">Stain L2</button>
        <button onclick="resetTemporaryWear(${item.id})">Resolve Wear</button>

        <!-- Edit/Delete item -->
        <button class="action-btn edit-btn" onclick="editItem(${item.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteItem(${item.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  checkWashReminders();
};

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

/** For adding an extra fabric row in the form */
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

/** Sorting by name/washes/usage */
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

/** Searching by item name */
document.getElementById('search-bar').addEventListener('keyup', filterTable);
function filterTable() {
  const query = document.getElementById('search-bar').value.toLowerCase();
  const rows = document.querySelectorAll('#wardrobe-table tbody tr');
  rows.forEach(row => {
    const itemName = row.cells[1].textContent.toLowerCase();
    row.style.display = itemName.includes(query) ? '' : 'none';
  });
}

/** Edit item (pre-fill the form) */
window.editItem = function(id) {
  const item = window.wardrobeItems.find(i => i.id === id);
  if (!item) return;

  window.editingItemId = item.id;

  document.getElementById('item-name').value = item.name;
  document.getElementById('category').value = item.category;
  document.getElementById('purchase-date').value = item.purchaseDate;
  document.getElementById('image-input').value = '';

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

/** Delete item */
window.deleteItem = function(id) {
  const idx = window.wardrobeItems.findIndex(i => i.id === id);
  if (idx !== -1) {
    window.wardrobeItems.splice(idx, 1);
    window.saveWardrobeItemsToStorage();
    window.updateWardrobeTable();
  }
};

/******************************************************************************
 * ADD AN ITEM FROM LINK (SCRAPING) 
 ******************************************************************************/
document.getElementById('fetch-link-btn').addEventListener('click', async function() {
  const linkInput = document.getElementById('product-link');
  const productUrl = linkInput.value.trim();
  if (!productUrl) {
    alert('Please enter a valid product URL.');
    return;
  }

  try {
    // Call the Node scraping server
    const response = await fetch(`http://localhost:3000/scrape?url=${encodeURIComponent(productUrl)}`);
    if (!response.ok) {
      throw new Error(`Scraping server error: ${response.status}`);
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(`Failed to scrape: ${JSON.stringify(data)}`);
    }

    displayScrapeResult(data, productUrl);
  } catch (err) {
    console.error(err);
    alert('Failed to fetch product info from scraping server.');
  }
});

function displayScrapeResult(data, productUrl) {
  const resultDiv = document.getElementById('scrape-result');
  resultDiv.innerHTML = '';

  let name = data.name || 'Unnamed Product';
  let image = data.image || '';

  const preview = document.createElement('div');
  preview.style.border = '1px solid #ccc';
  preview.style.padding = '1rem';
  preview.style.borderRadius = '5px';
  preview.style.marginTop = '0.5rem';

  preview.innerHTML = `
    <p><strong>Product Name:</strong> ${name}</p>
    ${image ? `<img src="${image}" alt="Product" style="max-width: 200px;">` : ''}
    <p><strong>Link:</strong> <a href="${productUrl}" target="_blank">${productUrl}</a></p>
    <button id="confirm-add-link-item">Add This Item</button>
  `;

  resultDiv.appendChild(preview);

  document.getElementById('confirm-add-link-item').addEventListener('click', function() {
    addItemFromScrape(name, image, productUrl);
    resultDiv.innerHTML = 'Item added to your wardrobe!';
  });
}

function addItemFromScrape(name, image, productUrl) {
  const newItem = {
    id: Date.now(),
    name,
    category: 'Other',
    purchaseDate: new Date().toISOString().split('T')[0],
    productLink: productUrl,
    image,
    usageHistory: [],
    washHistory: [],
    fabrics: [],
    wearAndTear: {
      wrinkles: false,
      odors: false,
      stains: { level: 0 },
      elasticityLoss: false,
      surfaceDirt: { level: 0 },
    },
  };

  window.wardrobeItems.push(newItem);
  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
}
