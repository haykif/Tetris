const COLS=10,ROWS=20,CELL=30;
const COLORS={I:"#25d9e8",J:"#3d67ff",L:"#ff9d24",O:"#ffe34d",S:"#49e36f",T:"#b05cff",Z:"#ff4058"};
const SHAPES={I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],J:[[1,0,0],[1,1,1],[0,0,0]],L:[[0,0,1],[1,1,1],[0,0,0]],O:[[1,1],[1,1]],S:[[0,1,1],[1,1,0],[0,0,0]],T:[[0,1,0],[1,1,1],[0,0,0]],Z:[[1,1,0],[0,1,1],[0,0,0]]};
const TYPES=Object.keys(SHAPES);
const boardCanvas=document.querySelector("#board"),ctx=boardCanvas.getContext("2d"),holdCanvas=document.querySelector("#hold"),hctx=holdCanvas.getContext("2d"),nextCanvas=document.querySelector("#next"),nctx=nextCanvas.getContext("2d");
let board,piece,nextQueue=[],holdType=null,canHold=true,score=0,lines=0,level=1,high=Number(localStorage.tetrisHigh||0),running=false,paused=false,last=0,dropTimer=0,bag=[];
const scoreEl=document.querySelector("#score"),highEl=document.querySelector("#high"),levelEl=document.querySelector("#level"),linesEl=document.querySelector("#lines"),overlay=document.querySelector("#overlay"),overlayText=document.querySelector("#overlayText"),startBtn=document.querySelector("#startBtn");
highEl.textContent=high;
function matrix(t){return SHAPES[t].map(r=>r.slice())}
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function getType(){if(!bag.length)bag=shuffle(TYPES.slice());return bag.pop()}
function refill(){while(nextQueue.length<5)nextQueue.push(getType())}
function spawn(type=nextQueue.shift()){refill();piece={type,matrix:matrix(type),x:Math.floor((COLS-matrix(type)[0].length)/2),y:0};canHold=true;if(collides(piece))gameOver()}
function rotate(m,dir){const a=m.map(r=>r.slice());for(let y=0;y<a.length;y++)for(let x=0;x<y;x++)[a[x][y],a[y][x]]=[a[y][x],a[x][y]];if(dir>0)a.forEach(r=>r.reverse());else a.reverse();return a}
function collides(p,dx=0,dy=0,m=p.matrix){for(let y=0;y<m.length;y++)for(let x=0;x<m[y].length;x++)if(m[y][x]&&(p.x+x+dx<0||p.x+x+dx>=COLS||p.y+y+dy>=ROWS||(p.y+y+dy>=0&&board[p.y+y+dy][p.x+x+dx])))return true;return false}
function move(dx,dy){if(!piece||paused)return false;if(!collides(piece,dx,dy)){piece.x+=dx;piece.y+=dy;return true}return false}
function tryRotate(dir){const m=rotate(piece.matrix,dir),tests=[[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1]];for(const [dx,dy]of tests)if(!collides(piece,dx,dy,m)){piece.matrix=m;piece.x+=dx;piece.y+=dy;return true}return false}
function hardDrop(){let d=0;while(move(0,1))d++;score+=d*2;lock()}
function ghostY(){let y=piece.y;while(!collides(piece,0,y-piece.y+1))y++;return y}
function merge(){piece.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v&&piece.y+y>=0)board[piece.y+y][piece.x+x]=piece.type}))}
function lock(){merge();let cleared=0;for(let y=ROWS-1;y>=0;y--)if(board[y].every(Boolean)){board.splice(y,1);board.unshift(Array(COLS).fill(null));cleared++;y++}if(cleared){const pts=[0,100,300,500,800][cleared]*(level);score+=pts;lines+=cleared;level=1+Math.floor(lines/10)}spawn();updateStats()}
function hold(){if(!piece||!canHold||paused)return;const t=piece.type;if(holdType===null){holdType=t;spawn()}else{const swap=holdType;holdType=t;spawn(swap)}canHold=false;draw()}
function gameOver(){running=false;high=Math.max(high,score);localStorage.tetrisHigh=high;overlay.classList.remove("hidden");overlayText.textContent="GAME OVER — Score "+score;startBtn.textContent="PLAY AGAIN"}
function start(){board=Array.from({length:ROWS},()=>Array(COLS).fill(null));bag=[];nextQueue=[];holdType=null;score=0;lines=0;level=1;paused=false;running=true;refill();spawn();overlay.classList.add("hidden");startBtn.textContent="START";updateStats();last=performance.now();requestAnimationFrame(loop)}
function togglePause(){if(!running)return;paused=!paused;overlay.classList.toggle("hidden",!paused);overlayText.textContent="PAUSED";startBtn.textContent="RESUME";if(!paused){last=performance.now();requestAnimationFrame(loop)}}
function updateStats(){scoreEl.textContent=score;highEl.textContent=high;levelEl.textContent=level;linesEl.textContent=lines}
function drawCell(c,x,y,size=CELL,alpha=1){c.globalAlpha=alpha;c.fillStyle=COLORS[piece?.type]||"#fff";c.fillRect(x*size+1,y*size+1,size-2,size-2);c.fillStyle="#fff";c.globalAlpha=alpha*.22;c.fillRect(x*size+2,y*size+2,size-5,Math.max(2,size*.13));c.globalAlpha=1}
function drawPiece(c,p,ox=0,oy=0,size=CELL,alpha=1){p.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v){c.globalAlpha=alpha;c.fillStyle=COLORS[p.type];c.fillRect((ox+x)*size+1,(oy+y)*size+1,size-2,size-2);c.fillStyle="#fff";c.globalAlpha=alpha*.22;c.fillRect((ox+x)*size+2,(oy+y)*size+2,size-5,Math.max(2,size*.13));c.globalAlpha=1}}))}
function draw(){ctx.clearRect(0,0,300,600);ctx.fillStyle="#07070b";ctx.fillRect(0,0,300,600);ctx.strokeStyle="#ffffff08";ctx.lineWidth=1;for(let x=1;x<COLS;x++){ctx.beginPath();ctx.moveTo(x*CELL,0);ctx.lineTo(x*CELL,600);ctx.stroke()}for(let y=1;y<ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*CELL);ctx.lineTo(300,y*CELL);ctx.stroke()}board?.forEach((r,y)=>r.forEach((t,x)=>{if(t){ctx.fillStyle=COLORS[t];ctx.fillRect(x*CELL+1,y*CELL+1,CELL-2,CELL-2);ctx.fillStyle="#fff3";ctx.fillRect(x*CELL+2,y*CELL+2,CELL-5,4)}}));if(piece){const gy=ghostY();drawPiece(ctx,{type:piece.type,matrix:piece.matrix},piece.x,gy,.0+CELL,.18);drawPiece(ctx,piece,piece.x,piece.y,CELL,1)}}
function mini(c,type){c.clearRect(0,0,c.canvas.width,c.canvas.height);if(!type)return;const m=matrix(type),size=24,w=m[0].length*size,h=m.length*size;drawPiece(c,{type,matrix:m},Math.floor((c.canvas.width-w)/2/size),Math.floor((c.canvas.height-h)/2/size),size,1)}
function drawSide(){mini(hctx,holdType);nctx.clearRect(0,0,120,280);nextQueue.slice(0,5).forEach((t,i)=>{const m=matrix(t),size=19,w=m[0].length*size,h=m.length*size;drawPiece(nctx,{type:t,matrix:m},Math.floor((120-w)/2/size),Math.floor((i*55+18)/size),size,1)})}
function drawAll(){draw();drawSide()}
function loop(now){if(!running)return;if(!paused){const dt=now-last;last=now;dropTimer+=dt;const interval=Math.max(70,800-(level-1)*65);if(dropTimer>=interval){move(0,1);dropTimer=0}draw();drawSide();requestAnimationFrame(loop)}}
document.addEventListener("keydown",e=>{const k=e.key.toLowerCase();if(["arrowleft","arrowright","arrowdown","arrowup"," ","shift","c","p"].includes(k)||e.code==="Space")e.preventDefault();if(!running){if(k==="p")return;start();return}if(k==="p"){togglePause();return}if(paused)return;if(k==="arrowleft")move(-1,0);else if(k==="arrowright")move(1,0);else if(k==="arrowdown"){if(move(0,1))score+=1}else if(k==="arrowup")tryRotate(1);else if(e.code==="Space")hardDrop();else if(k==="c"||k==="shift")hold();updateStats();drawAll()});
document.querySelector("#pauseBtn").onclick=togglePause;startBtn.onclick=()=>{if(paused){togglePause()}else start()};drawSide();draw();
