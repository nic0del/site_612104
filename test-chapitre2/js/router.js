export function showScreen(name) {
  for (const el of document.querySelectorAll(".screen")) el.classList.remove("active");
  document.getElementById(`screen-${name}`).classList.add("active");
}

