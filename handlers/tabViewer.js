const {
	ContainerBuilder,
	SectionBuilder,
	ThumbnailBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	MessageFlags,
} = require('discord.js');
const axios = require('axios');
const { paths, gameConsts } = require('../constants.json');
const { buildRangeString, stripHTMLTags, buildOperatorProfession, resolveBlackboard, htmlToMarkdown } = require('../utils/messagesUtils');


const PHASE_MAP = { PHASE_0: 'E0', PHASE_1: 'E1', PHASE_2: 'E2' };

const ROOM_TYPE_MAP = {
	CONTROL: 'Control Center',
	DORMITORY: 'Dormitory',
	MANUFACTURE: 'Factory',
	TRADING: 'Trading Post',
	POWER: 'Power Plant',
	HIRE: 'Reception Room',
	MEETING: 'Reception Room',
};

const SP_CHARGE_TYPE = {
	SP_INCREASE_WHEN_ATTACK: 'On Attack',
	SP_INCREASE_WITH_TIME: 'Over Time',
	SP_INCREASE_WHEN_TAKEN_DAMAGE: 'On Hit',
};

const SKILL_ACTIVATION = {
	SKILL_USAGE_0: 'Passive',
	SKILL_USAGE_1: 'Manual',
	SKILL_USAGE_2: 'Auto',
	SKILL_USAGE_4: 'Auto',
};

const RARITY_COLORS = [10395294, 5093036, 4367861, 11225020, 16754470, 16766784];

const STAT_KEY_MAP = {
	max_hp: 'HP',
	atk: 'ATK',
	def: 'DEF',
	magic_resistance: 'RES',
	attack_speed: 'ASPD',
	cost: 'DP Cost',
	block_cnt: 'Block',
	respawn_time: 'Redeploy Time',
	move_speed: 'Move Speed',
};

function formatStatBonuses(blackboard) {
	return blackboard.map(({ key, value }) => {
		const label = STAT_KEY_MAP[key] ?? key;
		const sign = value >= 0 ? '+' : '';
		return `${label} ${sign}${value}`;
	}).join('  ·  ');
}

function levelLabel(index, total) {
	const masteryStart = total - 3;
	if (index >= masteryStart) return `M${index - masteryStart + 1}`;
	return `Lv.${index + 1}`;
}

const TAB_OPTIONS = [
	{ label: 'Stats', value: 'stats', emoji: '📊' },
	{ label: 'Talents', value: 'talents', emoji: '💡' },
	{ label: 'Skills', value: 'skills', emoji: '📖' },
	{ label: 'Base Skills', value: 'bases', emoji: '🏭' },
	{ label: 'Outfits', value: 'outfits', emoji: '🎨' },
	{ label: 'Modules', value: 'modules', emoji: '🔩' },
];

// --- Tab content builders ---

function trust(bonus) {
	return bonus > 0 ? ` **(+${bonus})**` : '';
}

function tabStats(operator) {
	const maxPhase = operator.data.phases[operator.data.phases.length - 1];
	const stats = maxPhase.attributesKeyFrames[maxPhase.attributesKeyFrames.length - 1].data;
	const phaseLabel = ['E0', 'E1', 'E2'][operator.data.phases.length - 1];
	const t = operator.data.favorKeyFrames[operator.data.favorKeyFrames.length - 1].data;
	const position = operator.data.position === 'MELEE' ? '🗡️ Melee' : '🏹 Ranged';
	const interval = stats.baseAttackTime > 0 ? `⚡ Interval: ${stats.baseAttackTime}s` : null;
	const redeploy = stats.respawnTime > 0 ? `⏱️ Redeploy: ${stats.respawnTime}s` : null;
	const infoLine = [position, interval, redeploy].filter(Boolean).join('  ·  ');
	return [
		infoLine,
		'',
		operator.data.itemUsage ?? '',
		operator.data.itemDesc ?? '',
		'',
		`**Talents**`,
		...operator.data.talents.flatMap((talent) => {
			const top = talent.candidates?.[talent.candidates.length - 1];
			if (!top?.name) return [];
			return [`**${top.name}**\n${top.description ? stripHTMLTags(top.description) : ''}\n`];
		}),
		`**Potentials**`,
		...operator.data.potentialRanks.map((p) => p.description).filter(Boolean),
		'',
		`**Max Stats (${phaseLabel}, + trust)**`,
		`❤️ **HP:** ${stats.maxHp}${trust(t.maxHp)}`,
		`⚔️ **ATK:** ${stats.atk}${trust(t.atk)}`,
		`🛡️ **DEF:** ${stats.def}${trust(t.def)}`,
		`✨ **RES:** ${stats.magicResistance}${trust(t.magicResistance)}`,
		`💠 **DP Cost:** ${stats.cost}`,
		`✋ **Block:** ${stats.blockCnt}`,
	].join('\n');
}

