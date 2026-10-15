# 🏆 Der große Preis

Quiz-Spiel im Stil von „Der große Preis“ für Beamer und Browser. Ohne Installation und ohne Server.
Die Fragen stehen in einer einfachen Textdatei (YAML). Bilder und Musik können als Quiz-Paket (ZIP) mitgegeben werden.

## Spielen

1. Seite öffnen (GitHub-Pages-Adresse oder `index.html` per Doppelklick).
2. Fragen laden: Quiz-Knopf anklicken **oder** eine eigene `.yaml`-Datei bzw. ein Quiz-Paket (`.zip`) hineinziehen oder auswählen. Die App prüft danach, ob alle Bilder und Audiodateien vorhanden sind, und listet fehlende auf.
3. Anzahl der Gruppen eingeben, Namen anpassen, festlegen, wer anfängt (oder 🎲 Zufall).
4. **Spiel starten**. Mit ⛶ oben rechts in den Vollbildmodus wechseln.

### Regeln in der App

| Feld | Ablauf |
|---|---|
| normale Frage | Richtig: Punkte des Feldes. Falsch: keine Punkte. |
| **Risiko** | Die Gruppe setzt vorher Punkte aus ihrem Punktestand (höchstens so viele, wie sie hat; mit 0 Punkten ist der Einsatz 0). Richtig: Einsatz verdoppelt (+Einsatz). Falsch: Einsatz wird abgezogen. |
| **Joker** | Keine Frage. Die Punkte gibt es mit Spielautomaten-Sound geschenkt. |

Nach jeder Frage ist automatisch die nächste Gruppe dran.

### Für die Spielleitung

- **„Doch als richtig werten“** erscheint nach einer falschen Antwort, z. B. wenn die Frage fehlerhaft war oder die Antwort nah genug dran war. Die Punkte werden korrekt nachgebucht, auch beim Risiko-Einsatz.
- Bereits gespielte Felder lassen sich erneut anklicken. Dort kann man die Wertung ändern oder das Feld wieder freigeben (bei Fehlklick).
- Ein Klick auf eine Gruppe unten macht sie zur Gruppe, die am Zug ist.
- ✎ an einer Gruppe: Punktestand von Hand ändern.
- Tastenkürzel im Fragefenster: `Leertaste` Antwort zeigen, `R` richtig, `F` falsch, `D` doch richtig, `Enter` zurück zum Spielfeld, `Esc` abbrechen.
- Fragen mit Musik zeigen einen Abspieler. Die Musik läuft beim Werten weiter und stoppt beim Zurückgehen zum Spielfeld.
- Der Spielstand wird im Browser gespeichert, inklusive Bilder und Musik eines Pakets. Nach versehentlichem Neuladen erscheint „Weiterspielen“.

## Fragen schreiben

### Mit dem Fragen-Editor (am einfachsten)

Auf der Startseite **„✏️ Fragen-Editor“** anklicken (oder direkt `editor.html` öffnen).

- **Neues Quiz:** Anzahl der Kategorien (Spalten) und Fragen pro Kategorie (Zeilen) sowie die Punkte eingeben. Daraus entsteht ein leeres Formular zum Ausfüllen.
- **Vorhandenes Quiz bearbeiten:** eigene YAML-Datei oder ein Quiz-Paket (ZIP) hineinziehen oder ein Quiz aus der Liste wählen. Ist im Spiel schon ein Quiz geladen, führt **„✏️ Geladenes Quiz bearbeiten“** direkt dorthin.
- **Bilder und Musik:** Bei jeder Frage über 🖼 die Medienfelder öffnen: *Bild zur Frage*, *Bild zur Antwort*, *Audio zur Frage*. Eine Datei hineinziehen oder mit 📁 auswählen. Alternativ einen Link oder Pfad eintippen. Jedes Feld zeigt eine Vorschau und ob die Datei gefunden wurde.
- Fehlende Angaben und nicht auffindbare Bilder oder Audiodateien sind rot markiert. Oben steht, was noch fehlt.
- **⬇ Herunterladen** speichert das Quiz. Ohne eigene Dateien entsteht eine YAML-Datei. Mit eigenen Bildern oder Musik entsteht ein **Quiz-Paket (ZIP)** mit `quiz.yaml` und einem Ordner `medien/`. Beides kann beim Spielstart hochgeladen, weitergegeben oder wieder im Editor geöffnet werden.
- **▶ Testspielen** öffnet das Quiz sofort im Spiel.
- Der Entwurf wird automatisch im Browser gespeichert, aber nur dort. Zum Aufbewahren immer herunterladen.

### Von Hand als Text

`fragen/beispiel.yaml` kopieren und anpassen. Aufbau:

```yaml
titel: Mein Quiz

kategorien:
  - name: Erste Kategorie
    fragen:
      - punkte: 100
        frage: Wie viele Beine hat eine Spinne?
        antwort: 8
      - punkte: 200
        typ: risiko
        frage: Wie heißt die Hauptstadt von Australien?
        antwort: Canberra
      - punkte: 300
        typ: joker

  - name: Zweite Kategorie
    fragen:
      - punkte: 100
        frage: ...
        antwort: ...
```

Worauf man achten muss:

