const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { paths } = require('../../constants.json');
const { getRecruitPool } = require('../../utils/recruitCache');
const { loadEmojis } = require('../../utils/emojiCache');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup-emojis')
		.setDescription('Upload operator avatars as application emojis (owner only).'),

	async execute(interaction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const app = await interaction.client.application.fetch();
		const ownerId = app.owner?.id ?? app.owner?.ownerId;
		if (interaction.user.id !== ownerId) {
			await interaction.editReply({ content: 'You are not authorized to use this command.' });
			return;
		}

		const pool = await getRecruitPool();
		const existing = await interaction.client.application.emojis.fetch();
		const existingNames = new Set(existing.map(e => e.name));

		const toUpload = pool.filter(op => op.avatarId && !existingNames.has(op.id));

		if (!toUpload.length) {
			await loadEmojis(interaction.client);
			await interaction.editReply('All operator emojis are already uploaded!');
			return;
		}

		await interaction.editReply(`Uploading ${toUpload.length} emojis (${existingNames.size} already exist)…`);

		let uploaded = 0;
		let failed = 0;

		for (let i = 0; i < toUpload.length; i++) {
			const op = toUpload[i];
			try {
				const url = `${paths.awedtanAssetUrl}/operator/avatars/${op.avatarId}.png`;
				await interaction.client.application.emojis.create({ attachment: url, name: op.id });
				uploaded++;
			}
			catch (error) {
				console.error(`[setup-emojis] failed ${op.id}:`, error.message);
				failed++;
			}

			await new Promise(r => setTimeout(r, 1200));

			if ((i + 1) % 10 === 0 || i === toUpload.length - 1) {
				await interaction.editReply(`Uploading… ${i + 1}/${toUpload.length} (✓ ${uploaded}  ✗ ${failed})`);
			}
		}

		await loadEmojis(interaction.client);
		const skipped = pool.length - toUpload.length;
		await interaction.editReply(`Done! ✓ ${uploaded} uploaded  —  ${skipped} already existed  —  ✗ ${failed} failed.`);
	},
};
