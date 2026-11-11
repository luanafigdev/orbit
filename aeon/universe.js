const PI2 = Math.PI * 2;
const spiralArt = new Image();
spiralArt.src = './assets/spiral.webp';

function randomGenerator(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let n = value;
    n = Math.imul(n ^ n >>> 15, n | 1);
    n ^= n + Math.imul(n ^ n >>> 7, n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

const random = randomGenerator(46219);
const stars = Array.from({length: 850}, (_, i) => ({
  x: random(), y: random(), depth: .15 + random() * .85,
  size: .3 + random() * 1.5, phase: random() * PI2,
  hue: random(), dx: (random() - .5) * .0009,
  dy: (random() - .5) * .0008, bright: i % 27 === 0
}));
const dust = Array.from({length: 290}, () => ({
  angle: random() * PI2, radius: Math.sqrt(random()), depth: random(), speed: .15 + random() * .6,
  size: .5 + random() * 1.9, phase: random() * PI2
}));
const galaxyStars = Array.from({length: 750}, (_, i) => ({
  arm: i % 3, radius: Math.pow(random(), .68), deviation: (random() - .5) * .7,
  thickness: (random() - .5) * 1.1, size: .4 + random() * 1.3,
  hue: random(), phase: random() * PI2
}));
const webNodes = Array.from({length: 34}, (_, i) => ({
  x: .12 + random() * .84, y: .10 + random() * .8,
  mass: .5 + random(), phase: random() * PI2, index: i
}));
const webEdges = [];
webNodes.forEach((node, i) => {
  const closest = webNodes.filter((_, j) => i !== j)
    .map((other) => ({other, d: Math.hypot(node.x - other.x, node.y - other.y)}))
    .sort((a, b) => a.d - b.d).slice(0, 2);
  closest.forEach(({other, d}) => {if (i < other.index && d < .31) webEdges.push([node, other, d]);});
});

const palettes = [
  {haze: '#cc7348', core: '#e9b780', tint: '#b67e9f'},
  {haze: '#7d75c6', core: '#d2c6ff', tint: '#5e8bce'},
  {haze: '#7351b4', core: '#f0d5e0', tint: '#519ab8'},
  {haze: '#d37c4c', core: '#ffd69a', tint: '#9763cb'},
  {haze: '#6b7ccc', core: '#a8c6ff', tint: '#c3a5de'},
  {haze: '#4a5278', core: '#929ec8', tint: '#6b6c99'}
];

function glow(ctx, x, y, radius, color, intensity = .5) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, radius));
  gradient.addColorStop(0, hexAlpha(color, intensity));
  gradient.addColorStop(.28, hexAlpha(color, intensity * .36));
  gradient.addColorStop(1, hexAlpha(color, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(x-radius, y-radius, radius*2, radius*2);
}
function hexAlpha(hex, alpha) {
  const number = parseInt(hex.replace('#',''),16);
  const r = number >> 16, g = number >> 8 & 255, b = number & 255;
  return `rgba(${r},${g},${b},${Math.max(0,Math.min(1,alpha)).toFixed(3)})`;
}
function dot(ctx,x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,Math.max(.25,r),0,PI2);ctx.fill();}
function strand(ctx,x1,y1,x2,y2,color,width=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}

