// scripts/chart_last7d.js
import { loadTxns } from './storage.js';

const SVG_W = 600;  // narrower coordinate space
const SVG_H = 300;  // shorter coordinate space

const M = { t: 40, r: 50, b: 60, l: 70 };
const W = SVG_W - M.l - M.r;
const H = SVG_H - M.t - M.b;

const RWF = n => 'RWF ' + Number(n || 0).toLocaleString('en-RW');

// YYYY-MM-DD from Date
function isoDate(d){
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// Build today…6 days ago buckets
function last7DaysBuckets(){
  const out = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--){
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push({ key: isoDate(d), label: d.toLocaleDateString(undefined, { weekday: 'short' }), total: 0 });
  }
  return out;
}

// Sum EXPENSES by day (amount already in RWF in your app)
function compute7d(){
  const buckets = last7DaysBuckets();
  const index = new Map(buckets.map((b,i)=>[b.key,i]));
  for (const t of loadTxns()){
    if (t.type !== 'expense' || !t.date) continue;
    const i = index.get(t.date);
    if (i === undefined) continue;
    buckets[i].total += Number(t.amount) || 0;
  }
  return buckets;
}

export function renderLast7DaysChart(){
  const svg = document.getElementById('chart');
  if (!svg) return;

  // reset svg
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);

  const data = compute7d();
  const max = Math.max(0, ...data.map(d => d.total));
  const yMax = max > 0 ? Math.ceil(max * 1.15) : 100;

  const barGap = 10;
  const barW = (W - barGap * (data.length - 1)) / data.length;
  const x = i => M.l + i * (barW + barGap);
  const y = v => M.t + (H - (v / yMax) * H);

  const NS = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(NS, 'g');
  svg.appendChild(g);

  // Grid + Y labels
  const gridN = 3;
  for (let i = 0; i <= gridN; i++){
    const gy = M.t + (H / gridN) * i;

    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', M.l);
    line.setAttribute('x2', M.l + W);
    line.setAttribute('y1', gy);
    line.setAttribute('y2', gy);
    line.setAttribute('class', 'chart-grid');
    g.appendChild(line);

    const val = Math.round(yMax * (1 - i / gridN));
    const lab = document.createElementNS(NS, 'text');
    lab.setAttribute('x', M.l - 6);
    lab.setAttribute('y', gy + 4);
    lab.setAttribute('class', 'chart-ylab');
    lab.textContent = val ? val.toLocaleString('en-RW') : '0';
    g.appendChild(lab);
  }

  // Axes
  const axisX = document.createElementNS(NS, 'line');
  axisX.setAttribute('x1', M.l);
  axisX.setAttribute('x2', M.l + W);
  axisX.setAttribute('y1', M.t + H);
  axisX.setAttribute('y2', M.t + H);
  axisX.setAttribute('class', 'chart-axis');
  g.appendChild(axisX);

  const axisY = document.createElementNS(NS, 'line');
  axisY.setAttribute('x1', M.l);
  axisY.setAttribute('x2', M.l);
  axisY.setAttribute('y1', M.t);
  axisY.setAttribute('y2', M.t + H);
  axisY.setAttribute('class', 'chart-axis');
  g.appendChild(axisY);

  // Bars + labels
  data.forEach((d, i) => {
    const h = (d.total / yMax) * H;

    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', x(i));
    rect.setAttribute('y', y(d.total));
    rect.setAttribute('width', Math.max(0, barW));
    rect.setAttribute('height', Math.max(0, h));
    rect.setAttribute('class', 'chart-bar');
    const title = document.createElementNS(NS, 'title');
    title.textContent = `${d.label} • ${RWF(d.total)}`;
    rect.appendChild(title);
    g.appendChild(rect);

    const tx = document.createElementNS(NS, 'text');
    tx.setAttribute('x', x(i) + barW / 2);
    tx.setAttribute('y', M.t + H + 16);
    tx.setAttribute('class', 'chart-xlab');
    tx.textContent = d.label;
    g.appendChild(tx);

    if (d.total > 0){
      const val = document.createElementNS(NS, 'text');
      val.setAttribute('x', x(i) + barW / 2);
      val.setAttribute('y', y(d.total) - 6);
      val.setAttribute('class', 'chart-total');
      val.textContent = Number(d.total).toLocaleString('en-RW');
      g.appendChild(val);
    }
  });
}

// paint + live updates
document.addEventListener('DOMContentLoaded', renderLast7DaysChart);
document.addEventListener('txn:added',   renderLast7DaysChart);
document.addEventListener('txn:deleted', renderLast7DaysChart);
document.addEventListener('txn:updated', renderLast7DaysChart);
