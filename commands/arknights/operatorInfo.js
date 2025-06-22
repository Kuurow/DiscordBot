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
const { buildRangeString, stripHTMLTags, buildOperatorProfession } = require('../../utils/messagesUtils');


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
		// list builder for autocompletion
		const userInputValue = interaction.options.getFocused().toLowerCase();

		if (userInputValue.length >= 2) {
			// console.log(`User's input : ${userInputValue}`);
			const matchedOperators = await axios.get(
				`${paths.apiUrl}/operator/match/${userInputValue}?limit=6`,
			);
			const responseMap = [];

			matchedOperators.data.forEach((opData) => {
				responseMap.push({ id: opData.value.id, name: opData.value.data.name });
			});

			await interaction.respond(responseMap.map((op) => ({ name: op.name, value: op.id })));
		}
	},
	async execute(interaction) {
		const operatorInput = interaction.options.getString('name').toLowerCase() ?? 'amiya';
		await interaction.deferReply();

		try {
			const response = await axios.get(`${paths.apiUrl}/operator/${operatorInput}`);
			const operator = response.data.value;

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
									`${stripHTMLTags(operator.data.description)}`,
								),
							),
					)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							'**Range**\n' + buildRangeString(operator.range),
						),
					)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							'**Appearance**',
						),
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
								.setStyle(ButtonStyle.Link)
								.setLabel('Arknights Website')
								.setEmoji({
									name: '👀',
								})
								.setURL('https://www.arknights.global/'),
							new ButtonBuilder()
								.setStyle(ButtonStyle.Link)
								.setLabel('More')
								.setEmoji({
									name: 'TerraIcon',
									id: '1386336969436434444',
								})
								.setURL(`https://arknights.wiki.gg/wiki/${operator.data.name.replace(/\s+/g, '_')}`),
						),
					),
			];

			await interaction.editReply({
				components: components,
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
