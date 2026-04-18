const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');
const { paths } = require('../../constants.json');
const { buildComponents } = require('../../handlers/tabViewer');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('op')
		.setDescription('Get operator information with tabbed navigation')
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
			console.error('[op autocomplete error]', error);
			await interaction.respond([]);
		}
	},
	async execute(interaction) {
		await interaction.deferReply();

		try {
			const operatorInput = interaction.options.getString('name').toLowerCase();
			const { data } = await axios.get(`${paths.apiUrl}/operator/${operatorInput}`);

			await interaction.editReply({
				components: await buildComponents(data.value, 'stats'),
				flags: MessageFlags.IsComponentsV2,
			});
		}
		catch (error) {
			console.error('[op execute error]', error);
			const errMsg = error.code === 'ERR_BAD_REQUEST'
				? 'Operator not found!'
				: 'An error occurred, please try again later.';
			await interaction.editReply({ content: errMsg });
		}
	},
};
