window.addEventListener("DOMContentLoaded", (event) => {
  const container = document.querySelector(".container");
  const tagsArray = [];
  let matches = 0;
  let victories = 0;
  let losses = 0;
  let brawlersUsed = [];

  async function fetchRankingAndBattlelogs() {
    try {
      // fetch the tags from the tags.txt file
      const tagsResponse = await fetch("/api/tags");
      const tagsData = await tagsResponse.json();

      // Use Promise.all to wait for all battlelog fetches to complete
      await Promise.all(
        tagsData.map(async (tag) => {
          const playerTag = tag;
          const battlelogResponse = await fetch("/api/battlelog", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ playerTag: playerTag }),
          });
          const battlelogData = await battlelogResponse.json();

          battlelogData.items.forEach((battleContainer) => {
            const battle = battleContainer.battle;

            matches++;
            if (battle.mode === "soloShowdown") {
              const rank = battle.rank;
              if ((rank === 1) | (rank === 2)) victories++;
              else losses++;

              const teams = battle.players;
              teams.forEach((teamPlayer, index) => {
                const teamPlayerTag = teamPlayer.tag.slice(1);
                if (!tagsArray.includes(teamPlayerTag))
                  tagsArray.push(teamPlayerTag);

                const brawler = teamPlayer.brawler.name;

                updateBrawlersShowdown(brawlersUsed, brawler, index);
              });
            } else if (battle.mode === "duoShowdown") {
              const rank = battle.rank;
              if ((rank === 1) | (rank === 2)) victories++;
              else losses++;

              const teams = battle.teams;
              teams.forEach((team, index) => {
                team.forEach((teamPlayer) => {
                  const teamPlayerTag = teamPlayer.tag.slice(1);
                  if (!tagsArray.includes(teamPlayerTag))
                    tagsArray.push(teamPlayerTag);

                  const brawler = teamPlayer.brawler.name;

                  updateBrawlersShowdown(brawlersUsed, brawler, index);
                });
              });
            } else if (battle.mode !== "duels") {
              const result = battle.result;
              if (result === "victory") victories++;
              else losses++;

              const battleTeams = battle.teams;
              if (!battleTeams) {
                console.error("No teams found in battle");
                console.log(battle.mode);
                return;
              }

              let winningTeam;
              let losingTeam;
              battleTeams.forEach((team, index) => {
                team.forEach((teamPlayer) => {
                  if (result === "victory") {
                    if (teamPlayer.tag === playerTag) {
                      winningTeam = index;
                      losingTeam = index === 0 ? 0 : 1;
                    }
                  } else {
                    if (teamPlayer.tag === playerTag) {
                      winningTeam = index === 0 ? 1 : 0;
                      losingTeam = index;
                    }
                  }
                });
              });

              let winningTeamBrawlers = [];
              let losingTeamBrawlers = [];

              battleTeams.forEach((team, index) => {
                if (index === winningTeam) {
                  team.forEach((teamPlayer) => {
                    const teamPlayerTag = teamPlayer.tag.slice(1);
                    if (!tagsArray.includes(teamPlayerTag))
                      tagsArray.push(teamPlayerTag);

                    const brawler = teamPlayer.brawler.name;

                    winningTeamBrawlers.push(brawler);
                  });
                } else if (index === losingTeam) {
                  team.forEach((teamPlayer) => {
                    const teamPlayerTag = teamPlayer.tag.slice(1);
                    if (!tagsArray.includes(teamPlayerTag))
                      tagsArray.push(teamPlayerTag);

                    const brawler = teamPlayer.brawler.name;

                    losingTeamBrawlers.push(brawler);
                  });
                }
              });

              updateBrawlersOtherModes(
                brawlersUsed,
                winningTeamBrawlers,
                losingTeamBrawlers
              );
            }
          });
        })
      );
    } catch (error) {
      console.error("Failed to fetch ranking and battlelogs:", error);
    }
  }

  fetchRankingAndBattlelogs().then(async () => {
    console.log("finished");

    // display the matches count
    const matchesCount = document.getElementById("matchCount");
    matchesCount.innerHTML = matches;

    // display the results
    const results = document.createElement("div");
    console.log(brawlersUsed);
    await Object.entries(brawlersUsed).forEach(([brawler, record]) => {
      const brawlerDiv = document.createElement("div");
      const brawlerInfo = document.createElement("p");
      brawlerInfo.textContent = `${record.name}: Wins - ${record.wins}, Losses - ${record.losses}`;
      brawlerDiv.appendChild(brawlerInfo);
      results.appendChild(brawlerDiv);
    });
    const metaDiv = document.querySelector(".meta");
    metaDiv.appendChild(results);

    // send the tags array to the server
    fetch("/api/saveTags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tagsArray }),
    })
      .then((response) => response.text())
      .then((data) => {
        console.log(data);
      });
  });
});

function updateBrawlersShowdown(brawlersUsed, brawler, index) {
  let found = false;

  // Iterate over the array to find the brawler
  for (let i = 0; i < brawlersUsed.length; i++) {
    if (brawlersUsed[i].name === brawler) {
      found = true;
      if (index === 0 || index === 1) {
        brawlersUsed[i].wins++;
      } else {
        brawlersUsed[i].losses++;
      }
      break;
    }
  }

  // If the brawler is not found, add a new object
  if (!found) {
    if (index === 0 || index === 1) {
      brawlersUsed.push({ name: brawler, wins: 1, losses: 0 });
    } else {
      brawlersUsed.push({ name: brawler, wins: 0, losses: 1 });
    }
  }
}

function updateBrawlersOtherModes(
  brawlersUsed,
  winningBrawlers,
  losingBrawlers
) {
  let found = false;

  // Iterate over the array to find the brawler
  for (let i = 0; i < winningBrawlers.length; i++) {
    const brawler = winningBrawlers[i];
    for (let i = 0; i < brawlersUsed.length; i++) {
      if (brawlersUsed[i].name === brawler) {
        found = true;
        brawlersUsed[i].wins++;
        break;
      }
    }
    // If the brawler is not found, add a new object
    if (!found) {
      brawlersUsed.push({ name: brawler, wins: 1, losses: 0 });
    }
  }

  for (let i = 0; i < losingBrawlers.length; i++) {
    const brawler = losingBrawlers[i];
    for (let i = 0; i < brawlersUsed.length; i++) {
      if (brawlersUsed[i].name === brawler) {
        found = true;
        brawlersUsed[i].losses++;
        break;
      }
    }
    // If the brawler is not found, add a new object
    if (!found) {
      brawlersUsed.push({ name: brawler, wins: 0, losses: 1 });
    }
  }
}
