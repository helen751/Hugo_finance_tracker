// code for storing and retrieving transactions from localStorage
const KEY_TXNS     = 'hugo_transactions';
const KEY_SETTINGS = 'hugo_settings'; 

export function loadTxns() {
    //using try-catch to handle JSON parsing errors
  try {
    const raw = localStorage.getItem(KEY_TXNS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

//function to save expenses and income transactions to localStorage
export function saveTxns(list) {
  localStorage.setItem(KEY_TXNS, JSON.stringify(list));
}


export function addTxn(txn) {
  const list = loadTxns();
  list.push(txn);
  saveTxns(list);
  return list.length;
}

// load and save settings and transactions
export function loadSettings(){
  try {
    const s = JSON.parse(localStorage.getItem(KEY_SETTINGS) || '{}');
    return {
      name: s.name || '',
      theme: s.theme || 'system',
      warnOverCap: s.warnOverCap || 'on',
      budget: {
        food: s.budget?.food ?? 0,
        books: s.budget?.books ?? 0,
        transport: s.budget?.transport ?? 0,
        entertainment: s.budget?.entertainment ?? 0,
        fees: s.budget?.fees ?? 0,
        other: s.budget?.other ?? 0
      }
    };
  } catch {
    // on error, return my defaults 
    return { name:'', theme:'system', warnOverCap:'on',
      budget:{food:0,books:0,transport:0,entertainment:0,fees:0,other:0} };
  }
}

// save settings
export function saveSettings(s){ 
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(s)); 
}