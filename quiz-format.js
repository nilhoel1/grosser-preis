"use strict";
/* Gemeinsame Funktionen für Spiel (index.html) und Editor (editor.html):
   YAML lesen, Quiz prüfen, Quiz-Pakete (ZIP) lesen und schreiben, Medien prüfen,
   Daten zwischen den Seiten übergeben. */

const QUIZ_TYPES = ['normal', 'risiko', 'joker'];
const MEDIA_FIELDS = [
  { key: 'bild', label: 'Bild zur Frage', kind: 'bild' },
  { key: 'antwort_bild', label: 'Bild zur Antwort', kind: 'bild' },
  { key: 'audio', label: 'Audio zur Frage', kind: 'audio' },
];
const PLAY_TRANSFER_KEY = 'grosser-preis-zum-spiel';
const EDIT_TRANSFER_KEY = 'grosser-preis-zum-editor';
const PACKAGE_YAML_NAME = 'quiz.yaml';

const isBlank = v => v == null || String(v).trim() === '';

/* ===================== YAML und Prüfung ===================== */

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
function normalizeQuiz(raw) {
  const errs = [];
  if (!raw || typeof raw !== 'object') throw ['Die Datei ist leer oder hat nicht das erwartete Format.'];
  const kats = raw.kategorien;
  if (!Array.isArray(kats) || !kats.length) throw ['Es fehlt die Liste „kategorien:“ oder sie ist leer.'];
  const has = v => !isBlank(v);
  const out = { titel: has(raw.titel) ? String(raw.titel) : 'Der große Preis', kategorien: [] };

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
        if (!has(f.frage) && !has(f.bild) && !has(f.audio)) errs.push(`${w}: „frage:“ fehlt.`);
        if (!has(f.antwort) && !has(f.antwort_bild)) errs.push(`${w}: „antwort:“ fehlt.`);
      }
      const q = {
        punkte: p, typ,
        frage: has(f.frage) ? String(f.frage) : '',
        antwort: has(f.antwort) ? String(f.antwort) : '',
      };
      for (const m of MEDIA_FIELDS) q[m.key] = has(f[m.key]) ? String(f[m.key]).trim() : null;
      fragen.push(q);
    });
    out.kategorien.push({ name: kn || `Kategorie ${ki + 1}`, fragen });
  });
  if (errs.length) throw errs;
  return out;
}

/* ===================== Quiz-Pakete (ZIP mit YAML und Medien) ===================== */

/* Ein Paket ist { text: YAML-Text, files: Map<Pfad, Blob> }. Eine reine YAML-Datei ist ein Paket ohne Medien. */

const normPath = p => String(p || '').trim().replace(/\\/g, '/').replace(/^(\.\/)+/, '').replace(/^\/+/, '');

