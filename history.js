window.addUsage = function(id) {
  const item = window.wardrobeItems.find(i => i.id === id);
  if (!item) return;

  const userInput = prompt("Enter usage date (YYYY-MM-DD). Leave blank for today's date:");
  let usageDate;
  if (!userInput) {
    usageDate = new Date().toISOString().split('T')[0];
  } else {
    const pattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!pattern.test(userInput)) {
      alert("Invalid date format. Please use YYYY-MM-DD.");
      return;
    }
    const testDate = new Date(userInput);
    if (isNaN(testDate.getTime())) {
      alert("Invalid date. Please use a valid YYYY-MM-DD.");
      return;
    }
    usageDate = userInput;
  }

  item.usageHistory.push(usageDate);
  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
};

window.viewUsageHistory = function(id) {
  const item = window.wardrobeItems.find(i => i.id === id);
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
};

window.editUsageDate = function(itemId, usageIndex) {
  const item = window.wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  const oldDate = item.usageHistory[usageIndex];
  const newDate = prompt("Enter new usage date (YYYY-MM-DD):", oldDate);
  if (newDate === null) return;

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
  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
  window.viewUsageHistory(itemId);
};

window.deleteUsageDate = function(itemId, usageIndex) {
  const item = window.wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  item.usageHistory.splice(usageIndex, 1);
  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
  window.viewUsageHistory(itemId);
};

document.getElementById('close-usage-history').addEventListener('click', () => {
  document.getElementById('usage-history-section').style.display = 'none';
});

window.addWash = function(id) {
  const item = window.wardrobeItems.find(i => i.id === id);
  if (!item) return;

  const userInput = prompt("Enter wash date (YYYY-MM-DD). Leave blank for today's date:");
  let washDate;
  if (!userInput) {
    washDate = new Date().toISOString().split('T')[0];
  } else {
    const pattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!pattern.test(userInput)) {
      alert("Invalid date format. Please use YYYY-MM-DD.");
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
  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
};

window.viewWashHistory = function(id) {
  const item = window.wardrobeItems.find(i => i.id === id);
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
};

window.editWashDate = function(itemId, washIndex) {
  const item = window.wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  const oldDate = item.washHistory[washIndex];
  const newDate = prompt("Enter new wash date (YYYY-MM-DD):", oldDate);
  if (newDate === null) return;

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
  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
  window.viewWashHistory(itemId);
};

window.deleteWashDate = function(itemId, washIndex) {
  const item = window.wardrobeItems.find(i => i.id === itemId);
  if (!item) return;

  item.washHistory.splice(washIndex, 1);
  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
  window.viewWashHistory(itemId);
};

document.getElementById('close-wash-history').addEventListener('click', () => {
  document.getElementById('wash-history-section').style.display = 'none';
});
