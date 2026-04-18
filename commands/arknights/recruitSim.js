const {
	SlashCommandBuilder,
	MessageFlags,
	ContainerBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	ActionRowBuilder,
	StringSelectMenuBuilder,
} = require('discord.js');
const { gameConsts } = require('../../constants.json');
const { getRecruitPool } = require('../../utils/recruitCache');
const { ensureEmojisLoaded, getOperatorEmoji } = require('../../utils/emojiCache');

// Tags split into two groups to fit Discord's 25-option limit per menu
const CLASS_TAGS = ['guard', 'medic', 'vanguard', 'caster', 'sniper', 'defender', 'supporter', 'specialist', 'top', 'senior', 'starter', 'robot'];
const TRAIT_TAGS = ['healing', 'support', 'dps', 'aoe', 'slow', 'survival', 'defense', 'debuff', 'shift', 'crowd-control', 'nuker', 'summon', 'fast-redeploy', 'dp-recovery', 'elemental', 'melee', 'ranged'];

const TAG_DISPLAY = {
	top: 'Top Operator',
	senior: 'Senior Operator',
	starter: 'Starter',
	robot: 'Robot',
	'dp-recovery': 'DP-Recovery',
	'crowd-control': 'Crowd-Control',
	'fast-redeploy': 'Fast-Redeploy',
	dps: 'DPS',
	aoe: 'AoE',
};

function displayTag(tag) {
	return TAG_DISPLAY[tag] ?? (tag.charAt(0).toUpperCase() + tag.slice(1));
}

function rarityNum(rarity) {
	return (gameConsts.rarity[rarity] ?? 0) + 1;
}

// Bitmask helpers — keeps customId short (e.g. "recruit_class:42")
function encodeMask(tags, tagList) {
	let mask = 0;
	for (let i = 0; i < tagList.length; i++) {
		if (tags.includes(tagList[i])) mask |= (1 << i);
	}
	return mask;
}

function decodeMask(mask, tagList) {
	return tagList.filter((_, i) => mask & (1 << i));
}

function subsets(arr) {
	const result = [];
	for (let mask = 1; mask < (1 << arr.length); mask++) {
		result.push(arr.filter((_, i) => mask & (1 << i)));
	}
	return result;
}

async function computeCombos(selectedTags) {
	const pool = await getRecruitPool();

	const results = [];
	for (const combo of subsets(selectedTags)) {
		const includesTop = combo.includes('top');
		const matched = pool.filter(op => {
			if (!includesTop && rarityNum(op.rarity) === 6) return false;
			return combo.every(tag => op.tags.includes(tag));
		});
		if (!matched.length) continue;

		const minRarity = Math.min(...matched.map(op => rarityNum(op.rarity)));
		matched.sort((a, b) => rarityNum(b.rarity) - rarityNum(a.rarity) || a.name.localeCompare(b.name));
		results.push({ combo, matched, minRarity });
	}
	return results;
}

function buildMenus(classTags, traitTags) {
	const classMask = encodeMask(classTags, CLASS_TAGS);
	const traitMask = encodeMask(traitTags, TRAIT_TAGS);

	const classMenu = new ActionRowBuilder().addComponents(
		new StringSelectMenuBuilder()
			.setCustomId(`recruit_class:${traitMask}`)
			.setPlaceholder('Class & Special tags')
			.setMinValues(0)
			.setMaxValues(CLASS_TAGS.length)
			.addOptions(CLASS_TAGS.map(tag => ({
				label: displayTag(tag),
				value: tag,
				default: classTags.includes(tag),
			}))),
	);

	const traitMenu = new ActionRowBuilder().addComponents(
		new StringSelectMenuBuilder()
			.setCustomId(`recruit_trait:${classMask}`)
			.setPlaceholder('Role & Stat tags')
			.setMinValues(0)
			.setMaxValues(TRAIT_TAGS.length)
			.addOptions(TRAIT_TAGS.map(tag => ({
				label: displayTag(tag),
				value: tag,
				default: traitTags.includes(tag),
			}))),
	);

	return [classMenu, traitMenu];
}

