(function(){
  const core=document.createElement('script');
  core.src='assets/cms-core.js?v=20260916-cms-1';
  core.onload=()=>{
    const catalog=document.createElement('script');
    catalog.src='assets/cms-catalog.js?v=20260916-cms-1';
    document.body.appendChild(catalog);
  };
  document.body.appendChild(core);
})();