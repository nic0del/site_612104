const bg = document.getElementById("bg");
const vignette = document.getElementById("vignette");

export function enableMenuBackground() {
  bg.style.backgroundImage = 'url("./assets/image_fond/menu.png")';
  bg.classList.add("on");
  vignette.classList.add("on");
}

export function disableMenuBackground() {
  bg.classList.remove("on");
  vignette.classList.remove("on");
}
