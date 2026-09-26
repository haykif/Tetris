const COLS=10,ROWS=20,CELL=30;
const COLORS={I:"#00ff66",J:"#00ff66",L:"#00ff66",O:"#00ff66",S:"#00ff66",T:"#00ff66",Z:"#00ff66"};
const SHAPES={I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],J:[[1,0,0],[1,1,1],[0,0,0]],L:[[0,0,1],[1,1,1],[0,0,0]],O:[[1,1],[1,1]],S:[[0,1,1],[1,1,0],[0,0,0]],T:[[0,1,0],[1,1,1],[0,0,0]],Z:[[1,1,0],[0,1,1],[0,0,0]]};
const TYPES=["I","J","L","O","S","T","Z"];
const SPEED=[800,717,633,550,467,383,300,217,133,100,83,67,50,42,34,25,20,17,14,11,9,8,7,6,6,5,5,4,4,3];
const boardCanvas=document.querySelector("#board"),ctx=boardCanvas.getContext("2d"),nextCanvas=document.querySelector("#next"),nctx=nextCanvas.getContext("2d");
const scoreEl=document.querySelector("#score"),highEl=document.querySelector("#high"),levelEl=document.querySelector("#level"),linesEl=document.querySelector("#lines"),overlay=document.querySelector("#overlay"),overlayText=document.querySelector("#overlayText"),startBtn=document.querySelector("#startBtn");
let board,piece,nextType,score=0,lines=0,level=0,high=Number(localStorage.tetrisHigh||0),running=false,paused=false,last=0,fall=0,bag=[],lockTimer=0;
const keys={left:false,right:false,down:false,leftAt:0,rightAt:0};

