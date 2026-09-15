export class KeyboardControls {
  constructor(){
    this.state={accel:false,brake:false,steer:0,nitro:false}; this.keys=new Set();
    addEventListener("keydown",e=>{this.keys.add(e.code); if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault();});
    addEventListener("keyup",e=>this.keys.delete(e.code));
  }
  update(){
    this.state.accel=this.keys.has("KeyW")||this.keys.has("ArrowUp");
    this.state.brake=this.keys.has("KeyS")||this.keys.has("ArrowDown");
    this.state.steer=(this.keys.has("KeyA")||this.keys.has("ArrowLeft")?-1:0)+(this.keys.has("KeyD")||this.keys.has("ArrowRight")?1:0);
    this.state.nitro=this.keys.has("Space"); return this.state;
  }
}