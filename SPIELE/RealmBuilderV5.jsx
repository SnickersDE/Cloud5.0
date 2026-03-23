import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════
//  REALM BUILDER V5 — COMPLETE & POLISHED
// ═══════════════════════════════════════════════════════════════════

// ── HEX MATH ─────────────────────────────────────────────────────
const HS = 30, HW = Math.sqrt(3)*HS, RH = HS*1.5;
const COLS=20, ROWS=12, TH_R=6, TH_C=10, PAD=6;
const MAP_W = Math.ceil(COLS*HW + HW/2 + PAD*2);
const MAP_H = Math.ceil(ROWS*RH + HS + PAD*2);
function hxC(r,c){ return {x:c*HW+(r%2?HW/2:0)+HW/2+PAD, y:r*RH+HS+PAD}; }
function hxPath(ctx,cx,cy,r=HS){ ctx.beginPath(); for(let i=0;i<6;i++){const a=-Math.PI/2+(Math.PI/3)*i; i?ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a));} ctx.closePath(); }
function px2hex(px,py){ let best=null,bd=Infinity; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){const{x,y}=hxC(r,c);const d=Math.hypot(px-x,py-y);if(d<bd){bd=d;best=[r,c];}} return bd<HS*1.2?best:null; }
function hexDist(r1,c1,r2,c2){ const{x:x1,y:y1}=hxC(r1,c1),{x:x2,y:y2}=hxC(r2,c2); return Math.hypot(x1-x2,y1-y2); }

// ── AUDIO ─────────────────────────────────────────────────────────
let _ac=null;
const gac=()=>{if(!_ac)try{_ac=new(window.AudioContext||window.webkitAudioContext)();}catch{}return _ac;};
function tone(f,t="sine",d=0.1,v=0.12,dl=0){try{const c=gac();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type=t;o.frequency.setValueAtTime(f,c.currentTime+dl);g.gain.setValueAtTime(0,c.currentTime+dl);g.gain.linearRampToValueAtTime(v,c.currentTime+dl+0.01);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dl+d);o.start(c.currentTime+dl);o.stop(c.currentTime+dl+d+0.05);}catch{}}
const SFX={
  build:   ()=>{tone(440,"square",0.06,0.1);tone(660,"square",0.06,0.1,0.07);},
  shoot:   ()=>tone(900,"sawtooth",0.04,0.05),
  cannon:  ()=>{tone(80,"sawtooth",0.2,0.18);tone(130,"square",0.1,0.13,0.05);},
  magic:   ()=>{tone(660,"sine",0.08,0.1);tone(880,"sine",0.06,0.08,0.06);},
  snipe:   ()=>tone(1200,"sawtooth",0.03,0.07),
  poison:  ()=>tone(300,"sine",0.15,0.08),
  die:     ()=>{tone(200,"sawtooth",0.1,0.1);tone(100,"sawtooth",0.08,0.08,0.07);},
  wave:    ()=>[330,440,550,660].forEach((f,i)=>tone(f,"square",0.14,0.18,i*0.08)),
  thit:    ()=>{tone(80,"sawtooth",0.16,0.22);tone(50,"square",0.1,0.18,0.06);},
  upgrade: ()=>[528,660,792].forEach((f,i)=>tone(f,"sine",0.1,0.18,i*0.07)),
  sell:    ()=>{tone(330,"sine",0.08,0.1);tone(220,"sine",0.1,0.08,0.09);},
  achieve: ()=>[528,660,880,1056].forEach((f,i)=>tone(f,"sine",0.12,0.2,i*0.06)),
  spawn:   ()=>tone(330,"square",0.07,0.09),
  victory: ()=>[523,659,784,1047].forEach((f,i)=>tone(f,"sine",0.3,0.22,i*0.12)),
  freeze:  ()=>tone(440,"sine",0.15,0.1),
};

// ── BUILDING DEFINITIONS ──────────────────────────────────────────
// NOTE: canPlace=true on all player-buildable structures
const BDEF = {
  townhall:  {name:"Stadtburg",   icon:"🏰",key:null,cost:{},                                 hp:2500,prod:{gold:0.4},          glow:"#fbbf24",cat:"special", canPlace:false, desc:"Dein Hauptquartier"},
  farm:      {name:"Farm",        icon:"🌾",key:"1", cost:{gold:35,wood:10},                   hp:120, prod:{food:2.0},           glow:"#4ade80",cat:"economy", canPlace:true,  desc:"+2.0 Nahrung/s"},
  lumbermill:{name:"Sägewerk",    icon:"🪚",key:"2", cost:{gold:45},                          hp:120, prod:{wood:1.1},           glow:"#a3633a",cat:"economy", canPlace:true,  desc:"+1.1 Holz/s"},
  mine:      {name:"Mine",        icon:"⛏️",key:"3", cost:{gold:60,food:12},                   hp:130, prod:{stone:1.8,gold:0.4}, glow:"#94a3b8",cat:"economy", canPlace:true,  desc:"+1.8 Stein +0.4 Gold/s"},
  ironmine:  {name:"Eisenmine",   icon:"🪨",key:"4", cost:{gold:90,stone:40},                  hp:130, prod:{iron:1.0},           glow:"#64748b",cat:"economy", canPlace:true,  desc:"+1.0 Eisen/s"},
  market:    {name:"Markt",       icon:"🏪",key:"5", cost:{gold:30,wood:20},                   hp:100, prod:{gold:1.6},           glow:"#fde68a",cat:"economy", canPlace:true,  desc:"+1.6 Gold/s"},
  treasury:  {name:"Schatzkammer",icon:"💎",key:"6", cost:{gold:100,stone:50},                 hp:120, prod:{},                   glow:"#a78bfa",cat:"economy", canPlace:true,  desc:"Überschuss→Gold"},
  temple:    {name:"Tempel",      icon:"⛩️",key:"7", cost:{gold:120,stone:70,wood:40},         hp:150, prod:{gold:0.1},           glow:"#e879f9",cat:"economy", canPlace:true,  desc:"Aura +25% Prod. nebenan",aura:true,auraRange:1.9},
  house:     {name:"Haus",        icon:"🏠",key:"8", cost:{gold:25,wood:20},                   hp:130, prod:{},                   glow:"#fb923c",cat:"military",canPlace:true,  desc:"+2 Bevölkerungslimit",popBonus:2},
  garrison:  {name:"Garnison",    icon:"🏯",key:"9", cost:{gold:80,wood:50,stone:30},          hp:160, prod:{},                   glow:"#86efac",cat:"military",canPlace:true,  desc:"+3 Pop · Heilaura",popBonus:3,healAura:true,auraRange:2.2},
  barracks:  {name:"Kaserne",     icon:"⚔️",key:"0", cost:{gold:80,wood:45,food:25},           hp:140, prod:{},                   glow:"#22c55e",cat:"military",canPlace:true,  desc:"Kämpfer 10s · 5🍖",spawnCd:10,foodCost:5,soldierType:"fighter"},
  bastion:   {name:"Bastion",     icon:"🛡️",key:"q", cost:{gold:170,stone:80,iron:20},         hp:300, prod:{},                   glow:"#f87171",cat:"military",canPlace:true,  desc:"Berserker 15s · 12🍖",spawnCd:15,foodCost:12,soldierType:"berserker"},
  siegework: {name:"Belager.W.",  icon:"🔱",key:"w", cost:{gold:200,stone:100,iron:40,wood:60},hp:250, prod:{},                   glow:"#fb923c",cat:"military",canPlace:true,  desc:"Ogre 30s · 20🍖",spawnCd:30,foodCost:20,soldierType:"ogre"},
  watchtower:{name:"Wachturm",    icon:"🗼",key:"e", cost:{gold:80,stone:50,wood:30},          hp:250, prod:{},                   glow:"#93c5fd",cat:"defense", canPlace:true,  desc:"Schütze · Schaden↑ Stufe",atk:20,range:3.3,cd:1.5,projType:"arrow"},
  magetower: {name:"Magiertum",   icon:"🔮",key:"r", cost:{gold:130,stone:60,iron:15},         hp:220, prod:{},                   glow:"#a78bfa",cat:"defense", canPlace:true,  desc:"Magie + verlangsamt AoE",atk:18,range:2.8,cd:2.2,projType:"magic",slowRange:1.0,slowFac:0.5},
  snipertower:{name:"Scharfschütz",icon:"🎯",key:"t",cost:{gold:160,stone:80,iron:30},         hp:200, prod:{},                   glow:"#fde047",cat:"defense", canPlace:true,  desc:"Riesige Reichweite · langsam",atk:90,range:5.5,cd:4.0,projType:"snipe"},
  cannon:    {name:"Kanone",      icon:"💣",key:"y", cost:{gold:150,stone:90,iron:25},         hp:320, prod:{},                   glow:"#fb923c",cat:"defense", canPlace:true,  desc:"Flächenschaden · AoE↑Stufe",atk:55,range:2.7,cd:4.2,aoe:true,splash:1.2,projType:"cannon"},
  alchemylab:{name:"Alchemi.lab", icon:"🧪",key:"u", cost:{gold:110,stone:40,iron:20,food:30}, hp:150, prod:{},                   glow:"#a3e635",cat:"defense", canPlace:true,  desc:"Gift-DoT-Wolke",atk:8,range:2.5,cd:8.0,projType:"poison"},
  wall:      {name:"Mauer",       icon:"🧱",key:"i", cost:{stone:22,wood:14},                   hp:1400,prod:{},                   glow:"#78716c",cat:"defense", canPlace:true,  desc:"Verlangsamt Feinde"},
  palisade:  {name:"Palisade",    icon:"🪵",key:"o", cost:{wood:15},                            hp:400, prod:{},                   glow:"#854d0e",cat:"defense", canPlace:true,  desc:"Billige Holzmauer"},
  watchpost: {name:"Wachposten",  icon:"👁️",key:"p", cost:{gold:20,wood:15},                    hp:80,  prod:{},                   glow:"#fb923c",cat:"defense", canPlace:true,  desc:"Frühwarnung"},
};
const BUILD_KEYS = Object.keys(BDEF).filter(k=>BDEF[k].key);
const RES_LIST = ["gold","food","wood","stone","iron"];
const RICON = {gold:"💰",food:"🍖",wood:"🪵",stone:"🪨",iron:"⚙️"};
const RCOL  = {gold:"#fbbf24",food:"#fb923c",wood:"#c4a46b",stone:"#a1a1aa",iron:"#6b7280"};

// ── UPGRADES ──────────────────────────────────────────────────────
const UPG = {
  farm:       [{cost:{gold:55,wood:20},  label:"Dünger",      note:"+0.6 Nahrung/s", bonus:{pM:1.7}},
               {cost:{gold:120,wood:50}, label:"Bewässerung", note:"+2.4 Nahrung/s", bonus:{pM:2.7}}],
  lumbermill: [{cost:{gold:65},          label:"Stahlsäge",   note:"+0.5 Holz/s",    bonus:{pM:1.7}},
               {cost:{gold:130},         label:"Dampfsäge",   note:"+1.9 Holz/s",    bonus:{pM:2.7}}],
  mine:       [{cost:{gold:85,stone:30}, label:"Tiefer graben",note:"+0.7 Stein/s", bonus:{pM:1.7}},
               {cost:{gold:170,stone:60},label:"Mechanisch",  note:"+3.1 Stein/s",  bonus:{pM:2.7}}],
  ironmine:   [{cost:{gold:100,stone:40},label:"Luftzug",     note:"+0.4 Eisen/s",  bonus:{pM:1.8}},
               {cost:{gold:200,stone:80},label:"Hochofen",    note:"+2.0 Eisen/s",  bonus:{pM:3.0}}],
  market:     [{cost:{gold:50,wood:25},  label:"Händler",     note:"+0.6 Gold/s",   bonus:{pM:1.7}},
               {cost:{gold:100,wood:55}, label:"Bank",        note:"+2.7 Gold/s",   bonus:{pM:2.7}}],
  treasury:   [{cost:{gold:80,stone:30}, label:"Goldspeicher",note:"×1.5 Ertrag",   bonus:{pM:1.5}},
               {cost:{gold:180,stone:60},label:"Reichsbank",  note:"×2.5 Ertrag",   bonus:{pM:2.5}}],
  temple:     [{cost:{gold:150,stone:60,wood:50},label:"Weihrauch", note:"+15% Aura",bonus:{auraB:0.15}},
               {cost:{gold:300,stone:120,wood:100},label:"Göttlich",note:"+30% Aura",bonus:{auraB:0.3}}],
  watchtower: [{cost:{gold:90,stone:55}, label:"Stahlpfeil",  note:"+14 Schaden",   bonus:{aM:1.7,rM:1.15, note:"→Magibolzen"}},
               {cost:{gold:180,stone:110},label:"Ballistik",  note:"+32 Schaden",   bonus:{aM:2.6,rM:1.35,cdM:0.65,note:"→Blitzbogenschuss"}}],
  magetower:  [{cost:{gold:110,stone:50,iron:15},label:"Arkanzauber",note:"+13 Schaden",bonus:{aM:1.7,slowF2:0.35}},
               {cost:{gold:220,stone:100,iron:30},label:"Zeitverzerrung",note:"+29 Schaden",bonus:{aM:2.6,slowF2:0.2,rM:1.3}}],
  snipertower:[{cost:{gold:150,stone:70,iron:25},label:"Diamantkugel",note:"+72 Schaden",bonus:{aM:1.8,cdM:0.75}},
               {cost:{gold:300,stone:140,iron:50},label:"Seelenstahl",note:"+162 Schaden",bonus:{aM:2.8,cdM:0.55}}],
  cannon:     [{cost:{gold:150,stone:80,iron:15},label:"Gusseisen",  note:"+39 Schaden",bonus:{aM:1.7,splM:1.5}},
               {cost:{gold:300,stone:160,iron:35},label:"Artillerie", note:"+88 Schaden",bonus:{aM:2.6,splM:2.2,cdM:0.72}}],
  alchemylab: [{cost:{gold:100,stone:40,iron:15},label:"Konzentriert",note:"+8 Gift",  bonus:{aM:1.8,cdM:0.7}},
               {cost:{gold:200,stone:80,iron:30}, label:"Pestkammer", note:"+18 Gift", bonus:{aM:2.8,cdM:0.5,rM:1.3}}],
  wall:       [{cost:{stone:40,wood:20}, label:"Steinwall",   note:"×1.9 HP",       bonus:{hpM:1.9}},
               {cost:{stone:80,wood:40}, label:"Festungswall",note:"×3.5 HP",       bonus:{hpM:3.5}}],
  palisade:   [{cost:{wood:25},          label:"Gehärtet",    note:"×2 HP",         bonus:{hpM:2.0}},
               {cost:{wood:50,stone:20}, label:"Beschlagen",  note:"×3.5 HP",       bonus:{hpM:3.5}}],
  barracks:   [{cost:{gold:100,wood:45}, label:"Ausbildung",  note:"→Ritter",       bonus:{sUT:"knight",  sHM:1.3,sAM:1.6}},
               {cost:{gold:200,food:70}, label:"Paladin-Eid", note:"→Paladin",      bonus:{sUT:"paladin", sHM:1.8,sAM:2.4}}],
  bastion:    [{cost:{gold:180,stone:70,iron:20},label:"Sturm-Eid",  note:"→Schw.Ritter",bonus:{sUT:"heavyknight",sHM:1.5,sAM:1.7}},
               {cost:{gold:360,stone:140,iron:45},label:"Champ.-Krönung",note:"→Champion",bonus:{sUT:"champion",sHM:2.3,sAM:2.6}}],
  siegework:  [{cost:{gold:250,stone:100,iron:50},label:"Panzerung",  note:"Ogre stärker",bonus:{sHM:1.8,sAM:1.6}},
               {cost:{gold:500,stone:200,iron:100},label:"Kriegsgott",note:"Ogre max",   bonus:{sHM:3.0,sAM:2.5,cdM:0.7}}],
  house:      [{cost:{gold:40,wood:30},  label:"Anbau",       note:"+2 Pop",        bonus:{popB:2}},
               {cost:{gold:80,wood:60},  label:"Festungshaus",note:"+4 Pop",        bonus:{popB:4}}],
  garrison:   [{cost:{gold:90,stone:40}, label:"Kaserne+",    note:"+2 Pop, +Heilung",bonus:{popB:2,healB:2}},
               {cost:{gold:180,stone:80},label:"Zitadelle",   note:"+5 Pop, +Heilung",bonus:{popB:5,healB:5}}],
};

// ── STAT GETTER ───────────────────────────────────────────────────
function bStats(b){
  const def=BDEF[b.type]; if(!def) return {};
  const ups=UPG[b.type]||[];
  let pM=1,aM=1,rM=1,cdM=1,splM=1,sAM=1,sHM=1,hpM=1,popB=0,healB=0,auraB=0,slowF2=null,sUT=null;
  for(let i=0;i<(b.lvl||0);i++){
    const bn=ups[i]?.bonus||{};
    if(bn.pM!=null)  pM=bn.pM;    if(bn.aM!=null)  aM=bn.aM;
    if(bn.rM!=null)  rM=bn.rM;    if(bn.cdM!=null) cdM=bn.cdM;
    if(bn.splM!=null)splM=bn.splM; if(bn.sAM!=null) sAM=bn.sAM;
    if(bn.sHM!=null) sHM=bn.sHM;  if(bn.hpM!=null) hpM=bn.hpM;
    if(bn.popB!=null)popB+=bn.popB; if(bn.healB!=null)healB+=bn.healB;
    if(bn.auraB!=null)auraB+=bn.auraB; if(bn.slowF2!=null)slowF2=bn.slowF2;
    if(bn.sUT)sUT=bn.sUT;
  }
  return {...def,pM,aM,rM,cdM,splM,sAM,sHM,hpM,popB,healB,auraB,slowF2,sUT};
}

