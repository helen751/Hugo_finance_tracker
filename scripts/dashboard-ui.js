import { loadTxns, loadSettings } from './storage.js';
// function to toggle the dashboard side bar on mobile
(() => {
    const btn     = document.querySelector('.dashboard-nav-toggle');
    const sidebar = document.getElementById('sidebar');
    if (!btn || !sidebar) return;

    function openNav(){
      sidebar.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-open');
    }
    function closeNav(){
      sidebar.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    }
    function isOpen(){ return sidebar.classList.contains('is-open'); }

    // Toggle on click
    btn.addEventListener('click', () => isOpen() ? closeNav() : openNav());

    // Close on outside click (mobile only)
    document.addEventListener('click', (e) => {
      const isMobile = matchMedia('(max-width: 991.98px)').matches;
      if (!isMobile) return;
      if (btn.contains(e.target) || sidebar.contains(e.target)) return;
      if (isOpen()) closeNav();
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) closeNav();
    });

    // Optional: close if viewport grows to desktop while open
    matchMedia('(min-width: 992px)').addEventListener?.('change', m => {
      if (m.matches) closeNav();
    });
  })();


//rendering the dashboard statistics
    function isInSameMonth(isoDate, ref = new Date()){
    if (!isoDate) return false;
    const d = new Date(isoDate + 'T00:00:00');
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
    }
  const RWF = n => 'RWF ' + Number(n || 0).toLocaleString('en-RW');

  // Map free-text txn categories to settings keys
  function mapTxnCategoryToKey(txnCat, settingsKeys){
    if (!txnCat) return null;
    const name = String(txnCat).trim().toLowerCase();

    // exact key match (e.g., 'food', 'transport', etc.)
    if (settingsKeys.has(name)) return name;

    // aliases for my categories
    const alias = {
      misc: 'other',
      miscellaneous: 'other',
      fee: 'fees',
      book: 'books',
      transport: 'transport',
      entertainment: 'entertainment',
      food: 'food'
    };
    if (alias[name] && settingsKeys.has(alias[name])) return alias[name];

    // return null
    return null;
  }

/* --------------- aggregations --------------- */

function aggregateMonth(){
  const txns = loadTxns();
  const now = new Date();

  let income = 0;
  let expense = 0;
  const byCategory = {}; 

  for (const t of txns){
    if (!isInSameMonth(t.date, now)) continue;
    const amt = Number(t.amount) || 0;

    if (t.type === 'income') {
      income += amt;
    } else if (t.type === 'expense') {
      expense += amt;
      const label = t.category || 'Other';
      byCategory[label] = (byCategory[label] || 0) + amt;
    }
  }

  // Top expense category
  let topCat = '—', topVal = 0;
  for (const [label, val] of Object.entries(byCategory)){
    if (val > topVal){ topVal = val; topCat = label; }
  }

  // Health score (simple savings rate)
  let health = 70;
  if (income > 0){
    const ratio = (income - expense) / income; // savings rate
    health = Math.max(0, Math.min(100, Math.round(50 + ratio * 50)));
  } else if (expense > 0){
    health = 10;
  }

  return { income, expense, topCat, health };
}

/* showing statistics cards*/

export function renderStatCards(){
  const { income, expense, topCat, health } = aggregateMonth();

  const incomeOut   = document.getElementById('statIncome');
  const expenseOut  = document.getElementById('statExpenses');
  const topCatEl    = document.getElementById('topExpenseCategory');
  const healthMeter = document.getElementById('healthMeter');
  const healthScore = document.getElementById('healthScore');
  const periodEl    = document.getElementById('statPeriod');

  if (incomeOut)   incomeOut.textContent   = RWF(income);
  if (expenseOut)  expenseOut.textContent  = RWF(expense);
  if (topCatEl)    topCatEl.textContent    = topCat;
  if (periodEl)    periodEl.textContent    = 'This month';
  if (healthMeter) healthMeter.value       = Number(health);
  if (healthScore) healthScore.textContent = String(health);
}

/* showing the budget progress */

export function renderBudgetProgress(){
  const settings = loadSettings();
  const budgetObj = (settings && settings.budget) || {};
  const listEl = document.getElementById('budgetList');
  if (!listEl) return;

  // Gather current month spend per settings key
  const keys = Object.keys(budgetObj);
  const keySet = new Set(keys.map(k => String(k).toLowerCase()));
  const spentByKey = Object.fromEntries(keys.map(k => [k, 0]));

  const txns = loadTxns();
  const now = new Date();

  for (const t of txns){
    if (t.type !== 'expense') continue;
    if (!isInSameMonth(t.date, now)) continue;

    const key = mapTxnCategoryToKey(t.category, keySet);
    if (key && spentByKey.hasOwnProperty(key)){
      spentByKey[key] += Number(t.amount) || 0;
    } else if (spentByKey.hasOwnProperty('other')){
      // bucket unknown categories into 'other' if it exists
      spentByKey.other += Number(t.amount) || 0;
    }
  }

  // Render: clear and rebuild entire list
  listEl.innerHTML = '';

  for (const key of keys){
    const uiLabel = key.charAt(0).toUpperCase() + key.slice(1); // title-case from key
    const cap  = Number(budgetObj[key] || 0);
    const used = Number(spentByKey[key] || 0);
    const pct  = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;
    const left = Math.max(0, cap - used);

    // Card markup
    const li = document.createElement('li');
    li.innerHTML = `
      <article class="budget-item" aria-labelledby="b-${key}-title" aria-describedby="b-${key}-desc">
        <header class="budget-head">
          <h4 id="b-${key}-title">${uiLabel}</h4>
          <p class="budget-amount">
            <output>${RWF(used)}</output>
            <span aria-hidden="true"> / </span>
            <span class="budget-cap">
              <span class="sr-only">of </span><output>${RWF(cap)}</output>
            </span>
          </p>
        </header>

        <meter min="0" max="100" value="${pct}"
               aria-label="${uiLabel} budget used in percent">
          ${pct}%
        </meter>

        <p id="b-${key}-desc" class="budget-note">
          <output>${pct}</output>% used · <span>${RWF(left)}</span> left
        </p>
      </article>
    `;
    listEl.appendChild(li);
  }
}

// live updates

export function refreshStats(){
  renderStatCards();
  renderBudgetProgress();
}

document.addEventListener('DOMContentLoaded', refreshStats);
document.addEventListener('txn:added',   refreshStats);
document.addEventListener('txn:deleted', refreshStats);
document.addEventListener('txn:updated', refreshStats);