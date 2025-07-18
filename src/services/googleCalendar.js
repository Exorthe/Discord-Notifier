const { google } = require('googleapis');
const { readDb, writeDb } = require('../utils/database');

const auth = new google.auth.GoogleAuth({
    keyFile: './credentials.json',
    scopes: 'https://www.googleapis.com/auth/calendar.readonly',
});
const calendar = google.calendar({ version: 'v3', auth });

let eventCache = {};
let notifiedEventsByUser = {};

async function syncAllCalendars(client) {
    const db = readDb();
    const usersToSync = Object.keys(db);

    if (usersToSync.length == 0) {
        eventCache = {};
        notifiedEventsByUser = {};
        return;
    }

    console.log(`Starting sync for ${usersToSync.length} user(s)...`);

    const newCache = {};
    const newNotifiedEvents = {};

    for (const userId of usersToSync) {
        try {
            const userData = db[userId];
            const now = new Date();
            const res = await calendar.events.list({
                calendarId: userData.calendarId,
                timeMin: now.toISOString(),
                timeMax: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
            });

            const upcomingEvents = res.data.items || [];
            newCache[userId] = upcomingEvents;

            if (notifiedEventsByUser[userId]) {
                const upcomingEventIds = new Set(upcomingEvents.map(e => e.id));
                const oldNotifiedIds = notifiedEventsByUser[userId];
                
                newNotifiedEvents[userId] = new Set(
                    [...oldNotifiedIds].filter(id => upcomingEventIds.has(id))
                );
            }
            console.log(`Found ${upcomingEvents.length} upcoming events for user ${userId}.`);

        } catch (error) {
            console.error(`Failed to sync calendar for user ${userId}:`, error.message);
            if (error.code == 404) {
                try {
                    const user = await client.users.fetch(userId);
                    await user.send("**Calendar Access Error!**\n\n \
                        I couldn't access your Google Calendar. Your configuration has been automatically removed. \
                        Please use `/setup` again once you've fixed the issue.");
                    console.log(`Notified user ${userId} about inaccessible calendar.`);
                } catch (dmError) {
                    console.error(`Failed to DM user ${userId} about their broken calendar configuration.`, dmError);
                }
                
                const currentDb = readDb();
                delete currentDb[userId];
                writeDb(currentDb);
                console.log(`Removed broken configuration for user ${userId}.`);
            }
        }
    }

    eventCache = newCache;
    notifiedEventsByUser = newNotifiedEvents;
    console.log('Sync complete. Caches have been refreshed and pruned.');
}

async function checkCachedEvents(client) {
    const now = new Date();
    const NOTIFICATION_WINDOW_MINUTE = 30;
    const NOTIFICATION_WINDOW_END = new Date(now.getTime() + NOTIFICATION_WINDOW_MINUTE * 60 * 1000);

    for (const userId in eventCache) {
        const userEvents = eventCache[userId];
        if (!userEvents || userEvents.length == 0) continue;

        for (const event of userEvents) {
            const start = new Date(event.start.dateTime || event.start.date);

            if (start >= now && start <= NOTIFICATION_WINDOW_END) {
                if (!notifiedEventsByUser[userId]) {
                    notifiedEventsByUser[userId] = new Set();
                }

                if (!notifiedEventsByUser[userId].has(event.id)) {
                    try {
                        const user = await client.users.fetch(userId);
                        const timeUntil = Math.round((start.getTime() - now.getTime()) / 60000);
                        const message = `**Upcoming Event in ~${timeUntil} mins!**\n\n**Event:** [${event.summary || 'No Title'}](${event.htmlLink})\n**Starts:** <t:${Math.floor(start.getTime() / 1000)}:f>`;
                        
                        await user.send(message);
                        console.log(`Sent DM to ${user.username} for event: ${event.summary}`);
                        
                        notifiedEventsByUser[userId].add(event.id);

                    } catch(error) {
                        console.error(`Failed to send DM to user ${userId}:`, error);
                    }
                }
            }
        }
    }
}

module.exports = { syncAllCalendars, checkCachedEvents };