# LoLTimer-Summoners

Desktop overlay application to track enemy summoner spell cooldowns in League of Legends.


## Features
* **Overlay:** Floating window that stays on top of the game.
* **Calculation:** Automatically adjusts cooldowns based on reductions (Ionian Boots, Cosmic Insight) and special rules (Unleashed Teleport at 10+ mins).
* **Persistency:** Remembers window position and settings between sessions.

>[!IMPORTANT]
For the overlay to be visible, the League of Legends client must be set to **Borderless** or **Windowed** mode. It will not work in exclusive Fullscreen.

## Usage
1. Download the executable from the Releases section.
2. Configure enemy spells in the settings window (click on spell icons to change them).
3. **Left Click:** Starts the cooldown timer.
4. **Click Again:** Resets the timer if needed.

## PREVIEW
<img width="428" height="487" alt="imagen" src="https://github.com/user-attachments/assets/4be9517b-73f6-4a85-b91c-e98a8448804f" />
<img width="129" height="243" alt="imagen" src="https://github.com/user-attachments/assets/98ad0b16-fbac-4219-9261-73939baf17be" />

## Development

Commands to modify and build the project with Tauri:

```bash
# 1. Install dependencies
npm install

# 2. Start in dev mode (Hot Reload)
npm run tauri dev

# 3. Build .exe (Production)
npm run tauri build