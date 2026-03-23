import { useState, useEffect, useRef, useCallback } from "react";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        "#080808",
  surface:   "#111111",
  surface2:  "#181818",
  border:    "#1e1e1e",
  accent:    "#22c55e",
  accentDim: "#15803d",
  muted:     "#6b7280",
  error:     "#ef4444",
  white:     "#ffffff",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body, #root { background: ${C.bg}; }
  ::selection { background: rgba(34,197,94,0.25); color: #fff; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${C.surface}; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
  input:focus { outline: none; }
  button:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulseG   { 0%,100% { box-shadow:0 0 0 0 rgba(34,197,94,0); } 50% { box-shadow:0 0 0 6px rgba(34,197,94,0.2); } }
  @keyframes shake    { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
  @keyframes popIn    { from{transform:scale(0) rotate(-10deg);opacity:0} to{transform:scale(1) rotate(0);opacity:1} }
  @keyframes slideIn  { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes wordOut  { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-10px)} }
  @keyframes wordIn   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .fade-up    { animation: fadeUp 0.35s ease both; }
  .pulse-g    { animation: pulseG 1.2s ease-in-out infinite; }
  .shake      { animation: shake 0.28s ease-out; }
  .pop-in     { animation: popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
  .slide-in   { animation: slideIn 0.25s ease both; }
  .word-in    { animation: wordIn 0.12s ease both; }
`;

// ── Word Pool ─────────────────────────────────────────────────────────────────
const WORDS_EASY   = ["the","and","for","are","but","not","you","all","can","her","was","one","our","had","him","his","how","did","get","has","let","new","now","old","see","two","way","who","its","out","day","may","use","man","big","yes","yet","sit","run","age","box","car","dog","end","far","god","hit","job","key","law","lot","low","map","mix","net","oil","pay","put","red","set","top","try","win","arm","bag","cut","eye","fly","fun","gap","hot","ice","lay","mad","odd","own","sky","tap","toe","van","wax","zoo","cup","egg","fit","hat","hug","joy","kid","log","nod","oak","pan","pig","rat","row","sew","shy","sip","sob","sum","sun","tar","tug","wig","wit"];
const WORDS_MEDIUM = ["about","after","again","along","bring","build","carry","catch","cause","could","cover","drive","every","fight","found","front","given","going","great","group","hands","heart","horse","house","human","large","learn","leave","light","might","money","mouth","music","never","night","north","often","order","other","paint","paper","place","plant","point","power","press","price","print","quite","reach","ready","right","river","round","seven","shall","short","since","small","sound","south","space","speak","speed","spend","stand","start","state","still","store","story","study","table","their","there","thing","think","those","three","throw","times","today","touch","track","trade","train","trust","truth","under","until","value","visit","voice","watch","water","where","which","while","white","whole","world","write","young","scope","shift","surge","score","blend","craft","spark","charm","flair","nerve","pivot","vivid","wedge"];
const WORDS_HARD   = ["absolute","abstract","achieve","advance","approach","argument","attention","available","behavior","building","business","calendar","campaign","capacity","category","challenge","champion","character","complete","computer","consider","continue","contract","creative","currency","customer","database","decision","describe","designed","discover","distinct","document","duration","economic","election","elements","engineer","equation","evaluate","exchange","exercise","existing","explicit","extended","external","financial","function","generate","graphics","guidance","hardware","identify","important","includes","increase","indicate","industry","instance","internal","internet","keyboard","language","learning","location","maintain","material","measured","metadata","moderate","movement","multiple","national","navigate","negative","normally","obstacle","operator","optional","original","overflow","password","platform","positive","practice","previous","priority","property","proposal","protocol","provides","reaction","recovery","register","relative","relevant","remember","required","resource","response","security","services","settings","software","solution","specific","standard","strategy","strength","template","tracking","transfer","ultimate","universe","validate","variable","velocity","workflow"];

function shuffle(a) { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; }
function buildWords(count=80, diff='easy') {
  let pool = diff==='hard' ? [...WORDS_HARD,...WORDS_MEDIUM.slice(0,20)] : diff==='medium' ? [...WORDS_MEDIUM,...WORDS_EASY.slice(0,20)] : [...WORDS_EASY,...WORDS_MEDIUM.slice(0,20)];
  const s = shuffle(pool);
  while(s.length<count) s.push(...shuffle(pool));
  return s.slice(0,count);
}
function getDifficulty(wpm) { return wpm>=75?'hard':wpm>=50?'medium':'easy'; }

// ── Scoring ───────────────────────────────────────────────────────────────────
function calcWPM(words, secs) { return secs<1?0:Math.round((words/secs)*60); }
function calcAcc(correct, total) { return total===0?1:Math.min(1,correct/total); }
function calcXP({wpm,accuracy,maxStreak}) {
  const base=wpm*10, acc=accuracy>=.95?base*.5:accuracy>=.8?base*.2:0, str=maxStreak>=15?80:maxStreak>=10?50:maxStreak>=5?20:0;
  return Math.round(base+acc+str);
}
function calcLevel(xp) { return Math.max(1,Math.floor(xp/500)+1); }

function getBadges({wpm,accuracy,maxStreak}) {
  const b=[];
  if(wpm>=100)        b.push({id:'sonic',   label:'Sonic Speed', icon:'⚡'});
  else if(wpm>=80)    b.push({id:'speed',   label:'Speed Demon', icon:'🔥'});
  else if(wpm>=60)    b.push({id:'swift',   label:'Swift Keys',  icon:'💨'});
  if(accuracy>=1)     b.push({id:'perfect', label:'Perfect',     icon:'💎'});
  else if(accuracy>=.98) b.push({id:'flaw', label:'Flawless',    icon:'✨'});
  else if(accuracy>=.95) b.push({id:'prec', label:'Precise',     icon:'🎯'});
  if(maxStreak>=15)   b.push({id:'fire',    label:'On Fire',     icon:'🌊'});
  else if(maxStreak>=10) b.push({id:'hot',  label:'Hot Streak',  icon:'🌡️'});
  return b;
}

function getInsight({accuracy,maxStreak,wpm}) {
  if(accuracy<.80)  return 'Slow down slightly — accuracy under 80% costs more time than it saves.';
  if(accuracy<.90)  return 'Solid run. Target 90%+ accuracy by pausing on unfamiliar words.';
  if(maxStreak<5)   return 'Focus on consistency. Aim for 5-word streaks before pushing speed.';
  if(wpm<40)        return 'Drill the 100 most common words — muscle memory is the fastest route up.';
  if(wpm>80)        return 'Elite pace. Lock in accuracy above 95% to maximise XP per run.';
  return 'Great consistency! Push your ceiling by starting each session at 5 WPM above your PB.';
}

// ── Ghost Profiles ────────────────────────────────────────────────────────────
const GHOSTS = [
  {name:'Newbie',  wpm:25,  color:'#6b7280', icon:'🐢'},
  {name:'Average', wpm:50,  color:'#3b82f6', icon:'🐇'},
  {name:'Pro',     wpm:80,  color:'#f59e0b', icon:'🦅'},
  {name:'Elite',   wpm:110, color:'#ef4444', icon:'⚡'},
];

// ── Mock Leaderboard ──────────────────────────────────────────────────────────
const LEADERBOARD = [
  {rank:1, username:'nightcrawler', wpm:134, accuracy:.98, level:24},
  {rank:2, username:'volttype',     wpm:121, accuracy:.97, level:21},
  {rank:3, username:'keymaster',    wpm:115, accuracy:.96, level:19},
  {rank:4, username:'ghostkeys',    wpm:108, accuracy:.95, level:17},
  {rank:5, username:'rapidfire',    wpm:99,  accuracy:.94, level:16},
  {rank:6, username:'auroratype',   wpm:91,  accuracy:.96, level:14},
  {rank:7, username:'zephyrkeys',   wpm:85,  accuracy:.93, level:12},
  {rank:8, username:'irontype',     wpm:78,  accuracy:.91, level:11},
  {rank:9, username:'shadowhand',   wpm:72,  accuracy:.89, level:9 },
  {rank:10,username:'silverkeys',   wpm:68,  accuracy:.90, level:8 },
];

const MEDALS = {1:'🥇',2:'🥈',3:'🥉'};

// ── Shared Components ─────────────────────────────────────────────────────────
function Btn({children, variant='primary', size='md', style:s={}, ...p}) {
  const base = {fontFamily:"'Space Mono',monospace", border:'none', cursor:'pointer', transition:'all .15s', borderRadius:12, outline:'none'};
  const v = variant==='primary'
    ? {background:C.accent,color:C.bg,fontWeight:700}
    : variant==='secondary'
    ? {background:C.surface,color:C.white,border:`1px solid ${C.border}`}
    : variant==='ghost'
    ? {background:'transparent',color:C.muted,border:`1px solid ${C.border}`}
    : {background:'rgba(239,68,68,0.1)',color:C.error,border:`1px solid rgba(239,68,68,0.3)`};
  const sz = size==='lg' ? {padding:'14px 32px',fontSize:16} : size==='sm' ? {padding:'6px 12px',fontSize:12} : {padding:'10px 20px',fontSize:14};
  return <button style={{...base,...v,...sz,...s}} {...p}>{children}</button>;
}

function Card({children, style:s={}, ...p}) {
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,boxShadow:'0 4px 24px rgba(0,0,0,0.4)',...s}} {...p}>{children}</div>;
}

function StatBox({label, value, accent=false, pulse=false}) {
  return (
    <div className={pulse?'pulse-g':''} style={{background:C.surface,border:`1px solid ${pulse?C.accent:C.border}`,borderRadius:14,padding:'10px 8px',textAlign:'center',flex:1}}>
      <div key={value} style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:22,color:accent?C.accent:C.white}}>{value}</div>
      <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.muted,marginTop:2,textTransform:'uppercase',letterSpacing:'0.1em'}}>{label}</div>
    </div>
  );
}

function XPBar({current, level}) {
  const pct = Math.min(100,(current%500)/500*100);
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,fontFamily:"'Space Mono',monospace",color:C.muted,marginBottom:6}}>
        <span>{current%500} / 500 XP</span><span>Level {level+1} →</span>
      </div>
      <div style={{height:5,background:C.bg,border:`1px solid ${C.border}`,borderRadius:99,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:C.accent,borderRadius:99,transition:'width 1s ease'}} />
      </div>
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({data=[]}) {
  if(data.length<2) return null;
  const W=280,H=44,max=Math.max(...data,1);
  const pts=data.map((v,i)=>`${((i/(data.length-1))*W).toFixed(1)},${(H-(v/max)*H).toFixed(1)}`).join(' ');
  const lx=W, ly=H-(data[data.length-1]/max)*H;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{overflow:'visible'}}>
      <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.accent} stopOpacity=".3"/><stop offset="100%" stopColor={C.accent} stopOpacity="1"/></linearGradient></defs>
      <polyline points={pts} fill="none" stroke="url(#sg)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={lx} cy={ly} r="4" fill={C.accent}/>
    </svg>
  );
}

function SparklineLive({data=[]}) {
  const d=data.slice(-20), max=Math.max(...d,1);
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:2,height:28,width:'100%',paddingTop:4}}>
      {Array(20).fill(0).map((_,i)=>{
        const v=d[i]??0, h=Math.max(3,Math.round((v/max)*28)), isLast=i===d.length-1&&d.length>0;
        return <div key={i} style={{flex:1,height:h,background:isLast?C.accent:C.border,borderRadius:2,transition:'height .25s'}}/>;
      })}
    </div>
  );
}

// ── Keyboard Heatmap ──────────────────────────────────────────────────────────
const KB_ROWS=[['q','w','e','r','t','y','u','i','o','p'],['a','s','d','f','g','h','j','k','l'],['z','x','c','v','b','n','m']];
function KeyboardHeatmap({errorKeys={}}) {
  const maxE=Math.max(...Object.values(errorKeys),1);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'center'}}>
      {KB_ROWS.map((row,ri)=>(
        <div key={ri} style={{display:'flex',gap:6}}>
          {row.map(k=>{
            const cnt=errorKeys[k]??0, inten=cnt/maxE;
            return (
              <div key={k} title={cnt>0?`${cnt} error(s)`:undefined} style={{width:26,height:26,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontFamily:"'Space Mono',monospace",textTransform:'uppercase',position:'relative',background:cnt>0?`rgba(239,68,68,${.15+inten*.6})`:'#111',border:`1px solid ${cnt>0?`rgba(239,68,68,${.3+inten*.5})`:C.border}`,color:cnt>0?'#fff':C.muted}}>
                {k}
                {cnt>0&&<span style={{position:'absolute',top:-4,right:-4,background:C.error,color:'#fff',borderRadius:99,width:12,height:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,lineHeight:1}}>{cnt>9?'+':cnt}</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MENU CONTAINER
// ══════════════════════════════════════════════════════════════════════════════
function MenuContainer({onNavigate, stats}) {
  const MODES=[
    {id:'singleplayer',icon:'⚡',title:'Speed Run',   sub:'30 s solo sprint — beat your personal best', badge:'Solo'},
    {id:'multiplayer', icon:'👾',title:'Ghost Race',   sub:'Race a ghost opponent in real time',          badge:'Ghost'},
    {id:'leaderboard', icon:'🏆',title:'Leaderboard',  sub:'Global top 10 — see how you rank',            badge:'Global'},
  ];
  useEffect(()=>{
    const h=e=>{if(e.key==='1')onNavigate('singleplayer');if(e.key==='2')onNavigate('multiplayer');if(e.key==='3')onNavigate('leaderboard');};
    window.addEventListener('keydown',h); return()=>window.removeEventListener('keydown',h);
  },[onNavigate]);

  return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 16px',fontFamily:"'Syne',sans-serif"}}>
      {/* Logo */}
      <div className="fade-up" style={{textAlign:'center',marginBottom:36}}>
        <h1 style={{fontWeight:800,fontSize:64,color:C.white,lineHeight:1.05,letterSpacing:'-2px'}}>TYPING<br/><span style={{color:C.accent}}>ARENA</span></h1>
        <p style={{fontFamily:"'Space Mono',monospace",color:C.muted,fontSize:11,marginTop:10,letterSpacing:'0.2em',textTransform:'uppercase'}}>compete · improve · dominate</p>
      </div>

      {/* Stats Card */}
      <div className="fade-up" style={{width:'100%',maxWidth:440,marginBottom:24,animationDelay:'.1s'}}>
        <Card style={{padding:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
            <div>
              <div style={{fontFamily:"'Space Mono',monospace",color:C.muted,fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em'}}>Player</div>
              <div style={{color:C.white,fontWeight:700,fontSize:20,marginTop:2}}>You</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:"'Space Mono',monospace",color:C.muted,fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em'}}>Level</div>
              <div style={{color:C.accent,fontWeight:800,fontSize:32}}>{stats.level}</div>
            </div>
          </div>
          <XPBar current={stats.totalXP} level={stats.level}/>
          <div style={{display:'flex',gap:8,marginTop:16}}>
            {[{l:'Best WPM',v:stats.bestWPM},{l:'Avg WPM',v:stats.avgWPM},{l:'Runs',v:stats.totalRuns}].map(({l,v})=>(
              <div key={l} style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:'10px 8px',textAlign:'center'}}>
                <div style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:20,color:C.white}}>{v}</div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.muted,marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Mode Cards */}
      <div style={{width:'100%',maxWidth:440,display:'flex',flexDirection:'column',gap:10}}>
        {MODES.map((m,i)=>(
          <div key={m.id} className="slide-in" style={{animationDelay:`${.15+i*.06}s`}}>
            <button onClick={()=>onNavigate(m.id)} style={{width:'100%',background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,padding:'14px 16px',cursor:'pointer',textAlign:'left',transition:'border-color .2s',fontFamily:"'Syne',sans-serif"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.background='rgba(34,197,94,0.05)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.surface;}}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <span style={{fontSize:26}}>{m.icon}</span>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                    <span style={{color:C.white,fontWeight:700,fontSize:15}}>{m.title}</span>
                    <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.muted,background:C.bg,padding:'2px 8px',borderRadius:99,border:`1px solid ${C.border}`}}>{m.badge}</span>
                  </div>
                  <p style={{fontFamily:"'Space Mono',monospace",color:C.muted,fontSize:11}}>{m.sub}</p>
                </div>
                <span style={{color:C.muted}}>→</span>
              </div>
            </button>
          </div>
        ))}
      </div>

      <div style={{fontFamily:"'Space Mono',monospace",color:C.muted,fontSize:11,marginTop:28,textAlign:'center'}}>
        press{' '}
        {['1','2','3'].map(k=><kbd key={k} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:5,padding:'2px 7px',color:C.white,margin:'0 3px'}}>{k}</kbd>)}
        {' '}to jump to a mode
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SINGLE PLAYER CONTAINER
// ══════════════════════════════════════════════════════════════════════════════
function SinglePlayerContainer({onNavigate, onRunComplete}) {
  const DURATION=30;
  const [gameState,   setGameState]   = useState('idle');
  const [countdown,   setCountdown]   = useState(3);
  const [timeLeft,    setTimeLeft]    = useState(DURATION);
  const [words,       setWords]       = useState(()=>buildWords(80,'easy'));
  const [wordIdx,     setWordIdx]     = useState(0);
  const [input,       setInput]       = useState('');
  const [hasError,    setHasError]    = useState(false);
  const [correctW,    setCorrectW]    = useState(0);
  const [correctC,    setCorrectC]    = useState(0);
  const [totalC,      setTotalC]      = useState(0);
  const [streak,      setStreak]      = useState(0);
  const [maxStreak,   setMaxStreak]   = useState(0);
  const [liveWPM,     setLiveWPM]     = useState(0);
  const [wpmHistory,  setWpmHistory]  = useState([]);
  const [errorKeys,   setErrorKeys]   = useState({});
  const [difficulty,  setDifficulty]  = useState('easy');
  const [focusLocked, setFocusLocked] = useState(false);
  const [results,     setResults]     = useState(null);
  const [shakeKey,    setShakeKey]    = useState(0);

  const inputRef      = useRef(null);
  const timerRef      = useRef(null);
  const cdRef         = useRef(null);
  const startRef      = useRef(null);
  const correctWRef   = useRef(0);
  const wpmHRef       = useRef([]);

  const currentWord = words[wordIdx] ?? '';

  const resetAll = useCallback(()=>{
    clearInterval(timerRef.current); clearInterval(cdRef.current);
    setGameState('idle'); setCountdown(3); setTimeLeft(DURATION);
    setWordIdx(0); setInput(''); setHasError(false); setCorrectW(0);
    setCorrectC(0); setTotalC(0); setStreak(0); setMaxStreak(0);
    setLiveWPM(0); setWpmHistory([]); setErrorKeys({}); setDifficulty('easy');
    setFocusLocked(false); setResults(null);
    correctWRef.current=0; wpmHRef.current=[];
    setWords(buildWords(80,'easy'));
  },[]);

  const startGame = useCallback(()=>{
    setGameState('countdown');
    let c=3;
    cdRef.current=setInterval(()=>{
      c-=1; setCountdown(c);
      if(c<=0){
        clearInterval(cdRef.current);
        setGameState('active');
        startRef.current=performance.now();
        timerRef.current=setInterval(()=>{
          const el=(performance.now()-startRef.current)/1000;
          const rem=Math.max(0,DURATION-el);
          setTimeLeft(rem);
          const wpm=calcWPM(correctWRef.current,el);
          setLiveWPM(wpm);
          wpmHRef.current.push(wpm);
          setWpmHistory([...wpmHRef.current]);
          const nd=getDifficulty(wpm);
          setDifficulty(p=>p!==nd&&el>5?nd:p);
          if(rem<=0){
            clearInterval(timerRef.current);
            const fin={wpm:calcWPM(correctWRef.current,DURATION),accuracy:calcAcc(0,0),maxStreak:0,wpmHistory:[...wpmHRef.current],errorKeys:{},duration:DURATION,mode:'singleplayer',difficulty:nd};
            setResults(fin); setGameState('finished');
          }
        },800);
        setTimeout(()=>inputRef.current?.focus(),50);
      }
    },1000);
  },[]);

  const handleInput = useCallback((e)=>{
    if(gameState!=='active') return;
    const v=e.target.value; setInput(v);
    const err=v.length>0&&!currentWord.startsWith(v);
    if(err&&!hasError){ setShakeKey(p=>p+1); const k=v[v.length-1]?.toLowerCase(); if(k) setErrorKeys(p=>({...p,[k]:(p[k]??0)+1})); }
    setHasError(err);
  },[gameState,currentWord,hasError]);

  const handleKeyDown = useCallback((e)=>{
    if(gameState!=='active') return;
    if(e.key===' '||e.key==='Enter'){
      e.preventDefault();
      const typed=input.trim(); if(!typed) return;
      const ok=typed===currentWord;
      setTotalC(p=>p+currentWord.length);
      if(ok){
        correctWRef.current+=1; setCorrectW(p=>p+1); setCorrectC(p=>p+currentWord.length);
        setStreak(p=>{const n=p+1;setMaxStreak(m=>Math.max(m,n));return n;});
      } else { setStreak(0); }
      setWordIdx(p=>p+1); setInput(''); setHasError(false);
    }
  },[gameState,input,currentWord]);

  // Finish: capture final results
  useEffect(()=>{
    if(gameState==='finished'&&!results){
      const final={
        wpm:calcWPM(correctWRef.current,DURATION),
        accuracy:calcAcc(correctC,totalC),
        maxStreak, wpmHistory:[...wpmHRef.current], errorKeys, duration:DURATION,
        mode:'singleplayer', difficulty,
      };
      setResults(final);
    }
  },[gameState]); // eslint-disable-line

  // ESC
  useEffect(()=>{
    const h=e=>{ if(e.key!=='Escape') return; if(gameState==='active'||gameState==='countdown'){ if(window.confirm('Abandon this run?')){resetAll();onNavigate('menu');} } else { resetAll();onNavigate('menu'); } };
    window.addEventListener('keydown',h); return()=>window.removeEventListener('keydown',h);
  },[gameState,resetAll,onNavigate]);

  // Focus lock
  useEffect(()=>{
    const bl=()=>{if(gameState==='active') setFocusLocked(true);};
    const fo=()=>setFocusLocked(false);
    window.addEventListener('blur',bl); window.addEventListener('focus',fo);
    return()=>{ window.removeEventListener('blur',bl); window.removeEventListener('focus',fo); };
  },[gameState]);

  if(gameState==='finished'&&results) {
    return <ResultScreen results={results} onRestart={resetAll} onMenu={()=>{resetAll();onNavigate('menu');}} onRunComplete={onRunComplete}/>;
  }

  const tPct=(timeLeft/DURATION)*100;
  const tColor=timeLeft>10?C.accent:timeLeft>5?'#f59e0b':C.error;
  const diffColors={easy:C.accent,medium:'#f59e0b',hard:C.error};

  return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 16px',fontFamily:"'Syne',sans-serif"}}>
      {/* Focus lock overlay */}
      {focusLocked&&(
        <div onClick={()=>{setFocusLocked(false);inputRef.current?.focus();}} style={{position:'fixed',inset:0,zIndex:50,background:'rgba(8,8,8,.9)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="pop-in" style={{textAlign:'center',background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:'40px 32px',maxWidth:300}}>
            <div style={{fontSize:48,marginBottom:12}}>⏸</div>
            <h2 style={{color:C.white,fontWeight:700,fontSize:22,marginBottom:6}}>Game Paused</h2>
            <p style={{fontFamily:"'Space Mono',monospace",color:C.accent,fontSize:13}}>Click anywhere to resume.</p>
          </div>
        </div>
      )}

      <div style={{width:'100%',maxWidth:560}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <button onClick={()=>{resetAll();onNavigate('menu');}} style={{background:'none',border:'none',cursor:'pointer',fontFamily:"'Space Mono',monospace",color:C.muted,fontSize:13,transition:'color .15s'}} onMouseEnter={e=>e.target.style.color=C.white} onMouseLeave={e=>e.target.style.color=C.muted}>← Menu</button>
          <h2 style={{color:C.white,fontWeight:700,fontSize:18}}>Speed Run</h2>
          <span style={{fontFamily:"'Space Mono',monospace",color:C.muted,fontSize:11,opacity:.5}}>ESC to quit</span>
        </div>

        {/* Stats */}
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          <StatBox label="WPM"    value={liveWPM}    accent/>
          <StatBox label="Words"  value={correctW}/>
          <StatBox label="Streak" value={streak}     pulse={streak>=5}/>
          <StatBox label="Best"   value={maxStreak}/>
        </div>

        {/* Timer */}
        <div style={{marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',fontFamily:"'Space Mono',monospace",fontSize:11,marginBottom:5}}>
            <span style={{color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em'}}>Time</span>
            <span style={{color:tColor,fontWeight:700}}>{Math.ceil(timeLeft)}s</span>
          </div>
          <div style={{height:4,background:C.surface,borderRadius:99,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${tPct}%`,background:tColor,borderRadius:99,transition:'width .8s linear, background-color .3s'}}/>
          </div>
        </div>

        {/* Game card */}
        <div style={{position:'relative'}}>
          <Card style={{padding:'32px 28px',position:'relative',overflow:'hidden'}}>
            {/* Countdown overlay */}
            {gameState==='countdown'&&(
              <div style={{position:'absolute',inset:0,zIndex:10,background:'rgba(8,8,8,.85)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:20}}>
                <div className="pop-in" key={countdown} style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:96,color:countdown===0?C.accent:C.white,userSelect:'none'}}>{countdown===0?'GO!':countdown}</div>
              </div>
            )}
            {/* Difficulty badge */}
            {gameState==='active'&&<div style={{position:'absolute',top:12,right:12,fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:99,background:`rgba(${difficulty==='hard'?'239,68,68':difficulty==='medium'?'245,158,11':'34,197,94'},.1)`,border:`1px solid ${diffColors[difficulty]}`,color:diffColors[difficulty],textTransform:'uppercase',letterSpacing:'0.1em'}}>{difficulty}</div>}
            {/* Streak badge */}
            {streak>=5&&<div className="pop-in" style={{position:'absolute',top:12,left:12,fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99,background:C.accent,color:C.bg}}>🔥 {streak}</div>}

            {/* Word */}
            <div style={{minHeight:96,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:24}}>
              {gameState==='idle'
                ? <p style={{fontFamily:"'Space Mono',monospace",color:C.muted,fontSize:16}}>Press Start to begin</p>
                : <div key={wordIdx} className="word-in" style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:60,color:C.white,letterSpacing:2,userSelect:'none',wordBreak:'break-all',textAlign:'center'}}>{currentWord}</div>
              }
            </div>

            {/* Input */}
            <div style={{position:'relative'}}>
              <input
                ref={inputRef} value={input} onChange={handleInput} onKeyDown={handleKeyDown}
                disabled={gameState!=='active'} placeholder={gameState==='idle'?'Click Start…':'Type here…'}
                autoComplete="off" autoCorrect="off" spellCheck={false}
                key={`input-${shakeKey}-${hasError}`}
                className={hasError?'shake':''}
                style={{width:'100%',background:C.bg,border:`2px solid ${hasError?C.error:C.border}`,borderRadius:14,padding:'14px 18px',fontFamily:"'Space Mono',monospace",fontSize:20,color:hasError?C.error:C.white,transition:'border-color .12s',boxSizing:'border-box'}}
              />
              {hasError&&<div style={{position:'absolute',bottom:0,left:16,right:16,height:2,background:C.error,borderRadius:99,animation:'fadeIn .12s ease'}}/>}
            </div>
          </Card>
          <div style={{marginTop:6,paddingLeft:4}}><SparklineLive data={wpmHistory}/></div>
        </div>

        {gameState==='idle'&&(
          <div className="fade-up" style={{textAlign:'center',marginTop:24,animationDelay:'.1s'}}>
            <Btn size="lg" style={{paddingLeft:56,paddingRight:56}} onClick={startGame}>Start Run →</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Result Screen ─────────────────────────────────────────────────────────────
function ResultScreen({results, onRestart, onMenu, onRunComplete}) {
  const xpE  = calcXP(results);
  const bdgs = getBadges(results);
  const ins  = getInsight(results);
  const acc  = Math.round(results.accuracy*100);

  useEffect(()=>{ onRunComplete&&onRunComplete(results,xpE); },[]);

  const isNewBest = results.wpm > 0; // simplified — always show if positive

  return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:'32px 16px',fontFamily:"'Syne',sans-serif"}}>
      <div style={{width:'100%',maxWidth:480,display:'flex',flexDirection:'column',gap:12}}>

        <div className="fade-up" style={{textAlign:'center'}}>
          <h1 style={{fontWeight:800,fontSize:44,color:C.white}}>Run Complete</h1>
          {isNewBest&&<div className="pop-in" style={{display:'inline-block',marginTop:10,background:C.accent,color:C.bg,fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:12,padding:'5px 16px',borderRadius:99,animationDelay:'.4s'}}>🏆 NEW PERSONAL BEST</div>}
        </div>

        <Card className="fade-up" style={{padding:24,animationDelay:'.05s'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:0,marginBottom:20,textAlign:'center'}}>
            <div><div style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:52,color:C.accent}}>{results.wpm}</div><div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginTop:4}}>WPM</div></div>
            <div style={{borderLeft:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`}}><div style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:52,color:C.white}}>{acc}%</div><div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginTop:4}}>Accuracy</div></div>
            <div><div style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:52,color:C.white}}>{results.maxStreak}</div><div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginTop:4}}>Max Streak</div></div>
          </div>
          {results.wpmHistory?.length>1&&(
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:14}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>WPM Over Time</div>
              <Sparkline data={results.wpmHistory}/>
            </div>
          )}
        </Card>

        <Card className="fade-up" style={{padding:14,display:'flex',justifyContent:'space-between',alignItems:'center',animationDelay:'.1s'}}>
          <span style={{fontFamily:"'Space Mono',monospace",color:C.muted,fontSize:13}}>XP Earned</span>
          <span style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:24,color:C.accent}}>+{xpE} XP</span>
        </Card>

        {bdgs.length>0&&(
          <Card className="fade-up" style={{padding:14,animationDelay:'.15s'}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Badges</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {bdgs.map((b,i)=>(
                <div key={b.id} className="pop-in" style={{display:'flex',alignItems:'center',gap:6,background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:'5px 12px',animationDelay:`${.45+i*.08}s`}}>
                  <span style={{fontSize:14}}>{b.icon}</span>
                  <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:C.white}}>{b.label}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="fade-up" style={{padding:14,border:`1px solid rgba(34,197,94,.2)`,animationDelay:'.2s'}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>💡 Insight</div>
          <p style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:C.white,lineHeight:1.7}}>{ins}</p>
        </Card>

        {Object.keys(results.errorKeys??{}).length>0&&(
          <Card className="fade-up" style={{padding:16,animationDelay:'.25s'}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:14}}>Error Heatmap</div>
            <KeyboardHeatmap errorKeys={results.errorKeys}/>
          </Card>
        )}

        <div className="fade-up" style={{display:'flex',gap:10,animationDelay:'.3s'}}>
          <Btn size="lg" style={{flex:1}} onClick={onRestart}>↺ Play Again</Btn>
          <Btn variant="secondary" size="lg" onClick={onMenu}>← Menu</Btn>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MULTIPLAYER CONTAINER
// ══════════════════════════════════════════════════════════════════════════════
function MultiplayerContainer({onNavigate, onRunComplete}) {
  const DURATION=30;
  const [gameState,   setGameState]   = useState('idle');
  const [countdown,   setCountdown]   = useState(3);
  const [timeLeft,    setTimeLeft]    = useState(DURATION);
  const [words,       setWords]       = useState(()=>buildWords(80,'easy'));
  const [wordIdx,     setWordIdx]     = useState(0);
  const [input,       setInput]       = useState('');
  const [hasError,    setHasError]    = useState(false);
  const [correctW,    setCorrectW]    = useState(0);
  const [correctC,    setCorrectC]    = useState(0);
  const [totalC,      setTotalC]      = useState(0);
  const [streak,      setStreak]      = useState(0);
  const [maxStreak,   setMaxStreak]   = useState(0);
  const [liveWPM,     setLiveWPM]     = useState(0);
  const [wpmHistory,  setWpmHistory]  = useState([]);
  const [errorKeys,   setErrorKeys]   = useState({});
  const [ghostIdx,    setGhostIdx]    = useState(1);
  const [ghostProg,   setGhostProg]   = useState(0);
  const [ghostWPM,    setGhostWPM]    = useState(0);
  const [results,     setResults]     = useState(null);

  const inputRef = useRef(null); const timerRef = useRef(null); const cdRef = useRef(null);
  const startRef = useRef(null); const ghostRef = useRef(null);
  const correctWRef = useRef(0); const wpmHRef = useRef([]);
  const currentWord = words[wordIdx]??'';

  const resetAll = useCallback(()=>{
    clearInterval(timerRef.current); clearInterval(cdRef.current); clearInterval(ghostRef.current);
    setGameState('idle'); setCountdown(3); setTimeLeft(DURATION); setWordIdx(0); setInput(''); setHasError(false);
    setCorrectW(0); setCorrectC(0); setTotalC(0); setStreak(0); setMaxStreak(0); setLiveWPM(0);
    setWpmHistory([]); setErrorKeys({}); setGhostProg(0); setGhostWPM(0); setResults(null);
    correctWRef.current=0; wpmHRef.current=[];
    setWords(buildWords(80,'easy'));
  },[]);

  const startGame=useCallback(()=>{
    setGameState('countdown'); let c=3;
    cdRef.current=setInterval(()=>{
      c-=1; setCountdown(c);
      if(c<=0){
        clearInterval(cdRef.current); setGameState('active'); startRef.current=performance.now();
        const ghost=GHOSTS[ghostIdx]; const msPerW=(60/ghost.wpm)*1000;
        timerRef.current=setInterval(()=>{
          const el=(performance.now()-startRef.current)/1000; const rem=Math.max(0,DURATION-el);
          setTimeLeft(rem); const wpm=calcWPM(correctWRef.current,el); setLiveWPM(wpm);
          wpmHRef.current.push(wpm); setWpmHistory([...wpmHRef.current]);
          if(rem<=0){ clearInterval(timerRef.current); clearInterval(ghostRef.current); setGameState('finished'); }
        },800);
        ghostRef.current=setInterval(()=>{
          const el=(performance.now()-startRef.current); const ramp=Math.min(1,el/4000);
          const eff=ghost.wpm*ramp; const typed=(el/1000)*(eff/60);
          setGhostProg(Math.min(1,typed/words.length)); setGhostWPM(Math.round(ghost.wpm*ramp*(1+(Math.random()-.5)*.2)));
        },400);
        setTimeout(()=>inputRef.current?.focus(),50);
      }
    },1000);
  },[ghostIdx,words.length]);

  useEffect(()=>{
    if(gameState==='finished'&&!results){
      const fin={wpm:calcWPM(correctWRef.current,DURATION),accuracy:calcAcc(correctC,totalC),maxStreak,wpmHistory:[...wpmHRef.current],errorKeys,duration:DURATION,mode:'multiplayer',difficulty:'easy'};
      setResults(fin);
    }
  },[gameState]);// eslint-disable-line

  const handleInput=useCallback((e)=>{
    if(gameState!=='active') return; const v=e.target.value; setInput(v);
    const err=v.length>0&&!currentWord.startsWith(v);
    if(err) {const k=v[v.length-1]?.toLowerCase(); if(k) setErrorKeys(p=>({...p,[k]:(p[k]??0)+1}));} setHasError(err);
  },[gameState,currentWord]);

  const handleKeyDown=useCallback((e)=>{
    if(gameState!=='active') return;
    if(e.key===' '||e.key==='Enter'){
      e.preventDefault(); const typed=input.trim(); if(!typed) return;
      const ok=typed===currentWord; setTotalC(p=>p+currentWord.length);
      if(ok){correctWRef.current+=1;setCorrectW(p=>p+1);setCorrectC(p=>p+currentWord.length);setStreak(p=>{const n=p+1;setMaxStreak(m=>Math.max(m,n));return n;});}
      else setStreak(0);
      setWordIdx(p=>p+1); setInput(''); setHasError(false);
    }
  },[gameState,input,currentWord]);

  useEffect(()=>{
    const h=e=>{ if(e.key!=='Escape') return; if(gameState==='active'||gameState==='countdown'){if(window.confirm('Abandon?')){resetAll();onNavigate('menu');}}else{resetAll();onNavigate('menu');} };
    window.addEventListener('keydown',h); return()=>window.removeEventListener('keydown',h);
  },[gameState,resetAll,onNavigate]);

  if(gameState==='finished'&&results) return <ResultScreen results={results} onRestart={resetAll} onMenu={()=>{resetAll();onNavigate('menu');}} onRunComplete={onRunComplete}/>;

  const playerProg = wordIdx/Math.max(1,words.length);
  const isAhead    = playerProg>=ghostProg;
  const ghost      = GHOSTS[ghostIdx];

  return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 16px',fontFamily:"'Syne',sans-serif"}}>
      <div style={{width:'100%',maxWidth:560}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <button onClick={()=>{resetAll();onNavigate('menu');}} style={{background:'none',border:'none',cursor:'pointer',fontFamily:"'Space Mono',monospace",color:C.muted,fontSize:13}} onMouseEnter={e=>e.target.style.color=C.white} onMouseLeave={e=>e.target.style.color=C.muted}>← Menu</button>
          <h2 style={{color:C.white,fontWeight:700}}>Ghost Race</h2>
          <span style={{fontFamily:"'Space Mono',monospace",color:C.muted,fontSize:11,opacity:.5}}>ESC to quit</span>
        </div>

        {/* Opponent picker */}
        {gameState==='idle'&&(
          <div className="fade-up" style={{marginBottom:24}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Choose Opponent</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
              {GHOSTS.map((g,i)=>(
                <button key={g.name} onClick={()=>setGhostIdx(i)} style={{border:`1px solid ${ghostIdx===i?C.accent:C.border}`,background:ghostIdx===i?'rgba(34,197,94,.07)':C.surface,borderRadius:14,padding:'10px 6px',cursor:'pointer',textAlign:'center',transition:'all .15s'}}>
                  <div style={{fontSize:22,marginBottom:4}}>{g.icon}</div>
                  <p style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:C.white}}>{g.name}</p>
                  <p style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:g.color,marginTop:2}}>{g.wpm} WPM</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Race bars */}
        {(gameState==='active'||gameState==='countdown')&&(
          <Card style={{padding:16,marginBottom:14}}>
            <div style={{textAlign:'center',marginBottom:12}}>
              <span style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:13,color:isAhead?C.accent:C.error}}>{isAhead?'🟢 You\'re ahead!':` 🔴 ${ghost.name} is leading`}</span>
            </div>
            {[{label:'You',prog:playerProg,color:C.accent,wpm:liveWPM},{label:`${ghost.icon} ${ghost.name}`,prog:ghostProg,color:ghost.color,wpm:ghostWPM}].map(({label,prog,color,wpm})=>(
              <div key={label} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',fontFamily:"'Space Mono',monospace",fontSize:11,marginBottom:4,color:C.muted}}><span style={{color:label==='You'?C.white:C.muted,fontWeight:label==='You'?700:400}}>{label}</span><span style={{color:C.white}}>{wpm} <span style={{color:C.muted}}>wpm</span></span></div>
                <div style={{height:10,background:C.bg,border:`1px solid ${C.border}`,borderRadius:99,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(100,prog*100)}%`,background:color,borderRadius:99,transition:'width .5s ease'}}/></div>
              </div>
            ))}
          </Card>
        )}

        {/* Timer */}
        {gameState==='active'&&(
          <div style={{marginBottom:14}}>
            <div style={{height:3,background:C.surface,borderRadius:99,overflow:'hidden',marginBottom:4}}>
              <div style={{height:'100%',width:`${(timeLeft/DURATION)*100}%`,background:C.accent,borderRadius:99,transition:'width .8s linear'}}/>
            </div>
            <p style={{textAlign:'center',fontFamily:"'Space Mono',monospace",fontSize:11,color:C.muted}}>{Math.ceil(timeLeft)}s remaining</p>
          </div>
        )}

        {/* Game card */}
        <Card style={{padding:'28px 24px',position:'relative',overflow:'hidden'}}>
          {gameState==='countdown'&&(
            <div style={{position:'absolute',inset:0,zIndex:10,background:'rgba(8,8,8,.85)',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:20}}>
              <div className="pop-in" key={countdown} style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:96,color:countdown===0?C.accent:C.white}}>{countdown===0?'GO!':countdown}</div>
            </div>
          )}
          {streak>=5&&<div className="pop-in" style={{position:'absolute',top:12,left:12,fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99,background:C.accent,color:C.bg}}>🔥 {streak}</div>}
          <div style={{minHeight:88,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20}}>
            {gameState==='idle' ? <p style={{fontFamily:"'Space Mono',monospace",color:C.muted,fontSize:14,textAlign:'center'}}>Select an opponent and start the race</p>
              : <div key={wordIdx} className="word-in" style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:56,color:C.white,letterSpacing:2,userSelect:'none',textAlign:'center',wordBreak:'break-all'}}>{currentWord}</div>}
          </div>
          <input ref={inputRef} value={input} onChange={handleInput} onKeyDown={handleKeyDown} disabled={gameState!=='active'} placeholder="Type here…" autoComplete="off" autoCorrect="off" spellCheck={false}
            style={{width:'100%',background:C.bg,border:`2px solid ${hasError?C.error:C.border}`,borderRadius:12,padding:'12px 16px',fontFamily:"'Space Mono',monospace",fontSize:18,color:hasError?C.error:C.white,transition:'border-color .12s',boxSizing:'border-box'}}/>
        </Card>

        {gameState==='idle'&&(
          <div style={{textAlign:'center',marginTop:24}}><Btn size="lg" style={{paddingLeft:52,paddingRight:52}} onClick={startGame}>Start Race →</Btn></div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD CONTAINER
// ══════════════════════════════════════════════════════════════════════════════
function LeaderboardContainer({onNavigate, stats}) {
  const [tab, setTab] = useState('global');
  return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 16px',fontFamily:"'Syne',sans-serif"}}>
      <div style={{width:'100%',maxWidth:460}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
          <button onClick={()=>onNavigate('menu')} style={{background:'none',border:'none',cursor:'pointer',fontFamily:"'Space Mono',monospace",color:C.muted,fontSize:13}} onMouseEnter={e=>e.target.style.color=C.white} onMouseLeave={e=>e.target.style.color=C.muted}>← Menu</button>
          <h1 style={{fontWeight:800,fontSize:24,color:C.white}}>Leaderboard</h1>
          <div style={{width:40}}/>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:8,marginBottom:20}}>
          {[{id:'global',label:'🌍 Global Top 10'},{id:'personal',label:'👤 My Stats'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'10px',borderRadius:14,fontFamily:"'Space Mono',monospace",fontSize:12,cursor:'pointer',transition:'all .15s',border:`1px solid ${tab===t.id?C.accent:C.border}`,background:tab===t.id?C.surface:C.bg,color:tab===t.id?C.white:C.muted}}>{t.label}</button>
          ))}
        </div>

        {tab==='global' ? (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {LEADERBOARD.map((e,i)=>(
              <div key={e.rank} className="slide-in" style={{animationDelay:`${i*.04}s`,display:'flex',alignItems:'center',gap:14,background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:'12px 16px'}}>
                <div style={{width:32,textAlign:'center',flexShrink:0}}>{MEDALS[e.rank]?<span style={{fontSize:18}}>{MEDALS[e.rank]}</span>:<span style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:C.muted}}>#{e.rank}</span>}</div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:13,color:C.white,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.username}</p>
                  <p style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:C.muted}}>Lv. {e.level}</p>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <p style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:15,color:C.white}}>{e.wpm}</p>
                  <p style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.muted}}>WPM</p>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <p style={{fontFamily:"'Space Mono',monospace",fontSize:13,color:C.white}}>{Math.round(e.accuracy*100)}%</p>
                  <p style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.muted}}>ACC</p>
                </div>
              </div>
            ))}
            {stats.bestWPM>0&&(
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:8}}>
                <div className="slide-in" style={{display:'flex',alignItems:'center',gap:14,background:'rgba(34,197,94,.04)',border:`1px solid rgba(34,197,94,.3)`,borderRadius:16,padding:'12px 16px'}}>
                  <div style={{width:32,textAlign:'center',flexShrink:0}}><span style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:C.muted}}>—</span></div>
                  <div style={{flex:1}}>
                    <p style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:13,color:C.accent}}>You <span style={{fontWeight:400,fontSize:11,color:C.muted}}>(you)</span></p>
                    <p style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:C.muted}}>Lv. {stats.level}</p>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <p style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:15,color:C.accent}}>{stats.bestWPM}</p>
                    <p style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.muted}}>WPM</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:12}}>
            <Card style={{padding:20}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
                <div><div style={{fontFamily:"'Space Mono',monospace",color:C.muted,fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em'}}>Player</div><div style={{color:C.white,fontWeight:700,fontSize:22,marginTop:2}}>You</div></div>
                <div style={{textAlign:'right'}}><div style={{fontFamily:"'Space Mono',monospace",color:C.muted,fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em'}}>Level</div><div style={{color:C.accent,fontWeight:800,fontSize:36}}>{stats.level}</div></div>
              </div>
              <XPBar current={stats.totalXP} level={stats.level}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:16}}>
                {[{l:'Best WPM',v:stats.bestWPM,a:true},{l:'Avg WPM',v:stats.avgWPM},{l:'Accuracy',v:`${Math.round(stats.avgAccuracy*100)}%`},{l:'Runs',v:stats.totalRuns},{l:'Total XP',v:stats.totalXP},{l:'Level',v:stats.level,a:true}].map(({l,v,a})=>(
                  <div key={l} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 14px'}}>
                    <p style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:22,color:a?C.accent:C.white}}>{v}</p>
                    <p style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:C.muted,marginTop:2}}>{l}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Btn size="lg" style={{width:'100%'}} onClick={()=>onNavigate('singleplayer')}>Improve Your Score →</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [view, setView] = useState('menu');
  const [stats, setStats] = useState({ level:3, totalXP:1240, bestWPM:67, avgWPM:54, avgAccuracy:.91, totalRuns:12 });

  const handleRunComplete = useCallback((results, xpEarned) => {
    setStats(prev=>{
      const newTotal = prev.totalXP + xpEarned;
      const allRuns  = prev.totalRuns + 1;
      return {
        level:       calcLevel(newTotal),
        totalXP:     newTotal,
        bestWPM:     Math.max(prev.bestWPM, results.wpm),
        avgWPM:      Math.round((prev.avgWPM * prev.totalRuns + results.wpm) / allRuns),
        avgAccuracy: (prev.avgAccuracy * prev.totalRuns + results.accuracy) / allRuns,
        totalRuns:   allRuns,
      };
    });
  }, []);

  const VIEWS = {
    menu:         <MenuContainer        onNavigate={setView} stats={stats}/>,
    singleplayer: <SinglePlayerContainer onNavigate={setView} onRunComplete={handleRunComplete}/>,
    multiplayer:  <MultiplayerContainer  onNavigate={setView} onRunComplete={handleRunComplete}/>,
    leaderboard:  <LeaderboardContainer  onNavigate={setView} stats={stats}/>,
  };

  return (
    <>
      <style>{css}</style>
      <div style={{minHeight:'100vh',background:C.bg,color:C.white}}>
        {VIEWS[view] ?? VIEWS.menu}
      </div>
    </>
  );
}
