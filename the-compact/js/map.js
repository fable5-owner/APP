import {hash,isLand,terrainAt,HUBS} from './geo.js';
// Renders the parchment-style hex world map into a canvas (1920x1080). Heavy: call once.
export async function renderMap(canvas){
 try{await Promise.all([document.fonts.load('800 13px Cinzel'),document.fonts.load('700 12px "Noto Sans KR"','가나다')])}catch(e){}

const W=1920,H=1080,DPR=1;canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');
const R=4.6,HW=R*Math.sqrt(3),VS=R*1.5,COLS=Math.ceil(W/HW)+2,ROWS=Math.ceil(H/VS)+2;
const PXD=W/360,LON0=-170,EQY=560;
const proj=(lon,lat)=>[(lon-LON0)*PXD,EQY-lat*PXD];
const unproj=(x,y)=>[x/PXD+LON0,(EQY-y)/PXD];
const hexC=(c,r)=>[HW*(c+.5*(r&1)),r*VS];
const NB=[[[1,0],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1]],[[1,0],[1,-1],[0,-1],[-1,0],[0,1],[1,1]]];
const nb=(c,r,i)=>{const d=NB[r&1][i];return[c+d[0],r+d[1]]};const inG=(c,r)=>c>=0&&r>=0&&c<COLS&&r<ROWS;
const NATS={USA:['#8fa6c9',[[-98,39],[-120,45],[-80,35],[-150,64],[-105,33],[-88,43]]],CAN:['#b9a27a',[[-105,58],[-120,56],[-75,52],[-95,66],[-65,48]]],MEX:['#8fb08a',[[-102,24],[-97,20]]],LAT:['#b4bb7c',[[-60,-12],[-70,-30],[-72,3],[-86,13],[-52,-5],[-64,-38],[-76,-10]]],EU:['#d7bc6a',[[2,47],[12,50],[20,52],[-4,40],[15,60],[25,45],[12,42],[-19,65]]],UK:['#b393c4',[[-2,54]]],RUS:['#b98a78',[[45,57],[60,62],[90,63],[110,60],[150,63],[135,52],[170,65],[50,67]]],UKR:['#8fb0e0',[[31,49]]],CHN:['#cf7a6c',[[125,45],[88,40],[108,33],[117,24],[120,34],[100,26],[122,40],[110,38]]],MNG:['#a9a28e',[[103,47]]],JPN:['#d8a0b8',[[138,36],[143,43],[131,33]]],KOR:['#8fc4be',[[127.5,36.5]]],PRK:['#a58fb0',[[127,40]]],TWN:['#9fcf7c',[[121,23.7]]],IND:['#d9a56a',[[78,22],[80,12],[88,25]]],ME:['#c8ab7c',[[44,24],[36,33],[33,39],[45,35],[48,15]]],IRN:['#c58a7c',[[53,32],[60,28]]],SEA:['#8bbfa4',[[105,15],[115,0],[102,5],[122,12],[140,-5],[100,20],[108,-6]]],CAS:['#a7a8b2',[[67,48],[75,45],[60,42],[68,40],[45,41]]],AFR:['#caa070',[[20,0],[0,10],[25,-25],[10,28],[30,27],[35,5],[-8,20],[22,15],[15,-10],[40,-5]]],AUS:['#8fbcd0',[[134,-25],[146,-33],[172,-40],[145,-42]]],GRL:['#b8bec6',[[-42,72]]]};
const land=[],nat=[],terr=[],ll=[],dist=[];
for(let r=0;r<ROWS;r++){land[r]=[];nat[r]=[];terr[r]=[];ll[r]=[];dist[r]=[];for(let c=0;c<COLS;c++){const[x,y]=hexC(c,r);const[lon,lat]=unproj(x,y);ll[r][c]=[lon,lat];let L=isLand(lon,lat);if(!L&&lat>79)L=true;land[r][c]=L;dist[r][c]=99;nat[r][c]=null;if(L){terr[r][c]=terrainAt(lon,lat);if(terr[r][c]!=='ice'){let best=null,bd=1e9;for(const k in NATS)for(const p of NATS[k][1]){const d=Math.hypot(lon-p[0],lat-p[1]);if(d<bd){bd=d;best=k}}if(bd<42&&lat>-60)nat[r][c]=best}}}}
{const q=[];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(land[r][c]){dist[r][c]=0;q.push([c,r])}let h=0;while(h<q.length){const[c,r]=q[h++];const d=dist[r][c];if(d>=10)continue;for(let i=0;i<6;i++){const[a,b]=nb(c,r,i);if(inG(a,b)&&dist[b][a]>d+1){dist[b][a]=d+1;q.push([a,b])}}}}
const hexPath=(x,y,r)=>{ctx.beginPath();for(let k=0;k<6;k++){const a=(60*k-30)*Math.PI/180;k?ctx.lineTo(x+r*Math.cos(a),y+r*Math.sin(a)):ctx.moveTo(x+r*Math.cos(a),y+r*Math.sin(a))}ctx.closePath()};
const rgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const mixc=(a,b,t)=>`rgb(${a.map((v,i)=>v*(1-t)+b[i]*t|0).join(',')})`;
// sea
ctx.fillStyle='#8fa9a3';ctx.fillRect(0,0,W,H);
for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){if(land[r][c])continue;const[x,y]=hexC(c,r);const d=Math.min(dist[r][c],10);const t=Math.min(1,d/9);const n=(hash(c,r)-.5)*.04;const col=mixc(rgb('#b7cbc2'),rgb('#5f7f86'),t);ctx.fillStyle=col;hexPath(x,y,R+.7);ctx.fill()}
// land
const PAPER=rgb('#e6d6a8');
for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){if(!land[r][c])continue;const[x,y]=hexC(c,r);const k=nat[r][c];const t=terr[r][c];let base=k?rgb(NATS[k][0]):rgb('#d9cfae');let col=mixc(PAPER,base,.62);
 if(t==='mountain')col=mixc(rgb('#8a7358'),base,.25);else if(t==='hills')col=mixc(rgb('#b49a6c'),base,.4);else if(t==='desert')col=mixc(rgb('#e4cf98'),base,.35);else if(t==='ice'||t==='snow')col=mixc(rgb('#f0ede2'),base,.1);
 ctx.fillStyle=col;hexPath(x,y,R+.7);ctx.fill()}
