const {
	SlashCommandBuilder,
	MessageFlags,
	TextDisplayBuilder,
	ThumbnailBuilder,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	ContainerBuilder,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} = require('discord.js');
const axios = require('axios');
const { paths, gameConsts } = require('../../constants.json');
const { buildRangeString, stripHTMLTags, buildOperatorProfession, resolveBlackboard } = require('../../utils/messagesUtils');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Get Operator\'s information')
		.addStringOption((option) =>
			option
				.setName('name')
				.setDescription('Input an operator\'s name')
				.setRequired(true)
				.setAutocomplete(true),
		),
	async autocomplete(interaction) {
		const userInputValue = interaction.options.getFocused().toLowerCase();

		if (userInputValue.length < 2) {
			await interaction.respond([]);
			return;
		}

		try {
			const matchedOperators = await axios.get(
				`${paths.apiUrl}/operator/match/${userInputValue}?limit=6`,
			);

			await interaction.respond(
				matchedOperators.data.map(({ value }) => ({ name: value.data.name, value: value.id })),
			);
		}
		catch (error) {
			console.error('[autocomplete error]', error);
			await interaction.respond([]);
		}
	},
	async execute(interaction) {
		const operatorInput = interaction.options.getString('name').toLowerCase() ?? 'amiya';
		await interaction.deferReply();

		try {
			const response = await axios.get(`${paths.apiUrl}/operator/${operatorInput}`);
			const operator = response.data.value;

			// Max stats (last phase, last keyframe)
			const maxPhase = operator.data.phases[operator.data.phases.length - 1];
			const maxStats = maxPhase.attributesKeyFrames[maxPhase.attributesKeyFrames.length - 1].data;
			const statsText = [
				`❤️ **HP:** ${maxStats.maxHp}  ⚔️ **ATK:** ${maxStats.atk}  🛡️ **DEF:** ${maxStats.def}  ✨ **RES:** ${maxStats.magicResistance}`,
				`💠 **DP Cost:** ${maxStats.cost}  ✋ **Block:** ${maxStats.blockCnt}`,
			].join('\n');

			// Talents (highest unlock candidate per talent slot)
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

			const talentsText = operator.data.talents.map((talent) => {
				const top = talent.candidates[talent.candidates.length - 1];
				return `**${top.name}**\n${stripHTMLTags(top.description)}`;
			}).join('\n\n');

			// Skills at max level
			const skillsText = operator.skills.map((skill) => {
				const levels = skill.excel.levels;
				const max = levels[levels.length - 1];
				const activation = SKILL_ACTIVATION[max.skillType] ?? 'Manual';
				const charge = SP_CHARGE_TYPE[max.spData.spType] ?? '';
				const duration = max.duration > 0 ? ` · ${max.duration}s` : '';
				const spInfo = activation !== 'Passive'
					? ` — ${activation} · ${charge} · SP: ${max.spData.spCost}${duration}`
					: '';
				return `**${max.name}**${spInfo}\n${stripHTMLTags(resolveBlackboard(max.description, max.blackboard))}`;
			}).join('\n\n');

			const components = [
				new ContainerBuilder()
					.setAccentColor(5336268)
					.addSectionComponents(
						new SectionBuilder()
							.setThumbnailAccessory(
								new ThumbnailBuilder().setURL(
									`${paths.awedtanAssetUrl}/operator/avatars/${operator.skins[0].avatarId}.png`,
								),
							)
							.addTextDisplayComponents(
								new TextDisplayBuilder().setContent(
									`## **${operator.data.name}**`,
								),
								new TextDisplayBuilder().setContent(
									`**${buildOperatorProfession(gameConsts.professions[operator.data.profession])} - ${operator.archetype}\n ${'★'.repeat(gameConsts.rarity[operator.data.rarity] + 1)}**`,
								),
								new TextDisplayBuilder().setContent(
									stripHTMLTags(operator.data.description),
								),
							),
					)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							'**Range**\n' + buildRangeString(operator.range),
						),
					)
					.addSeparatorComponents(
						new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
					)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent('**Max Stats (E2)**'),
						new TextDisplayBuilder().setContent(statsText),
					)
					.addSeparatorComponents(
						new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
					)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent('**Talents**'),
						new TextDisplayBuilder().setContent(talentsText),
					)
					.addSeparatorComponents(
						new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
					)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent('**Skills**'),
						new TextDisplayBuilder().setContent(skillsText),
					)
					.addSeparatorComponents(
						new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
					)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent('**Appearance**'),
					)
					.addMediaGalleryComponents(
						new MediaGalleryBuilder().addItems(
							new MediaGalleryItemBuilder().setURL(
								`${paths.awedtanAssetUrl}/operator/arts/${operator.skins[0].portraitId}.png`,
							),
						),
					)
					.addSeparatorComponents(
						new SeparatorBuilder()
							.setSpacing(SeparatorSpacingSize.Large)
							.setDivider(true),
					)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							`### **${operator.data.name}'s details**`,
						),
						new TextDisplayBuilder().setContent(
							`${operator.data.itemUsage}\n${operator.data.itemDesc}`,
						),
					)
					.addSeparatorComponents(
						new SeparatorBuilder()
							.setSpacing(SeparatorSpacingSize.Large)
							.setDivider(true),
					)
					.addActionRowComponents(
						new ActionRowBuilder().addComponents(
							new ButtonBuilder()
								.setStyle(ButtonStyle.Secondary)
								.setLabel('Skins')
								.setEmoji({ name: '🎨' })
								.setCustomId(`skin_open:${operator.id}`),
							new ButtonBuilder()
								.setStyle(ButtonStyle.Secondary)
								.setLabel("Skills")
								.setEmoji({ name: "📖" })
								.setCustomId(`skill_open:${operator.id}`),
							new ButtonBuilder()
								.setStyle(ButtonStyle.Link)
								.setLabel('More')
								.setEmoji({ name: 'TerraIcon', id: '1386336969436434444' })
								.setURL(`https://arknights.wiki.gg/wiki/${operator.data.name.replace(/\s+/g, '_')}`),
						),
					),
			];

			await interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}
		catch (error) {
			console.log(error);
			let errMsg;
			if (error.code === 'ERR_BAD_REQUEST') {
				errMsg = 'The operator was not found!';
			}
			else {
				errMsg = 'An error occured with the command, please retry later!';
			}
			await interaction.editReply({
				content: errMsg,
			});
		}
	},
};
