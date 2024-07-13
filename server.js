import dotenv from 'dotenv';
import express from 'express';
import fetch from 'node-fetch';

dotenv.config();
const app = express();
const API_KEY = process.env.API_KEY;

// Serve static files from the "public" directory
app.use(express.static('public'));

app.get('/api/events', async (req, res) => {
    const response = await fetch('https://api.brawlstars.com/v1/events/rotation', {
        headers: {
            'Authorization': `Bearer ${API_KEY}`
        }
    });
    const data = await response.json();
    // console.log(data);

    // Fetch additional data for each event
    const promises = data.map(async event => {
        const response = await fetch(`https://api.brawlapi.com/v1/maps/${event.event.id}`);
        const mapData = await response.json();
        return { ...event, mapData };
    });

    const eventsWithMapData = await Promise.all(promises);

    res.json(eventsWithMapData);
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
