/* Pure, deterministic model. No actual telemetry, network or random counters. */
(function(root){
  function tick(previous,load,outage){
    const flow=Math.min(240,Math.max(20,Number(load)||70)),capacity=outage?100:200;
    const backlog=Math.max(0,Math.max(0,Number(previous)||0)+flow-capacity);
    const dropped=Math.max(0,backlog-600),queue=Math.min(600,backlog);
    const latency=Math.round(18+35*flow/capacity+1000*queue/capacity);
    return{capacity,queue,latency,errors:Math.round(100*dropped/flow),load:flow,outage:!!outage};
  }
  if(typeof module==='object'&&module.exports)module.exports={tick};else root.NervModel={tick};
})(typeof window==='object'?window:globalThis);
