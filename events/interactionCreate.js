const { Events } = require('discord.js');
const { handleTabSelect, handleSkillLevelSelect, handleOutfitSelect, handleModuleSelect } = require('../handlers/tabViewer');
const { handleRecruitClass, handleRecruitTrait } = require('../commands/arknights/recruitSim');

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
				if (interaction.customId === 'viewer_close') {
					await interaction.message.delete();
				}
			}
			catch (error) {
				console.error(error);
			}
		}
		else if (interaction.isStringSelectMenu()) {
			try {
				if (interaction.customId.startsWith('op_tab:')) {
					await handleTabSelect(interaction);
				}
				else if (interaction.customId.startsWith('skill_level:')) {
					await handleSkillLevelSelect(interaction);
				}
				else if (interaction.customId.startsWith('outfit_select:')) {
					await handleOutfitSelect(interaction);
				}
				else if (interaction.customId.startsWith('module_select:')) {
					await handleModuleSelect(interaction);
				}
				else if (interaction.customId.startsWith('recruit_class:')) {
					await handleRecruitClass(interaction);
				}
				else if (interaction.customId.startsWith('recruit_trait:')) {
					await handleRecruitTrait(interaction);
				}
			}
			catch (error) {
				console.error(error);
			}
		}
	},
};
