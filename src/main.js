import "./style.css";
import {supportsWebGL,isMobile} from "./utils/DeviceDetection.js";
import {loadSave,saveProgress,resetProgress} from "./utils/Storage.js";
import {AudioManager} from "./audio/AudioManager.js";
import {menuHTML} from "./ui/MainMenu.js";
import {garageHTML} from "./ui/Garage.js";
import {settingsHTML} from "./ui/Settings.js";
import {resultsHTML} from "./ui/Results.js";
import {Game} from "./game/Game.js";
import {STATE} from "./game/GameState.js";

const save=loadSave(), audio=new AudioManager(save);
const menu=document.getElementById("menu-root"), gameRoot=document.getElementById("game-root");
let game=null, deferredInstall=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;renderMenu();});
if("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(()=>{});

function renderMenu(){menu.innerHTML=menuHTML(save,!!deferredInstall);menu.classList.remove("hidden");gameRoot.classList.add("hidden");}
function showScreen(html){menu.innerHTML=html;menu.classList.remove("hidden");gameRoot.classList.add("hidden");}
function start(mode="QUICK RACE"){
 menu.classList.add("hidden");gameRoot.classList.remove("hidden");
 game=new Game(gameRoot,save,audio,result=>{saveProgress(save);showScreen(resultsHTML(result));},renderMenu);
 document.getElementById("pause").onclick=()=>{game.pause();};
}
menu.addEventListener("click",async e=>{
 const b=e.target.closest("button");if(!b)return;const a=b.dataset.action;
 if(a==="play")start("QUICK RACE");
 if(a==="garage")showScreen(garageHTML(save));
 if(a==="tracks")showScreen(`<section class="screen panel"><button class="back" data-action="menu">← MENU</button><h1>TRACKS</h1><div class="track-list"><button class="primary">NEON CITY <small>LIVE</small></button><button disabled>DESERT RUSH · LOCKED</button><button disabled>MOUNTAIN CIRCUIT · LOCKED</button></div></section>`);
 if(a==="settings")showScreen(settingsHTML(save));
 if(a==="how")showScreen(`<section class="screen panel"><button class="back" data-action="menu">← MENU</button><h1>HOW TO PLAY</h1><p>Accelerate with W / ↑. Steer with A/D or ←/→. Brake with S / ↓. Hold SPACE for nitro.</p><p>On mobile, use the large steering, brake and N₂ controls. Finish 3 laps ahead of the five rivals.</p><p>Stay on the road for maximum grip. Drift through fast turns and save nitro for exits.</p></section>`);
 if(a==="menu"){if(game){game.dispose();game=null;}renderMenu();}
 if(a==="retry"){if(game){game.dispose();game=null;}start();}
 if(a==="next"){if(game){game.dispose();game=null;}start();}
 if(a==="install"&&deferredInstall){deferredInstall.prompt();deferredInstall=null;renderMenu();}
 if(a==="reset"&&confirm("Reset all NEON RACER 3D progress?")){Object.assign(save,resetProgress());showScreen(settingsHTML(save));}
 const car=b.dataset.car;if(car!==undefined && save.unlockedCars.includes(["VELOCITY-X","VANTA-R","AURORA GT"][car])){save.selectedCar=Number(car);saveProgress(save);}
});
menu.addEventListener("change",e=>{
 if(e.target.id==="graphics")save.settings.graphics=e.target.value;
 if(e.target.id==="control")save.settings.control=e.target.value;
 saveProgress(save);
});
menu.addEventListener("click",e=>{
 const b=e.target.closest("[data-setting]");if(!b)return;const k=b.dataset.setting;save.settings[k]=!save.settings[k];saveProgress(save);showScreen(settingsHTML(save));
});
const loadingBar=document.getElementById("loading-bar"),loadingText=document.getElementById("loading-text");
let progress=0;const timer=setInterval(()=>{progress=Math.min(100,progress+10);loadingBar.style.width=progress+"%";loadingText.textContent=progress<40?"Preparing track...":progress<80?"Building neon city...":"Ready to race";if(progress===100){clearInterval(timer);setTimeout(()=>document.getElementById("loading-screen").remove(),250);renderMenu();}},70);
if(!supportsWebGL()){document.getElementById("loading-screen").innerHTML=`<div class="error-box"><h1>NEON RACER 3D</h1><p>Your device/browser does not support the graphics required for this game.<br>Please try a modern browser with WebGL enabled.</p></div>`;}
if(isMobile) document.body.classList.add("mobile");