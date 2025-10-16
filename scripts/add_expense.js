// validators functions
import { validateAmount, validateDateNotFuture, validateMinLetters } from './validators.js';

// Functions for conversion, time and messages
import { getRateToRWF, uid, isoNow, showMsg } from './state.js';

// storage
import { loadTxns, saveTxns } from './storage.js';

import { showPanel } from './load_transactions.js';

(function () {
  const FORM_ID = 'expense-form';
  const form = document.getElementById(FORM_ID);
  if (!form) return;

  // inputs
  const amountEl    = document.getElementById('expense-amount');
  const dateEl      = document.getElementById('expense-date');
  const descEl      = document.getElementById('expense-description');
  const currencyEl  = document.getElementById('expense-currency');
  const categoryEl  = document.getElementById('expense-category');

  // wrapper div for "Other categories" and the input itself
  const otherWrap   = document.getElementById('expense-other-wrap');     
  const otherInput  = document.getElementById('expense-category-other'); 

  // errors elements
  const errAmount   = document.getElementById('exp-err-amount');
  const errDate     = document.getElementById('exp-err-date');
  const errDesc     = document.getElementById('exp-err-description');
  const errCategory = document.getElementById('exp-err-category');
  const idEl        = document.getElementById('expense-id'); // hidden input for edit ID

  // max date = today
  const todayStr = new Date().toISOString().slice(0, 10);
  if (dateEl) dateEl.max = todayStr;

  function clearErrors() {
    errAmount && (errAmount.hidden = true);
    errDate && (errDate.hidden = true);
    errDesc && (errDesc.hidden = true);
    errCategory && (errCategory.hidden = true);
  }

  // show/hide "Other" input according to category selection
  function toggleOther() {
    const isOther = categoryEl && categoryEl.value === 'Other';
    if (!otherWrap || !otherInput) return;
    otherWrap.style.display = isOther ? 'block' : 'none';
    otherInput.required = isOther;
    if (!isOther) otherInput.value = '';
  }
  categoryEl && categoryEl.addEventListener('change', toggleOther);
  toggleOther();

  // submit form and save in localStorage
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    const amountRaw  = (amountEl?.value || '').trim();
    const amount     = Number(amountRaw);
    const date       = (dateEl?.value || '');
    const desc       = (descEl?.value || '').trim();
    const currency   = (currencyEl?.value || 'RWF').toUpperCase();
    const catValue   = (categoryEl?.value || '').trim();
    const otherName  = (otherInput?.value || '').trim();
    const editId     = (idEl?.value || '').trim(); //getting the edit ID if any

    let hasError = false;

    if (!validateAmount(amountRaw)) {
      errAmount && (errAmount.hidden = false);
      hasError = true;
    }
    if (!validateDateNotFuture(date)) {
      errDate && (errDate.hidden = false);
      hasError = true;
    }
    if (!validateMinLetters(desc, 5)) {
      errDesc && (errDesc.hidden = false); // "Enter at least 5 letters."
      hasError = true;
    }
    if (!catValue) {
      errCategory && (errCategory.hidden = false);
      hasError = true;
    }
    // if Other selected, require at least 3 letters
    if (catValue === 'Other' && !validateMinLetters(otherName, 3)) {
      errCategory && (errCategory.hidden = false);
      hasError = true;
    }

    //shows error messages in their different element
    if (hasError) {
      return;
    }

    // final category: use the Other text if chosen
    const finalCategory = catValue === 'Other' ? otherName : catValue;

    // convert to amount entered to RWF and build record
    const rate      = getRateToRWF(currency);
    const amountRWF = Number((amount * rate).toFixed(2));
    const now       = isoNow();

    const list = loadTxns();
    let record;

    if (editId) {
      // editing an existing transaction
      const idx = list.findIndex(t => t.id === editId);
      if (idx !== -1) {
        const prev = list[idx];
        record = {
          ...prev,   //copying the already existing record fields
          description: desc,
          amount: amountRWF,
          currency: 'RWF',
          original: { amount: Number(amount.toFixed(2)), currency },
          category: finalCategory,
          type: 'expense',
          date,
          updatedAt: now
        };
        list[idx] = record; // update the list
      } else {
        // if not found (storage cleared), gracefully create new
        record = {
          id: uid(),
          description: desc,
          amount: amountRWF,
          currency: 'RWF',
          original: { amount: Number(amount.toFixed(2)), currency },
          category: finalCategory,
          type: 'expense',
          date,
          createdAt: now,
          updatedAt: now
        };
        list.push(record);
      }
    }
      else {
        record = {
        id: uid(),
        description: desc,
        amount: amountRWF,                 // stored in RWF
        currency: 'RWF',                   // converted currency
        original: { amount: Number(amount.toFixed(2)), currency },
        category: finalCategory,
        type: 'expense',
        date,               // format: YYYY-MM-DD
        createdAt: now,
        updatedAt: now
      };
      list.push(record);
    }
    saveTxns(list);

    showMsg(editId ? 'Expense updated successfully!' : 'Expense recorded successfully!');
    if (!editId) form.reset();
    else showPanel('panel-transactions');

    // restore the UI
    if (dateEl) dateEl.max = todayStr;
    toggleOther();
    amountEl && amountEl.focus();

    // update dashboard with the new transaction
    document.dispatchEvent(new CustomEvent('txn:added', { detail: record }));
    if (editId) {
      idEl.value = ''; // clear edit mode
      document.getElementById('expense-submit').textContent = 'Record expense';
      showPanel('panel-transactions'); // go back to list
    }
    else{
      form.reset();
    }
  });
})();
