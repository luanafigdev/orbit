/* ORBIT / representação orbital 2D acessível e esquemática.
   Períodos relativos seguem valores aproximados da NASA; posições e tamanhos NÃO são reais. */
window.ORBIT_ORBITS = (() => {
  function mount(canvas,opts){
    const ctx=canvas.getContext('2d');
    if(!ctx)return {destroy(){}};
    const images=new Map();
    for(const p of opts.planets){const img=new Image();img.src=p.imagem;images.set(p.id,img)}
    let id=0,alive=true,last=0,w=0,h=0,dpr=1,planetTargets=[];
    const seedStars=Array.from({length:155},(_,i)=>({x:fract(Math.sin(i*90.13+7)*43758.2),y:fract(Math.sin(i*63.91+8)*46384.8),r:i%7===0?1.3:.65,a:.20+(i%11)/17}));
    function fract(v){return v-Math.floor(v)}
    function resize(){
      const bounds=canvas.getBoundingClientRect();
      w=Math.max(280,bounds.width); h=Math.max(300,bounds.height);
      dpr=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    function draw(now){
      if(!alive)return;
      if(!last)last=now;
      const delta=Math.min(.07,(now-last)/1000); last=now;
      const state=opts.getState();
      if(state.orbitaRodando && !document.hidden){state.tempo+=delta*state.velocidade}
      ctx.clearRect(0,0,w,h);
      const cx=w*.50, cy=h*.54;
      const orbitBase=Math.min(w*.46,h*.77)*state.zoom;
      for(const star of seedStars){ctx.globalAlpha=star.a;ctx.fillStyle='#b6c2ff';ctx.beginPath();ctx.arc(star.x*w,star.y*h,star.r,0,Math.PI*2);ctx.fill()}
      ctx.globalAlpha=1;
      // Set of concentric, optically inclined ellipses. All radii are illustrative.
      ctx.save();ctx.translate(cx,cy);
      for(let i=7;i>=0;i--){
        const rx=orbitBase*(.14+i*.122),ry=rx*.58;
        ctx.strokeStyle='rgba(163,147,240,'+(i===7?.32:.16)+')';
        ctx.lineWidth=1;
        ctx.setLineDash(i===7?[3,6]:[]);
        ctx.beginPath();ctx.ellipse(0,0,rx,ry,-.12,0,Math.PI*2);ctx.stroke();
      }
      ctx.restore();ctx.setLineDash([]);
      const glow=ctx.createRadialGradient(cx,cy,5,cx,cy,53);
      glow.addColorStop(0,'rgba(255,235,164,1)');glow.addColorStop(.32,'rgba(255,183,64,.87)');glow.addColorStop(.65,'rgba(255,112,27,.30)');glow.addColorStop(1,'rgba(255,100,24,0)');
      ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,55,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff2c2';ctx.beginPath();ctx.arc(cx,cy,13,0,Math.PI*2);ctx.fill();
      ctx.shadowColor='#ffb45b';ctx.shadowBlur=22;ctx.fillStyle='#ffd893';ctx.beginPath();ctx.arc(cx,cy,12,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      if(state.rotulos){ctx.font='600 11px Manrope, sans-serif';ctx.fillStyle='rgba(255,211,139,.85)';ctx.textAlign='center';ctx.fillText('SOL',cx,cy+33)}
      planetTargets=[];
      // painter's algorithm: far-side bodies first
      const coordinates=opts.planets.map((p,i)=>{
        const rx=orbitBase*(.14+i*.122),ry=rx*.58;
        const turns=(state.tempo/18)*(365.2/p.ano);
        const theta=(i*1.34+turns*2*Math.PI)-.3;
        const xx=rx*Math.cos(theta),yy=ry*Math.sin(theta);
        const co=Math.cos(-.12),si=Math.sin(-.12);
        return {p,i,x:cx+xx*co-yy*si,y:cy+xx*si+yy*co,depth:Math.sin(theta)};
      }).sort((a,b)=>a.depth-b.depth);
      for(const point of coordinates){
        const {p,i,x,y}=point;const selected=p.id===state.selecionado;
        const planetR=[6,9,10,8,23,19,14,14][i]*(selected?1.16:1);
        if(selected){ctx.beginPath();ctx.arc(x,y,planetR+13,0,Math.PI*2);ctx.strokeStyle='rgba(173,135,255,.76)';ctx.lineWidth=1.8;ctx.stroke();ctx.beginPath();ctx.arc(x,y,planetR+19,0,Math.PI*2);ctx.strokeStyle='rgba(173,135,255,.23)';ctx.stroke()}
        const img=images.get(p.id);
        if(img?.complete&&img.naturalWidth){
          ctx.save();ctx.shadowColor=selected?'rgba(192,141,255,.48)':'rgba(26,74,177,.18)';ctx.shadowBlur=selected?30:11;
          ctx.drawImage(img,x-planetR,y-planetR,planetR*2,planetR*2);ctx.restore();
        }else{ctx.beginPath();ctx.arc(x,y,planetR,0,Math.PI*2);ctx.fillStyle=p.cor;ctx.fill()}
        if(p.id==='saturno'){ctx.save();ctx.translate(x,y);ctx.rotate(-.22);ctx.scale(1,.37);ctx.strokeStyle='rgba(243,212,170,.86)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,planetR*1.57,planetR*1.40,0,0,Math.PI*2);ctx.stroke();ctx.restore()}
        if(state.rotulos){ctx.font=(selected?'700':'500')+' 11px Manrope, sans-serif';ctx.textAlign='center';ctx.fillStyle=selected?'#f7e8ff':'rgba(230,234,255,.83)';ctx.shadowColor='#000';ctx.shadowBlur=7;ctx.fillText(p.nome,x,y+planetR+17);ctx.shadowBlur=0}
        planetTargets.push({id:p.id,x,y,r:Math.max(16,planetR+7)});
      }
      id=requestAnimationFrame(draw);
    }
    function onClick(e){const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*w/r.width,y=(e.clientY-r.top)*h/r.height;let nearest=null,min=Infinity;
      for(const p of planetTargets){let d=Math.hypot(x-p.x,y-p.y);if(d<p.r+8&&d<min){nearest=p;min=d}}
      if(nearest)opts.onSelect(nearest.id)
    }
    function onKey(e){if(e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();const current=opts.planets.findIndex(p=>p.id===opts.getState().selecionado);opts.onSelect(opts.planets[(current+1)%opts.planets.length].id)}
    const obs=new ResizeObserver(resize);obs.observe(canvas);resize();canvas.addEventListener('click',onClick);canvas.addEventListener('keydown',onKey);id=requestAnimationFrame(draw);
    return {destroy(){alive=false;cancelAnimationFrame(id);obs.disconnect();canvas.removeEventListener('click',onClick);canvas.removeEventListener('keydown',onKey)}};
  }
  return {mount};
})();
