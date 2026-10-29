var ze=Object.defineProperty;var He=(n,e,t)=>e in n?ze(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var l=(n,e,t)=>He(n,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function t(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function r(s){if(s.ep)return;s.ep=!0;const o=t(s);fetch(s.href,o)}})();class We{constructor(){l(this,"statuses",new Map);l(this,"listeners",new Set)}register(e,t,r="idle",s){this.statuses.set(e,{id:e,label:t,state:r,detail:s}),this.notify()}update(e,t,r,s){const o=this.statuses.get(e);o&&(this.statuses.set(e,{...o,state:t,detail:r,progress:s}),this.notify())}get(e){return this.statuses.get(e)}all(){return[...this.statuses.values()]}subscribe(e){return this.listeners.add(e),e(this.all()),()=>{this.listeners.delete(e)}}notify(){const e=this.all();for(const t of this.listeners)t(e)}}class Ge{constructor(e=[]){l(this,"domains",new Map);for(const t of e)this.add(t)}add(e){this.domains.set(e.name,e)}get(e){return this.domains.get(e)}all(){return[...this.domains.values()]}roots(){return this.all().filter(e=>e.parentName===void 0)}children(e){return this.all().filter(t=>t.parentName===e)}ancestryOf(e){const t=[];let r=this.get(e);for(;r!==void 0;)t.unshift(r),r=r.parentName!==void 0?this.get(r.parentName):void 0;return t}}class Ke{constructor(e,t="LIRA"){l(this,"unsubscribe");this.board=e,this.title=t}mount(e){var t;this.ensureStyles(),(t=this.unsubscribe)==null||t.call(this),this.unsubscribe=this.board.subscribe(r=>{e.innerHTML=this.renderScreen(r)})}waitFor(...e){return new Promise(t=>{const r=i=>i==="done"||i==="error",s=i=>{const a=i.filter(c=>e.includes(c.id));a.length===e.length&&a.every(c=>r(c.state))&&(o(),t())},o=this.board.subscribe(s)})}destroy(){var e;(e=this.unsubscribe)==null||e.call(this),this.unsubscribe=void 0}renderScreen(e){return`
      <div class="loading-screen">
        <div class="loading-box">
          <div class="loading-title">${K(this.title)}</div>
          <div class="loading-subtitle">Initialising…</div>
          <div class="loading-steps">
            ${e.map(t=>this.renderStep(t)).join("")}
          </div>
        </div>
      </div>
    `}renderStep(e){return`
      <div class="loading-step state-${e.state}">
        <span class="loading-step-icon">${Xe[e.state]}</span>
        <span class="loading-step-label">${K(e.label)}</span>
        <span class="loading-step-detail">${K(e.detail??Ye[e.state])}</span>
      </div>
    `}ensureStyles(){if(document.getElementById(de))return;const e=document.createElement("style");e.id=de,e.textContent=Je,document.head.appendChild(e)}}const Ye={"not-ported":"Not ported yet",idle:"Waiting…",running:"Working…",done:"Ready",error:"Failed"},Xe={"not-ported":"–",idle:"○",running:'<span class="loading-spinner"></span>',done:"✓",error:"✕"};function K(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const de="lira-loading-screen-styles",Je=`
.loading-screen {
  --ground: #F4F5F1; --surface: #FFFFFF; --ink: #1C2321; --ink-muted: #5B6660; --ink-faint: #8B948E;
  --accent: #2B6E63; --line: #DDE0DA; --line-strong: #C4C9BF;
  height: 100%; display: flex; align-items: center; justify-content: center;
  background: var(--ground);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: var(--ink);
}
@media (prefers-color-scheme: dark) {
  .loading-screen {
    --ground: #12211D; --surface: #182A24; --ink: #E7EEEA; --ink-muted: #90A69D; --ink-faint: #5E7A70;
    --accent: #4FBBA6; --line: #2A3B34; --line-strong: #3B4F47;
  }
}
.loading-box {
  width: min(420px, 90vw);
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  padding: 1.5rem 1.6rem;
  box-shadow: 0 1px 2px rgba(28,35,33,0.07), 0 10px 28px rgba(28,35,33,0.10);
}
.loading-title { font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif; font-size: 1.4rem; font-weight: 500; }
.loading-subtitle { font-size: 0.82rem; color: var(--ink-muted); margin-top: 0.15rem; margin-bottom: 1.1rem; }
.loading-steps { display: flex; flex-direction: column; gap: 0.55rem; }
.loading-step { display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; }
.loading-step-icon { width: 18px; flex: none; text-align: center; color: var(--ink-faint); font-size: 0.85rem; }
.loading-step-label { min-width: 132px; }
.loading-step-detail { color: var(--ink-muted); font-size: 0.78rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.loading-step.state-running .loading-step-label { font-weight: 600; }
.loading-step.state-done .loading-step-icon { color: var(--accent); }
.loading-step.state-error .loading-step-icon { color: #C2544B; }
.loading-step.state-not-ported { opacity: 0.5; }
.loading-spinner {
  display: inline-block; width: 11px; height: 11px; border-radius: 50%;
  border: 1.6px solid var(--line-strong); border-top-color: var(--accent);
  animation: lira-spin 0.8s linear infinite;
}
@media (prefers-reduced-motion: reduce) { .loading-spinner { animation: none; } }
@keyframes lira-spin { to { transform: rotate(360deg); } }
`,Ze=300;class Qe{constructor(){l(this,"events",[]);l(this,"listeners",new Set)}append(e){this.events.push(e),this.events.length>Ze&&this.events.shift(),this.notify()}all(){return[...this.events]}subscribe(e){return this.listeners.add(e),e(this.all()),()=>{this.listeners.delete(e)}}notify(){const e=this.all();for(const t of this.listeners)t(e)}}class et{constructor(e,t){this.source=e,this.sink=t}info(e){this.emit("info",e)}warn(e){this.emit("warn",e)}error(e){this.emit("error",e)}emit(e,t){this.sink({timestamp:Date.now(),level:e,source:this.source,message:t})}}class tt{constructor(e,t=[],r){l(this,"unsubscribeStatus");l(this,"unsubscribeLog");l(this,"collapsed",!1);l(this,"logCollapsed",!1);l(this,"latestStatuses",[]);l(this,"latestEvents",[]);l(this,"container");this.board=e,this.actions=t,this.logBoard=r}mount(e){var t,r;this.container=e,this.ensureStyles(),(t=this.unsubscribeStatus)==null||t.call(this),(r=this.unsubscribeLog)==null||r.call(this),e.addEventListener("click",s=>this.handleClick(s)),this.unsubscribeStatus=this.board.subscribe(s=>{this.latestStatuses=s,this.paint()}),this.logBoard&&(this.unsubscribeLog=this.logBoard.subscribe(s=>{this.latestEvents=s,this.paint()}))}destroy(){var e,t;(e=this.unsubscribeStatus)==null||e.call(this),this.unsubscribeStatus=void 0,(t=this.unsubscribeLog)==null||t.call(this),this.unsubscribeLog=void 0}paint(){this.container&&(this.container.innerHTML=this.renderPanel())}handleClick(e){const t=e.target.closest("[data-action]");if(!(!t||t.disabled)){if(t.dataset.action==="toggle")this.collapsed=!this.collapsed,this.paint();else if(t.dataset.action==="toggle-log")this.logCollapsed=!this.logCollapsed,this.paint();else if(t.dataset.action==="run"){const r=this.actions.find(s=>s.id===t.dataset.actionId);r==null||r.onClick()}}}renderPanel(){const e=this.latestStatuses,t=e.filter(r=>r.state==="running"||r.state==="done").length;return`
      <div class="service-status-panel ${this.collapsed?"collapsed":""}">
        <button type="button" class="service-status-header" data-action="toggle" aria-expanded="${!this.collapsed}">
          <span class="service-status-label">Background Services</span>
          ${this.collapsed?`<span class="service-status-summary">${t}/${e.length} running</span>`:""}
          <span class="service-status-chevron">${pe}</span>
        </button>
        <div class="service-status-rows">
          ${e.map(r=>this.renderRow(r)).join("")}
        </div>
      </div>
      ${this.logBoard?this.renderLogPanel():""}
    `}renderRow(e){const t=this.actions.find(s=>s.id===e.id),r=e.progress!==void 0?`<div class="service-status-progress"><div class="service-status-progress-fill" style="width:${Math.round(e.progress*100)}%"></div></div>`:"";return`
      <div class="service-status-row-group">
        <div class="service-status-row state-${e.state}">
          <span class="service-status-dot"></span>
          <span class="service-status-name">${L(e.label)}</span>
          <span class="service-status-pill">${rt[e.state]}</span>
          ${e.detail?`<span class="service-status-detail">${L(e.detail)}</span>`:""}
          ${t?`<button type="button" class="service-status-action" data-action="run" data-action-id="${L(t.id)}" ${e.state==="running"?"disabled":""}>${L(t.label)}</button>`:""}
        </div>
        ${r}
      </div>
    `}renderLogPanel(){const e=this.latestEvents;return`
      <div class="service-log-panel ${this.logCollapsed?"collapsed":""}">
        <button type="button" class="service-status-header" data-action="toggle-log" aria-expanded="${!this.logCollapsed}">
          <span class="service-status-label">Event Log</span>
          ${this.logCollapsed?`<span class="service-status-summary">${e.length} event${e.length===1?"":"s"}</span>`:""}
          <span class="service-status-chevron">${pe}</span>
        </button>
        <div class="service-log-rows">
          ${e.length===0?'<div class="service-log-empty">No events yet.</div>':[...e].reverse().map(t=>this.renderLogRow(t)).join("")}
        </div>
      </div>
    `}renderLogRow(e){return`
      <div class="service-log-row level-${e.level}">
        <span class="service-log-time">${st(e.timestamp)}</span>
        <span class="service-log-level-pill">${nt[e.level]}</span>
        <span class="service-log-source">${L(e.source)}</span>
        <span class="service-log-message">${L(e.message)}</span>
      </div>
    `}ensureStyles(){if(document.getElementById(ue))return;const e=document.createElement("style");e.id=ue,e.textContent=ot,document.head.appendChild(e)}}const rt={"not-ported":"Not ported",idle:"Idle",running:"Running",done:"Running",error:"Error"},nt={info:"Info",warn:"Warn",error:"Error"};function L(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function st(n){return new Date(n).toLocaleTimeString(void 0,{hour12:!1})}const pe='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',ue="lira-service-status-styles",ot=`
.service-status-panel {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: var(--surface, #FFFFFF);
  border-top: 1px solid var(--line, #DDE0DA);
  padding: 0.6rem 0.9rem 0.75rem;
}
.service-status-header {
  display: flex; align-items: center; gap: 0.5rem; width: 100%;
  background: none; border: none; padding: 0; margin-bottom: 0.45rem;
  font-family: inherit; cursor: pointer; text-align: left;
}
.service-status-label {
  font-family: 'SF Mono', Menlo, monospace;
  font-size: 0.64rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint, #8B948E);
}
.service-status-summary { font-size: 0.72rem; color: var(--ink-muted, #5B6660); flex: 1; }
.service-status-chevron { display: flex; margin-left: auto; color: var(--ink-faint, #8B948E); transition: transform 0.15s ease; }
.service-status-chevron svg { width: 12px; height: 12px; }
.service-status-panel.collapsed .service-status-header { margin-bottom: 0; }
.service-status-panel.collapsed .service-status-chevron { transform: rotate(-90deg); }
.service-status-panel.collapsed .service-status-rows { display: none; }
.service-status-header:focus-visible { outline: 2px solid var(--accent, #2B6E63); outline-offset: 2px; }
.service-status-rows { display: flex; flex-direction: column; gap: 0.4rem; }
.service-status-row-group { display: flex; flex-direction: column; gap: 0.25rem; }
.service-status-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--ink, #1C2321); }
.service-status-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; background: var(--ink-faint, #8B948E); }
.service-status-name { min-width: 148px; }
.service-status-pill {
  font-size: 0.66rem; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase;
  padding: 0.08rem 0.45rem; border-radius: 999px; color: var(--ink-muted, #5B6660);
  background: var(--surface-2, #ECEEE8); flex: none;
}
.service-status-detail { color: var(--ink-muted, #5B6660); font-size: 0.76rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
.service-status-action {
  font-family: inherit; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.01em;
  border: 1px solid var(--line-strong, #C4C9BF); background: var(--surface, #FFFFFF); color: var(--accent, #2B6E63);
  padding: 0.15rem 0.55rem; border-radius: 999px; cursor: pointer; flex: none; margin-left: auto;
}
.service-status-action:hover:not(:disabled) { background: var(--accent-soft, #DCE9E4); }
.service-status-action:disabled { cursor: not-allowed; opacity: 0.5; }
.service-status-action:focus-visible { outline: 2px solid var(--accent, #2B6E63); outline-offset: 1px; }
.service-status-progress {
  height: 4px; border-radius: 999px; background: var(--surface-2, #ECEEE8); overflow: hidden;
  margin-left: 15px; /* aligns the bar's left edge under the dot's name column, not the dot itself */
}
.service-status-progress-fill {
  height: 100%; background: var(--accent, #2B6E63); border-radius: 999px;
  transition: width 0.2s ease-out;
}
.service-status-row.state-running .service-status-dot { background: var(--accent, #2B6E63); animation: lira-pulse 1.4s ease-in-out infinite; }
.service-status-row.state-running .service-status-pill { background: var(--accent-soft, #DCE9E4); color: var(--accent, #2B6E63); }
.service-status-row.state-done .service-status-dot { background: var(--accent, #2B6E63); }
.service-status-row.state-done .service-status-pill { background: var(--accent-soft, #DCE9E4); color: var(--accent, #2B6E63); }
.service-status-row.state-error .service-status-dot { background: #C2544B; }
.service-status-row.state-error .service-status-pill { background: rgba(194, 84, 75, 0.15); color: #C2544B; }
.service-status-row.state-not-ported { opacity: 0.55; }
@media (prefers-reduced-motion: reduce) { .service-status-dot { animation: none !important; } .service-status-progress-fill { transition: none; } }
@keyframes lira-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.service-log-panel {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: var(--surface, #FFFFFF);
  border-top: 1px solid var(--line, #DDE0DA);
  padding: 0.6rem 0.9rem 0.75rem;
}
.service-log-panel.collapsed .service-status-header { margin-bottom: 0; }
.service-log-panel.collapsed .service-status-chevron { transform: rotate(-90deg); }
.service-log-panel.collapsed .service-log-rows { display: none; }
.service-log-rows {
  display: flex; flex-direction: column; gap: 0.2rem;
  max-height: 220px; overflow-y: auto;
  scrollbar-width: thin; scrollbar-color: var(--line-strong, #C4C9BF) transparent;
}
.service-log-rows::-webkit-scrollbar { width: 8px; }
.service-log-rows::-webkit-scrollbar-track { background: transparent; }
.service-log-rows::-webkit-scrollbar-thumb { background: var(--line-strong, #C4C9BF); border-radius: 4px; }
.service-log-rows::-webkit-scrollbar-thumb:hover { background: var(--ink-faint, #8B948E); }
.service-log-empty { font-size: 0.78rem; color: var(--ink-muted, #5B6660); padding: 0.2rem 0; }
.service-log-row {
  display: flex; align-items: baseline; gap: 0.5rem; font-size: 0.76rem;
  padding: 0.2rem 0; border-bottom: 1px solid var(--line, #DDE0DA);
}
.service-log-row:last-child { border-bottom: none; }
.service-log-time {
  font-family: 'SF Mono', Menlo, monospace; font-size: 0.7rem; color: var(--ink-faint, #8B948E); flex: none;
}
.service-log-level-pill {
  font-size: 0.6rem; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase;
  padding: 0.02rem 0.4rem; border-radius: 999px; color: var(--ink-muted, #5B6660);
  background: var(--surface-2, #ECEEE8); flex: none;
}
.service-log-row.level-error .service-log-level-pill { background: rgba(194, 84, 75, 0.15); color: #C2544B; }
.service-log-row.level-warn .service-log-level-pill { background: rgba(176, 137, 0, 0.15); color: #B08900; }
.service-log-row.level-info .service-log-level-pill { background: var(--accent-soft, #DCE9E4); color: var(--accent, #2B6E63); }
.service-log-source { color: var(--ink-muted, #5B6660); flex: none; min-width: 96px; }
.service-log-message { color: var(--ink, #1C2321); overflow-wrap: anywhere; }
`,it=20*1024*1024;class at{constructor(e=it){l(this,"root",{kind:"dir",children:new Map});l(this,"cwdPath",[]);this.capacity=e}get capacityBytes(){return this.capacity}usedBytes(){return ne(this.root)}pwd(){return"/"+this.cwdPath.join("/")}changeDirectory(e){const t=this.resolveSegments(e),r=t.length===0?this.root:this.lookupNode(t);if(!r)throw new Error(`cd: ${e}: No such file or directory`);if(r.kind!=="dir")throw new Error(`cd: ${e}: Not a directory`);this.cwdPath=t}list(e){const t=e===void 0?this.cwdPath:this.resolveSegments(e),r=t.length===0?this.root:this.lookupNode(t);if(!r)throw new Error(`ls: cannot access '${e??"."}': No such file or directory`);return r.kind==="file"?[{name:t[t.length-1],kind:"file"}]:[...r.children.entries()].map(([s,o])=>({name:s,kind:o.kind})).sort((s,o)=>s.name.localeCompare(o.name))}makeDirectory(e){const t=this.resolveSegments(e);if(t.length===0)throw new Error(`mkdir: cannot create directory '${e}': File exists`);const r=this.lookupParentDir(t),s=t[t.length-1];if(!r)throw new Error(`mkdir: cannot create directory '${e}': No such file or directory`);if(r.children.has(s))throw new Error(`mkdir: cannot create directory '${e}': File exists`);r.children.set(s,{kind:"dir",children:new Map})}touch(e){var o;const t=this.resolveSegments(e);if(t.length===0)throw new Error(`touch: cannot touch '${e}': Is a directory`);const r=this.lookupParentDir(t),s=t[t.length-1];if(!r)throw new Error(`touch: cannot touch '${e}': No such file or directory`);if(((o=r.children.get(s))==null?void 0:o.kind)==="dir")throw new Error(`touch: cannot touch '${e}': Is a directory`);r.children.has(s)||r.children.set(s,{kind:"file",content:""})}writeFile(e,t,r={}){const s=this.resolveSegments(e);if(s.length===0)throw new Error(`${e}: Is a directory`);const o=this.lookupParentDir(s),i=s[s.length-1];if(!o)throw new Error(`${e}: No such file or directory`);const a=o.children.get(i);if((a==null?void 0:a.kind)==="dir")throw new Error(`${e}: Is a directory`);const c=r.append&&a?a.content+t:t,d=a?se(a.content):0,u=se(c);if(this.usedBytes()-d+u>this.capacity)throw new Error(`${e}: No space left on device`);o.children.set(i,{kind:"file",content:c})}readFile(e){const t=this.resolveSegments(e),r=t.length===0?this.root:this.lookupNode(t);if(!r)throw new Error(`cat: ${e}: No such file or directory`);if(r.kind!=="file")throw new Error(`cat: ${e}: Is a directory`);return r.content}remove(e,t={}){const r=this.resolveSegments(e);if(r.length===0)throw new Error(`rm: cannot remove '${e}': Device or resource busy`);const s=this.lookupParentDir(r),o=r[r.length-1],i=s==null?void 0:s.children.get(o);if(!s||!i)throw new Error(`rm: cannot remove '${e}': No such file or directory`);if(i.kind==="dir"&&!t.recursive)throw new Error(`rm: cannot remove '${e}': Is a directory`);s.children.delete(o)}move(e,t){const r=this.resolveSegments(e),s=this.lookupParentDir(r),o=r[r.length-1],i=r.length>0?s==null?void 0:s.children.get(o):void 0;if(!s||!i)throw new Error(`mv: cannot stat '${e}': No such file or directory`);const a=this.resolveDestination(t,o);if(!a.parent)throw new Error(`mv: cannot move '${e}' to '${t}': No such file or directory`);s.children.delete(o),a.parent.children.set(a.name,i)}copy(e,t,r={}){const s=this.resolveSegments(e),o=s.length===0?this.root:this.lookupNode(s);if(!o)throw new Error(`cp: cannot stat '${e}': No such file or directory`);if(o.kind==="dir"&&!r.recursive)throw new Error(`cp: -r not specified; omitting directory '${e}'`);const i=s[s.length-1]??"",a=this.resolveDestination(t,i);if(!a.parent)throw new Error(`cp: cannot create '${t}': No such file or directory`);if(this.usedBytes()+ne(o)>this.capacity)throw new Error(`cp: ${t}: No space left on device`);a.parent.children.set(a.name,Te(o))}toBlob(){return new Blob([JSON.stringify(Me(this.root))],{type:"application/json"})}resolveSegments(e){const t=e.startsWith("/")?[]:[...this.cwdPath];for(const r of e.split("/"))if(!(r===""||r===".")){if(r===".."){t.length>0&&t.pop();continue}t.push(r)}return t}lookupNode(e){let t=this.root;for(const r of e){if(t.kind!=="dir")return;const s=t.children.get(r);if(!s)return;t=s}return t}lookupParentDir(e){const t=e.slice(0,-1),r=t.length===0?this.root:this.lookupNode(t);return(r==null?void 0:r.kind)==="dir"?r:void 0}resolveDestination(e,t){const r=this.resolveSegments(e),s=r.length===0?this.root:this.lookupNode(r);return(s==null?void 0:s.kind)==="dir"?{parent:s,name:t}:{parent:this.lookupParentDir(r),name:r[r.length-1]??t}}}function ne(n){if(n.kind==="file")return se(n.content);let e=0;for(const t of n.children.values())e+=ne(t);return e}function Te(n){if(n.kind==="file")return{kind:"file",content:n.content};const e=new Map;for(const[t,r]of n.children)e.set(t,Te(r));return{kind:"dir",children:e}}function Me(n){if(n.kind==="file")return{kind:"file",content:n.content};const e={};for(const[t,r]of n.children)e[t]=Me(r);return{kind:"dir",children:e}}function se(n){return new TextEncoder().encode(n).length}const lt={name:"help",description:"list available commands",run:({commands:n})=>["Available commands:",...Object.values(n).sort((e,t)=>e.name.localeCompare(t.name)).map(e=>`  ${e.name.padEnd(8)}${e.description}`)]},ct={name:"clear",description:"clear the console",run:({clearScrollback:n})=>(n(),[])},dt={name:"pwd",description:"print the working directory",run:({fs:n})=>[n.pwd()]},pt={name:"ls",description:"list directory contents",run:({fs:n,args:e})=>{const t=n.list(e[0]);return t.length===0?[]:[t.map(r=>r.kind==="dir"?`${r.name}/`:r.name).join("  ")]}},ut={name:"cd",description:"change the working directory",run:({fs:n,args:e})=>(n.changeDirectory(e[0]??"/"),[])};function ae(n,e){const t=[];for(const r of n)try{e(r)}catch(s){t.push(s instanceof Error?s.message:String(s))}return t}function F(n){return n<1024?`${n}B`:n<1024*1024?`${(n/1024).toFixed(1)}K`:n<1024*1024*1024?`${(n/(1024*1024)).toFixed(1)}M`:`${(n/(1024*1024*1024)).toFixed(1)}G`}const ht={name:"mkdir",description:"create a directory",run:({fs:n,args:e})=>{if(e.length===0)throw new Error("mkdir: missing operand");return ae(e,t=>n.makeDirectory(t))}},mt={name:"touch",description:"create an empty file (no-op if it already exists)",run:({fs:n,args:e})=>{if(e.length===0)throw new Error("touch: missing operand");return ae(e,t=>n.touch(t))}},ft={name:"cat",description:"print file contents",run:({fs:n,args:e})=>{if(e.length===0)throw new Error("cat: missing operand");const t=[];for(const r of e)try{t.push(n.readFile(r))}catch(s){t.push(s instanceof Error?s.message:String(s))}return t}},gt={name:"echo",description:"print text, or write/append it to a file with > / >>",run:({fs:n,args:e})=>{const t=e.findIndex(o=>o===">"||o===">>");if(t===-1)return[e.join(" ")];const r=e[t]===">>",s=e[t+1];if(!s)throw new Error("lira: syntax error near unexpected token `newline'");return n.writeFile(s,e.slice(0,t).join(" ")+`
`,{append:r}),[]}},vt={name:"rm",description:"remove files or directories (-r for directories)",run:({fs:n,args:e})=>{const t=e.some(s=>s.startsWith("-")&&s.includes("r")),r=e.filter(s=>!s.startsWith("-"));if(r.length===0)throw new Error("rm: missing operand");return ae(r,s=>n.remove(s,{recursive:t}))}},bt={name:"mv",description:"move or rename a file or directory",run:({fs:n,args:e})=>{if(e.length!==2)throw new Error("mv: missing destination file operand");return n.move(e[0],e[1]),[]}},wt={name:"cp",description:"copy a file or directory (-r for directories)",run:({fs:n,args:e})=>{const t=e.some(s=>s.startsWith("-")&&s.includes("r")),r=e.filter(s=>!s.startsWith("-"));if(r.length!==2)throw new Error("cp: missing destination file operand");return n.copy(r[0],r[1],{recursive:t}),[]}},yt={name:"df",description:"show virtual filesystem capacity usage",run:({fs:n})=>{const e=n.usedBytes(),t=n.capacityBytes,r=t===0?0:Math.round(e/t*100);return["Filesystem      Size    Used    Avail   Use%",`blobfs          ${F(t).padEnd(8)}${F(e).padEnd(8)}${F(t-e).padEnd(8)}${r}%`]}},xt={"not-ported":"NOT PORTED",idle:"IDLE",running:"RUNNING",done:"DONE",error:"ERROR"};function kt(n,e){if(n==="vocabulary")return e.vocabularyClient;if(n==="linguistics")return e.linguisticsClient}const Et={name:"ps",description:"list running Services with live memory metrics",run:async({services:n})=>{const e=n.statusBoard.all(),t=new Map;await Promise.all(e.map(async o=>{const i=kt(o.id,n);if(i)try{t.set(o.id,await i.getMetrics())}catch{}}));const r="PID   SERVICE               STATE        UPTIME     HEAP          %HEAP",s=e.map((o,i)=>$t(i+1,o,t.get(o.id)));return[r,...s]}};function $t(n,e,t){const r=t?St(t.uptimeMs):"-",s=(t==null?void 0:t.heapUsedBytes)!==void 0&&t.heapLimitBytes!==void 0?`${F(t.heapUsedBytes)}/${F(t.heapLimitBytes)}`:"-",o=(t==null?void 0:t.heapUsedBytes)!==void 0&&t.heapLimitBytes?`${Math.round(t.heapUsedBytes/t.heapLimitBytes*100)}%`:"-";return`${String(n).padEnd(6)}${e.label.padEnd(22)}${xt[e.state].padEnd(13)}${r.padEnd(11)}${s.padEnd(14)}${o}`}function St(n){const e=Math.floor(n/1e3),t=Math.floor(e/3600),r=Math.floor(e%3600/60),s=e%60;return[t,r,s].map(o=>String(o).padStart(2,"0")).join(":")}const Ct=["maxTextureDimension1D","maxTextureDimension2D","maxTextureDimension3D","maxTextureArrayLayers","maxBindGroups","maxBindGroupsPlusVertexBuffers","maxBindingsPerBindGroup","maxDynamicUniformBuffersPerPipelineLayout","maxDynamicStorageBuffersPerPipelineLayout","maxSampledTexturesPerShaderStage","maxSamplersPerShaderStage","maxStorageBuffersPerShaderStage","maxStorageTexturesPerShaderStage","maxUniformBuffersPerShaderStage","maxUniformBufferBindingSize","maxStorageBufferBindingSize","minUniformBufferOffsetAlignment","minStorageBufferOffsetAlignment","maxVertexBuffers","maxBufferSize","maxVertexAttributes","maxVertexBufferArrayStride","maxInterStageShaderVariables","maxColorAttachments","maxColorAttachmentBytesPerSample","maxComputeWorkgroupStorageSize","maxComputeInvocationsPerWorkgroup","maxComputeWorkgroupSizeX","maxComputeWorkgroupSizeY","maxComputeWorkgroupSizeZ","maxComputeWorkgroupsPerDimension"];function Bt(n){return n.gpu}async function It(n){if(n.info)return n.info;if(typeof n.requestAdapterInfo=="function")return n.requestAdapterInfo()}function U(n){return n&&n.length>0?n:"-"}const Rt={name:"gpu",description:"report real GPU adapter information via WebGPU",run:async()=>{const n=Bt(navigator);if(!n)throw new Error("gpu: WebGPU is not supported in this browser (navigator.gpu is undefined)");const e=await n.requestAdapter();if(!e)throw new Error("gpu: WebGPU is supported, but no GPU adapter is available (requestAdapter() returned null)");const t=await It(e),r=Array.from(e.features).sort();return["Adapter",`  vendor               ${U(t==null?void 0:t.vendor)}`,`  architecture         ${U(t==null?void 0:t.architecture)}`,`  device               ${U(t==null?void 0:t.device)}`,`  description          ${U(t==null?void 0:t.description)}`,`  fallback adapter     ${e.isFallbackAdapter}`,`  preferred canvas fmt ${n.getPreferredCanvasFormat()}`,"",`Features (${r.length})`,...r.length>0?r.map(o=>`  ${o}`):["  (none)"],"","Limits",...Ct.map(o=>`  ${o.padEnd(42)}${e.limits[o].toLocaleString()}`)]}},Lt=[lt,ct,dt,pt,ut,ht,mt,ft,gt,vt,bt,wt,yt,Et,Rt],he=Object.fromEntries(Lt.map(n=>[n.name,n]));class Tt{constructor(e,t,r){l(this,"container");l(this,"collapsed",!1);l(this,"fs",new at);l(this,"services");l(this,"lines",Mt.map(e=>({kind:"banner",text:e})));l(this,"commandHistory",[]);l(this,"historyIndex");l(this,"draftBeforeRecall","");this.services={statusBoard:e,vocabularyClient:t,linguisticsClient:r}}mount(e){this.container=e,this.ensureStyles(),e.addEventListener("click",t=>this.handleClick(t)),e.addEventListener("keydown",t=>this.handleKeydown(t)),this.paint()}paint(){this.container&&(this.container.innerHTML=this.renderPanel(),this.focusInput(),this.scrollToBottom())}handleClick(e){const t=e.target;if(t.closest("[data-action='toggle-console']")){this.collapsed=!this.collapsed,this.paint();return}t.closest(".console-body")&&!t.closest("a,button")&&this.focusInput()}handleKeydown(e){const t=e.target;if(!t.classList.contains("console-input"))return;const r=t;if(e.key==="Enter"){e.preventDefault();const s=r.value;r.value="",this.historyIndex=void 0,this.runCommand(s)}else e.key==="ArrowUp"?(e.preventDefault(),this.recall(r,-1)):e.key==="ArrowDown"&&(e.preventDefault(),this.recall(r,1))}recall(e,t){if(this.commandHistory.length!==0){if(this.historyIndex===void 0){if(t===1)return;this.draftBeforeRecall=e.value,this.historyIndex=this.commandHistory.length-1}else{const r=this.historyIndex+t;if(r<0)return;if(r>=this.commandHistory.length){this.historyIndex=void 0,e.value=this.draftBeforeRecall;return}this.historyIndex=r}e.value=this.commandHistory[this.historyIndex]}}runCommand(e){const t=e.trim();if(this.lines.push({kind:"command",text:e,prompt:me(this.fs.pwd())}),t.length===0){this.paint();return}this.commandHistory.push(t);const[r,...s]=Nt(t),o=he[r.toLowerCase()];if(!o){this.lines.push({kind:"error",text:`lira: command not found: ${r} (not implemented yet)`}),this.paint();return}Promise.resolve(o.run({fs:this.fs,args:s,commands:he,clearScrollback:()=>this.lines=[],services:this.services})).then(i=>{for(const a of i)this.lines.push({kind:"output",text:a})}).catch(i=>{this.lines.push({kind:"error",text:i instanceof Error?i.message:String(i)})}).finally(()=>this.paint())}focusInput(){var e,t;(t=(e=this.container)==null?void 0:e.querySelector(".console-input"))==null||t.focus()}scrollToBottom(){var t;const e=(t=this.container)==null?void 0:t.querySelector(".console-lines");e&&(e.scrollTop=e.scrollHeight)}renderPanel(){return`
      <div class="console-panel ${this.collapsed?"collapsed":""}">
        <button type="button" class="console-header" data-action="toggle-console" aria-expanded="${!this.collapsed}">
          <span class="console-label">Console</span>
          ${this.collapsed?`<span class="console-summary">${this.commandHistory.length} command${this.commandHistory.length===1?"":"s"}</span>`:""}
          <span class="console-chevron">${At}</span>
        </button>
        <div class="console-body" role="log" aria-live="polite">
          <div class="console-lines">
            ${this.lines.map(e=>this.renderLine(e)).join("")}
          </div>
          <div class="console-prompt-row">
            <span class="console-prompt" aria-hidden="true">${_(me(this.fs.pwd()))}</span>
            <input type="text" class="console-input" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Console command input">
          </div>
        </div>
      </div>
    `}renderLine(e){return e.kind==="command"?`<div class="console-line console-line-command"><span class="console-prompt" aria-hidden="true">${_(e.prompt)}</span>${_(e.text)}</div>`:`<div class="console-line console-line-${e.kind}">${_(e.text)}</div>`}ensureStyles(){if(document.getElementById(fe))return;const e=document.createElement("style");e.id=fe,e.textContent=Dt,document.head.appendChild(e)}}const Mt=["LIRA Operating System","Type 'help' to get started."];function me(n){return`lira:${n}$ `}function Nt(n){const e=[],t=/"([^"]*)"|(\S+)/g;let r;for(;(r=t.exec(n))!==null;)e.push(r[1]!==void 0?r[1]:r[2]);return e}function _(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const At='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',fe="lira-console-styles",Dt=`
.console-panel {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: var(--surface, #FFFFFF);
  border-top: 1px solid var(--line, #DDE0DA);
  padding: 0.6rem 0.9rem 0.75rem;
  flex: none;
}
.console-header {
  display: flex; align-items: center; gap: 0.5rem; width: 100%;
  background: none; border: none; padding: 0; margin-bottom: 0.45rem;
  font-family: inherit; cursor: pointer; text-align: left;
}
.console-label {
  font-family: 'SF Mono', Menlo, monospace;
  font-size: 0.64rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint, #8B948E);
}
.console-summary { font-size: 0.72rem; color: var(--ink-muted, #5B6660); flex: 1; }
.console-chevron { display: flex; margin-left: auto; color: var(--ink-faint, #8B948E); transition: transform 0.15s ease; }
.console-chevron svg { width: 12px; height: 12px; }
.console-panel.collapsed .console-header { margin-bottom: 0; }
.console-panel.collapsed .console-chevron { transform: rotate(-90deg); }
.console-panel.collapsed .console-body { display: none; }
.console-header:focus-visible { outline: 2px solid var(--accent, #2B6E63); outline-offset: 2px; }
.console-body {
  display: flex; flex-direction: column;
  background: #14171a; border-radius: 6px; border: 1px solid #272c30;
  padding: 0.55rem 0.7rem;
}
.console-lines {
  max-height: 200px; overflow-y: auto;
  font-family: 'SF Mono', Menlo, monospace; font-size: 0.78rem; line-height: 1.5;
  scrollbar-width: thin; scrollbar-color: #3a4147 transparent;
}
.console-lines::-webkit-scrollbar { width: 8px; }
.console-lines::-webkit-scrollbar-track { background: transparent; }
.console-lines::-webkit-scrollbar-thumb { background: #3a4147; border-radius: 4px; }
.console-lines::-webkit-scrollbar-thumb:hover { background: #4d555c; }
.console-line { white-space: pre-wrap; overflow-wrap: anywhere; color: #c7ccd1; }
.console-line-command { color: #f2f4f6; }
.console-line-error { color: #e0796d; }
.console-line-banner { color: #5fe3b3; font-weight: 700; }
.console-prompt { color: #5fe3b3; font-weight: 600; user-select: none; }
.console-prompt-row { display: flex; align-items: center; margin-top: 0.3rem; }
.console-input {
  flex: 1; background: transparent; border: none; outline: none;
  color: #f2f4f6; font-family: 'SF Mono', Menlo, monospace; font-size: 0.78rem;
  caret-color: #5fe3b3;
}
`;function le(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}function j(n,e){const t=new Float32Array(16);for(let r=0;r<4;r++)for(let s=0;s<4;s++){let o=0;for(let i=0;i<4;i++)o+=n[i*4+s]*e[r*4+i];t[r*4+s]=o}return t}function ge(...n){return n.reduce((e,t)=>j(e,t),le())}function ve([n,e,t]){const r=le();return r[12]=n,r[13]=e,r[14]=t,r}function be(n){const e=le();return e[0]=n,e[5]=n,e[10]=n,e}function we([n,e,t],r){const s=Math.cos(r),o=Math.sin(r),i=1-s;return new Float32Array([i*n*n+s,i*n*e+o*t,i*n*t-o*e,0,i*n*e-o*t,i*e*e+s,i*e*t+o*n,0,i*n*t+o*e,i*e*t-o*n,i*t*t+s,0,0,0,0,1])}function Pt(n,e,t,r){const s=1/Math.tan(n/2),o=1/(t-r);return new Float32Array([s/e,0,0,0,0,s,0,0,0,0,r*o,-1,0,0,r*t*o,0])}function Ft(n,e,t){const r=oe(Ot(n,e)),s=oe(ye(t,r)),o=ye(r,s);return new Float32Array([s[0],o[0],r[0],0,s[1],o[1],r[1],0,s[2],o[2],r[2],0,-Y(s,n),-Y(o,n),-Y(r,n),1])}function Ot(n,e){return[n[0]-e[0],n[1]-e[1],n[2]-e[2]]}function ye(n,e){return[n[1]*e[2]-n[2]*e[1],n[2]*e[0]-n[0]*e[2],n[0]*e[1]-n[1]*e[0]]}function Y(n,e){return n[0]*e[0]+n[1]*e[1]+n[2]*e[2]}function oe(n){const e=Math.hypot(n[0],n[1],n[2]);return e===0?[0,0,0]:[n[0]/e,n[1]/e,n[2]/e]}const z=6,N=[{normal:[1,0,0],right:[0,0,-1],up:[0,1,0]},{normal:[-1,0,0],right:[0,0,1],up:[0,1,0]},{normal:[0,1,0],right:[1,0,0],up:[0,0,-1]},{normal:[0,-1,0],right:[1,0,0],up:[0,0,1]},{normal:[0,0,1],right:[1,0,0],up:[0,1,0]},{normal:[0,0,-1],right:[-1,0,0],up:[0,1,0]}];function Vt(n){const e=n/2,t=new Float32Array(N.length*4*z),r=new Uint16Array(N.length*6);return N.forEach((s,o)=>{const[i,a,c]=s.normal;[v(v(s.normal,s.right,-1),s.up,-1),v(v(s.normal,s.right,1),s.up,-1),v(v(s.normal,s.right,1),s.up,1),v(v(s.normal,s.right,-1),s.up,1)].forEach((g,$)=>{const b=(o*4+$)*z;t[b]=g[0]*e,t[b+1]=g[1]*e,t[b+2]=g[2]*e,t[b+3]=i,t[b+4]=a,t[b+5]=c});const u=o*4,f=o*6;r[f]=u,r[f+1]=u+1,r[f+2]=u+2,r[f+3]=u,r[f+4]=u+2,r[f+5]=u+3}),{vertices:t,indices:r}}function v(n,e,t){return[n[0]+e[0]*t,n[1]+e[1]*t,n[2]+e[2]*t]}const xe=5,ke=[[0,1],[1,1],[1,0],[0,0]];function Ut(n){const e=n/2,t=new Float32Array(N.length*4*xe),r=new Uint16Array(N.length*6);return N.forEach((s,o)=>{[v(v(s.normal,s.right,-1),s.up,-1),v(v(s.normal,s.right,1),s.up,-1),v(v(s.normal,s.right,1),s.up,1),v(v(s.normal,s.right,-1),s.up,1)].forEach((d,u)=>{const f=(o*4+u)*xe;t[f]=d[0]*e,t[f+1]=d[1]*e,t[f+2]=d[2]*e,t[f+3]=ke[u][0],t[f+4]=ke[u][1]});const a=o*4,c=o*6;r[c]=a,r[c+1]=a+1,r[c+2]=a+2,r[c+3]=a,r[c+4]=a+2,r[c+5]=a+3}),{vertices:t,indices:r}}function _t(n,e,t){const r=e+1,s=t+1,o=new Float32Array(r*s*z);for(let a=0;a<r;a++){const c=a/e*Math.PI,d=Math.sin(c),u=Math.cos(c);for(let f=0;f<s;f++){const g=f/t*Math.PI*2,$=d*Math.cos(g),b=u,m=d*Math.sin(g),k=(a*s+f)*z;o[k]=$*n,o[k+1]=b*n,o[k+2]=m*n,o[k+3]=$,o[k+4]=b,o[k+5]=m}}const i=[];for(let a=0;a<e;a++)for(let c=0;c<t;c++){const d=a*s+c,u=(a+1)*s+c,f=(a+1)*s+c+1,g=a*s+c+1;a!==0&&i.push(d,g,u),a!==e-1&&i.push(u,g,f)}return{vertices:o,indices:new Uint16Array(i)}}function qt(n,e,t,r=Math.random){const s=[];for(let o=0;o<n;o++)s.push(ie("cube",t,r));for(let o=0;o<e;o++)s.push(ie("sphere",t,r));return s}function ie(n,e,t){const r=.6+t()*1.2,s=oe([t()*2-1,t()*2-1,t()*2-1]);return{kind:n,position:[X(e.min[0],e.max[0],t),X(e.min[1],e.max[1],t),X(e.min[2],e.max[2],t)],velocity:[J(r,t),J(r,t),J(r,t)],rotationAxis:s[0]===0&&s[1]===0&&s[2]===0?[0,1,0]:s,rotationSpeed:.4+t()*1.6,rotationAngle:t()*Math.PI*2,scale:.45+t()*.35,color:[...jt(t(),.65,.55),1]}}function X(n,e,t){return n+(e-n)*t()}function J(n,e){return(e()<.5?-1:1)*n}function Ee(n,e,t){n.rotationAngle+=n.rotationSpeed*e;for(let r=0;r<3;r++){n.position[r]+=n.velocity[r]*e;const s=t.min[r]+n.scale,o=t.max[r]-n.scale;n.position[r]<s?(n.position[r]=s,n.velocity[r]=Math.abs(n.velocity[r])):n.position[r]>o&&(n.position[r]=o,n.velocity[r]=-Math.abs(n.velocity[r]))}}function jt(n,e,t){const r=t+e-t*e,s=2*t-r;return[Z(s,r,n+1/3),Z(s,r,n),Z(s,r,n-1/3)]}function Z(n,e,t){let r=t;return r<0&&(r+=1),r>1&&(r-=1),r<1/6?n+(e-n)*6*r:r<1/2?e:r<2/3?n+(e-n)*(2/3-r)*6:n}const zt=`
struct Uniforms {
  modelViewProj: mat4x4<f32>,
  model: mat4x4<f32>,
  color: vec4<f32>,
};
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOut {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) worldNormal: vec3<f32>,
};

@vertex
fn vs_main(@location(0) position: vec3<f32>, @location(1) normal: vec3<f32>) -> VertexOut {
  var out: VertexOut;
  out.clipPosition = uniforms.modelViewProj * vec4<f32>(position, 1.0);
  out.worldNormal = (uniforms.model * vec4<f32>(normal, 0.0)).xyz;
  return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
  let lightDir = normalize(vec3<f32>(0.4, 0.8, 0.6));
  let n = normalize(in.worldNormal);
  let diffuse = max(dot(n, lightDir), 0.0);
  let ambient = 0.25;
  let intensity = ambient + diffuse * 0.75;
  return vec4<f32>(uniforms.color.rgb * intensity, uniforms.color.a);
}
`,Ne=144,Ht=Ne/4,Wt=`
struct CameraUniforms {
  modelViewProj: mat4x4<f32>,
};
@group(0) @binding(0) var<uniform> uniforms: CameraUniforms;
@group(0) @binding(1) var cameraSampler: sampler;
@group(0) @binding(2) var cameraTexture: texture_2d<f32>;

struct CameraVertexOut {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_camera(@location(0) position: vec3<f32>, @location(1) uv: vec2<f32>) -> CameraVertexOut {
  var out: CameraVertexOut;
  out.clipPosition = uniforms.modelViewProj * vec4<f32>(position, 1.0);
  out.uv = uv;
  return out;
}

@fragment
fn fs_camera(in: CameraVertexOut) -> @location(0) vec4<f32> {
  return textureSample(cameraTexture, cameraSampler, in.uv);
}
`,Ae=64,Gt=Ae/4;function W(){const n=globalThis;return{buffer:n.GPUBufferUsage,texture:n.GPUTextureUsage}}const De=[0,2,10],Kt=[0,0,0],Yt=[0,1,0],Pe=55*Math.PI/180,Xt=.1,Jt=100,Q=2.5,Zt=.85;function ee(n){const t=(De[2]-Q)*Math.tan(Pe/2)*Zt,r=t*n;return{min:[-r,-t,-Q],max:[r,t,Q]}}const Qt=8,er=8,tr=1.1,rr=.6,nr=16,sr=24,or=3.2,ir={r:.04,g:.05,b:.08,a:1},ce="depth24plus";function ar(n,e,t,r){const s=lr(n,t),o=te(n,Vt(tr)),i=te(n,_t(rr,nr,sr)),a=Math.max(1,r.width)/Math.max(1,r.height),c=qt(Qt,er,ee(a)).map(w=>pr(n,s,w)),d=new Float32Array(Ht);let u,f,g=0,$=0,b,m;const k=new Float32Array(Gt);function Ue(w){if(m)return;const A=cr(n,t),B=te(n,Ut(or)),{buffer:S,texture:I}=W(),O=n.createBuffer({size:H(Ae),usage:S.UNIFORM|S.COPY_DST}),G=n.createSampler({magFilter:"linear",minFilter:"linear"}),D=n.createTexture({size:[w.width,w.height],format:"rgba8unorm",usage:I.TEXTURE_BINDING|I.COPY_DST|I.RENDER_ATTACHMENT}),V=n.createBindGroup({layout:A.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:O}},{binding:1,resource:G},{binding:2,resource:D.createView()}]}),P=ie("camera",ee(Math.max(1,r.width)/Math.max(1,r.height)),Math.random);P.scale=1,m={camera:w,entity:P,pipeline:A,meshBuffers:B,uniformBuffer:O,bindGroup:V,texture:D,textureWidth:w.width,textureHeight:w.height}}function _e(w){b===void 0&&(b=w);const A=Math.min((w-b)/1e3,.1);b=w;const B=Math.max(1,r.width),S=Math.max(1,r.height);(!u||g!==B||$!==S)&&(u==null||u.destroy(),u=dr(n,B,S),f=u.createView(),g=B,$=S);const I=B/S,O=Pt(Pe,I,Xt,Jt),G=Ft(De,Kt,Yt),D=j(O,G),V=ee(I);for(const y of c){Ee(y.entity,A,V);const R=ge(ve(y.entity.position),we(y.entity.rotationAxis,y.entity.rotationAngle),be(y.entity.scale)),je=j(D,R);d.set(je,0),d.set(R,16),d.set(y.entity.color,32),n.queue.writeBuffer(y.uniformBuffer,0,d)}if(m){Ee(m.entity,A,V);const y=ge(ve(m.entity.position),we(m.entity.rotationAxis,m.entity.rotationAngle),be(m.entity.scale));k.set(j(D,y),0),n.queue.writeBuffer(m.uniformBuffer,0,k),m.camera.isReady&&n.queue.copyExternalImageToTexture({source:m.camera.element},{texture:m.texture},[m.textureWidth,m.textureHeight])}const P=n.createCommandEncoder(),x=P.beginRenderPass({colorAttachments:[{view:e.getCurrentTexture().createView(),clearValue:ir,loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:f,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});x.setPipeline(s);for(const y of c){const R=y.entity.kind==="cube"?o:i;x.setBindGroup(0,y.bindGroup),x.setVertexBuffer(0,R.vertexBuffer),x.setIndexBuffer(R.indexBuffer,"uint16"),x.drawIndexed(R.indexCount)}m&&(x.setPipeline(m.pipeline),x.setBindGroup(0,m.bindGroup),x.setVertexBuffer(0,m.meshBuffers.vertexBuffer),x.setIndexBuffer(m.meshBuffers.indexBuffer,"uint16"),x.drawIndexed(m.meshBuffers.indexCount)),x.end(),n.queue.submit([P.finish()])}function qe(){u==null||u.destroy(),o.vertexBuffer.destroy(),o.indexBuffer.destroy(),i.vertexBuffer.destroy(),i.indexBuffer.destroy();for(const w of c)w.uniformBuffer.destroy();m&&(m.texture.destroy(),m.meshBuffers.vertexBuffer.destroy(),m.meshBuffers.indexBuffer.destroy(),m.uniformBuffer.destroy(),m=void 0)}return{renderFrame:_e,attachCamera:Ue,destroy:qe}}function lr(n,e){const t=n.createShaderModule({code:zt});return n.createRenderPipeline({layout:"auto",vertex:{module:t,entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:t,entryPoint:"fs_main",targets:[{format:e}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{format:ce,depthWriteEnabled:!0,depthCompare:"less"}})}function cr(n,e){const t=n.createShaderModule({code:Wt});return n.createRenderPipeline({layout:"auto",vertex:{module:t,entryPoint:"vs_camera",buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:t,entryPoint:"fs_camera",targets:[{format:e}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{format:ce,depthWriteEnabled:!0,depthCompare:"less"}})}function dr(n,e,t){const{texture:r}=W();return n.createTexture({size:[e,t],format:ce,usage:r.RENDER_ATTACHMENT})}function pr(n,e,t){const{buffer:r}=W(),s=n.createBuffer({size:H(Ne),usage:r.UNIFORM|r.COPY_DST}),o=n.createBindGroup({layout:e.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:s}}]});return{entity:t,uniformBuffer:s,bindGroup:o}}function te(n,e){const{buffer:t}=W(),r=n.createBuffer({size:H(e.vertices.byteLength),usage:t.VERTEX|t.COPY_DST});n.queue.writeBuffer(r,0,e.vertices);const s=n.createBuffer({size:H(e.indices.byteLength),usage:t.INDEX|t.COPY_DST});return n.queue.writeBuffer(s,0,e.indices),{vertexBuffer:r,indexBuffer:s,indexCount:e.indices.length}}function H(n){return Math.ceil(n/4)*4}class ur{constructor(e=document.createElement("video"),t=navigator.mediaDevices){l(this,"video");l(this,"mediaDevices");l(this,"stream");this.video=e,this.video.muted=!0,this.video.playsInline=!0,this.mediaDevices=t}async start(){if(!this.mediaDevices)throw new Error("Camera capture is not supported in this browser (navigator.mediaDevices is undefined).");this.stream=await this.mediaDevices.getUserMedia({video:!0,audio:!1}),this.video.srcObject=this.stream,await this.video.play(),await hr(this.video)}get element(){return this.video}get isReady(){return this.video.videoWidth>0&&this.video.videoHeight>0}get width(){return this.video.videoWidth}get height(){return this.video.videoHeight}stop(){var e;(e=this.stream)==null||e.getTracks().forEach(t=>t.stop()),this.stream=void 0,this.video.srcObject=null}}function hr(n){return n.videoWidth>0&&n.videoHeight>0?Promise.resolve():new Promise(e=>{const t=()=>{n.videoWidth===0||n.videoHeight===0||(n.removeEventListener("loadeddata",t),e())};n.addEventListener("loadeddata",t)})}function mr(n){return n.gpu}function fr(n){return n.getContext("webgpu")}class gr{constructor(e,t=()=>new ur){l(this,"container");l(this,"device");l(this,"renderer");l(this,"cameraCapture");l(this,"animationFrame");l(this,"resizeObserver");l(this,"sessionToken",0);this.logger=e,this.createCamera=t}mount(e){this.destroy(),this.container=e;const t=++this.sessionToken;e.innerHTML='<canvas class="gpu-canvas-surface"></canvas>',this.start(t)}destroy(){var e,t,r,s;this.animationFrame!==void 0&&(cancelAnimationFrame(this.animationFrame),this.animationFrame=void 0),(e=this.resizeObserver)==null||e.disconnect(),this.resizeObserver=void 0,(t=this.cameraCapture)==null||t.stop(),this.cameraCapture=void 0,(r=this.renderer)==null||r.destroy(),this.renderer=void 0,(s=this.device)==null||s.destroy(),this.device=void 0}async start(e){const t=this.container;if(t)try{const r=mr(navigator);if(!r)throw new Error("WebGPU is not supported in this browser (navigator.gpu is undefined).");const s=await r.requestAdapter();if(e!==this.sessionToken)return;if(!s)throw new Error("WebGPU is supported, but no GPU adapter is available (requestAdapter() returned null).");const o=await s.requestDevice();if(e!==this.sessionToken){o.destroy();return}this.device=o;const i=t.querySelector(".gpu-canvas-surface"),a=i?fr(i):null;if(!i||!a)throw new Error("This browser's canvas element has no WebGPU context.");a.configure({device:o,format:r.getPreferredCanvasFormat()});const c=()=>{const g=window.devicePixelRatio||1;i.width=Math.max(1,Math.floor(i.clientWidth*g)),i.height=Math.max(1,Math.floor(i.clientHeight*g))};this.resizeObserver=new ResizeObserver(c),this.resizeObserver.observe(i),c(),this.renderer=ar(o,a,r.getPreferredCanvasFormat(),i);const d=this.renderer;this.logger.info("Requesting camera access…");const u=this.createCamera();this.cameraCapture=u,u.start().then(()=>{e===this.sessionToken&&(d.attachCamera(u),this.logger.info(`Camera ready (${u.width}x${u.height}) -- textured onto one cube in the scene.`))}).catch(g=>{e===this.sessionToken&&this.logger.warn(`Camera unavailable: ${g instanceof Error?g.message:String(g)}`)});const f=()=>{e===this.sessionToken&&(d.renderFrame(performance.now()),this.animationFrame=requestAnimationFrame(f))};this.animationFrame=requestAnimationFrame(f)}catch(r){if(e!==this.sessionToken||!this.container)return;const s=r instanceof Error?r.message:String(r);this.logger.warn(s),this.destroy(),this.container.innerHTML=`<div class="portal-view-empty">${vr(s)}</div>`}}}function vr(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var h=(n=>(n[n.NOUN=0]="NOUN",n[n.VERB=1]="VERB",n[n.ADJECTIVE=2]="ADJECTIVE",n[n.ADVERB=3]="ADVERB",n[n.PRONOUN=4]="PRONOUN",n[n.DETERMINER=5]="DETERMINER",n[n.PREPOSITION=6]="PREPOSITION",n[n.CONJUNCTION=7]="CONJUNCTION",n[n.INTERJECTION=8]="INTERJECTION",n[n.NUMERAL=9]="NUMERAL",n[n.AUXILIARY=11]="AUXILIARY",n[n.PROPER_NOUN=12]="PROPER_NOUN",n[n.SYMBOL=13]="SYMBOL",n[n.PUNCTUATION=14]="PUNCTUATION",n[n.OTHER=15]="OTHER",n))(h||{});const br={[h[h.NOUN]]:"#3B6EA5",[h[h.PROPER_NOUN]]:"#274472",[h[h.VERB]]:"#B2542D",[h[h.ADJECTIVE]]:"#7A5CA6",[h[h.ADVERB]]:"#B08900",[h[h.PRONOUN]]:"#5B7B6F",[h[h.DETERMINER]]:"#6E7B8B",[h[h.PREPOSITION]]:"#7B6E5B",[h[h.CONJUNCTION]]:"#6B7280",[h[h.AUXILIARY]]:"#5B6E8B",[h[h.INTERJECTION]]:"#C2544B",[h[h.NUMERAL]]:"#4B8A7B",[h[h.SYMBOL]]:"#8A8A8A",[h[h.PUNCTUATION]]:"#9A9A9A",[h[h.OTHER]]:"#7A7A7A"},M={VALID:"#2B6E63",UNRESOLVED:"#B08900",INVALID:"#B2542D"},$e=["A meaning is a representation.","The word over the meaning.","The use is a state.","The word wants to use the meaning.","The meaning and the word perceive the state."],Se="lira-sentence-reader-styles";class wr{constructor(e){l(this,"container");l(this,"reading",!1);l(this,"requestToken",0);l(this,"documentResult");l(this,"expandedNodes",new Set);l(this,"selectedKey");l(this,"detailCache",new Map);l(this,"detailToken",0);this.client=e}mount(e){this.container=e,this.ensureStyles(),e.innerHTML=this.renderShell(),this.wire();const t=e.querySelector(".lira-sr-textarea");t!=null&&t.value&&this.read(t.value)}destroy(){this.container=void 0}wire(){const e=this.container;if(!e)return;const t=e.querySelector(".lira-sr-textarea"),r=e.querySelector(".lira-sr-read-btn");t&&r&&(r.addEventListener("click",()=>void this.read(t.value)),t.addEventListener("keydown",o=>{(o.metaKey||o.ctrlKey)&&o.key==="Enter"&&this.read(t.value)})),e.querySelectorAll(".lira-sr-example").forEach(o=>{o.addEventListener("click",()=>{const i=o.dataset.example??"";t&&(t.value=i),this.read(i)})});const s=e.querySelector(".lira-sr-tree");s==null||s.addEventListener("click",o=>this.handleTreeClick(o)),s==null||s.addEventListener("keydown",o=>this.handleTreeKeydown(o))}handleTreeClick(e){const t=e.target,r=t.closest('[data-action="toggle-node"]');if(r){this.toggleNode(r.dataset.node??"");return}const s=t.closest('.lira-tree-row[data-kind="sentence"]');s&&this.selectSentenceNode(s.dataset.node??"")}handleTreeKeydown(e){if(e.key!=="Enter"&&e.key!==" ")return;const t=e.target;if(t.closest('[data-action="toggle-node"]'))return;const r=t.closest('.lira-tree-row[data-kind="sentence"]');r&&(e.preventDefault(),this.selectSentenceNode(r.dataset.node??""))}toggleNode(e){if(!e||!this.documentResult)return;const t=!this.expandedNodes.has(e);if(t?this.expandedNodes.add(e):this.expandedNodes.delete(e),t&&Ce(e)&&!this.detailCache.has(e)){this.selectSentenceNode(e);return}this.renderTreeInPlace()}renderTreeInPlace(){var t;if(!this.documentResult)return;const e=(t=this.container)==null?void 0:t.querySelector(".lira-sr-tree");e&&(e.innerHTML=this.renderTree(this.documentResult))}async selectSentenceNode(e){const t=this.documentResult,r=Ce(e);if(!t||!r)return;const s=t.blocks[r.blockIndex];if(!s||s.blockKind!=="paragraph")return;const o=s.sentences[r.sentenceIndex];if(!o)return;this.selectedKey=e,this.expandedNodes.add(`b${r.blockIndex}`),this.expandedNodes.add(e),this.renderTreeInPlace();const i=this.detailCache.get(e);if(i){this.renderDetail(i);return}this.setPanelPlaceholder(".lira-sr-predicted","Loading…"),this.setPanelPlaceholder(".lira-sr-winner-panel","Loading…"),this.setPanelPlaceholder(".lira-sr-trace","Loading…");const a=++this.detailToken,c=this.isLearningEnabled();try{const d=await this.client.read(o.text,c,!0);if(a!==this.detailToken||!this.container)return;this.detailCache.set(e,d),this.renderTreeInPlace(),this.renderDetail(d)}catch(d){if(a!==this.detailToken||!this.container)return;this.setError(d instanceof Error?d.message:String(d))}}isLearningEnabled(){var t;const e=(t=this.container)==null?void 0:t.querySelector(".lira-sr-learning-toggle");return(e==null?void 0:e.checked)??!0}async read(e){const t=e.trim();if(!t||this.reading)return;const r=++this.requestToken,s=this.isLearningEnabled();this.reading=!0,this.setBusy(!0),this.setError(void 0);try{const o=await this.client.readDocument(t,s);if(r!==this.requestToken||!this.container)return;this.renderDocument(o)}catch(o){if(r!==this.requestToken||!this.container)return;this.setError(o instanceof Error?o.message:String(o))}finally{r===this.requestToken&&(this.reading=!1,this.setBusy(!1))}}setBusy(e){var r;const t=(r=this.container)==null?void 0:r.querySelector(".lira-sr-read-btn");t&&(t.disabled=e,t.textContent=e?"Reading…":"Read")}setLearningStatus(e){var s;const t=(s=this.container)==null?void 0:s.querySelector(".lira-sr-learning-status");if(!t)return;if(!e||!e.enabled){t.textContent="Learning off";return}const r=e.recordedThisRead>0?` (+${e.recordedThisRead})`:"";t.textContent=`Learning: ${e.totalObservations} observation${e.totalObservations===1?"":"s"}${r}`}setError(e){var r;const t=(r=this.container)==null?void 0:r.querySelector(".lira-sr-error");t&&(t.textContent=e??"",t.style.display=e?"block":"none")}renderDocument(e){this.documentResult=e.document,this.detailCache.clear(),this.expandedNodes=new Set(["doc"]),this.selectedKey=void 0,this.setLearningStatus(e.learning);const t=yr(e.document);if(t){this.selectSentenceNode(t);return}this.renderTreeInPlace(),this.setPanelPlaceholder(".lira-sr-predicted","No sentences found in this text."),this.setPanelPlaceholder(".lira-sr-winner-panel","No sentences found in this text."),this.setPanelPlaceholder(".lira-sr-trace","No sentences found in this text.")}renderDetail(e){var o,i,a;const t=(o=this.container)==null?void 0:o.querySelector(".lira-sr-predicted"),r=(i=this.container)==null?void 0:i.querySelector(".lira-sr-winner-panel"),s=(a=this.container)==null?void 0:a.querySelector(".lira-sr-trace");t&&(t.innerHTML=this.renderPredicted(e.predicted,e.words)),r&&(r.innerHTML=this.renderWinner(e.predicted,e.trace)),s&&(s.innerHTML=this.renderTrace(e.trace))}setPanelPlaceholder(e,t){var s;const r=(s=this.container)==null?void 0:s.querySelector(e);r&&(r.innerHTML=`<div class="lira-sr-placeholder">${p(t)}</div>`)}ensureStyles(){if(document.getElementById(Se))return;const e=document.createElement("style");e.id=Se,e.textContent=Br,document.head.appendChild(e)}renderShell(){return`
      <div class="lira-sr">
        <div class="lira-sr-input-card">
          <textarea class="lira-sr-textarea" placeholder="e.g. A meaning is a representation.">${p($e[0])}</textarea>
          <div class="lira-sr-input-row">
            <button type="button" class="lira-sr-read-btn">Read</button>
            <label class="lira-sr-learning-toggle-label" title="When on, a sentence that reads VALID reinforces the state machine's own learned lexical evidence -- future ambiguous reads prefer word/phrase transitions it has seen validated before.">
              <input type="checkbox" class="lira-sr-learning-toggle" checked>
              Learning
            </label>
            <span class="lira-sr-hint">or press &#8984;/Ctrl + Enter</span>
            <span class="lira-sr-learning-status"></span>
          </div>
          <div class="lira-sr-examples">
            ${$e.map(e=>`<button type="button" class="lira-sr-example" data-example="${p(e)}">${p(e)}</button>`).join("")}
          </div>
        </div>
        <div class="lira-sr-error" style="display:none"></div>
        <div class="lira-sr-workspace">
          <section class="lira-sr-tree-panel">
            <h3>Document structure</h3>
            <p class="lira-sr-panel-sub">Document &rarr; Paragraph &rarr; Sentence &rarr; Clause &rarr; Phrase. Select a sentence to see it on the right; its clause/phrase structure unfolds beneath once read.</p>
            <div class="lira-sr-tree"><div class="lira-sr-placeholder">Read some text to see its structure.</div></div>
          </section>
          <div class="lira-sr-panels">
            <section class="lira-sr-panel">
              <h3>Predicted structure</h3>
              <p class="lira-sr-panel-sub">The one interpretation the state machine ranked highest and materialised for the selected sentence.</p>
              <div class="lira-sr-predicted"><div class="lira-sr-placeholder">Read a sentence to see its predicted structure.</div></div>
            </section>
            <section class="lira-sr-panel">
              <h3>Winner</h3>
              <p class="lira-sr-panel-sub">The winning sentence type and the winning phrase for each clause role.</p>
              <div class="lira-sr-winner-panel"><div class="lira-sr-placeholder">Read a sentence to see its winning interpretation.</div></div>
              <h3 class="lira-sr-trace-heading">Full trace — word prediction</h3>
              <p class="lira-sr-panel-sub">Every phrase type the state machine tried at every token position — matched, completed, rejected, and why.</p>
              <div class="lira-sr-trace"><div class="lira-sr-placeholder">Read a sentence to see the full search trace.</div></div>
            </section>
          </div>
        </div>
      </div>
    `}renderTree(e){const t=this.expandedNodes.has("doc"),r=M[e.validation]??"#7A7A7A",s=e.blocks.filter(c=>c.blockKind==="paragraph").length,o=e.blocks.length-s,i=e.blocks.reduce((c,d)=>c+(d.blockKind==="paragraph"?d.errors.length:0),0),a=[`${s} paragraph${s===1?"":"s"}`,o?`${o} heading${o===1?"":"s"}`:"",i?`${i} error${i===1?"":"s"}`:""].filter(Boolean).join(", ");return`
      <ul class="lira-tree-root">
        <li class="lira-tree-node">
          <div class="lira-tree-row" data-node="doc" data-kind="document">
            ${re("doc",t)}
            <span class="lira-tree-dot" style="background:${r}"></span>
            <span class="lira-tree-label">Document</span>
            ${t?"":`<span class="lira-tree-summary">${p(a)}</span>`}
          </div>
          ${t?`<ul>${e.blocks.map((c,d)=>this.renderBlockNode(c,d)).join("")}</ul>`:""}
        </li>
      </ul>`}renderBlockNode(e,t){const r=`b${t}`;if(e.blockKind==="heading")return`
        <li class="lira-tree-node lira-tree-leaf">
          <div class="lira-tree-row" data-node="${r}" data-kind="heading">
            <span class="lira-tree-spacer"></span>
            <span class="lira-tree-heading-pill">H${e.level}</span>
            <span class="lira-tree-label">${p(q(e.text,48))}</span>
          </div>
        </li>`;const s=this.expandedNodes.has(r),o=M[e.validation]??"#7A7A7A",i=[`${e.sentences.length} sentence${e.sentences.length===1?"":"s"}`,e.errors.length?`${e.errors.length} error${e.errors.length===1?"":"s"}`:""].filter(Boolean).join(", ");return`
      <li class="lira-tree-node">
        <div class="lira-tree-row" data-node="${r}" data-kind="paragraph">
          ${re(r,s)}
          <span class="lira-tree-dot" style="background:${o}"></span>
          <span class="lira-tree-label">Paragraph ${t+1}</span>
          ${s?"":`<span class="lira-tree-summary">${p(i)}</span>`}
        </div>
        ${s?`<ul>${e.sentences.map((a,c)=>this.renderSentenceNode(a,r,c)).join("")}</ul>`:""}
      </li>`}renderSentenceNode(e,t,r){const s=`${t}s${r}`,o=M[e.validation]??"#7A7A7A",i=this.expandedNodes.has(s),a=this.detailCache.get(s),c=i?`<ul>${a?a.predicted.clauses.map((d,u)=>this.renderClauseNode(d,`${s}c${u}`)).join(""):'<li class="lira-tree-node"><div class="lira-tree-row"><span class="lira-tree-spacer"></span><span class="lira-tree-summary">Loading…</span></div></li>'}</ul>`:"";return`
      <li class="lira-tree-node">
        <div class="lira-tree-row ${this.selectedKey===s?"selected":""}" data-node="${s}" data-kind="sentence" role="button" tabindex="0">
          ${re(s,i)}
          <span class="lira-tree-dot" style="background:${o}"></span>
          <span class="lira-tree-label">Sentence ${r+1}</span>
          <span class="lira-tree-snippet">${p(q(e.text,40))}</span>
          ${e.errors.length?`<span class="lira-tree-error-count">${e.errors.length}</span>`:""}
        </div>
        ${c}
      </li>`}renderClauseNode(e,t,r){const s=M[e.validation]??"#7A7A7A",i=[["subject",e.subject],["predicate",e.predicate],["object",e.object],["complement",e.complement],...e.modifiers.map(a=>["modifier",a])].filter(a=>a[1]!==null).map(([a,c],d)=>Fe(c)?this.renderClauseNode(c,`${t}r${d}`,a):this.renderPhraseNode(c,`${t}r${d}`,a)).join("");return`
      <li class="lira-tree-node">
        <div class="lira-tree-row" data-node="${t}" data-kind="clause">
          <span class="lira-tree-spacer"></span>
          <span class="lira-tree-dot" style="background:${s}"></span>
          ${r?`<span class="lira-tree-role-pill">${p(r)}</span>`:""}
          <span class="lira-tree-label">Clause</span>
          <span class="lira-tree-summary">${p(e.clauseType??"?")}</span>
          <span class="lira-tree-snippet">${p(q(e.text,40))}</span>
        </div>
        ${i?`<ul>${i}</ul>`:""}
      </li>`}renderPhraseNode(e,t,r){const s=M[e.validation]??"#7A7A7A",o=e.nestedPhrases.map((i,a)=>this.renderPhraseNode(i,`${t}n${a}`)).join("");return`
      <li class="lira-tree-node">
        <div class="lira-tree-row" data-node="${t}" data-kind="phrase">
          <span class="lira-tree-spacer"></span>
          <span class="lira-tree-dot" style="background:${s}"></span>
          ${r?`<span class="lira-tree-role-pill">${p(r)}</span>`:""}
          <span class="lira-tree-label">Phrase</span>
          <span class="lira-tree-summary">${p(e.phraseType??"?")}</span>
          <span class="lira-tree-snippet">${p(q(e.text,40))}</span>
        </div>
        ${o?`<ul>${o}</ul>`:""}
      </li>`}renderWinner(e,t){const r=e.clauses[0],o=(r?[["subject",r.subject],["predicate",r.predicate],["object",r.object],["complement",r.complement],...r.modifiers.map(a=>["modifier",a])]:[]).map(([a,c])=>Oe(a,c)).join(""),i=t.length?`<div class="lira-sr-winner-positions">
          ${t.map(a=>`
            <span class="lira-sr-winner-chip">
              <span class="lira-sr-mono lira-sr-faint">#${a.startIndex}</span>
              <span class="lira-sr-strong lira-sr-mono">${p(a.tokenText??"")}</span>
              <span class="lira-sr-faint">${p(a.winnerPhraseType??"none")}</span>
            </span>`).join("")}
        </div>`:"";return`
      <div class="lira-sr-winner-head">
        ${Be(e.validation)}
        <span class="lira-sr-strong">${p(e.sentenceType??"UNRESOLVED")}</span>
        <span class="lira-sr-faint">confidence ${e.confidence.toFixed(2)}</span>
      </div>
      ${o?`<div class="lira-sr-winner-roles">${o}</div>`:""}
      ${i}
    `}renderPredicted(e,t){return`${`
      <div class="lira-sr-clause-head">
        ${Be(e.validation)}
        <span class="lira-sr-strong">${p(e.sentenceType??"UNRESOLVED")}</span>
        <span class="lira-sr-faint">confidence ${e.confidence.toFixed(2)}</span>
        <span class="lira-sr-faint">${e.punctuation?`terminal "${p(e.punctuation)}"`:"no terminal punctuation"}</span>
      </div>`}${xr(t)}${Sr(e.errors)}`}renderTrace(e){return e.length?e.map(t=>this.renderPosition(t)).join(""):'<div class="lira-sr-empty">No trace positions recorded.</div>'}renderPosition(e){const t=e.candidatePartsOfSpeech.length?e.candidatePartsOfSpeech.join(", "):e.isKnown===!1?"unseeded":"",r=e.winnerPartsOfSpeech.length?`<div class="lira-sr-winner-pos">
          <span class="lira-sr-faint">Predicted part(s) of speech:</span>
          ${e.winnerPartsOfSpeech.map(s=>Ve(s.text,s.partOfSpeech)).join("")}
        </div>`:"";return`
      <div class="lira-sr-position">
        <div class="lira-sr-position-head">
          <span class="lira-sr-mono lira-sr-faint">#${e.startIndex}</span>
          <span class="lira-sr-strong lira-sr-mono">${p(e.tokenText??"")}</span>
          <span class="lira-sr-faint">${p(t)}</span>
          <span class="lira-sr-winner">&#8594; won by ${p(e.winnerPhraseType??"none")}</span>
        </div>
        ${r}
        ${e.attempts.map(s=>this.renderAttempt(s)).join("")}
      </div>`}renderAttempt(e){const t=e.completions.length?e.completions.map(r=>`
          <div class="lira-sr-completion ${r.isWinner?"winner":""}">
            ${r.isWinner?'<span class="lira-sr-win-mark">&#10003; winner</span>':""}
            "${p(r.text)}" — ${p(r.validation)}, confidence ${r.confidence.toFixed(2)}
            ${$r(r.tokens)}
          </div>`).join(""):e.rejectionReason?`<div class="lira-sr-rejection">${p(e.rejectionReason)}</div>`:"";return`
      <div class="lira-sr-attempt ${e.startMatch?"":"rejected"}">
        <div class="lira-sr-attempt-head">
          <span class="lira-sr-attempt-type">${p(e.phraseType)}</span>
          <span class="lira-sr-match-mark ${e.startMatch?"yes":"no"}">${e.startMatch?"start matched":"no start match"}</span>
          <span class="lira-sr-faint lira-sr-mono">requires: ${e.requiredStart.map(p).join(", ")}</span>
        </div>
        ${t}
      </div>`}}function Fe(n){return"clauseType"in n}function Oe(n,e){if(!e)return"";if(Fe(e)){const t=[["subject",e.subject],["predicate",e.predicate],["object",e.object],["complement",e.complement],...e.modifiers.map(r=>["modifier",r])];return`
      <div class="lira-sr-winner-role-row">
        <span class="lira-sr-winner-role-label">${p(n)}</span>
        <span class="lira-sr-mono">"${p(e.text)}"</span>
        <span class="lira-sr-faint">embedded clause · ${p(e.clauseType??"?")}</span>
      </div>
      <div class="lira-sr-winner-roles lira-sr-winner-roles-nested">${t.map(([r,s])=>Oe(r,s)).join("")}</div>`}return`
    <div class="lira-sr-winner-role-row">
      <span class="lira-sr-winner-role-label">${p(n)}</span>
      <span class="lira-sr-mono">"${p(e.text)}"</span>
      <span class="lira-sr-faint">${p(e.phraseType??"?")}</span>
    </div>`}function re(n,e){return`<button type="button" class="lira-tree-toggle" data-action="toggle-node" data-node="${n}" aria-expanded="${e}">${Cr}</button>`}function q(n,e){const t=n.trim();return t.length>e?`${t.slice(0,e-1)}…`:t}function Ce(n){const e=/^b(\d+)s(\d+)$/.exec(n);if(e)return{blockIndex:Number(e[1]),sentenceIndex:Number(e[2])}}function yr(n){for(let e=0;e<n.blocks.length;e+=1){const t=n.blocks[e];if(t.blockKind!=="paragraph")continue;const r=t.sentences.findIndex(s=>s.errors.length>0);if(r>=0)return`b${e}s${r}`}for(let e=0;e<n.blocks.length;e+=1){const t=n.blocks[e];if(t.blockKind==="paragraph"&&t.sentences.length>0)return`b${e}s0`}}function xr(n){if(!n.length)return'<div class="lira-sr-empty">No words to show.</div>';let e="";return n.forEach((t,r)=>{const s=/^[.,!?;:]+$/.test(t.text);r>0&&!s&&(e+=" "),e+=kr(t,r)}),`<div class="lira-sr-sentence">${e}</div>`}function kr(n,e){return`<span class="lira-sr-word${n.resolved?"":" lira-sr-word-unfound"}" tabindex="0" data-word-index="${e}">${p(n.text)}${Er(n)}</span>`}function Er(n){if(!n.resolved)return`<span class="lira-sr-word-tooltip"><span class="tt-title">${p(n.text)}</span><span class="tt-meta">Not found in the Common Vocabulary Cache</span></span>`;const e=[n.validation??"UNRESOLVED",n.phraseType??"no phrase"],t=[n.partOfSpeech??"?",`conf ${n.confidence!==null?n.confidence.toFixed(2):"—"}`];return`<span class="lira-sr-word-tooltip"><span class="tt-title">${p(n.text)}</span><span class="tt-meta">${e.map(p).join(" · ")}</span><span class="tt-meta">${t.map(p).join(" · ")}</span></span>`}function Be(n){return`<span class="lira-sr-badge" style="background:${M[n]??"#7A7A7A"}">${p(n)}</span>`}function Ve(n,e){return`
    <span class="lira-sr-pos-chip" style="background:${br[e]??"#7A7A7A"}">
      <span class="w">${p(n)}</span>
      <span class="p">${p(e)}</span>
    </span>`}function $r(n){return n.length?`<div class="lira-sr-trace-tokens">${n.map(t=>Ve(t.text,t.partOfSpeech??"UNKNOWN")).join("")}</div>`:""}function Sr(n){return n.length?`
    <div class="lira-sr-errors">
      ${n.map(e=>`
        <div class="lira-sr-error-row">
          <span class="lira-sr-strong">${p(e.kind)}:</span>
          ${p(e.message)}${e.tokenText?` ("${p(e.tokenText)}")`:""}
        </div>`).join("")}
    </div>`:""}function p(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const Cr='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',Br=`
.lira-sr { display: flex; flex-direction: column; gap: 1rem; }
.lira-sr-input-card {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
  box-shadow: var(--shadow); padding: 0.9rem 1rem;
}
.lira-sr-textarea {
  width: 100%; min-height: 3.2rem; resize: vertical; font-family: var(--font-body); font-size: 0.95rem;
  color: var(--ink); background: var(--ground); border: 1px solid var(--line); border-radius: var(--radius);
  padding: 0.6rem 0.7rem; line-height: 1.4; box-sizing: border-box;
}
.lira-sr-textarea:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
.lira-sr-input-row { display: flex; align-items: center; gap: 0.7rem; margin-top: 0.6rem; }
.lira-sr-read-btn {
  background: var(--accent); color: var(--accent-ink); border: none; border-radius: var(--radius);
  padding: 0.5rem 1.1rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: var(--font-body);
}
.lira-sr-read-btn:disabled { opacity: 0.55; cursor: default; }
.lira-sr-learning-toggle-label {
  display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: var(--ink);
  cursor: pointer; user-select: none;
}
.lira-sr-learning-toggle { accent-color: var(--accent); cursor: pointer; margin: 0; }
.lira-sr-hint { color: var(--ink-muted); font-size: 0.76rem; }
.lira-sr-learning-status { color: var(--ink-muted); font-size: 0.72rem; font-family: var(--font-mono); margin-left: auto; }
.lira-sr-examples { display: flex; flex-wrap: wrap; gap: 0.35rem 0.5rem; margin-top: 0.6rem; }
.lira-sr-example {
  background: none; border: 1px solid var(--line); border-radius: 999px; padding: 0.15rem 0.6rem;
  font-size: 0.72rem; color: var(--ink-muted); cursor: pointer; font-family: var(--font-body);
}
.lira-sr-example:hover { border-color: var(--accent); color: var(--accent); }
.lira-sr-error {
  background: color-mix(in srgb, #B2542D 12%, var(--surface));
  border: 1px solid #B2542D; color: #B2542D; border-radius: var(--radius); padding: 0.55rem 0.8rem; font-size: 0.85rem;
}
.lira-sr-workspace { display: flex; gap: 1rem; align-items: flex-start; flex-wrap: wrap; }
.lira-sr-tree-panel {
  flex: 1 1 240px; max-width: 300px; min-width: 220px;
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
  box-shadow: var(--shadow); padding: 0.9rem 1rem;
}
.lira-sr-tree-panel h3 { font-family: var(--font-display); font-size: 0.98rem; margin: 0 0 0.2rem; font-weight: 600; }
.lira-sr-panels { flex: 3 1 520px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; align-items: start; }
.lira-sr-panel {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
  box-shadow: var(--shadow); padding: 0.9rem 1rem; min-width: 0;
}
.lira-sr-panel h3 { font-family: var(--font-display); font-size: 0.98rem; margin: 0 0 0.2rem; font-weight: 600; }
.lira-sr-trace-heading { margin-top: 0.9rem; padding-top: 0.8rem; border-top: 1px solid var(--line); }
.lira-sr-panel-sub { color: var(--ink-muted); font-size: 0.76rem; margin: 0 0 0.8rem; }
.lira-sr-placeholder, .lira-sr-empty { color: var(--ink-muted); font-size: 0.84rem; font-style: italic; }
.lira-sr-strong { font-weight: 700; font-size: 0.82rem; }
.lira-sr-faint { font-size: 0.72rem; color: var(--ink-muted); }
.lira-sr-mono { font-family: var(--font-mono); }
.lira-sr-winner { font-size: 0.72rem; color: var(--accent); margin-left: auto; }
.lira-sr-badge {
  display: inline-flex; align-items: center; padding: 0.05rem 0.55rem; border-radius: 999px;
  font-size: 0.66rem; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; color: #fff;
}
.lira-sr-pos-chip {
  display: inline-flex; flex-direction: column; align-items: center; padding: 0.22rem 0.5rem 0.28rem;
  border-radius: 5px; color: #fff; font-family: var(--font-mono); margin: 0.1rem 0.2rem 0.1rem 0;
}
.lira-sr-pos-chip .w { font-size: 0.85rem; font-weight: 600; }
.lira-sr-pos-chip .p { font-size: 0.56rem; opacity: 0.88; letter-spacing: 0.03em; }
.lira-sr-clause-head { display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
.lira-sr-sentence { font-size: 1.05rem; line-height: 2.1; }
.lira-sr-word {
  position: relative; border-bottom: 1px dotted var(--ink-muted); cursor: pointer;
}
.lira-sr-word.lira-sr-word-unfound {
  border-bottom-style: dashed; border-bottom-color: #B8860B;
  background: color-mix(in srgb, #F5C518 45%, var(--surface));
  border-radius: 3px; padding: 0 0.15rem;
}
.lira-sr-word-tooltip {
  position: absolute; left: 50%; bottom: calc(100% + 7px); transform: translate(-50%, 4px);
  width: max-content; max-width: 270px; background: var(--ink); color: var(--ground);
  font-size: 0.74rem; line-height: 1.4; padding: 0.5rem 0.6rem; border-radius: 5px;
  box-shadow: var(--shadow); opacity: 0; pointer-events: none;
  transition: opacity 0.12s ease, transform 0.12s ease; z-index: 5;
}
.lira-sr-word-tooltip .tt-title { display: block; font-family: var(--font-mono); font-weight: 700; margin-bottom: 0.15rem; }
.lira-sr-word-tooltip .tt-meta { display: block; opacity: 0.85; }
.lira-sr-word-tooltip .tt-meta + .tt-meta { margin-top: 0.1rem; }
.lira-sr-word:hover .lira-sr-word-tooltip, .lira-sr-word:focus .lira-sr-word-tooltip, .lira-sr-word:focus-visible .lira-sr-word-tooltip {
  opacity: 1; transform: translate(-50%, 0);
}
.lira-sr-errors { margin-top: 0.5rem; font-size: 0.78rem; }
.lira-sr-error-row { padding: 0.35rem 0.55rem; border-left: 3px solid #B2542D; background: color-mix(in srgb, #B2542D 8%, transparent); margin-bottom: 0.35rem; border-radius: 3px; }
.lira-sr-position { border: 1px solid var(--line); border-radius: var(--radius); margin-bottom: 0.65rem; overflow: hidden; }
.lira-sr-position-head { padding: 0.45rem 0.65rem; background: color-mix(in srgb, var(--accent) 7%, var(--surface)); display: flex; align-items: center; gap: 0.55rem; flex-wrap: wrap; }
.lira-sr-winner-pos { padding: 0.4rem 0.65rem 0.5rem; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; border-bottom: 1px solid var(--line); }
.lira-sr-trace-tokens { margin-top: 0.35rem; display: flex; flex-wrap: wrap; }
.lira-sr-attempt { padding: 0.45rem 0.65rem; border-top: 1px solid var(--line); font-size: 0.78rem; }
.lira-sr-attempt.rejected { opacity: 0.62; }
.lira-sr-attempt-head { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
.lira-sr-attempt-type { font-weight: 700; font-family: var(--font-mono); font-size: 0.74rem; }
.lira-sr-match-mark { font-size: 0.66rem; padding: 0.05rem 0.4rem; border-radius: 999px; font-weight: 700; }
.lira-sr-match-mark.yes { background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent); }
.lira-sr-match-mark.no { background: color-mix(in srgb, var(--ink-muted) 15%, transparent); color: var(--ink-muted); }
.lira-sr-completion { margin-top: 0.3rem; padding: 0.3rem 0.5rem; border-radius: 4px; background: var(--ground); border: 1px solid var(--line); font-size: 0.76rem; }
.lira-sr-completion.winner { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--ground)); }
.lira-sr-win-mark { color: var(--accent); font-weight: 700; margin-right: 0.3rem; }
.lira-sr-rejection { color: var(--ink-muted); font-size: 0.74rem; margin-top: 0.2rem; }

/* Document structure tree -- same recursive-list shape as vocabulary/
   ui/dictionary_view.ts's own .hierarchy-tree (dashed guide lines,
   indentation via padding-left on nested <ul>s), the same fold chevron
   as knowledge/ui/service_status_view.ts's own collapsible panel. */
.lira-tree-root, .lira-tree-root ul { list-style: none; margin: 0; padding: 0; }
.lira-tree-root ul { padding-left: 20px; border-left: 1px dashed var(--line-strong); margin-left: 8px; }
.lira-tree-node { padding: 2px 0; }
.lira-tree-row {
  display: flex; align-items: center; gap: 0.4rem; padding: 0.2rem 0.3rem; border-radius: 4px;
  cursor: default; font-size: 0.82rem;
}
.lira-tree-row[data-kind="sentence"] { cursor: pointer; }
.lira-tree-row[data-kind="sentence"]:hover { background: color-mix(in srgb, var(--accent) 8%, transparent); }
.lira-tree-row[data-kind="sentence"]:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.lira-tree-row.selected {
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  outline: 1px solid var(--accent);
}
.lira-tree-toggle, .lira-tree-spacer {
  flex: none; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;
}
.lira-tree-toggle {
  background: none; border: none; padding: 0; cursor: pointer; color: var(--ink-faint); transition: transform 0.15s ease;
}
.lira-tree-toggle svg { width: 11px; height: 11px; }
.lira-tree-toggle[aria-expanded="false"] { transform: rotate(-90deg); }
.lira-tree-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; }
.lira-tree-label { font-weight: 600; white-space: nowrap; }
.lira-tree-summary, .lira-tree-snippet { color: var(--ink-muted); font-size: 0.74rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lira-tree-snippet { font-style: italic; }
.lira-tree-error-count {
  margin-left: auto; flex: none; background: #B2542D; color: #fff; font-size: 0.62rem; font-weight: 700;
  padding: 0.02rem 0.4rem; border-radius: 999px;
}
.lira-tree-heading-pill {
  flex: none; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.03em; color: var(--ink-muted);
  background: var(--surface-2); padding: 0.02rem 0.4rem; border-radius: 4px; font-family: var(--font-mono);
}
.lira-tree-role-pill {
  flex: none; font-size: 0.58rem; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase;
  color: var(--ink-muted); background: var(--surface-2); padding: 0.02rem 0.35rem; border-radius: 4px;
}

/* Winner summary card. */
.lira-sr-winner-head { display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
.lira-sr-winner-roles { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.3rem; }
.lira-sr-winner-roles-nested { margin: 0.15rem 0 0.3rem 1.1rem; }
.lira-sr-winner-role-row {
  display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; padding: 0.2rem 0.4rem;
  background: var(--ground); border: 1px solid var(--line); border-radius: 4px; flex-wrap: wrap;
}
.lira-sr-winner-role-label {
  flex: none; min-width: 72px; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.02em;
  text-transform: uppercase; color: var(--ink-muted);
}
.lira-sr-winner-positions { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.4rem; }
.lira-sr-winner-chip {
  display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.15rem 0.45rem; border-radius: 999px;
  background: var(--ground); border: 1px solid var(--line); font-size: 0.72rem;
}
`,T="Common",Ie=[{id:"vocabulary",label:"Vocabulary",available:!0},{id:"linguistics",label:"Linguistics",available:!0},{id:"knowledge",label:"Knowledge",available:!1},{id:"canvas",label:"Canvas",available:!0}],Re="lira-portal-shell-styles",Le="lira-vocabulary-fragment-styles";class Ir{constructor(e,t,r,s,o={}){l(this,"mode");l(this,"mobileScreen","browse");l(this,"selectedName");l(this,"selectedComponent","vocabulary");l(this,"treeCollapsed",!1);l(this,"title");l(this,"container");l(this,"serviceStatusView");l(this,"consoleView");l(this,"sentenceReaderView");l(this,"gpuCanvasView");l(this,"logBoard",new Qe);l(this,"loggersBySource",new Map);l(this,"renderToken",0);l(this,"ioInFlight",!1);l(this,"domainSnapshots",new Map);l(this,"currentVocabularyDomainName");var i;this.registry=e,this.vocabularyClient=t,this.statusBoard=s,this.title=o.title??"LIRA",this.mode=typeof window<"u"&&window.matchMedia("(max-width: 720px)").matches?"mobile":"desktop",this.selectedName=(i=this.registry.roots()[0])==null?void 0:i.name,this.serviceStatusView=new tt(s,[],this.logBoard),this.consoleView=new Tt(s,t,r),this.sentenceReaderView=new wr(r),this.gpuCanvasView=new gr(this.loggerFor("Canvas")),this.vocabularyClient.onLog((a,c,d)=>{this.loggerFor(c)[a](d)}),this.statusBoard.subscribe(a=>{const c=a.find(d=>d.id==="vocabulary");c&&this.updateVocabToolbar(c)}),this.vocabularyClient.onDomainUpdated(a=>{this.registry.add(a),this.render()}),this.vocabularyClient.onDomainSnapshot((a,c)=>{this.handleDomainSnapshot(a,c)}),this.searchWordsBridge(),this.searchPhrasesBridge(),this.searchSensesBridge(),this.searchRelationshipsBridge(),this.searchLexicalRelationshipsBridge(),this.resolveHierarchyBridge()}searchWordsBridge(){document.addEventListener("lira-search-words",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchWords(this.currentVocabularyDomainName,{wordId:t.wordId,word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,domainLabel:t.domain,rootWordsOnly:t.rootWordsOnly,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-words-result",{detail:{requestId:t.requestId,words:r.words,totalMatches:r.totalMatches}}))})})}searchPhrasesBridge(){document.addEventListener("lira-search-phrases",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchPhrases(this.currentVocabularyDomainName,{word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-phrases-result",{detail:{requestId:t.requestId,phrases:r.phrases,totalMatches:r.totalMatches}}))})})}searchSensesBridge(){document.addEventListener("lira-search-senses",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchSenses(this.currentVocabularyDomainName,{word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-senses-result",{detail:{requestId:t.requestId,senses:r.senses,totalMatches:r.totalMatches}}))})})}searchRelationshipsBridge(){document.addEventListener("lira-search-relationships",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchRelationships(this.currentVocabularyDomainName,{wordId:t.wordId,query:t.query,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-relationships-result",{detail:{requestId:t.requestId,relationships:r.relationships,totalMatches:r.totalMatches}}))})})}searchLexicalRelationshipsBridge(){document.addEventListener("lira-search-lexical-relationships",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchLexicalRelationships(this.currentVocabularyDomainName,{wordId:t.wordId,query:t.query,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-lexical-relationships-result",{detail:{requestId:t.requestId,relationships:r.relationships,totalMatches:r.totalMatches}}))})})}resolveHierarchyBridge(){document.addEventListener("lira-resolve-hierarchy",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.resolveHierarchy(this.currentVocabularyDomainName,{kind:t.kind,wordId:t.wordId,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-resolve-hierarchy-result",{detail:{requestId:t.requestId,...r}}))})})}mount(e){this.container=e,document.title=this.title,this.ensureStyles(),e.addEventListener("click",t=>this.handleClick(t)),e.addEventListener("change",t=>this.handleFileInputChange(t)),this.render()}handleClick(e){var s,o;const t=e.target.closest("[data-action]");if(!t||t.disabled)return;const r=t.dataset.action;r==="select"?(this.selectedName=t.dataset.domain,this.mode==="mobile"&&(this.mobileScreen="view"),this.render()):r==="mode"?(this.mode=t.dataset.mode,this.mode==="mobile"&&(this.mobileScreen=this.selectedName?"view":"browse"),this.render()):r==="back"?(this.mobileScreen="browse",this.render()):r==="component"?(this.selectedComponent=t.dataset.component,this.render()):r==="toggle-tree"?(this.treeCollapsed=!this.treeCollapsed,this.render()):r==="seed-wordnet"?this.vocabularyClient.seedWordNet(T):r==="seed-common-vocabulary"?this.vocabularyClient.seedCommonVocabulary(T):r==="save-vocabulary"?this.saveVocabulary():r==="load-vocabulary"&&((o=(s=this.container)==null?void 0:s.querySelector(".portal-vocab-file-input"))==null||o.click())}saveVocabulary(){this.ioInFlight=!0,this.render();const e=T.toLowerCase();this.vocabularyClient.exportDomain(T).then(t=>{C(t.words,`${e}-words.json`),C(t.phrases,`${e}-phrases.json`),C(t.wordForms,`${e}-word_forms.json`),C(t.senses,`${e}-senses.json`),C(t.coordinations,`${e}-coordinations.json`),C(t.semanticRelationships,`${e}-semantic-relationships.json`),C(t.lexicalRelationships,`${e}-lexical-relationships.json`)}).catch(()=>{}).finally(()=>{this.ioInFlight=!1,this.render()})}handleFileInputChange(e){const t=e.target;if(!t.classList.contains("portal-vocab-file-input")||!t.files||t.files.length===0)return;const r=[...t.files];t.value="",this.ioInFlight=!0,this.render(),Promise.all(r.map(async s=>{const o=Rr(s.name);return o?[o,await s.text()]:void 0})).then(s=>{const o={};for(const i of s)i&&(o[i[0]]=i[1]);return this.vocabularyClient.importDomain(T,o)}).catch(()=>{}).finally(()=>{this.ioInFlight=!1,this.render()})}handleDomainSnapshot(e,t){const r=this.domainSnapshots.get(e);if(r)for(const a of r)URL.revokeObjectURL(a.url);const s=e.toLowerCase(),o=[["Words",`${s}-words.json`,t.words],["Phrases",`${s}-phrases.json`,t.phrases],["Word Forms",`${s}-word_forms.json`,t.wordForms],["Senses",`${s}-senses.json`,t.senses],["Coordinations",`${s}-coordinations.json`,t.coordinations],["Semantic Relationships",`${s}-semantic-relationships.json`,t.semanticRelationships],["Lexical Relationships",`${s}-lexical-relationships.json`,t.lexicalRelationships]];this.domainSnapshots.set(e,o.map(([a,c,d])=>({label:a,filename:c,url:URL.createObjectURL(new Blob([d],{type:"application/json"}))})));const i=this.statusBoard.get("vocabulary");i&&this.updateVocabToolbar(i)}renderVocabToolbar(){return`<div class="portal-vocab-toolbar">${this.vocabToolbarInner(this.statusBoard.get("vocabulary"))}</div>`}vocabToolbarInner(e){const t=(e==null?void 0:e.state)==="running",r=t||this.ioInFlight,s=e==null?void 0:e.progress;return`
      <button type="button" class="portal-vocab-toolbar-action" data-action="seed-common-vocabulary" ${t?"disabled":""}>Seed Vocabulary</button>
      <button type="button" class="portal-vocab-toolbar-action" data-action="seed-wordnet" ${t?"disabled":""}>Load WordNet</button>
      <button type="button" class="portal-vocab-toolbar-action" data-action="save-vocabulary" ${r?"disabled":""}>Save</button>
      <button type="button" class="portal-vocab-toolbar-action" data-action="load-vocabulary" ${r?"disabled":""}>Load from File</button>
      <input type="file" class="portal-vocab-file-input" multiple accept=".json" style="display:none">
      <span class="portal-vocab-toolbar-detail">${e!=null&&e.detail?E(e.detail):""}</span>
      ${s!==void 0?`<div class="portal-vocab-toolbar-progress"><div class="portal-vocab-toolbar-progress-fill" style="width:${Math.round(s*100)}%"></div></div>`:""}
      ${this.snapshotLinksHtml()}
    `}snapshotLinksHtml(){const e=this.domainSnapshots.get(T);return!e||e.length===0?"":`<div class="portal-vocab-snapshot-links"><span class="portal-vocab-snapshot-label">Last seed snapshot:</span>${e.map(r=>`<a class="portal-vocab-snapshot-link" href="${r.url}" download="${E(r.filename)}">${E(r.label)}</a>`).join("")}</div>`}updateVocabToolbar(e){var r;const t=(r=this.container)==null?void 0:r.querySelector(".portal-vocab-toolbar");t&&(t.innerHTML=this.vocabToolbarInner(e))}loggerFor(e){let t=this.loggersBySource.get(e);return t||(t=new et(e,r=>this.logBoard.append(r)),this.loggersBySource.set(e,t)),t}ensureStyles(){if(document.getElementById(Re))return;const e=document.createElement("style");e.id=Re,e.textContent=Vr,document.head.appendChild(e)}ensureFragmentStyles(e){if(document.getElementById(Le))return;const t=document.createElement("style");t.id=Le,t.textContent=e,document.head.appendChild(t)}render(){if(!this.container)return;const e=this.selectedName?this.registry.get(this.selectedName):void 0;this.renderToken++;const t=this.mode==="desktop"&&this.treeCollapsed?"tree-collapsed":"";this.container.innerHTML=`
      <div class="portal-shell mode-${this.mode} ${t}">
        ${this.renderTopbar(e)}
        <div class="portal-body">
          ${this.renderBody(e)}
        </div>
      </div>
    `;const r=this.container.querySelector(".portal-service-status");r&&this.serviceStatusView.mount(r);const s=this.container.querySelector(".portal-console");s&&this.consoleView.mount(s),e&&this.selectedComponent==="vocabulary"?this.loadView(e):e&&this.selectedComponent==="linguistics"?this.loadLinguisticsView():e&&this.selectedComponent==="canvas"&&this.loadCanvasView()}loadLinguisticsView(){if(!this.container)return;const e=this.container.querySelector(".portal-fragment-mount");e&&this.sentenceReaderView.mount(e)}loadCanvasView(){if(!this.container)return;const e=this.container.querySelector(".portal-fragment-mount");e&&this.gpuCanvasView.mount(e)}async loadView(e){const t=++this.renderToken;this.setViewStatus("Loading Vocabulary…");let r;try{r=await this.vocabularyClient.renderDomain(e.name)}catch(o){if(t!==this.renderToken)return;this.setViewStatus(`Couldn't load this Domain's Vocabulary view: ${o instanceof Error?o.message:String(o)}`);return}if(t!==this.renderToken||!this.container)return;this.ensureFragmentStyles(r.style);const s=this.container.querySelector(".portal-fragment-mount");if(s){s.innerHTML=r.body,this.currentVocabularyDomainName=e.name;const o=document.createElement("script");o.textContent=`(function () {
${r.script}
})();`,s.appendChild(o)}this.setViewStatus(void 0)}setViewStatus(e){var r;const t=(r=this.container)==null?void 0:r.querySelector(".portal-view-status");t&&(t.textContent=e??"",t.style.display=e?"block":"none")}renderTopbar(e){const t=`
      <div class="portal-mode-toggle" role="group" aria-label="Layout">
        <button type="button" data-action="mode" data-mode="desktop" class="${this.mode==="desktop"?"active":""}">${Dr} Desktop</button>
        <button type="button" data-action="mode" data-mode="mobile" class="${this.mode==="mobile"?"active":""}">${Pr} Mobile</button>
      </div>`;if(this.mode==="mobile")return this.mobileScreen==="view"&&e?`
          <div class="portal-topbar">
            <button type="button" class="portal-back" data-action="back" aria-label="Back to Domains">${Ar}</button>
            <span class="portal-topbar-title">${E(e.name)}</span>
            ${t}
          </div>`:`<div class="portal-topbar"><span class="portal-topbar-title">All Domains</span>${t}</div>`;const r=e?this.registry.ancestryOf(e.name):[];return`<div class="portal-topbar"><nav class="portal-breadcrumb">${[`<span class="crumb-root">${Nr} All Domains</span>`,...r.map(o=>`<span>${E(o.name)}</span>`)].join(`<span class="crumb-sep">${Mr}</span>`)}</nav>${t}</div>`}renderBody(e){return this.mode==="desktop"?`${this.renderTree()}${this.renderViewPane(e)}`:this.mobileScreen==="browse"?`<div class="portal-tree portal-tree--mobile">${this.renderTreeRows(0)}</div>`:this.renderViewPane(e,!0)}renderTree(){return this.treeCollapsed?`
        <nav class="portal-tree portal-tree--collapsed">
          <button type="button" class="portal-tree-toggle" data-action="toggle-tree" title="Expand Domains" aria-label="Expand Domains" aria-expanded="false">${Or}</button>
        </nav>`:`
      <nav class="portal-tree">
        <div class="portal-tree-label">
          <span>Domains</span>
          <button type="button" class="portal-tree-toggle" data-action="toggle-tree" title="Collapse Domains" aria-label="Collapse Domains" aria-expanded="true">${Fr}</button>
        </div>
        ${this.renderTreeRows(0)}
      </nav>`}renderTreeRows(e,t){return(e===0?this.registry.roots():this.registry.children(t??"")).map(s=>{const o=this.registry.children(s.name),i=s.name===this.selectedName;return`
          <div class="portal-tree-row depth-${e} ${i?"selected":""}" data-action="select" data-domain="${E(s.name)}">
            ${o.length>0?Tr:'<span class="chev-spacer"></span>'}
            ${Lr}
            <span class="name">${E(s.name)}</span>
            <span class="count">${s.wordCount.toLocaleString()}</span>
          </div>
          ${o.length>0?this.renderTreeRows(e+1,s.name):""}
        `}).join("")}renderComponentSwitcher(){return`
      <div class="portal-component-switcher" role="tablist" aria-label="UI Component">
        ${Ie.map(e=>`
          <button
            type="button"
            role="tab"
            data-action="component"
            data-component="${e.id}"
            class="${e.id===this.selectedComponent?"active":""}"
            ${e.available?"":"disabled"}
            title="${e.available?"":"Not ported yet"}"
            aria-selected="${e.id===this.selectedComponent}"
          >${E(e.label)}${e.available?"":' <span class="not-ported-badge">Not ported</span>'}</button>
        `).join("")}
      </div>`}renderViewPane(e,t=!1){const r=this.renderComponentSwitcher(),s='<div class="portal-console"></div>',o='<div class="portal-service-status"></div>',i=this.selectedComponent==="vocabulary"?this.renderVocabToolbar():"";if(!e)return`
        <div class="portal-view ${t?"portal-view--full":""}">
          ${r}
          ${i}
          <div class="portal-view-empty">Select a Domain to continue.</div>
          ${s}
          ${o}
        </div>`;const a=Ie.find(d=>d.id===this.selectedComponent),c=a!=null&&a.available?`
        <div class="portal-view-status" style="display:none"></div>
        <div class="portal-fragment-mount"></div>`:`<div class="portal-view-empty">${E((a==null?void 0:a.label)??"This component")} is not ported yet.</div>`;return`
      <div class="portal-view ${t?"portal-view--full":""}">
        ${r}
        ${i}
        ${c}
        ${s}
        ${o}
      </div>`}}function E(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function C(n,e){const t=new Blob([n],{type:"application/json"}),r=URL.createObjectURL(t),s=document.createElement("a");s.href=r,s.download=e,s.click(),URL.revokeObjectURL(r)}function Rr(n){const e=n.toLowerCase();if(e.includes("word_forms")||e.includes("wordforms"))return"wordForms";if(e.includes("words"))return"words";if(e.includes("phrases"))return"phrases";if(e.includes("senses"))return"senses";if(e.includes("coordinations"))return"coordinations";if(e.includes("semantic"))return"semanticRelationships";if(e.includes("lexical"))return"lexicalRelationships"}const Lr='<svg class="i-folder" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.5A1 1 0 0 1 2.5 2.5h3.6l1.2 1.4H13.5A1 1 0 0 1 14.5 5v7A1 1 0 0 1 13.5 13h-11a1 1 0 0 1-1-1v-8.5z"/></svg>',Tr='<svg class="i-chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',Mr='<svg class="i-chev-right" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>',Nr='<svg class="i-home" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 8l6-5 6 5M4 7v6h8V7"/></svg>',Ar='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3L5 8l5 5"/></svg>',Dr='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1.5" y="2.5" width="13" height="9" rx="1"/><path d="M6 13.5h4"/></svg>',Pr='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4.5" y="1.5" width="7" height="13" rx="1.4"/></svg>',Fr='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3L5 8l5 5"/></svg>',Or='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>',Vr=`
.portal-shell {
  --ground: #F4F5F1; --surface: #FFFFFF; --surface-2: #ECEEE8; --ink: #1C2321; --ink-muted: #5B6660;
  --ink-faint: #8B948E; --accent: #2B6E63; --accent-ink: #FFFFFF; --accent-soft: #DCE9E4;
  --line: #DDE0DA; --line-strong: #C4C9BF;
  --shadow: 0 1px 2px rgba(28, 35, 33, 0.06), 0 4px 12px rgba(28, 35, 33, 0.04);
  --radius: 6px;
  --font-display: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-mono: 'SF Mono', 'Cascadia Code', Consolas, 'Liberation Mono', Menlo, monospace;
  font-family: var(--font-body);
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}
@media (prefers-color-scheme: dark) {
  .portal-shell {
    --ground: #12211D; --surface: #182A24; --surface-2: #16241F; --ink: #E7EEEA; --ink-muted: #90A69D;
    --ink-faint: #5E7A70; --accent: #4FBBA6; --accent-ink: #0B1613; --accent-soft: #1F3A32;
    --line: #2A3B34; --line-strong: #3B4F47;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.25);
  }
}
.portal-topbar { display: flex; align-items: center; gap: 0.75rem; padding: 0.55rem 0.9rem; background: var(--surface-2); border-bottom: 1px solid var(--line); }
.portal-topbar-title { font-weight: 600; font-size: 0.92rem; flex: 1; }
.portal-back { background: none; border: none; color: var(--accent); cursor: pointer; padding: 0.2rem; display: flex; }
.portal-back svg { width: 16px; height: 16px; }
.portal-breadcrumb { display: flex; align-items: center; gap: 0.35rem; font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-muted); flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; }
.portal-breadcrumb .crumb-root { display: inline-flex; align-items: center; gap: 0.3rem; color: var(--ink); font-weight: 600; }
.portal-breadcrumb .crumb-root svg { width: 11px; height: 11px; }
.portal-breadcrumb .crumb-sep svg { width: 9px; height: 9px; opacity: 0.6; vertical-align: -1px; }
.portal-mode-toggle { display: inline-flex; border: 1px solid var(--line-strong); border-radius: 999px; overflow: hidden; flex: none; }
.portal-mode-toggle button { display: inline-flex; align-items: center; gap: 0.3rem; border: none; background: var(--surface); color: var(--ink-muted); font-size: 0.72rem; font-weight: 600; padding: 0.3rem 0.65rem; cursor: pointer; font-family: inherit; }
.portal-mode-toggle button svg { width: 13px; height: 13px; }
.portal-mode-toggle button.active { background: var(--accent); color: var(--accent-ink); }
.portal-mode-toggle button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.portal-body { display: grid; grid-template-columns: 208px 1fr; flex: 1; min-height: 0; }
.mode-mobile .portal-body { grid-template-columns: 1fr; }
.tree-collapsed .portal-body { grid-template-columns: 34px 1fr; }
.portal-tree { background: var(--surface-2); border-right: 1px solid var(--line); padding: 0.75rem 0.5rem; overflow-y: auto; }
.portal-tree--mobile { border-right: none; padding: 0.5rem; }
.portal-tree--collapsed { display: flex; justify-content: center; padding: 0.6rem 0; overflow: visible; }
.portal-tree-label { display: flex; align-items: center; justify-content: space-between; gap: 0.3rem; font-family: var(--font-mono); font-size: 0.66rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-faint); padding: 0.2rem 0.35rem 0.5rem 0.55rem; }
.portal-tree-toggle { background: none; border: none; color: var(--ink-faint); cursor: pointer; padding: 0.2rem; border-radius: 4px; display: flex; flex: none; }
.portal-tree-toggle svg { width: 12px; height: 12px; }
.portal-tree-toggle:hover { background: var(--accent-soft); color: var(--accent); }
.portal-tree-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.portal-tree--collapsed .portal-tree-toggle svg { width: 13px; height: 13px; }
.portal-tree-row { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.55rem; border-radius: 6px; font-size: 0.85rem; cursor: pointer; }
.portal-tree-row:hover { background: var(--accent-soft); }
.portal-tree-row.selected { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
.portal-tree-row.depth-1 { padding-left: 1.35rem; }
.portal-tree-row.depth-2 { padding-left: 2.3rem; }
.portal-tree-row .i-chev { width: 10px; height: 10px; color: var(--ink-faint); flex: none; }
.portal-tree-row .chev-spacer { width: 10px; flex: none; }
.portal-tree-row .i-folder { width: 15px; height: 15px; color: var(--accent); flex: none; }
.portal-tree-row .name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.portal-tree-row .count { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-faint); }
.portal-view { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.portal-view-empty { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--ink-muted); font-size: 0.88rem; padding: 2rem; text-align: center; }
.portal-component-switcher { display: flex; flex-wrap: wrap; gap: 0.4rem; padding: 0.6rem 0.9rem; border-bottom: 1px solid var(--line); flex: none; }
.portal-component-switcher button {
  border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink-muted);
  font-family: inherit; font-size: 0.8rem; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 999px; cursor: pointer;
  display: inline-flex; align-items: center; gap: 0.4rem;
}
.portal-component-switcher button.active { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
.portal-component-switcher button:disabled { cursor: not-allowed; opacity: 0.55; }
.portal-component-switcher button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.not-ported-badge { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; opacity: 0.75; }
.portal-vocab-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 0.6rem; padding: 0.55rem 0.9rem; border-bottom: 1px solid var(--line); flex: none; }
.portal-vocab-toolbar-action {
  font-family: inherit; font-size: 0.76rem; font-weight: 600; letter-spacing: 0.01em;
  border: 1px solid var(--line-strong); background: var(--surface); color: var(--accent);
  padding: 0.3rem 0.75rem; border-radius: 999px; cursor: pointer; flex: none;
}
.portal-vocab-toolbar-action:hover:not(:disabled) { background: var(--accent-soft); }
.portal-vocab-toolbar-action:disabled { cursor: not-allowed; opacity: 0.55; }
.portal-vocab-toolbar-action:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.portal-vocab-toolbar-detail { font-size: 0.78rem; color: var(--ink-muted); flex: 1; min-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.portal-vocab-toolbar-progress { flex: 0 0 100%; height: 4px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
.portal-vocab-toolbar-progress-fill { height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.2s ease-out; }
.portal-vocab-snapshot-links { flex: 0 0 100%; display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; font-size: 0.74rem; }
.portal-vocab-snapshot-label { color: var(--ink-muted); }
.portal-vocab-snapshot-link { color: var(--accent); text-decoration: none; border-bottom: 1px dotted var(--accent); }
.portal-vocab-snapshot-link:hover { text-decoration: none; border-bottom-style: solid; }
.portal-view-status { padding: 0.4rem 0.9rem 0; font-size: 0.76rem; color: var(--ink-muted); flex: none; }
.portal-fragment-mount { flex: 1; min-width: 0; min-height: 0; overflow-y: auto; padding: 0.85rem 0.9rem 1.1rem; background: var(--ground); }
.mode-mobile .portal-fragment-mount { min-height: 55vh; }
/* Scoped override, not an edit of the ported fragment CSS itself
   (that stays a verbatim, mechanical extraction from
   vocabulary/ui/dictionary_view.py -- see ensureFragmentStyles above):
   DictionaryView's own .tabs group uses overflow: hidden to keep its
   pill shape, which was never a problem at the standalone page's full
   width but clips the last tab ("Cyclic") once the pane is narrower
   than the Portal makes it. Scrolling the group horizontally here, via
   a higher-specificity selector that only applies inside this mount,
   keeps every tab reachable without touching the ported string. */
.portal-fragment-mount .tabs { max-width: 100%; overflow-x: auto; }
.gpu-canvas-surface { width: 100%; height: 100%; display: block; background: #000; border-radius: 6px; }
.portal-service-status { flex: none; }
`;class Ur{constructor(){l(this,"worker");l(this,"statusListeners",new Set);l(this,"domainUpdateListeners",new Set);l(this,"domainSnapshotListeners",new Set);l(this,"logListeners",new Set);l(this,"readyResolvers",[]);l(this,"pendingRenders",new Map);l(this,"pendingExports",new Map);l(this,"pendingImports",new Map);l(this,"pendingSearches",new Map);l(this,"pendingPhraseSearches",new Map);l(this,"pendingSenseSearches",new Map);l(this,"pendingRelationshipSearches",new Map);l(this,"pendingLexicalRelationshipSearches",new Map);l(this,"pendingHierarchyResolutions",new Map);l(this,"pendingMetrics",new Map);this.worker=new Worker(new URL(""+new URL("vocabulary_worker-CkVPRZ5X.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.addEventListener("message",e=>{this.handleMessage(e.data)})}onStatus(e){return this.statusListeners.add(e),()=>{this.statusListeners.delete(e)}}onLog(e){return this.logListeners.add(e),()=>{this.logListeners.delete(e)}}init(){return new Promise(e=>{this.readyResolvers.push(e),this.post({type:"init"})})}linkPort(e){this.worker.postMessage({type:"link-port",port:e},[e])}renderDomain(e){const t=`${e}-${Math.random().toString(36).slice(2)}`;return new Promise((r,s)=>{this.pendingRenders.set(t,{resolve:r,reject:s}),this.post({type:"render",requestId:t,domain:e})})}exportDomain(e){const t=`export-${e}-${Math.random().toString(36).slice(2)}`;return new Promise((r,s)=>{this.pendingExports.set(t,{resolve:r,reject:s}),this.post({type:"export-domain",requestId:t,domain:e})})}importDomain(e,t){const r=`import-${e}-${Math.random().toString(36).slice(2)}`;return new Promise((s,o)=>{this.pendingImports.set(r,{resolve:s,reject:o}),this.post({type:"import-domain",requestId:r,domain:e,...t})})}getMetrics(){const e=`metrics-${Math.random().toString(36).slice(2)}`;return new Promise(t=>{this.pendingMetrics.set(e,t),this.post({type:"metrics",requestId:e})})}seedWordNet(e){this.post({type:"seed-wordnet",domain:e})}seedCommonVocabulary(e){this.post({type:"seed-common-vocabulary",domain:e})}onDomainUpdated(e){return this.domainUpdateListeners.add(e),()=>{this.domainUpdateListeners.delete(e)}}onDomainSnapshot(e){return this.domainSnapshotListeners.add(e),()=>{this.domainSnapshotListeners.delete(e)}}searchWords(e,t){const r=`search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(s=>{this.pendingSearches.set(r,s),this.post({type:"search-words",requestId:r,domain:e,wordId:t.wordId,word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,domainLabel:t.domainLabel,rootWordsOnly:t.rootWordsOnly,limit:t.limit})})}searchPhrases(e,t){const r=`phrase-search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(s=>{this.pendingPhraseSearches.set(r,s),this.post({type:"search-phrases",requestId:r,domain:e,word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,limit:t.limit})})}searchSenses(e,t){const r=`sense-search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(s=>{this.pendingSenseSearches.set(r,s),this.post({type:"search-senses",requestId:r,domain:e,word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,limit:t.limit})})}searchRelationships(e,t){const r=`rel-search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(s=>{this.pendingRelationshipSearches.set(r,s),this.post({type:"search-relationships",requestId:r,domain:e,wordId:t.wordId,query:t.query,limit:t.limit})})}searchLexicalRelationships(e,t){const r=`lexical-rel-search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(s=>{this.pendingLexicalRelationshipSearches.set(r,s),this.post({type:"search-lexical-relationships",requestId:r,domain:e,wordId:t.wordId,query:t.query,limit:t.limit})})}resolveHierarchy(e,t){const r=`hierarchy-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(s=>{this.pendingHierarchyResolutions.set(r,s),this.post({type:"resolve-hierarchy",requestId:r,domain:e,kind:t.kind,wordId:t.wordId,limit:t.limit})})}post(e){this.worker.postMessage(e)}handleMessage(e){if(e.type==="status")for(const t of this.statusListeners)t(e.state,e.detail,e.progress);else if(e.type==="ready"){const t=this.readyResolvers.splice(0);for(const r of t)r(e.domains)}else if(e.type==="rendered"){const t=this.pendingRenders.get(e.requestId);t&&(this.pendingRenders.delete(e.requestId),t.resolve(e.fragment))}else if(e.type==="render-error"){const t=this.pendingRenders.get(e.requestId);t&&(this.pendingRenders.delete(e.requestId),t.reject(new Error(e.message)))}else if(e.type==="export-domain-result"){const t=this.pendingExports.get(e.requestId);t&&(this.pendingExports.delete(e.requestId),t.resolve({words:e.words,phrases:e.phrases,wordForms:e.wordForms,senses:e.senses,coordinations:e.coordinations,semanticRelationships:e.semanticRelationships,lexicalRelationships:e.lexicalRelationships}))}else if(e.type==="export-domain-error"){const t=this.pendingExports.get(e.requestId);t&&(this.pendingExports.delete(e.requestId),t.reject(new Error(e.message)))}else if(e.type==="import-domain-result"){const t=this.pendingImports.get(e.requestId);t&&(this.pendingImports.delete(e.requestId),t.resolve(e.domain))}else if(e.type==="import-domain-error"){const t=this.pendingImports.get(e.requestId);t&&(this.pendingImports.delete(e.requestId),t.reject(new Error(e.message)))}else if(e.type==="metrics-result"){const t=this.pendingMetrics.get(e.requestId);t&&(this.pendingMetrics.delete(e.requestId),t(e.metrics))}else if(e.type==="domain-updated")for(const t of this.domainUpdateListeners)t(e.domain);else if(e.type==="domain-snapshot")for(const t of this.domainSnapshotListeners)t(e.domain,{words:e.words,phrases:e.phrases,wordForms:e.wordForms,senses:e.senses,coordinations:e.coordinations,semanticRelationships:e.semanticRelationships,lexicalRelationships:e.lexicalRelationships});else if(e.type==="log")for(const t of this.logListeners)t(e.level,e.source,e.message,e.timestamp);else if(e.type==="search-words-result"){const t=this.pendingSearches.get(e.requestId);t&&(this.pendingSearches.delete(e.requestId),t({words:e.words,totalMatches:e.totalMatches}))}else if(e.type==="search-phrases-result"){const t=this.pendingPhraseSearches.get(e.requestId);t&&(this.pendingPhraseSearches.delete(e.requestId),t({phrases:e.phrases,totalMatches:e.totalMatches}))}else if(e.type==="search-senses-result"){const t=this.pendingSenseSearches.get(e.requestId);t&&(this.pendingSenseSearches.delete(e.requestId),t({senses:e.senses,totalMatches:e.totalMatches}))}else if(e.type==="search-relationships-result"){const t=this.pendingRelationshipSearches.get(e.requestId);t&&(this.pendingRelationshipSearches.delete(e.requestId),t({relationships:e.relationships,totalMatches:e.totalMatches}))}else if(e.type==="search-lexical-relationships-result"){const t=this.pendingLexicalRelationshipSearches.get(e.requestId);t&&(this.pendingLexicalRelationshipSearches.delete(e.requestId),t({relationships:e.relationships,totalMatches:e.totalMatches}))}else if(e.type==="resolve-hierarchy-result"){const t=this.pendingHierarchyResolutions.get(e.requestId);t&&(this.pendingHierarchyResolutions.delete(e.requestId),t({nodes:e.nodes,edges:e.edges,roots:e.roots,totalEdgeCount:e.totalEdgeCount,totalNodeCount:e.totalNodeCount,fellBack:e.fellBack,truncated:e.truncated}))}else e.type==="error"&&console.error("Vocabulary Service error:",e.message)}}class _r{constructor(){l(this,"worker");l(this,"statusListeners",new Set);l(this,"readyResolvers",[]);l(this,"pendingReads",new Map);l(this,"pendingReadDocuments",new Map);l(this,"pendingMetrics",new Map);this.worker=new Worker(new URL(""+new URL("linguistics_worker-DxCpTQhG.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.addEventListener("message",e=>{this.handleMessage(e.data)})}onStatus(e){return this.statusListeners.add(e),()=>{this.statusListeners.delete(e)}}init(){return new Promise(e=>{this.readyResolvers.push(e),this.post({type:"init"})})}linkVocabularyPort(e){this.worker.postMessage({type:"link-vocabulary-port",port:e},[e])}read(e,t,r=!1){const s=`read-${Math.random().toString(36).slice(2)}`;return new Promise((o,i)=>{this.pendingReads.set(s,{resolve:o,reject:i}),this.post({type:"read",requestId:s,text:e,learningEnabled:t,skipLearning:r})})}readDocument(e,t){const r=`read-doc-${Math.random().toString(36).slice(2)}`;return new Promise((s,o)=>{this.pendingReadDocuments.set(r,{resolve:s,reject:o}),this.post({type:"read-document",requestId:r,text:e,learningEnabled:t})})}getMetrics(){const e=`metrics-${Math.random().toString(36).slice(2)}`;return new Promise(t=>{this.pendingMetrics.set(e,t),this.post({type:"metrics",requestId:e})})}post(e){this.worker.postMessage(e)}handleMessage(e){if(e.type==="status")for(const t of this.statusListeners)t(e.state,e.detail);else if(e.type==="ready"){const t=this.readyResolvers.splice(0);for(const r of t)r(e.wordCount)}else if(e.type==="read-result"){const t=this.pendingReads.get(e.requestId);t&&(this.pendingReads.delete(e.requestId),t.resolve(e.result))}else if(e.type==="read-document-result"){const t=this.pendingReadDocuments.get(e.requestId);t&&(this.pendingReadDocuments.delete(e.requestId),t.resolve(e.result))}else if(e.type==="metrics-result"){const t=this.pendingMetrics.get(e.requestId);t&&(this.pendingMetrics.delete(e.requestId),t(e.metrics))}else if(e.type==="error"){if(e.requestId){const t=this.pendingReads.get(e.requestId);if(t){this.pendingReads.delete(e.requestId),t.reject(new Error(e.message));return}const r=this.pendingReadDocuments.get(e.requestId);if(r){this.pendingReadDocuments.delete(e.requestId),r.reject(new Error(e.message));return}}console.error("Linguistic Service error:",e.message)}}}function qr(){const n=document.querySelector("#app");if(!n)return;n.style.height="100vh";const e=new We;e.register("vocabulary","Vocabulary Service","idle","Starting…"),e.register("linguistics","Linguistic Service","idle","Starting…"),e.register("knowledge","Knowledge Service","not-ported");const t=new Ke(e,"LIRA");t.mount(n);const r=new Ur;r.onStatus((i,a,c)=>e.update("vocabulary",i,a,c));const s=new _r;s.onStatus((i,a)=>e.update("linguistics",i,a));const o=new MessageChannel;r.linkPort(o.port1),s.linkVocabularyPort(o.port2),Promise.all([r.init(),s.init()]).then(([i])=>{t.destroy();const a=new Ge(i);new Ir(a,r,s,e,{title:"LIRA"}).mount(n)}).catch(i=>{e.update("vocabulary","error",i instanceof Error?i.message:String(i))})}qr();
