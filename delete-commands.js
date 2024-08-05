require("dotenv").config();
const { REST, Routes } = require("discord.js");
const { CLIENT_ID, DEV_GUILD_ID, DISCORD_TOKEN } = process.env;

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(DISCORD_TOKEN);

// and deploy your commands!
rest.put(Routes.applicationGuildCommands(CLIENT_ID, DEV_GUILD_ID), { body: [] })
	.then(() => console.log('Successfully deleted all guild commands.'))
	.catch(console.error);

// for global commands
rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] })
	.then(() => console.log('Successfully deleted all application commands.'))
	.catch(console.error);
