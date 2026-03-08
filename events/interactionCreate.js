const { Events } = require('discord.js');
const { handleSkinOpen, handleSkinNav } = require('../handlers/skinViewer');
const { handleSkillOpen, handleSkillNav } = require('../handlers/skillViewer');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.user.bot) return;

		if (interaction.isChatInputCommand() || interaction.isAutocomplete()) {
			const command = interaction.client.commands.get(interaction.commandName);
			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			if (interaction.isChatInputCommand()) {
				try {
					await command.execute(interaction);
				}
				catch (error) {
					console.error(error);
					if (interaction.replied || interaction.deferred) {
						await interaction.followUp({
							content: 'There was an error while executing this command!',
							ephemeral: true,
						});
					}
					else {
						await interaction.reply({
							content: 'There was an error while executing this command!',
							ephemeral: true,
						});
					}
				}
			}
			else {
				try {
					await command.autocomplete(interaction);
				}
				catch (error) {
					console.error(error);
				}
			}
		}
		else if (interaction.isButton()) {
			try {
				if (interaction.customId.startsWith('skin_open:')) {
					await handleSkinOpen(interaction);
				}
				else if (interaction.customId.startsWith('skin_nav:')) {
					await handleSkinNav(interaction);
				}
				else if (interaction.customId.startsWith('skill_open:')) {
					await handleSkillOpen(interaction);
				}
				else if (interaction.customId.startsWith('skill_nav:')) {
					await handleSkillNav(interaction);
				}
			}
			catch (error) {
				console.error(error);
			}
		}
	},
};
