const { Events } = require('discord.js');
const { checkAllCalendars } = require('../services/googleCalendar');

const CHECK_INTERVAL_MINUTES = 5;

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Logged in as ${client.user.tag}!`);
        
        checkAllCalendars(client);
        setInterval(() => checkAllCalendars(client), CHECK_INTERVAL_MINUTES * 60 * 1000);
    },
};