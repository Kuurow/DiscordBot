const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { paths } = require('../../constants.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get Operator\'s information')
        .addStringOption((option) =>
            option
                .setName('name')
                .setDescription('Input an operator\'s name')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    async autocomplete(interaction) { // list builder for autocompletion
        const userInputValue = interaction.options.getFocused().toLowerCase();
        
        
        if (userInputValue.length >= 2) {
            console.log(`User's input : ${userInputValue}`);
            const matchedOperators = await axios.get(`${paths.apiUrl}/operator/match/${userInputValue}?limit=6`);
            let responseMap = []; 

            matchedOperators.data.forEach(opData => {
                responseMap.push({"id": opData.value.id, "name":opData.value.data.name})
            });

            await interaction.respond(
                responseMap.map(op => ({ name: op.name, value: op.id })),
            );
        }     
    },
    async execute(interaction) {
        const client = interaction.client.user;
        const operatorInput = interaction.options.getString('name').toLowerCase() ?? 'amiya';
        console.log(operatorInput)

        await interaction.deferReply();

        try {
            const response = await axios.get(`${paths.apiUrl}/operator/${operatorInput}`);
            const operator = response.data.value;

            const embedMessage = new EmbedBuilder()
                .setColor('#D5672C')
                .setTitle(`*${operator.data.name}*'s information`)
                .setAuthor({
                    name: `${client.username}`,
                    iconURL: `${client.avatarURL()}`,
                })
                .setDescription(
                    `There is everything you need to know about the operator **${operator.data.name}**`
                )
                .setImage(`${paths.aceshipImageUrl}/characters/${operator.skins[0].portraitId}.png`)
                .setThumbnail(`${paths.aceshipImageUrl}/avatars/${operator.skins[0].avatarId}.png`)
                .addFields({ name: 'title', value: 'value', inline: false })
                .setFooter({ text: 'footer', iconURL: 'https://i.imgur.com/wSTFkRM.png' });

            await interaction.editReply({ embeds: [embedMessage] });
        } catch (error) {
            console.log(error);
            await interaction.editReply({
                content: 'An error occured with the command!',
                ephemeral: true,
            });
        }
    },
};
