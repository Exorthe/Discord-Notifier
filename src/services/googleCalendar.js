const { google } = require('googleapis');
const { readDb, writeDb } = require('../utils/database');

const auth = new google.auth.GoogleAuth({
    keyFile: './credentials.json',
    scopes: 'https://www.googleapis.com/auth/calendar.readonly',
});
const calendar = google.calendar({ version: 'v3', auth });

const NOTIFICATION_MINUTES = 30;
const notifiedEventsByUser = {};

async function checkAllCalendars(client) {
    const db = readDb();
    const users = Object.entries(db);

    if (users.length === 0) return;

    console.log(`Checking calendars for ${users.length} user(s)...`);

    for (const [userId, userData] of users) {
        try {
            const now = new Date();
            const res = await calendar.events.list({
                calendarId: userData.calendarId,
                timeMin: now.toISOString(),
                timeMax: new Date(now.getTime() + NOTIFICATION_MINUTES * 60 * 1000).toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
            });

            const events = res.data.items;
            if (!events || events.length === 0) continue;

            if (!notifiedEventsByUser[userId]) notifiedEventsByUser[userId] = new Set();
            
            const user = await client.users.fetch(userId);

            for (const event of events) {
                if (!notifiedEventsByUser[userId].has(event.id)) {
                    const start = new Date(event.start.dateTime || event.start.date);
                    if (start < now) continue;

                    const timeUntil = Math.round((start.getTime() - now.getTime()) / 60000);
                    const message = `**Upcoming Event in ~${timeUntil} mins!**\n\n**Event:** [${event.summary || 'No Title'}](${event.htmlLink})\n**Starts:** <t:${Math.floor(start.getTime() / 1000)}:f>`;
                    
                    await user.send(message);
                    console.log(`Sent DM to ${user.username} for event: ${event.summary}`);
                    
                    notifiedEventsByUser[userId].add(event.id);
                    setTimeout(() => {
                        if (notifiedEventsByUser[userId]) notifiedEventsByUser[userId].delete(event.id);
                    }, start.getTime() - now.getTime() + 60000);
                }
            }
        } catch (error) {
            console.error(`Failed to process calendar for user ${userId}:`, error.message);
            if (error.code === 404) {
                const user = await client.users.fetch(userId);
                await user.send("I couldn't access your calendar. Your configuration has been removed. Please use `/setup` again after fixing the issue.");
                const currentDb = readDb();
                delete currentDb[userId];
                writeDb(currentDb);
            }
        }
    }
}

module.exports = { checkAllCalendars };