function tabTalents(operator) {
	if (!operator.data.talents?.length) return 'No talents.';
	return operator.data.talents.map((talent) => {
		const unique = talent.candidates.filter((c, i, arr) =>
			i === 0 || c.description !== arr[i - 1].description,
		);
		return unique.map((c) => {
			const phase = PHASE_MAP[c.unlockCondition.phase] ?? c.unlockCondition.phase;
			const pot = c.requiredPotentialRank > 0 ? `, Pot.${c.requiredPotentialRank + 1}` : '';
			return `**${c.name}** — ${phase} Lv.${c.unlockCondition.level}${pot}\n${c.description ? stripHTMLTags(c.description) : ''}`;
		}).join('\n');
	}).join('\n\n');
}

async function tabSkills(operator, levelIndex) {
	if (!operator.skills?.length) return [{ type: 'text', component: new TextDisplayBuilder().setContent('No skills.') }];

	const refLevels = operator.skills[0].excel.levels;
	const resolvedIndex = levelIndex ?? refLevels.length - 1;

	const skillCards = await Promise.all(operator.skills.map(async (skill) => {
		const levels = skill.excel.levels;
		const level = levels[Math.min(resolvedIndex, levels.length - 1)];
		const activation = SKILL_ACTIVATION[level.skillType] ?? 'Manual';
		const charge = SP_CHARGE_TYPE[level.spData.spType] ?? '';
		const duration = level.duration > 0 ? ` · ${level.duration}s` : '';
		const spInfo = activation !== 'Passive'
			? `\nSP: ${level.spData.spCost} (init: ${level.spData.initSp})${duration}`
			: '';
		const description = stripHTMLTags(resolveBlackboard(level.description, level.blackboard));
		const iconId = (skill.excel.iconId ?? skill.excel.skillId).replace(/\[/g, '%5B').replace(/\]/g, '%5D');
		const iconUrl = `${paths.awedtanAssetUrl}/operator/skills/skill_icon_${iconId}.png`;

		let range = operator.range;
		if (level.rangeId) {
			try {
				const { data } = await axios.get(`${paths.apiUrl}/range/${level.rangeId}`);
				range = data.value;
			}
			catch {
				// fall back to operator base range
			}
		}

		return new SectionBuilder()
			.setThumbnailAccessory(new ThumbnailBuilder().setURL(iconUrl))
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`**${level.name}**${activation !== 'Passive' ? ` — ${activation} · ${charge}` : ''}${spInfo}`,
				),
				new TextDisplayBuilder().setContent(description),
				new TextDisplayBuilder().setContent(`**Range**\n${buildRangeString(range)}`),
			);
	}));

	const items = [];
	for (let si = 0; si < skillCards.length; si++) {
		if (si > 0) items.push({ type: 'separator', component: new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true) });
		items.push({ type: 'section', component: skillCards[si] });
	}

	const levelSelect = new ActionRowBuilder().addComponents(
		new StringSelectMenuBuilder()
			.setCustomId(`skill_level:${operator.id}`)
			.setPlaceholder('Select level')
			.addOptions(
				refLevels.map((_, i) => ({
					label: levelLabel(i, refLevels.length),
					value: String(i),
					default: i === resolvedIndex,
				})),
			),
	);

	items.push({ type: 'separator', component: new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true) });
	items.push({ type: 'actionrow', component: levelSelect });
	return items;
}

function tabBases(operator) {
	if (!operator.bases?.length) return [{ type: 'text', component: new TextDisplayBuilder().setContent('No base skills.') }];
	return operator.bases.flatMap(({ condition, skill }, i, arr) => {
		const phase = PHASE_MAP[condition.cond.phase] ?? condition.cond.phase;
		const room = ROOM_TYPE_MAP[skill.roomType] ?? skill.roomType;
		const iconUrl = `${paths.awedtanAssetUrl}/operator/bases/${skill.skillIcon}.png`;
		const items = [
			{
				type: 'section',
				component: new SectionBuilder()
					.setThumbnailAccessory(new ThumbnailBuilder().setURL(iconUrl))
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							`**${skill.buffName}** — ${room} (${phase} Lv.${condition.cond.level})\n${stripHTMLTags(skill.description)}`,
						),
					),
			},
		];
		if (i < arr.length - 1) items.push({
			type: 'separator',
			component: new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
		});
		return items;
	});
}

