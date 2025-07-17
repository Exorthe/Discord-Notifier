const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, '..', '..', 'users.json');

const readDb = () => {
    try {
        const data = fs.readFileSync(DB_PATH);
        return data.length > 0 ? JSON.parse(data) : {};
    } catch (error) {
        throw error;
    }
};

const writeDb = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

module.exports = { readDb, writeDb };