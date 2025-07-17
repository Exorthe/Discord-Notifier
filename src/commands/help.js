const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const BOT_SERVICE_ACCOUNT = require('../../credentials.json').client_email;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows how to set up the calendar notifier.'),
    async execute(interaction) {
        const helpEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('How to Set Up Calendar Notifications')
            .addFields(
                { name: 'Step 1: Share Your Calendar', value: `Share your calendar with my service account and give it **'See all event details'** permission.\nMy email:\n\`\`\`${BOT_SERVICE_ACCOUNT}\`\`\`` },
                { name: 'Step 2: Find Your Calendar ID', value: 'In your Google Calendar settings, go to "Integrate calendar" and copy the `Calendar ID`.' },
                { name: 'Step 3: Run Setup', value: 'Use the `/setup` command with your ID.\nExample:\n`/setup calendar_id: your.email@gmail.com`' }
            );
        await interaction.reply({ embeds: [helpEmbed], flags: [MessageFlags.Ephemeral] });
    },
};