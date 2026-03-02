const music = document.getElementById("music");

let unlocked = false;
let muted = false;
let fadeTimer = null;
let targetVol = 0.40;

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
  if (muted) fadeTo(0.0, 0.04, 50);
  else fadeTo(targetVol, 0.02, 80);
}

export function pauseOnHidden(){
  document.addEventListener("visibilitychange", () => {
    if (!unlocked) return;
    if (document.hidden) music.pause();
    else if (!muted) music.play().catch(()=>{});
  });
}
