import {NeonCity} from "./NeonCity.js";
export class TrackManager {
 constructor(scene){this.scene=scene;this.track=null;}
 load(name="NEON CITY"){this.track=new NeonCity(this.scene);return this.track;}
}