// ── SOLDIER TYPES ─────────────────────────────────────────────────
const STYPES = {
  fighter:    {name:"Kämpfer",     icon:"⚔️",col:"#22c55e",col2:"#16a34a",sz:8,  hp:75, atk:14,spd:55,rng:26,cd:0.9,aoe:false,healer:false,rage:false},
  knight:     {name:"Ritter",      icon:"🛡️",col:"#3b82f6",col2:"#1d4ed8",sz:10, hp:130,atk:20,spd:42,rng:28,cd:1.0,aoe:false,healer:false,rage:false},
  paladin:    {name:"Paladin",     icon:"✝️",col:"#fbbf24",col2:"#d97706",sz:10, hp:220,atk:26,spd:32,rng:30,cd:1.2,aoe:false,healer:true, rage:false,healRate:3.0},
  berserker:  {name:"Berserker",   icon:"🪓",col:"#ef4444",col2:"#b91c1c",sz:8,  hp:90, atk:32,spd:60,rng:24,cd:0.7,aoe:false,healer:false,rage:true},
  heavyknight:{name:"Schw.Ritter", icon:"🔰",col:"#991b1b",col2:"#7f1d1d",sz:12, hp:200,atk:42,spd:30,rng:32,cd:1.3,aoe:true, healer:false,rage:false},
  champion:   {name:"Champion",    icon:"👑",col:"#7c3aed",col2:"#5b21b6",sz:12, hp:280,atk:55,spd:38,rng:34,cd:1.0,aoe:true, healer:false,rage:false},
  ogre:       {name:"Belager.Ogre",icon:"🔱",col:"#92400e",col2:"#78350f",sz:15, hp:600,atk:80,spd:18,rng:40,cd:2.5,aoe:true, healer:false,rage:false},
};
function getSoldierType(bType, lvl){
  const ups=UPG[bType]||[]; let sUT=null;
  for(let i=0;i<Math.min(lvl||0,ups.length);i++) if(ups[i]?.bonus?.sUT) sUT=ups[i].bonus.sUT;
  const defaults={barracks:"fighter",bastion:"berserker",siegework:"ogre"};
  return STYPES[sUT||defaults[bType]]||STYPES.fighter;
}

// ── POP CAP ────────────────────────────────────────────────────────
function getPopCap(bld){
  let cap=4;
  for(const b of Object.values(bld)){
    if(b.type==="house")   { const st=bStats(b); cap+=(BDEF.house.popBonus||2)+(st.popB||0); }
    if(b.type==="garrison"){ const st=bStats(b); cap+=(BDEF.garrison.popBonus||3)+(st.popB||0); }
  }
  return cap;
}

// ── RESEARCH ──────────────────────────────────────────────────────
const RESEARCH = [
  {id:"ironworks",  name:"Eisengießerei",  icon:"⚙️",cost:{gold:300,stone:100},desc:"Alle Produktionsgebäude +25%"},
  {id:"sharpbows",  name:"Stahlbögen",     icon:"🏹",cost:{gold:350,iron:80}, desc:"Alle Türme +20% Schaden"},
  {id:"foodstorage",name:"Nahrungslager",  icon:"🌾",cost:{gold:250,wood:80}, desc:"Nahrungsproduktion +20%"},
  {id:"stonemasonry",name:"Steinmetzerei", icon:"🪨",cost:{gold:280,stone:120},desc:"Mauern/Palisaden +50% HP"},
  {id:"alchemy",    name:"Alchemie",       icon:"⚗️",cost:{gold:400,iron:60,food:100},desc:"Alle Einheiten +30% HP"},
];
function rBonus(g,key){
  let b=1;
  for(const id of g.research){
    if(id==="ironworks" && key==="prod") b+=0.25;
    if(id==="sharpbows"&& key==="atk")  b+=0.20;
    if(id==="foodstorage"&&key==="food") b+=0.20;
    if(id==="alchemy"  && key==="solHp") b+=0.30;
  }
  return b;
}

// ── ENEMY TYPES ───────────────────────────────────────────────────
const ETYPE=[
  {id:"goblin",   name:"Goblin",    icon:"👺",hp:32, spd:70,atk:5, rew:8,  armored:false,flying:false,berserk:false,wave:0},
  {id:"orc",      name:"Ork",       icon:"👹",hp:140,spd:34,atk:14,rew:22, armored:false,flying:false,berserk:false,wave:1},
  {id:"skeleton", name:"Skelett",   icon:"💀",hp:65, spd:50,atk:8, rew:18, armored:false,flying:false,berserk:false,wave:3,respawns:true},
  {id:"armororc", name:"Panzork",   icon:"🦾",hp:200,spd:25,atk:18,rew:38, armored:true, flying:false,berserk:false,wave:2,armorPct:0.3},
  {id:"troll",    name:"Troll",     icon:"🧌",hp:290,spd:20,atk:30,rew:50, armored:false,flying:false,berserk:false,wave:3},
  {id:"spider",   name:"Spinne",    icon:"🕷️",hp:90, spd:46,atk:12,rew:25, armored:false,flying:false,berserk:false,wave:4,slowsSoldier:true},
  {id:"swarm",    name:"Schwarml.", icon:"🐀",hp:28, spd:82,atk:4, rew:6,  armored:false,flying:false,berserk:false,wave:2,swarm:true},
  {id:"eberserk", name:"Berserker", icon:"🪓",hp:160,spd:44,atk:22,rew:35, armored:false,flying:false,berserk:true, wave:3},
  {id:"necro",    name:"Nekromant", icon:"🧙",hp:120,spd:28,atk:8, rew:45, armored:false,flying:false,berserk:false,wave:5,heals:true,healRad:2.5*HS,healRate:6},
  {id:"ram",      name:"Widder",    icon:"🐏",hp:500,spd:22,atk:40,rew:70, armored:false,flying:false,berserk:false,wave:6,targetsBld:true},
  {id:"frosttrol",name:"Frostriese",icon:"❄️",hp:380,spd:18,atk:28,rew:65, armored:false,flying:false,berserk:false,wave:8,freezes:true},
  {id:"wyrm",     name:"Schattenwyrm",icon:"🦇",hp:200,spd:62,atk:20,rew:80,armored:false,flying:true,berserk:false,wave:9},
  {id:"darknight",name:"Dunk.Ritter",icon:"🦹",hp:450,spd:28,atk:45,rew:90, armored:true, flying:false,berserk:false,wave:11,armorPct:0.35,selfHeals:5},
  {id:"dragon",   name:"Drache",    icon:"🐉",hp:700,spd:45,atk:65,rew:120,armored:false,flying:true, berserk:false,wave:5},
];

// ── ACHIEVEMENTS ──────────────────────────────────────────────────
const ACHIEV=[
  {id:"first_kill", icon:"☠️",title:"Erstes Blut",       check:g=>g.kills>=1},
  {id:"first_tower",icon:"🗼",title:"Wächter",            check:g=>Object.values(g.bld).some(b=>b.type==="watchtower")},
  {id:"pop5",       icon:"⚔️",title:"Armee",              check:g=>g.soldiers.length>=5},
  {id:"wave5",      icon:"🌊",title:"Überlebender",       check:g=>g.wave>=5},
  {id:"kills50",    icon:"💀",title:"Massaker",           check:g=>g.kills>=50},
  {id:"wave10",     icon:"🔥",title:"Veteran",            check:g=>g.wave>=10},
  {id:"combo5",     icon:"⚡",title:"Kettenreaktion",     check:g=>g.maxCombo>=5},
  {id:"boss_kill",  icon:"👑",title:"Bossschlächter",     check:g=>g.bossKills>=1},
  {id:"maxed",      icon:"⭐",title:"Meisterbauer",       check:g=>Object.values(g.bld).some(b=>(b.lvl||0)>=2)},
  {id:"research3",  icon:"🔬",title:"Alchemist",          check:g=>g.research.size>=3},
  {id:"kills200",   icon:"💥",title:"Schlachter",         check:g=>g.kills>=200},
  {id:"wave15",     icon:"🌟",title:"Legende",            check:g=>g.wave>=15},
];

// ── TERRAIN ────────────────────────────────────────────────────────
const BIOMES=["Grasland","Wald","Berg","Sumpf","Wasser"];
const TPLACEABLE=[true,false,false,false,false];
const TCOL=[["#1c4d10","#265f14"],["#14532d","#166534"],["#374151","#4b5563"],["#164e35","#1a5c3a"],["#1e3a5f","#1e40af"]];

// ── PARTICLES ─────────────────────────────────────────────────────
let _id=1; const uid=()=>++_id;
function mkExp(x,y,col="#f87171",n=12,sp=65){ return Array.from({length:n},()=>{const a=Math.random()*Math.PI*2,s=sp*0.6+Math.random()*sp; return{id:uid(),x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:1.5+Math.random()*4,col,life:0.5+Math.random()*0.5};}); }
function mkDust(x,y){ return Array.from({length:6},(_,i)=>{const a=(i/6)*Math.PI*2; return{id:uid(),x,y,vx:Math.cos(a)*18,vy:Math.sin(a)*18-12,r:2+Math.random()*3,col:"#d4a017",life:0.4+Math.random()*0.3};}); }

// ── MAP ────────────────────────────────────────────────────────────
function makeMap(){
  const m=[];
  for(let r=0;r<ROWS;r++){ m[r]=[]; for(let c=0;c<COLS;c++){
    if(Math.abs(r-TH_R)<=2&&Math.abs(c-TH_C)<=3){m[r][c]=0;continue;}
    const n=Math.random();
    m[r][c]=n<0.06?2:n<0.17?1:n<0.23?3:n<0.27?4:0;
  }}
  return m;
}

// ── INIT ───────────────────────────────────────────────────────────
function initGame(){
  return {
    phase:"start", map:makeMap(),
    bld:{[`${TH_R},${TH_C}`]:{type:"townhall",hp:2500,maxHp:2500,lvl:0,lastAtk:0,spawnT:0,sc:1}},
    soldiers:[], res:{gold:500,food:280,wood:200,stone:170,iron:50},
    resRate:{gold:0,food:0,wood:0,stone:0,iron:0},
    enemies:[],projs:[],parts:[],floats:[],
    shake:{x:0,y:0,t:0},
    wave:0,waveCd:34,waveMsg:"",waveMsgT:0,
    score:0,kills:0,bossKills:0,
    combo:0,maxCombo:0,comboCd:0,
    totalUpg:0, dayT:0, dayDir:1,
    paused:false, speed:1, showGrid:true,
    selCell:null, targetMode:"first",
    achieve:new Set(), achieveQ:[],
    research:new Set(), researchQ:[],
    hovBiome:null, bottomTab:"build",
    lastTs:null, autoRepair:false,
    wavePause:0, waveCleared:false,
    victoryParts:[],
  };
}

// ── SPAWN WAVE ─────────────────────────────────────────────────────
function spawnWave(g){
  const w=g.wave, isBoss=w%5===0&&w>0, isLegend=w===20;
  const count=4+w*2+(w>=5?2:0);
  const eligible=ETYPE.filter(e=>e.wave<=w);

  if(isBoss||isLegend){
    const bossDefs=isLegend
      ?[{hp:2200,icon:"👑",name:"LEGENDÄRER BOSS",spd:30,atk:100,rew:500},
        {hp:1300,icon:"🐉",name:"Drache",         spd:55,atk:80, rew:300},
        {hp:900, icon:"🦹",name:"Dunkler Ritter",  spd:35,atk:60, rew:200}]
      :[{hp:1600+w*80,icon:"👑",name:`BOSS Welle ${w}`,spd:22,atk:90,rew:350}];
    const sides=[[MAP_W*0.15,0],[MAP_W*0.85,0],[0,MAP_H*0.5],[MAP_W,MAP_H*0.5]];
    bossDefs.forEach((bd,bi)=>{
      const[sx,sy]=sides[bi%4];
      g.enemies.push({id:uid(),x:sx,y:sy,icon:bd.icon,name:bd.name,isBoss:true,
        hp:bd.hp,maxHp:bd.hp,spd:bd.spd,atk:bd.atk,rew:bd.rew,
        armored:false,armorPct:0,flying:false,berserk:false,
        spawnDelay:bi*0.6,atkCd:0,dead:false,bob:Math.random()*Math.PI*2,
        frozen:0,poisoned:0,respawned:false});
    });
    g.bossFight=true;
  }

  for(let i=0;i<count;i++){
    const pool=eligible.filter(e=>!e.id.startsWith("boss"));
    const et=pool[Math.floor(Math.random()*pool.length)];
    const side=Math.floor(Math.random()*4);
    let x,y;
    if(side===0)     {x=Math.random()*MAP_W;y=-60;}
    else if(side===1){x=MAP_W+60;y=Math.random()*MAP_H;}
    else if(side===2){x=Math.random()*MAP_W;y=MAP_H+60;}
    else             {x=-60;y=Math.random()*MAP_H;}
    const hpM=1+w*0.07;
    const cnt=et.swarm?4:1;
    for(let s=0;s<cnt;s++){
      g.enemies.push({id:uid(),x:x+(s?(Math.random()-0.5)*36:0),y:y+(s?(Math.random()-0.5)*36:0),
        icon:et.icon,name:et.name,isBoss:false,
        hp:et.hp*hpM,maxHp:et.hp*hpM,spd:et.spd+(w>=8?w*0.4:0),atk:et.atk,rew:et.rew,
        armored:et.armored,armorPct:et.armorPct||0,flying:et.flying,berserk:et.berserk,
        heals:et.heals,healRad:et.healRad,healRate:et.healRate,
        targetsBld:et.targetsBld,freezes:et.freezes,slowsSoldier:et.slowsSoldier,
        selfHeals:et.selfHeals,respawns:et.respawns,
        spawnDelay:i*0.45+s*0.1,atkCd:0,dead:false,bob:Math.random()*Math.PI*2,
        frozen:0,poisoned:0,respawned:false,healCd:0});
    }
  }
  g.waveCleared=false;
  SFX.wave();
}

function nextWavePreview(wave){
  const w=wave+1, et=ETYPE.filter(e=>e.wave<=w&&!e.swarm);
  const isBoss=w%5===0&&w>0, cnt=4+w*2+(w>=5?2:0);
  const by={}; if(isBoss)by["👑"]=1;
  for(let i=0;i<cnt;i++){const t=et[Math.floor(Math.random()*et.length)]; by[t.icon]=(by[t.icon]||0)+1;}
  return{by,isBoss,cnt};
}

// ── KILL ───────────────────────────────────────────────────────────
function onKill(g,e,x,y){
  g.kills++; if(e.isBoss){g.bossKills++;if(!g.enemies.some(e2=>e2.isBoss&&!e2.dead&&e2!==e))g.bossFight=false;}
  g.combo++;g.comboCd=2.2;if(g.combo>g.maxCombo)g.maxCombo=g.combo;
  const rew=Math.round(e.rew);
  g.score+=rew; g.res.gold=Math.min(9999,g.res.gold+rew);
  g.floats.push({id:uid(),x,y,txt:`+${rew}💰`,t:0,big:false});
  if(g.combo>=3) g.floats.push({id:uid(),x:MAP_W/2,y:MAP_H/2-30,txt:`${g.combo}× KOMBO!`,t:0,big:true,center:true});
  const cols=e.isBoss?["#fbbf24","#f59e0b"]:e.armored?["#94a3b8"]:e.flying?["#a78bfa"]:["#f87171","#fb923c"];
  g.parts.push(...mkExp(x,y,cols[0]));
  SFX.die();
}

