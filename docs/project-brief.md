# Arknights Discord Bot — Project Brief

This document describes a Discord bot built with Discord.js v14 for the mobile game **Arknights**. Use it as context when continuing work on this project.

---

## What this bot does

An Arknights companion bot for Discord. It pulls live data from the **HellaAPI** (`https://awedtan.ca/api`) and displays operator info, recruitment simulation, and more via slash commands.

---

## Tech stack

- **Runtime:** Node.js, plain CommonJS (`require`/`module.exports`), no build step
- **Framework:** Discord.js v14 with Components v2 (`ContainerBuilder`, `TextDisplayBuilder`, `SeparatorBuilder`, `ActionRowBuilder`, `StringSelectMenuBuilder`, `MessageFlags.IsComponentsV2`)
- **External API:** HellaAPI — `https://awedtan.ca/api` (game data) + `https://raw.githubusercontent.com/Awedtan/HellaAssets/main` (images)
- **HTTP client:** axios
- **Linter:** ESLint v10 flat config (`eslint.config.js`)
- **Code style:** tab indentation, single quotes, Stroustrup brace style

---

## Project structure

```
index.js                    Entry point — loads commands + events dynamically
deploy-commands.js          Registers slash commands with Discord
delete-commands.js          Removes all registered slash commands
constants.json              API base URLs and game data mappings (professions, rarities, etc.)

commands/
  arknights/
    operatorTab.js          /op command
    recruitSim.js           /recruit command + exported select handlers
  utility/
    refreshCommands.js      /refresh-commands (owner-only hot reload)
    setupEmojis.js          /setup-emojis (owner-only emoji uploader)
    ping.js, server.js      Stubs

events/
  interactionCreate.js      Routes all interactions (commands, selects, buttons, autocomplete)
  ready.js                  Fires on bot ready

handlers/
  tabViewer.js              Powers /op: persistent header + tab select menu

utils/
  messagesUtils.js          HTML stripping, blackboard/range resolution helpers
  itemCache.js              Lazy item name cache — resolveCosts([{id, count}]) → ["Nx Name"]
  recruitCache.js           Lazy recruit pool cache — getRecruitPool() → [{id, name, rarity, tags[], avatarId}]
  emojiCache.js             Application emoji map — getOperatorEmoji(operatorId) → emoji string or ''

docs/
  api-operator-schema.md    Field-level API schemas for each endpoint used

types/
  operator.d.ts             JSDoc type hints

bruno/                      Bruno API collection (14 request files, see below)
```

---

## Environment

`.env` file required:
```
DISCORD_TOKEN=...
CLIENT_ID=...
GUILDID=...
```

---

## Slash commands

### `/op`
Main operator lookup. Autocomplete via `GET /operator/match/:input?limit=6` (min 2 chars).

Renders a **persistent header** (avatar, name, class, rarity, trait, range) with a `StringSelectMenu` to switch tabs:
- **Stats** — base/E1/E2 stats with trust/potential selectors
- **Talents** — talent descriptions per phase
- **Skills** — all skills with level/masteries selector (`skill_level:`)
- **Base Skills** — RIIC base skills
- **Outfits** — skins with full art (`outfit_select:`)
- **Modules** — module stats and traits (`module_select:`)

Powered entirely by `handlers/tabViewer.js`. Tab functions return either a `string` or a `[{type, component}]` array for rich layouts. Supported component types: `section`, `text`, `separator`, `actionrow`, `media`.

### `/recruit`
Recruitment simulator. No arguments. Shows two multi-select `StringSelectMenu`s:
- **Class & Special** (12 tags): guard, medic, vanguard, caster, sniper, defender, supporter, specialist, top, senior, starter, robot
- **Role & Stat** (17 tags): healing, support, dps, aoe, slow, survival, defense, debuff, shift, crowd-control, nuker, summon, fast-redeploy, dp-recovery, elemental, melee, ranged

Selecting from either menu immediately rerenders results grouped by combo size (most specific first), each showing guaranteed rarity and matching operators. 6★ operators are excluded from any combo that doesn't include the `top` tag.

**State encoding:** Both menus share state via bitmasks in the `customId`:
- `recruit_class:<traitMask>` — the Class menu embeds the current Trait selection as a bitmask
- `recruit_trait:<classMask>` — the Trait menu embeds the current Class selection as a bitmask

This allows each menu's handler to reconstruct the full selection without extra storage. Handlers (`handleRecruitClass`, `handleRecruitTrait`) are exported from `recruitSim.js` and imported in `interactionCreate.js`.

**Character limit handling:** Results are capped at ~3500 chars per text block. If a combo's operator list is truncated, `*(+N more)*` is appended inline. If any truncation occurred, a `-#` subtext footer is added at the bottom ("Some results were trimmed to fit Discord's character limit.").

