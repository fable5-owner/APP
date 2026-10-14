// Procedurally drawn SVG portraits (placeholder art — swap with real images in art/ later).
/* shared portrait + helpers */
function shade(hex,f){const n=parseInt(hex.slice(1),16);let r=(n>>16)&255,g=(n>>8)&255,b=n&255;const c=v=>Math.max(0,Math.min(255,Math.round(v*f)));return'#'+[c(r),c(g),c(b)].map(v=>v.toString(16).padStart(2,'0')).join('')}
let _pid=0;
function portrait(o){
 const id='pt'+(++_pid);
 const skin=o.skin||'#efc4a0',sk1=shade(skin,1.07),sk2=shade(skin,.8),sk3=shade(skin,.62);
 const hc=o.hairCol||'#2a1d16',hl=shade(hc,1.9);
 const female=!!o.female;
 const FACE=female
  ?'M62 98C60 66 78 46 100 46C122 46 140 66 138 98C138 128 134 150 124 166C116 180 108 189 100 189C92 189 84 180 76 166C66 150 62 128 62 98Z'
  :'M60 98C58 66 76 44 100 44C124 44 142 66 140 98L138 128C137 142 134 152 128 162L116 180C112 186 106 189 100 189C94 189 88 186 84 180L72 162C66 152 63 142 62 128Z';
 const suit=o.suit||'#1d2b47',suitD=shade(suit,.7),shirt=o.shirt||'#f4f1ea';
 const outfit=o.outfit||'suit';
 let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 260" width="${o.w||200}" height="${o.h||260}">`;
 s+=`<defs>
 <linearGradient id="${id}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${(o.bg||['#6b86b8','#1f2a44'])[0]}"/><stop offset="1" stop-color="${(o.bg||['#6b86b8','#1f2a44'])[1]}"/></linearGradient>
 <linearGradient id="${id}sk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${sk2}"/><stop offset=".35" stop-color="${sk1}"/><stop offset=".7" stop-color="${skin}"/><stop offset="1" stop-color="${sk2}"/></linearGradient>
 <linearGradient id="${id}jw" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2a0e00" stop-opacity=".34"/></linearGradient>
 <radialGradient id="${id}lt" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
 <linearGradient id="${id}hr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(hc,1.35)}"/><stop offset=".5" stop-color="${hc}"/><stop offset="1" stop-color="${shade(hc,.7)}"/></linearGradient>
 <clipPath id="${id}cf"><path d="${FACE}"/></clipPath>
 <pattern id="${id}st" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".55" fill="#000" opacity=".5"/></pattern>
 </defs>`;
 s+=`<rect width="200" height="260" fill="url(#${id}bg)"/>`;
 if(o.glow)s+=`<circle cx="100" cy="120" r="92" fill="${o.glow}" opacity=".18"/>`;
 // back hair
 const H=o.hair||'swept';
 if(H==='bob')s+=`<path d="M46 112C42 60 70 32 100 32C132 32 158 60 154 112C154 152 148 178 140 196L60 196C52 178 46 152 46 112Z" fill="url(#${id}hr)"/>`;
 if(H==='long')s+=`<path d="M44 112C40 58 68 30 100 30C134 30 160 58 156 112C158 170 160 220 168 250L32 250C40 220 42 170 44 112Z" fill="url(#${id}hr)"/>`;
 // body
 if(outfit==='suit'||outfit==='blazer'){
  s+=`<path d="M6 260C10 222 48 206 82 200L118 200C152 206 190 222 194 260Z" fill="${suit}"/>`;
  s+=`<path d="M82 200L100 244L118 200L130 204L108 262L92 262L70 204Z" fill="${suitD}"/>`;
  s+=`<path d="M82 200L100 240L118 200L112 196L100 206L88 196Z" fill="${shirt}"/>`;
  if(o.tie&&outfit==='suit'){s+=`<path d="M94 206L106 206L109 216L100 258L91 216Z" fill="${o.tie}"/><path d="M95 204L105 204L103 211L97 211Z" fill="${shade(o.tie,.7)}"/>`}
  if(o.pin)s+=`<circle cx="136" cy="226" r="3" fill="${o.pin}"/>`;
 } else if(outfit==='turtle'){
  s+=`<path d="M6 260C10 222 48 206 82 200L118 200C152 206 190 222 194 260Z" fill="${suit}"/>`;
 } else if(outfit==='hoodie'){
  s+=`<path d="M6 260C8 220 46 204 78 198L122 198C154 204 192 220 194 260Z" fill="${suit}"/><path d="M80 198C90 226 110 226 120 198C112 204 88 204 80 198Z" fill="${suitD}"/><path d="M92 214L92 240M108 214L108 240" stroke="${shade(suit,1.5)}" stroke-width="2"/>`;
 } else if(outfit==='lab'){
  s+=`<path d="M6 260C10 222 48 206 82 200L118 200C152 206 190 222 194 260Z" fill="#eef1f4"/><path d="M82 200L100 250L118 200L128 206L106 262L94 262L72 206Z" fill="#cfd6de"/><path d="M82 200L100 232L118 200L112 196L100 204L88 196Z" fill="${suit}"/>`;
 } else if(outfit==='vest'){
  s+=`<path d="M6 260C10 222 48 206 82 200L118 200C152 206 190 222 194 260Z" fill="${shirt}"/><path d="M40 260C44 226 70 208 88 204L100 250L112 204C130 208 156 226 160 260Z" fill="${suit}"/><path d="M94 206L106 206L108 214L100 250L92 214Z" fill="${o.tie||'#8a2432'}"/>`;
 }
 // neck
 const turtle=outfit==='turtle';
 s+=`<path d="M82 166L82 202C90 212 110 212 118 202L118 166Z" fill="${turtle?suit:sk2}"/>`;
 if(!turtle)s+=`<path d="M82 170C92 190 108 190 118 170L118 184C108 198 92 198 82 184Z" fill="#000" opacity=".28"/>`;
 else s+=`<path d="M80 186C92 196 108 196 120 186L120 204C108 214 92 214 80 204Z" fill="${shade(suit,1.25)}"/>`;
 s+=`<g transform="translate(-6.5 0) scale(1.065 1)">`;
 // ears
 s+=`<ellipse cx="58" cy="106" rx="6.5" ry="12" fill="${sk1}"/><ellipse cx="142" cy="106" rx="6.5" ry="12" fill="${sk2}"/>`;
 // face
 s+=`<path d="${FACE}" fill="url(#${id}sk)"/>`;
 s+=`<g clip-path="url(#${id}cf)"><rect x="40" y="30" width="120" height="170" fill="url(#${id}jw)"/><rect x="40" y="30" width="120" height="170" fill="url(#${id}lt)"/>`;
 if(o.stub)s+=`<path d="M60 128C62 152 76 170 100 178C124 170 138 152 140 128L140 160L100 192L60 160Z" fill="url(#${id}st)" opacity="${o.stub}"/><path d="M84 148C92 142 108 142 116 148C108 152 92 152 84 148Z" fill="url(#${id}st)" opacity="${o.stub*.9}"/>`;
 if(female)s+=`<ellipse cx="76" cy="134" rx="13" ry="8" fill="#e8808a" opacity=".22"/><ellipse cx="124" cy="134" rx="13" ry="8" fill="#e8808a" opacity=".22"/>`;
 ;
 s+=`</g>`;
 // aging lines
 const age=o.age||0;
 if(age>=1){s+=`<path d="M66 118Q72 124 80 122M134 118Q128 124 120 122" stroke="${sk3}" stroke-width="1.3" fill="none" opacity=".6"/>`}
 if(age>=2){s+=`<path d="M74 70Q100 64 126 70M78 76Q100 72 122 76" stroke="${sk3}" stroke-width="1.2" fill="none" opacity=".45"/><path d="M80 142Q76 150 80 160M120 142Q124 150 120 160" stroke="${sk3}" stroke-width="1.4" fill="none" opacity=".55"/>`}
 // brows
 const bw=female?2.6:3.8;
 s+=`<path d="M68 96Q80 88 95 94" stroke="${hc}" stroke-width="${bw}" stroke-linecap="round" fill="none"/><path d="M132 96Q120 88 105 94" stroke="${hc}" stroke-width="${bw}" stroke-linecap="round" fill="none"/>`;
 // eyes
 const ec=o.eye||'#4a3320';
 for(const x of[82,118]){
  s+=`<path d="M${x-11} 106Q${x} 97 ${x+11} 106Q${x} 112 ${x-11} 106Z" fill="#fbf7f2"/><circle cx="${x}" cy="105.2" r="4.6" fill="${ec}"/><circle cx="${x}" cy="105.2" r="2.3" fill="#120a06"/><circle cx="${x-1.6}" cy="103.6" r="1.2" fill="#fff"/>`;
  s+=`<path d="M${x-12} 106Q${x} 96 ${x+12} 106" stroke="#1b110b" stroke-width="${female?2.6:2.2}" fill="none" stroke-linecap="round"/><path d="M${x-9} 108.5Q${x} 113 ${x+9} 108.5" stroke="${sk3}" stroke-width="1" fill="none" opacity=".6"/>`;
 }
 if(female){s+=`<path d="M70 104L66 100M130 104L134 100" stroke="#1b110b" stroke-width="2" stroke-linecap="round"/>`}
 // nose
 s+=`<path d="M100 108C98 120 96 130 95 136Q100 141 106 136" stroke="${sk3}" stroke-width="1.7" fill="none" stroke-linecap="round" opacity=".7"/><path d="M93 138Q100 143 107 138" stroke="${sk3}" stroke-width="1.4" fill="none" opacity=".5"/><ellipse cx="100.5" cy="124" rx="2.2" ry="11" fill="#fff" opacity=".09"/>`;
 // mouth
 const lip=female?'#b8444f':shade(skin,.72);
 s+=`<path d="M86 157Q93 152 100 154.5Q107 152 114 157Q100 163 86 157Z" fill="${lip}"/><path d="M87 158Q100 169 113 158Q100 171 87 158Z" fill="${shade(lip,1.12)}"/><path d="M86 157Q100 164 114 157" stroke="${shade(lip,.55)}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
 if(o.smile)s+=`<path d="M88 160Q100 168 112 160L112 158Q100 163 88 158Z" fill="#fff" opacity=".9"/><path d="M86 157Q100 164 114 157" stroke="${shade(lip,.55)}" stroke-width="1.3" fill="none"/>`;
 s+=`<path d="M92 176Q100 180 108 176" stroke="${sk3}" stroke-width="1.3" fill="none" opacity=".4"/>`;
 // front hair
 const hf={
  swept:`<path d="M54 106C46 58 72 26 108 28C140 30 156 62 146 106C145 88 139 74 128 66C112 59 90 59 76 68C64 78 58 92 54 106Z" fill="url(#${id}hr)"/><path d="M72 68C88 50 120 48 138 66C122 58 96 58 72 68Z" fill="${hl}" opacity=".35"/><path d="M80 58Q100 44 124 52M70 70Q86 56 110 54" stroke="${hl}" stroke-width="1.6" fill="none" opacity=".5"/>`,
  short:`<path d="M55 104C48 58 74 32 102 32C130 32 150 58 145 104C143 86 135 74 122 68C108 63 92 63 78 68C66 74 58 86 55 104Z" fill="url(#${id}hr)"/><path d="M76 56Q100 42 126 52" stroke="${hl}" stroke-width="1.6" fill="none" opacity=".5"/>`,
  silver:`<path d="M56 104C50 62 74 34 102 34C130 34 150 62 144 104C143 88 136 78 124 72C110 66 92 66 78 72C66 78 58 90 56 104Z" fill="url(#${id}hr)"/><path d="M76 58Q100 44 126 54" stroke="#fff" stroke-width="1.6" fill="none" opacity=".6"/>`,
  buzz:`<path d="M56 100C52 62 76 38 102 38C128 38 148 62 144 100C140 84 132 74 120 70C108 66 92 66 80 70C68 76 60 86 56 100Z" fill="${hc}" opacity=".55"/>`,
  bob:`<path d="M54 104C54 62 82 42 104 44C132 46 148 66 146 104C138 80 124 66 104 64C82 64 64 78 54 104Z" fill="url(#${id}hr)"/><path d="M80 52Q104 40 128 54" stroke="${hl}" stroke-width="1.6" fill="none" opacity=".5"/>`,
  long:`<path d="M54 106C52 60 80 40 104 42C132 44 150 66 146 106C138 80 124 64 104 62C82 62 64 78 54 106Z" fill="url(#${id}hr)"/><path d="M80 50Q104 38 128 52" stroke="${hl}" stroke-width="1.6" fill="none" opacity=".5"/>`,
  bun:`<circle cx="100" cy="26" r="17" fill="url(#${id}hr)"/><path d="M56 104C52 60 78 36 102 36C128 36 148 60 144 104C140 82 128 68 102 66C80 66 62 80 56 104Z" fill="url(#${id}hr)"/>`
 };
 if(H!=='bald')s+=hf[H]||'';
 if(o.glasses){const gc=o.glasses===true?'#2a2a30':o.glasses;s+=`<g fill="none" stroke="${gc}" stroke-width="2.2"><rect x="67" y="96" width="30" height="21" rx="9"/><rect x="103" y="96" width="30" height="21" rx="9"/><path d="M97 104Q100 101 103 104"/><path d="M67 102L58 100M133 102L142 100"/></g><path d="M69 98L90 98" stroke="#fff" stroke-opacity=".28" stroke-width="2"/>`}
 if(o.earring)s+=`<circle cx="58" cy="118" r="2.4" fill="${o.earring}"/>`;
 if(o.extra)s+=o.extra;
 s+=`</g>`;
 if(o.vign!==false)s+=`<rect width="200" height="260" fill="url(#${id}vg)" opacity="0"/>`;
 s+=`</svg>`;
 return s}
/* character presets */
const CH={
 hero:o=>portrait(Object.assign({skin:'#f0c7a2',hair:'swept',hairCol:'#1f1712',eye:'#3b5b78',stub:.18,smile:true,suit:'#1b2845',tie:'#8a2432',pin:'#d8b25e',bg:['#7a93c2','#222c4a'],glow:'#ffd9a0'},o||{})),
 mira:o=>portrait(Object.assign({female:true,skin:'#8a5a3c',hair:'bun',hairCol:'#17110e',eye:'#2a1a10',suit:'#3b2a4a',outfit:'blazer',earring:'#d8b25e',bg:['#8a7aa8','#2b2540'],smile:false},o||{})),
 victor:o=>portrait(Object.assign({skin:'#e8bd9a',hair:'silver',hairCol:'#c9c9cf',eye:'#5a6a78',age:2,glasses:'#4a4a52',suit:'#4a4f5a',tie:'#2a3350',bg:['#7a8696','#222a38']},o||{})),
 jonah:o=>portrait(Object.assign({skin:'#c8946a',hair:'swept',hairCol:'#0e0a08',eye:'#2a1a10',stub:.45,outfit:'turtle',suit:'#15171c',age:0,smile:true,bg:['#4aa07a','#14281f']},o||{})),
 lin:o=>portrait(Object.assign({female:true,skin:'#f1d2b4',hair:'bob',hairCol:'#15110f',eye:'#2a1a10',glasses:'#b8923a',suit:'#2c4a58',outfit:'blazer',age:1,bg:['#a77ac8','#2a1d40']},o||{})),
 dana:o=>portrait(Object.assign({female:true,skin:'#f2cfb0',hair:'long',hairCol:'#8a3b1c',eye:'#3a6a58',suit:'#a42a2a',outfit:'blazer',smile:true,bg:['#c88a7a','#3a1d20']},o||{})),
 elias:o=>portrait(Object.assign({skin:'#e6bd9c',hair:'silver',hairCol:'#f2f2f4',eye:'#6a7f94',age:3,suit:'#3b3226',tie:'#6a4a1a',outfit:'vest',shirt:'#efe6d0',bg:['#9a8a6a','#2a2118'],smile:true},o||{})),
};

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* AI orbs (glass spheres) */
function aiOrb(c1,c2,kind,w){
 const id='ob'+(++_pid);w=w||200;const R=mulberry32(kind==='aria'?5:9);
 let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" width="${w}" height="${w*1.3}" style="display:block"><defs>
 <filter id="${id}b" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="16"/></filter><filter id="${id}b2" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3"/></filter>
 <linearGradient id="${id}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101827"/><stop offset="1" stop-color="#05070d"/></linearGradient>
 <radialGradient id="${id}g" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".18" stop-color="${c1}"/><stop offset=".7" stop-color="${c2}"/><stop offset="1" stop-color="#05070d"/></radialGradient>
 <radialGradient id="${id}v" cx=".5" cy=".5" r=".75"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient></defs>
 <rect width="400" height="520" fill="url(#${id}bg)"/>`;
 for(let i=0;i<70;i++)s+=`<circle cx="${(R()*400).toFixed(0)}" cy="${(R()*520).toFixed(0)}" r="${(R()*1.6+.3).toFixed(1)}" fill="#fff" opacity="${(R()*.6+.1).toFixed(2)}"/>`;
 s+=`<circle cx="200" cy="250" r="190" fill="${c1}" opacity=".2" filter="url(#${id}b)"/><circle cx="200" cy="250" r="120" fill="${c1}" opacity=".35" filter="url(#${id}b)"/>`;
 if(kind==='aria'){for(let i=0;i<4;i++)s+=`<ellipse cx="200" cy="250" rx="${150+i*18}" ry="${44+i*10}" fill="none" stroke="${c1}" stroke-width="${3-i*.5}" opacity="${.8-i*.17}" transform="rotate(${-28+i*24} 200 250)"/>`;
  s+=`<circle cx="200" cy="250" r="96" fill="url(#${id}g)"/><ellipse cx="170" cy="204" rx="40" ry="24" fill="#fff" opacity=".35" filter="url(#${id}b2)"/><circle cx="170" cy="236" r="12" fill="#fff"/><circle cx="230" cy="236" r="12" fill="#fff"/><circle cx="170" cy="238" r="5.5" fill="${c2}"/><circle cx="230" cy="238" r="5.5" fill="${c2}"/><path d="M164 278Q200 306 236 278" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".95"/>`}
 else{s+=`<circle cx="200" cy="250" r="150" fill="none" stroke="${c1}" stroke-width="2" opacity=".5"/><circle cx="200" cy="250" r="176" fill="none" stroke="${c1}" stroke-width="1.4" stroke-dasharray="4 10" opacity=".4"/><circle cx="200" cy="250" r="96" fill="url(#${id}g)"/><ellipse cx="170" cy="206" rx="40" ry="24" fill="#fff" opacity=".3" filter="url(#${id}b2)"/><ellipse cx="200" cy="250" rx="52" ry="30" fill="#f4f8ff"/><circle cx="200" cy="250" r="19" fill="${c2}"/><circle cx="200" cy="250" r="9" fill="#050810"/><circle cx="193" cy="243" r="5" fill="#fff"/>`}
 s+=`<rect width="400" height="520" fill="url(#${id}v)"/></svg>`;return s}

export {shade,portrait,CH,aiOrb};
