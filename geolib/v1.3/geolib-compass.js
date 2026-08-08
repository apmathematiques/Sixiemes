(function(global){
  "use strict";

  if(!global.GeoLib) throw new Error("GeoLib.Compass : charge d’abord geolib.js.");

  const {Utils}=global.GeoLib;

  function ensureStyles(){
    if(document.getElementById("geolib-compass-styles")) return;
    const style=document.createElement("style");
    style.id="geolib-compass-styles";
    style.textContent=`
      .geolib-compass{cursor:grab;touch-action:none}
      .geolib-compass.dragging{cursor:grabbing}
      .geolib-compass-leg{stroke:#334155;stroke-width:5;stroke-linecap:round;vector-effect:non-scaling-stroke}
      .geolib-compass-bar{stroke:#64748b;stroke-width:4;stroke-linecap:round;vector-effect:non-scaling-stroke}
      .geolib-compass-hinge{fill:#e2e8f0;stroke:#334155;stroke-width:3;vector-effect:non-scaling-stroke}
      .geolib-compass-center{fill:#fff;stroke:#0d4778;stroke-width:4;vector-effect:non-scaling-stroke;cursor:move}
      .geolib-compass-tip{fill:#fff;stroke:#1769aa;stroke-width:4;vector-effect:non-scaling-stroke;cursor:crosshair}
      .geolib-compass-pencil{fill:#1769aa;stroke:#0d4778;stroke-width:2;vector-effect:non-scaling-stroke}
      .geolib-compass-radius-guide{stroke:#94a3b8;stroke-width:2;stroke-dasharray:6 6;vector-effect:non-scaling-stroke;pointer-events:none}
      .geolib-compass-label{
        fill:#334155;font:700 15px Arial,Helvetica,sans-serif;
        paint-order:stroke;stroke:#fff;stroke-width:5px;stroke-linejoin:round;pointer-events:none
      }
      .geolib-compass-circle{
        fill:none;stroke:#1769aa;stroke-width:3;stroke-dasharray:7 6;
        vector-effect:non-scaling-stroke
      }
    `;
    document.head.appendChild(style);
  }

  class Compass{
    constructor({
      x=660,y=170,radius=150,angle=205,
      minRadius=25,maxRadius=290,
      pxPerCm=48,allowMove=true,allowResize=true
    }={}){
      this.x=x;this.y=y;this.radius=Math.max(minRadius,Math.min(maxRadius,radius));
      this.angle=Utils.normalizeAngle(angle);
      this.minRadius=minRadius;this.maxRadius=maxRadius;this.pxPerCm=pxPerCm;
      this.allowMove=allowMove;this.allowResize=allowResize;
      this.scene=null;this.group=null;this.centerHandle=null;this.tipHandle=null;
      this._interaction=null;
    }

    tip(){
      const r=Utils.degToRad(this.angle);
      return{x:this.x+Math.cos(r)*this.radius,y:this.y+Math.sin(r)*this.radius};
    }

    radiusCm(){
      return this.radius/this.pxPerCm;
    }

    setCenter(x,y){
      this.x=x;this.y=y;this.update();
      return this;
    }

    setRadius(radius){
      this.radius=Math.max(this.minRadius,Math.min(this.maxRadius,radius));
      this.update();
      return this;
    }

    setAngle(angle){
      this.angle=Utils.normalizeAngle(angle);this.update();
      return this;
    }

    render(scene){
      ensureStyles();
      this.scene=scene;

      const g=Utils.createSvg("g",{class:"geolib-compass"});
      scene.layers.tools.appendChild(g);
      this.group=g;

      this.update();
      this._bind();
      return this;
    }

    update(){
      if(!this.group)return;

      const t=this.tip();
      const dx=t.x-this.x,dy=t.y-this.y,len=Math.hypot(dx,dy)||1;
      const nx=-dy/len,ny=dx/len;

      // Articulation légèrement au-dessus du segment centre-pointe.
      const hinge={
        x:this.x+dx*.47+nx*42,
        y:this.y+dy*.47+ny*42
      };

      this.group.innerHTML="";

      const guide=Utils.createSvg("line",{
        x1:this.x,y1:this.y,x2:t.x,y2:t.y,class:"geolib-compass-radius-guide"
      });
      const leg1=Utils.createSvg("line",{
        x1:hinge.x,y1:hinge.y,x2:this.x,y2:this.y,class:"geolib-compass-leg"
      });
      const leg2=Utils.createSvg("line",{
        x1:hinge.x,y1:hinge.y,x2:t.x,y2:t.y,class:"geolib-compass-leg"
      });
      const bar=Utils.createSvg("line",{
        x1:this.x+dx*.28+nx*18,y1:this.y+dy*.28+ny*18,
        x2:this.x+dx*.72+nx*18,y2:this.y+dy*.72+ny*18,
        class:"geolib-compass-bar"
      });
      const hingeDot=Utils.createSvg("circle",{
        cx:hinge.x,cy:hinge.y,r:10,class:"geolib-compass-hinge"
      });

      const center=Utils.createSvg("circle",{
        cx:this.x,cy:this.y,r:11,class:"geolib-compass-center"
      });
      const tip=Utils.createSvg("circle",{
        cx:t.x,cy:t.y,r:11,class:"geolib-compass-tip"
      });
      const pencil=Utils.createSvg("path",{
        d:`M ${t.x-5} ${t.y-14} L ${t.x+5} ${t.y-14} L ${t.x} ${t.y+1} Z`,
        class:"geolib-compass-pencil"
      });

      const label=Utils.createSvg("text",{
        x:(this.x+t.x)/2+nx*18,
        y:(this.y+t.y)/2+ny*18,
        class:"geolib-compass-label"
      });
      label.textContent=`${this.radiusCm().toLocaleString("fr-FR",{maximumFractionDigits:1})} cm`;

      g.append(guide,leg1,leg2,bar,hingeDot,center,tip,pencil,label);

      this.centerHandle=center;
      this.tipHandle=tip;
    }

    _bind(){
      const beginMove=e=>{
        if(!this.allowMove)return;
        e.preventDefault();e.stopPropagation();
        const p=Utils.pointerToScene(e,this.scene.svg,this.scene.width,this.scene.height);
        this._interaction={type:"move",dx:p.x-this.x,dy:p.y-this.y};
        this.group.classList.add("dragging");
        window.addEventListener("pointermove",move);
        window.addEventListener("pointerup",end,{once:true});
      };

      const beginResize=e=>{
        if(!this.allowResize)return;
        e.preventDefault();e.stopPropagation();
        this._interaction={type:"resize"};
        this.group.classList.add("dragging");
        window.addEventListener("pointermove",move);
        window.addEventListener("pointerup",end,{once:true});
      };

      const move=e=>{
        if(!this._interaction)return;
        const p=Utils.pointerToScene(e,this.scene.svg,this.scene.width,this.scene.height);

        if(this._interaction.type==="move"){
          const nx=Math.max(25,Math.min(this.scene.width-25,p.x-this._interaction.dx));
          const ny=Math.max(25,Math.min(this.scene.height-25,p.y-this._interaction.dy));
          this.x=nx;this.y=ny;
        }else{
          const dx=p.x-this.x,dy=p.y-this.y;
          this.radius=Math.max(this.minRadius,Math.min(this.maxRadius,Math.hypot(dx,dy)));
          this.angle=Utils.normalizeAngle(Utils.radToDeg(Math.atan2(dy,dx)));
        }
        this.update();
        this._bind();
      };

      const end=()=>{
        window.removeEventListener("pointermove",move);
        this._interaction=null;
        if(this.group)this.group.classList.remove("dragging");
      };

      this.centerHandle.addEventListener("pointerdown",beginMove);
      this.tipHandle.addEventListener("pointerdown",beginResize);
    }

    traceCircle({className="geolib-compass-circle"}={}){
      if(!this.scene)throw new Error("GeoLib.Compass.traceCircle : compas non rendu.");
      const c=Utils.createSvg("circle",{
        cx:this.x,cy:this.y,r:this.radius,class:className
      });
      this.scene.layers.drawings.appendChild(c);
      return{
        element:c,
        center:{x:this.x,y:this.y},
        radius:this.radius,
        radiusCm:this.radiusCm()
      };
    }
  }

  global.GeoLib.Compass=Compass;
  global.GeoLib.versionWithCompass=(global.GeoLib.version||"")+" + compass-1.0";
})(window);
