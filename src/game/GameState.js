export const STATE={MENU:"menu",COUNTDOWN:"countdown",RACING:"racing",PAUSED:"paused",RESULTS:"results"};
export class GameState {
  constructor(){this.state=STATE.MENU;this.mode="QUICK RACE";this.lap=1;this.totalLaps=3;this.time=0;this.count=3;}
  start(mode="QUICK RACE"){this.mode=mode;this.state=STATE.COUNTDOWN;this.lap=1;this.time=0;this.count=3;}
}