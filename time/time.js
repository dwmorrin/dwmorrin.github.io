const container = document.createElement("div");
container.classList.add("time");
document.body.appendChild(container);

setInterval(updateTime, 1000);

function getTimeString() {
  return new Date().toLocaleString();
}

function updateTime() {
  container.textContent = getTimeString();
}