function getSkinLabel(skins, index) {
	const skin = skins[index];
	if (skin.displaySkin.skinName) return skin.displaySkin.skinName;
	let nullCount = 0;
	for (let i = 0; i <= index; i++) {
		if (!skins[i].displaySkin.skinName) nullCount++;
	}
	return nullCount === 1 ? 'Default' : 'Elite 2';
}

function tabOutfits(operator, skinIndex) {
	if (!operator.skins?.length) return [{ type: 'text', component: new TextDisplayBuilder().setContent('No outfits.') }];

	const resolvedIndex = skinIndex ?? 0;
	const skin = operator.skins[resolvedIndex];
	const skinName = skin.displaySkin.skinName;
	const skinGroup = skin.displaySkin.skinGroupName;
	const content = skin.displaySkin.content ? htmlToMarkdown(skin.displaySkin.content) : null;
	const portraitUrl = `${paths.awedtanAssetUrl}/operator/arts/${skin.portraitId.replace(/#/g, '%23')}.png`;
	const label = getSkinLabel(operator.skins, resolvedIndex);

	const outfitSelect = new ActionRowBuilder().addComponents(
		new StringSelectMenuBuilder()
			.setCustomId(`outfit_select:${operator.id}`)
			.setPlaceholder('Select outfit')
			.addOptions(
				operator.skins.map((_, i) => ({
					label: getSkinLabel(operator.skins, i),
					value: String(i),
					default: i === resolvedIndex,
				})),
			),
	);

	const items = [
		{ type: 'media', component: new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(portraitUrl).setDescription(label)) },
	];

	if (skinName || skinGroup) {
		items.push({ type: 'text', component: new TextDisplayBuilder().setContent(`**${skinName ?? label}**${skinGroup ? ` — ${skinGroup}` : ''}`) });
	}
	if (content) {
		items.push({ type: 'text', component: new TextDisplayBuilder().setContent(content) });
	}

	items.push({ type: 'separator', component: new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true) });
	items.push({ type: 'actionrow', component: outfitSelect });
	return items;
}

function tabModules(operator, moduleIndex) {
	if (!operator.modules?.length) return 'No modules.';

	const resolvedIndex = moduleIndex ?? 0;
	const mod = operator.modules[resolvedIndex];
	const typeLabel = `${mod.info.typeName1}-${mod.info.typeName2}`;
	const header = `**${mod.info.uniEquipName}** (${typeLabel}) — E2 Lv.${mod.info.unlockLevel}`;
	const iconUrl = `${paths.awedtanAssetUrl}/operator/modules/${mod.info.uniEquipId}.png`;

	const items = [{
		type: 'section',
		component: new SectionBuilder()
			.setThumbnailAccessory(new ThumbnailBuilder().setURL(iconUrl))
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(header)),
	}];

	for (const phase of mod.data.phases) {
		const lines = [`**Stage ${phase.equipLevel}**`];
		for (const part of phase.parts) {
			if (part.attributeBlackboard?.length) {
				lines.push(formatStatBonuses(part.attributeBlackboard));
			}
			if (part.target === 'TRAIT') {
				const c = part.overrideTraitDataBundle?.candidates;
				const top = c?.[c.length - 1];
				if (top?.additionalDescription) {
					lines.push(stripHTMLTags(resolveBlackboard(top.additionalDescription, top.blackboard ?? [])));
				}
			}
			else if (part.target === 'TALENT_DATA_ONLY') {
				const c = part.addOrOverrideTalentDataBundle?.candidates;
				const top = c?.[c.length - 1];
				if (top?.name) {
					lines.push(`**${top.name}**${top.upgradeDescription ? `\n${stripHTMLTags(top.upgradeDescription)}` : ''}`);
				}
			}
		}
		items.push({ type: 'text', component: new TextDisplayBuilder().setContent(lines.join('\n')) });
	}

	const moduleSelect = new ActionRowBuilder().addComponents(
		new StringSelectMenuBuilder()
			.setCustomId(`module_select:${operator.id}`)
			.setPlaceholder('Select module')
			.addOptions(
				operator.modules.map((m, i) => ({
					label: `${m.info.uniEquipName} (${m.info.typeName1}-${m.info.typeName2})`,
					value: String(i),
					default: i === resolvedIndex,
				})),
			),
	);

	items.push({ type: 'separator', component: new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true) });
	items.push({ type: 'actionrow', component: moduleSelect });
	return items;
}

