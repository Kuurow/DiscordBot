const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Provides information about the user.'),
	async execute(interaction) {
		const user = interaction.user;
		const client = interaction.client.user;
		console.log('');
		console.log(user);
		console.log('');
		console.log(client);

		const embedMessage = new EmbedBuilder()
			.setColor('#D5672C')
			.setTitle(`*${user.globalName}*'s information`)
			.setAuthor({ name: `${client.username}`, iconURL: `${client.avatarURL()}`, url: null })
			.setDescription(`There is everything you need to know about ${user.globalName}`)
			.setThumbnail(user.avatarURL())
			.addFields(
				{ name: 'title', value: 'value', inline: false },
			)
			.setFooter({ text: 'footer', iconURL: 'https://i.imgur.com/wSTFkRM.png' });

		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		// await interaction.reply(embed);
		await interaction.reply({ embeds : [embedMessage] });
	},
};