// ink marks
ctx.strokeStyle='rgba(60,40,20,.7)';ctx.lineWidth=1;ctx.lineCap='round';
for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){if(!land[r][c])continue;const t=terr[r][c];const[x,y]=hexC(c,r);const j=hash(c,r*5);
 if(t==='mountain'&&j>.25){ctx.beginPath();ctx.moveTo(x-3.6,y+2.5);ctx.lineTo(x-.5,y-3.2);ctx.lineTo(x+2.6,y+2.5);ctx.moveTo(x+.8,y+2.5);ctx.lineTo(x+3,y-1);ctx.lineTo(x+5.2,y+2.5);ctx.stroke()}
 else if((t==='forest'||t==='jungle')&&j>.6){ctx.beginPath();ctx.arc(x,y,1.7,0,7);ctx.moveTo(x,y+1.7);ctx.lineTo(x,y+4);ctx.stroke()}
 else if(t==='hills'&&j>.5){ctx.beginPath();ctx.arc(x,y+1.5,3,Math.PI,0);ctx.stroke()}}
// sea waves
ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=.9;
for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){if(land[r][c]||dist[r][c]<2||dist[r][c]>9)continue;if(hash(c*3,r*7)<.82)continue;const[x,y]=hexC(c,r);ctx.beginPath();ctx.moveTo(x-5,y);ctx.quadraticCurveTo(x-2.5,y-3,x,y);ctx.quadraticCurveTo(x+2.5,y+3,x+5,y);ctx.stroke()}
// coast + borders
function edge(x,y,r,i){const P=[[-30,30],[-90,-30],[-150,-90],[150,210],[90,150],[30,90]][i];const a=P[0]*Math.PI/180,b=P[1]*Math.PI/180;ctx.beginPath();ctx.moveTo(x+r*Math.cos(a),y+r*Math.sin(a));ctx.lineTo(x+r*Math.cos(b),y+r*Math.sin(b));ctx.stroke()}
ctx.lineCap='round';
for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){if(!land[r][c])continue;const[x,y]=hexC(c,r);for(let i=0;i<6;i++){const[a,b]=nb(c,r,i);if(!inG(a,b)||!land[b][a]){ctx.strokeStyle='rgba(55,35,18,.22)';ctx.lineWidth=4;edge(x,y,R,i);ctx.strokeStyle='rgba(55,35,18,.85)';ctx.lineWidth=1.3;edge(x,y,R,i)}else if(nat[r][c]!==nat[b][a]&&nat[r][c]&&nat[b][a]){ctx.strokeStyle='rgba(95,50,30,.9)';ctx.lineWidth=1.5;ctx.setLineDash([3,2]);edge(x,y,R,i);ctx.setLineDash([])}}}
// paper grain + stains
const id=ctx.getImageData(0,0,W*DPR,H*DPR);const d=id.data;for(let i=0;i<d.length;i+=4){const n=(((i*2654435761)>>>0)%1000/1000-.5)*16;d[i]+=n;d[i+1]+=n;d[i+2]+=n*.8}ctx.putImageData(id,0,0);
const vg=ctx.createRadialGradient(960,540,350,960,540,1150);vg.addColorStop(0,'rgba(60,35,10,0)');vg.addColorStop(1,'rgba(40,22,8,.62)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
for(let i=0;i<14;i++){const x=hash(i,3)*W,y=100+hash(i,9)*900,rad=60+hash(i,5)*140;const sg=ctx.createRadialGradient(x,y,0,x,y,rad);sg.addColorStop(0,'rgba(120,80,30,.07)');sg.addColorStop(1,'rgba(120,80,30,0)');ctx.fillStyle=sg;ctx.fillRect(x-rad,y-rad,rad*2,rad*2)}
// labels
ctx.textAlign='center';ctx.textBaseline='middle';
const LBL=[['UNITED STATES',-98,36,15],['CANADA',-105,59,15],['MEXICO',-99,23,11],['BRASIL',-52,-10,15],['EUROPE',14,50,13],['RUSSIA',80,62,19],['CHINA',103,34,19],['INDIA',78,22,13],['AUSTRALIA',134,-25,15],['AFRICA',20,4,19],['ARABIA',45,25,11],['PERSIA',54,32,10]];
for(const[t,lon,lat,sz]of LBL){const[x,y]=proj(lon,lat);ctx.save();ctx.font=`800 ${sz}px Cinzel`;ctx.letterSpacing=sz>14?'7px':'4px';ctx.fillStyle='rgba(55,32,14,.62)';ctx.shadowColor='rgba(240,225,180,.7)';ctx.shadowBlur=3;ctx.fillText(t,x,y);ctx.restore()}
ctx.save();ctx.font='italic 600 15px "Noto Serif KR"';ctx.fillStyle='rgba(30,50,60,.55)';ctx.letterSpacing='10px';for(const[t,lon,lat]of[['PACIFIC',-132,12],['ATLANTIC OCEAN',-38,18],['INDIAN OCEAN',78,-18]]){const[x,y]=proj(lon,lat);ctx.fillText(t,x,y)}ctx.restore();
// seals & routes
function route(a,b,lift,col){ctx.save();ctx.strokeStyle=col;ctx.lineWidth=2.2;ctx.setLineDash([2,6]);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...a);ctx.quadraticCurveTo((a[0]+b[0])/2,(a[1]+b[1])/2-lift,...b);ctx.stroke();ctx.restore()}
const sv=proj(...HUBS.sv),sea=proj(...HUBS.sea),oma=proj(...HUBS.oma),ts=proj(...HUBS.hsin);
route(ts,[sv[0]+W,sv[1]],110,'#6a2a8a');route([ts[0]-W,ts[1]],sv,110,'#6a2a8a');route(oma,sv,40,'#8a5a10');route(ts,[1480,360],40,'#9b2a1d');
function ship(x,y,flip){ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.fillStyle='#3a2410';ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(9,0);ctx.lineTo(6,5);ctx.lineTo(-6,5);ctx.fill();ctx.fillStyle='#f3e8c6';ctx.strokeStyle='#3a2410';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(7,-1);ctx.lineTo(0,-1);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-1,-14);ctx.lineTo(-7,-1);ctx.lineTo(-1,-1);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
ship(1738,330,false);ship(120,300,true);ship(1650,520,false);
function seal(x,y,col,code,r=13){ctx.save();ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=6;ctx.shadowOffsetY=2;const g=ctx.createRadialGradient(x-3,y-3,1,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'#3b0f0a');ctx.fillStyle=g;ctx.beginPath();for(let k=0;k<14;k++){const a=k/14*Math.PI*2;const rr=r+(k%2?0:1.6);ctx.lineTo(x+rr*Math.cos(a),y+rr*Math.sin(a))}ctx.closePath();ctx.fill();ctx.restore();ctx.strokeStyle='rgba(255,230,170,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,r-3.5,0,7);ctx.stroke();ctx.fillStyle='#fbe7b4';ctx.font='800 9.5px Cinzel';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(code,x,y+.5)}
const SV7=[['NV','#76b900'],['AP','#8a8f98'],['GO','#d99a00'],['ME','#2a5fd0'],['BC','#c9302c'],['OA','#12906a'],['AN','#c4603f']];
const off=[[0,0],[-22,-14],[22,-14],[-26,12],[26,12],[-6,28],[10,-30]];
SV7.forEach((s,i)=>seal(sv[0]+off[i][0]*.78,sv[1]+off[i][1]*.78,s[1],s[0],i?9.5:12));
seal(sea[0]-10,sea[1]-3,'#0b7fb8','MS',9.5);seal(sea[0]+10,sea[1]-3,'#d97a00','AM',9.5);seal(oma[0],oma[1],'#8a2432','BK',12);seal(ts[0],ts[1],'#8a3ab0','TS',13);
// scroll banners
function scroll(x,y,t,s,left){ctx.font='800 13px Cinzel';ctx.letterSpacing='1px';const w=Math.max(ctx.measureText(t).width,ctx.measureText(s).width*.9)+30;ctx.letterSpacing='0px';const x0=left?x-w:x;ctx.save();ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=7;ctx.shadowOffsetY=2;ctx.fillStyle='#efe3bf';ctx.strokeStyle='#5a4222';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(x0-8,y-17);ctx.lineTo(x0+w+8,y-17);ctx.lineTo(x0+w+1,y);ctx.lineTo(x0+w+8,y+17);ctx.lineTo(x0-8,y+17);ctx.lineTo(x0-1,y);ctx.closePath();ctx.fill();ctx.restore();ctx.stroke();ctx.fillStyle='#3a2410';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='800 13px Cinzel';ctx.letterSpacing='1px';ctx.fillText(t,x0+w/2,y-5);ctx.letterSpacing='0px';ctx.fillStyle='#6b4a1a';ctx.font='600 10.5px "Noto Sans KR"';ctx.fillText(s,x0+w/2,y+8)}
scroll(sv[0]-44,sv[1]+8,'SILICON VALLEY','일곱 기업 · 21.6T',true);scroll(sea[0]-26,sea[1]-26,'SEATTLE','MS · AMZN',true);scroll(oma[0]+22,oma[1]-4,'OMAHA','버크셔 · 비상금',false);scroll(ts[0]+24,ts[1]+4,'HSINCHU','TSMC · 대만 해협',false);
// compass rose
function compass(cx,cy,R0){ctx.save();ctx.translate(cx,cy);ctx.strokeStyle='#4a3318';ctx.fillStyle='#4a3318';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,0,R0,0,7);ctx.stroke();ctx.beginPath();ctx.arc(0,0,R0*.78,0,7);ctx.stroke();for(let k=0;k<8;k++){ctx.save();ctx.rotate(k*Math.PI/4);const L=k%2?R0*.7:R0*1.15;ctx.fillStyle=k%2?'#8a6f3e':'#4a3318';ctx.beginPath();ctx.moveTo(0,-L);ctx.lineTo(R0*.12,-R0*.12);ctx.lineTo(0,0);ctx.lineTo(-R0*.12,-R0*.12);ctx.closePath();ctx.fill();ctx.restore()}ctx.font='800 14px Cinzel';ctx.textAlign='center';ctx.fillText('N',0,-R0*1.35);ctx.restore()}
compass(1420,990,38);
// frame


}
