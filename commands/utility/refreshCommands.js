const { SlashCommandBuilder, REST, Routes, MessageFlags } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { CLIENT_ID, DISCORD_TOKEN } = process.env;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('refresh-commands')
		.setDescription('Refreshes all application commands (owner only).'),
	async execute(interaction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const app = await interaction.client.application.fetch();
		const ownerId = app.owner?.id ?? app.owner?.ownerId;

		if (interaction.user.id !== ownerId) {
			await interaction.editReply({ content: 'You are not authorized to use this command.' });
			return;
		}

		const foldersPath = path.join(__dirname, '..', '..', 'commands');
		const commandFiles = fs.readdirSync(foldersPath).flatMap((folder) =>
			fs.readdirSync(path.join(foldersPath, folder))
				.filter((file) => file.endsWith('.js'))
				.map((file) => path.join(foldersPath, folder, file)),
		);

		const commands = commandFiles.flatMap((filePath) => {
			const command = require(filePath);
			if ('data' in command && 'execute' in command) return [command.data.toJSON()];
			return [];
		});

		const rest = new REST().setToken(DISCORD_TOKEN);
		const data = await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

		await interaction.editReply({ content: `Successfully refreshed ${data.length} application (/) commands.` });
	},
};
