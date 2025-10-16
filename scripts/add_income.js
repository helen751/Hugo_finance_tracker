// validating the form input using validators.js
import { validateAmount, validateDateNotFuture, validateMinLetters } from './validators.js';

// getting exchange rates from state.js
import { getRateToRWF, uid, isoNow, showMsg } from './state.js';
// storing transactions in localStorage
import { loadTxns, saveTxns } from './storage.js';

(function () {
  const KEY_FORM = 'income-form';
  const form = document.getElementById(KEY_FORM);
  if (!form) return;

  const amountEl   = document.getElementById('income-amount');
  const dateEl     = document.getElementById('income-date');
  const sourceEl   = document.getElementById('income-source');
  const currencyEl = document.getElementById('income-currency');
  const errAmount  = document.getElementById('err-amount');
  const errDate    = document.getElementById('err-date');
  const errSource  = document.getElementById('err-source');
  const idEl       = document.getElementById('income-id'); // hidden input for edit ID

  // Max date = today so users don't enter future dates
  const todayStr = new Date().toISOString().slice(0, 10);
  if (dateEl) dateEl.max = todayStr;

  function clearErrors() {
    errAmount && (errAmount.hidden = true);
    errDate && (errDate.hidden = true);
    errSource && (errSource.hidden = true);
  }


    // handle the form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    //getting, trimming and converting the currency value to default RWF
    const amountRaw = amountEl.value.trim();
    const amount = Number(amountRaw);
    const date = dateEl.value;
    const source = sourceEl.value.trim();
    const currency = (currencyEl?.value || 'RWF').toUpperCase();
    const editId    = (idEl?.value || '').trim(); //getting the edit ID if any

    let hasError = false;

    if (!validateAmount(amountRaw)) {
        errAmount.hidden = false;
        hasError = true;
    }
    if (!validateDateNotFuture(date)) {
        errDate.hidden = false;
        hasError = true;
    }
    if (!validateMinLetters(source, 5)) {
        errSource.hidden = false;               // "Source is required." -> update copy to: "Enter at least 5 letters."
        hasError = true;
    }
    if (hasError) {
      showMsg('Please fix the highlighted fields.', false);
      return;
    }

    // convert to RWF using state.js rates
    const rate = getRateToRWF(currency); // e.g., NGN→RWF
    const amountRWF = Number((amount * rate).toFixed(2));

    const now = isoNow();
    const list = loadTxns();
    let record;

     if (editId) {
      // editing an existing transaction
      const idx = list.findIndex(t => t.id === editId);
      if (idx !== -1) {
        const prev = list[idx];
        record = {
          ...prev,    //copying the already existing record fields
          description: source,
          amount: amountRWF,
          currency: 'RWF',
          original: { amount: Number(amount.toFixed(2)), currency },
          category: 'Income',
          type: 'income',
          date,
          updatedAt: now
        };
        list[idx] = record; // update the list
      }

      //create new transaction record if the id to edit was not found
      else{
        // Creating the transaction record
      record = {
        id: uid(),
        description: source,
        amount: amountRWF,     // stored as RWF
        currency: 'RWF',       // converted currency
        original: {            // keep the original for reference
          amount: Number(amount.toFixed(2)),
          currency
        },
        category: 'Income',
        type: 'income',
        date,                  // format: YYYY-MM-DD
        createdAt: now,
        updatedAt: now
      };
      list.push(record);
    }
    } else {
      // Creating the transaction record
      record = {
        id: uid(),
        description: source,
        amount: amountRWF,     // stored as RWF
        currency: 'RWF',       // converted currency
        original: {            // keep the original for reference
          amount: Number(amount.toFixed(2)),
          currency
        },
        category: 'Income',
        type: 'income',
        date,                  // format: YYYY-MM-DD
        createdAt: now,
        updatedAt: now
    }
    list.push(record);
    }

    // Save to localStorage using storage.js
    saveTxns(list);

    showMsg(editId ? 'Income updated successfully!' : 'Income recorded successfully!');
    dateEl.max = todayStr;

    // update the dashboard with new txn using a custom event
    document.dispatchEvent(new CustomEvent('txn:added', { detail: record }));
    if (!editId) form.reset();
    else {
      idEl.value = '';          // clear edit mode
      document.getElementById('income-submit').textContent = 'Record income';
      showPanel('panel-transactions');     // go back to list
    }
  });
})();
