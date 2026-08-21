var R=Object.defineProperty;var T=(s,e,r)=>e in s?R(s,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):s[e]=r;var o=(s,e,r)=>T(s,typeof e!="symbol"?e+"":e,r);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))t(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&t(i)}).observe(document,{childList:!0,subtree:!0});function r(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function t(n){if(n.ep)return;n.ep=!0;const a=r(n);fetch(n.href,a)}})();class L{constructor(){o(this,"statuses",new Map);o(this,"listeners",new Set)}register(e,r,t="idle",n){this.statuses.set(e,{id:e,label:r,state:t,detail:n}),this.notify()}update(e,r,t,n){const a=this.statuses.get(e);a&&(this.statuses.set(e,{...a,state:r,detail:t,progress:n}),this.notify())}get(e){return this.statuses.get(e)}all(){return[...this.statuses.values()]}subscribe(e){return this.listeners.add(e),e(this.all()),()=>{this.listeners.delete(e)}}notify(){const e=this.all();for(const r of this.listeners)r(e)}}class B{constructor(e=[]){o(this,"domains",new Map);for(const r of e)this.add(r)}add(e){this.domains.set(e.name,e)}get(e){return this.domains.get(e)}all(){return[...this.domains.values()]}roots(){return this.all().filter(e=>e.parentName===void 0)}children(e){return this.all().filter(r=>r.parentName===e)}ancestryOf(e){const r=[];let t=this.get(e);for(;t!==void 0;)r.unshift(t),t=t.parentName!==void 0?this.get(t.parentName):void 0;return r}}class A{constructor(e,r="LIRA"){o(this,"unsubscribe");this.board=e,this.title=r}mount(e){var r;this.ensureStyles(),(r=this.unsubscribe)==null||r.call(this),this.unsubscribe=this.board.subscribe(t=>{e.innerHTML=this.renderScreen(t)})}waitFor(...e){return new Promise(r=>{const t=i=>i==="done"||i==="error",n=i=>{const c=i.filter(p=>e.includes(p.id));c.length===e.length&&c.every(p=>t(p.state))&&(a(),r())},a=this.board.subscribe(n)})}destroy(){var e;(e=this.unsubscribe)==null||e.call(this),this.unsubscribe=void 0}renderScreen(e){return`
      <div class="loading-screen">
        <div class="loading-box">
          <div class="loading-title">${f(this.title)}</div>
          <div class="loading-subtitle">Initialising…</div>
          <div class="loading-steps">
            ${e.map(r=>this.renderStep(r)).join("")}
          </div>
        </div>
      </div>
    `}renderStep(e){return`
      <div class="loading-step state-${e.state}">
        <span class="loading-step-icon">${M[e.state]}</span>
        <span class="loading-step-label">${f(e.label)}</span>
        <span class="loading-step-detail">${f(e.detail??D[e.state])}</span>
      </div>
    `}ensureStyles(){if(document.getElementById(v))return;const e=document.createElement("style");e.id=v,e.textContent=V,document.head.appendChild(e)}}const D={"not-ported":"Not ported yet",idle:"Waiting…",running:"Working…",done:"Ready",error:"Failed"},M={"not-ported":"–",idle:"○",running:'<span class="loading-spinner"></span>',done:"✓",error:"✕"};function f(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const v="lira-loading-screen-styles",V=`
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
`;class F{constructor(e,r=[]){o(this,"unsubscribe");o(this,"collapsed",!1);this.board=e,this.actions=r}mount(e){var r;this.ensureStyles(),(r=this.unsubscribe)==null||r.call(this),e.addEventListener("click",t=>this.handleClick(t,e)),this.unsubscribe=this.board.subscribe(t=>{e.innerHTML=this.renderPanel(t)})}destroy(){var e;(e=this.unsubscribe)==null||e.call(this),this.unsubscribe=void 0}handleClick(e,r){const t=e.target.closest("[data-action]");if(!(!t||t.disabled)){if(t.dataset.action==="toggle")this.collapsed=!this.collapsed,r.innerHTML=this.renderPanel(this.board.all());else if(t.dataset.action==="run"){const n=this.actions.find(a=>a.id===t.dataset.actionId);n==null||n.onClick()}}}renderPanel(e){const r=e.filter(t=>t.state==="running"||t.state==="done").length;return`
      <div class="service-status-panel ${this.collapsed?"collapsed":""}">
        <button type="button" class="service-status-header" data-action="toggle" aria-expanded="${!this.collapsed}">
          <span class="service-status-label">Background Services</span>
          ${this.collapsed?`<span class="service-status-summary">${r}/${e.length} running</span>`:""}
          <span class="service-status-chevron">${P}</span>
        </button>
        <div class="service-status-rows">
          ${e.map(t=>this.renderRow(t)).join("")}
        </div>
      </div>
    `}renderRow(e){const r=this.actions.find(n=>n.id===e.id),t=e.progress!==void 0?`<div class="service-status-progress"><div class="service-status-progress-fill" style="width:${Math.round(e.progress*100)}%"></div></div>`:"";return`
      <div class="service-status-row-group">
        <div class="service-status-row state-${e.state}">
          <span class="service-status-dot"></span>
          <span class="service-status-name">${m(e.label)}</span>
          <span class="service-status-pill">${O[e.state]}</span>
          ${e.detail?`<span class="service-status-detail">${m(e.detail)}</span>`:""}
          ${r?`<button type="button" class="service-status-action" data-action="run" data-action-id="${m(r.id)}" ${e.state==="running"?"disabled":""}>${m(r.label)}</button>`:""}
        </div>
        ${t}
      </div>
    `}ensureStyles(){if(document.getElementById(b))return;const e=document.createElement("style");e.id=b,e.textContent=z,document.head.appendChild(e)}}const O={"not-ported":"Not ported",idle:"Idle",running:"Running",done:"Running",error:"Error"};function m(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const P='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',b="lira-service-status-styles",z=`
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
`;var d=(s=>(s[s.NOUN=0]="NOUN",s[s.VERB=1]="VERB",s[s.ADJECTIVE=2]="ADJECTIVE",s[s.ADVERB=3]="ADVERB",s[s.PRONOUN=4]="PRONOUN",s[s.DETERMINER=5]="DETERMINER",s[s.PREPOSITION=6]="PREPOSITION",s[s.CONJUNCTION=7]="CONJUNCTION",s[s.INTERJECTION=8]="INTERJECTION",s[s.NUMERAL=9]="NUMERAL",s[s.PARTICLE=10]="PARTICLE",s[s.AUXILIARY=11]="AUXILIARY",s[s.PROPER_NOUN=12]="PROPER_NOUN",s[s.SYMBOL=13]="SYMBOL",s[s.PUNCTUATION=14]="PUNCTUATION",s[s.OTHER=15]="OTHER",s))(d||{});const q={[d[d.NOUN]]:"#3B6EA5",[d[d.PROPER_NOUN]]:"#274472",[d[d.VERB]]:"#B2542D",[d[d.ADJECTIVE]]:"#7A5CA6",[d[d.ADVERB]]:"#B08900",[d[d.PRONOUN]]:"#5B7B6F",[d[d.DETERMINER]]:"#6E7B8B",[d[d.PREPOSITION]]:"#7B6E5B",[d[d.CONJUNCTION]]:"#6B7280",[d[d.PARTICLE]]:"#8A7B6E",[d[d.AUXILIARY]]:"#5B6E8B",[d[d.INTERJECTION]]:"#C2544B",[d[d.NUMERAL]]:"#4B8A7B",[d[d.SYMBOL]]:"#8A8A8A",[d[d.PUNCTUATION]]:"#9A9A9A",[d[d.OTHER]]:"#7A7A7A"},g={VALID:"#2B6E63",UNRESOLVED:"#B08900",INVALID:"#B2542D"},w=["A meaning is a representation.","The word over the meaning.","The use is a state.","The word wants to use the meaning.","The meaning and the word perceive the state."],y="lira-sentence-reader-styles";class U{constructor(e){o(this,"container");o(this,"reading",!1);o(this,"requestToken",0);o(this,"documentResult");o(this,"expandedNodes",new Set);o(this,"selectedKey");o(this,"detailCache",new Map);o(this,"detailToken",0);this.client=e}mount(e){this.container=e,this.ensureStyles(),e.innerHTML=this.renderShell(),this.wire();const r=e.querySelector(".lira-sr-textarea");r!=null&&r.value&&this.read(r.value)}destroy(){this.container=void 0}wire(){const e=this.container;if(!e)return;const r=e.querySelector(".lira-sr-textarea"),t=e.querySelector(".lira-sr-read-btn");r&&t&&(t.addEventListener("click",()=>void this.read(r.value)),r.addEventListener("keydown",a=>{(a.metaKey||a.ctrlKey)&&a.key==="Enter"&&this.read(r.value)})),e.querySelectorAll(".lira-sr-example").forEach(a=>{a.addEventListener("click",()=>{const i=a.dataset.example??"";r&&(r.value=i),this.read(i)})});const n=e.querySelector(".lira-sr-tree");n==null||n.addEventListener("click",a=>this.handleTreeClick(a)),n==null||n.addEventListener("keydown",a=>this.handleTreeKeydown(a))}handleTreeClick(e){const r=e.target,t=r.closest('[data-action="toggle-node"]');if(t){this.toggleNode(t.dataset.node??"");return}const n=r.closest('.lira-tree-row[data-kind="sentence"]');n&&this.selectSentenceNode(n.dataset.node??"")}handleTreeKeydown(e){if(e.key!=="Enter"&&e.key!==" ")return;const r=e.target.closest('.lira-tree-row[data-kind="sentence"]');r&&(e.preventDefault(),this.selectSentenceNode(r.dataset.node??""))}toggleNode(e){!e||!this.documentResult||(this.expandedNodes.has(e)?this.expandedNodes.delete(e):this.expandedNodes.add(e),this.renderTreeInPlace())}renderTreeInPlace(){var r;if(!this.documentResult)return;const e=(r=this.container)==null?void 0:r.querySelector(".lira-sr-tree");e&&(e.innerHTML=this.renderTree(this.documentResult))}async selectSentenceNode(e){const r=this.documentResult,t=H(e);if(!r||!t)return;const n=r.blocks[t.blockIndex];if(!n||n.blockKind!=="paragraph")return;const a=n.sentences[t.sentenceIndex];if(!a)return;this.selectedKey=e,this.expandedNodes.add(`b${t.blockIndex}`),this.renderTreeInPlace();const i=this.detailCache.get(e);if(i){this.renderDetail(i);return}this.setPanelPlaceholder(".lira-sr-predicted","Loading…"),this.setPanelPlaceholder(".lira-sr-winner-panel","Loading…"),this.setPanelPlaceholder(".lira-sr-trace","Loading…");const c=++this.detailToken,p=this.isLearningEnabled();try{const u=await this.client.read(a.text,p,!0);if(c!==this.detailToken||!this.container)return;this.detailCache.set(e,u),this.renderDetail(u)}catch(u){if(c!==this.detailToken||!this.container)return;this.setError(u instanceof Error?u.message:String(u))}}isLearningEnabled(){var r;const e=(r=this.container)==null?void 0:r.querySelector(".lira-sr-learning-toggle");return(e==null?void 0:e.checked)??!0}async read(e){const r=e.trim();if(!r||this.reading)return;const t=++this.requestToken,n=this.isLearningEnabled();this.reading=!0,this.setBusy(!0),this.setError(void 0);try{const a=await this.client.readDocument(r,n);if(t!==this.requestToken||!this.container)return;this.renderDocument(a)}catch(a){if(t!==this.requestToken||!this.container)return;this.setError(a instanceof Error?a.message:String(a))}finally{t===this.requestToken&&(this.reading=!1,this.setBusy(!1))}}setBusy(e){var t;const r=(t=this.container)==null?void 0:t.querySelector(".lira-sr-read-btn");r&&(r.disabled=e,r.textContent=e?"Reading…":"Read")}setLearningStatus(e){var n;const r=(n=this.container)==null?void 0:n.querySelector(".lira-sr-learning-status");if(!r)return;if(!e||!e.enabled){r.textContent="Learning off";return}const t=e.recordedThisRead>0?` (+${e.recordedThisRead})`:"";r.textContent=`Learning: ${e.totalObservations} observation${e.totalObservations===1?"":"s"}${t}`}setError(e){var t;const r=(t=this.container)==null?void 0:t.querySelector(".lira-sr-error");r&&(r.textContent=e??"",r.style.display=e?"block":"none")}renderDocument(e){this.documentResult=e.document,this.detailCache.clear(),this.expandedNodes=new Set(["doc"]),this.selectedKey=void 0,this.setLearningStatus(e.learning);const r=_(e.document);if(r){this.selectSentenceNode(r);return}this.renderTreeInPlace(),this.setPanelPlaceholder(".lira-sr-predicted","No sentences found in this text."),this.setPanelPlaceholder(".lira-sr-winner-panel","No sentences found in this text."),this.setPanelPlaceholder(".lira-sr-trace","No sentences found in this text.")}renderDetail(e){var a,i,c;const r=(a=this.container)==null?void 0:a.querySelector(".lira-sr-predicted"),t=(i=this.container)==null?void 0:i.querySelector(".lira-sr-winner-panel"),n=(c=this.container)==null?void 0:c.querySelector(".lira-sr-trace");r&&(r.innerHTML=this.renderPredicted(e.predicted,e.words)),t&&(t.innerHTML=this.renderWinner(e.predicted,e.trace)),n&&(n.innerHTML=this.renderTrace(e.trace))}setPanelPlaceholder(e,r){var n;const t=(n=this.container)==null?void 0:n.querySelector(e);t&&(t.innerHTML=`<div class="lira-sr-placeholder">${l(r)}</div>`)}ensureStyles(){if(document.getElementById(y))return;const e=document.createElement("style");e.id=y,e.textContent=Q,document.head.appendChild(e)}renderShell(){return`
      <div class="lira-sr">
        <div class="lira-sr-input-card">
          <textarea class="lira-sr-textarea" placeholder="e.g. A meaning is a representation.">${l(w[0])}</textarea>
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
            ${w.map(e=>`<button type="button" class="lira-sr-example" data-example="${l(e)}">${l(e)}</button>`).join("")}
          </div>
        </div>
        <div class="lira-sr-error" style="display:none"></div>
        <div class="lira-sr-workspace">
          <section class="lira-sr-tree-panel">
            <h3>Document structure</h3>
            <p class="lira-sr-panel-sub">Document &rarr; Paragraph &rarr; Sentence. Select a sentence to see it on the right.</p>
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
    `}renderTree(e){const r=this.expandedNodes.has("doc"),t=g[e.validation]??"#7A7A7A",n=e.blocks.filter(p=>p.blockKind==="paragraph").length,a=e.blocks.length-n,i=e.blocks.reduce((p,u)=>p+(u.blockKind==="paragraph"?u.errors.length:0),0),c=[`${n} paragraph${n===1?"":"s"}`,a?`${a} heading${a===1?"":"s"}`:"",i?`${i} error${i===1?"":"s"}`:""].filter(Boolean).join(", ");return`
      <ul class="lira-tree-root">
        <li class="lira-tree-node">
          <div class="lira-tree-row" data-node="doc" data-kind="document">
            ${x("doc",r)}
            <span class="lira-tree-dot" style="background:${t}"></span>
            <span class="lira-tree-label">Document</span>
            ${r?"":`<span class="lira-tree-summary">${l(c)}</span>`}
          </div>
          ${r?`<ul>${e.blocks.map((p,u)=>this.renderBlockNode(p,u)).join("")}</ul>`:""}
        </li>
      </ul>`}renderBlockNode(e,r){const t=`b${r}`;if(e.blockKind==="heading")return`
        <li class="lira-tree-node lira-tree-leaf">
          <div class="lira-tree-row" data-node="${t}" data-kind="heading">
            <span class="lira-tree-spacer"></span>
            <span class="lira-tree-heading-pill">H${e.level}</span>
            <span class="lira-tree-label">${l(k(e.text,48))}</span>
          </div>
        </li>`;const n=this.expandedNodes.has(t),a=g[e.validation]??"#7A7A7A",i=[`${e.sentences.length} sentence${e.sentences.length===1?"":"s"}`,e.errors.length?`${e.errors.length} error${e.errors.length===1?"":"s"}`:""].filter(Boolean).join(", ");return`
      <li class="lira-tree-node">
        <div class="lira-tree-row" data-node="${t}" data-kind="paragraph">
          ${x(t,n)}
          <span class="lira-tree-dot" style="background:${a}"></span>
          <span class="lira-tree-label">Paragraph ${r+1}</span>
          ${n?"":`<span class="lira-tree-summary">${l(i)}</span>`}
        </div>
        ${n?`<ul>${e.sentences.map((c,p)=>this.renderSentenceNode(c,t,p)).join("")}</ul>`:""}
      </li>`}renderSentenceNode(e,r,t){const n=`${r}s${t}`,a=g[e.validation]??"#7A7A7A";return`
      <li class="lira-tree-node lira-tree-leaf">
        <div class="lira-tree-row ${this.selectedKey===n?"selected":""}" data-node="${n}" data-kind="sentence" role="button" tabindex="0">
          <span class="lira-tree-spacer"></span>
          <span class="lira-tree-dot" style="background:${a}"></span>
          <span class="lira-tree-label">Sentence ${t+1}</span>
          <span class="lira-tree-snippet">${l(k(e.text,40))}</span>
          ${e.errors.length?`<span class="lira-tree-error-count">${e.errors.length}</span>`:""}
        </div>
      </li>`}renderWinner(e,r){const t=e.clauses[0],a=(t?[["subject",t.subject],["predicate",t.predicate],["object",t.object],["complement",t.complement],...t.modifiers.map(c=>["modifier",c])]:[]).map(([c,p])=>j(c,p)).join(""),i=r.length?`<div class="lira-sr-winner-positions">
          ${r.map(c=>`
            <span class="lira-sr-winner-chip">
              <span class="lira-sr-mono lira-sr-faint">#${c.startIndex}</span>
              <span class="lira-sr-strong lira-sr-mono">${l(c.tokenText??"")}</span>
              <span class="lira-sr-faint">${l(c.winnerPhraseType??"none")}</span>
            </span>`).join("")}
        </div>`:"";return`
      <div class="lira-sr-winner-head">
        ${$(e.validation)}
        <span class="lira-sr-strong">${l(e.sentenceType??"UNRESOLVED")}</span>
        <span class="lira-sr-faint">confidence ${e.confidence.toFixed(2)}</span>
      </div>
      ${a?`<div class="lira-sr-winner-roles">${a}</div>`:""}
      ${i}
    `}renderPredicted(e,r){return`${`
      <div class="lira-sr-clause-head">
        ${$(e.validation)}
        <span class="lira-sr-strong">${l(e.sentenceType??"UNRESOLVED")}</span>
        <span class="lira-sr-faint">confidence ${e.confidence.toFixed(2)}</span>
        <span class="lira-sr-faint">${e.punctuation?`terminal "${l(e.punctuation)}"`:"no terminal punctuation"}</span>
      </div>`}${W(r)}${G(e.errors)}`}renderTrace(e){return e.length?e.map(r=>this.renderPosition(r)).join(""):'<div class="lira-sr-empty">No trace positions recorded.</div>'}renderPosition(e){const r=e.candidatePartsOfSpeech.length?e.candidatePartsOfSpeech.join(", "):e.isKnown===!1?"unseeded":"",t=e.winnerPartsOfSpeech.length?`<div class="lira-sr-winner-pos">
          <span class="lira-sr-faint">Predicted part(s) of speech:</span>
          ${e.winnerPartsOfSpeech.map(n=>N(n.text,n.partOfSpeech)).join("")}
        </div>`:"";return`
      <div class="lira-sr-position">
        <div class="lira-sr-position-head">
          <span class="lira-sr-mono lira-sr-faint">#${e.startIndex}</span>
          <span class="lira-sr-strong lira-sr-mono">${l(e.tokenText??"")}</span>
          <span class="lira-sr-faint">${l(r)}</span>
          <span class="lira-sr-winner">&#8594; won by ${l(e.winnerPhraseType??"none")}</span>
        </div>
        ${t}
        ${e.attempts.map(n=>this.renderAttempt(n)).join("")}
      </div>`}renderAttempt(e){const r=e.completions.length?e.completions.map(t=>`
          <div class="lira-sr-completion ${t.isWinner?"winner":""}">
            ${t.isWinner?'<span class="lira-sr-win-mark">&#10003; winner</span>':""}
            "${l(t.text)}" — ${l(t.validation)}, confidence ${t.confidence.toFixed(2)}
            ${J(t.tokens)}
          </div>`).join(""):e.rejectionReason?`<div class="lira-sr-rejection">${l(e.rejectionReason)}</div>`:"";return`
      <div class="lira-sr-attempt ${e.startMatch?"":"rejected"}">
        <div class="lira-sr-attempt-head">
          <span class="lira-sr-attempt-type">${l(e.phraseType)}</span>
          <span class="lira-sr-match-mark ${e.startMatch?"yes":"no"}">${e.startMatch?"start matched":"no start match"}</span>
          <span class="lira-sr-faint lira-sr-mono">requires: ${e.requiredStart.map(l).join(", ")}</span>
        </div>
        ${r}
      </div>`}}function j(s,e){return e?`
    <div class="lira-sr-winner-role-row">
      <span class="lira-sr-winner-role-label">${l(s)}</span>
      <span class="lira-sr-mono">"${l(e.text)}"</span>
      <span class="lira-sr-faint">${l(e.phraseType??"?")}</span>
    </div>`:""}function x(s,e){return`<button type="button" class="lira-tree-toggle" data-action="toggle-node" data-node="${s}" aria-expanded="${e}">${X}</button>`}function k(s,e){const r=s.trim();return r.length>e?`${r.slice(0,e-1)}…`:r}function H(s){const e=/^b(\d+)s(\d+)$/.exec(s);if(e)return{blockIndex:Number(e[1]),sentenceIndex:Number(e[2])}}function _(s){for(let e=0;e<s.blocks.length;e+=1){const r=s.blocks[e];if(r.blockKind!=="paragraph")continue;const t=r.sentences.findIndex(n=>n.errors.length>0);if(t>=0)return`b${e}s${t}`}for(let e=0;e<s.blocks.length;e+=1){const r=s.blocks[e];if(r.blockKind==="paragraph"&&r.sentences.length>0)return`b${e}s0`}}function W(s){if(!s.length)return'<div class="lira-sr-empty">No words to show.</div>';let e="";return s.forEach((r,t)=>{const n=/^[.,!?;:]+$/.test(r.text);t>0&&!n&&(e+=" "),e+=K(r,t)}),`<div class="lira-sr-sentence">${e}</div>`}function K(s,e){return`<span class="lira-sr-word${s.resolved?"":" lira-sr-word-unfound"}" tabindex="0" data-word-index="${e}">${l(s.text)}${Y(s)}</span>`}function Y(s){if(!s.resolved)return`<span class="lira-sr-word-tooltip"><span class="tt-title">${l(s.text)}</span><span class="tt-meta">Not found in the Common Vocabulary Cache</span></span>`;const e=[s.validation??"UNRESOLVED",s.phraseType??"no phrase"],r=[s.partOfSpeech??"?",`conf ${s.confidence!==null?s.confidence.toFixed(2):"—"}`];return`<span class="lira-sr-word-tooltip"><span class="tt-title">${l(s.text)}</span><span class="tt-meta">${e.map(l).join(" · ")}</span><span class="tt-meta">${r.map(l).join(" · ")}</span></span>`}function $(s){return`<span class="lira-sr-badge" style="background:${g[s]??"#7A7A7A"}">${l(s)}</span>`}function N(s,e){return`
    <span class="lira-sr-pos-chip" style="background:${q[e]??"#7A7A7A"}">
      <span class="w">${l(s)}</span>
      <span class="p">${l(e)}</span>
    </span>`}function J(s){return s.length?`<div class="lira-sr-trace-tokens">${s.map(r=>N(r.text,r.partOfSpeech??(r.isMarker?"MARKER":"UNKNOWN"))).join("")}</div>`:""}function G(s){return s.length?`
    <div class="lira-sr-errors">
      ${s.map(e=>`
        <div class="lira-sr-error-row">
          <span class="lira-sr-strong">${l(e.kind)}:</span>
          ${l(e.message)}${e.tokenText?` ("${l(e.tokenText)}")`:""}
        </div>`).join("")}
    </div>`:""}function l(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const X='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',Q=`
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

/* Winner summary card. */
.lira-sr-winner-head { display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
.lira-sr-winner-roles { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.3rem; }
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
`,E="Common",C=[{id:"vocabulary",label:"Vocabulary",available:!0},{id:"linguistics",label:"Linguistics",available:!0},{id:"knowledge",label:"Knowledge",available:!1}],S="lira-portal-shell-styles",I="lira-vocabulary-fragment-styles";class Z{constructor(e,r,t,n,a={}){o(this,"mode");o(this,"mobileScreen","browse");o(this,"selectedName");o(this,"selectedComponent","vocabulary");o(this,"treeCollapsed",!1);o(this,"title");o(this,"container");o(this,"serviceStatusView");o(this,"sentenceReaderView");o(this,"renderToken",0);o(this,"currentVocabularyDomainName");var i;this.registry=e,this.vocabularyClient=r,this.statusBoard=n,this.title=a.title??"LIRA",this.mode=typeof window<"u"&&window.matchMedia("(max-width: 720px)").matches?"mobile":"desktop",this.selectedName=(i=this.registry.roots()[0])==null?void 0:i.name,this.serviceStatusView=new F(n),this.sentenceReaderView=new U(t),this.statusBoard.subscribe(c=>{const p=c.find(u=>u.id==="vocabulary");p&&this.updateVocabToolbar(p)}),this.vocabularyClient.onDomainUpdated(c=>{this.registry.add(c),this.render()}),this.searchWordsBridge(),this.searchPhrasesBridge(),this.searchSensesBridge(),this.searchRelationshipsBridge(),this.resolveHierarchyBridge()}searchWordsBridge(){document.addEventListener("lira-search-words",e=>{const r=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchWords(this.currentVocabularyDomainName,{wordId:r.wordId,word:r.word,gloss:r.gloss,definition:r.definition,pos:r.pos,domainLabel:r.domain,rootWordsOnly:r.rootWordsOnly,limit:r.limit}).then(t=>{document.dispatchEvent(new CustomEvent("lira-search-words-result",{detail:{requestId:r.requestId,words:t.words,totalMatches:t.totalMatches}}))})})}searchPhrasesBridge(){document.addEventListener("lira-search-phrases",e=>{const r=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchPhrases(this.currentVocabularyDomainName,{word:r.word,gloss:r.gloss,definition:r.definition,pos:r.pos,limit:r.limit}).then(t=>{document.dispatchEvent(new CustomEvent("lira-search-phrases-result",{detail:{requestId:r.requestId,phrases:t.phrases,totalMatches:t.totalMatches}}))})})}searchSensesBridge(){document.addEventListener("lira-search-senses",e=>{const r=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchSenses(this.currentVocabularyDomainName,{word:r.word,gloss:r.gloss,definition:r.definition,pos:r.pos,limit:r.limit}).then(t=>{document.dispatchEvent(new CustomEvent("lira-search-senses-result",{detail:{requestId:r.requestId,senses:t.senses,totalMatches:t.totalMatches}}))})})}searchRelationshipsBridge(){document.addEventListener("lira-search-relationships",e=>{const r=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchRelationships(this.currentVocabularyDomainName,{wordId:r.wordId,query:r.query,limit:r.limit}).then(t=>{document.dispatchEvent(new CustomEvent("lira-search-relationships-result",{detail:{requestId:r.requestId,relationships:t.relationships,totalMatches:t.totalMatches}}))})})}resolveHierarchyBridge(){document.addEventListener("lira-resolve-hierarchy",e=>{const r=e.detail;this.currentVocabularyDomainName&&this.vocabularyClient.resolveHierarchy(this.currentVocabularyDomainName,{kind:r.kind,wordId:r.wordId,limit:r.limit}).then(t=>{document.dispatchEvent(new CustomEvent("lira-resolve-hierarchy-result",{detail:{requestId:r.requestId,...t}}))})})}mount(e){this.container=e,document.title=this.title,this.ensureStyles(),e.addEventListener("click",r=>this.handleClick(r)),this.render()}handleClick(e){const r=e.target.closest("[data-action]");if(!r||r.disabled)return;const t=r.dataset.action;t==="select"?(this.selectedName=r.dataset.domain,this.mode==="mobile"&&(this.mobileScreen="view"),this.render()):t==="mode"?(this.mode=r.dataset.mode,this.mode==="mobile"&&(this.mobileScreen=this.selectedName?"view":"browse"),this.render()):t==="back"?(this.mobileScreen="browse",this.render()):t==="component"?(this.selectedComponent=r.dataset.component,this.render()):t==="toggle-tree"?(this.treeCollapsed=!this.treeCollapsed,this.render()):t==="seed-wordnet"?this.vocabularyClient.seedWordNet(E):t==="seed-common-vocabulary"&&this.vocabularyClient.seedCommonVocabulary(E)}renderVocabToolbar(){return`<div class="portal-vocab-toolbar">${this.vocabToolbarInner(this.statusBoard.get("vocabulary"))}</div>`}vocabToolbarInner(e){const r=(e==null?void 0:e.state)==="running",t=e==null?void 0:e.progress;return`
      <button type="button" class="portal-vocab-toolbar-action" data-action="seed-common-vocabulary" ${r?"disabled":""}>Seed Vocabulary</button>
      <button type="button" class="portal-vocab-toolbar-action" data-action="seed-wordnet" ${r?"disabled":""}>Load WordNet</button>
      <span class="portal-vocab-toolbar-detail">${e!=null&&e.detail?h(e.detail):""}</span>
      ${t!==void 0?`<div class="portal-vocab-toolbar-progress"><div class="portal-vocab-toolbar-progress-fill" style="width:${Math.round(t*100)}%"></div></div>`:""}
    `}updateVocabToolbar(e){var t;const r=(t=this.container)==null?void 0:t.querySelector(".portal-vocab-toolbar");r&&(r.innerHTML=this.vocabToolbarInner(e))}ensureStyles(){if(document.getElementById(S))return;const e=document.createElement("style");e.id=S,e.textContent=de,document.head.appendChild(e)}ensureFragmentStyles(e){if(document.getElementById(I))return;const r=document.createElement("style");r.id=I,r.textContent=e,document.head.appendChild(r)}render(){if(!this.container)return;const e=this.selectedName?this.registry.get(this.selectedName):void 0;this.renderToken++;const r=this.mode==="desktop"&&this.treeCollapsed?"tree-collapsed":"";this.container.innerHTML=`
      <div class="portal-shell mode-${this.mode} ${r}">
        ${this.renderTopbar(e)}
        <div class="portal-body">
          ${this.renderBody(e)}
        </div>
      </div>
    `;const t=this.container.querySelector(".portal-service-status");t&&this.serviceStatusView.mount(t),e&&this.selectedComponent==="vocabulary"?this.loadView(e):e&&this.selectedComponent==="linguistics"&&this.loadLinguisticsView()}loadLinguisticsView(){if(!this.container)return;const e=this.container.querySelector(".portal-fragment-mount");e&&this.sentenceReaderView.mount(e)}async loadView(e){const r=++this.renderToken;this.setViewStatus("Loading Vocabulary…");let t;try{t=await this.vocabularyClient.renderDomain(e.name)}catch(a){if(r!==this.renderToken)return;this.setViewStatus(`Couldn't load this Domain's Vocabulary view: ${a instanceof Error?a.message:String(a)}`);return}if(r!==this.renderToken||!this.container)return;this.ensureFragmentStyles(t.style);const n=this.container.querySelector(".portal-fragment-mount");if(n){n.innerHTML=t.body,this.currentVocabularyDomainName=e.name;const a=document.createElement("script");a.textContent=`(function () {
${t.script}
})();`,n.appendChild(a)}this.setViewStatus(void 0)}setViewStatus(e){var t;const r=(t=this.container)==null?void 0:t.querySelector(".portal-view-status");r&&(r.textContent=e??"",r.style.display=e?"block":"none")}renderTopbar(e){const r=`
      <div class="portal-mode-toggle" role="group" aria-label="Layout">
        <button type="button" data-action="mode" data-mode="desktop" class="${this.mode==="desktop"?"active":""}">${ae} Desktop</button>
        <button type="button" data-action="mode" data-mode="mobile" class="${this.mode==="mobile"?"active":""}">${ie} Mobile</button>
      </div>`;if(this.mode==="mobile")return this.mobileScreen==="view"&&e?`
          <div class="portal-topbar">
            <button type="button" class="portal-back" data-action="back" aria-label="Back to Domains">${se}</button>
            <span class="portal-topbar-title">${h(e.name)}</span>
            ${r}
          </div>`:`<div class="portal-topbar"><span class="portal-topbar-title">All Domains</span>${r}</div>`;const t=e?this.registry.ancestryOf(e.name):[];return`<div class="portal-topbar"><nav class="portal-breadcrumb">${[`<span class="crumb-root">${ne} All Domains</span>`,...t.map(a=>`<span>${h(a.name)}</span>`)].join(`<span class="crumb-sep">${te}</span>`)}</nav>${r}</div>`}renderBody(e){return this.mode==="desktop"?`${this.renderTree()}${this.renderViewPane(e)}`:this.mobileScreen==="browse"?`<div class="portal-tree portal-tree--mobile">${this.renderTreeRows(0)}</div>`:this.renderViewPane(e,!0)}renderTree(){return this.treeCollapsed?`
        <nav class="portal-tree portal-tree--collapsed">
          <button type="button" class="portal-tree-toggle" data-action="toggle-tree" title="Expand Domains" aria-label="Expand Domains" aria-expanded="false">${le}</button>
        </nav>`:`
      <nav class="portal-tree">
        <div class="portal-tree-label">
          <span>Domains</span>
          <button type="button" class="portal-tree-toggle" data-action="toggle-tree" title="Collapse Domains" aria-label="Collapse Domains" aria-expanded="true">${oe}</button>
        </div>
        ${this.renderTreeRows(0)}
      </nav>`}renderTreeRows(e,r){return(e===0?this.registry.roots():this.registry.children(r??"")).map(n=>{const a=this.registry.children(n.name),i=n.name===this.selectedName;return`
          <div class="portal-tree-row depth-${e} ${i?"selected":""}" data-action="select" data-domain="${h(n.name)}">
            ${a.length>0?re:'<span class="chev-spacer"></span>'}
            ${ee}
            <span class="name">${h(n.name)}</span>
            <span class="count">${n.wordCount.toLocaleString()}</span>
          </div>
          ${a.length>0?this.renderTreeRows(e+1,n.name):""}
        `}).join("")}renderComponentSwitcher(){return`
      <div class="portal-component-switcher" role="tablist" aria-label="UI Component">
        ${C.map(e=>`
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
      </div>`}renderViewPane(e,r=!1){const t=this.renderComponentSwitcher(),n='<div class="portal-service-status"></div>',a=this.selectedComponent==="vocabulary"?this.renderVocabToolbar():"";if(!e)return`
        <div class="portal-view ${r?"portal-view--full":""}">
          ${t}
          ${a}
          <div class="portal-view-empty">Select a Domain to continue.</div>
          ${n}
        </div>`;const i=C.find(p=>p.id===this.selectedComponent),c=i!=null&&i.available?`
        <div class="portal-view-status" style="display:none"></div>
        <div class="portal-fragment-mount"></div>`:`<div class="portal-view-empty">${h((i==null?void 0:i.label)??"This component")} is not ported yet.</div>`;return`
      <div class="portal-view ${r?"portal-view--full":""}">
        ${t}
        ${a}
        ${c}
        ${n}
      </div>`}}function h(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const ee='<svg class="i-folder" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.5A1 1 0 0 1 2.5 2.5h3.6l1.2 1.4H13.5A1 1 0 0 1 14.5 5v7A1 1 0 0 1 13.5 13h-11a1 1 0 0 1-1-1v-8.5z"/></svg>',re='<svg class="i-chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',te='<svg class="i-chev-right" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>',ne='<svg class="i-home" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 8l6-5 6 5M4 7v6h8V7"/></svg>',se='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3L5 8l5 5"/></svg>',ae='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1.5" y="2.5" width="13" height="9" rx="1"/><path d="M6 13.5h4"/></svg>',ie='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4.5" y="1.5" width="7" height="13" rx="1.4"/></svg>',oe='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3L5 8l5 5"/></svg>',le='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>',de=`
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
`;class ce{constructor(){o(this,"worker");o(this,"statusListeners",new Set);o(this,"domainUpdateListeners",new Set);o(this,"readyResolvers",[]);o(this,"pendingRenders",new Map);o(this,"pendingSearches",new Map);o(this,"pendingPhraseSearches",new Map);o(this,"pendingSenseSearches",new Map);o(this,"pendingRelationshipSearches",new Map);o(this,"pendingHierarchyResolutions",new Map);this.worker=new Worker(new URL(""+new URL("vocabulary_worker-CA7yBzFw.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.addEventListener("message",e=>{this.handleMessage(e.data)})}onStatus(e){return this.statusListeners.add(e),()=>{this.statusListeners.delete(e)}}init(){return new Promise(e=>{this.readyResolvers.push(e),this.post({type:"init"})})}renderDomain(e){const r=`${e}-${Math.random().toString(36).slice(2)}`;return new Promise((t,n)=>{this.pendingRenders.set(r,{resolve:t,reject:n}),this.post({type:"render",requestId:r,domain:e})})}seedWordNet(e){this.post({type:"seed-wordnet",domain:e})}seedCommonVocabulary(e){this.post({type:"seed-common-vocabulary",domain:e})}onDomainUpdated(e){return this.domainUpdateListeners.add(e),()=>{this.domainUpdateListeners.delete(e)}}searchWords(e,r){const t=`search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(n=>{this.pendingSearches.set(t,n),this.post({type:"search-words",requestId:t,domain:e,wordId:r.wordId,word:r.word,gloss:r.gloss,definition:r.definition,pos:r.pos,domainLabel:r.domainLabel,rootWordsOnly:r.rootWordsOnly,limit:r.limit})})}searchPhrases(e,r){const t=`phrase-search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(n=>{this.pendingPhraseSearches.set(t,n),this.post({type:"search-phrases",requestId:t,domain:e,word:r.word,gloss:r.gloss,definition:r.definition,pos:r.pos,limit:r.limit})})}searchSenses(e,r){const t=`sense-search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(n=>{this.pendingSenseSearches.set(t,n),this.post({type:"search-senses",requestId:t,domain:e,word:r.word,gloss:r.gloss,definition:r.definition,pos:r.pos,limit:r.limit})})}searchRelationships(e,r){const t=`rel-search-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(n=>{this.pendingRelationshipSearches.set(t,n),this.post({type:"search-relationships",requestId:t,domain:e,wordId:r.wordId,query:r.query,limit:r.limit})})}resolveHierarchy(e,r){const t=`hierarchy-${e}-${Math.random().toString(36).slice(2)}`;return new Promise(n=>{this.pendingHierarchyResolutions.set(t,n),this.post({type:"resolve-hierarchy",requestId:t,domain:e,kind:r.kind,wordId:r.wordId,limit:r.limit})})}post(e){this.worker.postMessage(e)}handleMessage(e){if(e.type==="status")for(const r of this.statusListeners)r(e.state,e.detail,e.progress);else if(e.type==="ready"){const r=this.readyResolvers.splice(0);for(const t of r)t(e.domains)}else if(e.type==="rendered"){const r=this.pendingRenders.get(e.requestId);r&&(this.pendingRenders.delete(e.requestId),r.resolve(e.fragment))}else if(e.type==="render-error"){const r=this.pendingRenders.get(e.requestId);r&&(this.pendingRenders.delete(e.requestId),r.reject(new Error(e.message)))}else if(e.type==="domain-updated")for(const r of this.domainUpdateListeners)r(e.domain);else if(e.type==="search-words-result"){const r=this.pendingSearches.get(e.requestId);r&&(this.pendingSearches.delete(e.requestId),r({words:e.words,totalMatches:e.totalMatches}))}else if(e.type==="search-phrases-result"){const r=this.pendingPhraseSearches.get(e.requestId);r&&(this.pendingPhraseSearches.delete(e.requestId),r({phrases:e.phrases,totalMatches:e.totalMatches}))}else if(e.type==="search-senses-result"){const r=this.pendingSenseSearches.get(e.requestId);r&&(this.pendingSenseSearches.delete(e.requestId),r({senses:e.senses,totalMatches:e.totalMatches}))}else if(e.type==="search-relationships-result"){const r=this.pendingRelationshipSearches.get(e.requestId);r&&(this.pendingRelationshipSearches.delete(e.requestId),r({relationships:e.relationships,totalMatches:e.totalMatches}))}else if(e.type==="resolve-hierarchy-result"){const r=this.pendingHierarchyResolutions.get(e.requestId);r&&(this.pendingHierarchyResolutions.delete(e.requestId),r({nodes:e.nodes,edges:e.edges,roots:e.roots,totalEdgeCount:e.totalEdgeCount,totalNodeCount:e.totalNodeCount,fellBack:e.fellBack,truncated:e.truncated}))}else e.type==="error"&&console.error("Vocabulary Service error:",e.message)}}class pe{constructor(){o(this,"worker");o(this,"statusListeners",new Set);o(this,"readyResolvers",[]);o(this,"pendingReads",new Map);o(this,"pendingReadDocuments",new Map);this.worker=new Worker(new URL(""+new URL("linguistics_worker-yTE8kPyh.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.addEventListener("message",e=>{this.handleMessage(e.data)})}onStatus(e){return this.statusListeners.add(e),()=>{this.statusListeners.delete(e)}}init(){return new Promise(e=>{this.readyResolvers.push(e),this.post({type:"init"})})}read(e,r,t=!1){const n=`read-${Math.random().toString(36).slice(2)}`;return new Promise((a,i)=>{this.pendingReads.set(n,{resolve:a,reject:i}),this.post({type:"read",requestId:n,text:e,learningEnabled:r,skipLearning:t})})}readDocument(e,r){const t=`read-doc-${Math.random().toString(36).slice(2)}`;return new Promise((n,a)=>{this.pendingReadDocuments.set(t,{resolve:n,reject:a}),this.post({type:"read-document",requestId:t,text:e,learningEnabled:r})})}post(e){this.worker.postMessage(e)}handleMessage(e){if(e.type==="status")for(const r of this.statusListeners)r(e.state,e.detail);else if(e.type==="ready"){const r=this.readyResolvers.splice(0);for(const t of r)t(e.wordCount)}else if(e.type==="read-result"){const r=this.pendingReads.get(e.requestId);r&&(this.pendingReads.delete(e.requestId),r.resolve(e.result))}else if(e.type==="read-document-result"){const r=this.pendingReadDocuments.get(e.requestId);r&&(this.pendingReadDocuments.delete(e.requestId),r.resolve(e.result))}else if(e.type==="error"){if(e.requestId){const r=this.pendingReads.get(e.requestId);if(r){this.pendingReads.delete(e.requestId),r.reject(new Error(e.message));return}const t=this.pendingReadDocuments.get(e.requestId);if(t){this.pendingReadDocuments.delete(e.requestId),t.reject(new Error(e.message));return}}console.error("Linguistic Service error:",e.message)}}}function ue(){const s=document.querySelector("#app");if(!s)return;s.style.height="100vh";const e=new L;e.register("vocabulary","Vocabulary Service","idle","Starting…"),e.register("linguistics","Linguistic Service","idle","Starting…"),e.register("knowledge","Knowledge Service","not-ported");const r=new A(e,"LIRA");r.mount(s);const t=new ce;t.onStatus((a,i,c)=>e.update("vocabulary",a,i,c));const n=new pe;n.onStatus((a,i)=>e.update("linguistics",a,i)),Promise.all([t.init(),n.init()]).then(([a])=>{r.destroy();const i=new B(a);new Z(i,t,n,e,{title:"LIRA"}).mount(s)}).catch(a=>{e.update("vocabulary","error",a instanceof Error?a.message:String(a))})}ue();