// ── GAME TICK ──────────────────────────────────────────────────────
function tick(g,ts){
  if(g.phase!=="playing"||g.paused) return;
  const rawDt=g.lastTs?Math.min((ts-g.lastTs)/1000,0.1):0;
  g.lastTs=ts;
  const dt=rawDt*g.speed;

  // ── Victory condition ──
  if(g.wave>=20&&g.enemies.filter(e=>!e.dead).length===0){
    g.phase="victory";
    // Spawn fireworks
    for(let i=0;i<60;i++){
      const a=Math.random()*Math.PI*2,spd=80+Math.random()*150;
      g.victoryParts.push({id:uid(),x:MAP_W/2,y:MAP_H/2,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-60,
        r:2+Math.random()*4,col:["#fbbf24","#f87171","#86efac","#93c5fd","#e879f9"][Math.floor(Math.random()*5)],life:2+Math.random()});
    }
    SFX.victory(); return;
  }

  // ── Day/Night ──
  g.dayT+=dt/120*g.dayDir;
  if(g.dayT>=1){g.dayT=1;g.dayDir=-1;} if(g.dayT<=0){g.dayT=0;g.dayDir=1;}
  const dayProdBonus=1+(g.dayT<0.5?g.dayT:1-g.dayT)*0.2;
  const nightSpeedBonus=1+(g.dayT>0.5?(g.dayT-0.5)*0.3:0);

  // ── Screenshake ──
  if(g.shake.t>0){g.shake.t-=dt;const m=g.shake.t*10;g.shake.x=(Math.random()-0.5)*m;g.shake.y=(Math.random()-0.5)*m;if(g.shake.t<=0){g.shake.x=0;g.shake.y=0;}}

  // ── Timers ──
  if(g.waveMsgT>0) g.waveMsgT-=dt;
  if(g.comboCd>0)  g.comboCd-=dt; else if(g.combo>0) g.combo=0;
  for(const a of g.achieveQ) a.t-=dt;
  g.achieveQ=g.achieveQ.filter(a=>a.t>0);
  for(const r of g.researchQ) r.t-=dt;
  g.researchQ=g.researchQ.filter(r=>r.t>0);

  // ── Wave pause (enemies cleared) ──
  if(g.wavePause>0){ g.wavePause-=dt; return; }
  if(g.wave>0 && !g.waveCleared && g.enemies.filter(e=>!e.dead&&e.spawnDelay<=0).length===0 && g.waveCd>8){
    g.waveCleared=true; g.wavePause=5;
    g.floats.push({id:uid(),x:MAP_W/2,y:MAP_H/2-50,txt:"✅ Welle abgewehrt! 5s Pause",t:0,big:true,center:true});
  }

  // ── Wave countdown ──
  g.waveCd-=dt;
  if(g.waveCd<=0){
    g.wave++;
    g.waveCd=34+Math.min(g.wave,20)*3.5;
    spawnWave(g);
    g.waveMsg=g.wave===20?"🌟 LEGENDÄRE FINALE WELLE 20!":g.wave%5===0?`👑 BOSS-WELLE ${g.wave}!`:`⚔️ WELLE ${g.wave}`;
    g.waveMsgT=2.6;
    if(g.wave%5===0){ const b=g.wave*60; g.res.gold=Math.min(9999,g.res.gold+b); g.floats.push({id:uid(),x:MAP_W/2,y:MAP_H/3,txt:`🎁 +${b}💰 Wellenbonus`,t:0,big:true,center:true}); }
    checkAchiev(g);
  }

  // ── Resource production ──
  const newRates={gold:0,food:0,wood:0,stone:0,iron:0};
  for(const[key,b] of Object.entries(g.bld)){
    const def=BDEF[b.type]; if(!def?.prod||Object.keys(def.prod).length===0) {}
    else {
      const st=bStats(b);
      const[br,bc]=key.split(",").map(Number);
      // Temple aura bonus
      let auraMult=1;
      for(const[k2,b2] of Object.entries(g.bld)){
        if(b2.type!=="temple"||b2===b) continue;
        const[tr,tc]=k2.split(",").map(Number);
        if(hexDist(br,bc,tr,tc)<BDEF.temple.auraRange*HS+10){
          const ts2=bStats(b2); auraMult+=0.25+(ts2.auraB||0);
        }
      }
      const prodM=st.pM*auraMult*dayProdBonus*rBonus(g,"prod");
      const foodM=rBonus(g,"food");
      for(const[r,rate] of Object.entries(def.prod)){
        const fr=rate*prodM*(r==="food"?foodM:1);
        g.res[r]=Math.min(9999,(g.res[r]||0)+fr*dt);
        newRates[r]=(newRates[r]||0)+fr;
      }
    }
    // HP regen
    const regen=0.4+(b.lvl||0)*0.5+(g.autoRepair&&g.res.stone>0?2:0);
    b.hp=Math.min(b.maxHp, b.hp+regen*dt);
    if(g.autoRepair&&b.hp<b.maxHp) g.res.stone=Math.max(0,g.res.stone-0.015*dt);
    // Build anim
    if((b.sc||1)<1) b.sc=Math.min(1,(b.sc||0)+dt*4);
    // Low HP fire particles
    const[br2,bc2]=key.split(",").map(Number);
    if(b.hp/b.maxHp<0.25&&Math.random()<dt*0.4){
      const{x,y}=hxC(br2,bc2);
      g.parts.push(...mkExp(x+(Math.random()-0.5)*HS,y+(Math.random()-0.5)*HS,"#fb923c",3,25));
    }
  }
  // Treasury: excess resources → gold
  for(const[,b] of Object.entries(g.bld)){
    if(b.type!=="treasury") continue;
    const st=bStats(b);
    const excess=(Math.max(0,(g.res.food||0)-350)+Math.max(0,(g.res.wood||0)-350))*0.0005*(st.pM||1);
    g.res.gold=Math.min(9999,(g.res.gold||0)+excess*60*dt);
    newRates.gold=(newRates.gold||0)+excess*60;
  }
  g.resRate=newRates;

  // ── Pop cap ──
  const popCap=getPopCap(g.bld);
  const solHpBonus=rBonus(g,"solHp");

  // ── Garrison heal aura ──
  for(const[key,b] of Object.entries(g.bld)){
    if(b.type!=="garrison") continue;
    const st=bStats(b);
    const[br,bc]=key.split(",").map(Number);
    const{x:gx,y:gy}=hxC(br,bc);
    const healR=BDEF.garrison.auraRange*HS;
    const rate=3+(st.healB||0);
    for(const s of g.soldiers) if(Math.hypot(s.x-gx,s.y-gy)<healR) s.hp=Math.min(s.maxHp,s.hp+rate*dt);
  }

  // ── Paladin aura ──
  for(const s of g.soldiers){
    if(s.stype!==STYPES.paladin) continue;
    for(const s2 of g.soldiers) if(s2!==s&&!s2.dead&&Math.hypot(s2.x-s.x,s2.y-s.y)<65)
      s2.hp=Math.min(s2.maxHp,s2.hp+(s.stype.healRate||3)*dt);
  }

  // ── Barracks / Bastion / Siegework spawn ──
  for(const[key,b] of Object.entries(g.bld)){
    const def=BDEF[b.type]; if(!def?.soldierType) continue;
    const st=bStats(b);
    b.spawnT=(b.spawnT||0)+dt;
    const spawnCd=def.spawnCd*(st.cdM||1);
    if(b.spawnT>=spawnCd){
      b.spawnT=0;
      if(g.soldiers.length<popCap&&g.res.food>=(def.foodCost||5)){
        g.res.food-=def.foodCost||5;
        const sType=getSoldierType(b.type,b.lvl||0);
        const[br,bc]=key.split(",").map(Number);
        const{x:bx,y:by}=hxC(br,bc);
        const ang=(g.soldiers.length/Math.max(1,popCap))*Math.PI*2;
        const spread=sType===STYPES.ogre?0:18;
        const hpM=solHpBonus*(st.sHM||1);
        g.soldiers.push({id:uid(),
          x:bx+Math.cos(ang)*spread, y:by+Math.sin(ang)*spread,
          stype:sType, atk:sType.atk*(st.sAM||1),
          hp:sType.hp*hpM, maxHp:sType.hp*hpM,
          atkCd:0, kills:0, xp:0, level:1,
          dead:false, frozen:0});
        SFX.spawn();
      }
    }
  }

  // ── Soldier AI ──
  for(const s of g.soldiers){
    if(s.dead) continue;
    if(s.frozen>0){s.frozen-=dt;continue;}
    s.hp=Math.min(s.maxHp,s.hp+0.6*dt);

    // Find nearest living enemy
    let tgt=null, bestD=Infinity;
    for(const e of g.enemies){
      if(e.dead||e.spawnDelay>0) continue;
      const d=Math.hypot(e.x-s.x,e.y-s.y);
      if(d<bestD){bestD=d;tgt=e;}
    }
    if(!tgt) continue;

    const attackRange=s.stype.rng;
    if(bestD<=attackRange){
      s.atkCd-=dt;
      if(s.atkCd<=0){
        s.atkCd=s.stype.cd;
        if(s.stype.aoe){
          // AoE swing
          for(const e of g.enemies){
            if(e.dead) continue;
            const d=Math.hypot(e.x-tgt.x,e.y-tgt.y);
            if(d<40){e.hp-=s.atk*(1-d/80); if(e.hp<=0&&!e.dead){e.dead=true;onKill(g,e,e.x,e.y);}}
          }
        } else {
          tgt.hp-=s.atk;
          if(tgt.hp<=0&&!tgt.dead){tgt.dead=true;onKill(g,tgt,tgt.x,tgt.y);}
        }
        s.kills++; s.xp+=5;
        if(s.xp>=30&&s.level<3){s.level++;s.xp=0;s.atk*=1.22;s.maxHp*=1.18;s.hp=Math.min(s.maxHp,s.hp*1.18);}
      }
    } else {
      const dx=tgt.x-s.x,dy=tgt.y-s.y,d=Math.max(0.1,Math.hypot(dx,dy));
      s.x+=dx/d*s.stype.spd*dt;
      s.y+=dy/d*s.stype.spd*dt;
    }
  }
  g.soldiers=g.soldiers.filter(s=>!s.dead);

  // ── Enemy necro heal ──
  for(const e of g.enemies){
    if(!e.heals||e.dead||e.spawnDelay>0) continue;
    e.healCd-=dt;
    if(e.healCd<=0){
      e.healCd=1.5;
      for(const e2 of g.enemies) if(e2!==e&&!e2.dead&&e2.spawnDelay<=0&&Math.hypot(e2.x-e.x,e2.y-e.y)<(e.healRad||80))
        e2.hp=Math.min(e2.maxHp,e2.hp+(e.healRate||6));
    }
  }

  // ── Enemy movement & attack ──
  for(const e of g.enemies){
    if(e.spawnDelay>0){e.spawnDelay-=dt;continue;}
    if(e.dead) continue;
    if(e.frozen>0){e.frozen-=dt;continue;}
    if(e.selfHeals) e.hp=Math.min(e.maxHp,e.hp+e.selfHeals*dt);
    if(e.poisoned>0){e.hp=Math.max(0,e.hp-e.poisoned*dt);e.poisoned=Math.max(0,e.poisoned-0.5*dt);}
    if(e.hp<=0&&!e.dead){e.dead=true;onKill(g,e,e.x,e.y);continue;}

    const bBoost=e.berserk&&e.hp/e.maxHp<0.5?1.65:1;
    let tSlow=1;
    if(!e.flying){
      const ec=Math.max(0,Math.min(COLS-1,Math.floor(e.x/HW)));
      const er=Math.max(0,Math.min(ROWS-1,Math.floor((e.y-PAD)/RH)));
      const t=g.map[er]?.[ec]||0;
      if(t===1)tSlow=0.70; if(t===3)tSlow=0.45;
      // Wall/palisade slow
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        const bk=`${er+dr},${ec+dc}`, bw=g.bld[bk];
        if(bw&&(bw.type==="wall"||bw.type==="palisade")) tSlow=Math.min(tSlow,0.38);
      }
    }

    // Find target building
    let target=null, nearD=Infinity;
    for(const[key,b] of Object.entries(g.bld)){
      // Rams prefer buildings over TH until they're the only one left
      if(e.targetsBld && b.type==="townhall" && Object.keys(g.bld).length>1) continue;
      const[br,bc]=key.split(",").map(Number);
      const{x,y}=hxC(br,bc);
      const d=Math.hypot(x-e.x,y-e.y);
      if(d<nearD){nearD=d;target={x,y,key,b};}
    }
    if(!target) continue;

    const bob=Math.sin(ts/260+e.bob)*2.5;
    const dx=target.x-e.x, dy=target.y-e.y, dist=Math.hypot(dx,dy);
    if(dist<HS*0.64){
      e.atkCd-=dt;
      if(e.atkCd<=0){
        e.atkCd=1.1; target.b.hp=Math.max(0,target.b.hp-e.atk);
        if(target.key===`${TH_R},${TH_C}`){SFX.thit();g.shake={x:0,y:0,t:0.38};}
        if(target.b.hp<=0){
          if(target.key===`${TH_R},${TH_C}`){g.phase="gameover";return;}
          const[br,bc]=target.key.split(",").map(Number);
          const{x:bx,y:by}=hxC(br,bc);
          g.parts.push(...mkExp(bx,by,"#f87171",18));
          delete g.bld[target.key];
        }
        // Frost freeze soldiers
        if(e.freezes) for(const s of g.soldiers) if(Math.hypot(s.x-e.x,s.y-e.y)<42){s.frozen=1.5;SFX.freeze();}
        // Spider slow
        if(e.slowsSoldier) for(const s of g.soldiers) if(Math.hypot(s.x-e.x,s.y-e.y)<36) s.frozen=Math.max(s.frozen,0.8);
      }
    } else {
      e.x+=dx/dist*e.spd*bBoost*tSlow*nightSpeedBonus*dt;
      e.y+=(dy/dist*e.spd*bBoost*tSlow*nightSpeedBonus+bob*0.05)*dt;
    }
  }

  // ── Skeleton respawn (before filter!) ──
  for(const e of g.enemies){
    if(e.dead&&e.respawns&&!e.respawned){
      e.respawned=true; e.dead=false; e.hp=e.maxHp*0.3;
    }
  }
  g.enemies=g.enemies.filter(e=>!e.dead);

  // ── Tower attacks ──
  const now=ts/1000;
  const atkBonus=rBonus(g,"atk");
  for(const[key,b] of Object.entries(g.bld)){
    const def=BDEF[b.type];
    if(!def?.atk) continue;
    const st=bStats(b);
    b.lastAtk=b.lastAtk||0;
    const cd=def.cd*(st.cdM||1);
    if(now-b.lastAtk<cd) continue;

    const[br,bc]=key.split(",").map(Number);
    const{x:tx,y:ty}=hxC(br,bc);
    const range=def.range*(st.rM||1)*HS;

    // Alchemylab: AoE poison cloud (no projectile, just apply)
    if(b.type==="alchemylab"){
      let hit=false;
      for(const e of g.enemies){
        if(e.dead||e.spawnDelay>0) continue;
        if(Math.hypot(e.x-tx,e.y-ty)<range){
          e.poisoned=Math.max(e.poisoned,def.atk*(st.aM||1)*atkBonus);
          hit=true;
        }
      }
      if(hit){b.lastAtk=now;g.parts.push(...mkExp(tx,ty,"#a3e635",8,30));SFX.poison();}
      continue;
    }

    // Find target
    let tgt=null, bestV=null;
    for(const e of g.enemies){
      if(e.dead||e.spawnDelay>0) continue;
      const d=Math.hypot(e.x-tx,e.y-ty);
      if(d>range) continue;
      const v=g.targetMode==="strongest"?-e.hp:g.targetMode==="weakest"?e.hp:d;
      if(bestV===null||v<bestV){bestV=v;tgt=e;}
    }
    if(!tgt) continue;

    b.lastAtk=now;
    const dmg=def.atk*(st.aM||1)*atkBonus;
    const splash=def.aoe?def.splash*(st.splM||1):0;
    g.projs.push({id:uid(),sx:tx,sy:ty,ex:tgt.x,ey:tgt.y,tid:tgt.id,
      dmg,t:0,type:b.type,lvl:b.lvl||0,splash,slowRange:def.slowRange||0,slowFac:st.slowF2||def.slowFac||0.5});

    if(b.type==="cannon")SFX.cannon();
    else if(b.type==="magetower")SFX.magic();
    else if(b.type==="snipertower")SFX.snipe();
    else SFX.shoot();
  }

  // ── Projectile flight & impact ──
  const nextProjs=[];
  for(const p of g.projs){
    const spd=p.type==="snipertower"?9:p.type==="cannon"?2.0:p.type==="magetower"?1.9:4.5;
    p.t+=dt*spd;
    if(p.t>=1){
      if(p.splash>0){
        // AoE
        for(const e of g.enemies){
          if(e.dead) continue;
          const d=Math.hypot(e.x-p.ex,e.y-p.ey);
          if(d<p.splash*HS){
            const fd=p.dmg*(1-d/(p.splash*HS)*0.5);
            e.hp-=e.armored?fd*(1-e.armorPct):fd;
            if(e.hp<=0&&!e.dead){e.dead=true;onKill(g,e,e.x,e.y);}
          }
        }
        if(p.slowRange>0) for(const e of g.enemies){if(!e.dead&&Math.hypot(e.x-p.ex,e.y-p.ey)<p.slowRange*HS)e.frozen=Math.max(e.frozen,0.7);}
        g.parts.push(...mkExp(p.ex,p.ey,p.type==="magetower"?"#a78bfa":"#fb923c",p.lvl>=2?24:p.lvl>=1?16:10,75));
      } else {
        const e=g.enemies.find(e=>e.id===p.tid);
        if(e&&!e.dead){
          const fd=e.armored?p.dmg*(1-e.armorPct):p.dmg;
          e.hp-=fd;
          if(e.hp<=0&&!e.dead){e.dead=true;onKill(g,e,e.x,e.y);}
        }
      }
      // Impact sparks
      g.parts.push(...mkExp(p.ex,p.ey,"#ffffff",4,40));
    } else {
      nextProjs.push(p);
    }
  }
  g.projs=nextProjs;
  g.enemies=g.enemies.filter(e=>!e.dead);

  // ── Particle & float update ──
  for(const p of g.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=95*dt;p.life-=dt;}
  g.parts=g.parts.filter(p=>p.life>0);
  for(const f of g.floats) f.t+=dt;
  g.floats=g.floats.filter(f=>f.t<(f.big?2.4:1.4));

  checkAchiev(g);
}

