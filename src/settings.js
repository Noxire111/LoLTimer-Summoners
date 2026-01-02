const SPELLS_DB = {
    'Flash': { img: 'SummonerFlash.png' },
    'Ignite': { img: 'SummonerDot.png' },
    'Teleport': { img: 'SummonerTeleport.png' },
    'Ghost': { img: 'SummonerHaste.png' },
    'Heal': { img: 'SummonerHeal.png' },
    'Cleanse': { img: 'SummonerBoost.png' },
    'Exhaust': { img: 'SummonerExhaust.png' },
    'Barrier': { img: 'SummonerBarrier.png' },
    'Smite': { img: 'SummonerSmite.png' }
};
const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

let currentSelection = { role: null, slot: null };
document.addEventListener('DOMContentLoaded', async () => {

    window.appData = { roles: {}, min10: false, orientation: 'horizontal', scale: 1.0 };

    ROLES.forEach(r => {
        window.appData.roles[r] = { spell1: 'Teleport', spell2: 'Flash', level: 1, boots: false, cosmic: false };
        if (r === 'JUNGLE') { window.appData.roles[r].spell1 = 'Smite'; window.appData.roles[r].spell2 = 'Flash'; }
        if (r === 'ADC') window.appData.roles[r].spell1 = 'Barrier';
        if (r === 'SUPPORT') window.appData.roles[r].spell1 = 'Heal';
    });

    try {
        const backup = localStorage.getItem('lol-timer-backup');
        if (backup) window.appData = { ...window.appData, ...JSON.parse(backup) };
    } catch (e) { console.error(e); }

    if (window.loadConfig) await window.loadConfig();

    renderUI();
    setupGlobalListeners();
});

function renderUI() {
    const container = document.getElementById('controls');
    container.innerHTML = '';

    ROLES.forEach(role => {
        const rData = window.appData.roles[role] || {};
        const div = document.createElement('div');
        div.className = 'section';
        div.innerHTML = `
            <div class="controls-header">
                <h3>${role}</h3>
                <div class="lvl-control">Lvl <input type="number" min="1" max="18" value="${rData.level}" data-role="${role}" data-action="level"></div>
            </div>

            <div class="spell-container">
                <div class="spell-slot" data-role="${role}" data-slot="spell1">
                    <img src="${getSpellImg(rData.spell1)}" title="${rData.spell1}">
                </div>
                <div class="spell-slot" data-role="${role}" data-slot="spell2">
                    <img src="${getSpellImg(rData.spell2)}" title="${rData.spell2}">
                </div>
            </div>

            <div class="controls-footer">
                <label><input type="checkbox" ${rData.cosmic ? 'checked' : ''} data-role="${role}" data-action="cosmic"> Cosmic</label>
                <label><input type="checkbox" ${rData.boots ? 'checked' : ''} data-role="${role}" data-action="boots"> Ionian</label>
            </div>
        `;
        container.appendChild(div);
    });
    document.getElementById('global-min10').checked = window.appData.min10;
    const radio = document.querySelector(`input[name="orientation"][value="${window.appData.orientation}"]`);
    if(radio) radio.checked = true;

    document.getElementById('status').innerText = "Ready";
}

function getSpellImg(name) {
    return SPELLS_DB[name] ? `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/spell/${SPELLS_DB[name].img}` : '';
}

function setupGlobalListeners() {
    document.body.addEventListener('change', (e) => {
        const target = e.target;

        if (target.id === 'global-min10') {
            handleInput();
            return;
        }
        if (target.name === 'orientation') {
            handleInput();
            return;
        }

        const role = target.getAttribute('data-role');
        const action = target.getAttribute('data-action');

        if (role && action) {
            let val = target.type === 'checkbox' ? target.checked : target.value;
            if (target.type === 'number') val = parseInt(val);
            if (!window.appData.roles[role]) window.appData.roles[role] = {};
            window.appData.roles[role][action] = val;
            handleInput();
        }
    });

    document.getElementById('controls').addEventListener('click', (e) => {
        const slotDiv = e.target.closest('.spell-slot');
        if (slotDiv) {
            const role = slotDiv.getAttribute('data-role');
            const slot = slotDiv.getAttribute('data-slot');
            openPicker(role, slot);
        }
    });

    document.getElementById('close-modal-btn').addEventListener('click', closePicker);
    document.getElementById('spell-picker-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closePicker();
    });

    document.getElementById('picker-grid').addEventListener('click', (e) => {
        const option = e.target.closest('.picker-option');
        if (option) {
            const spell = option.getAttribute('data-spell');
            selectSpell(spell);
        }
    });
}

function openPicker(role, slot) {
    currentSelection = { role, slot };
    const modal = document.getElementById('spell-picker-modal');
    const grid = document.getElementById('picker-grid');

    grid.innerHTML = '';
    Object.keys(SPELLS_DB).forEach(spell => {
        const div = document.createElement('div');
        div.className = 'picker-option';
        div.setAttribute('data-spell', spell);
        div.innerHTML = `<img src="${getSpellImg(spell)}" title="${spell}">`;
        grid.appendChild(div);
    });

    modal.classList.remove('hidden');
    modal.classList.add('active');
}

function closePicker() {
    const modal = document.getElementById('spell-picker-modal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
}

function selectSpell(spellName) {
    const { role, slot } = currentSelection;
    if (!role || !slot) return;
    if (role === 'JUNGLE' && spellName === 'Smite') {
        const otherSlot = slot === 'spell1' ? 'spell2' : 'spell1';
        if (window.appData.roles[role][otherSlot] === 'Smite') {
            window.appData.roles[role][otherSlot] = 'Flash';
        }
    }

    window.appData.roles[role][slot] = spellName;
    renderUI();
    closePicker();
    handleInput();
}

function handleInput() {
    window.appData.min10 = document.getElementById('global-min10').checked;
    const orEl = document.querySelector('input[name="orientation"]:checked');
    if (orEl) window.appData.orientation = orEl.value;
    if (window.updateVisuals) window.updateVisuals(window.appData);
    saveConfig();
}

function saveConfig() {
    localStorage.setItem('lol-timer-backup', JSON.stringify(window.appData));
    if (window.saveConfig) {
        window.saveConfig();
        document.getElementById('status').innerText = "Saved";
    }
}