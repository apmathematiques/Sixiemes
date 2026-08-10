(function(global){
  "use strict";

  if(!global.GeoLib) throw new Error("GeoLib.Protractor nécessite GeoLib 1.3.");

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
  const norm=a=>{
    let r=a%360;
    if(r<0)r+=360;
    return r;
  };

  const rayDiff=(a,b)=>{
    let d=Math.abs(norm(a)-norm(b));
    if(d>180)d=360-d;
    return d;
  };

  const lineDiff=(a,b)=>{
    const d=rayDiff(a,b);
    return Math.min(d,Math.abs(180-d));
  };

  class Protractor{
    constructor({
      x=450,
      y=300,
      angle=0,
      radius=185,

      allowMove=true,
      allowRotate=true,
      locked=false,

      showTicks=true,
      showNumbers=true,
      showInnerScale=true,
      showOuterScale=true,
      showCenter=true,
      showBaseline=true,

      tickStep=1,
      numberStep=10,

      snapCenter=false,
      snapBaseline=false,
      centerSnapTolerance=18,
      angleSnapTolerance=4,

      centerTargets=[],
      angleTargets=[],

      highlight=[],

      keepCenterInScene=true,

      onChange=null,
      onInteractionEnd=null
    }={}){

      this.x=x;
      this.y=y;
      this.angle=norm(angle);
      this.radius=clamp(radius,120,260);

      this.allowMove=allowMove;
      this.allowRotate=allowRotate;
      this.locked=locked;

      this.showTicks=showTicks;
      this.showNumbers=showNumbers;
      this.showInnerScale=showInnerScale;
      this.showOuterScale=showOuterScale;
      this.showCenter=showCenter;
      this.showBaseline=showBaseline;

      this.tickStep=Math.max(1,Math.round(tickStep));
      this.numberStep=Math.max(5,Math.round(numberStep));

      this.snapCenter=snapCenter;
      this.snapBaseline=snapBaseline;
      this.centerSnapTolerance=centerSnapTolerance;
      this.angleSnapTolerance=angleSnapTolerance;

      this.centerTargets=centerTargets.filter(Boolean).map(p=>({x:p.x,y:p.y}));
      this.angleTargets=angleTargets.filter(Number.isFinite).map(norm);

      this.highlight=Array.isArray(highlight)?highlight.slice():[];

      this.keepCenterInScene=keepCenterInScene;

      this.onChange=typeof onChange==="function"?onChange:null;
      this.onInteractionEnd=typeof onInteractionEnd==="function"?onInteractionEnd:null;

      this.initialState={
        x:this.x,
        y:this.y,
        angle:this.angle,
        radius:this.radius
      };

      this.scene=null;
      this.group=null;
      this.drag=null;
      this._move=null;
      this._up=null;
    }

    render(scene){
      if(!scene || !scene.layers || !scene.layers.tools){
        throw new Error("GeoLib.Protractor.render : scène invalide.");
      }

      this.scene=scene;
      this.group=svg("g",{
        class:"geolib-protractor",
        "aria-label":"Rapporteur"
      });

      scene.layers.tools.appendChild(this.group);
      this._draw();
      return this;
    }

    destroy(){
      this._unbind();
      if(this.group)this.group.remove();
      this.group=null;
      this.scene=null;
      return this;
    }

    state(){
      return {
        x:this.x,
        y:this.y,
        angle:this.angle,
        radius:this.radius,
        snapCenter:this.snapCenter,
        snapBaseline:this.snapBaseline
      };
    }

    center(){
      return {x:this.x,y:this.y};
    }

    baselineAngles(){
      return {
        right:norm(this.angle),
        left:norm(this.angle+180)
      };
    }

    setPosition(x,y){
      this.x=x;
      this.y=y;
      this._applyTransform();
      this._emitChange("setPosition");
      return this;
    }

    setAngle(angle){
      this.angle=norm(angle);
      this._applyTransform();
      this._emitChange("setAngle");
      return this;
    }

    setRadius(radius){
      this.radius=clamp(radius,120,260);
      this._draw();
      this._emitChange("setRadius");
      return this;
    }

    setLocked(locked=true){
      this.locked=!!locked;
      if(this.group)this.group.classList.toggle("locked",this.locked);
      return this;
    }

    setCenterTargets(points=[]){
      this.centerTargets=points.filter(Boolean).map(p=>({x:p.x,y:p.y}));
      return this;
    }

    setAngleTargets(angles=[]){
      this.angleTargets=angles.filter(Number.isFinite).map(norm);
      return this;
    }

    setSnap({center=this.snapCenter,baseline=this.snapBaseline}={}){
      this.snapCenter=!!center;
      this.snapBaseline=!!baseline;
      return this;
    }

    setDisplay({
      ticks=this.showTicks,
      numbers=this.showNumbers,
      innerScale=this.showInnerScale,
      outerScale=this.showOuterScale,
      center=this.showCenter,
      baseline=this.showBaseline
    }={}){
      this.showTicks=!!ticks;
      this.showNumbers=!!numbers;
      this.showInnerScale=!!innerScale;
      this.showOuterScale=!!outerScale;
      this.showCenter=!!center;
      this.showBaseline=!!baseline;
      this._draw();
      return this;
    }

    setHighlight(highlight=[]){
      this.highlight=Array.isArray(highlight)?highlight.slice():[];
      this._draw();
      return this;
    }

    reset(){
      this.x=this.initialState.x;
      this.y=this.initialState.y;
      this.angle=this.initialState.angle;
      this.radius=this.initialState.radius;
      this._draw();
      this._emitChange("reset");
      return this;
    }

    isCenteredOn(point,tolerancePx=12){
      const distance=Math.hypot(this.x-point.x,this.y-point.y);
      return {
        success:distance<=tolerancePx,
        distance
      };
    }

    baselineError(rayAngle){
      const rightError=rayDiff(rayAngle,this.angle);
      const leftError=rayDiff(rayAngle,this.angle+180);
      const best=Math.min(rightError,leftError);

      return {
        success:false,
        error:best,
        side:rightError<=leftError?"right":"left",
        rightError,
        leftError
      };
    }

    isBaselineAlignedWith(rayAngle,toleranceDeg=3){
      const r=this.baselineError(rayAngle);
      r.success=r.error<=toleranceDeg;
      return r;
    }

    zeroScaleForRay(rayAngle,toleranceDeg=3){
      const r=this.isBaselineAlignedWith(rayAngle,toleranceDeg);
      if(!r.success)return null;

      /*
       * Sur notre rapporteur :
       * - échelle intérieure : 0° à droite ;
       * - échelle extérieure : 0° à gauche.
       */
      return r.side==="right" ? "inner" : "outer";
    }

    readingPair(rayAngle,{requireInside=true}={}){
      let local=norm(rayAngle-this.angle);

      // La demi-disque visible est le demi-plan local supérieur :
      // angles locaux compris entre 180° et 360°.
      const epsilon=.000001;
      if(Math.abs(local)<epsilon)local=360;

      const inside=local>=180-epsilon && local<=360+epsilon;

      if(requireInside && !inside){
        return {inside:false,inner:null,outer:null};
      }

      /*
       * d = angle lu depuis la droite vers la gauche sur le demi-cercle supérieur.
       * 0° à droite, 90° en haut, 180° à gauche.
       */
      const d=clamp(360-local,0,180);

      return {
        inside,
        inner:d,
        outer:180-d
      };
    }

    readingFor(rayAngle,{scale="inner",requireInside=true}={}){
      const pair=this.readingPair(rayAngle,{requireInside});

      if(!pair.inside && requireInside)return null;
      if(scale==="outer")return pair.outer;
      return pair.inner;
    }

    _scenePoint(e){
      return G.Utils.pointerToScene(
        e,
        this.scene.svg,
        this.scene.width,
        this.scene.height
      );
    }

    _clampCenter(p){
      if(!this.keepCenterInScene || !this.scene)return p;

      return {
        x:clamp(p.x,28,this.scene.width-28),
        y:clamp(p.y,28,this.scene.height-28)
      };
    }

    _snapCenterPoint(p){
      if(!this.snapCenter || !this.centerTargets.length)return p;

      let best=null;
      let bestD=this.centerSnapTolerance+1;

      for(const target of this.centerTargets){
        const d=Math.hypot(p.x-target.x,p.y-target.y);
        if(d<bestD){
          best=target;
          bestD=d;
        }
      }

      return best ? {x:best.x,y:best.y} : p;
    }

    _snapAngle(angle){
      angle=norm(angle);

      if(!this.snapBaseline || !this.angleTargets.length)return angle;

      let best=angle;
      let bestD=this.angleSnapTolerance+1;

      for(const target of this.angleTargets){
        for(const candidate of [target,norm(target+180)]){
          const d=rayDiff(angle,candidate);
          if(d<bestD){
            bestD=d;
            best=candidate;
          }
        }
      }

      return bestD<=this.angleSnapTolerance ? norm(best) : angle;
    }

    _startMove(e){
      if(this.locked || !this.allowMove)return;

      e.preventDefault();
      e.stopPropagation();

      const p=this._scenePoint(e);

      this.drag={
        type:"move",
        dx:p.x-this.x,
        dy:p.y-this.y
      };

      this._startWindowDrag();
    }

    _startRotate(e){
      if(this.locked || !this.allowRotate)return;

      e.preventDefault();
      e.stopPropagation();

      const p=this._scenePoint(e);
      const pointerAngle=Math.atan2(p.y-this.y,p.x-this.x)*180/Math.PI;

      this.drag={
        type:"rotate",
        offset:rayDiff(pointerAngle,this.angle)===0
          ? 0
          : norm(pointerAngle-this.angle)
      };

      // On conserve l'écart orienté exact.
      this.drag.offset=pointerAngle-this.angle;

      this._startWindowDrag();
    }

    _startWindowDrag(){
      if(!this.group)return;

      this.group.classList.add("is-dragging");

      this._move=ev=>{
        if(!this.drag)return;

        ev.preventDefault();

        const p=this._scenePoint(ev);

        if(this.drag.type==="move"){
          let pos={
            x:p.x-this.drag.dx,
            y:p.y-this.drag.dy
          };

          pos=this._clampCenter(pos);
          pos=this._snapCenterPoint(pos);

          this.x=pos.x;
          this.y=pos.y;
        }else{
          const pointerAngle=Math.atan2(p.y-this.y,p.x-this.x)*180/Math.PI;
          this.angle=this._snapAngle(pointerAngle-this.drag.offset);
        }

        this._applyTransform();
        this._emitChange(this.drag.type);
      };

      this._up=()=>{
        const finishedType=this.drag ? this.drag.type : null;
        this.drag=null;

        if(this.group)this.group.classList.remove("is-dragging");

        this._unbind();

        if(this.onInteractionEnd){
          this.onInteractionEnd(this.state(),finishedType,this);
        }
      };

      window.addEventListener("pointermove",this._move,{passive:false});
      window.addEventListener("pointerup",this._up,{once:true});
      window.addEventListener("pointercancel",this._up,{once:true});
    }

    _unbind(){
      if(this._move)window.removeEventListener("pointermove",this._move);

      if(this._up){
        window.removeEventListener("pointerup",this._up);
        window.removeEventListener("pointercancel",this._up);
      }

      this._move=null;
      this._up=null;
    }

    _emitChange(reason){
      if(this.onChange){
        this.onChange(this.state(),reason,this);
      }

      if(this.scene && this.scene.container){
        this.scene.container.dispatchEvent(
          new CustomEvent("geolib:protractorchange",{
            detail:{
              reason,
              protractor:this,
              state:this.state()
            }
          })
        );
      }
    }

    _applyTransform(){
      if(!this.group)return;
      this.group.setAttribute(
        "transform",
        `translate(${this.x} ${this.y}) rotate(${this.angle})`
      );
    }

    _highlightPhysicalDegrees(){
      const result=new Set();

      for(const item of this.highlight){
        if(Number.isFinite(item)){
          result.add(clamp(Math.round(item),0,180));
          continue;
        }

        if(!item || !Number.isFinite(item.degree))continue;

        const d=clamp(Math.round(item.degree),0,180);

        if(item.scale==="outer"){
          result.add(180-d);
        }else{
          result.add(d);
        }
      }

      return result;
    }

    _draw(){
      if(!this.group)return;

      this.group.innerHTML="";

      const r=this.radius;
      const innerLabelR=r-54;
      const outerLabelR=r-28;
      const highlighted=this._highlightPhysicalDegrees();

      const bodyPath=`M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0 L ${-r} 0 Z`;

      const body=svg("path",{
        d:bodyPath,
        class:"protractor-body"
      });

      const outerArc=svg("path",{
        d:`M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0`,
        class:"protractor-outer-arc"
      });

      this.group.append(body,outerArc);

      if(this.showBaseline){
        this.group.appendChild(svg("line",{
          x1:-r,
          y1:0,
          x2:r,
          y2:0,
          class:"protractor-baseline"
        }));
      }

      if(this.showTicks){
        for(let d=0;d<=180;d+=this.tickStep){
          const theta=(360-d)*Math.PI/180;
          const major=d%10===0;
          const medium=!major && d%5===0;

          const length=major?18:(medium?12:7);

          const x1=Math.cos(theta)*r;
          const y1=Math.sin(theta)*r;
          const x2=Math.cos(theta)*(r-length);
          const y2=Math.sin(theta)*(r-length);

          const classes=[
            "protractor-tick",
            major?"major":(medium?"medium":"minor"),
            highlighted.has(d)?"highlight":""
          ].filter(Boolean).join(" ");

          this.group.appendChild(svg("line",{
            x1,y1,x2,y2,
            class:classes,
            "data-degree":d
          }));
        }
      }

      if(this.showNumbers){
        for(let d=0;d<=180;d+=this.numberStep){
          const theta=(360-d)*Math.PI/180;

          if(this.showOuterScale){
            const value=180-d;
            const x=Math.cos(theta)*outerLabelR;
            const y=Math.sin(theta)*outerLabelR;

            const t=svg("text",{
              x,
              y:y+4,
              class:"protractor-number outer",
              "text-anchor":"middle"
            });

            t.textContent=value;
            this.group.appendChild(t);
          }

          if(this.showInnerScale){
            const value=d;
            const x=Math.cos(theta)*innerLabelR;
            const y=Math.sin(theta)*innerLabelR;

            const t=svg("text",{
              x,
              y:y+4,
              class:"protractor-number inner",
              "text-anchor":"middle"
            });

            t.textContent=value;
            this.group.appendChild(t);
          }
        }
      }

      if(this.showCenter){
        this.group.appendChild(svg("circle",{
          cx:0,
          cy:0,
          r:9,
          class:"protractor-center-ring"
        }));

        this.group.appendChild(svg("line",{
          x1:-15,
          y1:0,
          x2:15,
          y2:0,
          class:"protractor-center-cross"
        }));

        this.group.appendChild(svg("line",{
          x1:0,
          y1:-15,
          x2:0,
          y2:15,
          class:"protractor-center-cross"
        }));
      }

      // Grande zone tactile sur tout le demi-disque.
      const bodyHit=svg("path",{
        d:bodyPath,
        class:"protractor-body-hit",
        "aria-label":"Déplacer le rapporteur"
      });

      // Zone tactile renforcée autour du centre.
      const centerHit=svg("circle",{
        cx:0,
        cy:0,
        r:28,
        class:"protractor-center-hit",
        "aria-label":"Déplacer le rapporteur"
      });

      this.group.append(bodyHit,centerHit);

      // Poignée de rotation volontairement grande pour tablette.
      const handleDistance=r+46;

      const rotateArm=svg("line",{
        x1:0,
        y1:-r+8,
        x2:0,
        y2:-handleDistance+15,
        class:"protractor-rotate-arm"
      });

      const rotateHandle=svg("circle",{
        cx:0,
        cy:-handleDistance,
        r:14,
        class:"protractor-rotate-handle",
        "aria-label":"Tourner le rapporteur"
      });

      const rotateHandleHit=svg("circle",{
        cx:0,
        cy:-handleDistance,
        r:32,
        class:"protractor-rotate-hit",
        "aria-label":"Tourner le rapporteur"
      });

      this.group.append(rotateArm,rotateHandle,rotateHandleHit);

      bodyHit.addEventListener("pointerdown",e=>this._startMove(e));
      centerHit.addEventListener("pointerdown",e=>this._startMove(e));
      rotateHandleHit.addEventListener("pointerdown",e=>this._startRotate(e));

      this.group.classList.toggle("locked",this.locked);
      this._applyTransform();
    }
  }

  G.Protractor=Protractor;
  G.versionProtractor="1.5.0";
})(window);
