const { invoke } = window.__TAURI__.core;
const { emit, listen } = window.__TAURI__.event;

window.readConfigRaw = async function() {
    try {
        const data = await invoke('load_config');
        if (data && data !== "{}") {
            return JSON.parse(data);
        }
        return null;
    } catch (e) {
        console.error("Error reading config from Rust:", e);
        return null;
    }
}

window.saveConfig = async function() {
    if (window.appData) {
        await invoke('save_config', { data: JSON.stringify(window.appData) });
        localStorage.setItem('lol-timer-backup', JSON.stringify(window.appData));
    }
}

window.loadConfig = async function() {
    const data = await window.readConfigRaw();
    if (data) {
        window.appData = { ...window.appData, ...data };
        if (window.initUI) window.initUI();
        window.updateVisuals(window.appData);
    } else {
        const backup = localStorage.getItem('lol-timer-backup');
        if (backup) {
            window.appData = { ...window.appData, ...JSON.parse(backup) };
        }
        if (window.initUI) window.initUI();
    }
}


window.updateVisuals = async function(data) {
    await emit('update-visuals', data);
}

window.listenToVisuals = async function(callback) {
    await listen('update-visuals', (event) => {
        callback(event.payload);
    });
}

window.resizeOverlay = async function(width, height) {
    await invoke('resize_window', { width, height });
}

window.syncScale = async function(scale) {
    await emit('sync-scale', scale);
}

listen('sync-scale', (event) => {
    if (window.appData) {
        window.appData.scale = event.payload;
        window.saveConfig();
    }
});