export class Universe {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d',{alpha:false});
    this.width = 0;
    this.height = 0;
    this.scale = 1;
    this.quality = 'auto';
    this.resize();
  }
  resize() {
    const w = innerWidth, h = innerHeight;
    const mobile = w < 700;
    const pixelRatio = Math.min(devicePixelRatio || 1, mobile ? 1.35 : 1.65);
    this.width = Math.max(1,w);
    this.height = Math.max(1,h);
    this.scale = pixelRatio;
    this.canvas.width = Math.round(w * pixelRatio);
    this.canvas.height = Math.round(h * pixelRatio);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
  }
  counts() {
    if(this.quality === 'high') return {star:740,dust:265,galaxy:690};
    if(this.quality === 'medium') return {star:450,dust:155,galaxy:410};
    if(this.quality === 'eco') return {star:180,dust:70,galaxy:180};
    return this.width < 620 ? {star:230,dust:95,galaxy:235} : {star:540,dust:210,galaxy:505};
  }
  render(time, state) {
    const ctx = this.ctx;
    if(!ctx) return;
    const w=this.width,h=this.height;
    ctx.setTransform(this.scale,0,0,this.scale,0,0);
    ctx.globalAlpha=1;
    ctx.fillStyle='#050713';
    ctx.fillRect(0,0,w,h);
    const counts=this.counts();
    const selected=state.intro ? 2 : Math.min(5,Math.floor(state.progress/100));
    const local=state.intro ? .45 : Math.min(1,(state.progress-selected*100)/100);
    const shift=state.camera || {x:0,y:0,zoom:1};
    ctx.save();
    ctx.translate(w/2+(shift.x||0),h/2+(shift.y||0));
    ctx.scale(shift.zoom||1,shift.zoom||1);
    ctx.translate(-w/2,-h/2);
    const transition=state.intro ? 0 : Math.max(0,(local-.74)/.26);
    this.drawScene(ctx,selected,local,time,state,counts,1-transition);
    if(transition>0 && selected<5) this.drawScene(ctx,selected+1,0,time,state,counts,transition);
    ctx.restore();
    if(state.intro){
      const shade=ctx.createLinearGradient(0,0,w,0);
      shade.addColorStop(0,'rgba(3,5,16,.74)');
      shade.addColorStop(.5,'rgba(3,5,16,.18)');
      shade.addColorStop(1,'rgba(3,5,16,.06)');
      ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
    }
  }
  drawScene(ctx,idx,progress,time,state,count,alpha){
    if(alpha<=0) return;
    const w=this.width,h=this.height,s=Math.min(w,h);
    ctx.save();
    ctx.globalAlpha*=alpha;
    const p=palettes[idx];
    glow(ctx,w*(idx===0?.65:.69),h*.49,s*(idx===0?.83:1.12),p.haze,idx===5?.14:.23);
    glow(ctx,w*.84,h*.14,s*.66,p.tint,idx===5?.06:.12);
    switch(idx){
      case 0:this.drawOrigin(ctx,w,h,s,progress,time,state,count);break;
      case 1:this.drawAurora(ctx,w,h,s,progress,time,state,count);break;
      case 2:this.drawWeb(ctx,w,h,s,progress,time,state,count);break;
      case 3:this.drawForge(ctx,w,h,s,progress,time,state,count);break;
      case 4:this.drawTravel(ctx,w,h,s,progress,time,state,count);break;
      case 5:this.drawFuture(ctx,w,h,s,progress,time,state,count);break;
    }
    ctx.restore();
  }
  drawField(ctx,w,h,time,state,count,opacity=1){
    const parallax=state.pointer||{x:0,y:0};
    for(let i=0;i<count;i++){
      const star=stars[i];
      let x=(star.x + (state.static?0:time*star.dx))%1;
      let y=(star.y + (state.static?0:time*star.dy))%1;
      if(x<0)x+=1;if(y<0)y+=1;
      x=x*w+parallax.x*star.depth*11;
      y=y*h+parallax.y*star.depth*8;
      const shimmer=state.static?1:.74+.26*Math.sin(time*(.3+star.depth*.55)+star.phase);
      const v=Math.min(1,(.18+.5*star.depth)*shimmer*opacity);
      const hue=star.hue>.78?'218,211,255':star.hue>.36?'192,204,240':'235,225,255';
      dot(ctx,x,y,star.size*(.57+star.depth*.65),`rgba(${hue},${v.toFixed(3)})`);
      if(star.bright && opacity>.15){
        const gl=.24*opacity;
        strand(ctx,x-5*star.depth,y,x+5*star.depth,y,`rgba(210,194,254,${gl})`,.6);
        strand(ctx,x,y-5*star.depth,x,y+5*star.depth,`rgba(210,194,254,${gl})`,.6);
      }
    }
  }
  drawOrigin(ctx,w,h,s,progress,time,state,count){
    const x=w*.68,y=h*.48;
    const intensity=(state.density??66)/100;
    glow(ctx,x,y,s*.64,'#e69a61',.34*intensity);
    glow(ctx,x,y,s*.33,'#ffdab5',.29*intensity);
    for(let i=0;i<count.dust;i++){
      const p=dust[i];
      const radius=(.09+p.radius*(.28+.18*progress))*s*(.5+intensity*.6);
      const angle=p.angle+time*.018*p.speed;
      const px=x+Math.cos(angle)*radius*1.55;
      const py=y+Math.sin(angle)*radius*.80;
      dot(ctx,px,py,p.size*(.6+p.depth*.5),`rgba(255,${Math.floor(160+p.depth*74)},${Math.floor(140+p.depth*86)},${(.15+p.depth*.49)*intensity})`);
    }
    ctx.save();ctx.translate(x,y);ctx.rotate(time*.002);
    for(let i=0;i<5;i++){
      ctx.beginPath();ctx.ellipse(0,0,s*(.12+i*.077),s*(.06+i*.042),-.25+i*.11,0,PI2);
      ctx.strokeStyle=`rgba(238,168,128,${.1*intensity/(1+i*.3)})`;ctx.lineWidth=.75;ctx.stroke();
    }ctx.restore();
    if(progress>.73)this.drawField(ctx,w,h,time,state,Math.round(count.star*.15),(progress-.73)*.6);
  }
  drawAurora(ctx,w,h,s,progress,time,state,count){
    this.drawField(ctx,w,h,time,state,Math.round(count.star*.65),.48);
    glow(ctx,w*.66,h*.53,s*.74,'#8373d4',.24);
    const total=Math.floor(15+count.dust*.32);
    const amount=Math.floor(total*(.23+(state.birth??70)/100*.75));
    for(let i=0;i<total;i++){
      const p=stars[i*4];
      const x=(.26+.71*p.x)*w,y=(.16+.70*p.y)*h;
      const pulse=.72+.28*Math.sin(time*.3+p.phase);
      const appeared=i<amount;
      if(!appeared)continue;
      glow(ctx,x,y,s*(.025+.025*p.depth),'#a2b5ff',.08*pulse);
      dot(ctx,x,y,1.3+p.size*1.7,`rgba(247,239,255,${.35+.55*pulse})`);
      if(i%9===0){strand(ctx,x-9,y,x+9,y,'rgba(218,207,255,.26)',.65);strand(ctx,x,y-9,x,y+9,'rgba(218,207,255,.26)',.65);}
    }
    if(state.sparkAt>=0){
      const elapsed=time-state.sparkAt;
      if(elapsed>0 && elapsed<4){
        const x=w*.64,y=h*.43,r=(1+elapsed)*s*.045;
        ctx.beginPath();ctx.arc(x,y,r,0,PI2);ctx.strokeStyle=`rgba(216,206,255,${.3*(1-elapsed/4)})`;ctx.lineWidth=1.3;ctx.stroke();
      }
    }
  }
  drawWeb(ctx,w,h,s,progress,time,state,count){
    this.drawField(ctx,w,h,time,state,count.star,.68);
    const strength=(state.web??72)/100;
    const parallax=state.pointer||{x:0,y:0};
    ctx.save();ctx.lineCap='round';
    for(const [a,b,d] of webEdges){
      const ax=a.x*w+parallax.x*8,ay=a.y*h+parallax.y*7;
      const bx=b.x*w+parallax.x*8,by=b.y*h+parallax.y*7;
      const wave=Math.sin(time*.13+a.index+b.index)*s*.012;
      ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo((ax+bx)/2+wave,(ay+by)/2-wave,bx,by);
      ctx.strokeStyle=`rgba(138,126,230,${(.11+.19*strength)*(1-d)})`;ctx.lineWidth=.55+strength*.7;ctx.stroke();
    }
    for(const node of webNodes){
      const x=node.x*w+parallax.x*8,y=node.y*h+parallax.y*7;
      glow(ctx,x,y,s*.08,'#aa91f2',.045*strength*node.mass);
      dot(ctx,x,y,1.5*node.mass,`rgba(215,197,255,${.3+.35*strength})`);
    }
    ctx.restore();
    this.drawGalaxy(ctx,w*.67,h*.47,s*.52,time,count.galaxy,.98);
    this.drawGalaxy(ctx,w*.26,h*.71,s*.18,time*.8,Math.round(count.galaxy*.38),.37);
  }
  drawGalaxy(ctx,x,y,r,time,count,opacity){
    ctx.save();
    glow(ctx,x,y,r*1.35,'#a58be9',.23*opacity);
    if (spiralArt.complete && spiralArt.naturalWidth) {
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(-.32 + time*.003);
      ctx.globalAlpha *= opacity*.9;
      ctx.drawImage(spiralArt,-r*1.42,-r*1.42,r*2.84,r*2.84);
      ctx.restore();
    }
    glow(ctx,x,y,r*.36,'#f4dddb',.25*opacity);
    const drift=time*.011;
    ctx.translate(x,y);ctx.rotate(-.34);
    for(let i=0;i<count;i++){
      const p=galaxyStars[i],radius=p.radius*r;
      const angle=p.arm*PI2/3 + p.radius*4.65 + p.deviation + drift*(.45+p.radius*.45);
      const px=Math.cos(angle)*radius,py=Math.sin(angle)*radius*.39+p.thickness*r*.06;
      const a=(.17+.52*(1-p.radius))*(1-.2*p.hue)*opacity;
      const col=p.hue>.62?'240,202,229':p.hue>.33?'187,167,255':'227,227,255';
      dot(ctx,px,py,p.size*(.4+.5*(1-p.radius)),`rgba(${col},${a})`);
    }
    ctx.restore();
  }
  drawForge(ctx,w,h,s,progress,time,state,count){
    this.drawField(ctx,w,h,time,state,Math.round(count.star*.72),.55);
    const x=w*.68,y=h*.49,base=s*.15;
    const colors={H:'#abd9ff',He:'#c0a3ff',C:'#ffb18b',O:'#c6daff',Fe:'#ffd18b'};
    const col=colors[state.element]||'#ffbc93';
    glow(ctx,x,y,base*3.4,col,.28);
    glow(ctx,x,y,base*1.8,'#eea178',.31);
    const core=ctx.createRadialGradient(x-base*.25,y-base*.3,base*.05,x,y,base*1.05);
    core.addColorStop(0,'#fff5e7');core.addColorStop(.26,'#ffe1b7');core.addColorStop(.65,col);core.addColorStop(1,'rgba(111,43,88,.09)');
    ctx.beginPath();ctx.arc(x,y,base,0,PI2);ctx.fillStyle=core;ctx.fill();
    for(let i=0;i<count.dust;i++){
      const p=dust[i],radius=base*(1.12+p.radius*2.8);
      const angle=p.angle + time*(.025+.08*p.speed);
      dot(ctx,x+Math.cos(angle)*radius,y+Math.sin(angle)*radius*.83,p.size*(.6+p.depth*.4),hexAlpha(col,.1+p.depth*.45));
    }
    ctx.save();ctx.translate(x,y);ctx.rotate(-.25+time*.018);
    for(let i=0;i<4;i++){
      ctx.beginPath();ctx.ellipse(0,0,base*(1.22+i*.36),base*(.43+i*.11),i*.13,0,PI2);
      ctx.strokeStyle=hexAlpha(col,.25-i*.045);ctx.lineWidth=1.1;ctx.stroke();
    }ctx.restore();
    for(let i=0;i<11;i++){
      const a=i*PI2/11+time*.011;
      const inner=base*(1.15+Math.sin(time*.2+i)*.11),outer=base*(1.63+Math.sin(time*.18+i)*.18);
      strand(ctx,x+Math.cos(a)*inner,y+Math.sin(a)*inner,x+Math.cos(a)*outer,y+Math.sin(a)*outer,hexAlpha(col,.13),1.1);
    }
  }
  drawTravel(ctx,w,h,s,progress,time,state,count){
    this.drawField(ctx,w,h,time,state,count.star,.72);
    this.drawGalaxy(ctx,w*.77,h*.46,s*.33,time*.6,Math.round(count.galaxy*.62),.64);
    this.drawGalaxy(ctx,w*.42,h*.77,s*.16,time,Math.round(count.galaxy*.2),.18);
    const from={x:w*.74,y:h*.44},to={x:w*.22,y:h*.59};
    glow(ctx,from.x,from.y,s*.23,'#bca2ff',.2);
    ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.quadraticCurveTo(w*.47,h*.19,to.x,to.y);
    ctx.strokeStyle='rgba(155,173,255,.23)';ctx.lineWidth=1.15;ctx.stroke();
    const t=(time*.13)%1;
    const px=(1-t)*(1-t)*from.x+2*(1-t)*t*w*.47+t*t*to.x;
    const py=(1-t)*(1-t)*from.y+2*(1-t)*t*h*.19+t*t*to.y;
    glow(ctx,px,py,s*.06,'#d4dcff',.17);
    dot(ctx,px,py,2.2,'rgba(247,242,255,.85)');
    if(state.pulseAt>=0){
      const elapsed=time-state.pulseAt;
      if(elapsed>=0&&elapsed<=2.8){
        const a=Math.min(1,elapsed/2.8);
        const x=(1-a)*(1-a)*from.x+2*(1-a)*a*w*.47+a*a*to.x;
        const y=(1-a)*(1-a)*from.y+2*(1-a)*a*h*.19+a*a*to.y;
        glow(ctx,x,y,s*.15,'#f6eafa',.43*(1-a*.4));
        dot(ctx,x,y,3.5,'#fff');
      }
    }
  }
  drawFuture(ctx,w,h,s,progress,time,state,count){
    const fade=state.scenario==='alternative'?.55:.3;
    this.drawField(ctx,w,h,time,state,Math.round(count.star*.62),fade);
    const spread=state.scenario==='alternative'?.65:1.25;
    for(let i=0;i<13;i++){
      const p=stars[i*37];
      const x=w*(.6+(p.x-.5)*spread),y=h*(.47+(p.y-.5)*spread*.8);
      const radius=s*(.016+.016*p.depth);
      glow(ctx,x,y,radius*3,'#6e78c3',.045);
      dot(ctx,x,y,1.1+p.depth,`rgba(190,196,239,${.19+.2*p.depth})`);
    }
    glow(ctx,w*.69,h*.47,s*.43,'#4c4b89',.075);
    if(state.scenario==='alternative'){
      ctx.beginPath();ctx.ellipse(w*.69,h*.47,s*.22,s*.18,-.15,0,PI2);
      ctx.strokeStyle='rgba(155,135,225,.09)';ctx.lineWidth=2;ctx.stroke();
    }
  }
}