async function buildTabContent(operator, tab, subIndex = null) {
	switch (tab) {
	case 'talents': return tabTalents(operator);
	case 'skills': return await tabSkills(operator, subIndex);
	case 'bases': return tabBases(operator);
	case 'outfits': return tabOutfits(operator, subIndex);
	case 'modules': return tabModules(operator, subIndex);
	default: return tabStats(operator);
	}
}

// --- Component builders ---

function buildSelectMenu(operatorId, activeTab) {
	return new ActionRowBuilder().addComponents(
		new StringSelectMenuBuilder()
			.setCustomId(`op_tab:${operatorId}`)
			.setPlaceholder('Select a section')
			.addOptions(
				TAB_OPTIONS.map((opt) => ({
					...opt,
					default: opt.value === activeTab,
				})),
			),
	);
}

async function buildComponents(operator, tab, subIndex = null) {
	const accentColor = RARITY_COLORS[gameConsts.rarity[operator.data.rarity]] ?? 5336268;
	const avatarUrl = `${paths.awedtanAssetUrl}/operator/avatars/${operator.skins[0].avatarId}.png`;
	const profession = buildOperatorProfession(gameConsts.professions[operator.data.profession]);
	const stars = '★'.repeat(gameConsts.rarity[operator.data.rarity] + 1);

	const container = new ContainerBuilder()
		.setAccentColor(accentColor)
		.addSectionComponents(
			new SectionBuilder()
				.setThumbnailAccessory(new ThumbnailBuilder().setURL(avatarUrl))
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(`## **${operator.data.name} - ${stars}**`),
					new TextDisplayBuilder().setContent(`**${profession} · ${operator.archetype}**`),
					new TextDisplayBuilder().setContent(stripHTMLTags(operator.data.description)),
				),
		)
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`**Range**\n${buildRangeString(operator.range)}`),
		)
		.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
		);

	const tabContent = await buildTabContent(operator, tab, subIndex);

	if (typeof tabContent === 'string') {
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(tabContent));
	}
	else {
		for (const { type, component } of tabContent) {
			if (type === 'section') container.addSectionComponents(component);
			else if (type === 'text') container.addTextDisplayComponents(component);
			else if (type === 'separator') container.addSeparatorComponents(component);
			else if (type === 'actionrow') container.addActionRowComponents(component);
			else if (type === 'media') container.addMediaGalleryComponents(component);
		}
	}

	container
		.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
		)
		.addActionRowComponents(buildSelectMenu(operator.id, tab));

	return [container];
}

// --- Interaction handlers ---

async function renderTab(interaction, operatorId, tab, subIndex = null) {
	const { data } = await axios.get(`${paths.apiUrl}/operator/${operatorId}`);
	await interaction.editReply({
		components: await buildComponents(data.value, tab, subIndex),
		flags: MessageFlags.IsComponentsV2,
	});
}

async function handleTabSelect(interaction) {
	const operatorId = interaction.customId.slice('op_tab:'.length);
	await interaction.deferUpdate();
	try { await renderTab(interaction, operatorId, interaction.values[0]); }
	catch (error) { console.error('[tabViewer select error]', error); }
}

async function handleSkillLevelSelect(interaction) {
	const operatorId = interaction.customId.slice('skill_level:'.length);
	await interaction.deferUpdate();
	try { await renderTab(interaction, operatorId, 'skills', parseInt(interaction.values[0])); }
	catch (error) { console.error('[tabViewer skill level error]', error); }
}

async function handleOutfitSelect(interaction) {
	const operatorId = interaction.customId.slice('outfit_select:'.length);
	await interaction.deferUpdate();
	try { await renderTab(interaction, operatorId, 'outfits', parseInt(interaction.values[0])); }
	catch (error) { console.error('[tabViewer outfit select error]', error); }
}

async function handleModuleSelect(interaction) {
	const operatorId = interaction.customId.slice('module_select:'.length);
	await interaction.deferUpdate();
	try { await renderTab(interaction, operatorId, 'modules', parseInt(interaction.values[0])); }
	catch (error) { console.error('[tabViewer module select error]', error); }
}

module.exports = { buildComponents, handleTabSelect, handleSkillLevelSelect, handleOutfitSelect, handleModuleSelect };
