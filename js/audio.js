const music = document.getElementById("music");

let unlocked = false;
let muted = false;
let fadeTimer = null;
let targetVol = 0.40;
let visibilityTrackingStarted = false;
const pausedWhenHidden = new Set();
let screenWhenHidden = null;

function applyMuteState() {
  for (const audio of document.querySelectorAll("audio")) {
    // Muting stays effective even when scene fades change the volume.
    audio.muted = muted;
  }
}

function clearFade(){
  if (fadeTimer){
    clearInterval(fadeTimer);
    fadeTimer = null;
  }
}

function fadeTo(target, step = 0.02, everyMs = 80){
  clearFade();
  fadeTimer = setInterval(() => {
    const dir = target > music.volume ? 1 : -1;
    const next = music.volume + dir * step;

    if ((dir === 1 && next >= target) || (dir === -1 && next <= target)){
      music.volume = target;
      clearFade();
      return;
    }
    music.volume = Math.max(0, Math.min(1, next));
  }, everyMs);
}

export function isUnlocked(){ return unlocked; }
export function isMuted(){ return muted; }
export function getTargetVolume(){ return targetVol; }
export function setTargetVolume(v){
  targetVol = Math.max(0, Math.min(1, v));
  if (unlocked && !muted) fadeTo(targetVol);
}

export async function unlockAndStart() {
  if (unlocked) return true;
  try{
    music.volume = 0.0;
    await music.play(); // must be inside a user gesture
    unlocked = true;
    if (!muted) fadeTo(targetVol);
    return true;
  }catch(e){
    return false;
  }
}

export function toggleMute(){
  if (!unlocked) return;
  muted = !muted;
  applyMuteState();
}

export function pauseOnHidden(){
  if (visibilityTrackingStarted) return;
  visibilityTrackingStarted = true;
  applyMuteState();

  // Capture also covers a track started after the player selected mute.
  document.addEventListener("play", (event) => {
    if (!event.target.matches?.("audio")) return;
    event.target.muted = muted;
    if (document.hidden) {
      if (!pausedWhenHidden.size) {
        screenWhenHidden = document.querySelector(".screen.active")?.id;
      }
      pausedWhenHidden.add(event.target);
      event.target.pause();
    }
  }, true);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      screenWhenHidden = document.querySelector(".screen.active")?.id;
      for (const audio of document.querySelectorAll("audio")) {
        if (!audio.paused && !audio.ended) {
          pausedWhenHidden.add(audio);
          audio.pause();
        }
      }
      return;
    }

    // Resume only the tracks interrupted here, never the menu by default.
    const sameScreen = screenWhenHidden === document.querySelector(".screen.active")?.id;
    const tracks = [...pausedWhenHidden];
    pausedWhenHidden.clear();
    applyMuteState();
    if (!sameScreen) return;
    for (const audio of tracks) {
      if (!audio.ended) audio.play().catch(() => {});
    }
  });
}
