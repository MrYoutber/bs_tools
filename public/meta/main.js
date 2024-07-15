window.addEventListener("DOMContentLoaded", (event) => {
  const container = document.querySelector(".container");
  const tagsArray = [];
  let matches = 0;
  let victories = 0;

  fetch("/api/ranking/global")
    .then((response) => response.json())
    .then((data) => {
      data.items.forEach((player) => {
        // get the player tag and remove the hashtag from the string
        const playerTag = player.tag.slice(1);
        tagsArray.push(playerTag);

        // get the player battlelog
        fetch("/api/battlelog", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ playerTag: playerTag }),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log(data);
            data.items.forEach((battle) => {
              matches++;
              if (
                battle.mode === "duoShowdown" ||
                battle.mode === "soloShowdown"
              ) {
                const rank = battle.rank;
                if (rank === 1) {
                  victories++;
                  battle.teams.forEach((team, index) => {
                    team.forEach((player) => {
                      if (!tagsArray.includes(player.tag)) {
                        tagsArray.push(player.tag);
                      }
                    });
                  });
                }
              }
            });
          });
      });

      // send the array to the server
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
