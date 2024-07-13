window.addEventListener("DOMContentLoaded", (event) => {
  const container = document.querySelector(".container");

  fetch("/api/events")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      data.forEach((event, index) => {
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

        setTimeout(() => {
          var magImgHeight = mapImg.clientHeight;
          var mapContainerHeight = mapContainer.clientHeight;
          var desiredHeight = mapContainerHeight - magImgHeight;

          mapInfo.style.height = desiredHeight + 30 + "px";

          const isLastEvent = index === data.length - 1;
          if (isLastEvent) {
            adjustMapContainerHeight();
          }
        }, 500);
      });
    })
    .catch((error) => console.error("Error:", error));
});

function capitalize(str) {
  str = str.charAt(0).toUpperCase() + str.slice(1);
  return str.replace(/(?<!^)([A-Z])/g, " $1");
}

function adjustMapContainerHeight() {
  const mapImgs = document.querySelectorAll(".map-img");
  const firstImgHeight = mapImgs[0].clientHeight; // footbrawl
  const secondImgHeight = mapImgs[1].clientHeight; // showdown
  const heightDiff = firstImgHeight - secondImgHeight;
  const paddingToApply = heightDiff / 2;

  const mapInfos = document.querySelectorAll(".map-info");
  const firstInfoHeight = mapInfos[0].clientHeight;

  const heightSum = firstImgHeight + firstInfoHeight;
  const mapContainers = document.querySelectorAll(".map-container");
  mapContainers.forEach((container) => {
    container.style.height = heightSum + "px";
  });
  
  mapImgs[1].style.paddingTop = paddingToApply + "px";
  mapImgs[1].style.paddingBottom = paddingToApply + "px";
}
