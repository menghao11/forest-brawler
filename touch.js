'use strict';
// 移动端触控：虚拟摇杆 + 按键，映射到键盘状态 keys/pressed
(function(){
 const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
 function fit(){const w=innerWidth,h=innerHeight,s=Math.min(w/960,h/540);cv.style.width=960*s+'px';cv.style.height=540*s+'px'}
 addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,200));fit();
 // iOS: 在 touchend 中恢复 AudioContext
 const unlock=()=>{auInit();if(AU.ctx&&AU.ctx.state!=='running')AU.ctx.resume()};
 document.addEventListener('touchend',unlock,{passive:true});document.addEventListener('touchstart',unlock,{passive:true});
 document.addEventListener('gesturestart',e=>e.preventDefault());
 document.addEventListener('contextmenu',e=>e.preventDefault());
 let lastEnd=0;document.addEventListener('touchend',e=>{const n=Date.now();if(n-lastEnd<350)e.preventDefault();lastEnd=n},{passive:false});
 if(!isTouch)return;document.body.classList.add('touch');
 const press=k=>{if(!keys[k])pressed[k]=true;keys[k]=true},release=k=>{keys[k]=false};
 // 按钮（多点触控，每个按钮跟踪自己的 touch id）
 document.querySelectorAll('.btn').forEach(b=>{let id=null;
  b.addEventListener('touchstart',e=>{e.preventDefault();id=e.changedTouches[0].identifier;b.classList.add('on');
   if(b.id==='bM'){auInit();auMute();return}if(b.id==='bP'){window.__help();return}press(b.dataset.k)},{passive:false});
  const end=e=>{for(const t of e.changedTouches)if(t.identifier===id){id=null;b.classList.remove('on');if(b.dataset.k)release(b.dataset.k)}e.preventDefault()};
  b.addEventListener('touchend',end,{passive:false});b.addEventListener('touchcancel',end,{passive:false});});
 // 摇杆（8方向）
 const zone=document.getElementById('joyZone'),joy=document.getElementById('joy'),knob=document.getElementById('knob');let jid=null,cx=0,cy=0;
 const dirs=['a','d','w','s'],setDir=(dx,dy)=>{const R=50,dead=14;const m=Math.hypot(dx,dy);if(m>R){dx*=R/m;dy*=R/m}
  knob.style.transform=`translate(${dx}px,${dy}px)`;const ang=Math.atan2(dy,dx),oct=Math.round(ang/(Math.PI/4));const on={a:0,d:0,w:0,s:0};
  if(m>dead){const vx=Math.round(Math.cos(oct*Math.PI/4)),vy=Math.round(Math.sin(oct*Math.PI/4));if(vx>0)on.d=1;if(vx<0)on.a=1;if(vy<0)on.w=1;if(vy>0)on.s=1}
  for(const k of dirs){if(on[k])press(k);else release(k)}};
 zone.addEventListener('touchstart',e=>{e.preventDefault();if(jid!==null)return;const t=e.changedTouches[0];jid=t.identifier;const r=joy.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;setDir(t.clientX-cx,t.clientY-cy)},{passive:false});
 zone.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches)if(t.identifier===jid)setDir(t.clientX-cx,t.clientY-cy)},{passive:false});
 const jend=e=>{e.preventDefault();for(const t of e.changedTouches)if(t.identifier===jid){jid=null;setDir(0,0)}};
 zone.addEventListener('touchend',jend,{passive:false});zone.addEventListener('touchcancel',jend,{passive:false});
 // 画布点击：女巫菜单选法术 / 结束后重开
 cv.addEventListener('touchstart',e=>{e.preventDefault();const r=cv.getBoundingClientRect();
  for(const t of e.changedTouches){const x=(t.clientX-r.left)*960/r.width,y=(t.clientY-r.top)*540/r.height;window.__tap(x,y)}},{passive:false});
 // 在说明面板上下拖动 = 滚动背景故事
 let dragY=null;cv.addEventListener('touchstart',e=>{dragY=e.changedTouches[0].clientY},{passive:true});
 cv.addEventListener('touchmove',e=>{e.preventDefault();if(dragY===null)return;const r=cv.getBoundingClientRect(),y=e.changedTouches[0].clientY;if(window.__scrollPanel)window.__scrollPanel((dragY-y)*540/r.height);dragY=y},{passive:false});
 cv.addEventListener('touchend',()=>{dragY=null},{passive:true});
 setInterval(()=>{const G=window.__G(),M=window.__dbg.mode();document.body.classList.toggle('inplay',M==='play');document.body.classList.toggle('inmenu',!!(G&&G.menu&&M==='play'));const hp=window.__helpOpen();document.body.classList.toggle('inhelp',hp);bP.textContent=hp?'继续':'暂停';if(!G||M!=='play')return;const p=G.p;
  const near=G.lockX==null&&G.B.witches.some(w=>Math.abs(w.x-p.x)<90&&Math.abs(w.y-p.y)<90);
  bE.style.display=near||G.menu?'flex':'none';bE.textContent=G.menu?'关闭':'女巫';bL.classList.toggle('ready',p.energy>=100);bM.textContent=AU.muted?'静音':'音'},120);
})();
