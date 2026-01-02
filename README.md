# LoLTimer-Summoners

Desktop overlay application to track enemy summoner spell cooldowns in League of Legends.

## Features
* **Overlay:** Floating window that stays on top of the game.
* **Smart Calculation:** Automatically adjusts cooldowns based on reductions (Ionian Boots, Cosmic Insight) and special rules (Unleashed Teleport at 10+ mins).

>[!IMPORTANT]
For the overlay to be visible, the League of Legends client must be set to **Borderless** or **Windowed** mode. It will not work in exclusive Fullscreen.

## Usage
1. Download the executable from the Releases section.
2. Configure enemy spells in the settings window.
3. **Left Click:** Starts the cooldown timer.
## PREVIEW
<img width="650" height="700" alt="imagen" src="https://github.com/user-attachments/assets/54e8bf73-fc58-4518-a633-a34817daefaa" />
<img width="132" height="243" alt="imagen" src="https://github.com/user-attachments/assets/2e6213dc-2fc4-4c75-aca1-2320682c2920" />




## Development

Commands to modify and build the project:

```bash
# Install dependencies
npm install

# Start in dev mode
npm start

# Build .exe
npm run dist
