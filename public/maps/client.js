window.addEventListener("DOMContentLoaded", (event) => {
  const container = document.querySelector(".container");

  fetch("/api/events")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      data.forEach((event) => {
        if (event.slotId <= 6) {
          if (event.event.mode === "duoShowdown") return;

          const mapContainer = document.createElement("div");
          mapContainer.className = "map-container";

          const mapInfo = document.createElement("div");
          mapInfo.className = "map-info";

          const mapName = document.createElement("p");
          mapName.className = "map-name";
          mapName.textContent = event.event.map;

          const mapMode = document.createElement("p");
          mapMode.className = "map-mode";
          if (event.event.mode === "soloShowdown")
            mapMode.textContent = "Showdown";
          else mapMode.textContent = capitalize(event.event.mode);

          const mapImg = document.createElement("img");
          mapImg.className = "map-img";
          mapImg.src = event.mapData.imageUrl;
          mapImg.width = 200;

          const isoTime = event.endTime;
          const formattedTime =
            isoTime.slice(0, 4) +
            "-" +
            isoTime.slice(4, 6) +
            "-" +
            isoTime.slice(6, 11) +
            ":" +
            isoTime.slice(11, 13) +
            ":" +
            isoTime.slice(13, 15) +
            isoTime.slice(15);
          const date = new Date(formattedTime).getTime();
          const remainingTime = document.createElement("p");
          var countdownInterval = setInterval(() => {
            const now = new Date().getTime();
            const remaining = date - now;
            if (remaining < 0) {
              clearInterval(countdownInterval);
              return;
            }
            remainingTime.className = "remaining-time";
            remainingTime.textContent =
              "Ends in: " +
              Math.floor(remaining / 1000 / 60 / 60) +
              "h " +
              Math.floor((remaining / 1000 / 60) % 60) +
              "m " +
              Math.floor((remaining / 1000) % 60) +
              "s";
            mapInfo.appendChild(remainingTime);
          }, 1000);

          mapInfo.appendChild(mapName);
          mapInfo.appendChild(mapMode);
          mapInfo.appendChild(remainingTime);

          mapContainer.appendChild(mapInfo);
          mapContainer.appendChild(mapImg);

          container.appendChild(mapContainer);

          var magImgHeight = mapImg.clientHeight;
          var mapContainerHeight = mapContainer.clientHeight;
          var desiredHeight = mapContainerHeight - magImgHeight;

          mapInfo.style.height = desiredHeight + 30 + "px";
        }
      });
    })
    .catch((error) => console.error("Error:", error));
});

function capitalize(str) {
  str = str.charAt(0).toUpperCase() + str.slice(1);
  return str.replace(/(?<!^)([A-Z])/g, " $1");
}
