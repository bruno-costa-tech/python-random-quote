const MAX_SCORE = 35 + 30 + 20 + 25 + 15 + 10 + 25; // 160

export function calcScore(fields) {
  let pts = 0;
  const signals = [];

  const fl = parseFloat(fields.float);
  if (!isNaN(fl)) {
    if (fl < 2)       { pts += 35; signals.push({ label: 'Float micro (<2M)',   pts: 35 }); }
    else if (fl < 5)  { pts += 25; signals.push({ label: 'Float pequeno (<5M)', pts: 25 }); }
    else if (fl < 20) { pts += 15; signals.push({ label: 'Float reduzido (<20M)', pts: 15 }); }
  }

  const sh = parseFloat(fields.short);
  if (!isNaN(sh)) {
    if (sh >= 30)      { pts += 30; signals.push({ label: 'Short extremo (≥30%)',   pts: 30 }); }
    else if (sh >= 20) { pts += 20; signals.push({ label: 'Short alto (≥20%)',      pts: 20 }); }
    else if (sh >= 10) { pts += 10; signals.push({ label: 'Short moderado (≥10%)',  pts: 10 }); }
  }

  const dtc = parseFloat(fields.dtc);
  if (!isNaN(dtc)) {
    if (dtc >= 10)     { pts += 20; signals.push({ label: 'DTC crítico (≥10d)',     pts: 20 }); }
    else if (dtc >= 5) { pts += 12; signals.push({ label: 'DTC alto (≥5d)',         pts: 12 }); }
    else if (dtc >= 2) { pts +=  5; signals.push({ label: 'DTC moderado (≥2d)',     pts:  5 }); }
  }

  const rv = parseFloat(fields.relvol);
  if (!isNaN(rv)) {
    if (rv >= 5)      { pts += 25; signals.push({ label: 'RelVol explosivo (≥5x)',  pts: 25 }); }
    else if (rv >= 3) { pts += 18; signals.push({ label: 'RelVol forte (≥3x)',      pts: 18 }); }
    else if (rv >= 2) { pts += 10; signals.push({ label: 'RelVol elevado (≥2x)',    pts: 10 }); }
  }

  const pm = parseFloat(fields.premkt);
  if (!isNaN(pm) && pm > 0) {
    if (pm >= 5)      { pts += 15; signals.push({ label: 'Premarket forte (≥5M)',   pts: 15 }); }
    else if (pm >= 1) { pts +=  8; signals.push({ label: 'Premarket activo (≥1M)',  pts:  8 }); }
  }

  const inst = parseFloat(fields.inst);
  if (!isNaN(inst)) {
    if (inst < 5)       { pts += 10; signals.push({ label: 'Inst próprio mínimo (<5%)', pts: 10 }); }
    else if (inst < 20) { pts +=  5; signals.push({ label: 'Inst baixo (<20%)',         pts:  5 }); }
  }

  const catPts = { none: 0, news: 15, earnings: 18, fda: 25, contract: 12, squeeze: 8 };
  const cat = fields.catalyst || 'none';
  const cp = catPts[cat] || 0;
  if (cp > 0) signals.push({ label: `Catalisador: ${cat} (+${cp}pts)`, pts: cp });
  pts += cp;

  const score = Math.min(100, Math.round((pts / MAX_SCORE) * 100));
  return { score, signals, rawPts: pts };
}

export function scoreTier(score) {
  if (score >= 75) return { label: 'ALTO RISCO DE EXPLOSÃO', color: '#e24b4a' };
  if (score >= 55) return { label: 'SETUP INTERESSANTE',     color: '#ef9f27' };
  if (score >= 35) return { label: 'POTENCIAL MODERADO',     color: '#639922' };
  return             { label: 'SETUP FRACO',                 color: '#444466' };
}
