export function resolveCarCollision(a,b){
  const dx=a.mesh.position.x-b.mesh.position.x, dz=a.mesh.position.z-b.mesh.position.z;
  const dist=Math.hypot(dx,dz);
  if(dist<2.8 && dist>0.001){
    const nx=dx/dist,nz=dz/dist;
    a.mesh.position.x+=nx*(2.8-dist)*.55; a.mesh.position.z+=nz*(2.8-dist)*.55;
    a.speed*=.62;
    b.speed*=.94;
    return true;
  }
  return false;
}