# Morse Tutor

An Electron desktop app for learning Morse code using the **Koch method** — characters are always played at full speed, and you grow your character set gradually as your recognition improves.

## Features

### Menu bar

Standard File / Edit / View / Help menus. Under **Edit** there is a "Code Speed" section with radio items for **10 / 15 / 20 / 25 WPM**. Selecting one updates the app live, and the current speed is shown in the header. Timing follows the PARIS standard (dit = 1.2 s ÷ WPM), so characters always play at true speed per the Koch method.

### Score

The top of the window shows `correct / attempts (%)` with a Reset button. Only Receiver mode affects the score.

### Keyboard

Full US layout with clickable keycaps, including the number row, punctuation keys (shifted characters shown in the corner, e.g. `?` on the `/` key), and a spacebar. Keys with no Morse equivalent (`~`, `[`, `]`, `\`, `#`, `%`, ...) are grayed out. Physical keyboard input works everywhere too.

### Receiver mode

Checkboxes for Letters / Numbers / Punctuation plus a **Koch level slider** — the practice pool is drawn from the standard 40-character Koch sequence (K, M, R, S, U, A, ...), so you can start with just the first few characters and expand as you improve.

Press **Start**: a character plays through the default speaker, then the app waits for your answer (click a key or type it).

- **Correct** → a bell chime sounds, the score increments, and the next character plays.
- **Wrong** → the correct key **flashes orange** on the on-screen keyboard, then training continues.

A **Replay** button repeats the current character without affecting the score.

### Sender mode

Two playback options:

- **Immediate** — each key you click or type plays instantly, with its dot-dash pattern shown (e.g. `K → − · −`).
- **Type, then press Enter** — a text field that plays the whole string with proper letter and word spacing when you hit Enter. Clicking on-screen keys appends to the field.

### Audio

All sounds — the 600 Hz keying tone and the bell — are synthesized with the Web Audio API and play through the default output device; no audio files are used.

## Development

Built with [Electron Forge](https://www.electronforge.io/) and Vite.

```sh
npm install     # install dependencies
npm start       # run in development mode
npm run package # package the app
npm run make    # build platform installers
```

### Project layout

| File | Purpose |
| --- | --- |
| `src/main.js` | Main process: window, menu bar, WPM state, IPC |
| `src/preload.js` | Context bridge exposing `morseAPI` to the renderer |
| `src/morse.js` | Morse code table, Koch character order, helpers |
| `src/audio.js` | Web Audio player: keying tone scheduling and bell sound |
| `src/renderer.js` | UI logic: keyboard, tabs, receiver/sender modes, score |
| `index.html` / `src/index.css` | Layout and styling |