function buildContainer(classTags, traitTags, comboResults) {
	const selectedTags = [...classTags, ...traitTags];
	const container = new ContainerBuilder();

	if (!selectedTags.length) {
		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent('## Recruitment Simulator\nSelect tags from the menus below to see operator combinations.'),
		);
	}
	else {
		const header = '## Recruitment: ' + selectedTags.map(displayTag).join(' · ');
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));
		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
		);

		let truncated = false;

		if (!comboResults.length) {
			container.addTextDisplayComponents(
				new TextDisplayBuilder().setContent('No operators found for these tags.'),
			);
		}
		else {
			const grouped = new Map();
			for (const result of comboResults) {
				const key = result.combo.length;
				if (!grouped.has(key)) grouped.set(key, []);
				grouped.get(key).push(result);
			}

			const sortedSizes = [...grouped.keys()].sort((a, b) => b - a);

			for (const size of sortedSizes) {
				const group = grouped.get(size);
				group.sort((a, b) => a.combo.join().localeCompare(b.combo.join()));

				const sizeLabel = size === 1 ? '**1-tag results**' : `**${size}-tag combinations**`;
				let chunk = sizeLabel + '\n';

				for (const { combo, matched, minRarity } of group) {
					const tagLabel = combo.map(displayTag).join(' + ');
					const minStars = '★'.repeat(minRarity);
					const prefix = `**${tagLabel}** (${minStars}) → `;
					let opList = '';
					let shown = 0;
					for (const op of matched) {
						const emoji = getOperatorEmoji(op.id);
						const entry = emoji ? `${emoji} ${op.name}` : op.name;
						const sep = opList ? ', ' : '';
						if (prefix.length + opList.length + sep.length + entry.length > 3500) break;
						opList += sep + entry;
						shown++;
					}
					const remaining = matched.length - shown;
					if (remaining > 0) truncated = true;
					const extra = remaining > 0 ? ` *(+${remaining} more)*` : '';
					const line = `${prefix}${opList}${extra}\n\n`;

					if (chunk.length + line.length > 3800) {
						container.addTextDisplayComponents(new TextDisplayBuilder().setContent(chunk.trimEnd()));
						chunk = '';
					}
					chunk += line;
				}
				if (chunk) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(chunk.trimEnd()));
				container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
			}
		}

		if (truncated) {
			container.addTextDisplayComponents(
				new TextDisplayBuilder().setContent('-# Some results were trimmed to fit Discord\'s character limit.'),
			);
		}

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
		);
	}

	for (const menu of buildMenus(classTags, traitTags)) {
		container.addActionRowComponents(menu);
	}

	return [container];
}

// --- Interaction handlers ---

async function handleRecruitClass(interaction) {
	const traitMask = parseInt(interaction.customId.slice('recruit_class:'.length)) || 0;
	const classTags = interaction.values;
	const traitTags = decodeMask(traitMask, TRAIT_TAGS);

	await interaction.deferUpdate();
	try {
		await ensureEmojisLoaded(interaction.client);
		const comboResults = await computeCombos([...classTags, ...traitTags]);
		await interaction.editReply({
			components: buildContainer(classTags, traitTags, comboResults),
			flags: MessageFlags.IsComponentsV2,
		});
	}
	catch (error) {
		console.error('[recruit class select error]', error);
	}
}

async function handleRecruitTrait(interaction) {
	const classMask = parseInt(interaction.customId.slice('recruit_trait:'.length)) || 0;
	const traitTags = interaction.values;
	const classTags = decodeMask(classMask, CLASS_TAGS);

	await interaction.deferUpdate();
	try {
		await ensureEmojisLoaded(interaction.client);
		const comboResults = await computeCombos([...classTags, ...traitTags]);
		await interaction.editReply({
			components: buildContainer(classTags, traitTags, comboResults),
			flags: MessageFlags.IsComponentsV2,
		});
	}
	catch (error) {
		console.error('[recruit trait select error]', error);
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('recruit')
		.setDescription('Open the recruitment simulator'),

	async execute(interaction) {
		await interaction.deferReply();
		try {
			await interaction.editReply({
				components: buildContainer([], [], []),
				flags: MessageFlags.IsComponentsV2,
			});
		}
		catch (error) {
			console.error('[recruit execute error]', error);
			await interaction.editReply({ content: 'Failed to load recruitment simulator.' });
		}
	},

	handleRecruitClass,
	handleRecruitTrait,
};
