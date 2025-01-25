import { wardrobeItems, saveWardrobeItemsToStorage } from './data.js';
import { updateWardrobeTable } from './ui.js';

/**
 * Prompt user for usage date, add to usageHistory.
 */
export function addUsage(id) {
  const item = wardrobeItems.find((i) => i.id === id);
  if (!item) return;

  const userInput = prompt("Enter usage date (YYYY-MM-DD). Leave blank for today's date:");
  let usageDate;
  if (!userInput) {
    usageDate = new Date().toISOString().split('T')[0];
  } else {
    const pattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!pattern.test(userInput)) {
      alert("Invalid date format (YYYY-MM-DD).");
      return;
    }
    const testDate = new Date(userInput);
    if (isNaN(testDate.getTime())) {
      alert("Invalid date. Please use YYYY-MM-DD.");
      return;
    }
    usageDate = userInput;
  }

  item.usageHistory.push(usageDate);
  saveWardrobeItemsToStorage();
  updateWardrobeTable();
}

/**
 * Show usage history in a separate section, allowing edit/delete.
 */
export function viewUsageHistory(id) {
  const item = wardrobeItems.find((i) => i.id === id);
  if (!item) return;

  const usageSection = document.getElementById('usage-history-section');
  const usageDetails = document.getElementById('usage-history-details');

  let usageList = '<ul>';
  item.usageHistory.forEach((date, index) => {
    usageList += `
      <li>
        ${date}
        <button onclick="editUsageDate(${item.id}, ${index})">Edit</button>
        <button onclick="deleteUsageDate(${item.id}, ${index})">Delete</button>
      </li>
    `;
  });
  usageList += '</ul>';

  usageDetails.innerHTML = `
    <h3>${item.name} - Usage History</h3>
    <p>Total Usage: ${item.usageHistory.length}</p>
    ${usageList}
  `;

  usageSection.style.display = 'block';
}

/** Prompt new usage date, update array. */
window.editUsageDate = function(itemId, usageIndex) {
  const item = wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  const oldDate = item.usageHistory[usageIndex];
  const newDate = prompt("Enter new date (YYYY-MM-DD):", oldDate);
  if (newDate === null) return; // user cancelled

  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(newDate)) {
    alert("Invalid date format. Please use YYYY-MM-DD.");
    return;
  }
  const testDate = new Date(newDate);
  if (isNaN(testDate.getTime())) {
    alert("Invalid date. Please use a valid YYYY-MM-DD.");
    return;
  }

  item.usageHistory[usageIndex] = newDate;
  saveWardrobeItemsToStorage();
  updateWardrobeTable();
  viewUsageHistory(itemId);
};

/** Delete usage date from usageHistory. */
window.deleteUsageDate = function(itemId, usageIndex) {
  const item = wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  item.usageHistory.splice(usageIndex, 1);
  saveWardrobeItemsToStorage();
  updateWardrobeTable();
  viewUsageHistory(itemId);
};

/**
 * Add a wash date (prompt user), store in washHistory.
 */
export function addWash(id) {
  const item = wardrobeItems.find((i) => i.id === id);
  if (!item) return;

  const userInput = prompt("Enter wash date (YYYY-MM-DD). Leave blank for today's date:");
  let washDate;
  if (!userInput) {
    washDate = new Date().toISOString().split('T')[0];
  } else {
    const pattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!pattern.test(userInput)) {
      alert("Invalid date format (YYYY-MM-DD).");
      return;
    }
    const testDate = new Date(userInput);
    if (isNaN(testDate.getTime())) {
      alert("Invalid date. Please use a valid YYYY-MM-DD.");
      return;
    }
    washDate = userInput;
  }

  item.washHistory.push(washDate);
  saveWardrobeItemsToStorage();
  updateWardrobeTable();
}

/**
 * Show wash history in a separate section, allowing edit/delete.
 */
export function viewWashHistory(id) {
  const item = wardrobeItems.find((i) => i.id === id);
  if (!item) return;

  const washSection = document.getElementById('wash-history-section');
  const washDetails = document.getElementById('wash-history-details');

  let washList = '<ul>';
  item.washHistory.forEach((date, index) => {
    washList += `
      <li>
        ${date}
        <button onclick="editWashDate(${item.id}, ${index})">Edit</button>
        <button onclick="deleteWashDate(${item.id}, ${index})">Delete</button>
      </li>
    `;
  });
  washList += '</ul>';

  washDetails.innerHTML = `
    <h3>${item.name} - Wash History</h3>
    <p>Total Washes: ${item.washHistory.length}</p>
    ${washList}
  `;

  washSection.style.display = 'block';
}

/** Edit an existing wash date. */
window.editWashDate = function(itemId, washIndex) {
  const item = wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  const oldDate = item.washHistory[washIndex];
  const newDate = prompt("Enter new wash date (YYYY-MM-DD):", oldDate);
  if (newDate === null) return; // user canceled

  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(newDate)) {
    alert("Invalid date format. Please use YYYY-MM-DD.");
    return;
  }
  const testDate = new Date(newDate);
  if (isNaN(testDate.getTime())) {
    alert("Invalid date. Please use a valid YYYY-MM-DD.");
    return;
  }

  item.washHistory[washIndex] = newDate;
  saveWardrobeItemsToStorage();
  updateWardrobeTable();
  viewWashHistory(itemId);
};

/** Delete a wash date. */
window.deleteWashDate = function(itemId, washIndex) {
  const item = wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  item.washHistory.splice(washIndex, 1);
  saveWardrobeItemsToStorage();
  updateWardrobeTable();
  viewWashHistory(itemId);
};

// Close usage/wash history by clicking 'Close' button
document.getElementById('close-usage-history').addEventListener('click', () => {
  document.getElementById('usage-history-section').style.display = 'none';
});
document.getElementById('close-wash-history').addEventListener('click', () => {
  document.getElementById('wash-history-section').style.display = 'none';
});
