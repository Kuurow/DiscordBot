const {
	ContainerBuilder,
	SectionBuilder,
	ThumbnailBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageFlags,
} = require('discord.js');
const axios = require('axios');
const { paths } = require('../constants.json');
const { stripHTMLTags, resolveBlackboard } = require('../utils/messagesUtils');

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

function levelLabel(index, total) {
	const masteryStart = total - 3;
	if (index >= masteryStart) {
		return `M${index - masteryStart + 1}`;
	}
	return `Lv.${index + 1}`;
}

function buildSkillComponents(operator, skillIndex) {
	const { skills, id } = operator;
	const skill = skills[skillIndex];
	const total = skills.length;
	const levels = skill.excel.levels;

	const maxLevel = levels[levels.length - 1];
	const activation = SKILL_ACTIVATION[maxLevel.skillType] ?? 'Manual';
	const charge = SP_CHARGE_TYPE[maxLevel.spData.spType] ?? '';

	const avatarUrl = `${paths.awedtanAssetUrl}/operator/avatars/${operator.skins[0].avatarId}.png`;

	const headerTexts = [
		new TextDisplayBuilder().setContent(`## **${operator.data.name}**`),
		new TextDisplayBuilder().setContent(
			`**${maxLevel.name}**${activation !== 'Passive' ? ` — ${activation} · ${charge}` : ''}`,
		),
	];

	const levelTexts = levels.map((level, i) => {
		const label = levelLabel(i, levels.length);
		const duration = level.duration > 0 ? ` · ${level.duration}s` : '';
		const spInfo = activation !== 'Passive'
			? ` · SP: ${level.spData.spCost} (init: ${level.spData.initSp})${duration}`
			: '';
		const description = stripHTMLTags(resolveBlackboard(level.description, level.blackboard));
		return new TextDisplayBuilder().setContent(`**${label}**${spInfo}\n${description}`);
	});

	return [
		new ContainerBuilder()
			.setAccentColor(5336268)
			.addSectionComponents(
				new SectionBuilder()
					.setThumbnailAccessory(new ThumbnailBuilder().setURL(avatarUrl))
					.addTextDisplayComponents(...headerTexts),
			)
			.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
			)
			.addTextDisplayComponents(...levelTexts)
			.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
			)
			.addActionRowComponents(
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(`skill_nav:${id}:${skillIndex - 1}`)
						.setLabel('◀')
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(skillIndex === 0),
					new ButtonBuilder()
						.setCustomId(`skill_page:${id}:${skillIndex}`)
						.setLabel(`Skill ${skillIndex + 1} / ${total}`)
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(true),
					new ButtonBuilder()
						.setCustomId(`skill_nav:${id}:${skillIndex + 1}`)
						.setLabel('▶')
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(skillIndex === total - 1),
				),
			),
	];
}

async function renderSkill(interaction, operatorId, index) {
	const { data } = await axios.get(`${paths.apiUrl}/operator/${operatorId}`);
	await interaction.editReply({
		components: buildSkillComponents(data.value, index),
		flags: MessageFlags.IsComponentsV2,
	});
}

async function handleSkillOpen(interaction) {
	const operatorId = interaction.customId.slice('skill_open:'.length);
	await interaction.deferReply();
	try {
		await renderSkill(interaction, operatorId, 0);
	}
	catch (error) {
		console.error('[skillViewer open error]', error);
		await interaction.editReply({ content: 'Failed to load skills.' });
	}
}

async function handleSkillNav(interaction) {
	const [, operatorId, indexStr] = interaction.customId.split(':');
	await interaction.deferUpdate();
	try {
		await renderSkill(interaction, operatorId, parseInt(indexStr));
	}
	catch (error) {
		console.error('[skillViewer nav error]', error);
	}
}

module.exports = { handleSkillOpen, handleSkillNav };