- **Einrückung mit Leerzeichen** (keine Tabulatoren). Untereinander stehende Dinge müssen genau gleich weit eingerückt sein.
- Text mit **Doppelpunkt** oder Sonderzeichen am Anfang in Anführungszeichen setzen: `frage: "Was bedeutet: x = 5?"`
- Mehrzeiliger Text: `frage: |` und darunter eingerückt die Zeilen.
- Optional sind **Bilder und Musik**: `bild:` (zur Frage), `antwort_bild:` (zur Antwort) und `audio:` (zur Frage). Erlaubt sind ein Pfad im Quiz-Paket (`medien/foto.jpg`), ein Pfad im Repository (`bilder/foto.png`, relativ zur Webseite) oder eine vollständige Internetadresse.
- Ist etwas falsch, zeigt die App beim Laden an, in welcher Kategorie und Frage bzw. in welcher Zeile das Problem liegt.

Bearbeiten direkt auf GitHub: Datei anklicken, ✏️ (Stift) anklicken, ändern, **Commit changes**. Nach ein bis zwei Minuten ist die Webseite aktualisiert.

### Neues Quiz zur Startseite hinzufügen

In `quizze.yaml` einen Eintrag ergänzen:

```yaml
quizze:
  - name: Beispiel-Quiz
    datei: fragen/beispiel.yaml
  - name: Mein Quiz
    datei: fragen/mein-quiz.yaml
```

In `datei:` darf auch ein Quiz-Paket (`.zip`) stehen.

> ⚠️ **Alles im Repository ist über die Webseite öffentlich abrufbar, auch die Antworten, Bilder und Musik.**
> Fragen, die geheim bleiben sollen, und urheberrechtlich geschützte Medien (z. B. Lieder) nicht hochladen. Besser als Quiz-Paket lokal speichern und beim Spielstart in die Seite ziehen.

## Einrichtung von GitHub Pages

Repository → **Settings** → **Pages** → *Source*: „Deploy from a branch“, Branch `main`, Ordner `/ (root)` → **Save**.

## 🤖 Wie diese App entstanden ist (Vibe Coding)

Diese App wurde **per „Vibe Coding“** erstellt. Der gesamte Code, die Beispielfragen und diese README wurden von der KI **Claude** (Anthropic) in einer [Claude-Code](https://claude.ai/code)-Sitzung geschrieben. Grundlage war eine kurze Beschreibung in Alltagssprache:

> Web-App für den großen Preis, Fragen aus einer einfachen YAML-Datei, die auch Nicht-Informatiker füllen können. Am Anfang Anzahl der Gruppen und Startgruppe abfragen, Punkte mitzählen. Joker (Punkte geschenkt mit Spielautomaten-Sound) und Risiko-Fragen (Einsatz: richtig = verdoppelt, falsch = abgezogen). Ein Knopf, mit dem die Spielleitung eine falsche Antwort doch als richtig werten kann.

Spätere Wünsche wurden in derselben Weise umgesetzt, z. B. der Fragen-Editor („Leute editieren ihr eigenes YAML und laden es wieder runter, oder leerer Editor mit kurzer Zeilen-/Spalten-Abfrage“), Quiz-Pakete mit Bildern und Musik samt Prüfung aller Medien und Korrekturen nach dem ersten Ausprobieren. Als Test für den Editor hat die KI ein echtes Fragen-Set aus PowerPoint-Folien vollständig über die Bedienoberfläche des Editors nachgebaut. Dabei gefundene Fehler wurden behoben.

Was das konkret heißt:

- **Kein Mensch hat den Code Zeile für Zeile geschrieben oder geprüft.** Die Anforderungen und Entscheidungen kamen vom Menschen, die Umsetzung von der KI.
- **Getestet** wurde automatisiert in einem echten Browser (Playwright/Chromium): Spielablauf, Punkteberechnung für normale, Risiko- und Joker-Felder, „Doch als richtig werten“, Weiterspielen nach Neuladen, Fehlermeldungen bei kaputter YAML, im Editor Anlegen, Ausfüllen, Herunterladen, Testspielen und verlustfreies Öffnen und Speichern des Beispiel-Quiz, Quiz-Pakete (Medien hinzufügen, ZIP herunterladen, im Spiel laden, Musik abspielen, Weiterspielen nach Neuladen, verlustfreie Rundreise Spiel → Editor → ZIP), Erkennen fehlender Bilder und toter Links, sowie Screenshots von Spielfeld, Fragen, Editor und Handy-Ansicht. Ein systematischer Test auf allen Browsern und Geräten fand nicht statt.
- Eine Regel hat die KI selbst festgelegt, weil sie nicht vorgegeben war: Falsche normale Antworten geben 0 Punkte.
- Fehler sind möglich. Bitte vor einem wichtigen Einsatz einmal mit den eigenen Fragen durchspielen. Fehler und Wünsche gerne als Issue melden.

## Technik

Reines HTML/JavaScript: `index.html` (Spiel), `editor.html` (Fragen-Editor), `quiz-format.js` (gemeinsam: Prüfung der Fragen-Dateien, Quiz-Pakete, Medienprüfung). YAML wird mit [js-yaml](https://github.com/nodeca/js-yaml), ZIP mit [JSZip](https://github.com/Stuk/jszip) gelesen und geschrieben (beide MIT, in `lib/`).
Spielstand und Pakete liegen im Browser (localStorage bzw. IndexedDB), nichts wird an einen Server geschickt. Die Spielgeräusche werden im Browser erzeugt, es gibt dafür keine Audiodateien.
