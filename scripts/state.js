import { refreshStats } from './dashboard-ui.js';
// Manual currency - RWF conversion rates
const RATES_TO_RWF = {
  RWF: 1,      // base
  NGN: 1.05,   // 1 NGN ≈ 1.05 RWF
  USD: 1400    // 1 USD ≈ 1400 RWF
};
const msg        = document.getElementById('income-msg');

// Get the multiplier to convert a given currency amount to RWF
export function getRateToRWF(code) {
  const c = String(code || 'RWF').toUpperCase();
  return Number(RATES_TO_RWF[c] ?? 1); // default to 1 if currency is unknown for better error handling
}

  // generating a unique id for each transaction
export function uid() {
    const t = Date.now().toString(36);                 // time component
    const r = Math.random().toString(36).slice(2, 8);  // random number 
    return `txn_${t}${r}`;   
  }

  // current date and time for the createdAt and updatedAt fields
 export function isoNow() {
    return new Date().toISOString();
  }

  // show a message in the hint and error fields
 export function showMsg(text, ok = true) {
    if (!msg) return;
    msg.textContent = text;
    msg.classList.toggle('error', !ok);
    msg.classList.toggle('ok', ok);
    alert(text);
  }

// storage keys
const KEY_SETTINGS = 'hugo_settings';
const KEY_TXNS     = 'hugo_transactions';

//function for document.getElementById
function byId(id){ 
  return document.getElementById(id); 
}

import { loadSettings, saveSettings, loadTxns, saveTxns } from './storage.js';