const MIME_BY_EXT = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4', aac: 'audio/aac',
};
const extOf = name => (String(name).toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';
const mimeOf = name => MIME_BY_EXT[extOf(name)] || 'application/octet-stream';
const isYamlName = name => /\.ya?ml$/i.test(name);

async function isZipFile(file) {
  if (/\.zip$/i.test(file.name || '')) return true;
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  return head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04;
}

/* Datei (YAML oder ZIP) einlesen. Wirft eine Liste von Fehlermeldungen. */
async function readQuizFile(file) {
  if (!(await isZipFile(file))) return { text: await file.text(), files: new Map() };
  let zip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch (e) {
    throw ['Die ZIP-Datei konnte nicht geöffnet werden. Ist sie beschädigt?'];
  }
  const entries = Object.values(zip.files).filter(f => !f.dir && !/(^|\/)(__MACOSX\/|\._|\.DS_Store$)/.test(f.name));
  const yamls = entries.filter(f => isYamlName(f.name))
    .sort((a, b) => (a.name.split('/').length - b.name.split('/').length) || (b.name.endsWith(PACKAGE_YAML_NAME) - a.name.endsWith(PACKAGE_YAML_NAME)));
  if (!yamls.length) throw ['Im ZIP-Paket ist keine YAML-Datei mit den Fragen.'];
  const main = yamls[0];
  // Liegt die YAML in einem Unterordner, gelten die Pfade relativ zu diesem Ordner.
  const base = main.name.includes('/') ? main.name.slice(0, main.name.lastIndexOf('/') + 1) : '';
  const files = new Map();
  for (const f of entries) {
    if (f === main || !f.name.startsWith(base)) continue;
    const blob = await f.async('blob');
    files.set(normPath(f.name.slice(base.length)), new Blob([blob], { type: mimeOf(f.name) }));
  }
  return { text: await main.async('string'), files };
}

/* Paket als ZIP-Datei erzeugen. */
async function buildQuizZip(text, files) {
  const zip = new JSZip();
  zip.file(PACKAGE_YAML_NAME, text);
  for (const [path, blob] of files) zip.file(path, blob);
  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
}

/* Alle Medienpfade eines Quiz (geprüft oder als Rohdaten). */
function mediaRefs(quiz) {
  const refs = [];
  (quiz.kategorien || []).forEach((k, ki) => (k.fragen || []).forEach((f, fi) => {
    if (!f || f.typ === 'joker') return;
    for (const m of MEDIA_FIELDS) {
      if (!isBlank(f[m.key])) refs.push({ ki, fi, key: m.key, kind: m.kind, label: m.label, path: String(f[m.key]).trim(), kat: k.name });
    }
  }));
  return refs;
}

/* ===================== Medien auflösen und prüfen ===================== */

/* Liefert zu einem Pfad die abspielbare Adresse: Datei aus dem Paket, sonst relativ zur Webseite oder Link. */
const blobUrlCache = new WeakMap();
function mediaUrl(path, files) {
  if (isBlank(path)) return null;
  const blob = files && files.get(normPath(path));
  if (blob) {
    if (!blobUrlCache.has(blob)) blobUrlCache.set(blob, URL.createObjectURL(blob));
    return blobUrlCache.get(blob);
  }
  try { return new URL(path, location.href).href; } catch (e) { return path; }
}

/* Prüft, ob ein Bild bzw. eine Audiodatei geladen werden kann. */
function probeMedia(url, kind, timeoutMs = 10000) {
  return new Promise(resolve => {
    let done = false;
    const finish = ok => { if (!done) { done = true; clearTimeout(timer); resolve(ok); } };
    const timer = setTimeout(() => finish(false), timeoutMs);
    if (kind === 'audio') {
      const a = new Audio();
      a.preload = 'metadata';
      a.onloadedmetadata = () => finish(true);
      a.onerror = () => finish(false);
      a.src = url;
    } else {
      const i = new Image();
      i.onload = () => finish(i.naturalWidth > 0);
      i.onerror = () => finish(false);
      i.src = url;
    }
  });
}

/* Zwischenspeicher der Prüfergebnisse: gefundene Medien dauerhaft, fehlende 15 Sekunden lang. */
const probeCache = new Map();
function probeCached(url, kind) {
  const key = kind + '|' + url;
  const hit = probeCache.get(key);
  if (hit && (hit.ok !== false || Date.now() - hit.t < 15000)) return hit.p;
  const entry = { t: Date.now(), ok: undefined, p: null };
  entry.p = probeMedia(url, kind).then(ok => { entry.ok = ok; entry.t = Date.now(); return ok; });
  probeCache.set(key, entry);
  return entry.p;
}

/* Prüft alle Medien eines Quiz. Ergebnis: Liste {ref, ok, msg}. */
async function checkMedia(quiz, files) {
  const refs = mediaRefs(quiz);
  return Promise.all(refs.map(async ref => {
    const ok = await probeCached(mediaUrl(ref.path, files), ref.kind);
    const what = ref.kind === 'audio' ? 'Audiodatei' : 'Bild';
    return {
      ref, ok,
      msg: ok ? '' : `Kategorie ${ref.ki + 1} („${ref.kat || '?'}“), Frage ${ref.fi + 1}: ${what} „${ref.path}“ nicht gefunden oder nicht abspielbar.`,
    };
  }));
}

/* ===================== Speicher für große Daten (IndexedDB) ===================== */

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('grosser-preis', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('daten');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbSet(key, value) {
  try {
    const db = await idbOpen();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('daten', 'readwrite');
      tx.objectStore('daten').put(value, key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch (e) {
    return false;
  }
}
async function idbGet(key) {
  try {
    const db = await idbOpen();
    return await new Promise((resolve, reject) => {
      const req = db.transaction('daten').objectStore('daten').get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return null;
  }
}
async function idbDel(key) {
  try {
    const db = await idbOpen();
    db.transaction('daten', 'readwrite').objectStore('daten').delete(key);
  } catch (e) { /* ignorieren */ }
}

/* Paket für IndexedDB: Map lässt sich speichern, Blobs ebenfalls. */
const packToStore = pkg => ({ text: pkg.text, files: [...pkg.files] });
const packFromStore = d => (d && typeof d.text === 'string') ? { text: d.text, files: new Map(d.files || []) } : null;

/* Übergabe zwischen Spiel und Editor (wird einmalig gelesen). */
async function putTransfer(key, pkg) {
  return idbSet(key, packToStore(pkg));
}
async function takeTransfer(key) {
  const d = await idbGet(key);
  if (d) await idbDel(key);
  return packFromStore(d);
}

/* ===================== Quiz-Liste (quizze.yaml) ===================== */

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

/* Datei aus der Liste laden (YAML oder ZIP-Paket). */
async function fetchQuizPackage(datei) {
  const res = await fetch(new URL(datei, location.href).href, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return readQuizFile(new File([blob], datei.split('/').pop()));
}
