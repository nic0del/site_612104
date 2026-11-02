// Run: node --experimental-vm-modules --test tests/checkpoints.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const read = path => fs.readFile(new URL('../' + path, import.meta.url), 'utf8');
const storage = () => {
  const data = new Map();
  return { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) };
};
async function setup({ localStorage = storage(), sessionStorage = storage(), actualScenes = false } = {}) {
  const elements = new Map();
  function el(id) {
    if (!elements.has(id)) elements.set(id, {
      style: {}, classList: {add(){},remove(){}}, handlers: {}, value: '',
      addEventListener(name, fn) { this.handlers[name] = fn; },
      appendChild(){}, pause(){}, play: async () => {}, volume: .3,
    });
    return elements.get(id);
  }
  const window = { addEventListener(){}, confirm: () => true };
  const context = vm.createContext({console, localStorage, sessionStorage, window,
    document: {getElementById: el, createElement: () => el(Symbol()), addEventListener(){}, body:{}},
    setTimeout: fn => { queueMicrotask(fn); return 1; }, clearTimeout(){}, Map, Date });
  const modules = new Map();
  const calls = { launches: [], writes: [], engines: [], remote: null, user: 'alice', fail: false, loadFail: false };
  const stub = (id, exports) => {
    const mod = new vm.SyntheticModule(Object.keys(exports), function() {
      for (const [k,v] of Object.entries(exports)) this.setExport(k,v);
    }, {context,identifier:id});
    modules.set(id,mod);
  };
  stub('js/router.js', {showScreen: name => {calls.screen = name;}});
  stub('js/ui.js', {enableMenuBackground(){},disableMenuBackground(){}});
  stub('js/audio.js', {unlockAndStart: async()=>true,toggleMute(){},isUnlocked:()=>true,isMuted:()=>false,getTargetVolume:()=>.3,pauseOnHidden(){}});
  stub('js/chapterMap.js',{renderChapterMap: data => {calls.map = data;}});
  stub('js/bonusTexts.js',{novelBonusTexts:{},novelBonusChapters:[]});
  stub('js/supabase.js',{supabase: {
    auth:{getUser: async()=>({data:{user:{id:calls.user}}}),signInWithPassword:async()=>({})},
    from(table) { return {
      select(){return this},eq(){return this},order(){return this},limit(){return this},
      maybeSingle: async()=> table === 'profiles' ? {data:{id:calls.user}} : {data:calls.remote,error:calls.loadFail ? new Error('offline') : null},
      upsert: async row => {
        if (calls.hold) await calls.hold;
        if (calls.fail) return {error:new Error('offline')};
        calls.writes.push(row); return {};
      }
    };}
  }});
  if (!actualScenes) {
    for (const n of [1,2]) stub(`js/scenes/scene${n}.js`,{
      [`stopScene${n}`](){},
      [`startScene${n}`]: async (state,deps) => {calls.launches.push({n,state,deps});}
    });
  } else {
    stub('js/scenes/engine.js',{createSceneEngine: ({onChoice}) => {
      const engine = {map:new Map(),click:onChoice, clearTimers(){},wait:async()=>{},typeText:async()=>{},
        hideChoices(){},showChoices(){},showPanelOnly(){},clearChoices(){},transitionToImage:async()=>{},
        setChoiceMap(map){this.map=map},getChoiceMap(){return this.map}};
      // Destructured engine methods retain the engine's map.
      engine.setChoiceMap = map => {engine.map=map;};
      calls.engines.push(engine); return engine;
    }});
  }
  async function load(id) {
    if (modules.has(id)) return modules.get(id);
    const mod = new vm.SourceTextModule(await read(id), {context,identifier:id});
    modules.set(id,mod);
    await mod.link((specifier, parent) => load(new URL(specifier,'file:///' + parent.identifier).pathname.slice(1)));
    return mod;
  }
  const main = await load('js/main.js'); await main.evaluate();
  const state = modules.get('js/state.js').namespace;
  const click = id => el(id).handlers.click();
  const login = async () => {el('email').value='a@b.test';el('password').value='test';await click('btnSubmitLogin');};
  const settle = async () => { for(let i=0;i<100;i++) await Promise.resolve(); };
  return {state,calls,click,login,settle,el,modules,localStorage,sessionStorage,window};
}

test('guest resumes chapter 2 and its effects after a full reload; new game clears both chapters',async()=>{
  const a=await setup(); await a.click('btnGuest');
  Object.assign(a.state.playerState,{activeChapter:'scene2',familyAnchor:3,seenFamily:true,
    scene1:{currentNodeId:'old'},scene2:{currentNodeId:'ch2_v2_vornic_screen',choices:{ch2_v1_empty_desk:'desk_family'},flags:{done:true}}});
  a.state.unlockNovelChapter('chapter1'); a.state.savePlayerState();
  const b=await setup(a); await b.click('btnGuest'); await b.click('btnStart');
  assert.equal(b.calls.launches.at(-1).n,2);
  assert.equal(b.state.playerState.familyAnchor,3);
  assert.equal(b.state.playerState.scene2.choices.ch2_v1_empty_desk,'desk_family');
  await b.click('btnNewGame');
  assert.equal(b.calls.launches.at(-1).n,1);
  assert.equal(b.state.playerState.scene2,undefined);
  assert.equal(b.state.playerState.seenFamily,false);
  assert.equal(b.state.isNovelChapterUnlocked('chapter1'),true);
});

