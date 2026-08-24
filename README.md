# StatusCycler

Automatically cycles your Discord custom status through a configurable list with looping, shuffle and per-status delays. Supports multiple profiles and bulk adding statuses from text. Always check [Vencord](https://github.com/Vencord/Vencord) for the latest version.

## Features

- Status rotation — automatically switches your custom status from a user-defined list
- Multiple profiles — separate status sets (e.g. Gaming, Work), switchable at any time
- Bulk add — paste many statuses at once, one per line, with an optional emoji prefix and delay suffix
- Loop mode — restarts from the first status after the last one, or stops at the end
- Per-status delay — optional delay override for each status, plus a per-profile default delay
- Shuffle — random order instead of sequential
- Auto start — resumes cycling automatically when Discord loads
- Restore on stop — brings back the status you had before cycling started
- Skip control — jump to the next status immediately without waiting

## Installation

### Manual (Vencord UserPlugin)

1. Navigate to your Vencord userplugins directory:
   - **Windows:** `%APPDATA%/Vencord/userplugins/`
   - **Linux:** `~/.config/Vencord/userplugins/`
   - **macOS:** `~/Library/Application Support/Vencord/userplugins/`

2. Clone this repository into that directory:
   ```bash
   cd ~/.config/Vencord/userplugins/
   git clone https://github.com/{user}/{repo}.git StatusCycler
   ```

3. Restart Discord (or Vesktop).

4. Go to **Vencord Settings → Plugins** and enable **StatusCycler** (the UserSettingsAPI dependency is enabled automatically).

### Vesktop (Custom Vencord Build)

If you use Vesktop with a custom Vencord directory:

1. Clone into your Vencord source's `src/userplugins/` folder:
   ```bash
   cd ~/vencord-custom/vencord-src/src/userplugins/
   git clone https://github.com/{user}/{repo}.git StatusCycler
   ```

2. Rebuild Vencord:
   ```bash
   cd ~/vencord-custom/vencord-src
   pnpm build
   ```

3. Copy build output to your Vesktop custom Vencord dir:
   ```bash
   cp dist/vencordDesktop{Main,Preload,Renderer}.{js,css} ~/.config/vesktop/customVencord/
   ```

4. Restart Vesktop.

## Usage

- **Open manager:** Settings → Plugins → StatusCycler → "Open Status Manager", or right-click your own username/avatar → Status Cycler → Manage Statuses...
- **Start/stop cycling:** Right-click yourself → Status Cycler → Start/Stop Cycling, or use the START/STOP button in the manager
- **Skip:** Right-click yourself → Status Cycler → Next Status
- **Profiles:** Create profiles with the "+" chip in the manager; click a chip to switch profiles (cycling continues seamlessly if running)
- **Add status:** In the manager click "Add New", enter text, optional emoji and an optional per-status delay in seconds
- **Bulk add:** Click "Bulk Add" and paste lines like `🎮 Playing games` or `📚 Studying |45` (emoji prefix becomes the status emoji, `|N` sets an N-second delay)
- **Loop options:** Toggle loop forever, shuffle, auto start and restore-on-stop in the manager
- **Default delay:** Set the per-profile time between changes (minimum 5 seconds due to Discord rate limits)

## Files

| File | Description |
|------|-------------|
| `index.tsx` | Main plugin — plugin definition, context menu |
| `engine.ts` | Cycling engine — timer loop, status writes, profile switching |
| `data.ts` | Data layer — DataStore persistence for profiles and config |
| `styles.css` | Styles |
| `components/StatusManagerModal.tsx` | Manager modal — profiles bar, list, loop controls |
| `components/StatusEditModal.tsx` | Edit modal — text, emoji, delay override |
| `components/BulkAddModal.tsx` | Bulk add modal — line parser with emoji/delay format |
| `components/ProfileEditModal.tsx` | Profile modal — create/rename profiles |

## Requirements

- [Vencord](https://github.com/Vencord/Vencord) (latest)

## License

GPL-3.0-or-later
