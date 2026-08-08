(function(global){
  "use strict";

  if(!global.GeoLib) throw new Error("GeoLib.Compass nécessite GeoLib 1.3.");

  const G=global.GeoLib;
  const NS="http://www.w3.org/2000/svg";
  const svg=(tag,attrs={})=>{
    const el=document.createElementNS(NS,tag);
    for(const [k,v] of Object.entries(attrs)){
      if(v!==null && v!==undefined) el.setAttribute(k,String(v));
    }
    return el;
  };
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  class Compass{
    constructor({
      x=250,
      y=372,
      radius=255,
      angle=-12,
      pxPerUnit=48,
      unitLabel="cm",
      minRadius=90,
      maxRadius=320,
      showOpening=false,
      allowMove=true,
      allowAdjust=true,
      snapTolerance=16,
      pencilColor="#c50062"
    }={}){
      this.x=x; // pointe sèche
      this.y=y;
      this.radius=clamp(radius,minRadius,maxRadius);
      this.angle=angle;
      this.pxPerUnit=pxPerUnit;
      this.unitLabel=unitLabel;
      this.minRadius=minRadius;
      this.maxRadius=maxRadius;
      this.showOpening=showOpening;
      this.allowMove=allowMove;
      this.allowAdjust=allowAdjust;
      this.snapTolerance=snapTolerance;
      this.pencilColor=pencilColor;

      this.scene=null;
      this.group=null;
      this.snapPoints=[];
      this.drag=null;
      this._move=null;
      this._up=null;
    }

    render(scene){
      if(!scene || !scene.layers || !scene.layers.tools){
        throw new Error("GeoLib.Compass.render : scène invalide.");
      }
      this.scene=scene;
      this.group=svg("g",{class:"geolib-compass-v4","aria-label":"Compas"});
      scene.layers.tools.appendChild(this.group);
      this._draw();
      return this;
    }

    destroy(){
      this._unbind();
      if(this.group) this.group.remove();
      this.group=null;
    }

    setSnapPoints(points=[]){
      this.snapPoints=points.filter(Boolean);
      return this;
    }

    opening(){ return this.radius/this.pxPerUnit; }
    needle(){ return {x:this.x,y:this.y}; }

    pencilTip(){
      const a=this.angle*Math.PI/180;
      return { x:this.x+Math.cos(a)*this.radius, y:this.y+Math.sin(a)*this.radius };
    }

    setOpening(units){
      this.radius=clamp(units*this.pxPerUnit,this.minRadius,this.maxRadius);
      this._draw();
      return this;
    }

    drawCircle({className="geolib-compass-circle"}={}){
      if(!this.scene) throw new Error("GeoLib.Compass.drawCircle : compas non rendu.");
      const c=svg("circle",{cx:this.x,cy:this.y,r:this.radius,class:className});
      this.scene.layers.drawings.appendChild(c);
      return {element:c,center:{x:this.x,y:this.y},radius:this.radius,opening:this.opening()};
    }

    _scenePoint(e){
      return G.Utils.pointerToScene(e,this.scene.svg,this.scene.width,this.scene.height);
    }

    _snap(p){
      let best=null,bestD=this.snapTolerance+1;
      for(const q of this.snapPoints){
        const d=Math.hypot(p.x-q.x,p.y-q.y);
        if(d<bestD){ best=q; bestD=d; }
      }
      return best ? {x:best.x,y:best.y} : p;
    }

    _start(type,e){
      e.preventDefault();
      e.stopPropagation();
      const p=this._scenePoint(e);
      if(type==="move"){
        if(!this.allowMove) return;
        this.drag={type,dx:p.x-this.x,dy:p.y-this.y};
      }else{
        if(!this.allowAdjust) return;
        this.drag={type:"adjust"};
      }
      this.group.classList.add("is-dragging");
      this._move=ev=>{
        if(!this.drag) return;
        ev.preventDefault();
        const q=this._scenePoint(ev);
        if(this.drag.type==="move"){
          let pos={x:clamp(q.x-this.drag.dx,25,this.scene.width-25),y:clamp(q.y-this.drag.dy,25,this.scene.height-25)};
          pos=this._snap(pos);
          this.x=pos.x; this.y=pos.y;
        }else{
          const dx=q.x-this.x,dy=q.y-this.y;
          this.radius=clamp(Math.hypot(dx,dy),this.minRadius,this.maxRadius);
          this.angle=Math.atan2(dy,dx)*180/Math.PI;
        }
        this._draw();
      };
      this._up=()=>{
        this.drag=null;
        if(this.group) this.group.classList.remove("is-dragging");
        this._unbind();
      };
      window.addEventListener("pointermove",this._move,{passive:false});
      window.addEventListener("pointerup",this._up,{once:true});
      window.addEventListener("pointercancel",this._up,{once:true});
    }

    _unbind(){
      if(this._move) window.removeEventListener("pointermove",this._move);
      if(this._up){
        window.removeEventListener("pointerup",this._up);
        window.removeEventListener("pointercancel",this._up);
      }
      this._move=null; this._up=null;
    }

    _draw(){
      if(!this.group) return;
      this.group.innerHTML='';

      const N=this.needle();
      const P=this.pencilTip();
      const vx=P.x-N.x, vy=P.y-N.y;
      const L=Math.hypot(vx,vy)||1;
      const ux=vx/L, uy=vy/L;

      // normale vers le haut de l'écran pour la tête
      let nx=-uy, ny=ux;
      if(ny>0){ nx=-nx; ny=-ny; }

      // Tête plus haute -> branches plus longues
      const lift=clamp(this.radius*0.62,130,175);
      const H={ x:(N.x+P.x)/2 + nx*lift, y:(N.y+P.y)/2 + ny*lift };

      function basis(from,to){
        const dx=to.x-from.x, dy=to.y-from.y, l=Math.hypot(dx,dy)||1;
        return {ux:dx/l, uy:dy/l, nx:-dy/l, ny:dx/l};
      }
      const left=basis(H,N);
      const right=basis(H,P);

      function legPolygon(from,to,b,widthTop=6.5,widthBottom=5,shorten=18){
        const ex=to.x-b.ux*shorten, ey=to.y-b.uy*shorten;
        return [
          [from.x+b.nx*widthTop, from.y+b.ny*widthTop],
          [from.x-b.nx*widthTop, from.y-b.ny*widthTop],
          [ex-b.nx*widthBottom, ey-b.ny*widthBottom],
          [ex+b.nx*widthBottom, ey+b.ny*widthBottom]
        ].map(p=>p.join(',')).join(' ');
      }

      const leftLeg=svg('polygon',{points:legPolygon(H,N,left),class:'compass-leg'});
      const rightLeg=svg('polygon',{points:legPolygon(H,P,right),class:'compass-leg'});

      // Tête DROITE (plus de renversement)
      const stemW=18, stemH=40;
      const stem=svg('rect',{
        x:H.x-stemW/2,
        y:H.y-60,
        width:stemW,
        height:stemH,
        rx:6,
        class:'compass-head-stem'
      });

      const headBody=svg('path',{
        d:[
          `M ${H.x-24} ${H.y-20}`,
          `L ${H.x+24} ${H.y-20}`,
          `L ${H.x+21} ${H.y+26}`,
          `L ${H.x+12} ${H.y+38}`,
          `L ${H.x-12} ${H.y+38}`,
          `L ${H.x-21} ${H.y+26}`,
          'Z'
        ].join(' '),
        class:'compass-head'
      });

      const screw=svg('circle',{cx:H.x,cy:H.y+6,r:10.5,class:'compass-head-screw'});

      // Pointe sèche
      const needleStemStart={x:N.x-left.ux*24,y:N.y-left.uy*24};
      const needleStem=svg('line',{x1:needleStemStart.x,y1:needleStemStart.y,x2:N.x-left.ux*4,y2:N.y-left.uy*4,class:'compass-needle-stem'});
      const needleTip=svg('circle',{cx:N.x,cy:N.y,r:8.5,class:'compass-needle-tip'});

      // Crayon bien lisible
      const pencilLen=92;
      const pencilBack={x:P.x-right.ux*pencilLen,y:P.y-right.uy*pencilLen};
      const half=10;
      const pencilBody=svg('polygon',{
        points:[
          [P.x-right.ux*20+right.nx*half,P.y-right.uy*20+right.ny*half],
          [pencilBack.x+right.nx*half,pencilBack.y+right.ny*half],
          [pencilBack.x-right.nx*half,pencilBack.y-right.ny*half],
          [P.x-right.ux*20-right.nx*half,P.y-right.uy*20-right.ny*half]
        ].map(p=>p.join(',')).join(' '),
        class:'compass-pencil-body', fill:this.pencilColor
      });
      const pencilStripe=svg('polygon',{
        points:[
          [P.x-right.ux*20+right.nx*4,P.y-right.uy*20+right.ny*4],
          [pencilBack.x+right.nx*4,pencilBack.y+right.ny*4],
          [pencilBack.x-right.nx*4,pencilBack.y-right.ny*4],
          [P.x-right.ux*20-right.nx*4,P.y-right.uy*20-right.ny*4]
        ].map(p=>p.join(',')).join(' '),
        class:'compass-pencil-stripe'
      });
      const wood=svg('path',{
        d:`M ${P.x} ${P.y} L ${P.x-right.ux*22+right.nx*half} ${P.y-right.uy*22+right.ny*half} L ${P.x-right.ux*22-right.nx*half} ${P.y-right.uy*22-right.ny*half} Z`,
        class:'compass-pencil-wood'
      });
      const graphite=svg('circle',{cx:P.x,cy:P.y,r:8.5,class:'compass-pencil-tip'});

      // Support horizontal du crayon
      const clampCenter={x:P.x-right.ux*46,y:P.y-right.uy*46};
      const clampBar=svg('line',{
        x1:clampCenter.x-right.nx*34,
        y1:clampCenter.y-right.ny*34,
        x2:clampCenter.x+right.nx*34,
        y2:clampCenter.y+right.ny*34,
        class:'compass-pencil-clamp'
      });
      const clampScrew=svg('circle',{
        cx:clampCenter.x-right.nx*23,
        cy:clampCenter.y-right.ny*23,
        r:8,
        class:'compass-clamp-screw'
      });

      this.group.append(
        leftLeg,rightLeg,
        stem,headBody,screw,
        needleStem,needleTip,
        pencilBody,pencilStripe,wood,graphite,
        clampBar,clampScrew
      );

      if(this.showOpening){
        const bx=H.x+nx*50, by=H.y+ny*50;
        const badge=svg('g',{class:'compass-opening-badge'});
        const bg=svg('rect',{x:bx-39,y:by-16,width:78,height:32,rx:16,class:'compass-opening-bg'});
        const txt=svg('text',{x:bx,y:by+5,class:'compass-opening-text'});
        txt.textContent=`${this.opening().toLocaleString('fr-FR',{maximumFractionDigits:1})} ${this.unitLabel}`;
        badge.append(bg,txt);
        this.group.appendChild(badge);
      }

      const headHit=svg('circle',{cx:H.x,cy:H.y,r:40,class:'compass-hit compass-head-hit'});
      const pencilHit=svg('circle',{cx:P.x,cy:P.y,r:32,class:'compass-hit compass-pencil-hit'});
      this.group.append(headHit,pencilHit);
      headHit.addEventListener('pointerdown',e=>this._start('move',e));
      pencilHit.addEventListener('pointerdown',e=>this._start('adjust',e));
    }
  }

  G.Compass=Compass;
  G.versionCompass='1.4.0-v4';
})(window);
