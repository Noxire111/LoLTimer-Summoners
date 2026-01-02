const { contextBridge, ipcRenderer } = require('electron');

const validChannels = [
    'load-config',
    'save-config',
    'settings-changed',
    'resize-overlay',
    'report-scale-change',
    'config-loaded',
    'sync-scale',
    'update-visuals'
];

contextBridge.exposeInMainWorld('api', {
    send: (channel, data) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    on: (channel, func) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
});