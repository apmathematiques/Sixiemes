(function(global){
  "use strict";

  const SVG_NS="http://www.w3.org/2000/svg";

  const Utils={
    degToRad(deg){return deg*Math.PI/180},
    radToDeg(rad){return rad*180/Math.PI},
    normalizeAngle(deg){
      let a=deg%360;
      if(a<0)a+=360;
      return a;
    },
    angleDifference(a,b){
      let d=Math.abs(Utils.normalizeAngle(a)-Utils.normalizeAngle(b))%180;
      return Math.min(d,180-d);
    },
    distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)},
    distancePointToLine(point,line){
      const {a,b,c}=line.standardForm();
      return Math.abs(a*point.x+b*point.y+c)/Math.hypot(a,b);
    },
    createSvg(tag,attrs={}){
      const el=document.createElementNS(SVG_NS,tag);
      for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));
      return el;
    },
    pointerToScene(event,svg,width,height){
      const rect=svg.getBoundingClientRect();
      return {
        x:(event.clientX-rect.left)*width/rect.width,
        y:(event.clientY-rect.top)*height/rect.height
      };
    }
  };

  class Point{
    constructor(x,y,{name="",size=8,labelOffset={x:10,y:-10}}={}){
      this.x=x;this.y=y;this.name=name;this.size=size;this.labelOffset=labelOffset;
      this.group=null;
    }
    render(scene){
      const g=Utils.createSvg("g"),s=this.size;
      g.append(
        Utils.createSvg("line",{x1:this.x-s,y1:this.y-s,x2:this.x+s,y2:this.y+s,class:"geolib-point-cross"}),
        Utils.createSvg("line",{x1:this.x-s,y1:this.y+s,x2:this.x+s,y2:this.y-s,class:"geolib-point-cross"})
      );
      if(this.name){
        const t=Utils.createSvg("text",{
          x:this.x+this.labelOffset.x,
          y:this.y+this.labelOffset.y,
          class:"geolib-point-label"
        });
        t.textContent=this.name;
        g.appendChild(t);
      }
      scene.layers.points.appendChild(g);
      this.group=g;
      return this;
    }
  }

  class Line{
    constructor(point,angle,{name="",className=""}={}){
      this.point={x:point.x,y:point.y};
      this.angle=Utils.normalizeAngle(angle);
      this.name=name;
      this.className=className;
      this.element=null;
    }
    direction(){
      const r=Utils.degToRad(this.angle);
      return {x:Math.cos(r),y:Math.sin(r)};
    }
    standardForm(){
      const d=this.direction(),a=-d.y,b=d.x,c=-(a*this.point.x+b*this.point.y);
      return {a,b,c};
    }
    pointAt(t){
      const d=this.direction();
      return {x:this.point.x+d.x*t,y:this.point.y+d.y*t};
    }
    intersection(other){
      const l1=this.standardForm(),l2=other.standardForm();
      const det=l1.a*l2.b-l2.a*l1.b;
      if(Math.abs(det)<1e-9)return null;
      return {
        x:(l1.b*l2.c-l2.b*l1.c)/det,
        y:(l1.c*l2.a-l2.c*l1.a)/det
      };
    }
    isParallelTo(other,toleranceDeg=1){
      return Utils.angleDifference(this.angle,other.angle)<=toleranceDeg;
    }
    isPerpendicularTo(other,toleranceDeg=1){
      return Math.abs(Utils.angleDifference(this.angle,other.angle)-90)<=toleranceDeg;
    }
    distanceToPoint(point){return Utils.distancePointToLine(point,this)}
    render(scene){
      const p1=this.pointAt(-2000),p2=this.pointAt(2000);
      const el=Utils.createSvg("line",{
        x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,
        class:`geolib-line ${this.className}`.trim()
      });
      scene.layers.lines.appendChild(el);
      this.element=el;
      return this;
    }
    setClass(className){
      this.className=className;
      if(this.element)this.element.setAttribute("class",`geolib-line ${className}`.trim());
    }
  }

  class SetSquare{
    constructor({
      x=650,y=220,angle=0,width=180,height=130,
      allowMove=true,allowRotate=true
    }={}){
      this.x=x;this.y=y;this.angle=angle;
      this.width=width;this.height=height;
      this.allowMove=allowMove;this.allowRotate=allowRotate;
      this.scene=null;this.group=null;this.hit=null;this.handle=null;
      this.edgeElements={};
      this.edgeHits={};
      this._interaction=null;
      this._edgeSelection=null;
    }

    edgeAngles(){
      return {
        horizontal:Utils.normalizeAngle(this.angle),
        vertical:Utils.normalizeAngle(this.angle+90)
      };
    }

    edgeLine(edge="vertical"){
      if(!["horizontal","vertical"].includes(edge)){
        throw new Error("GeoLib.SetSquare.edgeLine : bord inconnu.");
      }
      const angle=edge==="horizontal"?this.angle:this.angle+90;
      return new Line({x:this.x,y:this.y},angle);
    }

    setPosition(x,y){this.x=x;this.y=y;this.updateTransform()}
    setAngle(angle){this.angle=Utils.normalizeAngle(angle);this.updateTransform()}
    rotate(delta){this.setAngle(this.angle+delta)}

    snapToLine(line,{edge="horizontal",point=null}={}){
      if(point)this.setPosition(point.x,point.y);
      this.setAngle(edge==="horizontal"?line.angle:line.angle-90);
    }

    updateTransform(){
      if(this.group)this.group.setAttribute("transform",`translate(${this.x} ${this.y}) rotate(${this.angle})`);
    }

    render(scene){
      this.scene=scene;

      const g=Utils.createSvg("g",{class:"geolib-set-square"});
      const shape=Utils.createSvg("polygon",{
        points:`0,0 ${this.width},0 0,${this.height}`,
        class:"geolib-set-square-shape"
      });

      const hitH=Utils.createSvg("line",{
        x1:0,y1:0,x2:this.width,y2:0,
        class:"geolib-edge-hit",
        "data-edge":"horizontal"
      });
      const edgeH=Utils.createSvg("line",{
        x1:0,y1:0,x2:this.width,y2:0,
        class:"geolib-set-square-edge"
      });

      const hitV=Utils.createSvg("line",{
        x1:0,y1:0,x2:0,y2:this.height,
        class:"geolib-edge-hit",
        "data-edge":"vertical"
      });
      const edgeV=Utils.createSvg("line",{
        x1:0,y1:0,x2:0,y2:this.height,
        class:"geolib-set-square-edge"
      });

      const mark=Utils.createSvg("path",{
        d:"M18 0 L18 18 L0 18",
        class:"geolib-set-square-right-angle"
      });

      const bodyHit=Utils.createSvg("polygon",{
        points:`0,0 ${this.width},0 0,${this.height}`,
        class:"geolib-set-square-hit"
      });

      const handleX=this.width*.58;
      const arm=Utils.createSvg("line",{
        x1:handleX,y1:-18,x2:handleX,y2:-48,class:"geolib-rotate-arm"
      });
      const handle=Utils.createSvg("circle",{
        cx:handleX,cy:-58,r:11,class:"geolib-rotate-handle"
      });

      /* Les zones de clic sont placées avant les traits visibles.
         Pendant la sélection, le hit principal est désactivé. */
      g.append(shape,hitH,edgeH,hitV,edgeV,mark,bodyHit,arm,handle);
      scene.layers.tools.appendChild(g);

      this.group=g;
      this.hit=bodyHit;
      this.handle=handle;
      this.edgeElements={horizontal:edgeH,vertical:edgeV};
      this.edgeHits={horizontal:hitH,vertical:hitV};

      this.updateTransform();
      this._bindInteractions();
      this._bindEdgeSelection();
      return this;
    }

    _bindInteractions(){
      const toScene=e=>Utils.pointerToScene(e,this.scene.svg,this.scene.width,this.scene.height);

      const end=()=>{
        if(this.hit)this.hit.classList.remove("dragging");
        if(this.handle)this.handle.classList.remove("dragging");
        this._interaction=null;
      };

      this.hit.addEventListener("pointerdown",e=>{
        if(!this.allowMove||this._edgeSelection)return;
        e.preventDefault();
        const p=toScene(e);
        this._interaction={
          type:"move",
          offsetX:p.x-this.x,
          offsetY:p.y-this.y
        };
        this.hit.classList.add("dragging");
        this.hit.setPointerCapture(e.pointerId);
      });

      this.hit.addEventListener("pointermove",e=>{
        if(!this._interaction||this._interaction.type!=="move")return;
        const p=toScene(e);
        this.setPosition(
          Math.max(0,Math.min(this.scene.width,p.x-this._interaction.offsetX)),
          Math.max(0,Math.min(this.scene.height,p.y-this._interaction.offsetY))
        );
      });

      this.hit.addEventListener("pointerup",end);
      this.hit.addEventListener("pointercancel",end);

      this.handle.addEventListener("pointerdown",e=>{
        if(!this.allowRotate||this._edgeSelection)return;
        e.preventDefault();
        e.stopPropagation();
        const p=toScene(e);
        this._interaction={
          type:"rotate",
          startPointerAngle:Utils.radToDeg(Math.atan2(p.y-this.y,p.x-this.x)),
          startToolAngle:this.angle
        };
        this.handle.classList.add("dragging");
        this.handle.setPointerCapture(e.pointerId);
      });

      this.handle.addEventListener("pointermove",e=>{
        if(!this._interaction||this._interaction.type!=="rotate")return;
        const p=toScene(e);
        const current=Utils.radToDeg(Math.atan2(p.y-this.y,p.x-this.x));
        this.setAngle(this._interaction.startToolAngle+current-this._interaction.startPointerAngle);
      });

      this.handle.addEventListener("pointerup",end);
      this.handle.addEventListener("pointercancel",end);
    }

    _bindEdgeSelection(){
      for(const edge of ["horizontal","vertical"]){
        const hit=this.edgeHits[edge];
        const visible=this.edgeElements[edge];

        hit.addEventListener("pointerenter",()=>{
          if(this._edgeSelection)visible.classList.add("edge-hover");
        });

        hit.addEventListener("pointerleave",()=>{
          visible.classList.remove("edge-hover");
        });

        hit.addEventListener("pointerdown",e=>{
          if(!this._edgeSelection)return;
          e.preventDefault();
          e.stopPropagation();
          this._finishEdgeSelection(edge);
        });
      }
    }

    _clearEdgeVisuals(){
      this.group.classList.remove("selecting-edge");
      for(const edge of ["horizontal","vertical"]){
        this.edgeElements[edge].classList.remove("edge-hover","edge-selected");
      }
      this.hit.style.pointerEvents="";
      this.handle.style.pointerEvents="";
    }

    _finishEdgeSelection(edge){
      if(!this._edgeSelection)return;

      const selection=this._edgeSelection;
      this._edgeSelection=null;

      this.edgeElements[edge].classList.remove("edge-hover");
      this.edgeElements[edge].classList.add("edge-selected");
      this.group.classList.remove("selecting-edge");

      /* Petit délai visuel pour que l'élève voie son choix. */
      window.setTimeout(()=>{
        this.edgeElements[edge].classList.remove("edge-selected");
        this.hit.style.pointerEvents="";
        this.handle.style.pointerEvents="";
        selection.resolve({
          edge,
          line:this.edgeLine(edge)
        });
      },120);
    }

    cancelEdgeSelection(){
      if(!this._edgeSelection)return;
      const selection=this._edgeSelection;
      this._edgeSelection=null;
      this._clearEdgeVisuals();
      selection.reject(new Error("Sélection du bord annulée."));
    }

    selectEdge(){
      if(this._edgeSelection){
        return Promise.reject(new Error("Une sélection de bord est déjà en cours."));
      }

      return new Promise((resolve,reject)=>{
        this._interaction=null;
        this._edgeSelection={resolve,reject};
        this.group.classList.add("selecting-edge");

        /* La surface centrale et la poignée ne doivent plus intercepter le clic. */
        this.hit.style.pointerEvents="none";
        this.handle.style.pointerEvents="none";
      });
    }

    async trace({
      scene=this.scene,
      className="",
      draw=true
    }={}){
      const choice=await this.selectEdge();
      if(draw&&scene)scene.drawLine(choice.line,{className});
      return choice;
    }
  }

  class Scene{
    constructor(container,{width=900,height=330,keyboard=true}={}){
      if(typeof container==="string")container=document.querySelector(container);
      if(!container)throw new Error("GeoLib.Scene : conteneur introuvable.");

      this.container=container;
      this.width=width;
      this.height=height;

      container.classList.add("geolib-scene");
      container.innerHTML="";

      this.svg=Utils.createSvg("svg",{
        viewBox:`0 0 ${width} ${height}`,
        preserveAspectRatio:"xMidYMid meet"
      });
      container.appendChild(this.svg);

      this.layers={
        lines:Utils.createSvg("g"),
        points:Utils.createSvg("g"),
        drawings:Utils.createSvg("g"),
        tools:Utils.createSvg("g")
      };

      this.svg.append(
        this.layers.lines,
        this.layers.points,
        this.layers.drawings,
        this.layers.tools
      );

      this.objects=[];
      this.activeSetSquare=null;

      if(keyboard){
        this._keyHandler=e=>{
          if(!this.activeSetSquare||this.activeSetSquare._edgeSelection)return;
          if(e.key==="ArrowLeft"){
            e.preventDefault();
            this.activeSetSquare.rotate(-1);
          }
          if(e.key==="ArrowRight"){
            e.preventDefault();
            this.activeSetSquare.rotate(1);
          }
        };
        document.addEventListener("keydown",this._keyHandler);
      }
    }

    add(object){
      object.render(this);
      this.objects.push(object);
      if(object instanceof SetSquare)this.activeSetSquare=object;
      return object;
    }

    clearLayer(name){
      if(this.layers[name])this.layers[name].innerHTML="";
    }

    drawLine(line,{className=""}={}){
      const copy=new Line(line.point,line.angle,{className});
      const p1=copy.pointAt(-2000),p2=copy.pointAt(2000);
      const el=Utils.createSvg("line",{
        x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,
        class:`geolib-line ${className}`.trim()
      });
      this.layers.drawings.appendChild(el);
      copy.element=el;
      return copy;
    }

    checkLineThroughPoint(line,point,tolerancePx=8){
      return line.distanceToPoint(point)<=tolerancePx;
    }

    checkPerpendicular(lineA,lineB,toleranceDeg=2){
      return lineA.isPerpendicularTo(lineB,toleranceDeg);
    }

    destroy(){
      if(this._keyHandler)document.removeEventListener("keydown",this._keyHandler);
      for(const object of this.objects){
        if(object instanceof SetSquare&&object._edgeSelection){
          object.cancelEdgeSelection();
        }
      }
      this.container.innerHTML="";
    }
  }

  global.GeoLib={
    Scene,
    Point,
    Line,
    SetSquare,
    Utils,
    version:"1.1.0"
  };
})(window);