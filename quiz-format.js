"use strict";
/* Gemeinsame Funktionen für Spiel (index.html) und Editor (editor.html):
   YAML lesen, Quiz prüfen, Quiz-Liste laden, Daten zwischen den Seiten übergeben. */

const QUIZ_TYPES = ['normal', 'risiko', 'joker'];
const PLAY_TRANSFER_KEY = 'grosser-preis-zum-spiel';
const EDIT_TRANSFER_KEY = 'grosser-preis-zum-editor';

/* YAML-Text einlesen. Wirft bei Syntaxfehlern eine Liste verständlicher Meldungen. */
function parseYamlText(text) {
  try {
    return jsyaml.load(text);
  } catch (e) {
    const line = e.mark ? ` in Zeile ${e.mark.line + 1}` : '';
    throw [`Die Datei ist kein gültiges YAML${line}. Häufige Ursachen: falsche Einrückung, Tabulator statt Leerzeichen, ein Doppelpunkt im Text ohne Anführungszeichen.`, e.reason || e.message];
  }
}

/* Quiz prüfen und vereinheitlichen. Wirft eine Liste von Fehlermeldungen. */
function normalizeQuiz(raw, basis) {
  const errs = [];
  if (!raw || typeof raw !== 'object') throw ['Die Datei ist leer oder hat nicht das erwartete Format.'];
  const kats = raw.kategorien;
  if (!Array.isArray(kats) || !kats.length) throw ['Es fehlt die Liste „kategorien:“ oder sie ist leer.'];
  const has = v => v != null && String(v).trim() !== '';
  const out = { titel: has(raw.titel) ? String(raw.titel) : 'Der große Preis', basis, kategorien: [] };

  kats.forEach((k, ki) => {
    const kn = k && has(k.name) ? String(k.name) : null;
    const where = `Kategorie ${ki + 1}${kn ? ` („${kn}“)` : ''}`;
    if (!k || typeof k !== 'object') { errs.push(`${where}: ist keine gültige Kategorie (fehlt „- name:“?).`); return; }
    if (!kn) errs.push(`${where}: „name:“ fehlt.`);
    if (!Array.isArray(k.fragen) || !k.fragen.length) { errs.push(`${where}: „fragen:“ fehlt oder ist leer.`); return; }
    const fragen = [];
    k.fragen.forEach((f, fi) => {
      const w = `${where}, Frage ${fi + 1}`;
      if (!f || typeof f !== 'object') { errs.push(`${w}: ist keine gültige Frage (fehlt das „- “ vor „punkte:“?).`); return; }
      const typ = String(f.typ ?? 'normal').trim().toLowerCase();
      if (!QUIZ_TYPES.includes(typ)) errs.push(`${w}: unbekannter typ „${f.typ}“ (erlaubt: normal, risiko, joker).`);
      const p = Number(f.punkte);
      if (!Number.isFinite(p) || p <= 0) errs.push(`${w}: „punkte:“ fehlt oder ist keine positive Zahl.`);
      if (typ !== 'joker') {
        if (!has(f.frage) && !has(f.bild)) errs.push(`${w}: „frage:“ fehlt.`);
        if (!has(f.antwort) && !has(f.antwort_bild)) errs.push(`${w}: „antwort:“ fehlt.`);
      }
      fragen.push({
        punkte: p, typ,
        frage: has(f.frage) ? String(f.frage) : '',
        antwort: has(f.antwort) ? String(f.antwort) : '',
        bild: has(f.bild) ? String(f.bild) : null,
        antwort_bild: has(f.antwort_bild) ? String(f.antwort_bild) : null,
      });
    });
    out.kategorien.push({ name: kn || `Kategorie ${ki + 1}`, fragen });
  });
  if (errs.length) throw errs;
  return out;
}

/* Liste der Quizze aus quizze.yaml (nur bei Aufruf über eine Webadresse verfügbar). */
async function fetchQuizList() {
  try {
    const r = await fetch('quizze.yaml', { cache: 'no-store' });
    if (!r.ok) return [];
    const idx = jsyaml.load(await r.text());
    return ((idx && Array.isArray(idx.quizze)) ? idx.quizze : []).filter(q => q && q.datei);
  } catch (e) {
    return [];
  }
}

async function fetchQuizText(datei) {
  const url = new URL(datei, location.href).href;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { text: await res.text(), basis: url };
}

/* Übergabe zwischen Spiel und Editor über den Browser-Speicher (wird einmalig gelesen). */
function putTransfer(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); return true; } catch (e) { return false; }
}
function takeTransfer(key) {
  try {
    const d = JSON.parse(localStorage.getItem(key));
    localStorage.removeItem(key);
    return d;
  } catch (e) {
    return null;
  }
}
