(function(global){
  "use strict";

  const SVG_NS="http://www.w3.org/2000/svg";

  const Utils={
    degToRad(deg){return deg*Math.PI/180},
    radToDeg(rad){return rad*180/Math.PI},
    normalizeAngle(deg){let a=deg%360;if(a<0)a+=360;return a},
    angleDifference(a,b){let d=Math.abs(Utils.normalizeAngle(a)-Utils.normalizeAngle(b))%180;return Math.min(d,180-d)},
    distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)},
    distancePointToLine(point,line){const {a,b,c}=line.standardForm();return Math.abs(a*point.x+b*point.y+c)/Math.hypot(a,b)},
    signedDistancePointToLine(point,line){const {a,b,c}=line.standardForm();return (a*point.x+b*point.y+c)/Math.hypot(a,b)},
    projectPointToLine(point,line){const d=line.direction(),v={x:point.x-line.point.x,y:point.y-line.point.y},t=v.x*d.x+v.y*d.y;return line.pointAt(t)},
    createSvg(tag,attrs={}){const el=document.createElementNS(SVG_NS,tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));return el},
    pointerToScene(event,svg,width,height){const r=svg.getBoundingClientRect();return{x:(event.clientX-r.left)*width/r.width,y:(event.clientY-r.top)*height/r.height}}
  };

  class Point{
    constructor(x,y,{name="",size=8,labelOffset={x:11,y:-11}}={}){this.x=x;this.y=y;this.name=name;this.size=size;this.labelOffset=labelOffset;this.group=null}
    render(scene){
      const g=Utils.createSvg("g"),s=this.size;
      g.append(Utils.createSvg("line",{x1:this.x-s,y1:this.y-s,x2:this.x+s,y2:this.y+s,class:"geolib-point-cross"}),Utils.createSvg("line",{x1:this.x-s,y1:this.y+s,x2:this.x+s,y2:this.y-s,class:"geolib-point-cross"}));
      if(this.name){const t=Utils.createSvg("text",{x:this.x+this.labelOffset.x,y:this.y+this.labelOffset.y,class:"geolib-point-label"});t.textContent=this.name;g.appendChild(t)}
      scene.layers.points.appendChild(g);this.group=g;return this
    }
  }

  class Line{
    constructor(point,angle,{name="",className=""}={}){this.point={x:point.x,y:point.y};this.angle=Utils.normalizeAngle(angle);this.name=name;this.className=className;this.element=null}
    direction(){const r=Utils.degToRad(this.angle);return{x:Math.cos(r),y:Math.sin(r)}}
    normal(){const d=this.direction();return{x:-d.y,y:d.x}}
    standardForm(){const d=this.direction(),a=-d.y,b=d.x,c=-(a*this.point.x+b*this.point.y);return{a,b,c}}
    pointAt(t){const d=this.direction();return{x:this.point.x+d.x*t,y:this.point.y+d.y*t}}
    intersection(other){const l1=this.standardForm(),l2=other.standardForm(),det=l1.a*l2.b-l2.a*l1.b;if(Math.abs(det)<1e-9)return null;return{x:(l1.b*l2.c-l2.b*l1.c)/det,y:(l1.c*l2.a-l2.c*l1.a)/det}}
    isParallelTo(other,toleranceDeg=1){return Utils.angleDifference(this.angle,other.angle)<=toleranceDeg}
    isPerpendicularTo(other,toleranceDeg=1){return Math.abs(Utils.angleDifference(this.angle,other.angle)-90)<=toleranceDeg}
    distanceToPoint(point){return Utils.distancePointToLine(point,this)}
    render(scene){
      const p1=this.pointAt(-2000),p2=this.pointAt(2000),el=Utils.createSvg("line",{x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,class:`geolib-line ${this.className}`.trim()});scene.layers.lines.appendChild(el);this.element=el;
      if(this.name){let p=this.pointAt(145);if(p.x<35||p.x>scene.width-70||p.y<35||p.y>scene.height-25)p=this.pointAt(-145);const t=Utils.createSvg("text",{x:Math.max(28,Math.min(scene.width-65,p.x+8)),y:Math.max(28,Math.min(scene.height-18,p.y-10)),class:"geolib-line-label"});t.textContent=this.name;scene.layers.points.appendChild(t)}
      return this
    }
    setClass(className){this.className=className;if(this.element)this.element.setAttribute("class",`geolib-line ${className}`.trim())}
  }

  class Straightedge{
    constructor({x=630,y=245,angle=-12,length=290,thickness=42,allowMove=true,allowRotate=true}={}){
      this.x=x;this.y=y;this.angle=Utils.normalizeAngle(angle);this.length=length;this.thickness=thickness;this.allowMove=allowMove;this.allowRotate=allowRotate;this.locked=false;this.scene=null;this.group=null;this.hit=null;this.handle=null;this._interaction=null
    }
    guideLine(){return new Line({x:this.x,y:this.y},this.angle)}
    setPosition(x,y){this.x=x;this.y=y;this.updateTransform()}
    setAngle(angle){this.angle=Utils.normalizeAngle(angle);this.updateTransform()}
    setLocked(locked=true){this.locked=locked;if(this.group)this.group.classList.toggle("locked",locked);return this}
    updateTransform(){if(this.group)this.group.setAttribute("transform",`translate(${this.x} ${this.y}) rotate(${this.angle})`)}
    render(scene){
      this.scene=scene;const half=this.length/2,g=Utils.createSvg("g",{class:"geolib-straightedge"}),body=Utils.createSvg("rect",{x:-half,y:-this.thickness/2,width:this.length,height:this.thickness,rx:8,class:"geolib-straightedge-shape"}),edge1=Utils.createSvg("line",{x1:-half,y1:-this.thickness/2,x2:half,y2:-this.thickness/2,class:"geolib-straightedge-edge"}),edge2=Utils.createSvg("line",{x1:-half,y1:this.thickness/2,x2:half,y2:this.thickness/2,class:"geolib-straightedge-edge"}),hit=Utils.createSvg("rect",{x:-half,y:-this.thickness/2,width:this.length,height:this.thickness,rx:8,class:"geolib-straightedge-hit"}),arm=Utils.createSvg("line",{x1:0,y1:-this.thickness/2-3,x2:0,y2:-this.thickness/2-38,class:"geolib-tool-rotate-arm"}),handle=Utils.createSvg("circle",{cx:0,cy:-this.thickness/2-48,r:11,class:"geolib-tool-rotate-handle"});
      for(let x=-half+24;x<half-12;x+=24)g.appendChild(Utils.createSvg("line",{x1:x,y1:-this.thickness/2,x2:x,y2:-this.thickness/2+9,class:"geolib-ruler-tick"}));
      g.append(body,edge1,edge2,hit,arm,handle);scene.layers.tools.appendChild(g);this.group=g;this.hit=hit;this.handle=handle;this.updateTransform();this._bind();return this
    }
    _bind(){
      const toScene=e=>Utils.pointerToScene(e,this.scene.svg,this.scene.width,this.scene.height),end=()=>{this._interaction=null;this.group.classList.remove("dragging")};
      this.hit.addEventListener("pointerdown",e=>{if(this.locked||!this.allowMove)return;e.preventDefault();const p=toScene(e);this._interaction={type:"move",dx:p.x-this.x,dy:p.y-this.y};this.group.classList.add("dragging");this.hit.setPointerCapture(e.pointerId)});
      this.hit.addEventListener("pointermove",e=>{if(!this._interaction||this._interaction.type!=="move")return;const p=toScene(e);this.setPosition(Math.max(45,Math.min(this.scene.width-45,p.x-this._interaction.dx)),Math.max(45,Math.min(this.scene.height-45,p.y-this._interaction.dy)))});
      this.hit.addEventListener("pointerup",end);this.hit.addEventListener("pointercancel",end);
      this.handle.addEventListener("pointerdown",e=>{if(this.locked||!this.allowRotate)return;e.preventDefault();e.stopPropagation();const p=toScene(e);this._interaction={type:"rotate",start:Utils.radToDeg(Math.atan2(p.y-this.y,p.x-this.x)),angle:this.angle};this.handle.setPointerCapture(e.pointerId)});
      this.handle.addEventListener("pointermove",e=>{if(!this._interaction||this._interaction.type!=="rotate")return;const p=toScene(e),a=Utils.radToDeg(Math.atan2(p.y-this.y,p.x-this.x));this.setAngle(this._interaction.angle+a-this._interaction.start)});
      this.handle.addEventListener("pointerup",end);this.handle.addEventListener("pointercancel",end)
    }
  }

  class SetSquare{
    constructor({x=650,y=210,angle=0,width=180,height=130,allowMove=true,allowRotate=true}={}){
      this.x=x;this.y=y;this.angle=Utils.normalizeAngle(angle);this.width=width;this.height=height;this.allowMove=allowMove;this.allowRotate=allowRotate;this.scene=null;this.group=null;this.hit=null;this.handle=null;this.edgeElements={};this.edgeHits={};this._interaction=null;this._edgeSelection=null;this._rulerConstraint=null
    }
    edgeAngles(){return{horizontal:Utils.normalizeAngle(this.angle),vertical:Utils.normalizeAngle(this.angle+90)}}
    edgeLine(edge="vertical"){if(!["horizontal","vertical"].includes(edge))throw new Error("GeoLib.SetSquare.edgeLine : bord inconnu.");return new Line({x:this.x,y:this.y},edge==="horizontal"?this.angle:this.angle+90)}
    setPosition(x,y){this.x=x;this.y=y;this.updateTransform()}
    setAngle(angle){this.angle=Utils.normalizeAngle(angle);this.updateTransform()}
    rotate(delta){if(!this._rulerConstraint)this.setAngle(this.angle+delta)}
    snapToLine(line,{edge="horizontal",point=null}={}){if(point)this.setPosition(point.x,point.y);this.setAngle(edge==="horizontal"?line.angle:line.angle-90)}
    updateTransform(){if(this.group)this.group.setAttribute("transform",`translate(${this.x} ${this.y}) rotate(${this.angle})`)}
    attachToRuler(ruler,{angleTolerance=7,distanceTolerance=42}={}){
      if(!(ruler instanceof Straightedge))throw new Error("GeoLib.SetSquare.attachToRuler : règle invalide.");
      const angles=this.edgeAngles(),candidates=["horizontal","vertical"].map(edge=>({edge,diff:Utils.angleDifference(angles[edge],ruler.angle)})).sort((a,b)=>a.diff-b.diff),best=candidates[0],guide=ruler.guideLine(),signed=Utils.signedDistancePointToLine({x:this.x,y:this.y},guide);
      if(best.diff>angleTolerance||Math.abs(signed)>distanceTolerance)return{success:false,aligned:best.diff<=angleTolerance,close:Math.abs(signed)<=distanceTolerance,angleDifference:best.diff,distance:Math.abs(signed)};
      const side=signed>=0?1:-1,offset=side*(ruler.thickness/2+2),projection=Utils.projectPointToLine({x:this.x,y:this.y},guide),normal=guide.normal();
      this.setAngle(best.edge==="horizontal"?ruler.angle:ruler.angle-90);this.setPosition(projection.x+normal.x*offset,projection.y+normal.y*offset);this._rulerConstraint={ruler,edge:best.edge,offset};ruler.setLocked(true);if(this.group)this.group.classList.add("sliding");return{success:true,edge:best.edge}
    }
    releaseRuler(){if(this._rulerConstraint)this._rulerConstraint.ruler.setLocked(false);this._rulerConstraint=null;if(this.group)this.group.classList.remove("sliding")}
    render(scene){
      this.scene=scene;const g=Utils.createSvg("g",{class:"geolib-set-square"}),shape=Utils.createSvg("polygon",{points:`0,0 ${this.width},0 0,${this.height}`,class:"geolib-set-square-shape"}),hitH=Utils.createSvg("line",{x1:0,y1:0,x2:this.width,y2:0,class:"geolib-edge-hit","data-edge":"horizontal"}),edgeH=Utils.createSvg("line",{x1:0,y1:0,x2:this.width,y2:0,class:"geolib-set-square-edge"}),hitV=Utils.createSvg("line",{x1:0,y1:0,x2:0,y2:this.height,class:"geolib-edge-hit","data-edge":"vertical"}),edgeV=Utils.createSvg("line",{x1:0,y1:0,x2:0,y2:this.height,class:"geolib-set-square-edge"}),mark=Utils.createSvg("path",{d:"M18 0 L18 18 L0 18",class:"geolib-set-square-right-angle"}),bodyHit=Utils.createSvg("polygon",{points:`0,0 ${this.width},0 0,${this.height}`,class:"geolib-set-square-hit"}),handleX=this.width*.58,arm=Utils.createSvg("line",{x1:handleX,y1:-18,x2:handleX,y2:-48,class:"geolib-tool-rotate-arm"}),handle=Utils.createSvg("circle",{cx:handleX,cy:-58,r:11,class:"geolib-tool-rotate-handle"});
      g.append(shape,hitH,edgeH,hitV,edgeV,mark,bodyHit,arm,handle);scene.layers.tools.appendChild(g);this.group=g;this.hit=bodyHit;this.handle=handle;this.edgeElements={horizontal:edgeH,vertical:edgeV};this.edgeHits={horizontal:hitH,vertical:hitV};this.updateTransform();this._bindInteractions();this._bindEdgeSelection();return this
    }
    _bindInteractions(){
      const toScene=e=>Utils.pointerToScene(e,this.scene.svg,this.scene.width,this.scene.height),end=()=>{this._interaction=null;if(this.group)this.group.classList.remove("dragging")};
      this.hit.addEventListener("pointerdown",e=>{if(!this.allowMove||this._edgeSelection)return;e.preventDefault();const p=toScene(e);this._interaction={type:"move",dx:p.x-this.x,dy:p.y-this.y};this.group.classList.add("dragging");this.hit.setPointerCapture(e.pointerId)});
      this.hit.addEventListener("pointermove",e=>{if(!this._interaction||this._interaction.type!=="move")return;const p=toScene(e),wanted={x:p.x-this._interaction.dx,y:p.y-this._interaction.dy};if(this._rulerConstraint){const guide=this._rulerConstraint.ruler.guideLine(),projection=Utils.projectPointToLine(wanted,guide),n=guide.normal(),o=this._rulerConstraint.offset;this.setPosition(Math.max(15,Math.min(this.scene.width-15,projection.x+n.x*o)),Math.max(15,Math.min(this.scene.height-15,projection.y+n.y*o)))}else this.setPosition(Math.max(15,Math.min(this.scene.width-15,wanted.x)),Math.max(15,Math.min(this.scene.height-15,wanted.y)))});
      this.hit.addEventListener("pointerup",end);this.hit.addEventListener("pointercancel",end);
      this.handle.addEventListener("pointerdown",e=>{if(!this.allowRotate||this._edgeSelection||this._rulerConstraint)return;e.preventDefault();e.stopPropagation();const p=toScene(e);this._interaction={type:"rotate",start:Utils.radToDeg(Math.atan2(p.y-this.y,p.x-this.x)),angle:this.angle};this.handle.setPointerCapture(e.pointerId)});
      this.handle.addEventListener("pointermove",e=>{if(!this._interaction||this._interaction.type!=="rotate")return;const p=toScene(e),a=Utils.radToDeg(Math.atan2(p.y-this.y,p.x-this.x));this.setAngle(this._interaction.angle+a-this._interaction.start)});this.handle.addEventListener("pointerup",end);this.handle.addEventListener("pointercancel",end)
    }
    _bindEdgeSelection(){for(const edge of ["horizontal","vertical"]){const hit=this.edgeHits[edge],visible=this.edgeElements[edge];hit.addEventListener("pointerenter",()=>{if(this._edgeSelection)visible.classList.add("edge-hover")});hit.addEventListener("pointerleave",()=>visible.classList.remove("edge-hover"));hit.addEventListener("pointerdown",e=>{if(!this._edgeSelection)return;e.preventDefault();e.stopPropagation();this._finishEdgeSelection(edge)})}}
    _finishEdgeSelection(edge){if(!this._edgeSelection)return;const selection=this._edgeSelection;this._edgeSelection=null;this.edgeElements[edge].classList.add("edge-selected");this.group.classList.remove("selecting-edge");global.setTimeout(()=>{this.edgeElements[edge].classList.remove("edge-selected");this.hit.style.pointerEvents="";this.handle.style.pointerEvents="";selection.resolve({edge,line:this.edgeLine(edge)})},120)}
    cancelEdgeSelection(){if(!this._edgeSelection)return;const s=this._edgeSelection;this._edgeSelection=null;this.group.classList.remove("selecting-edge");this.hit.style.pointerEvents="";this.handle.style.pointerEvents="";s.reject(new Error("Sélection du bord annulée."))}
    selectEdge(){if(this._edgeSelection)return Promise.reject(new Error("Une sélection de bord est déjà en cours."));return new Promise((resolve,reject)=>{this._interaction=null;this._edgeSelection={resolve,reject};this.group.classList.add("selecting-edge");this.hit.style.pointerEvents="none";this.handle.style.pointerEvents="none"})}
    async trace({scene=this.scene,className="",draw=true}={}){const choice=await this.selectEdge();if(draw&&scene)choice.drawnLine=scene.drawLine(choice.line,{className});return choice}
  }

  class Scene{
    constructor(container,{width=900,height=350,keyboard=true}={}){if(typeof container==="string")container=document.querySelector(container);if(!container)throw new Error("GeoLib.Scene : conteneur introuvable.");this.container=container;this.width=width;this.height=height;container.classList.add("geolib-scene");container.innerHTML="";this.svg=Utils.createSvg("svg",{viewBox:`0 0 ${width} ${height}`,preserveAspectRatio:"xMidYMid meet"});container.appendChild(this.svg);this.layers={lines:Utils.createSvg("g"),points:Utils.createSvg("g"),drawings:Utils.createSvg("g"),tools:Utils.createSvg("g")};this.svg.append(this.layers.lines,this.layers.points,this.layers.drawings,this.layers.tools);this.objects=[];this.activeSetSquare=null;if(keyboard){this._keyHandler=e=>{if(!this.activeSetSquare||this.activeSetSquare._edgeSelection||this.activeSetSquare._rulerConstraint)return;if(e.key==="ArrowLeft"){e.preventDefault();this.activeSetSquare.rotate(-1)}if(e.key==="ArrowRight"){e.preventDefault();this.activeSetSquare.rotate(1)}};document.addEventListener("keydown",this._keyHandler)}}
    add(object){object.render(this);this.objects.push(object);if(object instanceof SetSquare)this.activeSetSquare=object;return object}
    clearLayer(name){if(this.layers[name])this.layers[name].innerHTML=""}
    drawLine(line,{className=""}={}){const copy=new Line(line.point,line.angle,{className}),p1=copy.pointAt(-2000),p2=copy.pointAt(2000),el=Utils.createSvg("line",{x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,class:`geolib-line ${className}`.trim()});this.layers.drawings.appendChild(el);copy.element=el;return copy}
    checkLineThroughPoint(line,point,tolerancePx=8){return line.distanceToPoint(point)<=tolerancePx}
    checkPerpendicular(a,b,toleranceDeg=2){return a.isPerpendicularTo(b,toleranceDeg)}
    checkParallel(a,b,toleranceDeg=2){return a.isParallelTo(b,toleranceDeg)}
    destroy(){if(this._keyHandler)document.removeEventListener("keydown",this._keyHandler);for(const o of this.objects){if(o instanceof SetSquare){if(o._edgeSelection)o.cancelEdgeSelection();o.releaseRuler()}}this.container.innerHTML=""}
  }

  const Random={
    number(min,max){return Math.random()*(max-min)+min},integer(min,max){return Math.floor(Math.random()*(max-min+1))+min},shuffle(array){const a=[...array];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a},
    line({width=900,height=350,margin=80,minAngle=10,maxAngle=170}={}){return new Line({x:Random.number(margin,width-margin),y:Random.number(margin,height-margin)},Random.number(minAngle,maxAngle))},
    reachableAreaForTool(tool,{width=900,height=350,extraMargin=18}={}){if(tool instanceof SetSquare||tool==="setSquare"){const tw=tool instanceof SetSquare?tool.width:180,th=tool instanceof SetSquare?tool.height:130,r=Math.hypot(tw,th),h=Math.min(width/2-10,Math.max(tw*.72,r*.52)+extraMargin),v=Math.min(height/2-10,Math.max(th*.72,r*.42)+extraMargin);return{xMin:h,xMax:width-h,yMin:v,yMax:height-v}}return{xMin:55,xMax:width-55,yMin:55,yMax:height-55}},
    pointForTool(tool,{width=900,height=350,extraMargin=18,existingPoints=[],minDistance=70,attempts=500}={}){const a=Random.reachableAreaForTool(tool,{width,height,extraMargin});for(let i=0;i<attempts;i++){const p={x:Random.number(a.xMin,a.xMax),y:Random.number(a.yMin,a.yMax)};if(existingPoints.every(o=>Utils.distance(p,o)>=minDistance))return p}return{x:(a.xMin+a.xMax)/2,y:(a.yMin+a.yMax)/2}},
    points(count,{tool=null,width=900,height=350,extraMargin=18,minDistance=70,names=[],attempts=500}={}){const result=[];for(let i=0;i<count;i++){const p=Random.pointForTool(tool,{width,height,extraMargin,existingPoints:result,minDistance,attempts});result.push({x:p.x,y:p.y,name:names[i]||""})}return result},
    pointOnLine(line,{tool=null,width=900,height=350,extraMargin=18,existingPoints=[],minDistance=70,attempts=500}={}){const a=tool?Random.reachableAreaForTool(tool,{width,height,extraMargin}):{xMin:50,xMax:width-50,yMin:50,yMax:height-50};for(let i=0;i<attempts;i++){const p=line.pointAt(Random.number(-350,350));if(p.x>=a.xMin&&p.x<=a.xMax&&p.y>=a.yMin&&p.y<=a.yMax&&existingPoints.every(o=>Utils.distance(p,o)>=minDistance))return p}return{x:line.point.x,y:line.point.y}},
    pointAwayFromLine(line,{tool=null,width=900,height=350,extraMargin=18,existingPoints=[],minDistance=70,minLineDistance=55,attempts=500}={}){for(let i=0;i<attempts;i++){const p=Random.pointForTool(tool,{width,height,extraMargin,existingPoints,minDistance,attempts});if(line.distanceToPoint(p)>=minLineDistance)return p}return Random.pointForTool(tool,{width,height,extraMargin,existingPoints,minDistance,attempts})}
  };

  const Check={
    perpendicularConstruction({baseLine,point,drawnLine,pointTolerance=8,angleTolerance=2}={}){if(!baseLine||!point||!drawnLine)throw new Error("GeoLib.Check.perpendicularConstruction : paramètres incomplets.");const passPoint=drawnLine.distanceToPoint(point)<=pointTolerance,perpendicular=drawnLine.isPerpendicularTo(baseLine,angleTolerance);return{success:passPoint&&perpendicular,passPoint,perpendicular,pointDistance:drawnLine.distanceToPoint(point),angleDifference:Math.abs(Utils.angleDifference(drawnLine.angle,baseLine.angle)-90)}},
    parallelConstruction({baseLine,point,drawnLine,otherPoints=[],pointTolerance=9,angleTolerance=2}={}){if(!baseLine||!point||!drawnLine)throw new Error("GeoLib.Check.parallelConstruction : paramètres incomplets.");const passPoint=drawnLine.distanceToPoint(point)<=pointTolerance,parallel=drawnLine.isParallelTo(baseLine,angleTolerance);let wrongPoint=null,best=Infinity;for(const p of otherPoints){const d=drawnLine.distanceToPoint(p);if(d<=pointTolerance&&d<best){best=d;wrongPoint=p}}return{success:passPoint&&parallel,passPoint,parallel,wrongPoint,pointDistance:drawnLine.distanceToPoint(point),angleDifference:Utils.angleDifference(drawnLine.angle,baseLine.angle)}}
  };

  global.GeoLib={Scene,Point,Line,SetSquare,Straightedge,Utils,Random,Check,version:"1.3.0"};
})(window);
