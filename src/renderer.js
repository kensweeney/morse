import './index.css';
import { MORSE, KOCH_ORDER, categoryOf, prettyPattern } from './morse.js';
import { MorsePlayer } from './audio.js';

const player = new MorsePlayer();

// ---------------------------------------------------------------- WPM (menu)
let wpm = 20;
const wpmLabel = document.getElementById('wpm-label');
const setWpm = (value) => {
  wpm = value;
  wpmLabel.textContent = `${wpm} WPM`;
};
window.morseAPI.getWpm().then(setWpm);
window.morseAPI.onWpmChanged(setWpm);

// -------------------------------------------------------------------- score
const score = { correct: 0, total: 0 };
const scoreEl = document.getElementById('score');

function updateScore() {
  const pct = score.total ? Math.round((100 * score.correct) / score.total) : 0;
  scoreEl.textContent = score.total
    ? `Score: ${score.correct} / ${score.total} (${pct}%)`
    : 'Score: 0 / 0';
}

document.getElementById('btn-reset-score').addEventListener('click', () => {
  score.correct = 0;
  score.total = 0;
  updateScore();
});

// ----------------------------------------------------------------- keyboard
// US layout as [unshifted, shifted] pairs. Keys where neither character has
// a Morse code are rendered but disabled.
const ROWS = [
  [['`', '~'], ['1', '!'], ['2', '@'], ['3', '#'], ['4', '$'], ['5', '%'], ['6', '^'],
   ['7', '&'], ['8', '*'], ['9', '('], ['0', ')'], ['-', '_'], ['=', '+']],
  [['Q'], ['W'], ['E'], ['R'], ['T'], ['Y'], ['U'], ['I'], ['O'], ['P'],
   ['[', '{'], [']', '}'], ['\\', '|']],
  [['A'], ['S'], ['D'], ['F'], ['G'], ['H'], ['J'], ['K'], ['L'], [';', ':'], ["'", '"']],
  [['Z'], ['X'], ['C'], ['V'], ['B'], ['N'], ['M'], [',', '<'], ['.', '>'], ['/', '?']],
];

const keyboardEl = document.getElementById('keyboard');
const charToKey = new Map();

for (const row of ROWS) {
  const rowEl = document.createElement('div');
  rowEl.className = 'kb-row';
  for (const [primary, shifted] of row) {
    const btn = document.createElement('button');
    btn.className = 'key';
    btn.dataset.primary = primary;
    if (shifted) btn.dataset.shifted = shifted;

    if (shifted) {
      btn.innerHTML = `<span class="shift-label">${escapeHtml(shifted)}</span><span class="main-label">${escapeHtml(primary)}</span>`;
    } else {
      btn.innerHTML = `<span class="main-label">${escapeHtml(primary)}</span>`;
    }

    if (!MORSE[primary] && !(shifted && MORSE[shifted])) {
      btn.disabled = true;
      btn.classList.add('dead');
    } else {
      if (MORSE[primary]) charToKey.set(primary, btn);
      if (shifted && MORSE[shifted]) charToKey.set(shifted, btn);
      btn.addEventListener('click', (e) => onKeyClicked(btn, e.shiftKey));
    }
    rowEl.appendChild(btn);
  }
  keyboardEl.appendChild(rowEl);
}

// Space bar row (used by Sender mode for word gaps).
{
  const rowEl = document.createElement('div');
  rowEl.className = 'kb-row';
  const btn = document.createElement('button');
  btn.className = 'key spacebar';
  btn.dataset.primary = ' ';
  btn.innerHTML = '<span class="main-label">space</span>';
  btn.addEventListener('click', () => onKeyClicked(btn, false));
  rowEl.appendChild(btn);
  keyboardEl.appendChild(rowEl);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function pressVisual(btn) {
  if (!btn) return;
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 140);
}

function flashKey(btn) {
  if (!btn) return;
  btn.classList.add('flash');
  setTimeout(() => btn.classList.remove('flash'), 1600);
}

// --------------------------------------------------------------------- tabs
let mode = 'receiver';
const tabReceiver = document.getElementById('tab-receiver');
const tabSender = document.getElementById('tab-sender');
const receiverControls = document.getElementById('receiver-controls');
const senderControls = document.getElementById('sender-controls');

function switchMode(next) {
  if (mode === next) return;
  mode = next;
  stopReceiver();
  player.stop();
  tabReceiver.classList.toggle('active', mode === 'receiver');
  tabSender.classList.toggle('active', mode === 'sender');
  receiverControls.classList.toggle('hidden', mode !== 'receiver');
  senderControls.classList.toggle('hidden', mode !== 'sender');
  updateSenderInputVisibility();
}

tabReceiver.addEventListener('click', () => switchMode('receiver'));
tabSender.addEventListener('click', () => switchMode('sender'));

// ------------------------------------------------------------ receiver mode
const chkLetters = document.getElementById('set-letters');
const chkNumbers = document.getElementById('set-numbers');
const chkPunct = document.getElementById('set-punct');
const kochLevel = document.getElementById('koch-level');
const kochLevelValue = document.getElementById('koch-level-value');
const btnStart = document.getElementById('btn-start');
const btnReplay = document.getElementById('btn-replay');
const receiverStatus = document.getElementById('receiver-status');

kochLevel.addEventListener('input', () => {
  kochLevelValue.textContent = kochLevel.value;
});

let running = false;
let awaiting = false;
let currentChar = null;
let nextTimer = null;

function setReceiverStatus(text) {
  receiverStatus.textContent = text;
}