/* export Json function*/
function exportJSON(){
  const scope = document.querySelector('input[name="export-scope"]:checked')?.value || 'all';
  const payload = {};
  if (scope === 'all' || scope === 'settings') payload.settings    = loadSettings();
  if (scope === 'all' || scope === 'records')  payload.transactions = loadTxns();

  //convert to pretty JSON and trigger download
  const pretty = JSON.stringify(payload, null, 2);
  const blob = new Blob([pretty], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  a.download = `hugo-data-export-${scope}-${stamp}.json`;
  document.body.appendChild(a);
  a.click(); a.remove();
}

// import JSON from a user selected file
function importJSONFromFile(inputEl){
  const file = inputEl?.files?.[0];
  const msg  = byId('import-msg');
  if (!file){ if (msg) msg.textContent = 'No file selected.'; 
    return; 

  }

  //reading the file to be imported
  const reader = new FileReader();
  reader.onerror = () => { 
    if (msg) msg.textContent = 'Failed to read file.'; 
  };
  reader.onload  = () => {
    try {
      const data = JSON.parse(String(reader.result || ''));
      // detect shape
      let settings = null;
      let transactions = [];
      if (Array.isArray(data)) {
        transactions = data;
      } else if (data && typeof data === 'object') {
        if (data.settings) settings = data.settings;
        if (Array.isArray(data.transactions)) transactions = data.transactions;
      }

      // checking the settings format and saving
      if (settings && typeof settings === 'object') {
        const cur = loadSettings();
        saveSettings({ ...cur, ...settings, budget: { ...cur.budget, ...(settings.budget || {}) } });
      }

      // merge transactions, reassign duplicate ids if transactions not empty
      if (Array.isArray(transactions) && transactions.length){
        const cur   = loadTxns();
        const ids   = new Set(cur.map(t => t.id));
        const clean = transactions.map(t => {
          const c = { ...t };
          if (!c.id || ids.has(c.id)) c.id = uid();
          ids.add(c.id);
          return c;
        });
        saveTxns(cur.concat(clean));
        document.dispatchEvent(new CustomEvent('txn:added')); // re-render if you listen for this
      }

      if (msg) msg.textContent = 'Import complete.';
    } catch {
      if (msg) msg.textContent = 'Invalid JSON file.';
    } finally {
      inputEl.value = '';
    }
  };
  reader.readAsText(file);
}

// import my default JSON file for a start 
function importDefaultJSON(){
  const msg = byId('import-msg');
  let ok = false;
  fetch('assets/seed.json')
    .then(r => r.json())
    .then(data => {

      // detect data format and import
      let settings = null, transactions = [];
      if (Array.isArray(data)) transactions = data;
      else { settings = data.settings || null; transactions = Array.isArray(data.transactions) ? data.transactions : []; }

      if (settings) {
        const cur = loadSettings();
        saveSettings({ ...cur, ...settings, budget:{...cur.budget, ...(settings.budget||{})} });
      }
      if (transactions.length){
        const cur = loadTxns();
        const ids = new Set(cur.map(t=>t.id));
        const clean = transactions.map(t=>{ const c={...t}; if(!c.id||ids.has(c.id)) c.id=uid(); ids.add(c.id); return c; });
        saveTxns(cur.concat(clean));
        document.dispatchEvent(new CustomEvent('txn:added'));
      }
      ok = true;
      if (msg) msg.textContent = 'Default data imported.';
    })
    .catch(() => {
      if (!ok && msg) msg.textContent = 'Could not load default data.';
    });
}


const THEME_KEY = 'hugo_theme'; // 'light' | 'dark' | 'system'

  // Apply theme to html and (if system) react to OS change
  function setTheme(mode){
    const value = (mode === 'light' || mode === 'dark') ? mode : 'system';
    localStorage.setItem(THEME_KEY, value);
    applyTheme(value);
  }

function applyTheme(mode){
  const root = document.documentElement;
  if (mode === 'light' || mode === 'dark') root.setAttribute('data-theme', mode);
  else root.removeAttribute('data-theme'); // system mode → CSS handles it
}

  // Init on load
  (function initTheme(){
    const stored = localStorage.getItem(THEME_KEY) || 'system';
    applyTheme(stored);
  })();


//populate the settings form with saved values
export function populateSettingsForm(){
  const s = loadSettings();
  byId('user-name').value              = s.name || '';
  byId('theme-choice').value           = s.theme || 'system';
  byId('warn-over-cap').value          = s.warnOverCap || 'on';
  byId('budget-food').value            = s.budget.food ?? 0;
  byId('budget-books').value           = s.budget.books ?? 0;
  byId('budget-transport').value       = s.budget.transport ?? 0;
  byId('budget-entertainment').value   = s.budget.entertainment ?? 0;
  byId('budget-fees').value            = s.budget.fees ?? 0;
  byId('budget-other').value           = s.budget.other ?? 0;
}

// Call this when the panel is shown (or on DOMContentLoaded)
document.addEventListener('DOMContentLoaded', populateSettingsForm);

function asInt(id){
  const n = Math.round(Number((byId(id)?.value || '').trim()));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function handleSettingsSubmit(e){
  e.preventDefault();

  const next = {
    name: (byId('user-name')?.value || '').trim(),
    theme: (byId('theme-choice')?.value || 'system'),
    warnOverCap: (byId('warn-over-cap')?.value || 'on'),
    budget: {
      food:          asInt('budget-food'),
      books:         asInt('budget-books'),
      transport:     asInt('budget-transport'),
      entertainment: asInt('budget-entertainment'),
      fees:          asInt('budget-fees'),
      other:         asInt('budget-other')
    }
  };

  saveSettings(next);        // save to localStorage
  setTheme(next.theme);      // immediately change UI theme

  // re-populate to reflect new values
  populateSettingsForm();

  const msgEl = byId('settings-msg');
  if (msgEl) msgEl.textContent = 'Settings saved.';
  //updating the ui
  refreshStats();
  return false;
}

function defaults(){
  return {
    name: '',
    theme: 'system',
    warnOverCap: 'on',
    budget: { food:0, books:0, transport:0, entertainment:0, fees:0, other:0 }
  };
}

window.resetSettings = function(){
  const next = defaults();
  saveSettings(next);          // persist default settings
  setTheme(next.theme);        // apply 'system' immediately
  if (typeof populateSettingsForm === 'function') populateSettingsForm(); // refill form UI
  const msgEl = document.getElementById('settings-msg');
  if (msgEl) msgEl.textContent = 'Settings reset.';
  refreshStats();
};

// expose functions to the global scope
window.handleSettingsSubmit = handleSettingsSubmit;

// expose globals to be called by my frontend
window.exportJSON         = exportJSON;
window.importJSONFromFile = importJSONFromFile;
window.importDefaultJSON  = importDefaultJSON;
window.setTheme           = setTheme;
window.populateSettingsForm = populateSettingsForm;
  



