const { Events } = require('discord.js');
const { syncAllCalendars, checkCachedEvents } = require('../services/googleCalendar');

const SYNC_INTERVAL_MINUTES = 60;
const CHECK_INTERVAL_MINUTES = 5;

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}!`);

        try {
            console.log('Bot started. Initial sync with Google Calendar...');
            await syncAllCalendars(client);
            console.log('Initial sync complete.');
            checkCachedEvents(client);
        } catch (error) {
            console.error('Failed to perform initial sync:', error);
        }

        setInterval(() => syncAllCalendars(client), SYNC_INTERVAL_MINUTES * 60 * 1000);
        setInterval(() => checkCachedEvents(client), CHECK_INTERVAL_MINUTES * 60 * 1000);
    },
};