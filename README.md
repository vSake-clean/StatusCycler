# StatusCycler

A [Vencord](https://github.com/Vencord/Vencord) plugin that automatically cycles your Discord custom status through a configurable list — with multiple profiles, bulk adding, shuffle and per-status delays.

## Features

- **Status rotation** — switches your custom status automatically from a user-defined list
- **Multiple profiles** — separate status sets (e.g. Gaming, Work); switching profiles keeps cycling seamlessly
- **Bulk add** — paste many statuses at once, one per line, with optional emoji prefix and delay suffix
- **Loop & shuffle** — restart from the first status after the last one, or pick statuses randomly
- **Per-status delay** — optional delay override per status, plus a per-profile default delay
- **Auto start** — resumes cycling automatically when Discord loads
- **Restore on stop** — brings back the status you had before cycling started
- **Skip control** — jump to the next status immediately without waiting

## Installation

Requires a [Vencord development build](https://docs.vencord.dev/installing/), plus **git**, **Node.js 18+** and **pnpm**.

1. Clone this repository into your Vencord source's `src/userplugins` directory:

   ```bash
   cd Vencord/src/userplugins
   git clone https://github.com/vSake-clean/StatusCycler.git
   ```

2. Build Vencord:

   ```bash
   cd ..
   pnpm i
   pnpm build
   ```

3. Restart Discord (or Vesktop).

4. Enable **StatusCycler** in *Settings → Plugins*. The `UserSettingsAPI` dependency is enabled automatically.

## Usage

| Action | How |
|--------|-----|
| Open manager | *Settings → Plugins → StatusCycler → Open Status Manager*, or right-click your own username/avatar → *Status Cycler → Manage Statuses...* |
| Start / stop cycling | Right-click yourself → *Status Cycler → Start/Stop Cycling*, or the START/STOP button in the manager |
| Skip to next status | Right-click yourself → *Status Cycler → Next Status* |
| Add a single status | Manager → *Add New* — text, optional emoji, optional per-status delay in seconds |
| Switch profile | Click a profile chip at the top of the manager; create new ones with the **+** chip |

### Bulk add format

Click **Bulk Add** and paste one status per line:

```text
🎮 Playing games
📚 Studying |45
Just chilling
🎵 Music |15
```

| Part | Example | Effect |
|------|---------|--------|
| Leading emoji | `🎮 Playing games` | becomes the status emoji |
| Trailing `\|N` | `Studying \|45` | overrides this status's delay to N seconds |
| Plain line | `Just chilling` | text only, uses the profile default delay |

### Profiles

Each profile keeps its own status list plus its own loop / shuffle / default-delay settings. **Auto start** and **Restore on stop** are global options shared by all profiles. On startup, cycling resumes with the profile that was active last.

> **Note:** Discord rate-limits custom status changes — the minimum delay is 5 seconds. Statuses are stored locally in Discord's DataStore and survive restarts.

## Development

```bash
pnpm i          # install dependencies
pnpm build      # bundle
pnpm testTsc    # typecheck
```

## License

[GPL-3.0-or-later](https://www.gnu.org/licenses/gpl-3.0.txt) — same as Vencord.

---

## More projects by vSake

- **[Fih](https://github.com/vSake-clean/Fih)** — programming language with a compiler written in pure x86-64 assembly, no libc
- **[Szept](https://github.com/vSake-clean/Szept)** — serverless Android messenger
- **[LunarDraw](https://github.com/vSake-clean/LunarDraw)** — GTK3/Cairo drawing app with layers
- **[LuminaView](https://github.com/vSake-clean/LuminaView)** — fast, lightweight Qt5 image viewer for Linux
- **[vencord-AutoReply](https://github.com/vSake-clean/vencord-AutoReply)** — Vencord plugin for automatic replies with triggers and filters
- **[vencord-StickyNotes](https://github.com/vSake-clean/vencord-StickyNotes)** — Vencord plugin for sticky notes on Discord users
- **[vencord-friendgroups](https://github.com/vSake-clean/vencord-friendgroups)** — Vencord plugin to group friends in the DM sidebar

If you like this project, consider leaving a ⭐ — it really helps!
