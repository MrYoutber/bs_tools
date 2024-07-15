window.addEventListener("DOMContentLoaded", (event) => {
  const container = document.querySelector(".container");
  const tagsArray = [];
  let matches = 0;
  let victories = 0;
  let losses = 0;
  let brawlersUsed = [];

  //   fetch("/api/ranking/global")
  //     .then((response) => response.json())
  //     .then((data) => {
  //       data.items.forEach((player) => {
  //         // get the player tag and remove the hashtag from the string
  //         const playerTag = player.tag.slice(1);
  //         tagsArray.push(playerTag);

  //         // get the player battlelog
  //         fetch("/api/battlelog", {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({ playerTag: playerTag }),
  //         })
  //           .then((response) => response.json())
  //           .then((data) => {
  //             data.items.forEach((battle) => {
  //               matches++;
  //               if (
  //                 battle.mode === "duoShowdown" ||
  //                 battle.mode === "soloShowdown"
  //               ) {
  //                 const rank = battle.rank;
  //                 if (rank === 1) victories++;
  //                 else losses++;

  //                 // get the brawler used by each team
  //                 const teams = battle.teams;
  //                 teams.forEach((team, index) => {
  //                   team.forEach((player) => {
  //                     const playerTag = player.tag.slice(1);
  //                     if (!tagsArray.includes(playerTag))
  //                       tagsArray.push(playerTag);
  //                     const brawler = player.brawler.name;
  //                     if (brawlersUsed[brawler]) {
  //                       if ((index === 0) | (index === 1))
  //                         brawlersUsed[brawler].wins++;
  //                       else brawlersUsed[brawler].losses++;
  //                     } else {
  //                       if ((index === 0) | (index === 1))
  //                         brawlersUsed[brawler] = { wins: 1, losses: 0 };
  //                       else brawlersUsed[brawler] = { wins: 0, losses: 1 };
  //                     }
  //                   });
  //                 });
  //               }
  //             });
  //           });
  //       });
  //     })
  //     .then(() => {
  //       console.log("finished");
  //       // display the matches count
  //       const matchesCount = document.getElementById("matchCount");
  //       matchesCount.innerHTML = matches;

  //       // display the results
  //       const results = document.createElement("div");
  //       Object.entries(brawlersUsed).forEach(([brawler, record]) => {
  //         const brawlerDiv = document.createElement("div");
  //         const brawlerInfo = document.createElement("p");
  //         brawlerInfo.textContent = `${brawler}: Wins - ${record.wins}, Losses - ${record.losses}`;
  //         brawlerDiv.appendChild(brawlerInfo);
  //         results.appendChild(brawlerDiv);
  //       });
  //       document.querySelector(".meta").append(results);

  //       // send the array to the server
  //       fetch("/api/saveTags", {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({ tagsArray }),
  //       })
  //         .then((response) => response.text())
  //         .then((data) => {
  //           console.log(data);
  //         });
  //     });

  async function fetchRankingAndBattlelogs() {
    try {
      const rankingResponse = await fetch("/api/ranking/global");
      const rankingData = await rankingResponse.json();

      // Use Promise.all to wait for all battlelog fetches to complete
      await Promise.all(
        rankingData.items.map(async (player) => {
          const playerTag = player.tag.slice(1);
          tagsArray.push(playerTag);

          const battlelogResponse = await fetch("/api/battlelog", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ playerTag: playerTag }),
          });
          const battlelogData = await battlelogResponse.json();

          battlelogData.items.forEach((battle) => {
            matches++;
            if (
              battle.mode === "duoShowdown" ||
              battle.mode === "soloShowdown"
            ) {
              const rank = battle.rank;
              if (rank === 1) victories++;
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
            } else {
              const result = battle.result;
              if (result === "victory") victories++;
              else losses++;

              const teams = battle.teams;
              let winningTeam;
              teams.forEach((team, index) => {
                team.forEach((teamPlayer) => {
                  if (result === "victory") {
                    if (teamPlayer.tag === player.tag) {
                      winningTeam = index;
                    }
                  } else {
                    if (teamPlayer.tag === player.tag) {
                      winningTeam = index === 0 ? 1 : 0;
                    }
                  }
                });
              });
            }
          });
        })
      );
    } catch (error) {
      console.error("Failed to fetch ranking and battlelogs:", error);
    }
  }

  fetchRankingAndBattlelogs().then(() => {
    console.log("finished");

    // display the matches count
    const matchesCount = document.getElementById("matchCount");
    matchesCount.innerHTML = matches;

    // display the results
    const results = document.createElement("div");
    console.log(brawlersUsed);
    Object.entries(brawlersUsed).forEach(([brawler, record]) => {
      console.log(brawler, record);
      const brawlerDiv = document.createElement("div");
      const brawlerInfo = document.createElement("p");
      brawlerInfo.textContent = `${brawler}: Wins - ${record.wins}, Losses - ${record.losses}`;
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

function updateBrawlersOtherModes(brawlersUsed, brawler, index) {}
