/* Owner requested an uncluttered preview; project provenance stays intact. */
(()=>{
  const local=['127.0.0.1','localhost','::1','[::1]'].includes(location.hostname)||location.protocol==='file:';
  if(!local)return;
  document.querySelectorAll('.draft,.draft-note,.fab-local-preview').forEach(el=>el.remove());
})();
