export function menuHTML(save, canInstall=false){
 return `<section class="screen menu-screen"><div class="brand">NEON RACER <span>3D</span></div>
 <div class="tagline">CHASE THE LIGHT. OWN THE CIRCUIT.</div>
 <div class="menu-grid">
  <button class="primary" data-action="play">PLAY</button>
  <button data-action="garage">GARAGE</button><button data-action="tracks">TRACKS</button>
  <button data-action="settings">SETTINGS</button><button data-action="how">HOW TO PLAY</button>
  ${canInstall?'<button data-action="install">INSTALL GAME</button>':""}
 </div><div class="save-chip">COINS ${save.coins} · TROPHIES ${save.trophies}</div></section>`;
}