test('accounts are isolated; cloud restores the full chapter 2 checkpoint',async()=>{
  const a=await setup();
  a.calls.remote={updated_at:'2026-01-01T00:00:00Z',player_state:{activeChapter:'scene2',scene2:{currentNodeId:'ch2_v2_vornic_screen'},stress:2}};
  await a.login();await a.click('btnStart');await a.settle();
  assert.equal(a.calls.launches.at(-1).n,2);
  assert.equal(a.state.playerState.stress,2);
  a.calls.user='bob';a.calls.remote=null;await a.login();
  assert.equal(a.state.playerState.scene2,undefined);
  assert.equal(a.state.playerState.stress,0);
  a.calls.user='alice';await a.login();
  assert.equal(a.state.playerState.stress,2);
});

test('cloud writes are serialized snapshots and a failure does not block subsequent writes',async()=>{
  const a=await setup();await a.login();
  let release;a.calls.hold=new Promise(r=>{release=r;});
  const first=a.window.saveGame('one',{stress:1});
  const mutable={stress:2};const second=a.window.saveGame('two',mutable);mutable.stress=5;
  await a.settle();assert.equal(a.calls.writes.length,0);
  release();await Promise.all([first,second]);
  assert.deepEqual(a.calls.writes.map(r=>[r.scene_text,r.player_state.stress]),[['one',1],['two',2]]);
  a.calls.fail=true;await assert.rejects(a.window.saveGame('fail',{}));
  a.calls.fail=false;await a.window.saveGame('retry',{});
  assert.equal(a.calls.writes.at(-1).scene_text,'retry');
});

test('failed cloud load leaves login visible and does not overwrite remote data',async()=>{
  const a=await setup();a.calls.loadFail=true;await a.login();
  assert.equal(a.calls.writes.length,0);
  assert.equal(a.el('loginMsg').textContent,'offline');
});

test('real chapter 2 choice saves destination, history and effects once, then resumes that destination',async()=>{
  const a=await setup({actualScenes:true});await a.click('btnGuest');
  a.state.playerState.activeChapter='scene2';
  a.state.playerState.scene2={currentNodeId:'ch2_v1_empty_desk'};
  const scene=a.modules.get('js/scenes/scene2.js').namespace;
  await scene.startScene2(a.state.playerState,{onStateChange:()=>a.state.savePlayerState()});
  const engine=a.calls.engines[1];
  engine.click('desk_family');engine.click('desk_family');await a.settle();
  const saved=JSON.parse(a.sessionStorage.getItem('save_612104_playerState'));
  assert.equal(saved.scene2.currentNodeId,'ch2_v2_vornic_screen');
  assert.equal(saved.scene2.choices.ch2_v1_empty_desk,'desk_family');
  const family=saved.familyAnchor;
  a.state.startGuestSession();
  await scene.startScene2(a.state.playerState,{onStateChange:()=>a.state.savePlayerState()});
  assert.equal(a.state.playerState.familyAnchor,family);
  assert.equal(a.state.playerState.scene2.currentNodeId,'ch2_v2_vornic_screen');
});

test('newer local account checkpoint survives an older cloud save',async()=>{
  const a=await setup();
  a.localStorage.setItem('save_612104_playerState:alice',JSON.stringify({savedAt:'2026-02-02T00:00:00Z',activeChapter:'scene2',stress:4,scene2:{currentNodeId:'ch2_v2_vornic_screen'}}));
  a.calls.remote={updated_at:'2026-02-01T00:00:00Z',player_state:{stress:1}};
  await a.login();await a.click('btnStart');await a.settle();
  assert.equal(a.state.playerState.stress,4);
  assert.equal(a.calls.writes.at(-1).player_state.stress,4);
});

test('chapter 1 onEnter effects are not reapplied on resume',async()=>{
  const a=await setup({actualScenes:true});await a.click('btnGuest');
  const scene=a.modules.get('js/scenes/scene1.js').namespace;
  const map=scene.getChapter1MapData();
  const entry=Object.entries(map.nodes).find(([,node])=>node.onEnter);
  assert.ok(entry);
  a.state.playerState.scene1={currentNodeId:entry[0]};
  await scene.startScene1(a.state.playerState,{onStateChange:()=>a.state.savePlayerState()});
  const before=JSON.stringify(a.state.playerState);
  await scene.startScene1(a.state.playerState,{onStateChange:()=>a.state.savePlayerState()});
  assert.equal(JSON.stringify(a.state.playerState),before);
});

test('stopping chapter 2 while beforeRender is pending prevents stale choices',async()=>{
  const a=await setup({actualScenes:true});await a.click('btnGuest');
  const scene=a.modules.get('js/scenes/scene2.js').namespace;
  a.state.playerState.scene2={currentNodeId:'ch2_v1_empty_desk'};
  let release;const hold=new Promise(r=>{release=r;});
  const started=scene.startScene2(a.state.playerState,{beforeRender:()=>hold});
  await a.settle();scene.stopScene2();release();await started;
  assert.equal(a.calls.engines[1].map.size,0);
});
