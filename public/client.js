const playerTagEnter = document.getElementById("playerTagEnter");
const playerTag = document.getElementById("playerTag");

playerTagEnter.addEventListener("click", () => {
  let playerTagValue = playerTag.value;
  // check if value contains # and remove it
  if (playerTagValue.includes("#")) {
    playerTagValue = playerTagValue.slice(1);
  }
  window.location.href = `/player/${playerTagValue}`;
});

window.addEventListener("keydown", (e) => {
  if (e.repeat) return;

  if (e.key === "Enter") {
    let playerTagValue = playerTag.value;
    // check if value contains # and remove it
    if (playerTagValue.includes("#")) {
      playerTagValue = playerTagValue.slice(1);
    }
    window.location.href = `/player/${playerTagValue}`;
  }
});

// get input change in playerTag and transform all the text to uppercase
playerTag.addEventListener("input", () => {
  playerTag.value = playerTag.value.toUpperCase();
});
