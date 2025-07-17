const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { readDb, writeDb } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops notifications and removes your data.'),
    async execute(interaction) {
        const db = readDb();
        if (db[interaction.user.id]) {
            delete db[interaction.user.id];
            writeDb(db);
            await interaction.reply({ content: 'You have been unsubscribed.', flags: [MessageFlags.Ephemeral] });
        } else {
            await interaction.reply({ content: 'You are not subscribed to any notifications.', flags: [MessageFlags.Ephemeral] });
        }
    },
};