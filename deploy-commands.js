require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { CLIENT_ID, DISCORD_TOKEN } = process.env;
const fs = require('node:fs');
const path = require('node:path');

const foldersPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(foldersPath).flatMap((folder) =>
	fs.readdirSync(path.join(foldersPath, folder))
		.filter((file) => file.endsWith('.js'))
		.map((file) => path.join(foldersPath, folder, file)),
);

const commands = commandFiles.flatMap((filePath) => {
	const command = require(filePath);
	if ('data' in command && 'execute' in command) return [command.data.toJSON()];
	console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	return [];
});

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(DISCORD_TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(Routes.applicationCommands(CLIENT_ID), {
			body: commands,
		});

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	}
	catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();
