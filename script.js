/**
 * script.js
 *
 * - Captures purchasePrice on add/edit
 * - Overrides addUsage/addWash to include Undo & Fabric Warnings
 * - Implements Batch Wash with Compatibility Checker
 * - Shows an Undo snackbar
 */

// ----- Undo Stack & Snackbar -----
window.undoStack = [];
function showUndoSnackbar(msg, undoFn) {
  const bar = document.getElementById('undo-snackbar');
  bar.innerHTML = `${msg} <button id="undo-btn">Undo</button>`;
  bar.classList.add('show');
  document.getElementById('undo-btn').onclick = () => {
    undoFn();
    bar.classList.remove('show');
  };
  setTimeout(() => bar.classList.remove('show'), 5000);
}
function undoLastAction() {
  const act = window.undoStack.pop();
  if (!act) return;
  const item = window.wardrobeItems.find(i => i.id === act.itemId);
  if (!item) return;
  if (act.type === 'usage') {
    const idx = item.usageHistory.lastIndexOf(act.date);
    if (idx > -1) item.usageHistory.splice(idx,1);
  } else if (act.type === 'wash') {
    const idx = item.washHistory.lastIndexOf(act.date);
    if (idx > -1) item.washHistory.splice(idx,1);
  }
  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
}

// ----- Fabric Warnings & Compatibility -----
const fabricWarnings = {
  'Silk':'Silk is delicate—avoid frequent washing.',
  'Wool':'Wool => cold wash only.',
  'Polyester':'Avoid high dryer heat on Polyester.',
  'Leather':'Leather needs special cleaning—no machine wash.',
};
const incompatiblePairs = [
  ['Silk','Denim'], ['Wool','Denim'], ['Leather','Denim'], ['Silk','Wool']
];

// ----- Load + Initial Table -----
window.addEventListener('load', () => {
  window.loadWardrobeItemsFromStorage();
  window.updateWardrobeTable();
});

// ----- Form Submission (Add/Edit) -----
document.getElementById('wardrobe-form').addEventListener('submit', async function(e){
  e.preventDefault();
  const name    = document.getElementById('item-name').value.trim();
  const category= document.getElementById('category').value;
  const purchaseDate  = document.getElementById('purchase-date').value;
  const purchasePrice = parseFloat(document.getElementById('purchase-price').value)||0;

  // Fabrics…
  const fabricGroups = document.querySelectorAll('.fabric-group');
  const fabrics = []; let sum=0;
  fabricGroups.forEach(g=>{
    const type = g.querySelector('.fabric-type').value;
    const pct  = parseInt(g.querySelector('.fabric-percentage').value,10);
    fabrics.push({type,percentage:pct});
    sum+=pct;
  });
  if(sum!==100){ alert('Fabrics must total 100%!'); return; }

  // Image
  const imgIn = document.getElementById('image-input');
  let imageData='';
  if(imgIn.files[0]) imageData = await readFileAsBase64(imgIn.files[0]);

  if(window.editingItemId){
    const idx = window.wardrobeItems.findIndex(i=>i.id===window.editingItemId);
    if(idx>-1){
      const it = window.wardrobeItems[idx];
      Object.assign(it,{name,category,purchaseDate,purchasePrice,fabrics});
      if(imageData) it.image=imageData;
    }
    window.editingItemId = null;
    document.getElementById('form-title').textContent='Add a Wardrobe Item';
    document.getElementById('submit-button').textContent='Add Item';
  } else {
    const newItem = {
      id:Date.now(), name,category,purchaseDate,purchasePrice,
      fabrics,image:imageData,usageHistory:[],washHistory:[],wearAndTear:defaultWearAndTear()
    };
    window.wardrobeItems.push(newItem);
  }

  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
  this.reset();
});

// Helper: File → Base64
function readFileAsBase64(file){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload = e=>res(e.target.result);
    r.onerror=rej;
    r.readAsDataURL(file);
  });
}

// ----- Override addUsage -----
window.addUsage = function(id){
  const item = window.wardrobeItems.find(i=>i.id===id);
  if(!item) return;
  const inp = prompt("Usage date (YYYY-MM-DD), blank=today:");
  let date = inp ? inp : new Date().toISOString().split('T')[0];
  const pat=/^\d{4}-\d{2}-\d{2}$/;
  if(inp &&(!pat.test(inp)||isNaN(new Date(inp).getTime()))){
    alert("Bad date."); return;
  }
  item.usageHistory.push(date);
  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
  window.undoStack.push({type:'usage',itemId:id,date});
  showUndoSnackbar(`Recorded use of ${item.name}`, undoLastAction);
};

// ----- Override addWash -----
window.addWash = function(id){
  const item = window.wardrobeItems.find(i=>i.id===id);
  if(!item) return;
  // Warnings
  const ws = [];
  item.fabrics.forEach(f=>{
    const w = fabricWarnings[f.type];
    if(w && !ws.includes(w)) ws.push(w);
  });
  if(ws.length && !confirm(`Warnings:\n• ${ws.join('\n• ')}\nProceed?`)) return;

  const inp = prompt("Wash date (YYYY-MM-DD), blank=today:");
  let date = inp?inp:new Date().toISOString().split('T')[0];
  const pat=/^\d{4}-\d{2}-\d{2}$/;
  if(inp &&(!pat.test(inp)||isNaN(new Date(inp).getTime()))){
    alert("Bad date."); return;
  }
  item.washHistory.push(date);
  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
  window.undoStack.push({type:'wash',itemId:id,date});
  showUndoSnackbar(`Recorded wash of ${item.name}`, undoLastAction);
};

// ----- Batch Wash -----
document.getElementById('batch-wash-btn').addEventListener('click',()=>{
  const sel = Array.from(document.querySelectorAll('.item-checkbox:checked'))
                .map(cb=>parseInt(cb.value,10));
  if(!sel.length) return;
  const issues = [];
  sel.forEach((id,i)=>{
    const a=window.wardrobeItems.find(x=>x.id===id);
    sel.slice(i+1).forEach(id2=>{
      const b=window.wardrobeItems.find(x=>x.id===id2);
      a.fabrics.forEach(f1=>{
        b.fabrics.forEach(f2=>{
          incompatiblePairs.forEach(([x,y])=>{
            if((x===f1.type&&y===f2.type)||(x===f2.type&&y===f1.type)){
              issues.push(`${f1.type} (in ${a.name}) ≠ ${f2.type} (in ${b.name})`);
            }
          });
        });
      });
    });
  });
  if(issues.length && !confirm(`Compatibility issues:\n• ${issues.join('\n• ')}\nProceed?`)) return;
  const today = new Date().toISOString().split('T')[0];
  sel.forEach(id=>{
    const it=window.wardrobeItems.find(x=>x.id===id);
    it.washHistory.push(today);
    window.undoStack.push({type:'wash',itemId:id,date:today});
  });
  window.saveWardrobeItemsToStorage();
  window.updateWardrobeTable();
  showUndoSnackbar(`Batch washed ${sel.length} items`, undoLastAction);
});

// Enable/disable Batch Wash button
document.addEventListener('change',()=>{
  document.getElementById('batch-wash-btn').disabled =
    !document.querySelector('.item-checkbox:checked');
});
