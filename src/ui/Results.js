export function resultsHTML(result){
 return `<section class="screen results"><div class="result-kicker">${result.position===1?"RACE COMPLETE":"RACE FINISHED"}</div><h1>${ordinal(result.position)} PLACE</h1>
 <div class="result-stats"><div>TIME <b>${result.time}</b></div><div>BEST LAP <b>${result.bestLap}</b></div><div>COINS <b>+${result.coins}</b></div></div>
 <div class="menu-grid"><button class="primary" data-action="next">NEXT RACE</button><button data-action="retry">RETRY</button><button data-action="garage">GARAGE</button><button data-action="menu">MAIN MENU</button></div></section>`;
}
function ordinal(n){return n===1?"1st":n===2?"2nd":n===3?"3rd":`${n}th`;}