function clone(t){return SHAPES[t].map(r=>r.slice())}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function nextPiece(){if(!bag.length)bag=shuffle(TYPES.slice());return bag.pop()}
function spawn(){const t=nextType||nextPiece();nextType=nextPiece();piece={type:t,matrix:clone(t),x:Math.floor((COLS-clone(t)[0].length)/2),y:-1};lockTimer=0;if(collides(piece))gameOver()}
function collides(p,dx=0,dy=0,m=p.matrix){for(let y=0;y<m.length;y++)for(let x=0;x<m[y].length;x++)if(m[y][x]){const X=p.x+x+dx,Y=p.y+y+dy;if(X<0||X>=COLS||Y>=ROWS)return true;if(Y>=0&&board[Y][X])return true}return false}
function move(dx,dy){if(collides(piece,dx,dy))return false;piece.x+=dx;piece.y+=dy;lockTimer=0;return true}
function rotate(m){const a=m.map(r=>r.slice());for(let y=0;y<a.length;y++)for(let x=0;x<y;x++)[a[x][y],a[y][x]]=[a[y][x],a[x][y]];a.forEach(r=>r.reverse());return a}
function turn(){const m=rotate(piece.matrix);for(const dx of [0,-1,1,-2,2])if(!collides(piece,dx,0,m)){piece.matrix=m;piece.x+=dx;lockTimer=0;return true}return false}
function merge(){for(let y=0;y<piece.matrix.length;y++)for(let x=0;x<piece.matrix[y].length;x++)if(piece.matrix[y][x]&&piece.y+y>=0)board[piece.y+y][piece.x+x]=piece.type}
function clearLines(){let n=0;for(let y=ROWS-1;y>=0;y--)if(board[y].every(Boolean)){board.splice(y,1);board.unshift(Array(COLS).fill(null));n++;y++}if(n){score += [0,40,100,300,1200][n]*(level+1);lines+=n;level=Math.min(29,Math.floor(lines/10));if(score>high){high=score;localStorage.tetrisHigh=high}}}
function lock(){merge();clearLines();spawn();update()}
function hardDrop(){let d=0;while(move(0,1))d++;score+=d*2;lock()}
function gameOver(){running=false;high=Math.max(high,score);localStorage.tetrisHigh=high;overlay.classList.remove("hidden");overlayText.textContent="GAME OVER";startBtn.textContent="PLAY AGAIN";update()}
function start(){board=Array.from({length:ROWS},()=>Array(COLS).fill(null));bag=[];nextType=nextPiece();score=0;lines=0;level=0;running=true;paused=false;overlay.classList.add("hidden");startBtn.textContent="START";spawn();update();last=performance.now();requestAnimationFrame(loop)}
function pause(){if(!running)return;paused=!paused;overlay.classList.toggle("hidden",!paused);overlayText.textContent="PAUSED";startBtn.textContent="RESUME";if(!paused){last=performance.now();requestAnimationFrame(loop)}}
function update(){const pad=(n,w)=>String(n).padStart(w,"0");scoreEl.textContent=pad(score,6);linesEl.textContent=pad(lines,3);levelEl.textContent=pad(level,2);highEl.textContent=pad(high,6)}
function drawBlock(c,x,y,t,size=CELL){c.fillStyle=COLORS[t];c.fillRect(x*size+1,y*size+1,size-2,size-2);c.fillStyle="#00aa44";c.fillRect(x*size+2,y*size+2,size-5,Math.max(2,size*.12))}
function drawPiece(c,p,ox=0,oy=0,size=CELL){p.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v&&oy+y>=0)drawBlock(c,ox+x,oy+y,p.type,size)}))}
function draw(){ctx.fillStyle="#000";ctx.fillRect(0,0,300,600);for(let x=0;x<COLS;x++)for(let y=0;y<ROWS;y++)if(board?.[y]?.[x])drawBlock(ctx,x,y,board[y][x]);if(piece)drawPiece(ctx,piece,piece.x,piece.y)}
function drawNext(){nctx.fillStyle="#0b0b0b";nctx.fillRect(0,0,120,100);if(!nextType)return;const p={type:nextType,matrix:clone(nextType)},size=22,w=p.matrix[0].length*size,h=p.matrix.length*size;drawPiece(nctx,p,Math.floor((120-w)/2/size),Math.floor((100-h)/2/size),size)}
function loop(now){if(!running||paused)return;const dt=now-last;last=now;fall+=dt;if(keys.left||keys.right){const k=keys.left?"left":"right",nowT=performance.now(),at=keys[k+"At"];if(nowT-at>160&&nowT-at<1000){if(Math.floor((nowT-at-160)/45)!==Math.floor((nowT-at-160-dt)/45))move(k==="left"?-1:1,0)}}const interval=SPEED[level];if(keys.down){if(fall>45){if(move(0,1)){score++;fall=0}else{lockTimer+=45;fall=0}}}else if(fall>=interval){if(move(0,1)){}else lockTimer+=fall;fall=0}if(collides(piece,0,1)){lockTimer+=dt;if(lockTimer>500)lock()}draw();drawNext();update();requestAnimationFrame(loop)}
function keyDown(e){const k=e.key.toLowerCase();if(["arrowleft","arrowright","arrowdown","arrowup"," "].includes(k))e.preventDefault();if(!running){if(k!=="p")start();return}if(k==="p"){pause();return}if(paused)return;if(k==="arrowleft"){if(!keys.left){keys.left=true;keys.leftAt=performance.now();move(-1,0)}}else if(k==="arrowright"){if(!keys.right){keys.right=true;keys.rightAt=performance.now();move(1,0)}}else if(k==="arrowdown")keys.down=true;else if(k==="arrowup")turn();else if(e.code==="Space")hardDrop();draw();drawNext();update()}
function keyUp(e){const k=e.key.toLowerCase();if(k==="arrowleft")keys.left=false;if(k==="arrowright")keys.right=false;if(k==="arrowdown")keys.down=false}
document.addEventListener("keydown",keyDown);document.addEventListener("keyup",keyUp);
document.querySelector("#pauseBtn").onclick=pause;startBtn.onclick=()=>paused?pause():start();
drawNext();update();