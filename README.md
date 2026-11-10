# Flock & Key

A Hebrew typing and spelling mystery for a child aged 10–12. This repository currently contains a working Hello World, not the full game.

## Run on Windows

Install Git and Node.js 24 LTS (npm included). In PowerShell:

```powershell
New-Item -ItemType Directory -Force C:\Workspace | Out-Null
Set-Location C:\Workspace
git clone --branch setup/phaser-react https://github.com/uri-shtand/flock-and-key.git
Set-Location flock-and-key
npm ci
npm run dev
```

Open http://localhost:5173. Type `דג` and press Enter: the sheep walks to the gate and a completion count is saved locally. Try another answer to see gentle feedback. Refresh to check persistence. Stop the server with Ctrl+C.

The first scaffold was prepared in a Linux cloud environment at `/workspace/flock-and-key`; it has not been installed on the user's Windows computer.

## Commands

- `npm run dev` — Vite development server with hot reload.
- `npm run typecheck` — strict TypeScript checking.
- `npm test` — learning-rule and persistence tests.
- `npm run build` — typecheck and production output in `dist/`.
- `npm run preview` — serve the production build locally.
- `npx playwright install chromium` then `npm run test:e2e` — browser integration tests.

The dev/preview server listens on all interfaces for cloud previews. For loopback only, run `npm run dev -- --host 127.0.0.1`.

## Architecture

| Path | Responsibility |
| --- | --- |
| `src/app/` | React shell and task state |
| `src/components/` | HTML inputs and Phaser lifecycle |
| `src/game/` | Phaser scenes and typed visual-command bridge |
| `src/typing/` | Pure answer and learning logic |
| `src/content/` | Data-driven challenges |
| `src/progress/` | Versioned local storage with safe fallback |
| `docs/design/` | Original Hebrew GDD, preserved as supplied |

React owns the challenge state and all keyboard/text input. Phaser draws the world and receives visual commands; global Phaser keyboard capture is disabled. Each React mount creates one game and destroys it on cleanup, including StrictMode remounts. There is no server, account, external font, remote asset or runtime AI requirement.

Phaser 4.2.1 was verified against this scaffold. All direct dependencies are pinned and `package-lock.json` is committed for reproducible installs. See [architecture notes](docs/architecture.md) and [development roadmap](docs/roadmap.md).
