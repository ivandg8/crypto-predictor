(() => {
  const $a = id => document.getElementById(id);
  const fmtA = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });

  function atr(a, n = 14) {
    if (a.length < n + 1) return 0;
    const tr = [];
    for (let i = a.length - n; i < a.length; i++) {
      const prev = a[i - 1].c;
      tr.push(Math.max(a[i].h - a[i].l, Math.abs(a[i].h - prev), Math.abs(a[i].l - prev)));
    }
    return tr.reduce((s, x) => s + x, 0) / tr.length;
  }

  function macd(a, fast = 12, slow = 26, signalN = 9) {
    if (a.length < slow + signalN) return { line: 0, signal: 0, hist: 0 };
    const closes = a.map(x => x.c);
    const emaN = (arr, n) => {
      const k = 2 / (n + 1); let v = arr[0];
      for (let i = 1; i < arr.length; i++) v = arr[i] * k + v * (1 - k);
      return v;
    };
    const lines = [];
    for (let i = slow - 1; i < closes.length; i++) {
      const f = emaN(closes.slice(0, i + 1), fast);
      const s = emaN(closes.slice(0, i + 1), slow);
      lines.push(f - s);
    }
    const line = lines.at(-1);
    const signal = emaN(lines, signalN);
    return { line, signal, hist: line - signal };
  }

  function bollinger(a, n = 20, mult = 2) {
    if (a.length < n) return { mid: 0, upper: 0, lower: 0, pctB: 0 };
    const x = a.slice(-n).map(v => v.c);
    const mid = x.reduce((s, v) => s + v, 0) / n;
    const sd = Math.sqrt(x.reduce((s, v) => s + (v - mid) ** 2, 0) / n);
    const upper = mid + mult * sd, lower = mid - mult * sd, last = x.at(-1);
    return { mid, upper, lower, pctB: (last - lower) / ((upper - lower) || 1) };
  }

  function adx(a, n = 14) {
    if (a.length < n * 2 + 1) return 0;
    const trs = [], plus = [], minus = [];
    for (let i = 1; i < a.length; i++) {
      const up = a[i].h - a[i - 1].h, down = a[i - 1].l - a[i].l;
      trs.push(Math.max(a[i].h - a[i].l, Math.abs(a[i].h - a[i - 1].c), Math.abs(a[i].l - a[i - 1].c)));
      plus.push(up > down && up > 0 ? up : 0);
      minus.push(down > up && down > 0 ? down : 0);
    }
    const dx = [];
    for (let i = n; i < trs.length; i++) {
      const tr = trs.slice(i - n + 1, i + 1).reduce((s, v) => s + v, 0) || 1;
      const p = plus.slice(i - n + 1, i + 1).reduce((s, v) => s + v, 0) / tr * 100;
      const m = minus.slice(i - n + 1, i + 1).reduce((s, v) => s + v, 0) / tr * 100;
      dx.push(Math.abs(p - m) / ((p + m) || 1) * 100);
    }
    return dx.slice(-n).reduce((s, v) => s + v, 0) / Math.min(n, dx.length);
  }

  function candlePattern(a) {
    const x = a.at(-1), p = a.at(-2); if (!x || !p) return 'Sin patrón';
    const body = Math.abs(x.c - x.o), range = Math.max(x.h - x.l, 1e-9);
    if (body / range < 0.2) return 'Indecisión / doji';
    if (x.c > x.o && p.c < p.o && x.c >= p.o && x.o <= p.c) return 'Envolvente alcista';
    if (x.c < x.o && p.c > p.o && x.o >= p.c && x.c <= p.o) return 'Envolvente bajista';
    if (x.c > x.o && (x.o - x.l) > body * 1.8) return 'Martillo alcista';
    if (x.c < x.o && (x.h - x.o) > body * 1.8) return 'Rechazo bajista';
    return x.c > x.o ? 'Vela alcista' : 'Vela bajista';
  }

  function updateAdvanced() {
    if (!Array.isArray(candles) || candles.length < 40) return;
    const a = candles.slice(0, -1), last = a.at(-1), e9 = ema(a, 9), e21 = ema(a, 21);
    const rs = rsi(a), aVal = atr(a), m = macd(a), b = bollinger(a), ad = adx(a), pattern = candlePattern(a);
    const trend = e9 > e21 ? 'ALCISTA' : 'BAJISTA';
    const macdDir = m.hist > 0 ? 'ALCISTA' : 'BAJISTA';
    const bbPos = b.pctB > .8 ? 'zona alta' : b.pctB < .2 ? 'zona baja' : 'zona media';
    let score = 0;
    score += e9 > e21 ? 1 : -1;
    score += m.hist > 0 ? 1 : -1;
    score += rs > 55 ? .7 : rs < 45 ? -.7 : 0;
    score += ad >= 25 ? (e9 > e21 ? .7 : -.7) : 0;
    score += b.pctB < .15 ? .4 : b.pctB > .85 ? -.4 : 0;
    score += /alcista|Martillo/i.test(pattern) ? .4 : /bajista|Rechazo/i.test(pattern) ? -.4 : 0;
    const confirmation = score >= 1.6 ? 'CONFIRMA SUBIDA' : score <= -1.6 ? 'CONFIRMA BAJADA' : 'SIN CONFIRMACIÓN';
    let panel = $a('advancedPanel');
    if (!panel) {
      panel = document.createElement('section'); panel.id = 'advancedPanel'; panel.className = 'panel';
      const anchor = document.querySelector('.panel h2')?.closest('.panel');
      (anchor?.parentNode || document.querySelector('main')).insertBefore(panel, anchor || null);
    }
    panel.innerHTML = `<div class="title"><div><h2>🔬 Análisis técnico avanzado</h2><small>Confirmación adicional; todavía no sustituye al modelo base</small></div><small>${intervalInfo?.().label || 'intervalo'}</small></div>
      <div class="grid indicators">
        <article><span>MACD</span><b>${fmtA(m.line)}</b><small>${macdDir} · hist ${fmtA(m.hist)}</small></article>
        <article><span>ADX (14)</span><b>${ad.toFixed(1)}</b><small>${ad >= 25 ? 'Tendencia con fuerza' : 'Tendencia débil'}</small></article>
        <article><span>ATR (14)</span><b>${fmtA(aVal)}</b><small>Volatilidad absoluta</small></article>
        <article><span>Bollinger %B</span><b>${(b.pctB * 100).toFixed(1)}%</b><small>${bbPos}</small></article>
      </div>
      <div class="grid two">
        <article><h3>Confirmación</h3><b>${confirmation}</b><p>Tendencia EMA9/21: ${trend}. RSI: ${rs.toFixed(1)}. Patrón: ${pattern}.</p></article>
        <article><h3>Puntaje avanzado</h3><b>${score.toFixed(2)}</b><p>Combina tendencia, MACD, RSI, ADX, Bollinger y patrón de vela.</p></article>
      </div>
      <p class="warning">⚠️ Estos indicadores se muestran como capa de confirmación. Primero los vamos a validar con backtest para evitar ajustar el modelo a datos pasados.</p>`;
  }

  setTimeout(updateAdvanced, 1200);
  setInterval(updateAdvanced, 10000);
})();