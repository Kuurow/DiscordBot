# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start the bot
node index.js

# Register slash commands with Discord (run after adding/changing commands)
node deploy-commands.js

# Remove all registered slash commands
node delete-commands.js

# Lint
npx eslint .
```

No build step — the project runs as plain JavaScript via Node.js.

## Environment

Requires a `.env` file with:

- `DISCORD_TOKEN` — bot token
- `CLIENT_ID` — Discord application/client ID
- `GUILDID` — dev server guild ID (for guild-scoped command deployment)

## Architecture

**Entry point:** [index.js](index.js) — dynamically loads all commands from `commands/` subdirectories and all events from `events/`, then connects to Discord.

**Command loading:** Each file in `commands/**/*.js` must export `data` (a `SlashCommandBuilder`) and `execute(interaction)`. Optionally exports `autocomplete(interaction)`.

**Interaction routing:** [events/interactionCreate.js](events/interactionCreate.js) dispatches:

- Slash commands → matching command's `execute()`
- Autocomplete → matching command's `autocomplete()`
- Button clicks → only `viewer_close` (deletes the message)
- Select menus (`isStringSelectMenu`) → `op_tab:`, `skill_level:`, `outfit_select:`, `module_select:` route to `tabViewer`; `recruit_class:`, `recruit_trait:` route to handlers exported from `recruitSim.js`

**Handlers:** `handlers/` contains only [handlers/tabViewer.js](handlers/tabViewer.js), which powers `/op` with a persistent header + tabbed select menu. All operator display goes through this file.

**Data:** [constants.json](constants.json) holds Arknights API base URLs and game-specific mappings (professions, rarities, etc.). Operator data is fetched at runtime from the external Arknights API.

**Utils:**
- [utils/messagesUtils.js](utils/messagesUtils.js) — HTML stripping, range/blackboard resolution helpers
- [utils/itemCache.js](utils/itemCache.js) — lazy item name cache; `resolveCosts(costs)` turns `[{id, count}]` into `["Nx Name"]`
- [utils/recruitCache.js](utils/recruitCache.js) — lazy recruit pool cache; `getRecruitPool()` returns `[{id, name, rarity, tags[], avatarId}]`. Tags are lowercased and augmented: profession (`gameConsts.professions`) adds class tag (e.g. `guard`), rarity adds `starter` (≤TIER_2), `senior` (≥TIER_5), `top` (TIER_6).
- [utils/emojiCache.js](utils/emojiCache.js) — application emoji map; `ensureEmojisLoaded(client)` fetches once per session, `getOperatorEmoji(operatorId)` returns the emoji string or `''`. Refreshed by `/setup-emojis`.

## Slash Commands

### `/op` — Operator Info ([commands/arknights/operatorTab.js](commands/arknights/operatorTab.js))

Main operator command. Autocomplete via `GET /operator/match/:input?limit=6` (min 2 chars). Renders a persistent header (avatar, name, class, rarity, trait, range) with a `StringSelectMenu` to switch tabs: **Stats**, **Talents**, **Skills**, **Base Skills**, **Outfits**, **Modules**. Powered by [handlers/tabViewer.js](handlers/tabViewer.js).

### `/recruit` — Recruitment Simulator ([commands/arknights/recruitSim.js](commands/arknights/recruitSim.js))

No arguments. Shows two `StringSelectMenu`s (multi-select): **Class & Special** (12 tags) and **Role & Stat** (17 tags). Selecting from either menu immediately updates the view with results grouped by guaranteed rarity (6★ → 4★). 6★ operators excluded from any combo that doesn't include `top`. Falls back to 1-tag results if no combo guarantees 4★+.

State is encoded as bitmasks in the `customId` (`recruit_class:<traitMask>`, `recruit_trait:<classMask>`) so each menu knows the other's current selection. Handlers exported from the command file and imported directly in `interactionCreate.js`.

### `/refresh-commands` — Hot-reload commands ([commands/utility/refreshCommands.js](commands/utility/refreshCommands.js))

Owner-only (checks `application.owner.id`). Re-scans all command files and re-registers them globally via REST — same as running `deploy-commands.js` but from within Discord. Reply is ephemeral.

### `/ping`, `/server` — Utility stubs ([commands/utility/](commands/utility/))

Simple demo commands.

## Handlers

Select custom IDs encode state as colon-separated segments: `<prefix>:<operatorId>`.

All select handlers call `deferUpdate()` (edits in-place). The `viewer_close` button deletes the message inline in `interactionCreate.js`.

**Tab viewer** ([handlers/tabViewer.js](handlers/tabViewer.js)) — the only handler, powers `/op`

- `op_tab:<id>` — switches the active tab (Stats / Talents / Skills / Base Skills / Outfits / Modules)
- `skill_level:<id>` — switches the displayed level across all skills (Lv.1 → M3)
- `outfit_select:<id>` — switches the displayed outfit/skin
- `module_select:<id>` — switches the displayed module (index stored as the select value)

Internal helper `renderTab(interaction, operatorId, tab, subIndex)` centralises the fetch + editReply pattern used by all three select handlers.

Tab content system: tab functions return either a `string` (stats, talents) or a `[{type, component}]` array (skills, bases, outfits) for rich component layouts. `buildComponents` handles both via a `typeof tabContent === 'string'` check. Supported types in the array: `section`, `text`, `separator`, `actionrow`, `media`.

Skin labeling: `getSkinLabel(skins, index)` — first `skinName === null` entry → `"Default"`, second → `"Elite 2"`, others use `skinName`.

## API Docs

Detailed field-level schemas are in [docs/api-operator-schema.md](docs/api-operator-schema.md). Add a new file there each time a new endpoint is explored.

## HellaAPI Reference

Base URL: `https://awedtan.ca/api` (stored in `constants.json` as `paths.apiUrl`)

