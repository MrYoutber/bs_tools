import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";
import fs from "fs";

dotenv.config();
const app = express();
const API_KEY = process.env.API_KEY;

// Serve static files from the "public" directory
app.use(express.static("public"));
app.use(express.json({ limit: "50mb" }));

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
  // console.log(data);

  // Fetch additional data for each event
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
  // decode body
  const tagsArray = req.body;
  tagsArray.tagsArray.forEach((tag) => {
    // check if the file contains the tag
    fs.readFile("public/meta/tags.txt", "utf8", (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).send();
      }
      if (data.includes(tag)) {
        return;
      }
      fs.appendFile("public/meta/tags.txt", tag + "\n", (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send();
        }
      });
    });
  });
});

app.post("/api/battlelog", async (req, res) => {
  const playerTag = req.body.playerTag;
  const response = await fetch(
    `https://api.brawlstars.com/v1/players/%23${playerTag}/battlelog`,
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    }
  );
  const data = await response.json();
  res.json(data);
});

app.get("/api/tags", async (req, res) => {
  fs.readFile("public/meta/tags.txt", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send();
    }
    res.json(data.split("\n"));
  });
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
