import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import tagsArray from "./public/meta/tags.js";
import pLimit from "p-limit";

dotenv.config();
const app = express();
const API_KEY = process.env.API_KEY;
const MAX_CONCURRENT_REQUESTS = 5; // Adjust based on your server capacity
const REQUEST_DELAY = 1000; // Delay between batches in milliseconds

// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the "public" directory
app.use(express.static("public"));
app.use(express.json({ limit: "50mb" }));

// Handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.get("/api/events", async (req, res) => {
  const response = await fetch(
    "https://api.brawlstars.com/v1/events/rotation",
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    }
  );
  const data = await response.json();

  const promises = data.map(async (event) => {
    const response = await fetch(
      `https://api.brawlapi.com/v1/maps/${event.event.id}`
    );
    const mapData = await response.json();
    return { ...event, mapData };
  });

  const eventsWithMapData = await Promise.all(promises);
  res.json(eventsWithMapData);
});

app.get("/api/ranking/global", async (req, res) => {
  const response = await fetch(
    "https://api.brawlstars.com/v1/rankings/global/players",
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    }
  );
  const data = await response.json();
  res.json(data);
});

app.post("/api/saveTags", (req, res) => {
  const newTagsArray = req.body;
  newTagsArray.tagsArray.forEach((tag) => {
    if (!tagsArray.includes(tag)) {
      fs.appendFile("public/meta/tags.txt", tag + "\n", (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send();
        }
      });
    }
  });
  res.status(200).send();
});

const fetchBattlelog = async (playerTag) => {
  try {
    const response = await fetch(
      `https://api.brawlstars.com/v1/players/%23${playerTag}/battlelog`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );
    if (!response.ok) throw new Error(`Failed to fetch data for ${playerTag}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching battlelog for ${playerTag}:`, error);
    return null; // Return null on failure
  }
};

const processTagsInBatches = async (tags) => {
  const limit = pLimit(MAX_CONCURRENT_REQUESTS);
  let results = [];

  for (let i = 0; i < tags.length; i += MAX_CONCURRENT_REQUESTS) {
    const batch = tags.slice(i, i + MAX_CONCURRENT_REQUESTS);
    const batchPromises = batch.map((tag) => limit(() => fetchBattlelog(tag)));
    const batchResults = await Promise.all(batchPromises);
    results = results.concat(batchResults);
    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY));
  }

  return results;
};

app.post("/api/battlelog", async (req, res) => {
  const { playerTags } = req.body;
  if (!Array.isArray(playerTags) || playerTags.length === 0) {
    return res.status(400).send("Invalid playerTags array");
  }

  const data = await processTagsInBatches(playerTags);
  res.json(data.filter(Boolean)); // Filter out null results
});

app.get("/api/player/:tag", async (req, res) => {
  const playerTag = req.params.tag;
  if (!playerTag) {
    return res.status(400).send("Player tag is required");
  }

  try {
    const response = await fetch(
      `https://api.brawlstars.com/v1/players/%23${playerTag}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(`Error fetching data for player ${playerTag}:`, error);
    res.status(500).send("Error fetching player data");
  }
});

app.get("/player/:tag", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "player.html"));
});

app.get("/api/club/:tag/members", async (req, res) => {
  const clubTag = req.params.tag;
  if (!clubTag) {
    return res.status(400).send("Club tag is required");
  }

  try {
    const response = await fetch(
      `https://api.brawlstars.com/v1/clubs/%23${clubTag}/members`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(`Error fetching data for club ${clubTag}:`, error);
    res.status(500).send("Error fetching club data");
  }
});

app.get("/club/:tag", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "player.html"));
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
