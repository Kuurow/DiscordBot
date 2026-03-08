const {
	ContainerBuilder,
	SectionBuilder,
	ThumbnailBuilder,
	TextDisplayBuilder,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageFlags,
} = require('discord.js');
const axios = require('axios');
const { paths } = require('../constants.json');
const { htmlToMarkdown } = require('../utils/messagesUtils');

const encodeId = (id) => id.replace(/#/g, '%23');

function buildSkinComponents(operator, index) {
	const { skins, id } = operator;
	const skin = skins[index];
	const total = skins.length;

	const skinName = skin.displaySkin.skinName ?? `${operator.data.name} (Default)`;
	const skinGroup = skin.displaySkin.skinGroupName;
	const content = skin.displaySkin.content ? htmlToMarkdown(skin.displaySkin.content) : null;

	const avatarUrl = `${paths.awedtanAssetUrl}/operator/avatars/${encodeId(skin.avatarId)}.png`;
	const portraitUrl = `${paths.awedtanAssetUrl}/operator/arts/${encodeId(skin.portraitId)}.png`;

	const headerTexts = [
		new TextDisplayBuilder().setContent(`## **${operator.data.name}**`),
		new TextDisplayBuilder().setContent(`**${skinName}**${skinGroup ? ` — ${skinGroup}` : ''}`),
	];
	if (content) headerTexts.push(new TextDisplayBuilder().setContent(content));

	return [
		new ContainerBuilder()
			.setAccentColor(5336268)
			.addSectionComponents(
				new SectionBuilder()
					.setThumbnailAccessory(new ThumbnailBuilder().setURL(avatarUrl))
					.addTextDisplayComponents(...headerTexts),
			)
			.addMediaGalleryComponents(
				new MediaGalleryBuilder().addItems(
					new MediaGalleryItemBuilder().setURL(portraitUrl),
				),
			)
			.addActionRowComponents(
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(`skin_nav:${id}:${index - 1}`)
						.setLabel('◀')
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(index === 0),
					new ButtonBuilder()
						.setCustomId(`skin_page:${id}:${index}`)
						.setLabel(`${index + 1} / ${total}`)
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(true),
					new ButtonBuilder()
						.setCustomId(`skin_nav:${id}:${index + 1}`)
						.setLabel('▶')
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(index === total - 1),
				),
			),
	];
}

async function renderSkin(interaction, operatorId, index) {
	const { data } = await axios.get(`${paths.apiUrl}/operator/${operatorId}`);
	await interaction.editReply({
		components: buildSkinComponents(data.value, index),
		flags: MessageFlags.IsComponentsV2,
	});
}

async function handleSkinOpen(interaction) {
	const operatorId = interaction.customId.slice('skin_open:'.length);
	await interaction.deferReply();
	try {
		await renderSkin(interaction, operatorId, 0);
	}
	catch (error) {
		console.error('[skinViewer open error]', error);
		await interaction.editReply({ content: 'Failed to load skins.' });
	}
}

async function handleSkinNav(interaction) {
	const [, operatorId, indexStr] = interaction.customId.split(':');
	await interaction.deferUpdate();
	try {
		await renderSkin(interaction, operatorId, parseInt(indexStr));
	}
	catch (error) {
		console.error('[skinViewer nav error]', error);
	}
}

module.exports = { handleSkinOpen, handleSkinNav };
