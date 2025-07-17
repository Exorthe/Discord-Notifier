const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { readDb, writeDb } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Sets up your Google Calendar for notifications.')
        .addStringOption(option =>
            option.setName('calendar_id')
                .setDescription('The ID of your Google Calendar.')
                .setRequired(true)),
    async execute(interaction) {
        const calendarId = interaction.options.getString('calendar_id');
        const db = readDb();
        db[interaction.user.id] = { calendarId: calendarId };
        writeDb(db);
        await interaction.reply({ 
            content: `I will now watch calendar \`${calendarId}\` and send you DMs. Please ensure you have shared it with me!`, 
            flags: [MessageFlags.Ephemeral] 
        });
    },
};