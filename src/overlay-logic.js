const SPELLS_DB = {
    'Flash': { cd: 300, img: 'SummonerFlash.png' },
    'Ignite': { cd: 180, img: 'SummonerDot.png' },
    'Teleport': { cd: 360, img: 'SummonerTeleport.png' },
    'Ghost': { cd: 240, img: 'SummonerHaste.png' },
    'Heal': { cd: 240, img: 'SummonerHeal.png' },
    'Cleanse': { cd: 240, img: 'SummonerBoost.png' },
    'Exhaust': { cd: 210, img: 'SummonerExhaust.png' },
    'Barrier': { cd: 180, img: 'SummonerBarrier.png' },
    'Smite': { cd: 90, img: 'SummonerSmite.png' }
};

const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
let currentConfig = null;
let currentScale = 1.0;
const timers = {};

document.addEventListener('DOMContentLoaded', init);
async function init() {
    const container = document.getElementById('app');
    const resizer = document.getElementById('resizer');
    const contentWrapper = document.createElement('div');
    contentWrapper.style.display = 'contents';

    ROLES.forEach(role => {
        const group = document.createElement('div');
        group.className = 'role-group';

        const label = document.createElement('div');
        label.className = 'role-label';
        label.innerText = role.substring(0, 3);
        group.appendChild(label);

        group.appendChild(createSpellBox(role, 'spell1'));
        group.appendChild(createSpellBox(role, 'spell2'));

        contentWrapper.appendChild(group);
    });

    container.insertBefore(contentWrapper, resizer);

    setupZoomHandle();

    let loaded = false;

    if (window.readConfigRaw) {
        try {
            const savedData = await window.readConfigRaw();
            if (savedData) {
                console.log("Loaded from disk (Rust)");
                handleVisualUpdate(savedData);
                loaded = true;
            }
        } catch (e) { console.error(e); }
    }

    if (!loaded) {
        try {
            const backup = localStorage.getItem('lol-timer-backup');
            if (backup) {
                console.log("Loaded from local memory");
                handleVisualUpdate(JSON.parse(backup));
            }
        } catch (e) { console.error(e); }
    }

    if (window.listenToVisuals) {
        window.listenToVisuals(handleVisualUpdate);
    }

    setupAutoResizeWindow();
}

function handleVisualUpdate(data) {
    if (!data) return;
    currentConfig = data;
    const container = document.getElementById('app');
    const wrapper = document.getElementById('scalable-wrapper');

    if (data.scale) {
        currentScale = data.scale;
        wrapper.style.transform = `scale(${currentScale})`;
        requestAnimationFrame(() => reportWindowSize());
    }

    if (data.orientation === 'vertical') {
        container.classList.remove('horizontal');
        container.classList.add('vertical');
    } else {
        container.classList.remove('vertical');
        container.classList.add('horizontal');
    }

    ROLES.forEach(role => {
        if (!currentConfig.roles || !currentConfig.roles[role]) return;
        const roleData = currentConfig.roles[role];
        ['spell1', 'spell2'].forEach(slot => {
            const id = `${role}-${slot}`;
            const spellName = roleData[slot];
            const img = document.getElementById(`img-${id}`);
            const box = document.getElementById(`box-${id}`);

            if (SPELLS_DB[spellName]) {
                img.src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/spell/${SPELLS_DB[spellName].img}`;
            }
            if (spellName === 'Teleport' && currentConfig.min10) box.classList.add('unleashed');
            else box.classList.remove('unleashed');
        });
    });
    setTimeout(reportWindowSize, 100);
}

function createSpellBox(role, slot) {
    const id = `${role}-${slot}`;
    const box = document.createElement('div');
    box.className = 'spell-box';
    box.id = `box-${id}`;
    box.addEventListener('click', () => toggleTimer(id));

    const img = document.createElement('img');
    img.id = `img-${id}`;
    box.appendChild(img);

    const timerDiv = document.createElement('div');
    timerDiv.className = 'timer';
    timerDiv.id = `timer-${id}`;
    box.appendChild(timerDiv);

    timers[id] = { interval: null, timeLeft: 0 };
    return box;
}

function setupZoomHandle() {
    const resizer = document.getElementById('resizer');
    const wrapper = document.getElementById('scalable-wrapper');
    let isDragging = false;
    let startX = 0;
    let startScale = 1;

    resizer.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startScale = currentScale;
        e.preventDefault();
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            window.syncScale(currentScale);
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        const newScale = startScale + (deltaX / 200);
        currentScale = Math.min(Math.max(newScale, 0.5), 3.0);
        wrapper.style.transform = `scale(${currentScale})`;
        reportWindowSize();
    });
}

function setupAutoResizeWindow() {
    const wrapper = document.getElementById('scalable-wrapper');
    const observer = new ResizeObserver(() => reportWindowSize());
    observer.observe(wrapper);
}

function reportWindowSize() {
    const wrapper = document.getElementById('scalable-wrapper');
    const rect = wrapper.getBoundingClientRect();
    window.resizeOverlay(Math.ceil(rect.width + 40), Math.ceil(rect.height + 40));
}

function toggleTimer(id) {
    if (!currentConfig) return;
    if (timers[id].interval) {
        clearInterval(timers[id].interval);
        timers[id].interval = null;
        document.getElementById(`timer-${id}`).classList.remove('active');
        return;
    }

    const [role, slot] = id.split('-');
    const roleData = currentConfig.roles[role];
    const spellName = roleData[slot];
    if (!SPELLS_DB[spellName]) return;
    let baseCd = SPELLS_DB[spellName].cd;

    if (spellName === 'Teleport' && currentConfig.min10) {
        const lvl = roleData.level || 1;
        const reduction = (lvl - 1) * (90 / 17);
        baseCd = 330 - reduction;
    }

    let haste = 0;
    if (roleData.boots) haste += 10;
    if (roleData.cosmic) haste += 18;

    const finalCd = Math.round(baseCd / (1 + (haste / 100)));
    timers[id].timeLeft = finalCd;
    updateDisplay(id);

    timers[id].interval = setInterval(() => {
        timers[id].timeLeft--;
        updateDisplay(id);
        if (timers[id].timeLeft <= 0) toggleTimer(id);
    }, 1000);
}

function updateDisplay(id) {
    const el = document.getElementById(`timer-${id}`);
    el.classList.add('active');
    const t = timers[id].timeLeft;
    const m = Math.floor(t / 60);
    const s = t % 60;
    el.innerText = m > 0 ? `${m}:${s < 10 ? '0' + s : s}` : s;
}