### `/refresh-commands`
Owner-only. Re-registers all commands globally via REST without restarting the bot. Same as running `deploy-commands.js`. Reply is ephemeral.

### `/setup-emojis`
Owner-only. Uploads operator avatars as Discord application emojis (named by operator ID). Checks existing emojis first and only uploads missing ones. 1.2s delay between uploads to avoid rate limits. Progress reported every 10 uploads. Calls `loadEmojis(client)` when done to refresh the in-memory cache.

---

## Interaction routing (`events/interactionCreate.js`)

| Trigger | Routed to |
|---|---|
| Slash command | `commands.get(name).execute(interaction)` |
| Autocomplete | `commands.get(name).autocomplete(interaction)` |
| Button `viewer_close` | Delete the message inline |
| Select `op_tab:` | `tabViewer` |
| Select `skill_level:` | `tabViewer` |
| Select `outfit_select:` | `tabViewer` |
| Select `module_select:` | `tabViewer` |
| Select `recruit_class:` | `handleRecruitClass` from `recruitSim.js` |
| Select `recruit_trait:` | `handleRecruitTrait` from `recruitSim.js` |

All select handlers call `deferUpdate()` and edit in-place.

---

## Data layer

### HellaAPI response envelope
```json
{
  "_id": "string",
  "meta": {},
  "canon": "canonical-key",
  "keys": ["key1", "key2"],
  "value": { /* actual game data */ }
}
```
Array endpoints return `response.data` as an array of these envelopes. Single-key endpoints return one envelope. Operator ID for customId state comes from `value.id`.

### Query modes
| Pattern | Description |
|---|---|
| `/{resource}/{key}` | Exact key match |
| `/{resource}/match/{key}?limit=N` | Substring search |
| `/{resource}/search?{field}={value}` | Field filtering |
| `/{resource}/searchv2?filter={...}` | Advanced filtering |

### Asset URLs (`paths.awedtanAssetUrl` = `https://raw.githubusercontent.com/Awedtan/HellaAssets/main`)
- Avatar: `/operator/avatars/{avatarId}.png`
- Full art: `/operator/arts/{portraitId}.png` — `#` must be encoded as `%23`
- Skill icon: `/operator/skills/skill_icon_{iconId ?? skillId}.png` — `[` → `%5B`, `]` → `%5D`
- Base skill icon: `/operator/bases/{skillIcon}.png`
- Module icon: `/operator/modules/{uniEquipId}.png`

### `constants.json` game mappings
- `gameConsts.professions` — `"WARRIOR"` → `"Guard"` etc.
- `gameConsts.rarity` — `"TIER_6"` → `5` (0-indexed)
- `gameConsts.qualifications` — `{starter: 0, senior: 4, top: 5}` (rarity index thresholds for special recruit tags)

### `recruitCache.js` tag augmentation
The HellaAPI `tagList` does **not** contain class or special tags. These are derived:
- Class tag: `gameConsts.professions[profession].toLowerCase()`
- `starter`: rarity index ≤ 1
- `senior`: rarity index ≥ 4
- `top`: rarity index ≥ 5 (i.e. 6★)

---

## Bruno API collection

14 request files in `bruno/`, organized by category. Environment file at `bruno/environments/HellaAPI.bru` defines: `baseUrl`, `assetUrl`, `operatorId`, `portraitId`, `skillId`, `rangeId`, `itemId`.

| Folder | Files |
|---|---|
| `bruno/Operator/` | Get Operator, Match Operator (Autocomplete), Get All Operators, Get Range |
| `bruno/Recruit/` | Get Recruit Pool, Get Item |
| `bruno/Assets/` | Operator Avatar, Operator Full Art (prescript), Skill Icon (prescript + vars), Module Icon |
| `bruno/Other/` | Get Enemy, Get Stage, Define Term, API About |

Prescripts use `bru.getEnvVar()` / `bru.setVar()` to derive `portraitId` and `skillIconId` from the operator API before the request runs.

---

## Known design decisions

- All operator display is centralised in `tabViewer.js`. Never create new standalone handler files for operator data.
- The four old standalone viewers (skinViewer, skillViewer, moduleViewer, talentViewer) were deleted — they used button navigation and were superseded by the tab system.
- Always null-guard HellaAPI fields. Many fields (`skins`, `modules`, `talents`) can be `null` or absent for lower-rarity operators.
- Top Operator exclusion: filter 6★ operators out of any combo that does not include the `top` tag. This matches in-game recruitment rules.

---

## Claude Code project skill

`.claude/commands/gen-bruno.md` defines a `/gen-bruno` skill that reads source files, finds `axios.get()` calls, and auto-generates Bruno `.bru` request files — including folder placement, seq numbering, prescript scaffolding, and mandatory `docs {}` blocks derived from `docs/api-operator-schema.md`.
