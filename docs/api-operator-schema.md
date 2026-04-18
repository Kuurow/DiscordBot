# Operator API Schema

Base URL: `https://awedtan.ca/api`
Endpoint: `GET /operator/:id`

Response envelope: `{ _id, meta, canon, keys[], value }`

All operator data lives under `response.data.value`.

---

## Top-level fields on `value`

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Operator ID, e.g. `char_002_amiya` |
| `archetype` | string | Sub-class label, e.g. `Core Caster` |
| `data` | object | Core game data (see below) |
| `bases` | array | RIIC base skills |
| `modules` | array | Equipment modules |
| `skills` | array | Deployable skills with all levels |
| `skins` | array | All skins/outfits |
| `range` | object | Attack range grid |
| `recruit` | number | Recruitment pool index |
| `paradox` | object\|null | Paradox Simulation stage data |

---

## `value.data`

| Field | Type | Description |
| --- | --- | --- |
| `name` | string | Display name |
| `description` | string | Trait description (HTML) |
| `profession` | string | e.g. `CASTER` — mapped via `gameConsts.professions` |
| `rarity` | string | e.g. `TIER_5` — mapped via `gameConsts.rarity` |
| `tagList` | string[] | Recruitment tags |
| `phases` | array | Evolution stages (E0/E1/E2), each with `attributesKeyFrames` |
| `talents` | array | Talent slots, each with `candidates[]` (phase/pot variants) |
| `potentialRanks` | array | 5 potential upgrade bonus objects |
| `favorKeyFrames` | array | Trust stat bonuses at 0% and 100% |
| `allSkillLvlup` | array | Material costs for skill levels 1–7 |
| `itemUsage` | string\|null | Lore tagline |
| `itemDesc` | string\|null | Lore description |
| `itemObtainApproach` | string | Acquisition method |

### `data.phases[i]`

```json
{
  rangeId: string,
  maxLevel: number,
  attributesKeyFrames: [
    { level: number, data: { maxHp, atk, def, magicResistance, cost, blockCnt, ... } }
  ],
  evolveCost: [{ id, count, type }]   // null for E0
}
```

### `data.talents[i].candidates[j]`

```json
{
  unlockCondition: { phase: "PHASE_0"|"PHASE_1"|"PHASE_2", level: number },
  requiredPotentialRank: number,
  name: string,
  description: string | null  // HTML; null on some candidates
}
```

---

## `value.skills[i]`

```json
{
  excel: {
    skillId: string,
    iconId: string | null,    // null → fall back to skillId for icon filename
    levels: [
      {
        name: string,
        description: string,      // HTML with {key:format} blackboard tokens
        blackboard: [{ key, value }],
        skillType: "SKILL_USAGE_0"|"1"|"2"|"4",   // Passive/Manual/Auto
        spData: { spType, spCost, initSp, maxChargeTime },
        duration: number,  // 0 = instant/passive
        rangeId: string | null  // null = use operator base range; resolve via GET /range/:id
      }
    ],  // 7 normal levels + 3 mastery = 10 total
    levelUpCostCond: [   // 3 entries: M1, M2, M3
      {
        unlockCond: { phase: "PHASE_2", level: number },
        lvlUpTime: number,        // seconds (28800=8h, 57600=16h, 86400=24h)
        levelUpCost: [{ id, count, type }]
      }
    ]
  }
}
```

Skill icon URL: `{awedtanAssetUrl}/operator/skills/skill_icon_{iconId ?? skillId}.png` — encode `[` as `%5B` and `]` as `%5D` in the ID.

### `value.data.allSkillLvlup`

Shared upgrade costs for all skills combined (6 entries: Lv.2 through Lv.7):

```json
[
  {
    unlockCond: { phase: "PHASE_0"|"PHASE_1", level: number },
    lvlUpCost: [{ id, count, type }]   // note: lvlUpCost, not levelUpCost
  }
]
```

Item names must be resolved via `GET /item/:id` → `value.data.name`. See `utils/itemCache.js` for the in-memory cache utility.

---

## `value.bases[i]`

```json
{
  condition: {
    buffId: string,
    cond: { phase: "PHASE_0"|"PHASE_1"|"PHASE_2", level: number }
  },
  skill: {
    buffName: string,
    roomType: "CONTROL"|"DORMITORY"|"MANUFACTURE"|"TRADING"|"POWER"|"HIRE"|"MEETING",
    description: string   // HTML
  }
}
```

---

## `value.modules[i]`

```json
{
  info: {
    uniEquipId: string,
    uniEquipName: string,           // e.g. "DWDB-221E"
    typeName1: string,              // e.g. "CCR"
    typeName2: string,              // e.g. "Y"
    uniEquipDesc: string,           // lore text
    unlockEvolvePhase: "PHASE_2",   // always E2 for advanced modules
    unlockLevel: number,            // e.g. 50
    type: "INITIAL"|"ADVANCED",
    itemCost: { "1": [...], "2": [...], "3": [...] }  // upgrade materials per stage
  },
  data: {
    phases: [   // 3 stages
      {
        equipLevel: 1|2|3,
        parts: [
          {
            target: "TRAIT"|"TALENT_DATA_ONLY",
            attributeBlackboard: [{ key, value }],  // stat bonuses
            // if target === "TRAIT":
            overrideTraitDataBundle: {
              candidates: [{ additionalDescription: string, blackboard: [...] }]
            },
            // if target === "TALENT_DATA_ONLY":
            addOrOverrideTalentDataBundle: {
              candidates: [{ name: string, upgradeDescription: string, blackboard: [...] }]
              // upgradeDescription is pre-resolved plain text but may contain Arknights HTML tags — apply stripHTMLTags
            }
          }
        ]
      }
    ]
  }
}
```

### Common `attributeBlackboard` stat keys

| Key | Display |
| --- | --- |
| `max_hp` | HP |
| `atk` | ATK |
| `def` | DEF |
| `magic_resistance` | RES |
| `attack_speed` | ASPD |
| `cost` | DP Cost |
| `block_cnt` | Block |
| `respawn_time` | Redeploy Time |
| `move_speed` | Move Speed |

---

## `value.skins[i]`

```json
{
  avatarId: string,    // used in /operator/avatars/{avatarId}.png
  portraitId: string,  // used in /operator/arts/{portraitId}.png  (encode # as %23)
  displaySkin: {
    skinName: string | null,       // null = default/E2 skin; first null → "Default", second → "Elite 2"
    skinGroupName: string | null,
    content: string | null         // HTML description
  }
}
```

---

## `/recruitpool` — Recruit Pool

Endpoint: `GET /recruitpool`

Returns an array with a single document. The `value` field is an array of currently recruitable operator ID strings.

```json
[
  {
    "canon": "recruitpool",
    "value": ["char_285_medic2", "char_286_cast3", "..."]
  }
]
```

Used by `utils/recruitCache.js`. Cross-reference each ID against `GET /operator/:id` to get `value.data.name`, `value.data.rarity`, and `value.data.tagList` (recruitment tags).

---

## `/range/:id` — Range Grid

Endpoint: `GET /range/:id`

Used to resolve `skill.excel.levels[i].rangeId` when it is not null.

```json
{
  "value": {
    "id": string,
    "direction": number,
    "grids": [
      { "row": number, "col": number }
    ]
  }
}
```

`grids` is a flat list of occupied cells. Row/col are relative coordinates — row 0, col 0 is the operator's position. Positive row = up, positive col = right. Pass the full `value` object to `buildRangeString()` in [utils/messagesUtils.js](../utils/messagesUtils.js).