function buildPool() {
  const enabled = {
    letters: chkLetters.checked,
    numbers: chkNumbers.checked,
    punctuation: chkPunct.checked,
  };
  const level = parseInt(kochLevel.value, 10);
  return KOCH_ORDER.slice(0, level).filter((ch) => enabled[categoryOf(ch)]);
}

function pickChar(pool) {
  if (pool.length === 1) return pool[0];
  let ch;
  do {
    ch = pool[Math.floor(Math.random() * pool.length)];
  } while (ch === currentChar);
  return ch;
}

async function playCurrent() {
  awaiting = false;
  setReceiverStatus('Listening…');
  const finished = await player.playMorse(currentChar, wpm);
  if (!finished || !running) return;
  awaiting = true;
  setReceiverStatus('Which character was that? Press or click a key.');
}

function nextChar() {
  if (!running) return;
  const pool = buildPool();
  if (pool.length === 0) {
    setReceiverStatus('Select at least one character set.');
    return;
  }
  currentChar = pickChar(pool);
  playCurrent();
}

function startReceiver() {
  const pool = buildPool();
  if (pool.length === 0) {
    setReceiverStatus('Select at least one character set first.');
    return;
  }
  running = true;
  currentChar = null;
  btnStart.textContent = 'Stop';
  btnReplay.disabled = false;
  nextChar();
}

function stopReceiver() {
  running = false;
  awaiting = false;
  currentChar = null;
  clearTimeout(nextTimer);
  btnStart.textContent = 'Start';
  btnReplay.disabled = true;
  setReceiverStatus('Press Start to begin.');
}

btnStart.addEventListener('click', () => {
  if (running) {
    stopReceiver();
    player.stop();
  } else {
    startReceiver();
  }
});

btnReplay.addEventListener('click', () => {
  if (running && currentChar) {
    player.stop();
    playCurrent();
  }
});

// candidates: the character(s) a key press could mean (a physical keystroke
// gives exactly one; clicking a two-character key gives both).
function receiverAnswer(candidates) {
  if (!running || !awaiting) return;
  const meaningful = candidates.filter((ch) => ch !== ' ');
  if (meaningful.length === 0) return;
  awaiting = false;
  score.total++;
  if (meaningful.includes(currentChar)) {
    score.correct++;
    player.bell();
    setReceiverStatus(`Correct — that was “${currentChar}” (${prettyPattern(MORSE[currentChar])})`);
    nextTimer = setTimeout(nextChar, 900);
  } else {
    flashKey(charToKey.get(currentChar));
    setReceiverStatus(`Wrong — it was “${currentChar}” (${prettyPattern(MORSE[currentChar])})`);
    nextTimer = setTimeout(nextChar, 1800);
  }
  updateScore();
}

// -------------------------------------------------------------- sender mode
const sendText = document.getElementById('send-text');
const senderStatus = document.getElementById('sender-status');
const sendModeRadios = document.querySelectorAll('input[name="sendmode"]');

function senderMode() {
  return document.querySelector('input[name="sendmode"]:checked').value;
}

function updateSenderInputVisibility() {
  const buffered = mode === 'sender' && senderMode() === 'buffered';
  sendText.classList.toggle('hidden', !buffered);
  if (buffered) {
    senderStatus.textContent = 'Type a message, then press Enter to play it.';
    sendText.focus();
  } else if (mode === 'sender') {
    senderStatus.textContent = 'Click keys or type on your keyboard to hear Morse.';
  }
}

for (const radio of sendModeRadios) {
  radio.addEventListener('change', () => {
    player.stop();
    updateSenderInputVisibility();
  });
}

function senderPlayChar(ch) {
  if (ch === ' ') {
    senderStatus.textContent = 'word gap';
    return;
  }
  const code = MORSE[ch];
  if (!code) return;
  player.stop();
  player.playMorse(ch, wpm);
  senderStatus.textContent = `${ch}  →  ${prettyPattern(code)}`;
}

let sendingBuffer = false;
sendText.addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter' || sendingBuffer) return;
  const text = sendText.value.trim();
  if (!text) return;
  sendingBuffer = true;
  sendText.disabled = true;
  senderStatus.textContent = `Playing: ${text}`;
  const finished = await player.playMorse(text, wpm);
  sendText.disabled = false;
  sendText.select();
  sendText.focus();
  senderStatus.textContent = finished ? `Played: ${text}` : 'Stopped.';
  sendingBuffer = false;
});

// -------------------------------------------------------- shared key events
function onKeyClicked(btn, shiftHeld) {
  pressVisual(btn);
  const primary = btn.dataset.primary;
  const shifted = btn.dataset.shifted;

  if (mode === 'receiver') {
    const candidates = [primary, shifted].filter((ch) => ch && MORSE[ch]);
    receiverAnswer(candidates.length ? candidates : [primary]);
    return;
  }

  // Sender mode
  const ch = shiftHeld && shifted && MORSE[shifted] ? shifted : primary;
  if (senderMode() === 'buffered') {
    sendText.value += ch === ' ' ? ' ' : ch;
    sendText.focus();
  } else {
    senderPlayChar(ch);
  }
}

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target === sendText) return; // buffered typing is handled separately
  if (e.key.length !== 1) return;
  const ch = e.key === ' ' ? ' ' : e.key.toUpperCase();

  if (mode === 'receiver') {
    if (!running || !awaiting) return;
    pressVisual(charToKey.get(ch));
    receiverAnswer([ch]);
  } else if (senderMode() === 'immediate') {
    pressVisual(charToKey.get(ch));
    senderPlayChar(ch);
  }
});

updateScore();