### Query modes

| Pattern | Description |
| --- | --- |
| `/{resource}` | All documents |
| `/{resource}/{key}` | Exact key match |
| `/{resource}/match/{key}?limit=N` | Substring search (used for autocomplete) |
| `/{resource}/search?{field}={value}` | Field filtering (supports `>=`, `<=`) |
| `/{resource}/searchv2?filter={...}` | Advanced filtering (`eq`, `ne`, `gt`, `in`, `nin`) |

Query params available on all routes: `include`, `exclude`, `sort`, `limit`

### Resources

| Endpoint | Content |
| --- | --- |
| `/operator` | Operator stats, skills, talents, skins, range |
| `/range` | Range grid by ID — used to resolve `skill.excel.levels[i].rangeId` |
| `/skill` | Skill data by skill ID |
| `/item` | Item data — used by `itemCache.js` to resolve material names |
| `/stage` | Normal stages by ID or code |
| `/toughstage` | Challenge mode stages |
| `/enemy` | Enemy data |
| `/define` | In-game term definitions |
| `/cc` / `/ccb` | Contingency Contract seasons |
| `/rogue` | Integrated Strategies content |
| `/sandbox` | Reclamation Algorithm content |
| `/recruitpool` | Currently recruitable operators |
| `/new` | Recently added data |
| `/about` | API metadata |

### Response envelope

```json
{
  "_id": "string",
  "meta": {},
  "canon": "canonical-key",
  "keys": ["key1", "key2"],
  "value": {}
}
```

Operator data is at `response.data.value`. Operator ID used in select custom IDs comes from `value.id`.

### Asset URLs

Operator images are served from `paths.awedtanAssetUrl` (`https://raw.githubusercontent.com/Awedtan/HellaAssets/main`):

- Avatar: `/operator/avatars/{avatarId}.png`
- Full art: `/operator/arts/{portraitId}.png` — encode `#` as `%23`
- Skill icon: `/operator/skills/skill_icon_{iconId ?? skillId}.png` — encode `[` as `%5B`, `]` as `%5D`
- Base skill icon: `/operator/bases/{skillIcon}.png`
- Module icon: `/operator/modules/{uniEquipId}.png`

## Code Style

- Tab indentation, single quotes
- Stroustrup brace style (`} else {` on new line)
- ESLint v10 flat config ([eslint.config.js](eslint.config.js)) is authoritative
- CommonJS throughout (`require` / `module.exports`) — do not use ES module `export` syntax