function checkAchiev(g){
  for(const a of ACHIEV) if(!g.achieve.has(a.id)&&a.check(g)){g.achieve.add(a.id);g.achieveQ.push({...a,t:3.5});SFX.achieve();}
}

// ═══════════════════════════════════════════════════════════════════
//  CANVAS DRAWING
// ═══════════════════════════════════════════════════════════════════

function drawBuilding(ctx,cx,cy,type,lvl,hpRatio,time,sc=1){
  const s=HS*0.76*sc;
  ctx.save(); ctx.translate(cx,cy);
  switch(type){
    case"townhall":{
      ctx.fillStyle="#78350f"; ctx.fillRect(-s*.72,-s*.3,s*1.44,s*.66);
      [[-s*.72,-s*.78],[s*.34,-s*.78]].forEach(([bx,by])=>{
        ctx.fillStyle="#92400e"; ctx.fillRect(bx,by,s*.38,s*.5);
        ctx.fillStyle="#b45309"; for(let i=0;i<3;i++) ctx.fillRect(bx+i*s*.12,by-s*.16,s*.1,s*.18);
      });
      ctx.fillStyle="#92400e"; ctx.fillRect(-s*.58,-s*.5,s*1.16,s*.22);
      ctx.fillStyle="#1c0a00"; ctx.beginPath(); ctx.arc(0,s*.1,s*.25,Math.PI,0); ctx.fillRect(-s*.25,s*.1,s*.5,s*.28); ctx.fill();
      ctx.strokeStyle="#fbbf24"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,-s*.84); ctx.lineTo(0,-s*1.22); ctx.stroke();
      ctx.fillStyle="#dc2626"; ctx.beginPath(); ctx.moveTo(0,-s*1.22); ctx.lineTo(s*.32,-s*1.06); ctx.lineTo(0,-s*.88); ctx.fill();
      if(hpRatio<0.3){const fl=0.3+0.7*Math.abs(Math.sin(time/400));ctx.fillStyle=`rgba(251,113,0,${fl*0.45})`;ctx.fillRect(-s*.72,-s*.9,s*1.44,s*1.1);}
      break;
    }
    case"farm":{
      ctx.strokeStyle="#4ade80"; ctx.lineWidth=1.8;
      [-s*.5,-s*.18,s*.14,s*.46].forEach(yy=>{
        ctx.beginPath(); ctx.moveTo(-s*.78,yy); ctx.lineTo(s*.78,yy); ctx.stroke();
        for(let xv=-s*.68;xv<=s*.78;xv+=s*.26){
          ctx.beginPath(); ctx.moveTo(xv,yy); ctx.lineTo(xv-s*.09,yy-s*.25); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(xv,yy); ctx.lineTo(xv+s*.09,yy-s*.25); ctx.stroke();
        }
      });
      ctx.fillStyle="#854d0e"; ctx.fillRect(s*.34,-s*.58,s*.44,s*.42);
      ctx.fillStyle="#dc2626"; ctx.beginPath(); ctx.moveTo(s*.28,-s*.58); ctx.lineTo(s*.56,-s*.9); ctx.lineTo(s*.84,-s*.58); ctx.fill();
      ctx.fillStyle="#1c0a00"; ctx.fillRect(s*.48,-s*.36,s*.15,s*.2);
      if(lvl>=1){ctx.globalAlpha=0.25+0.1*Math.sin(time/400);ctx.fillStyle="#4ade80";ctx.beginPath();ctx.arc(0,0,s*.9,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
      break;
    }
    case"lumbermill":{
      ctx.fillStyle="#92400e"; ctx.beginPath(); ctx.ellipse(0,s*.34,s*.52,s*.24,0,0,Math.PI*2); ctx.fill();
      const rot=time/350;
      ctx.save(); ctx.rotate(rot);
      ctx.strokeStyle="#6b7280"; ctx.lineWidth=3.5; ctx.beginPath(); ctx.arc(0,-s*.08,s*.52,0,Math.PI*2); ctx.stroke();
      for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;ctx.fillStyle="#9ca3af";ctx.beginPath();ctx.moveTo(Math.cos(a)*s*.52,Math.sin(a)*s*.52);ctx.lineTo(Math.cos(a+0.28)*(s*.52+s*.18),Math.sin(a+0.28)*(s*.52+s*.18));ctx.lineTo(Math.cos(a+0.56)*s*.52,Math.sin(a+0.56)*s*.52);ctx.fill();}
      ctx.restore();
      ctx.fillStyle="#374151"; ctx.beginPath(); ctx.arc(0,-s*.08,s*.13,0,Math.PI*2); ctx.fill();
      break;
    }
    case"mine":{
      ctx.fillStyle="#292524"; ctx.beginPath(); ctx.arc(0,s*.12,s*.55,Math.PI,0); ctx.fillRect(-s*.55,s*.12,s*1.1,s*.44); ctx.fill();
      ctx.fillStyle="#1c1917"; ctx.beginPath(); ctx.arc(0,s*.08,s*.4,Math.PI,0); ctx.fillRect(-s*.4,s*.08,s*.8,s*.38); ctx.fill();
      ctx.strokeStyle="#94a3b8"; ctx.lineWidth=3.5; ctx.lineCap="round";
      [[-0.4,0.06],[0.4,0.06]].forEach(([rx])=>{ctx.save();ctx.rotate(rx);ctx.beginPath();ctx.moveTo(-s*.04,-s*.72);ctx.lineTo(-s*.04,-s*.15);ctx.stroke();ctx.fillStyle="#94a3b8";ctx.beginPath();ctx.moveTo(-s*.04,-s*.72);ctx.lineTo(-s*.22,-s*.56);ctx.lineTo(-s*.04,-s*.5);ctx.fill();ctx.restore();});
      ctx.lineCap="butt";
      ctx.fillStyle="#a78bfa"; const cr=s*.18; ctx.beginPath(); ctx.moveTo(s*.4,-s*.28-cr); ctx.lineTo(s*.4+cr,-s*.28+cr*.5); ctx.lineTo(s*.4-cr,-s*.28+cr*.5); ctx.fill();
      break;
    }
    case"ironmine":{
      ctx.fillStyle="#1f2937"; ctx.fillRect(-s*.7,-s*.3,s*1.4,s*.78);
      ctx.fillStyle="#374151"; ctx.fillRect(-s*.58,-s*.6,s*1.16,s*.32);
      ctx.strokeStyle="#6b7280"; ctx.lineWidth=2.5;
      for(let i=-0.5;i<=0.5;i+=0.25){ctx.beginPath();ctx.moveTo(s*i,-s*.3);ctx.lineTo(s*i,s*.48);ctx.stroke();}
      ctx.fillStyle="#475569"; ctx.beginPath(); ctx.arc(0,0,s*.32,0,Math.PI*2); ctx.fill();
      const gr=ctx.createRadialGradient(0,0,0,0,0,s*.28); gr.addColorStop(0,"#94a3b8"); gr.addColorStop(1,"#475569"); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(0,0,s*.28,0,Math.PI*2); ctx.fill();
      break;
    }
    case"market":{
      ["#dc2626","#f8fafc","#dc2626","#f8fafc","#dc2626"].forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(-s*.7+i*s*.28,-s*.55,s*.28,s*.28);});
      ctx.fillStyle="#b91c1c"; ctx.beginPath(); ctx.moveTo(-s*.7,-s*.55); ctx.lineTo(0,-s*.84); ctx.lineTo(s*.7,-s*.55); ctx.fill();
      ctx.fillStyle="#78350f"; ctx.fillRect(-s*.64,-s*.28,s*1.28,s*.14); ctx.fillRect(-s*.58,-s*.14,s*.12,s*.4); ctx.fillRect(s*.46,-s*.14,s*.12,s*.4);
      const cA=time/500; ctx.save(); ctx.scale(Math.cos(cA)*0.6+0.4,1);
      ctx.fillStyle="#fbbf24"; ctx.beginPath(); ctx.arc(0,s*.26,s*.3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#f59e0b"; ctx.beginPath(); ctx.arc(0,s*.26,s*.22,0,Math.PI*2); ctx.fill(); ctx.restore();
      break;
    }
    case"treasury":{
      ctx.fillStyle="#3b0764"; ctx.fillRect(-s*.64,-s*.28,s*1.28,s*.7);
      ctx.fillStyle="#4c1d95"; ctx.fillRect(-s*.56,-s*.56,s*1.12,s*.3);
      ctx.fillStyle="#1c0a00"; ctx.fillRect(-s*.18,s*.0,s*.36,s*.42);
      ctx.fillStyle="#7c3aed"; ctx.beginPath(); ctx.arc(0,-s*.7,s*.24,0,Math.PI*2); ctx.fill();
      const gp=0.4+0.6*Math.sin(time/500); ctx.fillStyle=`rgba(167,139,250,${gp*0.4})`; ctx.beginPath(); ctx.arc(0,-s*.7,s*.38,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#c4b5fd"; ctx.font=`bold ${s*.3}px sans-serif`; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("$",0,-s*.7);
      break;
    }
    case"temple":{
      ctx.fillStyle="#831843"; ctx.fillRect(-s*.6,-s*.2,s*1.2,s*.7);
      ctx.fillStyle="#9d174d"; ctx.beginPath(); ctx.moveTo(-s*.64,-s*.2); ctx.lineTo(0,-s*1.0); ctx.lineTo(s*.64,-s*.2); ctx.fill();
      ctx.strokeStyle="#f9a8d4"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-s*.64,-s*.2); ctx.lineTo(0,-s*1.0); ctx.lineTo(s*.64,-s*.2); ctx.stroke();
      ctx.fillStyle="#1c0a00"; ctx.fillRect(-s*.16,s*.04,s*.32,s*.46);
      const aP=0.4+0.4*Math.sin(time/600); ctx.fillStyle=`rgba(249,168,212,${aP*0.35})`; ctx.beginPath(); ctx.arc(0,-s*.1,s*.9,0,Math.PI*2); ctx.fill();
      break;
    }
    case"house":{
      ctx.fillStyle="#92400e"; ctx.fillRect(-s*.72,-s*.22,s*1.44,s*.74);
      ctx.fillStyle="#dc2626"; ctx.beginPath(); ctx.moveTo(-s*.78,-s*.22); ctx.lineTo(0,-s*.9); ctx.lineTo(s*.78,-s*.22); ctx.fill();
      ctx.fillStyle="#1c0a00"; ctx.fillRect(-s*.18,-s*.06,s*.36,s*.52); ctx.fillStyle="#bfdbfe"; ctx.fillRect(-s*.62,s*.02,s*.3,s*.24); ctx.fillRect(s*.32,s*.02,s*.3,s*.24);
      ctx.fillStyle="#292524"; ctx.fillRect(s*.4,-s*.87,s*.22,s*.68);
      const smk=Math.sin(time/400)*s*.08; ctx.globalAlpha=0.4; ctx.fillStyle="#d4d4d4"; ctx.beginPath(); ctx.arc(s*.51,-s*.98+smk,s*.14,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
      break;
    }
    case"garrison":{
      ctx.fillStyle="#14532d"; ctx.fillRect(-s*.72,-s*.28,s*1.44,s*.76);
      [[-s*.52,-s*.28],[s*.52,-s*.28]].forEach(([bx,by])=>{ctx.fillStyle="#166534";ctx.fillRect(bx-s*.24,by,s*.48,s*.8);for(let i=0;i<2;i++)ctx.fillRect(bx-s*.2+i*s*.25,by-s*.18,s*.2,s*.2);});
      ctx.fillStyle="#1c0a00"; ctx.fillRect(-s*.15,-s*.1,s*.3,s*.55);
      ctx.strokeStyle="#fbbf24"; ctx.lineWidth=2.5; ctx.lineCap="round";
      ctx.save(); ctx.rotate(-0.5); ctx.beginPath(); ctx.moveTo(-s*.32,-s*.6); ctx.lineTo(s*.32,s*.1); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.rotate(0.5); ctx.beginPath(); ctx.moveTo(-s*.32,-s*.6); ctx.lineTo(s*.32,s*.1); ctx.stroke(); ctx.restore(); ctx.lineCap="butt";
      // Heal aura ring
      if(lvl>=0){ctx.globalAlpha=0.15+0.1*Math.sin(time/700);ctx.strokeStyle="#86efac";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,BDEF.garrison.auraRange*HS,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
      break;
    }
    case"barracks":{
      ctx.fillStyle="#14532d"; ctx.fillRect(-s*.72,-s*.28,s*1.44,s*.74);
      ctx.fillStyle="#166534"; ctx.fillRect(-s*.64,-s*.6,s*1.28,s*.34);
      ctx.fillStyle="#1c0a00"; ctx.fillRect(-s*.15,-s*.1,s*.3,s*.5);
      ctx.strokeStyle="#fbbf24"; ctx.lineWidth=3; ctx.lineCap="round";
      ctx.save(); ctx.rotate(-0.5); ctx.beginPath(); ctx.moveTo(-s*.34,-s*.64); ctx.lineTo(s*.34,s*.1); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.rotate(0.5); ctx.beginPath(); ctx.moveTo(-s*.34,-s*.64); ctx.lineTo(s*.34,s*.1); ctx.stroke(); ctx.restore(); ctx.lineCap="butt";
      ctx.strokeStyle="#dc2626"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,-s*.6); ctx.lineTo(0,-s*.95); ctx.stroke();
      ctx.fillStyle="#dc2626"; ctx.beginPath(); ctx.moveTo(0,-s*.95); ctx.lineTo(s*.3,-s*.8); ctx.lineTo(0,-s*.65); ctx.fill();
      break;
    }
    case"bastion":{
      ctx.fillStyle="#7f1d1d"; ctx.fillRect(-s*.78,-s*.36,s*1.56,s*.86);
      [[-s*.66,-s*.36],[s*.66,-s*.36],[-s*.66,s*.5],[s*.66,s*.5]].forEach(([x,y])=>{ctx.fillStyle="#991b1b";ctx.beginPath();ctx.arc(x,y,s*.22,0,Math.PI*2);ctx.fill();});
      ctx.fillStyle="#6b1616"; ctx.fillRect(-s*.52,-s*.24,s*1.04,s*.62);
      ctx.fillStyle="#1c0a00"; ctx.beginPath(); ctx.arc(0,s*.15,s*.28,Math.PI,0); ctx.fillRect(-s*.28,s*.15,s*.56,s*.28); ctx.fill();
      ctx.strokeStyle="#374151"; ctx.lineWidth=2;
      for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*s*.09,s*.02);ctx.lineTo(i*s*.09,s*.43);ctx.stroke();}
      ctx.beginPath(); ctx.moveTo(-s*.26,s*.22); ctx.lineTo(s*.26,s*.22); ctx.stroke();
      break;
    }
    case"siegework":{
      ctx.fillStyle="#431407"; ctx.fillRect(-s*.75,-s*.28,s*1.5,s*.78);
      ctx.fillStyle="#1c0a00"; ctx.fillRect(-s*.22,-s*.28,s*.44,s*.28);
      ctx.fillStyle="#292524"; ctx.fillRect(-s*.5,-s*.95,s*.28,s*.7); ctx.fillRect(s*.22,-s*.9,s*.28,s*.65);
      const fp=0.6+0.4*Math.sin(time/180);
      ctx.fillStyle=`rgba(251,146,60,${fp*0.85})`; ctx.beginPath(); ctx.arc(-s*.36,-s*.98,s*.2*fp,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(s*.36,-s*.93,s*.2*fp,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#6b7280"; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-s*.2,s*.3); ctx.lineTo(s*.0,-s*.3); ctx.stroke();
      ctx.fillStyle="#4b5563"; ctx.fillRect(-s*.08,-s*.46,s*.28,s*.2);
      break;
    }
    case"watchtower":{
      ctx.fillStyle="#374151"; ctx.beginPath(); ctx.moveTo(-s*.5,s*.54); ctx.lineTo(-s*.4,-s*.9); ctx.lineTo(s*.4,-s*.9); ctx.lineTo(s*.5,s*.54); ctx.fill();
      ctx.fillStyle="#4b5563"; [-s*.3,s*.02,s*.34].forEach(y=>ctx.fillRect(-s*.46,y,s*.92,s*.08));
      [[-s*.38,-s*.9],[-s*.13,-s*.9],[s*.12,-s*.9]].forEach(([x,y])=>{ctx.fillStyle="#4b5563";ctx.fillRect(x,y,s*.2,s*.22);});
      ctx.fillStyle="#111827"; ctx.fillRect(-s*.06,s*.02,s*.12,s*.44); ctx.fillRect(-s*.18,s*.18,s*.36,s*.12);
      ctx.fillStyle="#1e3a5f"; ctx.beginPath(); ctx.moveTo(-s*.44,-s*.9); ctx.lineTo(0,-s*1.34); ctx.lineTo(s*.44,-s*.9); ctx.fill();
      // Level glow rings
      if(lvl>=1){ctx.strokeStyle="#93c5fd";ctx.lineWidth=2;ctx.globalAlpha=0.6;ctx.beginPath();ctx.arc(0,0,s*.58,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
      if(lvl>=2){const lp=0.6+0.4*Math.sin(time/400);ctx.strokeStyle=`rgba(147,197,253,${lp})`;ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(0,0,s*.76,0,Math.PI*2);ctx.stroke();}
      break;
    }
    case"magetower":{
      ctx.fillStyle="#2e1065"; ctx.beginPath(); ctx.moveTo(-s*.48,s*.5); ctx.lineTo(-s*.38,-s*.88); ctx.lineTo(s*.38,-s*.88); ctx.lineTo(s*.48,s*.5); ctx.fill();
      ctx.fillStyle="#3b0764"; [-s*.28,s*.04,s*.36].forEach(y=>ctx.fillRect(-s*.44,y,s*.88,s*.08));
      const gP=0.5+0.5*Math.sin(time/380);
      ctx.fillStyle=`rgba(167,139,250,${gP*0.7})`; ctx.beginPath(); ctx.arc(0,-s*.2,s*.24,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#a78bfa"; ctx.beginPath(); ctx.arc(0,-s*.2,s*.16,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#7c3aed"; ctx.beginPath(); ctx.moveTo(-s*.46,-s*.88); ctx.lineTo(0,-s*1.28); ctx.lineTo(s*.46,-s*.88); ctx.fill();
      if(lvl>=1){ctx.strokeStyle="#c084fc";ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(0,-s*.2,s*.6,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
      if(lvl>=2){const lp2=0.5+0.5*Math.sin(time/300);ctx.strokeStyle=`rgba(192,132,252,${lp2})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-s*.2,s*.85,0,Math.PI*2);ctx.stroke();}
      break;
    }
    case"snipertower":{
      ctx.fillStyle="#1c1917"; ctx.beginPath(); ctx.moveTo(-s*.32,s*.5); ctx.lineTo(-s*.24,-s*1.0); ctx.lineTo(s*.24,-s*1.0); ctx.lineTo(s*.32,s*.5); ctx.fill();
      ctx.fillStyle="#292524"; [-s*.18,s*.1,s*.38].forEach(y=>ctx.fillRect(-s*.3,y,s*.6,s*.07));
      ctx.fillStyle="#fde047"; ctx.fillRect(s*.04,-s*.14,s*.72,s*.1); ctx.fillStyle="#854d0e"; ctx.beginPath(); ctx.arc(s*.04,-s*.09,s*.12,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#0c0a09"; ctx.fillRect(-s*.28,-s*1.0,s*.56,s*.2); ctx.fillStyle="#fde047"; ctx.beginPath(); ctx.arc(0,-s*.9,s*.13,0,Math.PI*2); ctx.fill();
      break;
    }
    case"cannon":{
      ctx.fillStyle="#1f2937"; ctx.fillRect(-s*.78,-s*.44,s*1.56,s*.8);
      [[-s*.62,-s*.44],[-s*.25,-s*.44],[s*.1,-s*.44],[s*.47,-s*.44]].forEach(([x,y])=>{ctx.fillStyle="#374151";ctx.fillRect(x,y,s*.28,s*.22);});
      const tl=Math.sin(time/340)*0.055; ctx.save(); ctx.rotate(tl);
      ctx.fillStyle="#111827"; ctx.fillRect(-s*.06,-s*.12,s*.7,s*.24);
      ctx.fillStyle="#374151"; ctx.fillRect(-s*.06,-s*.09,s*.62,s*.18); ctx.restore();
      ctx.strokeStyle="#78350f"; ctx.lineWidth=4;
      [[-s*.44,s*.28],[s*.44,s*.28]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,s*.24,0,Math.PI*2);ctx.stroke();for(let i=0;i<4;i++){const a=(i/4)*Math.PI*2;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*s*.06,y+Math.sin(a)*s*.06);ctx.lineTo(x+Math.cos(a)*s*.22,y+Math.sin(a)*s*.22);ctx.stroke();}});
      if(lvl>=1){const fp2=0.3+0.2*Math.sin(time/300);ctx.fillStyle=`rgba(251,146,60,${fp2})`;ctx.beginPath();ctx.arc(0,-s*.08,s*.62,0,Math.PI*2);ctx.fill();}
      break;
    }
    case"alchemylab":{
      ctx.fillStyle="#1a2e05"; ctx.fillRect(-s*.68,-s*.24,s*1.36,s*.7);
      ctx.fillStyle="#1c4414"; ctx.fillRect(-s*.6,-s*.52,s*1.2,s*.3);
      [[-s*.4,-s*.85],[0,-s*.85],[s*.4,-s*.85]].forEach(([fx,fy])=>{
        const fP=0.5+0.5*Math.sin(time/300+fx); ctx.fillStyle="#292524"; ctx.fillRect(fx-s*.07,fy,s*.14,s*.35);
        ctx.fillStyle=`rgba(163,230,53,${fP*0.85})`; ctx.beginPath(); ctx.arc(fx,fy,s*.14*fP,0,Math.PI*2); ctx.fill();
      });
      ctx.strokeStyle="#65a30d"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(-s*.4,-s*.5); ctx.lineTo(-s*.4,-s*.65); ctx.quadraticCurveTo(-s*.2,-s*.7,0,-s*.65); ctx.quadraticCurveTo(s*.2,-s*.7,s*.4,-s*.65); ctx.lineTo(s*.4,-s*.5); ctx.stroke();
      break;
    }
    case"wall":{
      const blks=[[-s*.72,-s*.86,s*.48,s*.42],[-s*.18,-s*.86,s*.48,s*.42],[s*.36,-s*.86,s*.42,s*.42],[-s*.55,-s*.4,s*.5,s*.44],[s*.04,-s*.4,s*.5,s*.44],[-s*.7,s*.08,s*.48,s*.44],[-s*.18,s*.08,s*.48,s*.44],[s*.34,s*.08,s*.44,s*.44]];
      blks.forEach(([bx,by,bw,bh],i)=>{ctx.fillStyle=i%2===0?"#57534e":"#6b7280";ctx.fillRect(bx,by,bw,bh);ctx.strokeStyle="rgba(0,0,0,0.3)";ctx.lineWidth=1;ctx.strokeRect(bx,by,bw,bh);});
      [[-s*.62,-s*.96],[-s*.24,-s*.96],[s*.14,-s*.96]].forEach(([x,y])=>{ctx.fillStyle="#6b7280";ctx.fillRect(x,y,s*.28,s*.14);});
      break;
    }
    case"palisade":{
      for(let i=-2;i<=2;i++){const px=i*s*.32;ctx.fillStyle=i%2===0?"#854d0e":"#92400e";ctx.fillRect(px-s*.12,-s*.8,s*.24,s*1.5);ctx.fillStyle="#a16207";ctx.beginPath();ctx.moveTo(px-s*.12,-s*.8);ctx.lineTo(px,-s*.98);ctx.lineTo(px+s*.12,-s*.8);ctx.fill();}
      break;
    }
    case"watchpost":{
      ctx.fillStyle="#292524"; ctx.beginPath(); ctx.moveTo(-s*.28,s*.5); ctx.lineTo(-s*.2,-s*.7); ctx.lineTo(s*.2,-s*.7); ctx.lineTo(s*.28,s*.5); ctx.fill();
      ctx.fillStyle="#422006"; ctx.fillRect(-s*.36,-s*.7,s*.72,s*.28); ctx.fillRect(-s*.46,-s*.72,s*.15,s*.3); ctx.fillRect(s*.32,-s*.72,s*.14,s*.3);
      const eP=0.7+0.3*Math.sin(time/700);
      ctx.fillStyle=`rgba(251,146,60,${eP})`; ctx.beginPath(); ctx.arc(0,-s*.45,s*.16,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#fff"; ctx.font=`${s*.18}px sans-serif`; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("👁",0,-s*.45);
      break;
    }
    default:{
      ctx.font=`${s*.7}px serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillStyle="#fff"; ctx.fillText(BDEF[type]?.icon||"?",0,0);
    }
  }
  ctx.restore();
}

// ── DRAW PROJECTILE ───────────────────────────────────────────────
function drawProj(ctx,p,time){
  const t=p.t;
  const px=p.sx+(p.ex-p.sx)*t;
  const arc=p.type==="cannon"?Math.sin(t*Math.PI)*34:p.type==="magetower"?Math.sin(t*Math.PI)*18:0;
  const py=p.sy+(p.ey-p.sy)*t-arc;

  ctx.save();
  switch(p.type){
    case"watchtower":{
      if(p.lvl===0){
        const ang=Math.atan2(p.ey-p.sy,p.ex-p.sx);
        ctx.translate(px,py); ctx.rotate(ang);
        ctx.strokeStyle="#93c5fd"; ctx.lineWidth=2.5; ctx.lineCap="round";
        ctx.beginPath(); ctx.moveTo(-10,0); ctx.lineTo(8,0); ctx.stroke();
        ctx.fillStyle="#bfdbfe"; ctx.beginPath(); ctx.moveTo(8,0); ctx.lineTo(2,4); ctx.lineTo(2,-4); ctx.fill();
      } else if(p.lvl===1){
        const gr=ctx.createRadialGradient(px,py,0,px,py,11);
        gr.addColorStop(0,"rgba(196,181,253,1)"); gr.addColorStop(1,"rgba(109,40,217,0)");
        ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(px,py,11,0,Math.PI*2); ctx.fill();
        ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2); ctx.fill();
        for(let i=0;i<4;i++){const sa=(i/4)*Math.PI*2+time/400;ctx.fillStyle="#c4b5fd";ctx.beginPath();ctx.arc(px+Math.cos(sa)*14,py+Math.sin(sa)*14,2.5,0,Math.PI*2);ctx.fill();}
      } else {
        // Lightning bolt
        ctx.strokeStyle="#fde047"; ctx.lineWidth=3;
        ctx.shadowColor="#fbbf24"; ctx.shadowBlur=14;
        ctx.beginPath(); ctx.moveTo(px,py);
        const ddx=p.ex-px,ddy=p.ey-py;
        ctx.lineTo(px+ddx*.33+8,py+ddy*.33-8); ctx.lineTo(px+ddx*.66-8,py+ddy*.66+8); ctx.lineTo(p.ex,p.ey);
        ctx.stroke(); ctx.shadowBlur=0;
        ctx.strokeStyle="rgba(253,224,71,0.5)"; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(px+ddx*.33+8,py+ddy*.33-8); ctx.lineTo(px+ddx*.33+22,py+ddy*.33+8); ctx.stroke();
      }
      break;
    }
    case"magetower":{
      const ang2=Math.atan2(p.ey-p.sy,p.ex-p.sx)+time*0.015;
      const gr2=ctx.createRadialGradient(px,py,0,px,py,13);
      gr2.addColorStop(0,"rgba(233,213,255,1)"); gr2.addColorStop(1,"rgba(126,34,206,0)");
      ctx.fillStyle=gr2; ctx.beginPath(); ctx.arc(px,py,13,0,Math.PI*2); ctx.fill();
      for(let i=0;i<3;i++){const sa=ang2+(i/3)*Math.PI*2;ctx.fillStyle="#a78bfa";ctx.beginPath();ctx.arc(px+Math.cos(sa)*14,py+Math.sin(sa)*14,3.5,0,Math.PI*2);ctx.fill();}
      break;
    }
    case"snipertower":{
      const dx=p.ex-p.sx,dy=p.ey-p.sy;
      ctx.strokeStyle="#fde047"; ctx.lineWidth=4; ctx.globalAlpha=Math.max(0,1-t*0.5);
      ctx.shadowColor="#fbbf24"; ctx.shadowBlur=16;
      ctx.beginPath(); ctx.moveTo(p.sx,p.sy); ctx.lineTo(px,py); ctx.stroke();
      ctx.shadowBlur=0; ctx.globalAlpha=1;
      ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(px,py,4,0,Math.PI*2); ctx.fill();
      break;
    }
    case"cannon":{
      const sz=p.lvl>=2?17:p.lvl>=1?13:9;
      const col=p.lvl>=2?"rgba(239,68,68,1)":p.lvl>=1?"rgba(251,113,0,1)":"rgba(120,113,108,1)";
      const gr3=ctx.createRadialGradient(px,py,0,px,py,sz+7);
      gr3.addColorStop(0,col); gr3.addColorStop(1,col.replace(",1)",",.0)"));
      ctx.fillStyle=gr3; ctx.beginPath(); ctx.arc(px,py,sz+7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#111"; ctx.beginPath(); ctx.arc(px,py,sz*0.55,0,Math.PI*2); ctx.fill();
      if(p.lvl>=1){ctx.globalAlpha=0.22;ctx.fillStyle="#9ca3af";ctx.beginPath();ctx.arc(px-(p.ex-p.sx)*0.08,py-(p.ey-p.sy)*0.08,sz*.7,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
      break;
    }
    default:{
      const gr4=ctx.createRadialGradient(px,py,0,px,py,9);
      gr4.addColorStop(0,"rgba(163,230,53,1)"); gr4.addColorStop(1,"rgba(101,163,13,0)");
      ctx.fillStyle=gr4; ctx.beginPath(); ctx.arc(px,py,9,0,Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();
}

// ── DRAW SOLDIER ──────────────────────────────────────────────────
function drawSoldier(ctx,s,time){
  const st=s.stype, hpR=s.hp/s.maxHp, {x,y}=s;
  if(s.frozen>0){ctx.fillStyle="rgba(147,197,253,0.3)";ctx.beginPath();ctx.arc(x,y+1,st.sz+6,0,Math.PI*2);ctx.fill();}
  if(st.rage&&s.hp/s.maxHp<0.5){const rp=0.4+0.4*Math.sin(time/200);ctx.fillStyle=`rgba(239,68,68,${rp*0.35})`;ctx.beginPath();ctx.arc(x,y,st.sz+8,0,Math.PI*2);ctx.fill();}
  if(st.healer){const ap=0.25+0.2*Math.sin(time/500);ctx.fillStyle=`rgba(251,191,36,${ap*0.3})`;ctx.beginPath();ctx.arc(x,y,55,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle="rgba(0,0,0,0.28)"; ctx.beginPath(); ctx.ellipse(x,y+st.sz+3,st.sz*0.9,st.sz*0.4,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=st.col; ctx.beginPath(); ctx.arc(x,y,st.sz,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=st.col2; ctx.beginPath(); ctx.arc(x,y-1,st.sz*.76,0,Math.PI*2); ctx.fill();
  if(s.level>1){ctx.font="bold 8px sans-serif";ctx.fillStyle="#fde68a";ctx.textAlign="center";ctx.fillText("⭐".repeat(s.level-1),x,y-st.sz-2);}
  ctx.font=`${st.sz*1.2}px serif`; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(st.icon,x,y);
  const bw=st.sz*2.5;
  ctx.fillStyle="rgba(0,0,0,0.65)"; ctx.fillRect(x-bw/2,y-st.sz-12,bw,4);
  ctx.fillStyle=hpR>0.5?"#22c55e":hpR>0.25?"#f59e0b":"#ef4444"; ctx.fillRect(x-bw/2,y-st.sz-12,bw*hpR,4);
  if(s.kills>0){ctx.font="bold 7px sans-serif";ctx.fillStyle="#fbbf24";ctx.textAlign="center";ctx.fillText(`×${s.kills}`,x,y-st.sz-17);}
}

// ── MAIN DRAW ─────────────────────────────────────────────────────
function drawGame(canvas,g,hovCell,tool,time){
  const ctx=canvas.getContext("2d");
  ctx.save(); ctx.translate(g.shake.x,g.shake.y);
  ctx.clearRect(-20,-20,MAP_W+40,MAP_H+40);

  const night=Math.max(0,g.dayT*0.55);

  // Sky
  ctx.fillStyle=`rgb(${Math.round(5+night*2)},${Math.round(12-night*5)},3)`;
  ctx.fillRect(-20,-20,MAP_W+40,MAP_H+40);
  // Stars
  if(night>0.1) for(let i=0;i<70;i++){
    const sx=(Math.sin(i*7.3+1)*.5+.5)*MAP_W, sy=(Math.sin(i*13.1+2)*.5+.5)*MAP_H;
    const tw=.5+.5*Math.sin(time/600+i);
    ctx.globalAlpha=night*tw*.8; ctx.fillStyle="#fff";
    ctx.beginPath(); ctx.arc(sx,sy,.7+Math.sin(i*5)*.5,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;

  // Hexes
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    const{x,y}=hxC(r,c), t=g.map[r][c], key=`${r},${c}`;
    const hasBld=!!g.bld[key];
    const isHov=hovCell&&hovCell[0]===r&&hovCell[1]===c;
    const canPl=tool&&TPLACEABLE[t]&&!hasBld;
    const isBlk=tool&&(!TPLACEABLE[t]||hasBld);
    const isSel=g.selCell&&g.selCell[0]===r&&g.selCell[1]===c;

    // Terrain fill
    const gd=ctx.createLinearGradient(x,y-HS,x,y+HS);
    if(t===4){const w=Math.sin(time/800+c*.8+r*1.2)*.12;gd.addColorStop(0,`rgba(30,58,95,${.85+w})`);gd.addColorStop(1,`rgba(30,64,175,${.9+w})`);}
    else{gd.addColorStop(0,TCOL[t][0]);gd.addColorStop(1,TCOL[t][1]);}
    hxPath(ctx,x,y); ctx.fillStyle=gd; ctx.fill();

    // Water ripple
    if(t===4){const rp=(time%2200)/2200;ctx.strokeStyle=`rgba(147,197,253,${.28*(1-rp)})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,HS*.48*rp,0,Math.PI*2);ctx.stroke();}
    // Terrain icons
    if(!hasBld){
      if(t===1){const sw=Math.sin(time/1200+c*.6)*.08;ctx.save();ctx.translate(x,y);ctx.rotate(sw);ctx.font="16px serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("🌲",0,0);ctx.restore();}
      else if(t===2){ctx.font="15px serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("🪨",x,y);}
      else if(t===3){ctx.font="14px serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("🌿",x,y);}
    }
    // Building glow
    if(hasBld){const def=BDEF[g.bld[key].type];if(def?.glow){hxPath(ctx,x,y,HS-1);const gl=ctx.createRadialGradient(x,y,0,x,y,HS);gl.addColorStop(0,def.glow+"32");gl.addColorStop(1,def.glow+"00");ctx.fillStyle=gl;ctx.fill();}}
    // Borders
    hxPath(ctx,x,y);
    if(isSel)         {ctx.strokeStyle="#fbbf24";ctx.lineWidth=3.5;}
    else if(g.showGrid){ctx.strokeStyle="rgba(0,0,0,0.22)";ctx.lineWidth=0.8;}
    else               {ctx.strokeStyle="rgba(0,0,0,0.1)"; ctx.lineWidth=0.4;}
    ctx.stroke(); ctx.lineWidth=1;
    // Hover: valid
    if(isHov&&canPl){
      hxPath(ctx,x,y); ctx.fillStyle="rgba(255,255,120,0.16)"; ctx.fill();
      ctx.strokeStyle="rgba(100,255,100,0.85)"; ctx.lineWidth=2.8; ctx.stroke(); ctx.lineWidth=1;
      ctx.globalAlpha=0.42; drawBuilding(ctx,x,y,tool,0,1,time); ctx.globalAlpha=1;
      if(BDEF[tool]?.range){ctx.save();ctx.setLineDash([4,4]);ctx.strokeStyle="rgba(250,204,21,0.55)";ctx.fillStyle="rgba(250,204,21,0.06)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,BDEF[tool].range*HS,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.restore();}
    }
    // Hover: invalid
    if(isHov&&isBlk){hxPath(ctx,x,y);ctx.fillStyle="rgba(255,0,0,0.13)";ctx.fill();ctx.strokeStyle="rgba(255,60,60,0.7)";ctx.lineWidth=2.5;ctx.stroke();ctx.lineWidth=1;}
    // Biome hint
    if(isHov&&!hasBld&&t!==0) g.hovBiome=BIOMES[t]; else if(!isHov) { /* don't clear */ }
  }

  // Buildings
  for(const[key,b] of Object.entries(g.bld)){
    const[r,c]=key.split(",").map(Number);
    const{x,y}=hxC(r,c);
    const hpR=b.hp/b.maxHp;
    const isSel=g.selCell&&g.selCell[0]===r&&g.selCell[1]===c;
    if(isSel){hxPath(ctx,x,y,HS+3);ctx.strokeStyle="#fbbf24";ctx.lineWidth=3.5;ctx.stroke();ctx.lineWidth=1;}
    // Range preview on hover
    if(!tool&&hovCell&&hovCell[0]===r&&hovCell[1]===c&&BDEF[b.type]?.range){
      const st=bStats(b),range=BDEF[b.type].range*(st.rM||1)*HS;
      ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle="rgba(147,197,253,0.55)";ctx.fillStyle="rgba(147,197,253,0.06)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,range,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.restore();
    }
    const sc=b.sc||1;
    drawBuilding(ctx,x,y,b.type,b.lvl||0,hpR,time,sc);

    // ── UPGRADE INDICATOR ──────────────────────────────────────
    const ups=UPG[b.type], lvl=b.lvl||0;
    if(b.type!=="townhall"&&ups){
      const maxLvl=ups.length;
      const iy=y+HS*.72;
      if(lvl<maxLvl){
        // Green hammer + level badge
        ctx.font="bold 11px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillStyle="#22c55e"; ctx.fillText("🔨",x-8,iy+5);
        // Level bubble
        ctx.fillStyle="rgba(34,197,94,0.85)"; ctx.beginPath(); ctx.arc(x+7,iy+5,7,0,Math.PI*2); ctx.fill();
        ctx.fillStyle="#fff"; ctx.font="bold 8px sans-serif"; ctx.fillText(lvl,x+7,iy+5);
      } else {
        // Max: gold star
        ctx.font="bold 12px sans-serif"; ctx.textAlign="center"; ctx.fillStyle="#fbbf24";
        ctx.fillText("✦",x,iy+5);
      }
    }
    // HP bar
    if(hpR<0.98){const bw=HS*1.18;ctx.fillStyle="rgba(0,0,0,0.65)";ctx.fillRect(x-bw/2,y+HS*.56,bw,4);ctx.fillStyle=hpR>0.5?"#22c55e":hpR>0.25?"#f59e0b":"#ef4444";ctx.fillRect(x-bw/2,y+HS*.56,bw*hpR,4);}
    // TH pulse at low HP
    if(b.type==="townhall"&&hpR<0.3){const p=.3+.7*Math.abs(Math.sin(time/500));ctx.fillStyle=`rgba(239,68,68,${p*.22})`;ctx.beginPath();ctx.arc(x,y,HS*1.2,0,Math.PI*2);ctx.fill();}
    // Wall connection lines
    if(b.type==="wall"||b.type==="palisade"){
      const[br2,bc2]=key.split(",").map(Number);
      ctx.strokeStyle=b.type==="wall"?"rgba(120,113,108,.65)":"rgba(133,77,14,.65)"; ctx.lineWidth=3.5;
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>{
        const nb=g.bld[`${br2+dr},${bc2+dc}`];
        if(nb&&(nb.type==="wall"||nb.type==="palisade")){
          const{x:nx,y:ny}=hxC(br2+dr,bc2+dc);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(nx,ny);ctx.stroke();
        }
      }); ctx.lineWidth=1;
    }
  }

  // Soldiers
  for(const s of g.soldiers) drawSoldier(ctx,s,time);

  // Enemies
  for(const e of g.enemies){
    if(e.spawnDelay>0) continue;
    const {x,y}=e, bob=Math.sin(time/260+e.bob)*2.5, sc=e.isBoss?1.7:1;
    if(e.frozen>0){ctx.fillStyle="rgba(147,197,253,0.25)";ctx.beginPath();ctx.arc(x,y+bob,15*sc,0,Math.PI*2);ctx.fill();}
    if(e.isBoss){const bg=ctx.createRadialGradient(x,y+bob,0,x,y+bob,55);bg.addColorStop(0,"rgba(251,191,36,0.4)");bg.addColorStop(1,"rgba(251,191,36,0)");ctx.fillStyle=bg;ctx.beginPath();ctx.arc(x,y+bob,55,0,Math.PI*2);ctx.fill();}
    // Necro heal beams
    if(e.heals) for(const e2 of g.enemies) if(e2!==e&&!e2.dead&&e2.spawnDelay<=0&&Math.hypot(e2.x-e.x,e2.y-e.y)<(e.healRad||80)&&Math.sin(time/300)>0){ctx.strokeStyle="rgba(34,197,94,0.45)";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y+bob);ctx.lineTo(e2.x,e2.y);ctx.stroke();ctx.lineWidth=1;}
    ctx.fillStyle="rgba(0,0,0,0.28)"; ctx.beginPath(); ctx.ellipse(x,y+17*sc,11*sc,5*sc,0,0,Math.PI*2); ctx.fill();
    // Fade when dying
    ctx.globalAlpha=Math.max(0.05,Math.min(1,e.hp/e.maxHp*10));
    ctx.font=`${e.isBoss?36:20}px serif`; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(e.icon,x,y+bob);
    if(e.armored){ctx.font="9px serif";ctx.fillText("🛡️",x+13,y+bob-13);}
    if(e.flying){ctx.font="9px serif";ctx.fillText("💨",x+11,y+bob+11);}
    if(e.poisoned>0){ctx.font="9px serif";ctx.fillText("☠️",x-12,y+bob-13);}
    if(e.frozen>0){ctx.font="9px serif";ctx.fillText("❄️",x,y+bob-22);}
    ctx.globalAlpha=1;
    const bw=e.isBoss?52:28, hp=e.hp/e.maxHp;
    ctx.fillStyle="rgba(0,0,0,0.8)"; ctx.fillRect(x-bw/2,y+bob-30*sc,bw,5);
    ctx.fillStyle=hp>0.5?"#22c55e":hp>0.25?"#f59e0b":"#ef4444"; ctx.fillRect(x-bw/2,y+bob-30*sc,bw*hp,5);
    if(e.isBoss){ctx.font="bold 10px sans-serif";ctx.fillStyle="#fde68a";ctx.textAlign="center";ctx.fillText(`👑 ${e.name||"BOSS"}`,x,y+bob-40);}
  }

  // Projectiles
  for(const p of g.projs) drawProj(ctx,p,time);

  // Particles
  for(const p of g.parts){ctx.globalAlpha=Math.max(0,p.life*1.5);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;

  // Floats
  for(const f of g.floats){
    const fy=f.center?MAP_H/2-50:f.y-f.t*55-16;
    const fx=f.center?MAP_W/2:f.x;
    const alpha=Math.max(0,1-f.t/(f.big?2.4:1.4));
    ctx.globalAlpha=alpha;
    ctx.font=`bold ${f.big?17:12}px 'Segoe UI',sans-serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.strokeStyle="rgba(0,0,0,0.97)"; ctx.lineWidth=3.5; ctx.strokeText(f.txt,fx,fy);
    ctx.fillStyle=f.txt.includes("KOMBO")?"#f87171":f.big?"#fbbf24":"#fde68a"; ctx.fillText(f.txt,fx,fy);
    ctx.lineWidth=1; ctx.globalAlpha=1;
  }

  // Wave announcement
  if(g.waveMsgT>0){
    const prog=g.waveMsgT>2.2?(2.6-g.waveMsgT)/.4:1;
    const alpha=Math.min(1,prog)*Math.min(1,g.waveMsgT);
    ctx.globalAlpha=alpha;
    ctx.font="bold 40px Georgia,serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.strokeStyle="rgba(0,0,0,0.97)"; ctx.lineWidth=10;
    ctx.strokeText(g.waveMsg,MAP_W/2+(1-prog)*-130,MAP_H/2);
    ctx.fillStyle=g.waveMsg.includes("BOSS")||g.waveMsg.includes("LEGEND")?"#fbbf24":"#f87171";
    ctx.fillText(g.waveMsg,MAP_W/2+(1-prog)*-130,MAP_H/2);
    ctx.lineWidth=1; ctx.globalAlpha=1;
  }

  // Victory particles
  for(const p of g.victoryParts){ctx.globalAlpha=Math.max(0,p.life*.7);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;

  // Fog vignette
  const fog=ctx.createRadialGradient(MAP_W/2,MAP_H/2,Math.min(MAP_W,MAP_H)*.32,MAP_W/2,MAP_H/2,Math.max(MAP_W,MAP_H)*.72);
  fog.addColorStop(0,"rgba(0,0,0,0)"); fog.addColorStop(1,`rgba(0,0,0,${.25+night*.3})`);
  ctx.fillStyle=fog; ctx.fillRect(0,0,MAP_W,MAP_H);
  if(night>0){ctx.fillStyle=`rgba(5,5,30,${night*.5})`;ctx.fillRect(0,0,MAP_W,MAP_H);}

  // Spawn arrows
  for(const e of g.enemies){
    if(e.spawnDelay<=0||e.spawnDelay>.8) continue;
    let ax,ay,an;
    if(e.y<0)      {ax=Math.max(14,Math.min(MAP_W-14,e.x));ay=16;an=Math.PI/2;}
    else if(e.x>MAP_W){ax=MAP_W-16;ay=Math.max(14,Math.min(MAP_H-14,e.y));an=Math.PI;}
    else if(e.y>MAP_H){ax=Math.max(14,Math.min(MAP_W-14,e.x));ay=MAP_H-16;an=-Math.PI/2;}
    else           {ax=16;ay=Math.max(14,Math.min(MAP_H-14,e.y));an=0;}
    ctx.save();ctx.translate(ax,ay);ctx.rotate(an);ctx.globalAlpha=.8*(1-e.spawnDelay);
    ctx.fillStyle="#f87171";ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-7,6);ctx.lineTo(-7,-6);ctx.fill();
    ctx.restore();ctx.globalAlpha=1;
  }
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════
//  REACT COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function RealmBuilder(){
  const gRef=useRef(initGame());
  const[,fr]=useState(0);
  const rafRef=useRef(null);
  const canvasRef=useRef(null);
  const[tool,setTool]=useState(null);
  const hovRef=useRef(null);
  const toolRef=useRef(null); toolRef.current=tool;
  const timeRef=useRef(0);
  const hsRef=useRef(0);
  const g=gRef.current;
  const rerender=useCallback(()=>fr(n=>n+1),[]);

  useEffect(()=>{try{hsRef.current=parseInt(sessionStorage.getItem("rb5_hs")||"0");}catch{};},[]);

  const loopFn=useCallback(()=>{
    const frame=ts=>{
      timeRef.current=ts;
      tick(gRef.current,ts);
      if(canvasRef.current) drawGame(canvasRef.current,gRef.current,hovRef.current,toolRef.current,ts);
      rerender();
      if(gRef.current.phase==="playing") rafRef.current=requestAnimationFrame(frame);
      else rerender();
    };
    rafRef.current=requestAnimationFrame(frame);
  },[rerender]);
  useEffect(()=>()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current);},[]);

  const startGame=useCallback(()=>{
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    gRef.current=initGame(); gRef.current.phase="playing";
    setTool(null); rerender(); setTimeout(loopFn,20);
  },[loopFn,rerender]);

  // Keyboard
  useEffect(()=>{
    const kmap={}; BUILD_KEYS.forEach(k=>{if(BDEF[k].key)kmap[BDEF[k].key]=k;});
    const h=e=>{
      const gt=gRef.current;
      if(e.key==="Escape"){setTool(null);gt.selCell=null;rerender();return;}
      if(e.key.toLowerCase()==="p"){gt.paused=!gt.paused;if(!gt.paused){gt.lastTs=null;loopFn();}rerender();return;}
      if(e.key.toLowerCase()==="g"){gt.showGrid=!gt.showGrid;return;}
      if(e.key.toLowerCase()==="a"){gt.autoRepair=!gt.autoRepair;rerender();return;}
      const bk=kmap[e.key.toLowerCase()];
      if(bk){setTool(bk);gt.selCell=null;rerender();}
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[loopFn,rerender]);

  const getHex=useCallback(e=>{
    const c=canvasRef.current; if(!c)return null;
    const rect=c.getBoundingClientRect();
    return px2hex((e.clientX-rect.left)*(MAP_W/rect.width),(e.clientY-rect.top)*(MAP_H/rect.height));
  },[]);

  const handleClick=useCallback(e=>{
    const cell=getHex(e); if(!cell)return;
    const[r,c]=cell, key=`${r},${c}`, gt=gRef.current;
    if(gt.phase!=="playing")return;
    if(e.button===2||e.ctrlKey){setTool(null);gt.selCell=null;rerender();return;}
    if(!toolRef.current){
      gt.selCell=gt.bld[key]?[r,c]:null; rerender(); return;
    }
    const def=BDEF[toolRef.current];
    if(!def?.canPlace) return;
    if(gt.map[r][c]!==0) return;
    if(gt.bld[key]) return;
    if(Object.entries(def.cost).some(([k,v])=>(gt.res[k]||0)<v)) return;
    Object.entries(def.cost).forEach(([k,v])=>gt.res[k]=Math.max(0,(gt.res[k]||0)-v));
    gt.bld[key]={type:toolRef.current,hp:def.hp,maxHp:def.hp,lvl:0,lastAtk:0,spawnT:0,sc:0.1};
    gt.parts.push(...mkDust(hxC(r,c).x,hxC(r,c).y));
    SFX.build(); rerender();
  },[getHex,rerender]);

  useEffect(()=>{
    if((g.phase==="gameover"||g.phase==="victory")&&g.score>hsRef.current){
      hsRef.current=g.score; try{sessionStorage.setItem("rb5_hs",String(g.score));}catch{}
    }
  },[g.phase,g.score]);

  const tryUpgrade=useCallback(()=>{
    const gt=gRef.current; if(!gt.selCell)return;
    const[r,c]=gt.selCell, key=`${r},${c}`, b=gt.bld[key]; if(!b)return;
    const ups=UPG[b.type]; if(!ups)return;
    const lvl=b.lvl||0; if(lvl>=ups.length)return;
    const up=ups[lvl];
    if(Object.entries(up.cost).some(([k,v])=>(gt.res[k]||0)<v))return;
    Object.entries(up.cost).forEach(([k,v])=>gt.res[k]=Math.max(0,(gt.res[k]||0)-v));
    b.lvl=(b.lvl||0)+1;
    // Apply HP multiplier
    const newMaxHp=(b.maxHp/b.hp)*b.maxHp; // preserve ratio... actually just scale
    b.maxHp=BDEF[b.type].hp*1.28**(b.lvl);
    b.hp=Math.min(b.hp,b.maxHp);
    gt.totalUpg++;
    gt.parts.push(...mkDust(hxC(r,c).x,hxC(r,c).y));
    SFX.upgrade(); rerender();
  },[rerender]);

  const trySell=useCallback(()=>{
    const gt=gRef.current; if(!gt.selCell)return;
    const[r,c]=gt.selCell, key=`${r},${c}`, b=gt.bld[key];
    if(!b||b.type==="townhall")return;
    const def=BDEF[b.type];
    Object.entries(def.cost).forEach(([k,v])=>gt.res[k]=Math.min(9999,(gt.res[k]||0)+Math.floor(v*.5)));
    delete gt.bld[key]; gt.selCell=null;
    SFX.sell(); rerender();
  },[rerender]);

  const doResearch=useCallback(id=>{
    const gt=gRef.current; if(gt.research.has(id))return;
    const r=RESEARCH.find(x=>x.id===id); if(!r)return;
    if(Object.entries(r.cost).some(([k,v])=>(gt.res[k]||0)<v))return;
    Object.entries(r.cost).forEach(([k,v])=>gt.res[k]=Math.max(0,(gt.res[k]||0)-v));
    gt.research.add(id); gt.researchQ.push({...r,t:3.5});
    SFX.achieve(); rerender();
  },[rerender]);

  const callEarlyWave=useCallback(()=>{
    const gt=gRef.current; if(gt.waveCd<5||gt.wavePause>0)return;
    const bonus=Math.round((gt.res.gold||0)*.25);
    gt.res.gold=Math.min(9999,(gt.res.gold||0)+bonus);
    gt.floats.push({id:uid(),x:MAP_W/2,y:MAP_H/3,txt:`⚡ Frühe Welle! +${bonus}💰`,t:0,big:true,center:true});
    gt.waveCd=0; rerender();
  },[rerender]);

  // Derived state
  const canAfford=bt=>Object.entries(BDEF[bt]?.cost||{}).every(([k,v])=>(g.res[k]||0)>=v);
  const th=g.bld[`${TH_R},${TH_C}`];
  const thHp=th?th.hp/th.maxHp:0;
  const popCap=getPopCap(g.bld), popUsed=g.soldiers.length;
  const selB=g.selCell?g.bld[`${g.selCell[0]},${g.selCell[1]}`]:null;
  const selDef=selB?BDEF[selB.type]:null;
  const selUps=selB?UPG[selB.type]:null;
  const selLvl=selB?.lvl||0;
  const nextUp=selUps&&selLvl<selUps.length?selUps[selLvl]:null;
  const canUpgrade=nextUp&&Object.entries(nextUp.cost).every(([k,v])=>(g.res[k]||0)>=v);
  const nwp=g.phase==="playing"?nextWavePreview(g.wave):{by:{},isBoss:false,cnt:0};
  const bossE=g.enemies.find(e=>e.isBoss&&!e.dead&&e.spawnDelay<=0);

  // ── END SCREENS ────────────────────────────────────────────────
  if(g.phase!=="playing") return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.2);border-radius:4px}@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}@keyframes twk{0%,100%{opacity:0.2}50%{opacity:0.9}}`}</style>
      {g.phase==="start"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"radial-gradient(ellipse,#0d2408 0%,#040c03 100%)",fontFamily:"Georgia,serif",color:"#d1fae5",gap:18,padding:20,position:"relative",overflow:"hidden"}}>
          {Array.from({length:55},(_,i)=><div key={i} style={{position:"absolute",left:`${(Math.sin(i*7.3)*.5+.5)*100}%`,top:`${(Math.sin(i*11.1)*.5+.5)*100}%`,width:Math.random()*3+.5,height:Math.random()*3+.5,borderRadius:"50%",background:"#fff",animation:`twk ${1.5+Math.random()*2.5}s ${Math.random()*3}s infinite`,opacity:.3+Math.random()*.5}}/>)}
          <div style={{fontSize:84,animation:"bob 3.2s ease-in-out infinite",filter:"drop-shadow(0 0 40px rgba(251,191,36,0.8))"}}>🏰</div>
          <h1 style={{fontSize:"clamp(28px,5vw,56px)",letterSpacing:7,margin:0,textAlign:"center",background:"linear-gradient(135deg,#fde68a,#f59e0b,#fbbf24 60%,#fde68a)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",filter:"drop-shadow(0 2px 16px rgba(251,191,36,0.6))"}}>REALM BUILDER</h1>
          <p style={{color:"#6ee7b7",fontSize:13,letterSpacing:3,fontFamily:"sans-serif"}}>HEX EDITION · V5 · COMPLETE</p>
          {hsRef.current>0&&<p style={{color:"#fbbf24",fontSize:13,fontFamily:"sans-serif"}}>🏆 Bester Score: {hsRef.current}</p>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"6px 16px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:14,padding:"12px 20px",maxWidth:560,width:"100%",fontFamily:"sans-serif"}}>
            {BUILD_KEYS.filter(k=>BDEF[k].canPlace).map(bt=>(
              <div key={bt} style={{display:"flex",gap:5,alignItems:"center"}}>
                <span style={{fontSize:14}}>{BDEF[bt].icon}</span>
                <div>
                  <div style={{color:"#e5e7eb",fontWeight:600,fontSize:10}}>{BDEF[bt].name}</div>
                  <div style={{fontSize:9,color:"#6b7280"}}>{BDEF[bt].desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:"#4b5563",fontFamily:"sans-serif",textAlign:"center",lineHeight:2.1}}>
            Tasten 1-0, Q-P: Gebäude · P: Pause · G: Gitter · A: Auto-Reparatur · ESC: Abbrechen<br/>
            🔨 Grüner Hammer = Upgrade verfügbar · ✦ = Max-Stufe · Rechtsklick = Abbrechen
          </div>
          <button onClick={startGame} style={{padding:"14px 52px",fontSize:18,fontWeight:700,letterSpacing:3,fontFamily:"Georgia,serif",background:"linear-gradient(135deg,#92400e,#b45309)",color:"#fef3c7",border:"2px solid #f59e0b",borderRadius:12,cursor:"pointer",boxShadow:"0 4px 32px rgba(245,158,11,0.55)"}}>⚔️  SPIEL STARTEN</button>
        </div>
      )}
      {g.phase==="gameover"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"radial-gradient(ellipse,#1c0505 0%,#050005 100%)",fontFamily:"Georgia,serif",color:"#fef2f2",gap:20,padding:20}}>
          <div style={{fontSize:76}}>💀</div>
          <h1 style={{fontSize:"clamp(20px,4vw,40px)",letterSpacing:3,color:"#f87171",textShadow:"0 0 40px rgba(248,113,113,0.7)",margin:0}}>DEIN KÖNIGREICH FIEL</h1>
          {g.score>0&&g.score>=hsRef.current&&<div style={{color:"#fbbf24",fontSize:14,fontFamily:"sans-serif"}}>🏆 NEUER HIGHSCORE!</div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"18px 28px",fontFamily:"sans-serif"}}>
            {[["⚔️","Welle",g.wave],["🏆","Score",Math.floor(g.score)],["☠️","Kills",g.kills],["⚡","Max Kombo",g.maxCombo],["👑","Boss-Kills",g.bossKills],["⬆️","Upgrades",g.totalUpg]].map(([ic,lbl,val])=>(
              <div key={lbl} style={{textAlign:"center"}}><div style={{fontSize:22}}>{ic}</div><div style={{color:"#6b7280",fontSize:11,marginTop:2}}>{lbl}</div><div style={{color:"#fbbf24",fontSize:22,fontWeight:700,fontFamily:"Georgia,serif"}}>{val}</div></div>
            ))}
          </div>
          <button onClick={startGame} style={{padding:"13px 42px",fontSize:17,letterSpacing:2,fontFamily:"Georgia,serif",background:"linear-gradient(135deg,#7f1d1d,#991b1b)",color:"#fef2f2",border:"2px solid #ef4444",borderRadius:12,cursor:"pointer",boxShadow:"0 4px 20px rgba(239,68,68,0.4)"}}>🔄  NOCHMAL</button>
        </div>
      )}
      {g.phase==="victory"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"radial-gradient(ellipse,#0a2f0a 0%,#030d03 100%)",fontFamily:"Georgia,serif",color:"#d1fae5",gap:20,padding:20}}>
          <div style={{fontSize:80,animation:"bob 2s ease-in-out infinite"}}>👑</div>
          <h1 style={{fontSize:"clamp(22px,5vw,46px)",letterSpacing:4,color:"#fbbf24",textShadow:"0 0 50px rgba(251,191,36,0.8)",margin:0}}>SIEG! KÖNIGREICH VERTEIDIGT!</h1>
          <p style={{color:"#6ee7b7",fontFamily:"sans-serif",fontSize:15,textAlign:"center"}}>Alle 20 Wellen abgewehrt!<br/>Score: {Math.floor(g.score)} · Kills: {g.kills}</p>
          <button onClick={startGame} style={{padding:"13px 42px",fontSize:17,letterSpacing:2,fontFamily:"Georgia,serif",background:"linear-gradient(135deg,#14532d,#166534)",color:"#dcfce7",border:"2px solid #22c55e",borderRadius:12,cursor:"pointer"}}>🔄  NOCHMAL</button>
        </div>
      )}
    </div>
  );

  // ── PLAYING HUD ───────────────────────────────────────────────
  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden",background:"#040c03",fontFamily:"'Segoe UI',system-ui,sans-serif",color:"#d1fae5",userSelect:"none"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.18);border-radius:4px}@keyframes achIn{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0.35}}.warn{animation:blink .7s infinite}button:active{transform:scale(0.96)}button{transition:all .12s}`}</style>

      {/* Achievement popups */}
      <div style={{position:"fixed",top:58,right:12,zIndex:999,display:"flex",flexDirection:"column",gap:7,pointerEvents:"none"}}>
        {g.achieveQ.map(a=>(
          <div key={a.id} style={{background:"rgba(0,0,0,0.96)",border:"1px solid #fbbf24",borderRadius:10,padding:"9px 14px",minWidth:200,animation:"achIn 0.4s ease",boxShadow:"0 4px 20px rgba(251,191,36,0.35)"}}>
            <div style={{fontSize:9,color:"#fbbf24",letterSpacing:1,marginBottom:2}}>🏅 ERRUNGENSCHAFT</div>
            <div style={{fontWeight:700,color:"#fef3c7",fontSize:12}}>{a.icon} {a.title}</div>
          </div>
        ))}
        {g.researchQ.map(r=>(
          <div key={r.id} style={{background:"rgba(0,0,0,0.96)",border:"1px solid #a78bfa",borderRadius:10,padding:"9px 14px",minWidth:200,animation:"achIn 0.4s ease"}}>
            <div style={{fontSize:9,color:"#a78bfa",marginBottom:2}}>🔬 FORSCHUNG</div>
            <div style={{color:"#e9d5ff",fontSize:12}}>{r.icon} {r.name}</div>
          </div>
        ))}
      </div>

      {/* Boss HP bar */}
      {bossE&&(
        <div style={{position:"fixed",top:58,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,0.92)",border:"1px solid rgba(251,191,36,0.5)",borderRadius:10,padding:"7px 18px",zIndex:997,width:300,boxShadow:"0 4px 24px rgba(251,191,36,0.35)"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:12,color:"#fbbf24",fontWeight:700}}>👑 {bossE.name||"BOSS"}</span>
            <span style={{fontSize:10,color:"#9ca3af"}}>{Math.ceil(bossE.hp)}/{Math.ceil(bossE.maxHp)}</span>
          </div>
          <div style={{background:"rgba(255,255,255,0.12)",borderRadius:4,height:10,overflow:"hidden"}}>
            <div style={{width:`${(bossE.hp/bossE.maxHp)*100}%`,height:"100%",background:"linear-gradient(90deg,#fbbf24,#ef4444)",transition:"width .3s"}}/>
          </div>
        </div>
      )}

      {/* Wave cleared pause */}
      {g.wavePause>0&&(
        <div style={{position:"fixed",top:110,left:"50%",transform:"translateX(-50%)",background:"rgba(34,197,94,0.15)",border:"1px solid rgba(34,197,94,0.4)",borderRadius:8,padding:"5px 14px",zIndex:996,fontSize:11,color:"#86efac",zIndex:996}}>
          ✅ Welle abgewehrt · Pause: {Math.ceil(g.wavePause)}s
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",minHeight:48,flexShrink:0,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255,255,255,0.07)",flexWrap:"wrap"}}>
        <span style={{color:"#fbbf24",fontSize:13,fontWeight:700,letterSpacing:2,fontFamily:"Georgia,serif",marginRight:3}}>🏰</span>

        {/* Resources with production rates */}
        {RES_LIST.map(r=>{
          const v=Math.floor(g.res[r]||0), rate=g.resRate[r]||0, low=v<30&&r!=="iron";
          return (
            <div key={r} className={low?"warn":""} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"2px 8px",background:`rgba(${low?"239,68,68":"255,255,255"},${low?.09:.04})`,border:`1px solid ${low?"rgba(239,68,68,.45)":RCOL[r]+"20"}`,borderRadius:18,minWidth:50}}>
              <div style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:11}}>{RICON[r]}</span><span style={{color:low?"#f87171":RCOL[r],fontWeight:700,fontSize:13,minWidth:24,textAlign:"right"}}>{v}</span></div>
              {rate>0.05&&<div style={{fontSize:8,color:RCOL[r],opacity:.75}}>+{rate.toFixed(1)}/s</div>}
            </div>
          );
        })}

        <div style={{flex:1}}/>

        <div style={{fontSize:12,opacity:.7}}>{g.dayT>0.5?"🌙":"☀️"}</div>
        {g.autoRepair&&<div style={{fontSize:9,color:"#86efac",padding:"2px 6px",background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.25)",borderRadius:12}}>🔧 Rep.</div>}
        {g.combo>=3&&<div style={{padding:"3px 9px",background:"rgba(248,113,113,.15)",border:"1px solid rgba(248,113,113,.4)",borderRadius:18}}><span style={{color:"#f87171",fontWeight:700,fontSize:12}}>⚡{g.combo}×</span></div>}

        {/* Pop cap */}
        <div style={{padding:"3px 9px",background:popUsed>=popCap?"rgba(239,68,68,.12)":"rgba(34,197,94,.08)",border:`1px solid ${popUsed>=popCap?"rgba(239,68,68,.35)":"rgba(34,197,94,.25)"}`,borderRadius:18,textAlign:"center"}}>
          <div style={{color:"#9ca3af",fontSize:8}}>Bevölk.</div>
          <div style={{color:popUsed>=popCap?"#f87171":"#86efac",fontWeight:700,fontSize:13}}>{popUsed}/{popCap}</div>
        </div>

        <div style={{padding:"3px 9px",background:"rgba(239,68,68,.09)",border:"1px solid rgba(239,68,68,.2)",borderRadius:18,textAlign:"center"}}>
          <div style={{color:"#fca5a5",fontSize:8}}>Feinde</div>
          <div style={{color:"#f87171",fontWeight:700,fontSize:13}}>{g.enemies.filter(e=>e.spawnDelay<=0&&!e.dead).length}</div>
        </div>

        {/* Wave */}
        <div style={{padding:"3px 10px",background:"rgba(245,158,11,.09)",border:"1px solid rgba(245,158,11,.25)",borderRadius:18,textAlign:"center",minWidth:78}}>
          <div style={{color:"#fbbf24",fontSize:10,fontWeight:700,fontFamily:"Georgia,serif"}}>WELLE {g.wave}/20</div>
          <div style={{position:"relative",height:4,background:"rgba(255,255,255,.1)",borderRadius:4,overflow:"hidden",margin:"2px 0"}}>
            <div style={{position:"absolute",left:0,top:0,height:"100%",
              width:`${Math.max(0,100-(g.waveCd/(34+Math.min(g.wave,20)*3.5))*100)}%`,
              background:"linear-gradient(90deg,#f59e0b,#ef4444)",transition:"width .3s"}}/>
          </div>
          <div style={{color:"#d97706",fontSize:8}}>{g.wavePause>0?"✅ Pause":g.waveCd>3?`⏳ ${Math.ceil(g.waveCd)}s`:"⚔️ Bald!"}</div>
        </div>

        {/* TH HP */}
        <div style={{minWidth:110}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:1}}>
            <span style={{fontSize:9,color:"#9ca3af"}}>🏰 Stadtburg</span>
            <span style={{fontSize:9,color:"#9ca3af"}}>{Math.ceil(th?.hp||0)}</span>
          </div>
          <div style={{background:"rgba(255,255,255,.1)",borderRadius:4,height:8,overflow:"hidden"}}>
            <div style={{width:`${thHp*100}%`,height:"100%",transition:"width .2s",
              background:thHp>.6?"linear-gradient(90deg,#22c55e,#16a34a)":thHp>.3?"linear-gradient(90deg,#f59e0b,#d97706)":"linear-gradient(90deg,#ef4444,#dc2626)"}}/>
          </div>
        </div>

        {/* Score */}
        <div style={{padding:"3px 10px",background:"rgba(251,191,36,.07)",border:"1px solid rgba(251,191,36,.18)",borderRadius:18,textAlign:"center"}}>
          <div style={{color:"#9ca3af",fontSize:8}}>Score</div>
          <div style={{color:"#fbbf24",fontSize:14,fontWeight:700,fontFamily:"Georgia,serif"}}>{Math.floor(g.score)}</div>
          {hsRef.current>0&&<div style={{color:"#4b5563",fontSize:7}}>HS:{hsRef.current}</div>}
        </div>

        {/* Controls */}
        {[
          [g.paused?"▶":"⏸", ()=>{gRef.current.paused=!gRef.current.paused;if(!gRef.current.paused){gRef.current.lastTs=null;loopFn();}rerender();}, g.paused?"#fbbf24":undefined],
          [g.speed===1?"1×":"2×", ()=>{gRef.current.speed=g.speed===1?2:1;rerender();}, g.speed>1?"#f97316":undefined],
          ["⊞", ()=>{gRef.current.showGrid=!gRef.current.showGrid;rerender();}, g.showGrid?"#6ee7b7":undefined],
        ].map(([lbl,fn,ac])=>(
          <button key={lbl} onClick={fn} style={{padding:"4px 9px",borderRadius:7,cursor:"pointer",fontSize:12,background:ac?ac+"22":"rgba(255,255,255,.07)",border:`1px solid ${ac||"rgba(255,255,255,.15)"}`,color:"#e5e7eb"}}>{lbl}</button>
        ))}
      </div>

      {/* ── MAP ── */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:"radial-gradient(ellipse,#0e2410 0%,#040b03 100%)",overflow:"hidden",padding:4,position:"relative"}}>
        {g.paused&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,fontSize:38,fontFamily:"Georgia,serif",color:"#fbbf24",letterSpacing:5}}>⏸ PAUSE</div>}
        {g.shake.t>.2&&<div style={{position:"absolute",inset:0,background:"rgba(239,68,68,.13)",zIndex:9,pointerEvents:"none"}}/>}
        <canvas ref={canvasRef} width={MAP_W} height={MAP_H}
          onClick={handleClick}
          onContextMenu={e=>{e.preventDefault();handleClick({...e,button:2});}}
          onMouseMove={e=>{hovRef.current=getHex(e);}}
          onMouseLeave={()=>{hovRef.current=null;}}
          style={{display:"block",maxWidth:"100%",maxHeight:"100%",cursor:tool?"crosshair":"default",border:"2px solid rgba(255,255,255,.07)",borderRadius:10,boxShadow:"0 0 80px rgba(0,0,0,.92)"}}/>
        {/* Biome label */}
        {g.hovBiome&&!tool&&<div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,.8)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"3px 10px",fontSize:11,color:"#9ca3af",pointerEvents:"none"}}>{g.hovBiome}</div>}
      </div>

      {/* ── BOTTOM BAR ── */}
      <div style={{flexShrink:0,background:"rgba(0,0,0,.93)",backdropFilter:"blur(14px)",borderTop:"1px solid rgba(255,255,255,.07)",display:"flex",flexDirection:"column",overflow:"hidden",height:170}}>
        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,.07)",flexShrink:0}}>
          {[["build","🏗️ Bauen"],["army","⚔️ Armee"],["stats","📊 Statistik"],["research","🔬 Forschung"]].map(([tab,lbl])=>(
            <button key={tab} onClick={()=>{gRef.current.bottomTab=tab;rerender();}} style={{padding:"5px 14px",border:"none",borderBottom:`2px solid ${g.bottomTab===tab?"#fbbf24":"transparent"}`,background:"transparent",color:g.bottomTab===tab?"#fbbf24":"#6b7280",fontSize:11,cursor:"pointer",fontWeight:g.bottomTab===tab?700:400}}>
              {lbl}
            </button>
          ))}
        </div>

        <div style={{flex:1,overflow:"hidden",display:"flex"}}>

          {/* ── BUILD TAB ── */}
          {g.bottomTab==="build"&&<>
            {/* Left: info panel */}
            <div style={{width:208,flexShrink:0,borderRight:"1px solid rgba(255,255,255,.07)",padding:"8px 10px",overflowY:"auto"}}>
              {selB&&selDef?(
                <>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                    <span style={{fontSize:22}}>{selDef.icon}</span>
                    <div>
                      <div style={{fontWeight:700,fontSize:12,color:"#fef3c7"}}>{selDef.name}</div>
                      <div style={{fontSize:9,color:"#6b7280"}}>{"★".repeat(selLvl)||"Basis-Stufe"}</div>
                    </div>
                  </div>
                  <div style={{fontSize:10,color:"#9ca3af",marginBottom:6,lineHeight:1.6}}>
                    HP: {Math.ceil(selB.hp)}/{Math.ceil(selB.maxHp)}<br/>
                    {selDef.prod&&Object.keys(selDef.prod).length>0&&`Prod: ${Object.entries(selDef.prod).map(([k,v])=>`${RICON[k]}${v}/s`).join(" ")}`}
                    {selDef.atk&&`⚔️ ${selDef.atk} dmg · Reichw. ${selDef.range}h`}
                    {selDef.soldierType&&<><br/>Einheit: {getSoldierType(selB.type,selLvl)?.name}<br/>Spawn: {selDef.spawnCd}s · {selDef.foodCost}🍖</>}
                  </div>
                  {nextUp&&(<>
                    <div style={{fontSize:9,color:"#4b5563",marginBottom:2}}>⬆️ Upgrade → {nextUp.label}</div>
                    <div style={{fontSize:9,color:"#86efac",marginBottom:2}}>{nextUp.note}</div>
                    <div style={{fontSize:9,color:"#6b7280",marginBottom:5}}>{Object.entries(nextUp.cost).map(([k,v])=>`${RICON[k]}${v}`).join(" ")}</div>
                    <button onClick={tryUpgrade} disabled={!canUpgrade} style={{width:"100%",padding:"5px",borderRadius:7,marginBottom:4,cursor:canUpgrade?"pointer":"not-allowed",fontSize:10,background:canUpgrade?"rgba(251,191,36,.18)":"rgba(255,255,255,.04)",border:`1px solid ${canUpgrade?"#fbbf24":"rgba(255,255,255,.1)"}`,color:canUpgrade?"#fef3c7":"#6b7280"}}>🔨 Upgrade</button>
                  </>)}
                  {selLvl>=(selUps?.length||0)&&selUps&&<div style={{fontSize:9,color:"#fbbf24",textAlign:"center",marginBottom:4}}>✦ Maximale Stufe erreicht</div>}
                  {selDef.canPlace&&<button onClick={trySell} style={{width:"100%",padding:"5px",borderRadius:7,cursor:"pointer",fontSize:10,background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.25)",color:"#fca5a5",marginBottom:3}}>💸 Verkaufen (50% zurück)</button>}
                  <button onClick={()=>{gRef.current.selCell=null;rerender();}} style={{width:"100%",padding:"3px",borderRadius:6,cursor:"pointer",fontSize:9,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)",color:"#4b5563"}}>✕ Schließen</button>
                </>
              ):(
                <>
                  <div style={{fontSize:9,color:"#6b7280",marginBottom:5,letterSpacing:1}}>👀 NÄCHSTE WELLE {g.wave+1}</div>
                  <div style={{fontSize:10,color:nwp.isBoss?"#fbbf24":"#9ca3af",fontWeight:nwp.isBoss?700:400,marginBottom:4}}>
                    {nwp.isBoss?"👑 BOSS-WELLE!":""} {nwp.cnt} Feinde
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:7}}>
                    {Object.entries(nwp.by).map(([ic,cnt])=><span key={ic} style={{fontSize:10,color:"#9ca3af",background:"rgba(255,255,255,.06)",borderRadius:6,padding:"2px 5px"}}>{ic}×{cnt}</span>)}
                  </div>
                  <button onClick={callEarlyWave} disabled={g.waveCd<5||g.wavePause>0}
                    style={{width:"100%",padding:"5px",borderRadius:7,marginBottom:6,cursor:(g.waveCd>=5&&g.wavePause===0)?"pointer":"not-allowed",background:(g.waveCd>=5&&g.wavePause===0)?"rgba(251,191,36,.12)":"rgba(255,255,255,.04)",border:`1px solid ${(g.waveCd>=5&&g.wavePause===0)?"rgba(251,191,36,.4)":"rgba(255,255,255,.1)"}`,color:(g.waveCd>=5&&g.wavePause===0)?"#fbbf24":"#4b5563",fontSize:10,fontWeight:700}}>
                    ⚡ Frühe Welle (+25% Gold)
                  </button>
                  <div style={{fontSize:9,color:"#6b7280",marginBottom:3}}>🎯 Turm-Ziel</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:2}}>
                    {[["first","Erster"],["strongest","Stärkster"],["weakest","Schwächster"]].map(([m,l])=>(
                      <button key={m} onClick={()=>{gRef.current.targetMode=m;rerender();}} style={{padding:"3px 2px",borderRadius:4,cursor:"pointer",fontSize:8,background:g.targetMode===m?"rgba(147,197,253,.2)":"rgba(255,255,255,.04)",border:`1px solid ${g.targetMode===m?"#93c5fd":"rgba(255,255,255,.1)"}`,color:g.targetMode===m?"#93c5fd":"#6b7280"}}>{l}</button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Building palette */}
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{flex:1,display:"flex",gap:4,padding:"5px 7px",overflowX:"auto",alignItems:"stretch"}}>
                {/* Cancel button */}
                <button onClick={()=>{setTool(null);gRef.current.selCell=null;rerender();}} style={{flexShrink:0,width:58,borderRadius:8,padding:"4px",cursor:"pointer",border:`1px solid ${!tool?"rgba(34,197,94,.5)":"rgba(255,255,255,.09)"}`,background:!tool?"rgba(34,197,94,.1)":"rgba(255,255,255,.03)",color:"#6b7280",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
                  <span style={{fontSize:16}}>✋</span><span style={{fontSize:7,color:"#4b5563"}}>ESC</span>
                </button>
                {BUILD_KEYS.filter(bt=>BDEF[bt].canPlace).map(bt=>{
                  const def=BDEF[bt], afford=canAfford(bt), sel=tool===bt;
                  const catCol={economy:"#fbbf24",military:"#22c55e",defense:"#93c5fd"}[def.cat];
                  const hasProd=def.prod&&Object.keys(def.prod).length>0;
                  return (
                    <button key={bt} onClick={()=>{setTool(bt);gRef.current.selCell=null;rerender();}} style={{
                      flexShrink:0, width:82, borderRadius:9, padding:"5px 4px", cursor:"pointer",
                      border:`2px solid ${sel?def.glow||"#fbbf24":afford?"rgba(255,255,255,.09)":"rgba(239,68,68,.2)"}`,
                      background:sel?`${def.glow||"#fbbf24"}18`:afford?"rgba(255,255,255,.04)":"rgba(239,68,68,.04)",
                      color:afford?"#e8f5e1":"#6b7280",
                      boxShadow:sel?`0 0 14px ${def.glow||"#fbbf24"}40`:"none",
                      display:"flex",flexDirection:"column",alignItems:"center",gap:1,
                    }}>
                      <div style={{display:"flex",alignItems:"center",gap:2,width:"100%"}}>
                        <span style={{fontSize:16,lineHeight:1}}>{def.icon}</span>
                        <div style={{marginLeft:"auto",display:"flex",flexDirection:"column",alignItems:"flex-end"}}>
                          <span style={{fontSize:7,color:catCol}}>◆</span>
                          <span style={{fontSize:7,color:"#4b5563"}}>[{def.key}]</span>
                        </div>
                      </div>
                      <div style={{fontWeight:700,fontSize:9,textAlign:"center",lineHeight:1.15,color:afford?"#f9fafb":"#6b7280"}}>{def.name}</div>
                      <div style={{fontSize:8,color:afford?RCOL.gold:"#6b7280",textAlign:"center",lineHeight:1.2}}>
                        {Object.entries(def.cost).length>0?Object.entries(def.cost).map(([k,v])=>`${RICON[k]}${v}`).join(" "):"Kostenlos"}
                      </div>
                      <div style={{fontSize:8,textAlign:"center",lineHeight:1.2,color:hasProd?"#86efac":def.atk?"#fca5a5":def.soldierType?"#fb923c":def.popBonus?"#f97316":"#93c5fd"}}>
                        {hasProd ? Object.entries(def.prod).map(([k])=>RICON[k]).join("")+"/s"
                          :def.atk   ? `⚔️${def.atk} r${def.range}`
                          :def.soldierType ? `👥${def.spawnCd}s`
                          :def.popBonus    ? `+${def.popBonus}Pop`
                          : "🛡️HP"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right stats */}
            <div style={{width:130,flexShrink:0,borderLeft:"1px solid rgba(255,255,255,.07)",padding:"8px 10px",display:"flex",flexDirection:"column",gap:5}}>
              {[["☠️","Kills",g.kills,"#f87171"],["⬆️","Upgrades",g.totalUpg,"#fbbf24"],["⚡","Kombo",g.maxCombo,"#fb923c"]].map(([ic,lbl,val,col])=>(
                <div key={lbl} style={{padding:"5px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:7,textAlign:"center"}}>
                  <span style={{fontSize:15}}>{ic}</span>
                  <span style={{color:col,fontWeight:700,fontSize:16,marginLeft:4}}>{val}</span>
                  <div style={{fontSize:8,color:"#6b7280"}}>{lbl}</div>
                </div>
              ))}
              {g.achieve.size>0&&<div style={{fontSize:11,color:"#6b7280",textAlign:"center",flexWrap:"wrap"}}>{[...g.achieve].map(id=>ACHIEV.find(a=>a.id===id)?.icon||"").join(" ")}</div>}
            </div>
          </>}

          {/* ── ARMY TAB ── */}
          {g.bottomTab==="army"&&(
            <div style={{flex:1,padding:"8px 12px",overflowY:"auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{color:"#fbbf24",fontWeight:700,fontSize:11}}>⚔️ Armee — {popUsed}/{popCap} Soldaten</div>
                {popUsed===0&&<div style={{color:"#4b5563",fontSize:10}}>Bau Kasernen um Einheiten zu spawnen!</div>}
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {g.soldiers.map(s=>(
                  <div key={s.id} style={{background:"rgba(255,255,255,.05)",border:`1px solid ${s.stype.col}33`,borderRadius:8,padding:"5px 8px",minWidth:90}}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <span style={{fontSize:14}}>{s.stype.icon}</span>
                      <div>
                        <div style={{color:"#e5e7eb",fontWeight:600,fontSize:10}}>{s.stype.name}</div>
                        <div style={{color:"#6b7280",fontSize:8}}>Lv.{s.level} · {s.kills} Kills</div>
                      </div>
                    </div>
                    <div style={{marginTop:3,background:"rgba(0,0,0,.5)",borderRadius:3,height:4,overflow:"hidden"}}>
                      <div style={{width:`${(s.hp/s.maxHp)*100}%`,height:"100%",background:s.hp/s.maxHp>.5?"#22c55e":"#f59e0b"}}/>
                    </div>
                    <div style={{fontSize:8,color:"#6b7280",marginTop:1}}>{Math.ceil(s.hp)}/{Math.ceil(s.maxHp)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STATS TAB ── */}
          {g.bottomTab==="stats"&&(
            <div style={{flex:1,display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,padding:"8px 12px",overflowY:"auto"}}>
              {[["⚔️","Welle",`${g.wave}/20`],["🏆","Score",Math.floor(g.score)],["☠️","Kills",g.kills],["👑","Bosse",g.bossKills],["⬆️","Upgrades",g.totalUpg],["⚡","Max Kombo",g.maxCombo],["🔬","Forschung",g.research.size],["🏅","Errungenschaften",g.achieve.size],["🏰","Stadtburg HP",`${Math.ceil(th?.hp||0)}`]].map(([ic,lbl,val])=>(
                <div key={lbl} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:8,padding:"7px",textAlign:"center"}}>
                  <div style={{fontSize:18}}>{ic}</div>
                  <div style={{color:"#6b7280",fontSize:9,marginTop:2}}>{lbl}</div>
                  <div style={{color:"#fbbf24",fontSize:15,fontWeight:700,fontFamily:"Georgia,serif"}}>{val}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── RESEARCH TAB ── */}
          {g.bottomTab==="research"&&(
            <div style={{flex:1,display:"flex",gap:7,padding:"8px 12px",overflowX:"auto",alignItems:"stretch"}}>
              {RESEARCH.map(r=>{
                const done=g.research.has(r.id);
                const afford=Object.entries(r.cost).every(([k,v])=>(g.res[k]||0)>=v);
                return (
                  <div key={r.id} style={{flexShrink:0,width:165,background:done?"rgba(167,139,250,.12)":"rgba(255,255,255,.04)",border:`1px solid ${done?"#a78bfa":afford?"rgba(167,139,250,.3)":"rgba(255,255,255,.08)"}`,borderRadius:10,padding:"10px",display:"flex",flexDirection:"column",gap:4}}>
                    <div style={{fontSize:20}}>{r.icon}</div>
                    <div style={{fontWeight:700,fontSize:11,color:done?"#c4b5fd":"#e5e7eb"}}>{r.name}</div>
                    <div style={{fontSize:9,color:"#6b7280",lineHeight:1.5,flex:1}}>{r.desc}</div>
                    <div style={{fontSize:9,color:"#9ca3af"}}>{Object.entries(r.cost).map(([k,v])=>`${RICON[k]}${v}`).join(" ")}</div>
                    {done
                      ?<div style={{fontSize:10,color:"#a78bfa",textAlign:"center"}}>✅ Abgeschlossen</div>
                      :<button onClick={()=>doResearch(r.id)} disabled={!afford} style={{padding:"5px",borderRadius:7,cursor:afford?"pointer":"not-allowed",fontSize:9,fontWeight:700,background:afford?"rgba(167,139,250,.2)":"rgba(255,255,255,.04)",border:`1px solid ${afford?"#a78bfa":"rgba(255,255,255,.1)"}`,color:afford?"#e9d5ff":"#4b5563"}}>🔬 Forschen</button>}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
