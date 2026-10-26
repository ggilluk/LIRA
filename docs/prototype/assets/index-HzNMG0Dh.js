var W=Object.defineProperty;var K=(s,e,t)=>e in s?W(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var l=(s,e,t)=>K(s,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))r(n);new MutationObserver(n=>{for(const o of n)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function t(n){const o={};return n.integrity&&(o.integrity=n.integrity),n.referrerPolicy&&(o.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?o.credentials="include":n.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function r(n){if(n.ep)return;n.ep=!0;const o=t(n);fetch(n.href,o)}})();class G{constructor(){l(this,"statuses",new Map);l(this,"listeners",new Set)}register(e,t,r="idle",n){this.statuses.set(e,{id:e,label:t,state:r,detail:n}),this.notify()}update(e,t,r,n){const o=this.statuses.get(e);o&&(this.statuses.set(e,{...o,state:t,detail:r,progress:n}),this.notify())}get(e){return this.statuses.get(e)}all(){return[...this.statuses.values()]}subscribe(e){return this.listeners.add(e),e(this.all()),()=>{this.listeners.delete(e)}}notify(){const e=this.all();for(const t of this.listeners)t(e)}}class Y{constructor(e=[]){l(this,"domains",new Map);for(const t of e)this.add(t)}add(e){this.domains.set(e.name,e)}get(e){return this.domains.get(e)}all(){return[...this.domains.values()]}roots(){return this.all().filter(e=>e.parentName===void 0)}children(e){return this.all().filter(t=>t.parentName===e)}ancestryOf(e){const t=[];let r=this.get(e);for(;r!==void 0;)t.unshift(r),r=r.parentName!==void 0?this.get(r.parentName):void 0;return t}}class J{constructor(e,t="LIRA"){l(this,"unsubscribe");this.board=e,this.title=t}mount(e){var t;this.ensureStyles(),(t=this.unsubscribe)==null||t.call(this),this.unsubscribe=this.board.subscribe(r=>{e.innerHTML=this.renderScreen(r)})}waitFor(...e){return new Promise(t=>{const r=i=>i==="done"||i==="error",n=i=>{const a=i.filter(d=>e.includes(d.id));a.length===e.length&&a.every(d=>r(d.state))&&(o(),t())},o=this.board.subscribe(n)})}destroy(){var e;(e=this.unsubscribe)==null||e.call(this),this.unsubscribe=void 0}renderScreen(e){return`
      <div class="loading-screen">
        <div class="loading-box">
          <div class="loading-title">${$(this.title)}</div>
          <div class="loading-subtitle">Initialising…</div>
          <div class="loading-steps">
            ${e.map(t=>this.renderStep(t)).join("")}
          </div>
        </div>
      </div>
    `}renderStep(e){return`
      <div class="loading-step state-${e.state}">
        <span class="loading-step-icon">${Q[e.state]}</span>
        <span class="loading-step-label">${$(e.label)}</span>
        <span class="loading-step-detail">${$(e.detail??X[e.state])}</span>
      </div>
    `}ensureStyles(){if(document.getElementById(L))return;const e=document.createElement("style");e.id=L,e.textContent=Z,document.head.appendChild(e)}}const X={"not-ported":"Not ported yet",idle:"Waiting…",running:"Working…",done:"Ready",error:"Failed"},Q={"not-ported":"–",idle:"○",running:'<span class="loading-spinner"></span>',done:"✓",error:"✕"};function $(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const L="lira-loading-screen-styles",Z=`
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
`,ee=300;class te{constructor(){l(this,"events",[]);l(this,"listeners",new Set)}append(e){this.events.push(e),this.events.length>ee&&this.events.shift(),this.notify()}all(){return[...this.events]}subscribe(e){return this.listeners.add(e),e(this.all()),()=>{this.listeners.delete(e)}}notify(){const e=this.all();for(const t of this.listeners)t(e)}}class re{constructor(e,t){this.source=e,this.sink=t}info(e){this.emit("info",e)}warn(e){this.emit("warn",e)}error(e){this.emit("error",e)}emit(e,t){this.sink({timestamp:Date.now(),level:e,source:this.source,message:t})}}class ne{constructor(e,t=[],r){l(this,"unsubscribeStatus");l(this,"unsubscribeLog");l(this,"collapsed",!1);l(this,"logCollapsed",!1);l(this,"latestStatuses",[]);l(this,"latestEvents",[]);l(this,"container");this.board=e,this.actions=t,this.logBoard=r}mount(e){var t,r;this.container=e,this.ensureStyles(),(t=this.unsubscribeStatus)==null||t.call(this),(r=this.unsubscribeLog)==null||r.call(this),e.addEventListener("click",n=>this.handleClick(n)),this.unsubscribeStatus=this.board.subscribe(n=>{this.latestStatuses=n,this.paint()}),this.logBoard&&(this.unsubscribeLog=this.logBoard.subscribe(n=>{this.latestEvents=n,this.paint()}))}destroy(){var e,t;(e=this.unsubscribeStatus)==null||e.call(this),this.unsubscribeStatus=void 0,(t=this.unsubscribeLog)==null||t.call(this),this.unsubscribeLog=void 0}paint(){this.container&&(this.container.innerHTML=this.renderPanel())}handleClick(e){const t=e.target.closest("[data-action]");if(!(!t||t.disabled)){if(t.dataset.action==="toggle")this.collapsed=!this.collapsed,this.paint();else if(t.dataset.action==="toggle-log")this.logCollapsed=!this.logCollapsed,this.paint();else if(t.dataset.action==="run"){const r=this.actions.find(n=>n.id===t.dataset.actionId);r==null||r.onClick()}}}renderPanel(){const e=this.latestStatuses,t=e.filter(r=>r.state==="running"||r.state==="done").length;return`
      <div class="service-status-panel ${this.collapsed?"collapsed":""}">
        <button type="button" class="service-status-header" data-action="toggle" aria-expanded="${!this.collapsed}">
          <span class="service-status-label">Background Services</span>
          ${this.collapsed?`<span class="service-status-summary">${t}/${e.length} running</span>`:""}
          <span class="service-status-chevron">${B}</span>
        </button>
        <div class="service-status-rows">
          ${e.map(r=>this.renderRow(r)).join("")}
        </div>
      </div>
      ${this.logBoard?this.renderLogPanel():""}
    `}renderRow(e){const t=this.actions.find(n=>n.id===e.id),r=e.progress!==void 0?`<div class="service-status-progress"><div class="service-status-progress-fill" style="width:${Math.round(e.progress*100)}%"></div></div>`:"";return`
      <div class="service-status-row-group">
        <div class="service-status-row state-${e.state}">
          <span class="service-status-dot"></span>
          <span class="service-status-name">${f(e.label)}</span>
          <span class="service-status-pill">${se[e.state]}</span>
          ${e.detail?`<span class="service-status-detail">${f(e.detail)}</span>`:""}
          ${t?`<button type="button" class="service-status-action" data-action="run" data-action-id="${f(t.id)}" ${e.state==="running"?"disabled":""}>${f(t.label)}</button>`:""}
        </div>
        ${r}
      </div>
    `}renderLogPanel(){const e=this.latestEvents;return`
      <div class="service-log-panel ${this.logCollapsed?"collapsed":""}">
        <button type="button" class="service-status-header" data-action="toggle-log" aria-expanded="${!this.logCollapsed}">
          <span class="service-status-label">Event Log</span>
          ${this.logCollapsed?`<span class="service-status-summary">${e.length} event${e.length===1?"":"s"}</span>`:""}
          <span class="service-status-chevron">${B}</span>
        </button>
        <div class="service-log-rows">
          ${e.length===0?'<div class="service-log-empty">No events yet.</div>':[...e].reverse().map(t=>this.renderLogRow(t)).join("")}
        </div>
      </div>
    `}renderLogRow(e){return`
      <div class="service-log-row level-${e.level}">
        <span class="service-log-time">${ie(e.timestamp)}</span>
        <span class="service-log-level-pill">${oe[e.level]}</span>
        <span class="service-log-source">${f(e.source)}</span>
        <span class="service-log-message">${f(e.message)}</span>
      </div>
    `}ensureStyles(){if(document.getElementById(N))return;const e=document.createElement("style");e.id=N,e.textContent=ae,document.head.appendChild(e)}}const se={"not-ported":"Not ported",idle:"Idle",running:"Running",done:"Running",error:"Error"},oe={info:"Info",warn:"Warn",error:"Error"};function f(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function ie(s){return new Date(s).toLocaleTimeString(void 0,{hour12:!1})}const B='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',N="lira-service-status-styles",ae=`
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
`,le=20*1024*1024;class ce{constructor(e=le){l(this,"root",{kind:"dir",children:new Map});l(this,"cwdPath",[]);this.capacity=e}get capacityBytes(){return this.capacity}usedBytes(){return S(this.root)}pwd(){return"/"+this.cwdPath.join("/")}changeDirectory(e){const t=this.resolveSegments(e),r=t.length===0?this.root:this.lookupNode(t);if(!r)throw new Error(`cd: ${e}: No such file or directory`);if(r.kind!=="dir")throw new Error(`cd: ${e}: Not a directory`);this.cwdPath=t}list(e){const t=e===void 0?this.cwdPath:this.resolveSegments(e),r=t.length===0?this.root:this.lookupNode(t);if(!r)throw new Error(`ls: cannot access '${e??"."}': No such file or directory`);return r.kind==="file"?[{name:t[t.length-1],kind:"file"}]:[...r.children.entries()].map(([n,o])=>({name:n,kind:o.kind})).sort((n,o)=>n.name.localeCompare(o.name))}makeDirectory(e){const t=this.resolveSegments(e);if(t.length===0)throw new Error(`mkdir: cannot create directory '${e}': File exists`);const r=this.lookupParentDir(t),n=t[t.length-1];if(!r)throw new Error(`mkdir: cannot create directory '${e}': No such file or directory`);if(r.children.has(n))throw new Error(`mkdir: cannot create directory '${e}': File exists`);r.children.set(n,{kind:"dir",children:new Map})}touch(e){var o;const t=this.resolveSegments(e);if(t.length===0)throw new Error(`touch: cannot touch '${e}': Is a directory`);const r=this.lookupParentDir(t),n=t[t.length-1];if(!r)throw new Error(`touch: cannot touch '${e}': No such file or directory`);if(((o=r.children.get(n))==null?void 0:o.kind)==="dir")throw new Error(`touch: cannot touch '${e}': Is a directory`);r.children.has(n)||r.children.set(n,{kind:"file",content:""})}writeFile(e,t,r={}){const n=this.resolveSegments(e);if(n.length===0)throw new Error(`${e}: Is a directory`);const o=this.lookupParentDir(n),i=n[n.length-1];if(!o)throw new Error(`${e}: No such file or directory`);const a=o.children.get(i);if((a==null?void 0:a.kind)==="dir")throw new Error(`${e}: Is a directory`);const d=r.append&&a?a.content+t:t,u=a?C(a.content):0,k=C(d);if(this.usedBytes()-u+k>this.capacity)throw new Error(`${e}: No space left on device`);o.children.set(i,{kind:"file",content:d})}readFile(e){const t=this.resolveSegments(e),r=t.length===0?this.root:this.lookupNode(t);if(!r)throw new Error(`cat: ${e}: No such file or directory`);if(r.kind!=="file")throw new Error(`cat: ${e}: Is a directory`);return r.content}remove(e,t={}){const r=this.resolveSegments(e);if(r.length===0)throw new Error(`rm: cannot remove '${e}': Device or resource busy`);const n=this.lookupParentDir(r),o=r[r.length-1],i=n==null?void 0:n.children.get(o);if(!n||!i)throw new Error(`rm: cannot remove '${e}': No such file or directory`);if(i.kind==="dir"&&!t.recursive)throw new Error(`rm: cannot remove '${e}': Is a directory`);n.children.delete(o)}move(e,t){const r=this.resolveSegments(e),n=this.lookupParentDir(r),o=r[r.length-1],i=r.length>0?n==null?void 0:n.children.get(o):void 0;if(!n||!i)throw new Error(`mv: cannot stat '${e}': No such file or directory`);const a=this.resolveDestination(t,o);if(!a.parent)throw new Error(`mv: cannot move '${e}' to '${t}': No such file or directory`);n.children.delete(o),a.parent.children.set(a.name,i)}copy(e,t,r={}){const n=this.resolveSegments(e),o=n.length===0?this.root:this.lookupNode(n);if(!o)throw new Error(`cp: cannot stat '${e}': No such file or directory`);if(o.kind==="dir"&&!r.recursive)throw new Error(`cp: -r not specified; omitting directory '${e}'`);const i=n[n.length-1]??"",a=this.resolveDestination(t,i);if(!a.parent)throw new Error(`cp: cannot create '${t}': No such file or directory`);if(this.usedBytes()+S(o)>this.capacity)throw new Error(`cp: ${t}: No space left on device`);a.parent.children.set(a.name,q(o))}toBlob(){return new Blob([JSON.stringify(z(this.root))],{type:"application/json"})}resolveSegments(e){const t=e.startsWith("/")?[]:[...this.cwdPath];for(const r of e.split("/"))if(!(r===""||r===".")){if(r===".."){t.length>0&&t.pop();continue}t.push(r)}return t}lookupNode(e){let t=this.root;for(const r of e){if(t.kind!=="dir")return;const n=t.children.get(r);if(!n)return;t=n}return t}lookupParentDir(e){const t=e.slice(0,-1),r=t.length===0?this.root:this.lookupNode(t);return(r==null?void 0:r.kind)==="dir"?r:void 0}resolveDestination(e,t){const r=this.resolveSegments(e),n=r.length===0?this.root:this.lookupNode(r);return(n==null?void 0:n.kind)==="dir"?{parent:n,name:t}:{parent:this.lookupParentDir(r),name:r[r.length-1]??t}}}function S(s){if(s.kind==="file")return C(s.content);let e=0;for(const t of s.children.values())e+=S(t);return e}function q(s){if(s.kind==="file")return{kind:"file",content:s.content};const e=new Map;for(const[t,r]of s.children)e.set(t,q(r));return{kind:"dir",children:e}}function z(s){if(s.kind==="file")return{kind:"file",content:s.content};const e={};for(const[t,r]of s.children)e[t]=z(r);return{kind:"dir",children:e}}function C(s){return new TextEncoder().encode(s).length}const de={name:"help",description:"list available commands",run:({commands:s})=>["Available commands:",...Object.values(s).sort((e,t)=>e.name.localeCompare(t.name)).map(e=>`  ${e.name.padEnd(8)}${e.description}`)]},pe={name:"clear",description:"clear the console",run:({clearScrollback:s})=>(s(),[])},ue={name:"pwd",description:"print the working directory",run:({fs:s})=>[s.pwd()]},he={name:"ls",description:"list directory contents",run:({fs:s,args:e})=>{const t=s.list(e[0]);return t.length===0?[]:[t.map(r=>r.kind==="dir"?`${r.name}/`:r.name).join("  ")]}},me={name:"cd",description:"change the working directory",run:({fs:s,args:e})=>(s.changeDirectory(e[0]??"/"),[])};function I(s,e){const t=[];for(const r of s)try{e(r)}catch(n){t.push(n instanceof Error?n.message:String(n))}return t}function b(s){return s<1024?`${s}B`:s<1024*1024?`${(s/1024).toFixed(1)}K`:s<1024*1024*1024?`${(s/(1024*1024)).toFixed(1)}M`:`${(s/(1024*1024*1024)).toFixed(1)}G`}const fe={name:"mkdir",description:"create a directory",run:({fs:s,args:e})=>{if(e.length===0)throw new Error("mkdir: missing operand");return I(e,t=>s.makeDirectory(t))}},ge={name:"touch",description:"create an empty file (no-op if it already exists)",run:({fs:s,args:e})=>{if(e.length===0)throw new Error("touch: missing operand");return I(e,t=>s.touch(t))}},ve={name:"cat",description:"print file contents",run:({fs:s,args:e})=>{if(e.length===0)throw new Error("cat: missing operand");const t=[];for(const r of e)try{t.push(s.readFile(r))}catch(n){t.push(n instanceof Error?n.message:String(n))}return t}},be={name:"echo",description:"print text, or write/append it to a file with > / >>",run:({fs:s,args:e})=>{const t=e.findIndex(o=>o===">"||o===">>");if(t===-1)return[e.join(" ")];const r=e[t]===">>",n=e[t+1];if(!n)throw new Error("lira: syntax error near unexpected token `newline'");return s.writeFile(n,e.slice(0,t).join(" ")+`
`,{append:r}),[]}},we={name:"rm",description:"remove files or directories (-r for directories)",run:({fs:s,args:e})=>{const t=e.some(n=>n.startsWith("-")&&n.includes("r")),r=e.filter(n=>!n.startsWith("-"));if(r.length===0)throw new Error("rm: missing operand");return I(r,n=>s.remove(n,{recursive:t}))}},ye={name:"mv",description:"move or rename a file or directory",run:({fs:s,args:e})=>{if(e.length!==2)throw new Error("mv: missing destination file operand");return s.move(e[0],e[1]),[]}},xe={name:"cp",description:"copy a file or directory (-r for directories)",run:({fs:s,args:e})=>{const t=e.some(n=>n.startsWith("-")&&n.includes("r")),r=e.filter(n=>!n.startsWith("-"));if(r.length!==2)throw new Error("cp: missing destination file operand");return s.copy(r[0],r[1],{recursive:t}),[]}},ke={name:"df",description:"show virtual filesystem capacity usage",run:({fs:s})=>{const e=s.usedBytes(),t=s.capacityBytes,r=t===0?0:Math.round(e/t*100);return["Filesystem      Size    Used    Avail   Use%",`blobfs          ${b(t).padEnd(8)}${b(e).padEnd(8)}${b(t-e).padEnd(8)}${r}%`]}},$e={"not-ported":"NOT PORTED",idle:"IDLE",running:"RUNNING",done:"DONE",error:"ERROR"};function Ee(s,e){if(s==="vocabulary")return e.vocabularyClient;if(s==="linguistics")return e.linguisticsClient}const Se={name:"ps",description:"list running Services with live memory metrics",run:async({services:s})=>{const e=s.statusBoard.all(),t=new Map;await Promise.all(e.map(async o=>{const i=Ee(o.id,s);if(i)try{t.set(o.id,await i.getMetrics())}catch{}}));const r="PID   SERVICE               STATE        UPTIME     HEAP          %HEAP",n=e.map((o,i)=>Ce(i+1,o,t.get(o.id)));return[r,...n]}};function Ce(s,e,t){const r=t?Ie(t.uptimeMs):"-",n=(t==null?void 0:t.heapUsedBytes)!==void 0&&t.heapLimitBytes!==void 0?`${b(t.heapUsedBytes)}/${b(t.heapLimitBytes)}`:"-",o=(t==null?void 0:t.heapUsedBytes)!==void 0&&t.heapLimitBytes?`${Math.round(t.heapUsedBytes/t.heapLimitBytes*100)}%`:"-";return`${String(s).padEnd(6)}${e.label.padEnd(22)}${$e[e.state].padEnd(13)}${r.padEnd(11)}${n.padEnd(14)}${o}`}function Ie(s){const e=Math.floor(s/1e3),t=Math.floor(e/3600),r=Math.floor(e%3600/60),n=e%60;return[t,r,n].map(o=>String(o).padStart(2,"0")).join(":")}const Le=["maxTextureDimension1D","maxTextureDimension2D","maxTextureDimension3D","maxTextureArrayLayers","maxBindGroups","maxBindGroupsPlusVertexBuffers","maxBindingsPerBindGroup","maxDynamicUniformBuffersPerPipelineLayout","maxDynamicStorageBuffersPerPipelineLayout","maxSampledTexturesPerShaderStage","maxSamplersPerShaderStage","maxStorageBuffersPerShaderStage","maxStorageTexturesPerShaderStage","maxUniformBuffersPerShaderStage","maxUniformBufferBindingSize","maxStorageBufferBindingSize","minUniformBufferOffsetAlignment","minStorageBufferOffsetAlignment","maxVertexBuffers","maxBufferSize","maxVertexAttributes","maxVertexBufferArrayStride","maxInterStageShaderVariables","maxColorAttachments","maxColorAttachmentBytesPerSample","maxComputeWorkgroupStorageSize","maxComputeInvocationsPerWorkgroup","maxComputeWorkgroupSizeX","maxComputeWorkgroupSizeY","maxComputeWorkgroupSizeZ","maxComputeWorkgroupsPerDimension"];function Be(s){return s.gpu}async function Ne(s){if(s.info)return s.info;if(typeof s.requestAdapterInfo=="function")return s.requestAdapterInfo()}function w(s){return s&&s.length>0?s:"-"}const Re={name:"gpu",description:"report real GPU adapter information via WebGPU",run:async()=>{const s=Be(navigator);if(!s)throw new Error("gpu: WebGPU is not supported in this browser (navigator.gpu is undefined)");const e=await s.requestAdapter();if(!e)throw new Error("gpu: WebGPU is supported, but no GPU adapter is available (requestAdapter() returned null)");const t=await Ne(e),r=Array.from(e.features).sort();return["Adapter",`  vendor               ${w(t==null?void 0:t.vendor)}`,`  architecture         ${w(t==null?void 0:t.architecture)}`,`  device               ${w(t==null?void 0:t.device)}`,`  description          ${w(t==null?void 0:t.description)}`,`  fallback adapter     ${e.isFallbackAdapter}`,`  preferred canvas fmt ${s.getPreferredCanvasFormat()}`,"",`Features (${r.length})`,...r.length>0?r.map(o=>`  ${o}`):["  (none)"],"","Limits",...Le.map(o=>`  ${o.padEnd(42)}${e.limits[o].toLocaleString()}`)]}},De=[de,pe,ue,he,me,fe,ge,ve,be,we,ye,xe,ke,Se,Re],R=Object.fromEntries(De.map(s=>[s.name,s]));class Me{constructor(e,t,r){l(this,"container");l(this,"collapsed",!1);l(this,"fs",new ce);l(this,"services");l(this,"lines",Te.map(e=>({kind:"banner",text:e})));l(this,"commandHistory",[]);l(this,"historyIndex");l(this,"draftBeforeRecall","");this.services={statusBoard:e,vocabularyClient:t,linguisticsClient:r}}mount(e){this.container=e,this.ensureStyles(),e.addEventListener("click",t=>this.handleClick(t)),e.addEventListener("keydown",t=>this.handleKeydown(t)),this.paint()}paint(){this.container&&(this.container.innerHTML=this.renderPanel(),this.focusInput(),this.scrollToBottom())}handleClick(e){const t=e.target;if(t.closest("[data-action='toggle-console']")){this.collapsed=!this.collapsed,this.paint();return}t.closest(".console-body")&&!t.closest("a,button")&&this.focusInput()}handleKeydown(e){const t=e.target;if(!t.classList.contains("console-input"))return;const r=t;if(e.key==="Enter"){e.preventDefault();const n=r.value;r.value="",this.historyIndex=void 0,this.runCommand(n)}else e.key==="ArrowUp"?(e.preventDefault(),this.recall(r,-1)):e.key==="ArrowDown"&&(e.preventDefault(),this.recall(r,1))}recall(e,t){if(this.commandHistory.length!==0){if(this.historyIndex===void 0){if(t===1)return;this.draftBeforeRecall=e.value,this.historyIndex=this.commandHistory.length-1}else{const r=this.historyIndex+t;if(r<0)return;if(r>=this.commandHistory.length){this.historyIndex=void 0,e.value=this.draftBeforeRecall;return}this.historyIndex=r}e.value=this.commandHistory[this.historyIndex]}}runCommand(e){const t=e.trim();if(this.lines.push({kind:"command",text:e,prompt:D(this.fs.pwd())}),t.length===0){this.paint();return}this.commandHistory.push(t);const[r,...n]=Ae(t),o=R[r.toLowerCase()];if(!o){this.lines.push({kind:"error",text:`lira: command not found: ${r} (not implemented yet)`}),this.paint();return}Promise.resolve(o.run({fs:this.fs,args:n,commands:R,clearScrollback:()=>this.lines=[],services:this.services})).then(i=>{for(const a of i)this.lines.push({kind:"output",text:a})}).catch(i=>{this.lines.push({kind:"error",text:i instanceof Error?i.message:String(i)})}).finally(()=>this.paint())}focusInput(){var e,t;(t=(e=this.container)==null?void 0:e.querySelector(".console-input"))==null||t.focus()}scrollToBottom(){var t;const e=(t=this.container)==null?void 0:t.querySelector(".console-lines");e&&(e.scrollTop=e.scrollHeight)}renderPanel(){return`
      <div class="console-panel ${this.collapsed?"collapsed":""}">
        <button type="button" class="console-header" data-action="toggle-console" aria-expanded="${!this.collapsed}">
          <span class="console-label">Console</span>
          ${this.collapsed?`<span class="console-summary">${this.commandHistory.length} command${this.commandHistory.length===1?"":"s"}</span>`:""}
          <span class="console-chevron">${Pe}</span>
        </button>
        <div class="console-body" role="log" aria-live="polite">
          <div class="console-lines">
            ${this.lines.map(e=>this.renderLine(e)).join("")}
          </div>
          <div class="console-prompt-row">
            <span class="console-prompt" aria-hidden="true">${y(D(this.fs.pwd()))}</span>
            <input type="text" class="console-input" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Console command input">
          </div>
        </div>
      </div>
    `}renderLine(e){return e.kind==="command"?`<div class="console-line console-line-command"><span class="console-prompt" aria-hidden="true">${y(e.prompt)}</span>${y(e.text)}</div>`:`<div class="console-line console-line-${e.kind}">${y(e.text)}</div>`}ensureStyles(){if(document.getElementById(M))return;const e=document.createElement("style");e.id=M,e.textContent=Fe,document.head.appendChild(e)}}const Te=["LIRA Operating System","Type 'help' to get started."];function D(s){return`lira:${s}$ `}function Ae(s){const e=[],t=/"([^"]*)"|(\S+)/g;let r;for(;(r=t.exec(s))!==null;)e.push(r[1]!==void 0?r[1]:r[2]);return e}function y(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const Pe='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',M="lira-console-styles",Fe=`
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
`;var p=(s=>(s[s.NOUN=0]="NOUN",s[s.VERB=1]="VERB",s[s.ADJECTIVE=2]="ADJECTIVE",s[s.ADVERB=3]="ADVERB",s[s.PRONOUN=4]="PRONOUN",s[s.DETERMINER=5]="DETERMINER",s[s.PREPOSITION=6]="PREPOSITION",s[s.CONJUNCTION=7]="CONJUNCTION",s[s.INTERJECTION=8]="INTERJECTION",s[s.NUMERAL=9]="NUMERAL",s[s.AUXILIARY=11]="AUXILIARY",s[s.PROPER_NOUN=12]="PROPER_NOUN",s[s.SYMBOL=13]="SYMBOL",s[s.PUNCTUATION=14]="PUNCTUATION",s[s.OTHER=15]="OTHER",s))(p||{});const Oe={[p[p.NOUN]]:"#3B6EA5",[p[p.PROPER_NOUN]]:"#274472",[p[p.VERB]]:"#B2542D",[p[p.ADJECTIVE]]:"#7A5CA6",[p[p.ADVERB]]:"#B08900",[p[p.PRONOUN]]:"#5B7B6F",[p[p.DETERMINER]]:"#6E7B8B",[p[p.PREPOSITION]]:"#7B6E5B",[p[p.CONJUNCTION]]:"#6B7280",[p[p.AUXILIARY]]:"#5B6E8B",[p[p.INTERJECTION]]:"#C2544B",[p[p.NUMERAL]]:"#4B8A7B",[p[p.SYMBOL]]:"#8A8A8A",[p[p.PUNCTUATION]]:"#9A9A9A",[p[p.OTHER]]:"#7A7A7A"},v={VALID:"#2B6E63",UNRESOLVED:"#B08900",INVALID:"#B2542D"},T=["A meaning is a representation.","The word over the meaning.","The use is a state.","The word wants to use the meaning.","The meaning and the word perceive the state."],A="lira-sentence-reader-styles";class Ve{constructor(e){l(this,"container");l(this,"reading",!1);l(this,"requestToken",0);l(this,"documentResult");l(this,"expandedNodes",new Set);l(this,"selectedKey");l(this,"detailCache",new Map);l(this,"detailToken",0);this.client=e}mount(e){this.container=e,this.ensureStyles(),e.innerHTML=this.renderShell(),this.wire();const t=e.querySelector(".lira-sr-textarea");t!=null&&t.value&&this.read(t.value)}destroy(){this.container=void 0}wire(){const e=this.container;if(!e)return;const t=e.querySelector(".lira-sr-textarea"),r=e.querySelector(".lira-sr-read-btn");t&&r&&(r.addEventListener("click",()=>void this.read(t.value)),t.addEventListener("keydown",o=>{(o.metaKey||o.ctrlKey)&&o.key==="Enter"&&this.read(t.value)})),e.querySelectorAll(".lira-sr-example").forEach(o=>{o.addEventListener("click",()=>{const i=o.dataset.example??"";t&&(t.value=i),this.read(i)})});const n=e.querySelector(".lira-sr-tree");n==null||n.addEventListener("click",o=>this.handleTreeClick(o)),n==null||n.addEventListener("keydown",o=>this.handleTreeKeydown(o))}handleTreeClick(e){const t=e.target,r=t.closest('[data-action="toggle-node"]');if(r){this.toggleNode(r.dataset.node??"");return}const n=t.closest('.lira-tree-row[data-kind="sentence"]');n&&this.selectSentenceNode(n.dataset.node??"")}handleTreeKeydown(e){if(e.key!=="Enter"&&e.key!==" ")return;const t=e.target;if(t.closest('[data-action="toggle-node"]'))return;const r=t.closest('.lira-tree-row[data-kind="sentence"]');r&&(e.preventDefault(),this.selectSentenceNode(r.dataset.node??""))}toggleNode(e){if(!e||!this.documentResult)return;const t=!this.expandedNodes.has(e);if(t?this.expandedNodes.add(e):this.expandedNodes.delete(e),t&&P(e)&&!this.detailCache.has(e)){this.selectSentenceNode(e);return}this.renderTreeInPlace()}renderTreeInPlace(){var t;if(!this.documentResult)return;const e=(t=this.container)==null?void 0:t.querySelector(".lira-sr-tree");e&&(e.innerHTML=this.renderTree(this.documentResult))}async selectSentenceNode(e){const t=this.documentResult,r=P(e);if(!t||!r)return;const n=t.blocks[r.blockIndex];if(!n||n.blockKind!=="paragraph")return;const o=n.sentences[r.sentenceIndex];if(!o)return;this.selectedKey=e,this.expandedNodes.add(`b${r.blockIndex}`),this.expandedNodes.add(e),this.renderTreeInPlace();const i=this.detailCache.get(e);if(i){this.renderDetail(i);return}this.setPanelPlaceholder(".lira-sr-predicted","Loading…"),this.setPanelPlaceholder(".lira-sr-winner-panel","Loading…"),this.setPanelPlaceholder(".lira-sr-trace","Loading…");const a=++this.detailToken,d=this.isLearningEnabled();try{const u=await this.client.read(o.text,d,!0);if(a!==this.detailToken||!this.container)return;this.detailCache.set(e,u),this.renderTreeInPlace(),this.renderDetail(u)}catch(u){if(a!==this.detailToken||!this.container)return;this.setError(u instanceof Error?u.message:String(u))}}isLearningEnabled(){var t;const e=(t=this.container)==null?void 0:t.querySelector(".lira-sr-learning-toggle");return(e==null?void 0:e.checked)??!0}async read(e){const t=e.trim();if(!t||this.reading)return;const r=++this.requestToken,n=this.isLearningEnabled();this.reading=!0,this.setBusy(!0),this.setError(void 0);try{const o=await this.client.readDocument(t,n);if(r!==this.requestToken||!this.container)return;this.renderDocument(o)}catch(o){if(r!==this.requestToken||!this.container)return;this.setError(o instanceof Error?o.message:String(o))}finally{r===this.requestToken&&(this.reading=!1,this.setBusy(!1))}}setBusy(e){var r;const t=(r=this.container)==null?void 0:r.querySelector(".lira-sr-read-btn");t&&(t.disabled=e,t.textContent=e?"Reading…":"Read")}setLearningStatus(e){var n;const t=(n=this.container)==null?void 0:n.querySelector(".lira-sr-learning-status");if(!t)return;if(!e||!e.enabled){t.textContent="Learning off";return}const r=e.recordedThisRead>0?` (+${e.recordedThisRead})`:"";t.textContent=`Learning: ${e.totalObservations} observation${e.totalObservations===1?"":"s"}${r}`}setError(e){var r;const t=(r=this.container)==null?void 0:r.querySelector(".lira-sr-error");t&&(t.textContent=e??"",t.style.display=e?"block":"none")}renderDocument(e){this.documentResult=e.document,this.detailCache.clear(),this.expandedNodes=new Set(["doc"]),this.selectedKey=void 0,this.setLearningStatus(e.learning);const t=je(e.document);if(t){this.selectSentenceNode(t);return}this.renderTreeInPlace(),this.setPanelPlaceholder(".lira-sr-predicted","No sentences found in this text."),this.setPanelPlaceholder(".lira-sr-winner-panel","No sentences found in this text."),this.setPanelPlaceholder(".lira-sr-trace","No sentences found in this text.")}renderDetail(e){var o,i,a;const t=(o=this.container)==null?void 0:o.querySelector(".lira-sr-predicted"),r=(i=this.container)==null?void 0:i.querySelector(".lira-sr-winner-panel"),n=(a=this.container)==null?void 0:a.querySelector(".lira-sr-trace");t&&(t.innerHTML=this.renderPredicted(e.predicted,e.words)),r&&(r.innerHTML=this.renderWinner(e.predicted,e.trace)),n&&(n.innerHTML=this.renderTrace(e.trace))}setPanelPlaceholder(e,t){var n;const r=(n=this.container)==null?void 0:n.querySelector(e);r&&(r.innerHTML=`<div class="lira-sr-placeholder">${c(t)}</div>`)}ensureStyles(){if(document.getElementById(A))return;const e=document.createElement("style");e.id=A,e.textContent=Ke,document.head.appendChild(e)}renderShell(){return`
      <div class="lira-sr">
        <div class="lira-sr-input-card">
          <textarea class="lira-sr-textarea" placeholder="e.g. A meaning is a representation.">${c(T[0])}</textarea>
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
            ${T.map(e=>`<button type="button" class="lira-sr-example" data-example="${c(e)}">${c(e)}</button>`).join("")}
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
    `}renderTree(e){const t=this.expandedNodes.has("doc"),r=v[e.validation]??"#7A7A7A",n=e.blocks.filter(d=>d.blockKind==="paragraph").length,o=e.blocks.length-n,i=e.blocks.reduce((d,u)=>d+(u.blockKind==="paragraph"?u.errors.length:0),0),a=[`${n} paragraph${n===1?"":"s"}`,o?`${o} heading${o===1?"":"s"}`:"",i?`${i} error${i===1?"":"s"}`:""].filter(Boolean).join(", ");return`
      <ul class="lira-tree-root">
        <li class="lira-tree-node">
          <div class="lira-tree-row" data-node="doc" data-kind="document">
            ${E("doc",t)}
            <span class="lira-tree-dot" style="background:${r}"></span>
            <span class="lira-tree-label">Document</span>
            ${t?"":`<span class="lira-tree-summary">${c(a)}</span>`}
          </div>
          ${t?`<ul>${e.blocks.map((d,u)=>this.renderBlockNode(d,u)).join("")}</ul>`:""}
        </li>
      </ul>`}renderBlockNode(e,t){const r=`b${t}`;if(e.blockKind==="heading")return`
        <li class="lira-tree-node lira-tree-leaf">
          <div class="lira-tree-row" data-node="${r}" data-kind="heading">
            <span class="lira-tree-spacer"></span>
            <span class="lira-tree-heading-pill">H${e.level}</span>
            <span class="lira-tree-label">${c(x(e.text,48))}</span>
          </div>
        </li>`;const n=this.expandedNodes.has(r),o=v[e.validation]??"#7A7A7A",i=[`${e.sentences.length} sentence${e.sentences.length===1?"":"s"}`,e.errors.length?`${e.errors.length} error${e.errors.length===1?"":"s"}`:""].filter(Boolean).join(", ");return`
      <li class="lira-tree-node">
        <div class="lira-tree-row" data-node="${r}" data-kind="paragraph">
          ${E(r,n)}
          <span class="lira-tree-dot" style="background:${o}"></span>
          <span class="lira-tree-label">Paragraph ${t+1}</span>
          ${n?"":`<span class="lira-tree-summary">${c(i)}</span>`}
        </div>
        ${n?`<ul>${e.sentences.map((a,d)=>this.renderSentenceNode(a,r,d)).join("")}</ul>`:""}
      </li>`}renderSentenceNode(e,t,r){const n=`${t}s${r}`,o=v[e.validation]??"#7A7A7A",i=this.expandedNodes.has(n),a=this.detailCache.get(n),d=i?`<ul>${a?a.predicted.clauses.map((u,k)=>this.renderClauseNode(u,`${n}c${k}`)).join(""):'<li class="lira-tree-node"><div class="lira-tree-row"><span class="lira-tree-spacer"></span><span class="lira-tree-summary">Loading…</span></div></li>'}</ul>`:"";return`
      <li class="lira-tree-node">
        <div class="lira-tree-row ${this.selectedKey===n?"selected":""}" data-node="${n}" data-kind="sentence" role="button" tabindex="0">
          ${E(n,i)}
          <span class="lira-tree-dot" style="background:${o}"></span>
          <span class="lira-tree-label">Sentence ${r+1}</span>
          <span class="lira-tree-snippet">${c(x(e.text,40))}</span>
          ${e.errors.length?`<span class="lira-tree-error-count">${e.errors.length}</span>`:""}
        </div>
        ${d}
      </li>`}renderClauseNode(e,t,r){const n=v[e.validation]??"#7A7A7A",i=[["subject",e.subject],["predicate",e.predicate],["object",e.object],["complement",e.complement],...e.modifiers.map(a=>["modifier",a])].filter(a=>a[1]!==null).map(([a,d],u)=>U(d)?this.renderClauseNode(d,`${t}r${u}`,a):this.renderPhraseNode(d,`${t}r${u}`,a)).join("");return`
      <li class="lira-tree-node">
        <div class="lira-tree-row" data-node="${t}" data-kind="clause">
          <span class="lira-tree-spacer"></span>
          <span class="lira-tree-dot" style="background:${n}"></span>
          ${r?`<span class="lira-tree-role-pill">${c(r)}</span>`:""}
          <span class="lira-tree-label">Clause</span>
          <span class="lira-tree-summary">${c(e.clauseType??"?")}</span>
          <span class="lira-tree-snippet">${c(x(e.text,40))}</span>
        </div>
        ${i?`<ul>${i}</ul>`:""}
      </li>`}renderPhraseNode(e,t,r){const n=v[e.validation]??"#7A7A7A",o=e.nestedPhrases.map((i,a)=>this.renderPhraseNode(i,`${t}n${a}`)).join("");return`
      <li class="lira-tree-node">
        <div class="lira-tree-row" data-node="${t}" data-kind="phrase">
          <span class="lira-tree-spacer"></span>
          <span class="lira-tree-dot" style="background:${n}"></span>
          ${r?`<span class="lira-tree-role-pill">${c(r)}</span>`:""}
          <span class="lira-tree-label">Phrase</span>
          <span class="lira-tree-summary">${c(e.phraseType??"?")}</span>
          <span class="lira-tree-snippet">${c(x(e.text,40))}</span>
        </div>
        ${o?`<ul>${o}</ul>`:""}
      </li>`}renderWinner(e,t){const r=e.clauses[0],o=(r?[["subject",r.subject],["predicate",r.predicate],["object",r.object],["complement",r.complement],...r.modifiers.map(a=>["modifier",a])]:[]).map(([a,d])=>H(a,d)).join(""),i=t.length?`<div class="lira-sr-winner-positions">
          ${t.map(a=>`
            <span class="lira-sr-winner-chip">
              <span class="lira-sr-mono lira-sr-faint">#${a.startIndex}</span>
              <span class="lira-sr-strong lira-sr-mono">${c(a.tokenText??"")}</span>
              <span class="lira-sr-faint">${c(a.winnerPhraseType??"none")}</span>
            </span>`).join("")}
        </div>`:"";return`
      <div class="lira-sr-winner-head">
        ${F(e.validation)}
        <span class="lira-sr-strong">${c(e.sentenceType??"UNRESOLVED")}</span>
        <span class="lira-sr-faint">confidence ${e.confidence.toFixed(2)}</span>
      </div>
      ${o?`<div class="lira-sr-winner-roles">${o}</div>`:""}
      ${i}
    `}renderPredicted(e,t){return`${`
      <div class="lira-sr-clause-head">
        ${F(e.validation)}
        <span class="lira-sr-strong">${c(e.sentenceType??"UNRESOLVED")}</span>
        <span class="lira-sr-faint">confidence ${e.confidence.toFixed(2)}</span>
        <span class="lira-sr-faint">${e.punctuation?`terminal "${c(e.punctuation)}"`:"no terminal punctuation"}</span>
      </div>`}${qe(t)}${_e(e.errors)}`}renderTrace(e){return e.length?e.map(t=>this.renderPosition(t)).join(""):'<div class="lira-sr-empty">No trace positions recorded.</div>'}renderPosition(e){const t=e.candidatePartsOfSpeech.length?e.candidatePartsOfSpeech.join(", "):e.isKnown===!1?"unseeded":"",r=e.winnerPartsOfSpeech.length?`<div class="lira-sr-winner-pos">
          <span class="lira-sr-faint">Predicted part(s) of speech:</span>
          ${e.winnerPartsOfSpeech.map(n=>_(n.text,n.partOfSpeech)).join("")}
        </div>`:"";return`
      <div class="lira-sr-position">
        <div class="lira-sr-position-head">
          <span class="lira-sr-mono lira-sr-faint">#${e.startIndex}</span>
          <span class="lira-sr-strong lira-sr-mono">${c(e.tokenText??"")}</span>
          <span class="lira-sr-faint">${c(t)}</span>
          <span class="lira-sr-winner">&#8594; won by ${c(e.winnerPhraseType??"none")}</span>
        </div>
        ${r}
        ${e.attempts.map(n=>this.renderAttempt(n)).join("")}
      </div>`}renderAttempt(e){const t=e.completions.length?e.completions.map(r=>`
          <div class="lira-sr-completion ${r.isWinner?"winner":""}">
            ${r.isWinner?'<span class="lira-sr-win-mark">&#10003; winner</span>':""}
            "${c(r.text)}" — ${c(r.validation)}, confidence ${r.confidence.toFixed(2)}
            ${He(r.tokens)}
          </div>`).join(""):e.rejectionReason?`<div class="lira-sr-rejection">${c(e.rejectionReason)}</div>`:"";return`
      <div class="lira-sr-attempt ${e.startMatch?"":"rejected"}">
        <div class="lira-sr-attempt-head">
          <span class="lira-sr-attempt-type">${c(e.phraseType)}</span>
          <span class="lira-sr-match-mark ${e.startMatch?"yes":"no"}">${e.startMatch?"start matched":"no start match"}</span>
          <span class="lira-sr-faint lira-sr-mono">requires: ${e.requiredStart.map(c).join(", ")}</span>
        </div>
        ${t}
      </div>`}}function U(s){return"clauseType"in s}function H(s,e){if(!e)return"";if(U(e)){const t=[["subject",e.subject],["predicate",e.predicate],["object",e.object],["complement",e.complement],...e.modifiers.map(r=>["modifier",r])];return`
      <div class="lira-sr-winner-role-row">
        <span class="lira-sr-winner-role-label">${c(s)}</span>
        <span class="lira-sr-mono">"${c(e.text)}"</span>
        <span class="lira-sr-faint">embedded clause · ${c(e.clauseType??"?")}</span>
      </div>
      <div class="lira-sr-winner-roles lira-sr-winner-roles-nested">${t.map(([r,n])=>H(r,n)).join("")}</div>`}return`
    <div class="lira-sr-winner-role-row">
      <span class="lira-sr-winner-role-label">${c(s)}</span>
      <span class="lira-sr-mono">"${c(e.text)}"</span>
      <span class="lira-sr-faint">${c(e.phraseType??"?")}</span>
    </div>`}function E(s,e){return`<button type="button" class="lira-tree-toggle" data-action="toggle-node" data-node="${s}" aria-expanded="${e}">${We}</button>`}function x(s,e){const t=s.trim();return t.length>e?`${t.slice(0,e-1)}…`:t}function P(s){const e=/^b(\d+)s(\d+)$/.exec(s);if(e)return{blockIndex:Number(e[1]),sentenceIndex:Number(e[2])}}function je(s){for(let e=0;e<s.blocks.length;e+=1){const t=s.blocks[e];if(t.blockKind!=="paragraph")continue;const r=t.sentences.findIndex(n=>n.errors.length>0);if(r>=0)return`b${e}s${r}`}for(let e=0;e<s.blocks.length;e+=1){const t=s.blocks[e];if(t.blockKind==="paragraph"&&t.sentences.length>0)return`b${e}s0`}}function qe(s){if(!s.length)return'<div class="lira-sr-empty">No words to show.</div>';let e="";return s.forEach((t,r)=>{const n=/^[.,!?;:]+$/.test(t.text);r>0&&!n&&(e+=" "),e+=ze(t,r)}),`<div class="lira-sr-sentence">${e}</div>`}function ze(s,e){return`<span class="lira-sr-word${s.resolved?"":" lira-sr-word-unfound"}" tabindex="0" data-word-index="${e}">${c(s.text)}${Ue(s)}</span>`}function Ue(s){if(!s.resolved)return`<span class="lira-sr-word-tooltip"><span class="tt-title">${c(s.text)}</span><span class="tt-meta">Not found in the Common Vocabulary Cache</span></span>`;const e=[s.validation??"UNRESOLVED",s.phraseType??"no phrase"],t=[s.partOfSpeech??"?",`conf ${s.confidence!==null?s.confidence.toFixed(2):"—"}`];return`<span class="lira-sr-word-tooltip"><span class="tt-title">${c(s.text)}</span><span class="tt-meta">${e.map(c).join(" · ")}</span><span class="tt-meta">${t.map(c).join(" · ")}</span></span>`}function F(s){return`<span class="lira-sr-badge" style="background:${v[s]??"#7A7A7A"}">${c(s)}</span>`}function _(s,e){return`
    <span class="lira-sr-pos-chip" style="background:${Oe[e]??"#7A7A7A"}">
      <span class="w">${c(s)}</span>
      <span class="p">${c(e)}</span>
    </span>`}function He(s){return s.length?`<div class="lira-sr-trace-tokens">${s.map(t=>_(t.text,t.partOfSpeech??"UNKNOWN")).join("")}</div>`:""}function _e(s){return s.length?`
    <div class="lira-sr-errors">
      ${s.map(e=>`
        <div class="lira-sr-error-row">
          <span class="lira-sr-strong">${c(e.kind)}:</span>
          ${c(e.message)}${e.tokenText?` ("${c(e.tokenText)}")`:""}
        </div>`).join("")}
    </div>`:""}function c(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const We='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',Ke=`
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
`,g="Common",O=[{id:"vocabulary",label:"Vocabulary",available:!0},{id:"linguistics",label:"Linguistics",available:!0},{id:"knowledge",label:"Knowledge",available:!1}],V="lira-portal-shell-styles",j="lira-vocabulary-fragment-styles";class Ge{constructor(e,t,r,n,o={}){l(this,"mode");l(this,"mobileScreen","browse");l(this,"selectedName");l(this,"selectedComponent","vocabulary");l(this,"treeCollapsed",!1);l(this,"title");l(this,"container");l(this,"serviceStatusView");l(this,"consoleView");l(this,"sentenceReaderView");l(this,"logBoard",new te);l(this,"loggersBySource",new Map);l(this,"renderToken",0);l(this,"ioInFlight",!1);l(this,"domainSnapshots",new Map);l(this,"currentVocabularyDomainName");var i;this.registry=e,this.vocabularyClient=t,this.statusBoard=n,this.title=o.title??"LIRA",this.mode=typeof window<"u"&&window.matchMedia("(max-width: 720px)").matches?"mobile":"desktop",this.selectedName=(i=this.registry.roots()[0])==null?void 0:i.name,this.serviceStatusView=new ne(n,[],this.logBoard),this.consoleView=new Me(n,t,r),this.sentenceReaderView=new Ve(r),this.vocabularyClient.onLog((a,d,u)=>{this.loggerFor(d)[a](u)}),this.statusBoard.subscribe(a=>{const d=a.find(u=>u.id==="vocabulary");d&&this.updateVocabToolbar(d)}),this.vocabularyClient.onDomainUpdated(a=>{this.registry.add(a),this.render()}),this.vocabularyClient.onDomainSnapshot((a,d)=>{this.handleDomainSnapshot(a,d)}),this.searchWordsBridge(),this.searchPhrasesBridge(),this.searchSensesBridge(),this.searchRelationshipsBridge(),this.searchLexicalRelationshipsBridge(),this.resolveHierarchyBridge()}searchWordsBridge(){document.addEventListener("lira-search-words",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchWords(this.currentVocabularyDomainName,{wordId:t.wordId,word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,domainLabel:t.domain,rootWordsOnly:t.rootWordsOnly,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-words-result",{detail:{requestId:t.requestId,words:r.words,totalMatches:r.totalMatches}}))})})}searchPhrasesBridge(){document.addEventListener("lira-search-phrases",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchPhrases(this.currentVocabularyDomainName,{word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-phrases-result",{detail:{requestId:t.requestId,phrases:r.phrases,totalMatches:r.totalMatches}}))})})}searchSensesBridge(){document.addEventListener("lira-search-senses",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchSenses(this.currentVocabularyDomainName,{word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-senses-result",{detail:{requestId:t.requestId,senses:r.senses,totalMatches:r.totalMatches}}))})})}searchRelationshipsBridge(){document.addEventListener("lira-search-relationships",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchRelationships(this.currentVocabularyDomainName,{wordId:t.wordId,query:t.query,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-relationships-result",{detail:{requestId:t.requestId,relationships:r.relationships,totalMatches:r.totalMatches}}))})})}searchLexicalRelationshipsBridge(){document.addEventListener("lira-search-lexical-relationships",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchLexicalRelationships(this.currentVocabularyDomainName,{wordId:t.wordId,query:t.query,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-lexical-relationships-result",{detail:{requestId:t.requestId,relationships:r.relationships,totalMatches:r.totalMatches}}))})})}resolveHierarchyBridge(){document.addEventListener("lira-resolve-hierarchy",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.resolveHierarchy(this.currentVocabularyDomainName,{kind:t.kind,wordId:t.wordId,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-resolve-hierarchy-result",{detail:{requestId:t.requestId,...r}}))})})}mount(e){this.container=e,document.title=this.title,this.ensureStyles(),e.addEventListener("click",t=>this.handleClick(t)),e.addEventListener("change",t=>this.handleFileInputChange(t)),this.render()}handleClick(e){var n,o;const t=e.target.closest("[data-action]");if(!t||t.disabled)return;const r=t.dataset.action;r==="select"?(this.selectedName=t.dataset.domain,this.mode==="mobile"&&(this.mobileScreen="view"),this.render()):r==="mode"?(this.mode=t.dataset.mode,this.mode==="mobile"&&(this.mobileScreen=this.selectedName?"view":"browse"),this.render()):r==="back"?(this.mobileScreen="browse",this.render()):r==="component"?(this.selectedComponent=t.dataset.component,this.render()):r==="toggle-tree"?(this.treeCollapsed=!this.treeCollapsed,this.render()):r==="seed-wordnet"?this.vocabularyClient.seedWordNet(g):r==="seed-common-vocabulary"?this.vocabularyClient.seedCommonVocabulary(g):r==="save-vocabulary"?this.saveVocabulary():r==="load-vocabulary"&&((o=(n=this.container)==null?void 0:n.querySelector(".portal-vocab-file-input"))==null||o.click())}saveVocabulary(){this.ioInFlight=!0,this.render();const e=g.toLowerCase();this.vocabularyClient.exportDomain(g).then(t=>{m(t.words,`${e}-words.json`),m(t.phrases,`${e}-phrases.json`),m(t.wordForms,`${e}-word_forms.json`),m(t.senses,`${e}-senses.json`),m(t.coordinations,`${e}-coordinations.json`),m(t.semanticRelationships,`${e}-semantic-relationships.json`),m(t.lexicalRelationships,`${e}-lexical-relationships.json`)}).catch(()=>{}).finally(()=>{this.ioInFlight=!1,this.render()})}handleFileInputChange(e){const t=e.target;if(!t.classList.contains("portal-vocab-file-input")||!t.files||t.files.length===0)return;const r=[...t.files];t.value="",this.ioInFlight=!0,this.render(),Promise.all(r.map(async n=>{const o=Ye(n.name);return o?[o,await n.text()]:void 0})).then(n=>{const o={};for(const i of n)i&&(o[i[0]]=i[1]);return this.vocabularyClient.importDomain(g,o)}).catch(()=>{}).finally(()=>{this.ioInFlight=!1,this.render()})}handleDomainSnapshot(e,t){const r=this.domainSnapshots.get(e);if(r)for(const a of r)URL.revokeObjectURL(a.url);const n=e.toLowerCase(),o=[["Words",`${n}-words.json`,t.words],["Phrases",`${n}-phrases.json`,t.phrases],["Word Forms",`${n}-word_forms.json`,t.wordForms],["Senses",`${n}-senses.json`,t.senses],["Coordinations",`${n}-coordinations.json`,t.coordinations],["Semantic Relationships",`${n}-semantic-relationships.json`,t.semanticRelationships],["Lexical Relationships",`${n}-lexical-relationships.json`,t.lexicalRelationships]];this.domainSnapshots.set(e,o.map(([a,d,u])=>({label:a,filename:d,url:URL.createObjectURL(new Blob([u],{type:"application/json"}))})));const i=this.statusBoard.get("vocabulary");i&&this.updateVocabToolbar(i)}renderVocabToolbar(){return`<div class="portal-vocab-toolbar">${this.vocabToolbarInner(this.statusBoard.get("vocabulary"))}</div>`}vocabToolbarInner(e){const t=(e==null?void 0:e.state)==="running",r=t||this.ioInFlight,n=e==null?void 0:e.progress;return`
      <button type="button" class="portal-vocab-toolbar-action" data-action="seed-common-vocabulary" ${t?"disabled":""}>Seed Vocabulary</button>
      <button type="button" class="portal-vocab-toolbar-action" data-action="seed-wordnet" ${t?"disabled":""}>Load WordNet</button>
      <button type="button" class="portal-vocab-toolbar-action" data-action="save-vocabulary" ${r?"disabled":""}>Save</button>
      <button type="button" class="portal-vocab-toolbar-action" data-action="load-vocabulary" ${r?"disabled":""}>Load from File</button>
      <input type="file" class="portal-vocab-file-input" multiple accept=".json" style="display:none">
      <span class="portal-vocab-toolbar-detail">${e!=null&&e.detail?h(e.detail):""}</span>
      ${n!==void 0?`<div class="portal-vocab-toolbar-progress"><div class="portal-vocab-toolbar-progress-fill" style="width:${Math.round(n*100)}%"></div></div>`:""}
      ${this.snapshotLinksHtml()}
    `}snapshotLinksHtml(){const e=this.domainSnapshots.get(g);return!e||e.length===0?"":`<div class="portal-vocab-snapshot-links"><span class="portal-vocab-snapshot-label">Last seed snapshot:</span>${e.map(r=>`<a class="portal-vocab-snapshot-link" href="${r.url}" download="${h(r.filename)}">${h(r.label)}</a>`).join("")}</div>`}updateVocabToolbar(e){var r;const t=(r=this.container)==null?void 0:r.querySelector(".portal-vocab-toolbar");t&&(t.innerHTML=this.vocabToolbarInner(e))}loggerFor(e){let t=this.loggersBySource.get(e);return t||(t=new re(e,r=>this.logBoard.append(r)),this.loggersBySource.set(e,t)),t}ensureStyles(){if(document.getElementById(V))return;const e=document.createElement("style");e.id=V,e.textContent=ot,document.head.appendChild(e)}ensureFragmentStyles(e){if(document.getElementById(j))return;const t=document.createElement("style");t.id=j,t.textContent=e,document.head.appendChild(t)}render(){if(!this.container)return;const e=this.selectedName?this.registry.get(this.selectedName):void 0;this.renderToken++;const t=this.mode==="desktop"&&this.treeCollapsed?"tree-collapsed":"";this.container.innerHTML=`
      <div class="portal-shell mode-${this.mode} ${t}">
        ${this.renderTopbar(e)}
        <div class="portal-body">
          ${this.renderBody(e)}
        </div>
      </div>
    `;const r=this.container.querySelector(".portal-service-status");r&&this.serviceStatusView.mount(r);const n=this.container.querySelector(".portal-console");n&&this.consoleView.mount(n),e&&this.selectedComponent==="vocabulary"?this.loadView(e):e&&this.selectedComponent==="linguistics"&&this.loadLinguisticsView()}loadLinguisticsView(){if(!this.container)return;const e=this.container.querySelector(".portal-fragment-mount");e&&this.sentenceReaderView.mount(e)}async loadView(e){const t=++this.renderToken;this.setViewStatus("Loading Vocabulary…");let r;try{r=await this.vocabularyClient.renderDomain(e.name)}catch(o){if(t!==this.renderToken)return;this.setViewStatus(`Couldn't load this Domain's Vocabulary view: ${o instanceof Error?o.message:String(o)}`);return}if(t!==this.renderToken||!this.container)return;this.ensureFragmentStyles(r.style);const n=this.container.querySelector(".portal-fragment-mount");if(n){n.innerHTML=r.body,this.currentVocabularyDomainName=e.name;const o=document.createElement("script");o.textContent=`(function () {
${r.script}
})();`,n.appendChild(o)}this.setViewStatus(void 0)}setViewStatus(e){var r;const t=(r=this.container)==null?void 0:r.querySelector(".portal-view-status");t&&(t.textContent=e??"",t.style.display=e?"block":"none")}renderTopbar(e){const t=`
      <div class="portal-mode-toggle" role="group" aria-label="Layout">
        <button type="button" data-action="mode" data-mode="desktop" class="${this.mode==="desktop"?"active":""}">${tt} Desktop</button>
        <button type="button" data-action="mode" data-mode="mobile" class="${this.mode==="mobile"?"active":""}">${rt} Mobile</button>
      </div>`;if(this.mode==="mobile")return this.mobileScreen==="view"&&e?`
          <div class="portal-topbar">
            <button type="button" class="portal-back" data-action="back" aria-label="Back to Domains">${et}</button>
            <span class="portal-topbar-title">${h(e.name)}</span>
            ${t}
          </div>`:`<div class="portal-topbar"><span class="portal-topbar-title">All Domains</span>${t}</div>`;const r=e?this.registry.ancestryOf(e.name):[];return`<div class="portal-topbar"><nav class="portal-breadcrumb">${[`<span class="crumb-root">${Ze} All Domains</span>`,...r.map(o=>`<span>${h(o.name)}</span>`)].join(`<span class="crumb-sep">${Qe}</span>`)}</nav>${t}</div>`}renderBody(e){return this.mode==="desktop"?`${this.renderTree()}${this.renderViewPane(e)}`:this.mobileScreen==="browse"?`<div class="portal-tree portal-tree--mobile">${this.renderTreeRows(0)}</div>`:this.renderViewPane(e,!0)}renderTree(){return this.treeCollapsed?`
        <nav class="portal-tree portal-tree--collapsed">
          <button type="button" class="portal-tree-toggle" data-action="toggle-tree" title="Expand Domains" aria-label="Expand Domains" aria-expanded="false">${st}</button>
        </nav>`:`
      <nav class="portal-tree">
        <div class="portal-tree-label">
          <span>Domains</span>
          <button type="button" class="portal-tree-toggle" data-action="toggle-tree" title="Collapse Domains" aria-label="Collapse Domains" aria-expanded="true">${nt}</button>
        </div>
        ${this.renderTreeRows(0)}
      </nav>`}renderTreeRows(e,t){return(e===0?this.registry.roots():this.registry.children(t??"")).map(n=>{const o=this.registry.children(n.name),i=n.name===this.selectedName;return`
          <div class="portal-tree-row depth-${e} ${i?"selected":""}" data-action="select" data-domain="${h(n.name)}">
            ${o.length>0?Xe:'<span class="chev-spacer"></span>'}
            ${Je}
            <span class="name">${h(n.name)}</span>
            <span class="count">${n.wordCount.toLocaleString()}</span>
          </div>
          ${o.length>0?this.renderTreeRows(e+1,n.name):""}
        `}).join("")}renderComponentSwitcher(){return`
      <div class="portal-component-switcher" role="tablist" aria-label="UI Component">
        ${O.map(e=>`
          <button
            type="button"
            role="tab"
            data-action="component"
            data-component="${e.id}"
            class="${e.id===this.selectedComponent?"active":""}"
            ${e.available?"":"disabled"}
            title="${e.available?"":"Not ported yet"}"
            aria-selected="${e.id===this.selectedComponent}"
          >${h(e.label)}${e.available?"":' <span class="not-ported-badge">Not ported</span>'}</button>
        `).join("")}
      </div>`}renderViewPane(e,t=!1){const r=this.renderComponentSwitcher(),n='<div class="portal-console"></div>',o='<div class="portal-service-status"></div>',i=this.selectedComponent==="vocabulary"?this.renderVocabToolbar():"";if(!e)return`
        <div class="portal-view ${t?"portal-view--full":""}">
          ${r}
          ${i}
          <div class="portal-view-empty">Select a Domain to continue.</div>
          ${n}
          ${o}
        </div>`;const a=O.find(u=>u.id===this.selectedComponent),d=a!=null&&a.available?`
        <div class="portal-view-status" style="display:none"></div>
        <div class="portal-fragment-mount"></div>`:`<div class="portal-view-empty">${h((a==null?void 0:a.label)??"This component")} is not ported yet.</div>`;return`
      <div class="portal-view ${t?"portal-view--full":""}">
        ${r}
        ${i}
        ${d}
        ${n}
        ${o}
      </div>`}}function h(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function m(s,e){const t=new Blob([s],{type:"application/json"}),r=URL.createObjectURL(t),n=document.createElement("a");n.href=r,n.download=e,n.click(),URL.revokeObjectURL(r)}function Ye(s){const e=s.toLowerCase();if(e.includes("word_forms")||e.includes("wordforms"))return"wordForms";if(e.includes("words"))return"words";if(e.includes("phrases"))return"phrases";if(e.includes("senses"))return"senses";if(e.includes("coordinations"))return"coordinations";if(e.includes("semantic"))return"semanticRelationships";if(e.includes("lexical"))return"lexicalRelationships"}const Je='<svg class="i-folder" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.5A1 1 0 0 1 2.5 2.5h3.6l1.2 1.4H13.5A1 1 0 0 1 14.5 5v7A1 1 0 0 1 13.5 13h-11a1 1 0 0 1-1-1v-8.5z"/></svg>',Xe='<svg class="i-chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',Qe='<svg class="i-chev-right" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>',Ze='<svg class="i-home" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 8l6-5 6 5M4 7v6h8V7"/></svg>',et='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3L5 8l5 5"/></svg>',tt='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1.5" y="2.5" width="13" height="9" rx="1"/><path d="M6 13.5h4"/></svg>',rt='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4.5" y="1.5" width="7" height="13" rx="1.4"/></svg>',nt='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3L5 8l5 5"/></svg>',st='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>',ot=`
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
.portal-service-status { flex: none; }
`;class it{constructor(){l(this,"worker");l(this,"statusListeners",new Set);l(this,"domainUpdateListeners",new Set);l(this,"domainSnapshotListeners",new Set);l(this,"logListeners",new Set);l(this,"readyResolvers",[]);l(this,"pendingRenders",new Map);l(this,"pendingExports",new Map);l(this,"pendingImports",new Map);l(this,"pendingSearches",new Map);l(this,"pendingPhraseSearches",new Map);l(this,"pendingSenseSearches",new Map);l(this,"pendingRelationshipSearches",new Map);l(this,"pendingLexicalRelationshipSearches",new Map);l(this,"pendingHierarchyResolutions",new Map);l(this,"pendingMetrics",new Map);this.worker=new Worker(new URL(""+new URL("vocabulary_worker-CkVPRZ5X.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.addEventListener("message",e=>{this.handleMessage(e.data)})}onStatus(e){return this.statusListeners.add(e),()=>{this.statusListeners.delete(e)}}onLog(e){return this.logListeners.add(e),()=>{this.logListeners.delete(e)}}init(){return new Promise(e=>{this.readyResolvers.push(e),this.post({type:"init"})})}linkPort(e){this.worker.postMessage({type:"link-port",port:e},[e])}renderDomain(e){const t=`${e}-${Math.random().toString(36).slice(2)}`;return new Promise((r,n)=>{this.pendingRenders.set(t,{resolve:r,reject:n}),this.post({type:"render",requestId:t,domain:e})})}exportDomain(e){const t=`export-${e}-${Math.random().toString(36).slice(2)}`;return new Promise((r,n)=>{this.pendingExports.set(t,{resolve:r,reject:n}),this.post({type:"export-domain",requestId:t,domain:e})})}importDomain(e,t){const r=`import-${e}-${Math.random().toString(36).slice(2)}`;return new Promise((n,o)=>{this.pendingImports.set(r,{resolve:n,reject:o}),this.post({type:"import-domain",requestId:r,domain:e,...t})})}getMetrics(){const e=`metrics-${Math.random().toString(36).slice(2)}`;return new Promise(t=>{this.pendingMetrics.set(e,t),this.post({type:"metrics",requestId:e})})}seedWordNet(e){this.post({type:"seed-wordnet",domain:e})}seedCommonVocabulary(e){this.post({type:"seed-common-vocabulary",domain:e})}onDomainUpdated(e){return this.domainUpdateListeners.add(e),()=>{this.domainUpdateListeners.delete(e)}}onDomainSnapshot(e){return this.domainSnapshotListeners.add(e),()=>{this.domainSnapshotListeners.delete(e)}}searchWords(e,t){const r=`search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(n=>{this.pendingSearches.set(r,n),this.post({type:"search-words",requestId:r,domain:e,wordId:t.wordId,word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,domainLabel:t.domainLabel,rootWordsOnly:t.rootWordsOnly,limit:t.limit})})}searchPhrases(e,t){const r=`phrase-search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(n=>{this.pendingPhraseSearches.set(r,n),this.post({type:"search-phrases",requestId:r,domain:e,word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,limit:t.limit})})}searchSenses(e,t){const r=`sense-search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(n=>{this.pendingSenseSearches.set(r,n),this.post({type:"search-senses",requestId:r,domain:e,word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,limit:t.limit})})}searchRelationships(e,t){const r=`rel-search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(n=>{this.pendingRelationshipSearches.set(r,n),this.post({type:"search-relationships",requestId:r,domain:e,wordId:t.wordId,query:t.query,limit:t.limit})})}searchLexicalRelationships(e,t){const r=`lexical-rel-search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(n=>{this.pendingLexicalRelationshipSearches.set(r,n),this.post({type:"search-lexical-relationships",requestId:r,domain:e,wordId:t.wordId,query:t.query,limit:t.limit})})}resolveHierarchy(e,t){const r=`hierarchy-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(n=>{this.pendingHierarchyResolutions.set(r,n),this.post({type:"resolve-hierarchy",requestId:r,domain:e,kind:t.kind,wordId:t.wordId,limit:t.limit})})}post(e){this.worker.postMessage(e)}handleMessage(e){if(e.type==="status")for(const t of this.statusListeners)t(e.state,e.detail,e.progress);else if(e.type==="ready"){const t=this.readyResolvers.splice(0);for(const r of t)r(e.domains)}else if(e.type==="rendered"){const t=this.pendingRenders.get(e.requestId);t&&(this.pendingRenders.delete(e.requestId),t.resolve(e.fragment))}else if(e.type==="render-error"){const t=this.pendingRenders.get(e.requestId);t&&(this.pendingRenders.delete(e.requestId),t.reject(new Error(e.message)))}else if(e.type==="export-domain-result"){const t=this.pendingExports.get(e.requestId);t&&(this.pendingExports.delete(e.requestId),t.resolve({words:e.words,phrases:e.phrases,wordForms:e.wordForms,senses:e.senses,coordinations:e.coordinations,semanticRelationships:e.semanticRelationships,lexicalRelationships:e.lexicalRelationships}))}else if(e.type==="export-domain-error"){const t=this.pendingExports.get(e.requestId);t&&(this.pendingExports.delete(e.requestId),t.reject(new Error(e.message)))}else if(e.type==="import-domain-result"){const t=this.pendingImports.get(e.requestId);t&&(this.pendingImports.delete(e.requestId),t.resolve(e.domain))}else if(e.type==="import-domain-error"){const t=this.pendingImports.get(e.requestId);t&&(this.pendingImports.delete(e.requestId),t.reject(new Error(e.message)))}else if(e.type==="metrics-result"){const t=this.pendingMetrics.get(e.requestId);t&&(this.pendingMetrics.delete(e.requestId),t(e.metrics))}else if(e.type==="domain-updated")for(const t of this.domainUpdateListeners)t(e.domain);else if(e.type==="domain-snapshot")for(const t of this.domainSnapshotListeners)t(e.domain,{words:e.words,phrases:e.phrases,wordForms:e.wordForms,senses:e.senses,coordinations:e.coordinations,semanticRelationships:e.semanticRelationships,lexicalRelationships:e.lexicalRelationships});else if(e.type==="log")for(const t of this.logListeners)t(e.level,e.source,e.message,e.timestamp);else if(e.type==="search-words-result"){const t=this.pendingSearches.get(e.requestId);t&&(this.pendingSearches.delete(e.requestId),t({words:e.words,totalMatches:e.totalMatches}))}else if(e.type==="search-phrases-result"){const t=this.pendingPhraseSearches.get(e.requestId);t&&(this.pendingPhraseSearches.delete(e.requestId),t({phrases:e.phrases,totalMatches:e.totalMatches}))}else if(e.type==="search-senses-result"){const t=this.pendingSenseSearches.get(e.requestId);t&&(this.pendingSenseSearches.delete(e.requestId),t({senses:e.senses,totalMatches:e.totalMatches}))}else if(e.type==="search-relationships-result"){const t=this.pendingRelationshipSearches.get(e.requestId);t&&(this.pendingRelationshipSearches.delete(e.requestId),t({relationships:e.relationships,totalMatches:e.totalMatches}))}else if(e.type==="search-lexical-relationships-result"){const t=this.pendingLexicalRelationshipSearches.get(e.requestId);t&&(this.pendingLexicalRelationshipSearches.delete(e.requestId),t({relationships:e.relationships,totalMatches:e.totalMatches}))}else if(e.type==="resolve-hierarchy-result"){const t=this.pendingHierarchyResolutions.get(e.requestId);t&&(this.pendingHierarchyResolutions.delete(e.requestId),t({nodes:e.nodes,edges:e.edges,roots:e.roots,totalEdgeCount:e.totalEdgeCount,totalNodeCount:e.totalNodeCount,fellBack:e.fellBack,truncated:e.truncated}))}else e.type==="error"&&console.error("Vocabulary Service error:",e.message)}}class at{constructor(){l(this,"worker");l(this,"statusListeners",new Set);l(this,"readyResolvers",[]);l(this,"pendingReads",new Map);l(this,"pendingReadDocuments",new Map);l(this,"pendingMetrics",new Map);this.worker=new Worker(new URL(""+new URL("linguistics_worker-DxCpTQhG.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.addEventListener("message",e=>{this.handleMessage(e.data)})}onStatus(e){return this.statusListeners.add(e),()=>{this.statusListeners.delete(e)}}init(){return new Promise(e=>{this.readyResolvers.push(e),this.post({type:"init"})})}linkVocabularyPort(e){this.worker.postMessage({type:"link-vocabulary-port",port:e},[e])}read(e,t,r=!1){const n=`read-${Math.random().toString(36).slice(2)}`;return new Promise((o,i)=>{this.pendingReads.set(n,{resolve:o,reject:i}),this.post({type:"read",requestId:n,text:e,learningEnabled:t,skipLearning:r})})}readDocument(e,t){const r=`read-doc-${Math.random().toString(36).slice(2)}`;return new Promise((n,o)=>{this.pendingReadDocuments.set(r,{resolve:n,reject:o}),this.post({type:"read-document",requestId:r,text:e,learningEnabled:t})})}getMetrics(){const e=`metrics-${Math.random().toString(36).slice(2)}`;return new Promise(t=>{this.pendingMetrics.set(e,t),this.post({type:"metrics",requestId:e})})}post(e){this.worker.postMessage(e)}handleMessage(e){if(e.type==="status")for(const t of this.statusListeners)t(e.state,e.detail);else if(e.type==="ready"){const t=this.readyResolvers.splice(0);for(const r of t)r(e.wordCount)}else if(e.type==="read-result"){const t=this.pendingReads.get(e.requestId);t&&(this.pendingReads.delete(e.requestId),t.resolve(e.result))}else if(e.type==="read-document-result"){const t=this.pendingReadDocuments.get(e.requestId);t&&(this.pendingReadDocuments.delete(e.requestId),t.resolve(e.result))}else if(e.type==="metrics-result"){const t=this.pendingMetrics.get(e.requestId);t&&(this.pendingMetrics.delete(e.requestId),t(e.metrics))}else if(e.type==="error"){if(e.requestId){const t=this.pendingReads.get(e.requestId);if(t){this.pendingReads.delete(e.requestId),t.reject(new Error(e.message));return}const r=this.pendingReadDocuments.get(e.requestId);if(r){this.pendingReadDocuments.delete(e.requestId),r.reject(new Error(e.message));return}}console.error("Linguistic Service error:",e.message)}}}function lt(){const s=document.querySelector("#app");if(!s)return;s.style.height="100vh";const e=new G;e.register("vocabulary","Vocabulary Service","idle","Starting…"),e.register("linguistics","Linguistic Service","idle","Starting…"),e.register("knowledge","Knowledge Service","not-ported");const t=new J(e,"LIRA");t.mount(s);const r=new it;r.onStatus((i,a,d)=>e.update("vocabulary",i,a,d));const n=new at;n.onStatus((i,a)=>e.update("linguistics",i,a));const o=new MessageChannel;r.linkPort(o.port1),n.linkVocabularyPort(o.port2),Promise.all([r.init(),n.init()]).then(([i])=>{t.destroy();const a=new Y(i);new Ge(a,r,n,e,{title:"LIRA"}).mount(s)}).catch(i=>{e.update("vocabulary","error",i instanceof Error?i.message:String(i))})}lt();
