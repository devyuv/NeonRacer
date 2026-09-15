export function settingsHTML(save){
 const s=save.settings;
 return `<section class="screen panel settings"><button class="back" data-action="menu">← MENU</button><h1>SETTINGS</h1>
 <label>GRAPHICS <select id="graphics"><option ${s.graphics==="LOW"?"selected":""}>LOW</option><option ${s.graphics==="MEDIUM"?"selected":""}>MEDIUM</option><option ${s.graphics==="HIGH"?"selected":""}>HIGH</option></select></label>
 <label>MUSIC <button class="toggle" data-setting="music">${s.music?"ON":"OFF"}</button></label>
 <label>SOUND EFFECTS <button class="toggle" data-setting="sfx">${s.sfx?"ON":"OFF"}</button></label>
 <label>VIBRATION <button class="toggle" data-setting="vibration">${s.vibration?"ON":"OFF"}</button></label>
 <label>CONTROL TYPE <select id="control"><option ${s.control==="TOUCH"?"selected":""}>TOUCH</option><option ${s.control==="KEYBOARD"?"selected":""}>KEYBOARD</option></select></label>
 <button class="danger" data-action="reset">RESET PROGRESS</button></section>`;
}