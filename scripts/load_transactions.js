//storage.js
import { loadTxns, saveTxns } from './storage.js';
import { refreshStats } from './dashboard-ui.js';

const cardsWrap = document.getElementById('txns-cards');
const tbody     = document.getElementById('txns-tbody');
const statusEl  = document.getElementById('txns-title');

// sorting the most recent first
function sortByCreatedAtDesc(a, b){
  return (b.createdAt || '').localeCompare(a.createdAt || '');
}

/**
 * documenting parameter to be used when calling the view function
 * @param {'income'|'expense'|'all'} view
 */

window.searchQuery = '';

const searchInput = document.getElementById('txns-query');
searchInput?.addEventListener('input', () => {
  window.searchQuery = searchInput.value.trim();

  // re-render same type of view the user is on
  viewTransactions(window.currentView || 'all');
});

// Escape user text so special regex chars are treated literally
function escapeRegex(s){
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// main function to show transactions
export function viewTransactions(view = 'all'){
  const all = loadTxns();

  // filter records by type
  let list = all
    .filter(txn => view === 'all' ? true : txn.type === view);

    // filter by search query if any
    const q = (window.searchQuery || '').trim();
    if (q){
        const rx = new RegExp(escapeRegex(q), 'i'); // treat input as plain text
        list = list.filter(txn => {
        const hay = [
            txn.description || '',
            txn.category || '',
            txn.type || '',
            txn.date || '',
            String(txn.amount ?? '')
        ].join(' ');
        return rx.test(hay);
        });
    }
    list = list.sort(sortByCreatedAtDesc);
    
    //exporting the last rendered transactions for CSV export
    window._lastRenderedTxns = list;

  // Adding a count status at the top
  const labels = { all: 'All', income: 'Income', expense: 'Expenses' };
  statusEl.innerHTML = `${labels[view]} Transactions: ${list.length}`;

  // Clearing existing cards and table rows
  cardsWrap.innerHTML = '';
  tbody.innerHTML = '';

  // show all transactions in a card on mobile
  list.forEach(txn => {
    const card = document.createElement('article');
    card.className = 'txn-card';
    card.innerHTML = `
      <header>
        <span class="txn-type">${txn.type === 'income' ? 'Income' : 'Expense'}</span>
        <span class="txn-amount">RWF ${Number(txn.amount).toLocaleString()}</span>
      </header>
      <div class="txn-meta">
        <span>${txn.category}</span>
        <span>•</span>
        <time datetime="${txn.date}">${txn.date}</time>
      </div>
      <p class="txn-desc">${escapeHtml(txn.description || '')}</p>
      <div class="txn-actions">
        <button class="icon-btn" data-id="${txn.id}" aria-label="Edit" onclick="editTxn(this.dataset.id)">
        <img src="assets/icons/edit.svg" alt="" width="18" height="18">
        </button>
        <button class="icon-btn" data-id="${txn.id}" aria-label="Delete" onclick="deleteTxn(this.dataset.id)">
        <img src="assets/icons/delete.svg" alt="" width="18" height="18">
        </button>
        </div>
    `;
    cardsWrap.appendChild(card);
  });

  // show all transactions in a table on desktop
  list.forEach(txn => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${txn.type === 'income' ? 'Income' : 'Expense'}</td>
      <td>${escapeHtml(txn.description || '')}</td>
      <td>${escapeHtml(txn.category || '')}</td>
      <td><time datetime="${txn.date}">${txn.date}</time></td>
      <td>RWF ${Number(txn.amount).toLocaleString()}</td>
      <td class="txn-actions-td">
    <button class="icon-btn" data-id="${txn.id}" aria-label="Edit" onclick="editTxn(this.dataset.id)">
          <img src="assets/icons/edit.svg" alt="" width="18" height="18">
        </button>
        <button class="icon-btn" data-id="${txn.id}" aria-label="Delete" onclick="deleteTxn(this.dataset.id)">
          <img src="assets/icons/delete.svg" alt="" width="18" height="18">
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  showPanel('panel-transactions');
}

// removing special characters before displaying in HTML
function escapeHtml(s){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

// update the view when a transaction is added, deleted, or updated
document.addEventListener('txn:added',   () => {viewTransactions(window.currentView); refreshStats()});
document.addEventListener('txn:deleted', () => {viewTransactions(window.currentView); refreshStats()});
document.addEventListener('txn:updated', () => {viewTransactions(window.currentView); refreshStats()});

// function to get a transaction by id
function getTxnById(id){
  const list = loadTxns();
  return list.find(t => t.id === id) || null;
}

// function to delete a transaction by id
function deleteTxnById(id){
  const list = loadTxns();
  const next = list.filter(t => t.id !== id);
  saveTxns(next);
  // updating the view after deletion
  document.dispatchEvent(new CustomEvent('txn:deleted', { detail: { id } }));
}

// show a panel depending on the edit requested.
export function showPanel(panelId){
  // hide all panels except the one we want
  document.querySelectorAll('main section[id^="panel-"]').forEach(sec => {
    sec.style.display = (sec.id === panelId) ? 'block' : 'none';
  });

  // move focus to the shown panel for accessibility
  const sec = document.getElementById(panelId);
  if (sec && typeof sec.focus === 'function') sec.focus();
}

// Prefill Income form during edit
function fillIncomeForm(txn){
  const form = document.getElementById('income-form');
  if (!form) return;

  // show the existing values entered by the user
  document.getElementById('income-id').value = txn.id;
  document.getElementById('income-submit').textContent = 'Update income';
  document.getElementById('income-amount').value = txn.original?.amount ?? txn.amount; 
  document.getElementById('income-currency').value = (txn.original?.currency || 'RWF').toUpperCase();
  document.getElementById('income-date').value = txn.date || '';
  document.getElementById('income-source').value = txn.description || '';
  showPanel('panel-add-income');
}

// Prefill Expense form
function fillExpenseForm(txn){
  const form = document.getElementById('expense-form');
  if (!form) return;

  // show the existing values entered by the user
  document.getElementById('expense-id').value = txn.id;
  document.getElementById('expense-submit').textContent = 'Update expense';
  document.getElementById('expense-amount').value = txn.original?.amount ?? txn.amount;
  document.getElementById('expense-currency').value = (txn.original?.currency || 'RWF').toUpperCase();
  document.getElementById('expense-date').value = txn.date || '';
  document.getElementById('expense-description').value = txn.description || '';

  // prefill category or Other
  const categories = ['Food','Books','Transport','Entertainment','Fees','Income','Other'];
  const catSel = document.getElementById('expense-category');
  const otherWrap = document.getElementById('expense-other-wrap');
  const otherInput = document.getElementById('expense-category-other');

  const cat = txn.category || 'Other';
  if (categories.includes(cat)){
    catSel.value = cat === 'Income' ? 'Other' : cat; // fall back to Other if Income
  } else {
    catSel.value = 'Other';
  }

  // toggle "Other" field if it was selected before
  const isOther = catSel.value === 'Other';
  otherWrap.style.display = isOther ? 'block' : 'none';
  otherInput.required = isOther;
  otherInput.value = isOther ? cat : '';

  showPanel('panel-add-expense');
}

// Handle edit and delete actions on button clicks
window.editTxn = function(id){
  const txn = getTxnById(id);
  if (!txn) return;
  txn.type === 'income' ? fillIncomeForm(txn) : fillExpenseForm(txn);
};

window.deleteTxn = function(id){
  if (!confirm('Are you sure you want to delete this transaction?')) return;
  deleteTxnById(id);
  viewTransactions(window.currentView || 'all');
};

// minimal CSV export of whatever is currently rendered
window.exportTxnsCSV = function () {
  const list = window._lastRenderedTxns || [];
  if (!list.length) { alert('No transactions to export.'); return; }

  // simple CSV cell escape
  const esc = s => {
    const v = (s ?? '').toString();
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };

  const header = [
    'id','type','category','description',
    'amount_RWF','currency','original_amount','original_currency',
    'date','createdAt','updatedAt'
  ];

  const rows = list.map(t => [
    t.id, t.type, t.category, t.description,
    (Number(t.amount ?? 0)).toFixed(2), 'RWF',
    (Number(t.original?.amount ?? 0)).toFixed(2),
    (t.original?.currency || 'RWF'),
    t.date || '', t.createdAt || '', t.updatedAt || ''
  ]);

  const csv = '\uFEFF' + [header, ...rows].map(r => r.map(esc).join(',')).join('\n');

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  a.download = `transactions-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

