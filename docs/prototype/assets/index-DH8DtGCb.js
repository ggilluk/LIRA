var A=Object.defineProperty;var F=(n,e,t)=>e in n?A(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var o=(n,e,t)=>F(n,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const a of i.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&r(a)}).observe(document,{childList:!0,subtree:!0});function t(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(s){if(s.ep)return;s.ep=!0;const i=t(s);fetch(s.href,i)}})();class P{constructor(){o(this,"statuses",new Map);o(this,"listeners",new Set)}register(e,t,r="idle",s){this.statuses.set(e,{id:e,label:t,state:r,detail:s}),this.notify()}update(e,t,r,s){const i=this.statuses.get(e);i&&(this.statuses.set(e,{...i,state:t,detail:r,progress:s}),this.notify())}get(e){return this.statuses.get(e)}all(){return[...this.statuses.values()]}subscribe(e){return this.listeners.add(e),e(this.all()),()=>{this.listeners.delete(e)}}notify(){const e=this.all();for(const t of this.listeners)t(e)}}class V{constructor(e=[]){o(this,"domains",new Map);for(const t of e)this.add(t)}add(e){this.domains.set(e.name,e)}get(e){return this.domains.get(e)}all(){return[...this.domains.values()]}roots(){return this.all().filter(e=>e.parentName===void 0)}children(e){return this.all().filter(t=>t.parentName===e)}ancestryOf(e){const t=[];let r=this.get(e);for(;r!==void 0;)t.unshift(r),r=r.parentName!==void 0?this.get(r.parentName):void 0;return t}}class q{constructor(e,t="LIRA"){o(this,"unsubscribe");this.board=e,this.title=t}mount(e){var t;this.ensureStyles(),(t=this.unsubscribe)==null||t.call(this),this.unsubscribe=this.board.subscribe(r=>{e.innerHTML=this.renderScreen(r)})}waitFor(...e){return new Promise(t=>{const r=a=>a==="done"||a==="error",s=a=>{const l=a.filter(c=>e.includes(c.id));l.length===e.length&&l.every(c=>r(c.state))&&(i(),t())},i=this.board.subscribe(s)})}destroy(){var e;(e=this.unsubscribe)==null||e.call(this),this.unsubscribe=void 0}renderScreen(e){return`
      <div class="loading-screen">
        <div class="loading-box">
          <div class="loading-title">${w(this.title)}</div>
          <div class="loading-subtitle">Initialising…</div>
          <div class="loading-steps">
            ${e.map(t=>this.renderStep(t)).join("")}
          </div>
        </div>
      </div>
    `}renderStep(e){return`
      <div class="loading-step state-${e.state}">
        <span class="loading-step-icon">${j[e.state]}</span>
        <span class="loading-step-label">${w(e.label)}</span>
        <span class="loading-step-detail">${w(e.detail??O[e.state])}</span>
      </div>
    `}ensureStyles(){if(document.getElementById(x))return;const e=document.createElement("style");e.id=x,e.textContent=z,document.head.appendChild(e)}}const O={"not-ported":"Not ported yet",idle:"Waiting…",running:"Working…",done:"Ready",error:"Failed"},j={"not-ported":"–",idle:"○",running:'<span class="loading-spinner"></span>',done:"✓",error:"✕"};function w(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const x="lira-loading-screen-styles",z=`
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
`,U=300;class _{constructor(){o(this,"events",[]);o(this,"listeners",new Set)}append(e){this.events.push(e),this.events.length>U&&this.events.shift(),this.notify()}all(){return[...this.events]}subscribe(e){return this.listeners.add(e),e(this.all()),()=>{this.listeners.delete(e)}}notify(){const e=this.all();for(const t of this.listeners)t(e)}}class H{constructor(e,t){this.source=e,this.sink=t}info(e){this.emit("info",e)}warn(e){this.emit("warn",e)}error(e){this.emit("error",e)}emit(e,t){this.sink({timestamp:Date.now(),level:e,source:this.source,message:t})}}class W{constructor(e,t=[],r){o(this,"unsubscribeStatus");o(this,"unsubscribeLog");o(this,"collapsed",!1);o(this,"logCollapsed",!1);o(this,"latestStatuses",[]);o(this,"latestEvents",[]);o(this,"container");this.board=e,this.actions=t,this.logBoard=r}mount(e){var t,r;this.container=e,this.ensureStyles(),(t=this.unsubscribeStatus)==null||t.call(this),(r=this.unsubscribeLog)==null||r.call(this),e.addEventListener("click",s=>this.handleClick(s)),this.unsubscribeStatus=this.board.subscribe(s=>{this.latestStatuses=s,this.paint()}),this.logBoard&&(this.unsubscribeLog=this.logBoard.subscribe(s=>{this.latestEvents=s,this.paint()}))}destroy(){var e,t;(e=this.unsubscribeStatus)==null||e.call(this),this.unsubscribeStatus=void 0,(t=this.unsubscribeLog)==null||t.call(this),this.unsubscribeLog=void 0}paint(){this.container&&(this.container.innerHTML=this.renderPanel())}handleClick(e){const t=e.target.closest("[data-action]");if(!(!t||t.disabled)){if(t.dataset.action==="toggle")this.collapsed=!this.collapsed,this.paint();else if(t.dataset.action==="toggle-log")this.logCollapsed=!this.logCollapsed,this.paint();else if(t.dataset.action==="run"){const r=this.actions.find(s=>s.id===t.dataset.actionId);r==null||r.onClick()}}}renderPanel(){const e=this.latestStatuses,t=e.filter(r=>r.state==="running"||r.state==="done").length;return`
      <div class="service-status-panel ${this.collapsed?"collapsed":""}">
        <button type="button" class="service-status-header" data-action="toggle" aria-expanded="${!this.collapsed}">
          <span class="service-status-label">Background Services</span>
          ${this.collapsed?`<span class="service-status-summary">${t}/${e.length} running</span>`:""}
          <span class="service-status-chevron">${k}</span>
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
          <span class="service-status-name">${m(e.label)}</span>
          <span class="service-status-pill">${K[e.state]}</span>
          ${e.detail?`<span class="service-status-detail">${m(e.detail)}</span>`:""}
          ${t?`<button type="button" class="service-status-action" data-action="run" data-action-id="${m(t.id)}" ${e.state==="running"?"disabled":""}>${m(t.label)}</button>`:""}
        </div>
        ${r}
      </div>
    `}renderLogPanel(){const e=this.latestEvents;return`
      <div class="service-log-panel ${this.logCollapsed?"collapsed":""}">
        <button type="button" class="service-status-header" data-action="toggle-log" aria-expanded="${!this.logCollapsed}">
          <span class="service-status-label">Event Log</span>
          ${this.logCollapsed?`<span class="service-status-summary">${e.length} event${e.length===1?"":"s"}</span>`:""}
          <span class="service-status-chevron">${k}</span>
        </button>
        <div class="service-log-rows">
          ${e.length===0?'<div class="service-log-empty">No events yet.</div>':[...e].reverse().map(t=>this.renderLogRow(t)).join("")}
        </div>
      </div>
    `}renderLogRow(e){return`
      <div class="service-log-row level-${e.level}">
        <span class="service-log-time">${Y(e.timestamp)}</span>
        <span class="service-log-level-pill">${J[e.level]}</span>
        <span class="service-log-source">${m(e.source)}</span>
        <span class="service-log-message">${m(e.message)}</span>
      </div>
    `}ensureStyles(){if(document.getElementById($))return;const e=document.createElement("style");e.id=$,e.textContent=G,document.head.appendChild(e)}}const K={"not-ported":"Not ported",idle:"Idle",running:"Running",done:"Running",error:"Error"},J={info:"Info",warn:"Warn",error:"Error"};function m(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Y(n){return new Date(n).toLocaleTimeString(void 0,{hour12:!1})}const k='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',$="lira-service-status-styles",G=`
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
`;var p=(n=>(n[n.NOUN=0]="NOUN",n[n.VERB=1]="VERB",n[n.ADJECTIVE=2]="ADJECTIVE",n[n.ADVERB=3]="ADVERB",n[n.PRONOUN=4]="PRONOUN",n[n.DETERMINER=5]="DETERMINER",n[n.PREPOSITION=6]="PREPOSITION",n[n.CONJUNCTION=7]="CONJUNCTION",n[n.INTERJECTION=8]="INTERJECTION",n[n.NUMERAL=9]="NUMERAL",n[n.AUXILIARY=11]="AUXILIARY",n[n.PROPER_NOUN=12]="PROPER_NOUN",n[n.SYMBOL=13]="SYMBOL",n[n.PUNCTUATION=14]="PUNCTUATION",n[n.OTHER=15]="OTHER",n))(p||{});const X={[p[p.NOUN]]:"#3B6EA5",[p[p.PROPER_NOUN]]:"#274472",[p[p.VERB]]:"#B2542D",[p[p.ADJECTIVE]]:"#7A5CA6",[p[p.ADVERB]]:"#B08900",[p[p.PRONOUN]]:"#5B7B6F",[p[p.DETERMINER]]:"#6E7B8B",[p[p.PREPOSITION]]:"#7B6E5B",[p[p.CONJUNCTION]]:"#6B7280",[p[p.AUXILIARY]]:"#5B6E8B",[p[p.INTERJECTION]]:"#C2544B",[p[p.NUMERAL]]:"#4B8A7B",[p[p.SYMBOL]]:"#8A8A8A",[p[p.PUNCTUATION]]:"#9A9A9A",[p[p.OTHER]]:"#7A7A7A"},g={VALID:"#2B6E63",UNRESOLVED:"#B08900",INVALID:"#B2542D"},E=["A meaning is a representation.","The word over the meaning.","The use is a state.","The word wants to use the meaning.","The meaning and the word perceive the state."],C="lira-sentence-reader-styles";class Q{constructor(e){o(this,"container");o(this,"reading",!1);o(this,"requestToken",0);o(this,"documentResult");o(this,"expandedNodes",new Set);o(this,"selectedKey");o(this,"detailCache",new Map);o(this,"detailToken",0);this.client=e}mount(e){this.container=e,this.ensureStyles(),e.innerHTML=this.renderShell(),this.wire();const t=e.querySelector(".lira-sr-textarea");t!=null&&t.value&&this.read(t.value)}destroy(){this.container=void 0}wire(){const e=this.container;if(!e)return;const t=e.querySelector(".lira-sr-textarea"),r=e.querySelector(".lira-sr-read-btn");t&&r&&(r.addEventListener("click",()=>void this.read(t.value)),t.addEventListener("keydown",i=>{(i.metaKey||i.ctrlKey)&&i.key==="Enter"&&this.read(t.value)})),e.querySelectorAll(".lira-sr-example").forEach(i=>{i.addEventListener("click",()=>{const a=i.dataset.example??"";t&&(t.value=a),this.read(a)})});const s=e.querySelector(".lira-sr-tree");s==null||s.addEventListener("click",i=>this.handleTreeClick(i)),s==null||s.addEventListener("keydown",i=>this.handleTreeKeydown(i))}handleTreeClick(e){const t=e.target,r=t.closest('[data-action="toggle-node"]');if(r){this.toggleNode(r.dataset.node??"");return}const s=t.closest('.lira-tree-row[data-kind="sentence"]');s&&this.selectSentenceNode(s.dataset.node??"")}handleTreeKeydown(e){if(e.key!=="Enter"&&e.key!==" ")return;const t=e.target;if(t.closest('[data-action="toggle-node"]'))return;const r=t.closest('.lira-tree-row[data-kind="sentence"]');r&&(e.preventDefault(),this.selectSentenceNode(r.dataset.node??""))}toggleNode(e){if(!e||!this.documentResult)return;const t=!this.expandedNodes.has(e);if(t?this.expandedNodes.add(e):this.expandedNodes.delete(e),t&&S(e)&&!this.detailCache.has(e)){this.selectSentenceNode(e);return}this.renderTreeInPlace()}renderTreeInPlace(){var t;if(!this.documentResult)return;const e=(t=this.container)==null?void 0:t.querySelector(".lira-sr-tree");e&&(e.innerHTML=this.renderTree(this.documentResult))}async selectSentenceNode(e){const t=this.documentResult,r=S(e);if(!t||!r)return;const s=t.blocks[r.blockIndex];if(!s||s.blockKind!=="paragraph")return;const i=s.sentences[r.sentenceIndex];if(!i)return;this.selectedKey=e,this.expandedNodes.add(`b${r.blockIndex}`),this.expandedNodes.add(e),this.renderTreeInPlace();const a=this.detailCache.get(e);if(a){this.renderDetail(a);return}this.setPanelPlaceholder(".lira-sr-predicted","Loading…"),this.setPanelPlaceholder(".lira-sr-winner-panel","Loading…"),this.setPanelPlaceholder(".lira-sr-trace","Loading…");const l=++this.detailToken,c=this.isLearningEnabled();try{const u=await this.client.read(i.text,c,!0);if(l!==this.detailToken||!this.container)return;this.detailCache.set(e,u),this.renderTreeInPlace(),this.renderDetail(u)}catch(u){if(l!==this.detailToken||!this.container)return;this.setError(u instanceof Error?u.message:String(u))}}isLearningEnabled(){var t;const e=(t=this.container)==null?void 0:t.querySelector(".lira-sr-learning-toggle");return(e==null?void 0:e.checked)??!0}async read(e){const t=e.trim();if(!t||this.reading)return;const r=++this.requestToken,s=this.isLearningEnabled();this.reading=!0,this.setBusy(!0),this.setError(void 0);try{const i=await this.client.readDocument(t,s);if(r!==this.requestToken||!this.container)return;this.renderDocument(i)}catch(i){if(r!==this.requestToken||!this.container)return;this.setError(i instanceof Error?i.message:String(i))}finally{r===this.requestToken&&(this.reading=!1,this.setBusy(!1))}}setBusy(e){var r;const t=(r=this.container)==null?void 0:r.querySelector(".lira-sr-read-btn");t&&(t.disabled=e,t.textContent=e?"Reading…":"Read")}setLearningStatus(e){var s;const t=(s=this.container)==null?void 0:s.querySelector(".lira-sr-learning-status");if(!t)return;if(!e||!e.enabled){t.textContent="Learning off";return}const r=e.recordedThisRead>0?` (+${e.recordedThisRead})`:"";t.textContent=`Learning: ${e.totalObservations} observation${e.totalObservations===1?"":"s"}${r}`}setError(e){var r;const t=(r=this.container)==null?void 0:r.querySelector(".lira-sr-error");t&&(t.textContent=e??"",t.style.display=e?"block":"none")}renderDocument(e){this.documentResult=e.document,this.detailCache.clear(),this.expandedNodes=new Set(["doc"]),this.selectedKey=void 0,this.setLearningStatus(e.learning);const t=Z(e.document);if(t){this.selectSentenceNode(t);return}this.renderTreeInPlace(),this.setPanelPlaceholder(".lira-sr-predicted","No sentences found in this text."),this.setPanelPlaceholder(".lira-sr-winner-panel","No sentences found in this text."),this.setPanelPlaceholder(".lira-sr-trace","No sentences found in this text.")}renderDetail(e){var i,a,l;const t=(i=this.container)==null?void 0:i.querySelector(".lira-sr-predicted"),r=(a=this.container)==null?void 0:a.querySelector(".lira-sr-winner-panel"),s=(l=this.container)==null?void 0:l.querySelector(".lira-sr-trace");t&&(t.innerHTML=this.renderPredicted(e.predicted,e.words)),r&&(r.innerHTML=this.renderWinner(e.predicted,e.trace)),s&&(s.innerHTML=this.renderTrace(e.trace))}setPanelPlaceholder(e,t){var s;const r=(s=this.container)==null?void 0:s.querySelector(e);r&&(r.innerHTML=`<div class="lira-sr-placeholder">${d(t)}</div>`)}ensureStyles(){if(document.getElementById(C))return;const e=document.createElement("style");e.id=C,e.textContent=ae,document.head.appendChild(e)}renderShell(){return`
      <div class="lira-sr">
        <div class="lira-sr-input-card">
          <textarea class="lira-sr-textarea" placeholder="e.g. A meaning is a representation.">${d(E[0])}</textarea>
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
            ${E.map(e=>`<button type="button" class="lira-sr-example" data-example="${d(e)}">${d(e)}</button>`).join("")}
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
    `}renderTree(e){const t=this.expandedNodes.has("doc"),r=g[e.validation]??"#7A7A7A",s=e.blocks.filter(c=>c.blockKind==="paragraph").length,i=e.blocks.length-s,a=e.blocks.reduce((c,u)=>c+(u.blockKind==="paragraph"?u.errors.length:0),0),l=[`${s} paragraph${s===1?"":"s"}`,i?`${i} heading${i===1?"":"s"}`:"",a?`${a} error${a===1?"":"s"}`:""].filter(Boolean).join(", ");return`
      <ul class="lira-tree-root">
        <li class="lira-tree-node">
          <div class="lira-tree-row" data-node="doc" data-kind="document">
            ${y("doc",t)}
            <span class="lira-tree-dot" style="background:${r}"></span>
            <span class="lira-tree-label">Document</span>
            ${t?"":`<span class="lira-tree-summary">${d(l)}</span>`}
          </div>
          ${t?`<ul>${e.blocks.map((c,u)=>this.renderBlockNode(c,u)).join("")}</ul>`:""}
        </li>
      </ul>`}renderBlockNode(e,t){const r=`b${t}`;if(e.blockKind==="heading")return`
        <li class="lira-tree-node lira-tree-leaf">
          <div class="lira-tree-row" data-node="${r}" data-kind="heading">
            <span class="lira-tree-spacer"></span>
            <span class="lira-tree-heading-pill">H${e.level}</span>
            <span class="lira-tree-label">${d(b(e.text,48))}</span>
          </div>
        </li>`;const s=this.expandedNodes.has(r),i=g[e.validation]??"#7A7A7A",a=[`${e.sentences.length} sentence${e.sentences.length===1?"":"s"}`,e.errors.length?`${e.errors.length} error${e.errors.length===1?"":"s"}`:""].filter(Boolean).join(", ");return`
      <li class="lira-tree-node">
        <div class="lira-tree-row" data-node="${r}" data-kind="paragraph">
          ${y(r,s)}
          <span class="lira-tree-dot" style="background:${i}"></span>
          <span class="lira-tree-label">Paragraph ${t+1}</span>
          ${s?"":`<span class="lira-tree-summary">${d(a)}</span>`}
        </div>
        ${s?`<ul>${e.sentences.map((l,c)=>this.renderSentenceNode(l,r,c)).join("")}</ul>`:""}
      </li>`}renderSentenceNode(e,t,r){const s=`${t}s${r}`,i=g[e.validation]??"#7A7A7A",a=this.expandedNodes.has(s),l=this.detailCache.get(s),c=a?`<ul>${l?l.predicted.clauses.map((u,M)=>this.renderClauseNode(u,`${s}c${M}`)).join(""):'<li class="lira-tree-node"><div class="lira-tree-row"><span class="lira-tree-spacer"></span><span class="lira-tree-summary">Loading…</span></div></li>'}</ul>`:"";return`
      <li class="lira-tree-node">
        <div class="lira-tree-row ${this.selectedKey===s?"selected":""}" data-node="${s}" data-kind="sentence" role="button" tabindex="0">
          ${y(s,a)}
          <span class="lira-tree-dot" style="background:${i}"></span>
          <span class="lira-tree-label">Sentence ${r+1}</span>
          <span class="lira-tree-snippet">${d(b(e.text,40))}</span>
          ${e.errors.length?`<span class="lira-tree-error-count">${e.errors.length}</span>`:""}
        </div>
        ${c}
      </li>`}renderClauseNode(e,t,r){const s=g[e.validation]??"#7A7A7A",a=[["subject",e.subject],["predicate",e.predicate],["object",e.object],["complement",e.complement],...e.modifiers.map(l=>["modifier",l])].filter(l=>l[1]!==null).map(([l,c],u)=>B(c)?this.renderClauseNode(c,`${t}r${u}`,l):this.renderPhraseNode(c,`${t}r${u}`,l)).join("");return`
      <li class="lira-tree-node">
        <div class="lira-tree-row" data-node="${t}" data-kind="clause">
          <span class="lira-tree-spacer"></span>
          <span class="lira-tree-dot" style="background:${s}"></span>
          ${r?`<span class="lira-tree-role-pill">${d(r)}</span>`:""}
          <span class="lira-tree-label">Clause</span>
          <span class="lira-tree-summary">${d(e.clauseType??"?")}</span>
          <span class="lira-tree-snippet">${d(b(e.text,40))}</span>
        </div>
        ${a?`<ul>${a}</ul>`:""}
      </li>`}renderPhraseNode(e,t,r){const s=g[e.validation]??"#7A7A7A",i=e.nestedPhrases.map((a,l)=>this.renderPhraseNode(a,`${t}n${l}`)).join("");return`
      <li class="lira-tree-node">
        <div class="lira-tree-row" data-node="${t}" data-kind="phrase">
          <span class="lira-tree-spacer"></span>
          <span class="lira-tree-dot" style="background:${s}"></span>
          ${r?`<span class="lira-tree-role-pill">${d(r)}</span>`:""}
          <span class="lira-tree-label">Phrase</span>
          <span class="lira-tree-summary">${d(e.phraseType??"?")}</span>
          <span class="lira-tree-snippet">${d(b(e.text,40))}</span>
        </div>
        ${i?`<ul>${i}</ul>`:""}
      </li>`}renderWinner(e,t){const r=e.clauses[0],i=(r?[["subject",r.subject],["predicate",r.predicate],["object",r.object],["complement",r.complement],...r.modifiers.map(l=>["modifier",l])]:[]).map(([l,c])=>T(l,c)).join(""),a=t.length?`<div class="lira-sr-winner-positions">
          ${t.map(l=>`
            <span class="lira-sr-winner-chip">
              <span class="lira-sr-mono lira-sr-faint">#${l.startIndex}</span>
              <span class="lira-sr-strong lira-sr-mono">${d(l.tokenText??"")}</span>
              <span class="lira-sr-faint">${d(l.winnerPhraseType??"none")}</span>
            </span>`).join("")}
        </div>`:"";return`
      <div class="lira-sr-winner-head">
        ${I(e.validation)}
        <span class="lira-sr-strong">${d(e.sentenceType??"UNRESOLVED")}</span>
        <span class="lira-sr-faint">confidence ${e.confidence.toFixed(2)}</span>
      </div>
      ${i?`<div class="lira-sr-winner-roles">${i}</div>`:""}
      ${a}
    `}renderPredicted(e,t){return`${`
      <div class="lira-sr-clause-head">
        ${I(e.validation)}
        <span class="lira-sr-strong">${d(e.sentenceType??"UNRESOLVED")}</span>
        <span class="lira-sr-faint">confidence ${e.confidence.toFixed(2)}</span>
        <span class="lira-sr-faint">${e.punctuation?`terminal "${d(e.punctuation)}"`:"no terminal punctuation"}</span>
      </div>`}${ee(t)}${ne(e.errors)}`}renderTrace(e){return e.length?e.map(t=>this.renderPosition(t)).join(""):'<div class="lira-sr-empty">No trace positions recorded.</div>'}renderPosition(e){const t=e.candidatePartsOfSpeech.length?e.candidatePartsOfSpeech.join(", "):e.isKnown===!1?"unseeded":"",r=e.winnerPartsOfSpeech.length?`<div class="lira-sr-winner-pos">
          <span class="lira-sr-faint">Predicted part(s) of speech:</span>
          ${e.winnerPartsOfSpeech.map(s=>D(s.text,s.partOfSpeech)).join("")}
        </div>`:"";return`
      <div class="lira-sr-position">
        <div class="lira-sr-position-head">
          <span class="lira-sr-mono lira-sr-faint">#${e.startIndex}</span>
          <span class="lira-sr-strong lira-sr-mono">${d(e.tokenText??"")}</span>
          <span class="lira-sr-faint">${d(t)}</span>
          <span class="lira-sr-winner">&#8594; won by ${d(e.winnerPhraseType??"none")}</span>
        </div>
        ${r}
        ${e.attempts.map(s=>this.renderAttempt(s)).join("")}
      </div>`}renderAttempt(e){const t=e.completions.length?e.completions.map(r=>`
          <div class="lira-sr-completion ${r.isWinner?"winner":""}">
            ${r.isWinner?'<span class="lira-sr-win-mark">&#10003; winner</span>':""}
            "${d(r.text)}" — ${d(r.validation)}, confidence ${r.confidence.toFixed(2)}
            ${se(r.tokens)}
          </div>`).join(""):e.rejectionReason?`<div class="lira-sr-rejection">${d(e.rejectionReason)}</div>`:"";return`
      <div class="lira-sr-attempt ${e.startMatch?"":"rejected"}">
        <div class="lira-sr-attempt-head">
          <span class="lira-sr-attempt-type">${d(e.phraseType)}</span>
          <span class="lira-sr-match-mark ${e.startMatch?"yes":"no"}">${e.startMatch?"start matched":"no start match"}</span>
          <span class="lira-sr-faint lira-sr-mono">requires: ${e.requiredStart.map(d).join(", ")}</span>
        </div>
        ${t}
      </div>`}}function B(n){return"clauseType"in n}function T(n,e){if(!e)return"";if(B(e)){const t=[["subject",e.subject],["predicate",e.predicate],["object",e.object],["complement",e.complement],...e.modifiers.map(r=>["modifier",r])];return`
      <div class="lira-sr-winner-role-row">
        <span class="lira-sr-winner-role-label">${d(n)}</span>
        <span class="lira-sr-mono">"${d(e.text)}"</span>
        <span class="lira-sr-faint">embedded clause · ${d(e.clauseType??"?")}</span>
      </div>
      <div class="lira-sr-winner-roles lira-sr-winner-roles-nested">${t.map(([r,s])=>T(r,s)).join("")}</div>`}return`
    <div class="lira-sr-winner-role-row">
      <span class="lira-sr-winner-role-label">${d(n)}</span>
      <span class="lira-sr-mono">"${d(e.text)}"</span>
      <span class="lira-sr-faint">${d(e.phraseType??"?")}</span>
    </div>`}function y(n,e){return`<button type="button" class="lira-tree-toggle" data-action="toggle-node" data-node="${n}" aria-expanded="${e}">${ie}</button>`}function b(n,e){const t=n.trim();return t.length>e?`${t.slice(0,e-1)}…`:t}function S(n){const e=/^b(\d+)s(\d+)$/.exec(n);if(e)return{blockIndex:Number(e[1]),sentenceIndex:Number(e[2])}}function Z(n){for(let e=0;e<n.blocks.length;e+=1){const t=n.blocks[e];if(t.blockKind!=="paragraph")continue;const r=t.sentences.findIndex(s=>s.errors.length>0);if(r>=0)return`b${e}s${r}`}for(let e=0;e<n.blocks.length;e+=1){const t=n.blocks[e];if(t.blockKind==="paragraph"&&t.sentences.length>0)return`b${e}s0`}}function ee(n){if(!n.length)return'<div class="lira-sr-empty">No words to show.</div>';let e="";return n.forEach((t,r)=>{const s=/^[.,!?;:]+$/.test(t.text);r>0&&!s&&(e+=" "),e+=te(t,r)}),`<div class="lira-sr-sentence">${e}</div>`}function te(n,e){return`<span class="lira-sr-word${n.resolved?"":" lira-sr-word-unfound"}" tabindex="0" data-word-index="${e}">${d(n.text)}${re(n)}</span>`}function re(n){if(!n.resolved)return`<span class="lira-sr-word-tooltip"><span class="tt-title">${d(n.text)}</span><span class="tt-meta">Not found in the Common Vocabulary Cache</span></span>`;const e=[n.validation??"UNRESOLVED",n.phraseType??"no phrase"],t=[n.partOfSpeech??"?",`conf ${n.confidence!==null?n.confidence.toFixed(2):"—"}`];return`<span class="lira-sr-word-tooltip"><span class="tt-title">${d(n.text)}</span><span class="tt-meta">${e.map(d).join(" · ")}</span><span class="tt-meta">${t.map(d).join(" · ")}</span></span>`}function I(n){return`<span class="lira-sr-badge" style="background:${g[n]??"#7A7A7A"}">${d(n)}</span>`}function D(n,e){return`
    <span class="lira-sr-pos-chip" style="background:${X[e]??"#7A7A7A"}">
      <span class="w">${d(n)}</span>
      <span class="p">${d(e)}</span>
    </span>`}function se(n){return n.length?`<div class="lira-sr-trace-tokens">${n.map(t=>D(t.text,t.partOfSpeech??"UNKNOWN")).join("")}</div>`:""}function ne(n){return n.length?`
    <div class="lira-sr-errors">
      ${n.map(e=>`
        <div class="lira-sr-error-row">
          <span class="lira-sr-strong">${d(e.kind)}:</span>
          ${d(e.message)}${e.tokenText?` ("${d(e.tokenText)}")`:""}
        </div>`).join("")}
    </div>`:""}function d(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const ie='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',ae=`
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
`,v="Common",L=[{id:"vocabulary",label:"Vocabulary",available:!0},{id:"linguistics",label:"Linguistics",available:!0},{id:"knowledge",label:"Knowledge",available:!1}],N="lira-portal-shell-styles",R="lira-vocabulary-fragment-styles";class oe{constructor(e,t,r,s,i={}){o(this,"mode");o(this,"mobileScreen","browse");o(this,"selectedName");o(this,"selectedComponent","vocabulary");o(this,"treeCollapsed",!1);o(this,"title");o(this,"container");o(this,"serviceStatusView");o(this,"sentenceReaderView");o(this,"logBoard",new _);o(this,"loggersBySource",new Map);o(this,"renderToken",0);o(this,"ioInFlight",!1);o(this,"currentVocabularyDomainName");var a;this.registry=e,this.vocabularyClient=t,this.statusBoard=s,this.title=i.title??"LIRA",this.mode=typeof window<"u"&&window.matchMedia("(max-width: 720px)").matches?"mobile":"desktop",this.selectedName=(a=this.registry.roots()[0])==null?void 0:a.name,this.serviceStatusView=new W(s,[],this.logBoard),this.sentenceReaderView=new Q(r),this.vocabularyClient.onLog((l,c,u)=>{this.loggerFor(c)[l](u)}),this.statusBoard.subscribe(l=>{const c=l.find(u=>u.id==="vocabulary");c&&this.updateVocabToolbar(c)}),this.vocabularyClient.onDomainUpdated(l=>{this.registry.add(l),this.render()}),this.searchWordsBridge(),this.searchPhrasesBridge(),this.searchSensesBridge(),this.searchRelationshipsBridge(),this.searchLexicalRelationshipsBridge(),this.resolveHierarchyBridge()}searchWordsBridge(){document.addEventListener("lira-search-words",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchWords(this.currentVocabularyDomainName,{wordId:t.wordId,word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,domainLabel:t.domain,rootWordsOnly:t.rootWordsOnly,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-words-result",{detail:{requestId:t.requestId,words:r.words,totalMatches:r.totalMatches}}))})})}searchPhrasesBridge(){document.addEventListener("lira-search-phrases",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchPhrases(this.currentVocabularyDomainName,{word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-phrases-result",{detail:{requestId:t.requestId,phrases:r.phrases,totalMatches:r.totalMatches}}))})})}searchSensesBridge(){document.addEventListener("lira-search-senses",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchSenses(this.currentVocabularyDomainName,{word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-senses-result",{detail:{requestId:t.requestId,senses:r.senses,totalMatches:r.totalMatches}}))})})}searchRelationshipsBridge(){document.addEventListener("lira-search-relationships",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchRelationships(this.currentVocabularyDomainName,{wordId:t.wordId,query:t.query,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-relationships-result",{detail:{requestId:t.requestId,relationships:r.relationships,totalMatches:r.totalMatches}}))})})}searchLexicalRelationshipsBridge(){document.addEventListener("lira-search-lexical-relationships",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchLexicalRelationships(this.currentVocabularyDomainName,{wordId:t.wordId,query:t.query,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-lexical-relationships-result",{detail:{requestId:t.requestId,relationships:r.relationships,totalMatches:r.totalMatches}}))})})}resolveHierarchyBridge(){document.addEventListener("lira-resolve-hierarchy",e=>{const t=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.resolveHierarchy(this.currentVocabularyDomainName,{kind:t.kind,wordId:t.wordId,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-resolve-hierarchy-result",{detail:{requestId:t.requestId,...r}}))})})}mount(e){this.container=e,document.title=this.title,this.ensureStyles(),e.addEventListener("click",t=>this.handleClick(t)),e.addEventListener("change",t=>this.handleFileInputChange(t)),this.render()}handleClick(e){var s,i;const t=e.target.closest("[data-action]");if(!t||t.disabled)return;const r=t.dataset.action;r==="select"?(this.selectedName=t.dataset.domain,this.mode==="mobile"&&(this.mobileScreen="view"),this.render()):r==="mode"?(this.mode=t.dataset.mode,this.mode==="mobile"&&(this.mobileScreen=this.selectedName?"view":"browse"),this.render()):r==="back"?(this.mobileScreen="browse",this.render()):r==="component"?(this.selectedComponent=t.dataset.component,this.render()):r==="toggle-tree"?(this.treeCollapsed=!this.treeCollapsed,this.render()):r==="seed-wordnet"?this.vocabularyClient.seedWordNet(v):r==="seed-common-vocabulary"?this.vocabularyClient.seedCommonVocabulary(v):r==="save-vocabulary"?this.saveVocabulary():r==="load-vocabulary"&&((i=(s=this.container)==null?void 0:s.querySelector(".portal-vocab-file-input"))==null||i.click())}saveVocabulary(){this.ioInFlight=!0,this.render();const e=v.toLowerCase();this.vocabularyClient.exportDomain(v).then(t=>{f(t.words,`${e}-words.json`),f(t.phrases,`${e}-phrases.json`),f(t.wordForms,`${e}-word_forms.json`),f(t.senses,`${e}-senses.json`),f(t.coordinations,`${e}-coordinations.json`)}).catch(()=>{}).finally(()=>{this.ioInFlight=!1,this.render()})}handleFileInputChange(e){const t=e.target;if(!t.classList.contains("portal-vocab-file-input")||!t.files||t.files.length===0)return;const r=[...t.files];t.value="",this.ioInFlight=!0,this.render(),Promise.all(r.map(async s=>{const i=le(s.name);return i?[i,await s.text()]:void 0})).then(s=>{const i={};for(const a of s)a&&(i[a[0]]=a[1]);return this.vocabularyClient.importDomain(v,i)}).catch(()=>{}).finally(()=>{this.ioInFlight=!1,this.render()})}renderVocabToolbar(){return`<div class="portal-vocab-toolbar">${this.vocabToolbarInner(this.statusBoard.get("vocabulary"))}</div>`}vocabToolbarInner(e){const t=(e==null?void 0:e.state)==="running",r=t||this.ioInFlight,s=e==null?void 0:e.progress;return`
      <button type="button" class="portal-vocab-toolbar-action" data-action="seed-common-vocabulary" ${t?"disabled":""}>Seed Vocabulary</button>
      <button type="button" class="portal-vocab-toolbar-action" data-action="seed-wordnet" ${t?"disabled":""}>Load WordNet</button>
      <button type="button" class="portal-vocab-toolbar-action" data-action="save-vocabulary" ${r?"disabled":""}>Save</button>
      <button type="button" class="portal-vocab-toolbar-action" data-action="load-vocabulary" ${r?"disabled":""}>Load from File</button>
      <input type="file" class="portal-vocab-file-input" multiple accept=".json" style="display:none">
      <span class="portal-vocab-toolbar-detail">${e!=null&&e.detail?h(e.detail):""}</span>
      ${s!==void 0?`<div class="portal-vocab-toolbar-progress"><div class="portal-vocab-toolbar-progress-fill" style="width:${Math.round(s*100)}%"></div></div>`:""}
    `}updateVocabToolbar(e){var r;const t=(r=this.container)==null?void 0:r.querySelector(".portal-vocab-toolbar");t&&(t.innerHTML=this.vocabToolbarInner(e))}loggerFor(e){let t=this.loggersBySource.get(e);return t||(t=new H(e,r=>this.logBoard.append(r)),this.loggersBySource.set(e,t)),t}ensureStyles(){if(document.getElementById(N))return;const e=document.createElement("style");e.id=N,e.textContent=be,document.head.appendChild(e)}ensureFragmentStyles(e){if(document.getElementById(R))return;const t=document.createElement("style");t.id=R,t.textContent=e,document.head.appendChild(t)}render(){if(!this.container)return;const e=this.selectedName?this.registry.get(this.selectedName):void 0;this.renderToken++;const t=this.mode==="desktop"&&this.treeCollapsed?"tree-collapsed":"";this.container.innerHTML=`
      <div class="portal-shell mode-${this.mode} ${t}">
        ${this.renderTopbar(e)}
        <div class="portal-body">
          ${this.renderBody(e)}
        </div>
      </div>
    `;const r=this.container.querySelector(".portal-service-status");r&&this.serviceStatusView.mount(r),e&&this.selectedComponent==="vocabulary"?this.loadView(e):e&&this.selectedComponent==="linguistics"&&this.loadLinguisticsView()}loadLinguisticsView(){if(!this.container)return;const e=this.container.querySelector(".portal-fragment-mount");e&&this.sentenceReaderView.mount(e)}async loadView(e){const t=++this.renderToken;this.setViewStatus("Loading Vocabulary…");let r;try{r=await this.vocabularyClient.renderDomain(e.name)}catch(i){if(t!==this.renderToken)return;this.setViewStatus(`Couldn't load this Domain's Vocabulary view: ${i instanceof Error?i.message:String(i)}`);return}if(t!==this.renderToken||!this.container)return;this.ensureFragmentStyles(r.style);const s=this.container.querySelector(".portal-fragment-mount");if(s){s.innerHTML=r.body,this.currentVocabularyDomainName=e.name;const i=document.createElement("script");i.textContent=`(function () {
${r.script}
})();`,s.appendChild(i)}this.setViewStatus(void 0)}setViewStatus(e){var r;const t=(r=this.container)==null?void 0:r.querySelector(".portal-view-status");t&&(t.textContent=e??"",t.style.display=e?"block":"none")}renderTopbar(e){const t=`
      <div class="portal-mode-toggle" role="group" aria-label="Layout">
        <button type="button" data-action="mode" data-mode="desktop" class="${this.mode==="desktop"?"active":""}">${me} Desktop</button>
        <button type="button" data-action="mode" data-mode="mobile" class="${this.mode==="mobile"?"active":""}">${ge} Mobile</button>
      </div>`;if(this.mode==="mobile")return this.mobileScreen==="view"&&e?`
          <div class="portal-topbar">
            <button type="button" class="portal-back" data-action="back" aria-label="Back to Domains">${he}</button>
            <span class="portal-topbar-title">${h(e.name)}</span>
            ${t}
          </div>`:`<div class="portal-topbar"><span class="portal-topbar-title">All Domains</span>${t}</div>`;const r=e?this.registry.ancestryOf(e.name):[];return`<div class="portal-topbar"><nav class="portal-breadcrumb">${[`<span class="crumb-root">${ue} All Domains</span>`,...r.map(i=>`<span>${h(i.name)}</span>`)].join(`<span class="crumb-sep">${pe}</span>`)}</nav>${t}</div>`}renderBody(e){return this.mode==="desktop"?`${this.renderTree()}${this.renderViewPane(e)}`:this.mobileScreen==="browse"?`<div class="portal-tree portal-tree--mobile">${this.renderTreeRows(0)}</div>`:this.renderViewPane(e,!0)}renderTree(){return this.treeCollapsed?`
        <nav class="portal-tree portal-tree--collapsed">
          <button type="button" class="portal-tree-toggle" data-action="toggle-tree" title="Expand Domains" aria-label="Expand Domains" aria-expanded="false">${fe}</button>
        </nav>`:`
      <nav class="portal-tree">
        <div class="portal-tree-label">
          <span>Domains</span>
          <button type="button" class="portal-tree-toggle" data-action="toggle-tree" title="Collapse Domains" aria-label="Collapse Domains" aria-expanded="true">${ve}</button>
        </div>
        ${this.renderTreeRows(0)}
      </nav>`}renderTreeRows(e,t){return(e===0?this.registry.roots():this.registry.children(t??"")).map(s=>{const i=this.registry.children(s.name),a=s.name===this.selectedName;return`
          <div class="portal-tree-row depth-${e} ${a?"selected":""}" data-action="select" data-domain="${h(s.name)}">
            ${i.length>0?ce:'<span class="chev-spacer"></span>'}
            ${de}
            <span class="name">${h(s.name)}</span>
            <span class="count">${s.wordCount.toLocaleString()}</span>
          </div>
          ${i.length>0?this.renderTreeRows(e+1,s.name):""}
        `}).join("")}renderComponentSwitcher(){return`
      <div class="portal-component-switcher" role="tablist" aria-label="UI Component">
        ${L.map(e=>`
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
      </div>`}renderViewPane(e,t=!1){const r=this.renderComponentSwitcher(),s='<div class="portal-service-status"></div>',i=this.selectedComponent==="vocabulary"?this.renderVocabToolbar():"";if(!e)return`
        <div class="portal-view ${t?"portal-view--full":""}">
          ${r}
          ${i}
          <div class="portal-view-empty">Select a Domain to continue.</div>
          ${s}
        </div>`;const a=L.find(c=>c.id===this.selectedComponent),l=a!=null&&a.available?`
        <div class="portal-view-status" style="display:none"></div>
        <div class="portal-fragment-mount"></div>`:`<div class="portal-view-empty">${h((a==null?void 0:a.label)??"This component")} is not ported yet.</div>`;return`
      <div class="portal-view ${t?"portal-view--full":""}">
        ${r}
        ${i}
        ${l}
        ${s}
      </div>`}}function h(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function f(n,e){const t=new Blob([n],{type:"application/json"}),r=URL.createObjectURL(t),s=document.createElement("a");s.href=r,s.download=e,s.click(),URL.revokeObjectURL(r)}function le(n){const e=n.toLowerCase();if(e.includes("word_forms")||e.includes("wordforms"))return"wordForms";if(e.includes("words"))return"words";if(e.includes("phrases"))return"phrases";if(e.includes("senses"))return"senses";if(e.includes("coordinations"))return"coordinations"}const de='<svg class="i-folder" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.5A1 1 0 0 1 2.5 2.5h3.6l1.2 1.4H13.5A1 1 0 0 1 14.5 5v7A1 1 0 0 1 13.5 13h-11a1 1 0 0 1-1-1v-8.5z"/></svg>',ce='<svg class="i-chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',pe='<svg class="i-chev-right" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>',ue='<svg class="i-home" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 8l6-5 6 5M4 7v6h8V7"/></svg>',he='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3L5 8l5 5"/></svg>',me='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1.5" y="2.5" width="13" height="9" rx="1"/><path d="M6 13.5h4"/></svg>',ge='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4.5" y="1.5" width="7" height="13" rx="1.4"/></svg>',ve='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3L5 8l5 5"/></svg>',fe='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>',be=`
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
`;class we{constructor(){o(this,"worker");o(this,"statusListeners",new Set);o(this,"domainUpdateListeners",new Set);o(this,"logListeners",new Set);o(this,"readyResolvers",[]);o(this,"pendingRenders",new Map);o(this,"pendingExports",new Map);o(this,"pendingImports",new Map);o(this,"pendingSearches",new Map);o(this,"pendingPhraseSearches",new Map);o(this,"pendingSenseSearches",new Map);o(this,"pendingRelationshipSearches",new Map);o(this,"pendingLexicalRelationshipSearches",new Map);o(this,"pendingHierarchyResolutions",new Map);this.worker=new Worker(new URL(""+new URL("vocabulary_worker-DP6TTRNA.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.addEventListener("message",e=>{this.handleMessage(e.data)})}onStatus(e){return this.statusListeners.add(e),()=>{this.statusListeners.delete(e)}}onLog(e){return this.logListeners.add(e),()=>{this.logListeners.delete(e)}}init(){return new Promise(e=>{this.readyResolvers.push(e),this.post({type:"init"})})}linkPort(e){this.worker.postMessage({type:"link-port",port:e},[e])}renderDomain(e){const t=`${e}-${Math.random().toString(36).slice(2)}`;return new Promise((r,s)=>{this.pendingRenders.set(t,{resolve:r,reject:s}),this.post({type:"render",requestId:t,domain:e})})}exportDomain(e){const t=`export-${e}-${Math.random().toString(36).slice(2)}`;return new Promise((r,s)=>{this.pendingExports.set(t,{resolve:r,reject:s}),this.post({type:"export-domain",requestId:t,domain:e})})}importDomain(e,t){const r=`import-${e}-${Math.random().toString(36).slice(2)}`;return new Promise((s,i)=>{this.pendingImports.set(r,{resolve:s,reject:i}),this.post({type:"import-domain",requestId:r,domain:e,...t})})}seedWordNet(e){this.post({type:"seed-wordnet",domain:e})}seedCommonVocabulary(e){this.post({type:"seed-common-vocabulary",domain:e})}onDomainUpdated(e){return this.domainUpdateListeners.add(e),()=>{this.domainUpdateListeners.delete(e)}}searchWords(e,t){const r=`search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(s=>{this.pendingSearches.set(r,s),this.post({type:"search-words",requestId:r,domain:e,wordId:t.wordId,word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,domainLabel:t.domainLabel,rootWordsOnly:t.rootWordsOnly,limit:t.limit})})}searchPhrases(e,t){const r=`phrase-search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(s=>{this.pendingPhraseSearches.set(r,s),this.post({type:"search-phrases",requestId:r,domain:e,word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,limit:t.limit})})}searchSenses(e,t){const r=`sense-search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(s=>{this.pendingSenseSearches.set(r,s),this.post({type:"search-senses",requestId:r,domain:e,word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,limit:t.limit})})}searchRelationships(e,t){const r=`rel-search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(s=>{this.pendingRelationshipSearches.set(r,s),this.post({type:"search-relationships",requestId:r,domain:e,wordId:t.wordId,query:t.query,limit:t.limit})})}searchLexicalRelationships(e,t){const r=`lexical-rel-search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(s=>{this.pendingLexicalRelationshipSearches.set(r,s),this.post({type:"search-lexical-relationships",requestId:r,domain:e,wordId:t.wordId,query:t.query,limit:t.limit})})}resolveHierarchy(e,t){const r=`hierarchy-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(s=>{this.pendingHierarchyResolutions.set(r,s),this.post({type:"resolve-hierarchy",requestId:r,domain:e,kind:t.kind,wordId:t.wordId,limit:t.limit})})}post(e){this.worker.postMessage(e)}handleMessage(e){if(e.type==="status")for(const t of this.statusListeners)t(e.state,e.detail,e.progress);else if(e.type==="ready"){const t=this.readyResolvers.splice(0);for(const r of t)r(e.domains)}else if(e.type==="rendered"){const t=this.pendingRenders.get(e.requestId);t&&(this.pendingRenders.delete(e.requestId),t.resolve(e.fragment))}else if(e.type==="render-error"){const t=this.pendingRenders.get(e.requestId);t&&(this.pendingRenders.delete(e.requestId),t.reject(new Error(e.message)))}else if(e.type==="export-domain-result"){const t=this.pendingExports.get(e.requestId);t&&(this.pendingExports.delete(e.requestId),t.resolve({words:e.words,phrases:e.phrases,wordForms:e.wordForms,senses:e.senses,coordinations:e.coordinations}))}else if(e.type==="export-domain-error"){const t=this.pendingExports.get(e.requestId);t&&(this.pendingExports.delete(e.requestId),t.reject(new Error(e.message)))}else if(e.type==="import-domain-result"){const t=this.pendingImports.get(e.requestId);t&&(this.pendingImports.delete(e.requestId),t.resolve(e.domain))}else if(e.type==="import-domain-error"){const t=this.pendingImports.get(e.requestId);t&&(this.pendingImports.delete(e.requestId),t.reject(new Error(e.message)))}else if(e.type==="domain-updated")for(const t of this.domainUpdateListeners)t(e.domain);else if(e.type==="log")for(const t of this.logListeners)t(e.level,e.source,e.message,e.timestamp);else if(e.type==="search-words-result"){const t=this.pendingSearches.get(e.requestId);t&&(this.pendingSearches.delete(e.requestId),t({words:e.words,totalMatches:e.totalMatches}))}else if(e.type==="search-phrases-result"){const t=this.pendingPhraseSearches.get(e.requestId);t&&(this.pendingPhraseSearches.delete(e.requestId),t({phrases:e.phrases,totalMatches:e.totalMatches}))}else if(e.type==="search-senses-result"){const t=this.pendingSenseSearches.get(e.requestId);t&&(this.pendingSenseSearches.delete(e.requestId),t({senses:e.senses,totalMatches:e.totalMatches}))}else if(e.type==="search-relationships-result"){const t=this.pendingRelationshipSearches.get(e.requestId);t&&(this.pendingRelationshipSearches.delete(e.requestId),t({relationships:e.relationships,totalMatches:e.totalMatches}))}else if(e.type==="search-lexical-relationships-result"){const t=this.pendingLexicalRelationshipSearches.get(e.requestId);t&&(this.pendingLexicalRelationshipSearches.delete(e.requestId),t({relationships:e.relationships,totalMatches:e.totalMatches}))}else if(e.type==="resolve-hierarchy-result"){const t=this.pendingHierarchyResolutions.get(e.requestId);t&&(this.pendingHierarchyResolutions.delete(e.requestId),t({nodes:e.nodes,edges:e.edges,roots:e.roots,totalEdgeCount:e.totalEdgeCount,totalNodeCount:e.totalNodeCount,fellBack:e.fellBack,truncated:e.truncated}))}else e.type==="error"&&console.error("Vocabulary Service error:",e.message)}}class ye{constructor(){o(this,"worker");o(this,"statusListeners",new Set);o(this,"readyResolvers",[]);o(this,"pendingReads",new Map);o(this,"pendingReadDocuments",new Map);this.worker=new Worker(new URL(""+new URL("linguistics_worker-BbpV00MX.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.addEventListener("message",e=>{this.handleMessage(e.data)})}onStatus(e){return this.statusListeners.add(e),()=>{this.statusListeners.delete(e)}}init(){return new Promise(e=>{this.readyResolvers.push(e),this.post({type:"init"})})}linkVocabularyPort(e){this.worker.postMessage({type:"link-vocabulary-port",port:e},[e])}read(e,t,r=!1){const s=`read-${Math.random().toString(36).slice(2)}`;return new Promise((i,a)=>{this.pendingReads.set(s,{resolve:i,reject:a}),this.post({type:"read",requestId:s,text:e,learningEnabled:t,skipLearning:r})})}readDocument(e,t){const r=`read-doc-${Math.random().toString(36).slice(2)}`;return new Promise((s,i)=>{this.pendingReadDocuments.set(r,{resolve:s,reject:i}),this.post({type:"read-document",requestId:r,text:e,learningEnabled:t})})}post(e){this.worker.postMessage(e)}handleMessage(e){if(e.type==="status")for(const t of this.statusListeners)t(e.state,e.detail);else if(e.type==="ready"){const t=this.readyResolvers.splice(0);for(const r of t)r(e.wordCount)}else if(e.type==="read-result"){const t=this.pendingReads.get(e.requestId);t&&(this.pendingReads.delete(e.requestId),t.resolve(e.result))}else if(e.type==="read-document-result"){const t=this.pendingReadDocuments.get(e.requestId);t&&(this.pendingReadDocuments.delete(e.requestId),t.resolve(e.result))}else if(e.type==="error"){if(e.requestId){const t=this.pendingReads.get(e.requestId);if(t){this.pendingReads.delete(e.requestId),t.reject(new Error(e.message));return}const r=this.pendingReadDocuments.get(e.requestId);if(r){this.pendingReadDocuments.delete(e.requestId),r.reject(new Error(e.message));return}}console.error("Linguistic Service error:",e.message)}}}function xe(){const n=document.querySelector("#app");if(!n)return;n.style.height="100vh";const e=new P;e.register("vocabulary","Vocabulary Service","idle","Starting…"),e.register("linguistics","Linguistic Service","idle","Starting…"),e.register("knowledge","Knowledge Service","not-ported");const t=new q(e,"LIRA");t.mount(n);const r=new we;r.onStatus((a,l,c)=>e.update("vocabulary",a,l,c));const s=new ye;s.onStatus((a,l)=>e.update("linguistics",a,l));const i=new MessageChannel;r.linkPort(i.port1),s.linkVocabularyPort(i.port2),Promise.all([r.init(),s.init()]).then(([a])=>{t.destroy();const l=new V(a);new oe(l,r,s,e,{title:"LIRA"}).mount(n)}).catch(a=>{e.update("vocabulary","error",a instanceof Error?a.message:String(a))})}xe();
