(() => {
  'use strict';

  const isTabletDevice=(navigator.maxTouchPoints||0)>0&&Math.min(screen.width||0,screen.height||0)>=600;
  document.documentElement.classList.toggle('tablet-device',isTabletDevice);
  if(!isTabletDevice) return;

  function visible(element){
    if(!element||element.hidden) return false;
    const style=getComputedStyle(element);
    return style.display!=='none'&&style.visibility!=='hidden';
  }

  function refreshCorrectionMode(){
    const main=document.querySelector('.main');
    if(!main) return;

    const feedback=document.querySelector('.feedback');
    const feedbackState=feedback&&/(success|error|correct|wrong|revealed)/i.test(feedback.className);
    const nextVisible=[...document.querySelectorAll('#next,.next,[data-action="next"]')].some(visible);
    main.classList.toggle('tablet-correction-mode',Boolean(feedbackState||nextVisible));
  }

  function start(){
    refreshCorrectionMode();
    const root=document.querySelector('.app')||document.body;
    new MutationObserver(refreshCorrectionMode).observe(root,{
      attributes:true,
      attributeFilter:['class','hidden','style'],
      childList:true,
      characterData:true,
      subtree:true
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
