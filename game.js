const c=document.getElementById("screen"),g=c.getContext("2d");
const FG="#00ff66",COLS=10,ROWS=20;
const S={I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],J:[[1,0,0],[1,1,1],[0,0,0]],L:[[0,0,1],[1,1,1],[0,0,0]],O:[[1,1],[1,1]],S:[[0,1,1],[1,1,0],[0,0,0]],T:[[0,1,0],[1,1,1],[0,0,0]],Z:[[1,1,0],[0,1,1],[0,0,0]]};
const T=["I","J","L","O","S","Z","T"];
let b,p,n,score=0,lines=0,level=0,thousands=0,state="level",input="",preview=true,last=0,fall=0,lock=0;
function cp(t){return S[t].map(r=>r.slice())}
function rnd(){return T[Math.floor(Math.random()*T.length)]}
function reset(){b=Array.from({length:ROWS},()=>Array(COLS).fill(0));score=lines=thousands=0;level=+input||0;n=rnd();spawn();state="play";last=performance.now();fall=lock=0}
function spawn(){let t=n||rnd();n=rnd();p={t,m:cp(t),x:3,y:0};if(hit(p))state="over"}
function hit(q,dx=0,dy=0,m=q.m){for(let y=0;y<m.length;y++)for(let x=0;x<m[y].length;x++)if(m[y][x]){let X=q.x+x+dx,Y=q.y+y+dy;if(X<0||X>=COLS||Y>=ROWS||(Y>=0&&b[Y][X]))return true}return false}
function mv(dx,dy){if(hit(p,dx,dy))return false;p.x+=dx;p.y+=dy;lock=0;return true}
function rot(m){let n=m.length,a=Array.from({length:n},()=>Array(n).fill(0));for(let y=0;y<n;y++)for(let x=0;x<n;x++)a[n-1-x][y]=m[y][x];return a}
function turn(){if(p.t==="O")return;let m=rot(p.m);for(let dx of [0,-1,1,-2,2])if(!hit(p,dx,0,m)){p.m=m;p.x+=dx;lock=0;return}}
function merge(){for(let y=0;y<p.m.length;y++)for(let x=0;x<p.m[y].length;x++)if(p.m[y][x]&&p.y+y>=0)b[p.y+y][p.x+x]=1}
function clear(){for(let y=ROWS-1;y>=0;y--)if(b[y].every(Boolean)){b.splice(y,1);b.unshift(Array(COLS).fill(0));lines++;y++}level=Math.min(9,Math.floor(lines/10))}
function points(d){score+=Math.max(0,19-d)+level*3+(preview?0:5);while(score>=1000){score-=1000;thousands++}}
function lockPiece(d=0){points(Math.max(0,d));merge();clear();spawn();fall=lock=0}
function drop(){let d=0;while(mv(0,1))d++;lockPiece(d)}
function speed(){return Math.max(80,1000-level*80)}
function tick(now){if(state!=="play")return;let dt=now-last;last=now;fall+=dt;if(fall>=speed()){if(!mv(0,1))lock+=dt;else lock=0;fall=0}if(hit(p,0,1)){lock+=dt;if(lock>=500)lockPiece(Math.max(0,p.y))}}
function key(e){let k=e.key;if(state==="level"){if(/^[0-9]$/.test(k)){input=k;draw()}else if(k==="Enter"&&input!=="")reset();return}if(state==="over"){if(k!=="Escape"){state="level";input="";draw()}return}if(state!=="play")return;if(["7","ArrowLeft","a","A"].includes(k))mv(-1,0);else if(["9","ArrowRight","d","D"].includes(k))mv(1,0);else if(["8","ArrowUp","w","W"].includes(k))turn();else if(["4","ArrowDown","s","S"].includes(k)){if(mv(0,1))score++}else if(["5"," ","x","X"].includes(k))drop();else if(["1","p","P"].includes(k))preview=!preview;else return;e.preventDefault();draw()}
document.addEventListener("keydown",key);
function tx(x,y,s){g.fillStyle=FG;g.fillText(s,x*12,y*20)}
function cell(x,y,on){tx(31+x*2,y+4,on?"[]":"  ")}
function draw(){g.fillStyle="#000";g.fillRect(0,0,960,600);g.font="16px Courier New,monospace";if(state==="level"){tx(36,8,"ТЕТРИС");tx(36,10,"УРОВЕНЬ: "+(input||"_"));tx(36,12,"НАЖМИТЕ ENTER");return}tx(3,2,"ПОЛНЫХ СТРОК: "+String(lines).padStart(2," "));tx(3,3,"УРОВЕНЬ:       "+level);tx(3,4,"СЧЕТ:          "+String(score).padStart(3," "));for(let i=0;i<thousands;i++)tx(15+i,4,"¤");tx(55,3,"7: НАЛЕВО   9: НАПРАВО");tx(55,4,"8: ПОВОРОТ");tx(55,5,"4: УСКОРИТЬ   5: СБРОСИТЬ");tx(55,6,"1: ПОКАЗАТЬ СЛЕДУЮЩУЮ");tx(55,7,"0: СТЕРЕТЬ ЭТОТ ТЕКСТ");tx(55,8,"ПРОБЕЛ - СБРОСИТЬ");
for(let y=0;y<ROWS;y++){tx(30,y+4,"<!");for(let x=0;x<COLS;x++)cell(x,y,b?.[y]?.[x]);tx(50,y+4,"!>")}tx(30,24,"<!====================!>");tx(33,25,"\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/");
if(p)for(let y=0;y<p.m.length;y++)for(let x=0;x<p.m[y].length;x++)if(p.m[y][x]&&p.y+y>=0&&p.y+y<ROWS)cell(p.x+x,p.y+y,1);
if(preview&&n){let q=cp(n);for(let y=0;y<q.length;y++)for(let x=0;x<q[y].length;x++)if(q[y][x])tx(55+x*2,10+y,"[]")}
if(state==="over"){tx(35,14,"КОНЕЦ ИГРЫ");tx(35,16,"НАЖМИТЕ КЛАВИШУ")}}
function loop(t){tick(t);draw();requestAnimationFrame(loop)}
draw();requestAnimationFrame(loop);