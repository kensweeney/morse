import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('morseAPI', {
  getWpm: () => ipcRenderer.invoke('get-wpm'),
  onWpmChanged: (callback) => {
    ipcRenderer.on('wpm-changed', (_event, wpm) => callback(wpm));
  },
});
