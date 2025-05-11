/********************************************************************************
 * ui.js
 *
 * Renders:
 *  - A “Select” checkbox
 *  - Price & Cost/Wear columns
 *  - Everything else as before
 * Calls checkReminders() at the end.
 ********************************************************************************/

window.updateWardrobeTable = function() {
  const tbody = document.querySelector('#wardrobe-table tbody');
  tbody.innerHTML = '';

  window.wardrobeItems.forEach(item => {
    // Condition
    const condPct = window.calculateCondition(item);

    // Usage/Wash stats
    const uses = item.usageHistory.length;
    const lastUse = uses ? item.usageHistory[uses-1] : 'Never';
    const washes = item.washHistory.length;
    const lastWash = washes ? item.washHistory[washes-1] : 'Never';

    // Cost per wear
    const cpu = uses > 0
      ? (item.purchasePrice / uses).toFixed(2)
      : item.purchasePrice.toFixed(2);

    // Temp wear text
    const tw = item.wearAndTear || {};
    const desc = [];
    if (tw.wrinkles)       desc.push('Wrinkles');
    if (tw.odors)          desc.push('Odors');
    if (tw.stains?.level)  desc.push(`Stains(L${tw.stains.level})`);
    if (tw.dryness?.level) desc.push(`Dry(L${tw.dryness.level})`);
    if (tw.pilling?.level) desc.push(`Pill(L${tw.pilling.level})`);
    if (tw.colorFade?.level) desc.push(`Fade(L${tw.colorFade.level})`);
    if (tw.surfaceDirt?.level) desc.push(`Dirt(L${tw.surfaceDirt.level})`);
    if (tw.elasticityLoss) desc.push('Elasticity Loss');

    // Build row
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="checkbox" class="item-checkbox" value="${item.id}" /></td>
      <td class="image-cell">
        ${item.image
          ? `<img src="${item.image}" alt="${item.name}" class="item-image"/>`
          : `<div style="width:50px;height:50px;background:#ccc;"></div>`}
      </td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.purchaseDate}</td>
      <td>€${item.purchasePrice.toFixed(2)}</td>
      <td>${uses}</td>
      <td>${lastUse}</td>
      <td>${washes}</td>
      <td>${lastWash}</td>
      <td>${condPct}%</td>
      <td class="cost-per-wear">€${cpu}</td>
      <td>${desc.join(', ')||'None'}</td>
      <td>
        <button class="action-btn usage-btn"   onclick="addUsage(${item.id})">Use</button>
        <button class="action-btn wash-btn"     onclick="addWash(${item.id})">Wash</button>
        <button class="action-btn history-btn"  onclick="viewUsageHistory(${item.id})">Usage Hist</button>
        <button class="action-btn history-btn"  onclick="viewWashHistory(${item.id})">Wash Hist</button>
        <button onclick="incrementWearLevel(${item.id}, 'stains', 1)">Stain++</button>
        <button class="dry-btn"  onclick="incrementWearLevel(${item.id}, 'dryness', 1)">Dry++</button>
        <button class="pilling-btn" onclick="incrementWearLevel(${item.id}, 'pilling', 1)">Pill++</button>
        <button class="fade-btn" onclick="incrementWearLevel(${item.id}, 'colorFade', 1)">Fade++</button>
        <button onclick="resetTemporaryWear(${item.id})">Resolve</button>
        <button class="action-btn edit-btn"   onclick="editItem(${item.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteItem(${item.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Generate reminders
  checkReminders();
};
