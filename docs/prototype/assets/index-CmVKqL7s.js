var Ka=Object.defineProperty;var Ya=(a,n,t)=>n in a?Ka(a,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[n]=t;var e=(a,n,t)=>Ya(a,typeof n!="symbol"?n+"":n,t);(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const p of document.querySelectorAll('link[rel="modulepreload"]'))r(p);new MutationObserver(p=>{for(const o of p)if(o.type==="childList")for(const _ of o.addedNodes)_.tagName==="LINK"&&_.rel==="modulepreload"&&r(_)}).observe(document,{childList:!0,subtree:!0});function t(p){const o={};return p.integrity&&(o.integrity=p.integrity),p.referrerPolicy&&(o.referrerPolicy=p.referrerPolicy),p.crossOrigin==="use-credentials"?o.credentials="include":p.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function r(p){if(p.ep)return;p.ep=!0;const o=t(p);fetch(p.href,o)}})();/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/data/service_status
 * │ Filename        │ service_status.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-09-13
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Background Service status model (ServiceStatus) and the
 * │                 │ ServiceStatusBoard every Service reports its state to.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/data/service_status
 * @file service_status.ts
 * @author Gurpinder Gill
 * @license MIT
 */class za{constructor(){e(this,"statuses",new Map);e(this,"listeners",new Set)}register(n,t,r="idle",p){this.statuses.set(n,{id:n,label:t,state:r,detail:p}),this.notify()}update(n,t,r,p){const o=this.statuses.get(n);o&&(this.statuses.set(n,{...o,state:t,detail:r,progress:p}),this.notify())}get(n){return this.statuses.get(n)}all(){return[...this.statuses.values()]}subscribe(n){return this.listeners.add(n),n(this.all()),()=>{this.listeners.delete(n)}}notify(){const n=this.all();for(const t of this.listeners)t(n)}}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/data/portal_domain
 * │ Filename        │ portal_domain.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-09-13
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ A hosted Domain as the Portal shell sees it, plus the
 * │                 │ PortalDomainRegistry that tracks them.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/data/portal_domain
 * @file portal_domain.ts
 * @author Gurpinder Gill
 * @license MIT
 */class qa{constructor(n=[]){e(this,"domains",new Map);for(const t of n)this.add(t)}add(n){this.domains.set(n.name,n)}get(n){return this.domains.get(n)}all(){return[...this.domains.values()]}roots(){return this.all().filter(n=>n.parentName===void 0)}children(n){return this.all().filter(t=>t.parentName===n)}ancestryOf(n){const t=[];let r=this.get(n);for(;r!==void 0;)t.unshift(r),r=r.parentName!==void 0?this.get(r.parentName):void 0;return t}}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/loading_screen
 * │ Filename        │ loading_screen.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-09-13
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ LoadingScreen: the "LIRA Initialising" box, a live checklist
 * │                 │ driven by the ServiceStatusBoard.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/loading_screen
 * @file loading_screen.ts
 * @author Gurpinder Gill
 * @license MIT
 */class Ma{constructor(n,t="LIRA"){e(this,"unsubscribe");this.board=n,this.title=t}mount(n){var t;this.ensureStyles(),(t=this.unsubscribe)==null||t.call(this),this.unsubscribe=this.board.subscribe(r=>{n.innerHTML=this.renderScreen(r)})}waitFor(...n){return new Promise(t=>{const r=_=>_==="done"||_==="error",p=_=>{const c=_.filter(i=>n.includes(i.id));c.length===n.length&&c.every(i=>r(i.state))&&(o(),t())},o=this.board.subscribe(p)})}destroy(){var n;(n=this.unsubscribe)==null||n.call(this),this.unsubscribe=void 0}renderScreen(n){return`
      <div class="loading-screen">
        <div class="loading-box">
          <div class="loading-title">${M(this.title)}</div>
          <div class="loading-subtitle">Initialising…</div>
          <div class="loading-steps">
            ${n.map(t=>this.renderStep(t)).join("")}
          </div>
        </div>
      </div>
    `}renderStep(n){return`
      <div class="loading-step state-${n.state}">
        <span class="loading-step-icon">${Qa[n.state]}</span>
        <span class="loading-step-label">${M(n.label)}</span>
        <span class="loading-step-detail">${M(n.detail??Za[n.state])}</span>
      </div>
    `}ensureStyles(){if(document.getElementById(la))return;const n=document.createElement("style");n.id=la,n.textContent=an,document.head.appendChild(n)}}const Za={"not-ported":"Not ported yet",idle:"Waiting…",running:"Working…",done:"Ready",error:"Failed"},Qa={"not-ported":"–",idle:"○",running:'<span class="loading-spinner"></span>',done:"✓",error:"✕"};function M(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const la="lira-loading-screen-styles",an=`
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
`;/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/data/log_event
 * │ Filename        │ log_event.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-09-14
 * │ Modified Date   │ 2026-09-14
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Structured log entries (LogEvent) and the LogEventBoard that
 * │                 │ collects them for the Portal's log view.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/data/log_event
 * @file log_event.ts
 * @author Gurpinder Gill
 * @license MIT
 */const nn=300;class tn{constructor(){e(this,"events",[]);e(this,"listeners",new Set)}append(n){this.events.push(n),this.events.length>nn&&this.events.shift(),this.notify()}all(){return[...this.events]}subscribe(n){return this.listeners.add(n),n(this.all()),()=>{this.listeners.delete(n)}}notify(){const n=this.all();for(const t of this.listeners)t(n)}}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/role/logger
 * │ Filename        │ logger.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-09-14
 * │ Modified Date   │ 2026-09-14
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Logger: emits structured LogEvents to a pluggable LogSink, so
 * │                 │ the same logger works on the main thread and inside Web Workers.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/role/logger
 * @file logger.ts
 * @author Gurpinder Gill
 * @license MIT
 */class rn{constructor(n,t){this.source=n,this.sink=t}info(n){this.emit("info",n)}warn(n){this.emit("warn",n)}error(n){this.emit("error",n)}emit(n,t){this.sink({timestamp:Date.now(),level:n,source:this.source,message:t})}}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/service_status_view
 * │ Filename        │ service_status_view.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-09-14
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ ServiceStatusView: the Background Services panel, one row per
 * │                 │ Service with optional attached actions.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/service_status_view
 * @file service_status_view.ts
 * @author Gurpinder Gill
 * @license MIT
 */class pn{constructor(n,t=[],r){e(this,"unsubscribeStatus");e(this,"unsubscribeLog");e(this,"collapsed",!1);e(this,"logCollapsed",!1);e(this,"latestStatuses",[]);e(this,"latestEvents",[]);e(this,"container");this.board=n,this.actions=t,this.logBoard=r}mount(n){var t,r;this.container=n,this.ensureStyles(),(t=this.unsubscribeStatus)==null||t.call(this),(r=this.unsubscribeLog)==null||r.call(this),n.addEventListener("click",p=>this.handleClick(p)),this.unsubscribeStatus=this.board.subscribe(p=>{this.latestStatuses=p,this.paint()}),this.logBoard&&(this.unsubscribeLog=this.logBoard.subscribe(p=>{this.latestEvents=p,this.paint()}))}destroy(){var n,t;(n=this.unsubscribeStatus)==null||n.call(this),this.unsubscribeStatus=void 0,(t=this.unsubscribeLog)==null||t.call(this),this.unsubscribeLog=void 0}paint(){this.container&&(this.container.innerHTML=this.renderPanel())}handleClick(n){const t=n.target.closest("[data-action]");if(!(!t||t.disabled)){if(t.dataset.action==="toggle")this.collapsed=!this.collapsed,this.paint();else if(t.dataset.action==="toggle-log")this.logCollapsed=!this.logCollapsed,this.paint();else if(t.dataset.action==="run"){const r=this.actions.find(p=>p.id===t.dataset.actionId);r==null||r.onClick()}}}renderPanel(){const n=this.latestStatuses,t=n.filter(r=>r.state==="running"||r.state==="done").length;return`
      <div class="service-status-panel ${this.collapsed?"collapsed":""}">
        <button type="button" class="service-status-header" data-action="toggle" aria-expanded="${!this.collapsed}">
          <span class="service-status-label">Background Services</span>
          ${this.collapsed?`<span class="service-status-summary">${t}/${n.length} running</span>`:""}
          <span class="service-status-chevron">${Oa}</span>
        </button>
        <div class="service-status-rows">
          ${n.map(r=>this.renderRow(r)).join("")}
        </div>
      </div>
      ${this.logBoard?this.renderLogPanel():""}
    `}renderRow(n){const t=this.actions.find(p=>p.id===n.id),r=n.progress!==void 0?`<div class="service-status-progress"><div class="service-status-progress-fill" style="width:${Math.round(n.progress*100)}%"></div></div>`:"";return`
      <div class="service-status-row-group">
        <div class="service-status-row state-${n.state}">
          <span class="service-status-dot"></span>
          <span class="service-status-name">${C(n.label)}</span>
          <span class="service-status-pill">${on[n.state]}</span>
          ${n.detail?`<span class="service-status-detail">${C(n.detail)}</span>`:""}
          ${t?`<button type="button" class="service-status-action" data-action="run" data-action-id="${C(t.id)}" ${n.state==="running"?"disabled":""}>${C(t.label)}</button>`:""}
        </div>
        ${r}
      </div>
    `}renderLogPanel(){const n=this.latestEvents;return`
      <div class="service-log-panel ${this.logCollapsed?"collapsed":""}">
        <button type="button" class="service-status-header" data-action="toggle-log" aria-expanded="${!this.logCollapsed}">
          <span class="service-status-label">Event Log</span>
          ${this.logCollapsed?`<span class="service-status-summary">${n.length} event${n.length===1?"":"s"}</span>`:""}
          <span class="service-status-chevron">${Oa}</span>
        </button>
        <div class="service-log-rows">
          ${n.length===0?'<div class="service-log-empty">No events yet.</div>':[...n].reverse().map(t=>this.renderLogRow(t)).join("")}
        </div>
      </div>
    `}renderLogRow(n){return`
      <div class="service-log-row level-${n.level}">
        <span class="service-log-time">${cn(n.timestamp)}</span>
        <span class="service-log-level-pill">${_n[n.level]}</span>
        <span class="service-log-source">${C(n.source)}</span>
        <span class="service-log-message">${C(n.message)}</span>
      </div>
    `}ensureStyles(){if(document.getElementById(Ta))return;const n=document.createElement("style");n.id=Ta,n.textContent=en,document.head.appendChild(n)}}const on={"not-ported":"Not ported",idle:"Idle",running:"Running",done:"Running",error:"Error"},_n={info:"Info",warn:"Warn",error:"Error"};function C(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function cn(a){return new Date(a).toLocaleTimeString(void 0,{hour12:!1})}const Oa='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',Ta="lira-service-status-styles",en=`
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
`;/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/data/virtual_file_system
 * │ Filename        │ virtual_file_system.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ In-memory, Unix-shaped filesystem behind the Console's file
 * │                 │ commands. Files hold CCTS BinaryObjects, the 20MB tree
 * │                 │ serialises to one Blob, and errors use real bash phrasing.
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/data/virtual_file_system
 * @file virtual_file_system.ts
 * @author Gurpinder Gill
 * @license MIT
 */const An=20*1024*1024;class In{constructor(n=An){e(this,"root",{kind:"dir",children:new Map});e(this,"cwdPath",[]);this.capacity=n}get capacityBytes(){return this.capacity}usedBytes(){return ca(this.root)}pwd(){return"/"+this.cwdPath.join("/")}changeDirectory(n){const t=this.resolveSegments(n),r=t.length===0?this.root:this.lookupNode(t);if(!r)throw new Error(`cd: ${n}: No such file or directory`);if(r.kind!=="dir")throw new Error(`cd: ${n}: Not a directory`);this.cwdPath=t}list(n){const t=n===void 0?this.cwdPath:this.resolveSegments(n),r=t.length===0?this.root:this.lookupNode(t);if(!r)throw new Error(`ls: cannot access '${n??"."}': No such file or directory`);return r.kind==="file"?[{name:t[t.length-1],kind:"file"}]:[...r.children.entries()].map(([p,o])=>({name:p,kind:o.kind})).sort((p,o)=>p.name.localeCompare(o.name))}makeDirectory(n){const t=this.resolveSegments(n);if(t.length===0)throw new Error(`mkdir: cannot create directory '${n}': File exists`);const r=this.lookupParentDir(t),p=t[t.length-1];if(!r)throw new Error(`mkdir: cannot create directory '${n}': No such file or directory`);if(r.children.has(p))throw new Error(`mkdir: cannot create directory '${n}': File exists`);r.children.set(p,{kind:"dir",children:new Map})}touch(n){var o;const t=this.resolveSegments(n);if(t.length===0)throw new Error(`touch: cannot touch '${n}': Is a directory`);const r=this.lookupParentDir(t),p=t[t.length-1];if(!r)throw new Error(`touch: cannot touch '${n}': No such file or directory`);if(((o=r.children.get(p))==null?void 0:o.kind)==="dir")throw new Error(`touch: cannot touch '${n}': Is a directory`);r.children.has(p)||r.children.set(p,_a(p,{value:new Uint8Array(0)}))}writeFile(n,t,r={}){const p=this.resolveSegments(n);if(p.length===0)throw new Error(`${n}: Is a directory`);const o=this.lookupParentDir(p),_=p[p.length-1];if(!o)throw new Error(`${n}: No such file or directory`);const c=o.children.get(_);if((c==null?void 0:c.kind)==="dir")throw new Error(`${n}: Is a directory`);const i=r.append&&c?{...c.content,value:sn(c.content.value,t.value)}:t,A=c?c.content.value.byteLength:0,P=i.value.byteLength;if(this.usedBytes()-A+P>this.capacity)throw new Error(`${n}: No space left on device`);o.children.set(_,_a(_,i))}readFile(n){const t=this.resolveSegments(n),r=t.length===0?this.root:this.lookupNode(t);if(!r)throw new Error(`cat: ${n}: No such file or directory`);if(r.kind!=="file")throw new Error(`cat: ${n}: Is a directory`);return r.content}remove(n,t={}){const r=this.resolveSegments(n);if(r.length===0)throw new Error(`rm: cannot remove '${n}': Device or resource busy`);const p=this.lookupParentDir(r),o=r[r.length-1],_=p==null?void 0:p.children.get(o);if(!p||!_)throw new Error(`rm: cannot remove '${n}': No such file or directory`);if(_.kind==="dir"&&!t.recursive)throw new Error(`rm: cannot remove '${n}': Is a directory`);p.children.delete(o)}move(n,t){const r=this.resolveSegments(n),p=this.lookupParentDir(r),o=r[r.length-1],_=r.length>0?p==null?void 0:p.children.get(o):void 0;if(!p||!_)throw new Error(`mv: cannot stat '${n}': No such file or directory`);const c=this.resolveDestination(t,o);if(!c.parent)throw new Error(`mv: cannot move '${n}' to '${t}': No such file or directory`);p.children.delete(o),_.kind==="file"&&(_.name=c.name),c.parent.children.set(c.name,_)}copy(n,t,r={}){const p=this.resolveSegments(n),o=p.length===0?this.root:this.lookupNode(p);if(!o)throw new Error(`cp: cannot stat '${n}': No such file or directory`);if(o.kind==="dir"&&!r.recursive)throw new Error(`cp: -r not specified; omitting directory '${n}'`);const _=p[p.length-1]??"",c=this.resolveDestination(t,_);if(!c.parent)throw new Error(`cp: cannot create '${t}': No such file or directory`);if(this.usedBytes()+ca(o)>this.capacity)throw new Error(`cp: ${t}: No space left on device`);c.parent.children.set(c.name,ba(o,c.name))}toBlob(){return new Blob([JSON.stringify(wa(this.root))],{type:"application/json"})}resolveSegments(n){const t=n.startsWith("/")?[]:[...this.cwdPath];for(const r of n.split("/"))if(!(r===""||r===".")){if(r===".."){t.length>0&&t.pop();continue}t.push(r)}return t}lookupNode(n){let t=this.root;for(const r of n){if(t.kind!=="dir")return;const p=t.children.get(r);if(!p)return;t=p}return t}lookupParentDir(n){const t=n.slice(0,-1),r=t.length===0?this.root:this.lookupNode(t);return(r==null?void 0:r.kind)==="dir"?r:void 0}resolveDestination(n,t){const r=this.resolveSegments(n),p=r.length===0?this.root:this.lookupNode(r);return(p==null?void 0:p.kind)==="dir"?{parent:p,name:t}:{parent:this.lookupParentDir(r),name:r[r.length-1]??t}}}function _a(a,n){const t={kind:"file",name:a,content:n};return t.content=Pn(t,n),t}function Pn(a,n){const{filename:t,...r}=n;return{...r,get filename(){return a.name}}}function ca(a){if(a.kind==="file")return a.content.value.byteLength;let n=0;for(const t of a.children.values())n+=ca(t);return n}function ba(a,n){if(a.kind==="file")return _a(n,{...a.content,value:a.content.value.slice()});const t=new Map;for(const[r,p]of a.children)t.set(r,ba(p,r));return{kind:"dir",children:t}}function wa(a){if(a.kind==="file"){const{value:t,mimeCode:r,uri:p,...o}=a.content;return{kind:"file",content:{...o,value:Nn(t),...r?{mimeCode:r.value}:{},...p?{uri:p.value}:{},filename:a.content.filename}}}const n={};for(const[t,r]of a.children)n[t]=wa(r);return{kind:"dir",children:n}}function sn(a,n){const t=new Uint8Array(a.byteLength+n.byteLength);return t.set(a,0),t.set(n,a.byteLength),t}function Nn(a){let n="";for(const t of a)n+=String.fromCharCode(t);return btoa(n)}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/help
 * │ Filename        │ help.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `help` command: lists every registered command from the
 * │                 │ live registry.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/help
 * @file help.ts
 * @author Gurpinder Gill
 * @license MIT
 */const ln={name:"help",description:"list available commands",run:({commands:a})=>["Available commands:",...Object.values(a).sort((n,t)=>n.name.localeCompare(t.name)).map(n=>`  ${n.name.padEnd(8)}${n.description}`)]};/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/clear
 * │ Filename        │ clear.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `clear` command: resets the Console scrollback.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/clear
 * @file clear.ts
 * @author Gurpinder Gill
 * @license MIT
 */const On={name:"clear",description:"clear the console",run:({clearScrollback:a})=>(a(),[])};/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/pwd
 * │ Filename        │ pwd.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `pwd` command: prints the working directory.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/pwd
 * @file pwd.ts
 * @author Gurpinder Gill
 * @license MIT
 */const Tn={name:"pwd",description:"print the working directory",run:({fs:a})=>[a.pwd()]};/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/ls
 * │ Filename        │ ls.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `ls` command: lists a directory (default: the working
 * │                 │ directory), marking directories with a trailing /.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/ls
 * @file ls.ts
 * @author Gurpinder Gill
 * @license MIT
 */const Ln={name:"ls",description:"list directory contents",run:({fs:a,args:n})=>{const t=a.list(n[0]);return t.length===0?[]:[t.map(r=>r.kind==="dir"?`${r.name}/`:r.name).join("  ")]}};/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/cd
 * │ Filename        │ cd.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `cd` command: changes the working directory; bare `cd`
 * │                 │ goes to `/`.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/cd
 * @file cd.ts
 * @author Gurpinder Gill
 * @license MIT
 */const En={name:"cd",description:"change the working directory",run:({fs:a,args:n})=>(a.changeDirectory(n[0]??"/"),[])};/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/shared
 * │ Filename        │ shared.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Helpers shared by Console commands: the multi-operand
 * │                 │ keep-going loop and byte-size formatting.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/shared
 * @file shared.ts
 * @author Gurpinder Gill
 * @license MIT
 */function Ia(a,n){const t=[];for(const r of a)try{n(r)}catch(p){t.push(p instanceof Error?p.message:String(p))}return t}function y(a){return a<1024?`${a}B`:a<1024*1024?`${(a/1024).toFixed(1)}K`:a<1024*1024*1024?`${(a/(1024*1024)).toFixed(1)}M`:`${(a/(1024*1024*1024)).toFixed(1)}G`}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/mkdir
 * │ Filename        │ mkdir.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `mkdir` command: creates one or more directories.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/mkdir
 * @file mkdir.ts
 * @author Gurpinder Gill
 * @license MIT
 */const dn={name:"mkdir",description:"create a directory",run:({fs:a,args:n})=>{if(n.length===0)throw new Error("mkdir: missing operand");return Ia(n,t=>a.makeDirectory(t))}};/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/touch
 * │ Filename        │ touch.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `touch` command: creates empty files.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/touch
 * @file touch.ts
 * @author Gurpinder Gill
 * @license MIT
 */const Dn={name:"touch",description:"create an empty file (no-op if it already exists)",run:({fs:a,args:n})=>{if(n.length===0)throw new Error("touch: missing operand");return Ia(n,t=>a.touch(t))}};/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/cat
 * │ Filename        │ cat.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-11-02
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `cat` command: prints each file's contents (decoded as
 * │                 │ UTF-8), continuing past failed operands like real bash.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/cat
 * @file cat.ts
 * @author Gurpinder Gill
 * @license MIT
 */const vn={name:"cat",description:"print file contents",run:({fs:a,args:n})=>{if(n.length===0)throw new Error("cat: missing operand");const t=[];for(const r of n)try{t.push(new TextDecoder().decode(a.readFile(r).value))}catch(p){t.push(p instanceof Error?p.message:String(p))}return t}};/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/value_objects/data/binary_object
 * │ Filename        │ binary_object.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-02
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ BinaryObject: the CCTS Binary Object. Type (UN/CEFACT D25A
 * │                 │ UDT000002) - bytes plus format, MIME, encoding, character set,
 * │                 │ URI and filename.
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/binary_object
 * @file binary_object.ts
 * @author Gurpinder Gill
 * @license MIT
 */function un(a,n={}){return{value:a,...n}}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/value_objects/data/uri
 * │ Filename        │ uri.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-06
 * │ Modified Date   │ 2026-10-06
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Uri: a validated absolute URI value object wrapping the
 * │                 │ platform URL.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/uri
 * @file uri.ts
 * @author Gurpinder Gill
 * @license MIT
 */class W{constructor(n){e(this,"value");if(!W.isValid(n))throw new Error(`not a valid absolute URI: '${n}'`);this.value=n}static isValid(n){try{return new URL(n),!0}catch{return!1}}static fromUrl(n){return new W(n.href)}toUrl(){return new URL(this.value)}}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/value_objects/data/enum/mimeCodelist
 * │ Filename        │ mimeCodelist.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ MimeCodelist: the complete IANA Media Types registry (2382
 * │                 │ entries), generated from assets/iana/media-types.xml, with its
 * │                 │ version and a case-insensitive lookup.
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/enum/mimeCodelist
 * @file mimeCodelist.ts
 * @author Gurpinder Gill
 * @license MIT
 */var Fa=(a=>(a.APPLICATION_1D_INTERLEAVED_PARITYFEC="application/1d-interleaved-parityfec",a.APPLICATION_3GPDASH_QOE_REPORT_XML="application/3gpdash-qoe-report+xml",a.APPLICATION_3GPP_IMS_XML="application/3gpp-ims+xml",a.APPLICATION_3GPP_MBS_OBJECT_MANIFEST_JSON="application/3gpp-mbs-object-manifest+json",a.APPLICATION_3GPP_MBS_USER_SERVICE_DESCRIPTIONS_JSON="application/3gpp-mbs-user-service-descriptions+json",a.APPLICATION_3GPP_MEDIA_DELIVERY_METRICS_REPORT_JSON="application/3gpp-media-delivery-metrics-report+json",a.APPLICATION_3GPPHAL_JSON="application/3gppHal+json",a.APPLICATION_3GPPHALFORMS_JSON="application/3gppHalForms+json",a.APPLICATION_AAS_ZIP="application/aas+zip",a.APPLICATION_A2L="application/A2L",a.APPLICATION_ACE_GROUPCOMM_CBOR="application/ace-groupcomm+cbor",a.APPLICATION_ACE_TRL_CBOR="application/ace-trl+cbor",a.APPLICATION_ACE_CBOR="application/ace+cbor",a.APPLICATION_ACE_JSON="application/ace+json",a.APPLICATION_ACTIVEMESSAGE="application/activemessage",a.APPLICATION_ACTIVITY_JSON="application/activity+json",a.APPLICATION_AIF_CBOR="application/aif+cbor",a.APPLICATION_AIF_JSON="application/aif+json",a.APPLICATION_ALTO_CDNI_JSON="application/alto-cdni+json",a.APPLICATION_ALTO_CDNIFILTER_JSON="application/alto-cdnifilter+json",a.APPLICATION_ALTO_COSTMAP_JSON="application/alto-costmap+json",a.APPLICATION_ALTO_COSTMAPFILTER_JSON="application/alto-costmapfilter+json",a.APPLICATION_ALTO_DIRECTORY_JSON="application/alto-directory+json",a.APPLICATION_ALTO_ENDPOINTPROP_JSON="application/alto-endpointprop+json",a.APPLICATION_ALTO_ENDPOINTPROPPARAMS_JSON="application/alto-endpointpropparams+json",a.APPLICATION_ALTO_ENDPOINTCOST_JSON="application/alto-endpointcost+json",a.APPLICATION_ALTO_ENDPOINTCOSTPARAMS_JSON="application/alto-endpointcostparams+json",a.APPLICATION_ALTO_ERROR_JSON="application/alto-error+json",a.APPLICATION_ALTO_NETWORKMAPFILTER_JSON="application/alto-networkmapfilter+json",a.APPLICATION_ALTO_NETWORKMAP_JSON="application/alto-networkmap+json",a.APPLICATION_ALTO_PROPMAP_JSON="application/alto-propmap+json",a.APPLICATION_ALTO_PROPMAPPARAMS_JSON="application/alto-propmapparams+json",a.APPLICATION_ALTO_TIPS_JSON="application/alto-tips+json",a.APPLICATION_ALTO_TIPSPARAMS_JSON="application/alto-tipsparams+json",a.APPLICATION_ALTO_UPDATESTREAMCONTROL_JSON="application/alto-updatestreamcontrol+json",a.APPLICATION_ALTO_UPDATESTREAMPARAMS_JSON="application/alto-updatestreamparams+json",a.APPLICATION_AML="application/AML",a.APPLICATION_ANDREW_INSET="application/andrew-inset",a.APPLICATION_APPLEFILE="application/applefile",a.APPLICATION_ASYNCAPI_JSON="application/asyncapi+json",a.APPLICATION_ASYNCAPI_YAML="application/asyncapi+yaml",a.APPLICATION_AT_JWT="application/at+jwt",a.APPLICATION_ATF="application/ATF",a.APPLICATION_ATFX="application/ATFX",a.APPLICATION_ATOM_XML="application/atom+xml",a.APPLICATION_ATOMCAT_XML="application/atomcat+xml",a.APPLICATION_ATOMDELETED_XML="application/atomdeleted+xml",a.APPLICATION_ATOMICMAIL="application/atomicmail",a.APPLICATION_ATOMSVC_XML="application/atomsvc+xml",a.APPLICATION_ATSC_DWD_XML="application/atsc-dwd+xml",a.APPLICATION_ATSC_DYNAMIC_EVENT_MESSAGE="application/atsc-dynamic-event-message",a.APPLICATION_ATSC_HELD_XML="application/atsc-held+xml",a.APPLICATION_ATSC_RDT_JSON="application/atsc-rdt+json",a.APPLICATION_ATSC_RSAT_XML="application/atsc-rsat+xml",a.APPLICATION_ATXML="application/ATXML",a.APPLICATION_AUTH_POLICY_XML="application/auth-policy+xml",a.APPLICATION_AUTOMATIONML_AML_XML="application/automationml-aml+xml",a.APPLICATION_AUTOMATIONML_AMLX_ZIP="application/automationml-amlx+zip",a.APPLICATION_BACNET_XDD_ZIP="application/bacnet-xdd+zip",a.APPLICATION_BATCH_SMTP="application/batch-SMTP",a.APPLICATION_BEEP_XML="application/beep+xml",a.APPLICATION_BUFR="application/bufr",a.APPLICATION_C2PA="application/c2pa",a.APPLICATION_CALENDAR_JSON="application/calendar+json",a.APPLICATION_CALENDAR_XML="application/calendar+xml",a.APPLICATION_CALL_COMPLETION="application/call-completion",a.APPLICATION_CALS_1840="application/CALS-1840",a.APPLICATION_CAPTIVE_JSON="application/captive+json",a.APPLICATION_CBOR="application/cbor",a.APPLICATION_CBOR_SEQ="application/cbor-seq",a.APPLICATION_CCCEX="application/cccex",a.APPLICATION_CCMP_XML="application/ccmp+xml",a.APPLICATION_CCXML_XML="application/ccxml+xml",a.APPLICATION_CDA_XML="application/cda+xml",a.APPLICATION_CDFX_XML="application/CDFX+XML",a.APPLICATION_CDMI_CAPABILITY="application/cdmi-capability",a.APPLICATION_CDMI_CONTAINER="application/cdmi-container",a.APPLICATION_CDMI_DOMAIN="application/cdmi-domain",a.APPLICATION_CDMI_OBJECT="application/cdmi-object",a.APPLICATION_CDMI_QUEUE="application/cdmi-queue",a.APPLICATION_CDNI="application/cdni",a.APPLICATION_CE_CBOR="application/ce+cbor",a.APPLICATION_CEA="application/CEA",a.APPLICATION_CEA_2018_XML="application/cea-2018+xml",a.APPLICATION_CELLML_XML="application/cellml+xml",a.APPLICATION_CFW="application/cfw",a.APPLICATION_CID="application/cid",a.APPLICATION_CID_EDHOC_CBOR_SEQ="application/cid-edhoc+cbor-seq",a.APPLICATION_CITY_JSON="application/city+json",a.APPLICATION_CITY_JSON_SEQ="application/city+json-seq",a.APPLICATION_CLIENT_AUTHENTICATION_JWT="application/client-authentication+jwt",a.APPLICATION_CLOUDEVENTS_BATCH_JSON="application/cloudevents-batch+json",a.APPLICATION_CLOUDEVENTS_JSON="application/cloudevents+json",a.APPLICATION_CLR="application/clr",a.APPLICATION_CLUE_INFO_XML="application/clue_info+xml",a.APPLICATION_CLUE_XML="application/clue+xml",a.APPLICATION_CMCD="application/cmcd",a.APPLICATION_CMS="application/cms",a.APPLICATION_CMW_CBOR="application/cmw+cbor",a.APPLICATION_CMW_COSE="application/cmw+cose",a.APPLICATION_CMW_JSON="application/cmw+json",a.APPLICATION_CMW_JWS="application/cmw+jws",a.APPLICATION_CNRP_XML="application/cnrp+xml",a.APPLICATION_COAP_EAP="application/coap-eap",a.APPLICATION_COAP_GROUP_JSON="application/coap-group+json",a.APPLICATION_COAP_PAYLOAD="application/coap-payload",a.APPLICATION_COMMONGROUND="application/commonground",a.APPLICATION_CONCISE_PROBLEM_DETAILS_CBOR="application/concise-problem-details+cbor",a.APPLICATION_CONFERENCE_INFO_XML="application/conference-info+xml",a.APPLICATION_CPL_XML="application/cpl+xml",a.APPLICATION_COSE="application/cose",a.APPLICATION_COSE_C509_CBOR="application/cose-c509+cbor",a.APPLICATION_COSE_C509_CERT_CBOR="application/cose-c509-cert+cbor",a.APPLICATION_COSE_C509_CRTEMPLATE_CBOR="application/cose-c509-crtemplate+cbor",a.APPLICATION_COSE_C509_PEM_CBOR="application/cose-c509-pem+cbor",a.APPLICATION_COSE_C509_PKCS10_CBOR="application/cose-c509-pkcs10+cbor",a.APPLICATION_COSE_C509_PRIVKEY_CBOR="application/cose-c509-privkey+cbor",a.APPLICATION_COSE_CERTHASH_CBOR="application/cose-certhash+cbor",a.APPLICATION_COSE_KEY="application/cose-key",a.APPLICATION_COSE_KEY_SET="application/cose-key-set",a.APPLICATION_COSE_X509="application/cose-x509",a.APPLICATION_CSRATTRS="application/csrattrs",a.APPLICATION_CSTA_XML="application/csta+xml",a.APPLICATION_CSTADATA_XML="application/CSTAdata+xml",a.APPLICATION_CSVM_JSON="application/csvm+json",a.APPLICATION_CWL="application/cwl",a.APPLICATION_CWL_JSON="application/cwl+json",a.APPLICATION_CWL_YAML="application/cwl+yaml",a.APPLICATION_CWT="application/cwt",a.APPLICATION_VND_CXTF="application/vnd.cxtf",a.APPLICATION_VND_CXZIP="application/vnd.cxzip",a.APPLICATION_CYBERCASH="application/cybercash",a.APPLICATION_DASH_XML="application/dash+xml",a.APPLICATION_DASH_PATCH_XML="application/dash-patch+xml",a.APPLICATION_DASHDELTA="application/dashdelta",a.APPLICATION_DAVMOUNT_XML="application/davmount+xml",a.APPLICATION_DCA_RFT="application/dca-rft",a.APPLICATION_DCD="application/DCD",a.APPLICATION_DEC_DX="application/dec-dx",a.APPLICATION_DIALOG_INFO_XML="application/dialog-info+xml",a.APPLICATION_DICOM="application/dicom",a.APPLICATION_DICOM_JSON="application/dicom+json",a.APPLICATION_DICOM_XML="application/dicom+xml",a.APPLICATION_DID="application/did",a.APPLICATION_DII="application/DII",a.APPLICATION_DIT="application/DIT",a.APPLICATION_DNS="application/dns",a.APPLICATION_DNS_JSON="application/dns+json",a.APPLICATION_DNS_MESSAGE="application/dns-message",a.APPLICATION_DOTS_CBOR="application/dots+cbor",a.APPLICATION_DPOP_JWT="application/dpop+jwt",a.APPLICATION_DSKPP_XML="application/dskpp+xml",a.APPLICATION_DSSC_DER="application/dssc+der",a.APPLICATION_DSSC_XML="application/dssc+xml",a.APPLICATION_DVCS="application/dvcs",a.APPLICATION_EAT_CWT="application/eat+cwt",a.APPLICATION_EAT_JWT="application/eat+jwt",a.APPLICATION_EAT_BUN_CBOR="application/eat-bun+cbor",a.APPLICATION_EAT_BUN_JSON="application/eat-bun+json",a.APPLICATION_EAT_UCS_CBOR="application/eat-ucs+cbor",a.APPLICATION_EAT_UCS_JSON="application/eat-ucs+json",a.APPLICATION_ECMASCRIPT="application/ecmascript",a.APPLICATION_EDHOC_CBOR_SEQ="application/edhoc+cbor-seq",a.APPLICATION_EDI_CONSENT="application/EDI-consent",a.APPLICATION_EDIFACT="application/EDIFACT",a.APPLICATION_EDI_X12="application/EDI-X12",a.APPLICATION_EFI="application/efi",a.APPLICATION_ELM_JSON="application/elm+json",a.APPLICATION_ELM_XML="application/elm+xml",a.APPLICATION_EMERGENCYCALLDATA_CAP_XML="application/EmergencyCallData.cap+xml",a.APPLICATION_EMERGENCYCALLDATA_COMMENT_XML="application/EmergencyCallData.Comment+xml",a.APPLICATION_EMERGENCYCALLDATA_CONTROL_XML="application/EmergencyCallData.Control+xml",a.APPLICATION_EMERGENCYCALLDATA_DEVICEINFO_XML="application/EmergencyCallData.DeviceInfo+xml",a.APPLICATION_EMERGENCYCALLDATA_ECALL_MSD="application/EmergencyCallData.eCall.MSD",a.APPLICATION_EMERGENCYCALLDATA_LEGACYESN_JSON="application/EmergencyCallData.LegacyESN+json",a.APPLICATION_EMERGENCYCALLDATA_PROVIDERINFO_XML="application/EmergencyCallData.ProviderInfo+xml",a.APPLICATION_EMERGENCYCALLDATA_SERVICEINFO_XML="application/EmergencyCallData.ServiceInfo+xml",a.APPLICATION_EMERGENCYCALLDATA_SUBSCRIBERINFO_XML="application/EmergencyCallData.SubscriberInfo+xml",a.APPLICATION_EMERGENCYCALLDATA_VEDS_XML="application/EmergencyCallData.VEDS+xml",a.APPLICATION_EMMA_XML="application/emma+xml",a.APPLICATION_EMOTIONML_XML="application/emotionml+xml",a.APPLICATION_ENCAPRTP="application/encaprtp",a.APPLICATION_ENTITY_STATEMENT_JWT="application/entity-statement+jwt",a.APPLICATION_EPP_XML="application/epp+xml",a.APPLICATION_EPUB_ZIP="application/epub+zip",a.APPLICATION_ESHOP="application/eshop",a.APPLICATION_EXAMPLE="application/example",a.APPLICATION_EXI="application/exi",a.APPLICATION_EXPECT_CT_REPORT_JSON="application/expect-ct-report+json",a.APPLICATION_EXPLICIT_REGISTRATION_RESPONSE_JWT="application/explicit-registration-response+jwt",a.APPLICATION_EXPRESS="application/express",a.APPLICATION_FASTINFOSET="application/fastinfoset",a.APPLICATION_FASTSOAP="application/fastsoap",a.APPLICATION_FDF="application/fdf",a.APPLICATION_FDT_XML="application/fdt+xml",a.APPLICATION_FHIR_JSON="application/fhir+json",a.APPLICATION_FHIR_XML="application/fhir+xml",a.APPLICATION_FITS="application/fits",a.APPLICATION_FLEXFEC="application/flexfec",a.APPLICATION_FONT_SFNT="application/font-sfnt",a.APPLICATION_FONT_TDPFR="application/font-tdpfr",a.APPLICATION_FONT_WOFF="application/font-woff",a.APPLICATION_FRAMEWORK_ATTRIBUTES_XML="application/framework-attributes+xml",a.APPLICATION_GEO_JSON="application/geo+json",a.APPLICATION_GEO_JSON_SEQ="application/geo+json-seq",a.APPLICATION_GEOFEED_CSV="application/geofeed+csv",a.APPLICATION_GEOPACKAGE_SQLITE3="application/geopackage+sqlite3",a.APPLICATION_GEOPOSE_JSON="application/geopose+json",a.APPLICATION_GEOXACML_JSON="application/geoxacml+json",a.APPLICATION_GEOXACML_XML="application/geoxacml+xml",a.APPLICATION_GLTF_BUFFER="application/gltf-buffer",a.APPLICATION_GML_XML="application/gml+xml",a.APPLICATION_GNAP_BINDING_JWS="application/gnap-binding-jws",a.APPLICATION_GNAP_BINDING_JWSD="application/gnap-binding-jwsd",a.APPLICATION_GNAP_BINDING_ROTATION_JWS="application/gnap-binding-rotation-jws",a.APPLICATION_GNAP_BINDING_ROTATION_JWSD="application/gnap-binding-rotation-jwsd",a.APPLICATION_GRIB="application/grib",a.APPLICATION_GZIP="application/gzip",a.APPLICATION_H224="application/H224",a.APPLICATION_HELD_XML="application/held+xml",a.APPLICATION_HL7V2_XML="application/hl7v2+xml",a.APPLICATION_HTTP="application/http",a.APPLICATION_HYPERSTUDIO="application/hyperstudio",a.APPLICATION_IBE_KEY_REQUEST_XML="application/ibe-key-request+xml",a.APPLICATION_IBE_PKG_REPLY_XML="application/ibe-pkg-reply+xml",a.APPLICATION_IBE_PP_DATA="application/ibe-pp-data",a.APPLICATION_IGES="application/iges",a.APPLICATION_IM_ISCOMPOSING_XML="application/im-iscomposing+xml",a.APPLICATION_INDEX="application/index",a.APPLICATION_INDEX_CMD="application/index.cmd",a.APPLICATION_INDEX_OBJ="application/index.obj",a.APPLICATION_INDEX_RESPONSE="application/index.response",a.APPLICATION_INDEX_VND="application/index.vnd",a.APPLICATION_INKML_XML="application/inkml+xml",a.APPLICATION_IOTP="application/IOTP",a.APPLICATION_IPFIX="application/ipfix",a.APPLICATION_IPP="application/ipp",a.APPLICATION_ISUP="application/ISUP",a.APPLICATION_ITS_XML="application/its+xml",a.APPLICATION_JAVA_ARCHIVE="application/java-archive",a.APPLICATION_JAVASCRIPT="application/javascript",a.APPLICATION_JF2FEED_JSON="application/jf2feed+json",a.APPLICATION_JOSE="application/jose",a.APPLICATION_JOSE_JSON="application/jose+json",a.APPLICATION_JRD_JSON="application/jrd+json",a.APPLICATION_JSCALENDAR_JSON="application/jscalendar+json",a.APPLICATION_JSCONTACT_JSON="application/jscontact+json",a.APPLICATION_JSON="application/json",a.APPLICATION_JSON_PATCH_JSON="application/json-patch+json",a.APPLICATION_JSON_PATCH_QUERY_JSON="application/json-patch-query+json",a.APPLICATION_JSON_SEQ="application/json-seq",a.APPLICATION_JSONPATH="application/jsonpath",a.APPLICATION_JUMBF="application/jumbf",a.APPLICATION_JWK_JSON="application/jwk+json",a.APPLICATION_JWK_SET_JSON="application/jwk-set+json",a.APPLICATION_JWK_SET_JWT="application/jwk-set+jwt",a.APPLICATION_JWT="application/jwt",a.APPLICATION_KB_JWT="application/kb+jwt",a.APPLICATION_KBL_XML="application/kbl+xml",a.APPLICATION_KPML_REQUEST_XML="application/kpml-request+xml",a.APPLICATION_KPML_RESPONSE_XML="application/kpml-response+xml",a.APPLICATION_LD_JSON="application/ld+json",a.APPLICATION_LGR_XML="application/lgr+xml",a.APPLICATION_LINK_FORMAT="application/link-format",a.APPLICATION_LINKSET="application/linkset",a.APPLICATION_LINKSET_JSON="application/linkset+json",a.APPLICATION_LOAD_CONTROL_XML="application/load-control+xml",a.APPLICATION_LOGOUT_JWT="application/logout+jwt",a.APPLICATION_LOST_XML="application/lost+xml",a.APPLICATION_LOSTSYNC_XML="application/lostsync+xml",a.APPLICATION_LPF_ZIP="application/lpf+zip",a.APPLICATION_LXF="application/LXF",a.APPLICATION_MAC_BINHEX40="application/mac-binhex40",a.APPLICATION_MACWRITEII="application/macwriteii",a.APPLICATION_MADS_XML="application/mads+xml",a.APPLICATION_MANIFEST_JSON="application/manifest+json",a.APPLICATION_MARC="application/marc",a.APPLICATION_MARCXML_XML="application/marcxml+xml",a.APPLICATION_MATHEMATICA="application/mathematica",a.APPLICATION_MATHML_XML="application/mathml+xml",a.APPLICATION_MATHML_CONTENT_XML="application/mathml-content+xml",a.APPLICATION_MATHML_PRESENTATION_XML="application/mathml-presentation+xml",a.APPLICATION_MBMS_ASSOCIATED_PROCEDURE_DESCRIPTION_XML="application/mbms-associated-procedure-description+xml",a.APPLICATION_MBMS_DEREGISTER_XML="application/mbms-deregister+xml",a.APPLICATION_MBMS_ENVELOPE_XML="application/mbms-envelope+xml",a.APPLICATION_MBMS_MSK_RESPONSE_XML="application/mbms-msk-response+xml",a.APPLICATION_MBMS_MSK_XML="application/mbms-msk+xml",a.APPLICATION_MBMS_PROTECTION_DESCRIPTION_XML="application/mbms-protection-description+xml",a.APPLICATION_MBMS_RECEPTION_REPORT_XML="application/mbms-reception-report+xml",a.APPLICATION_MBMS_REGISTER_RESPONSE_XML="application/mbms-register-response+xml",a.APPLICATION_MBMS_REGISTER_XML="application/mbms-register+xml",a.APPLICATION_MBMS_SCHEDULE_XML="application/mbms-schedule+xml",a.APPLICATION_MBMS_USER_SERVICE_DESCRIPTION_XML="application/mbms-user-service-description+xml",a.APPLICATION_MBOX="application/mbox",a.APPLICATION_MEASURED_COMPONENT_CBOR="application/measured-component+cbor",a.APPLICATION_MEASURED_COMPONENT_JSON="application/measured-component+json",a.APPLICATION_MEDIA_CONTROL_XML="application/media_control+xml",a.APPLICATION_MEDIA_POLICY_DATASET_XML="application/media-policy-dataset+xml",a.APPLICATION_MEDIASERVERCONTROL_XML="application/mediaservercontrol+xml",a.APPLICATION_MERGE_PATCH_JSON="application/merge-patch+json",a.APPLICATION_METALINK4_XML="application/metalink4+xml",a.APPLICATION_METS_XML="application/mets+xml",a.APPLICATION_MF4="application/MF4",a.APPLICATION_MIKEY="application/mikey",a.APPLICATION_MIPC="application/mipc",a.APPLICATION_MISSING_BLOCKS_CBOR_SEQ="application/missing-blocks+cbor-seq",a.APPLICATION_MMT_AEI_XML="application/mmt-aei+xml",a.APPLICATION_MMT_USD_XML="application/mmt-usd+xml",a.APPLICATION_MODS_XML="application/mods+xml",a.APPLICATION_MOSS_KEYS="application/moss-keys",a.APPLICATION_MOSS_SIGNATURE="application/moss-signature",a.APPLICATION_MOSSKEY_DATA="application/mosskey-data",a.APPLICATION_MOSSKEY_REQUEST="application/mosskey-request",a.APPLICATION_MP21="application/mp21",a.APPLICATION_MP4="application/mp4",a.APPLICATION_MPEG4_GENERIC="application/mpeg4-generic",a.APPLICATION_MPEG4_IOD="application/mpeg4-iod",a.APPLICATION_MPEG4_IOD_XMT="application/mpeg4-iod-xmt",a.APPLICATION_MRB_CONSUMER_XML="application/mrb-consumer+xml",a.APPLICATION_MRB_PUBLISH_XML="application/mrb-publish+xml",a.APPLICATION_MSC_IVR_XML="application/msc-ivr+xml",a.APPLICATION_MSC_MIXER_XML="application/msc-mixer+xml",a.APPLICATION_MSWORD="application/msword",a.APPLICATION_MUD_JSON="application/mud+json",a.APPLICATION_MULTIPART_CORE="application/multipart-core",a.APPLICATION_MXF="application/mxf",a.APPLICATION_N_QUADS="application/n-quads",a.APPLICATION_N_TRIPLES="application/n-triples",a.APPLICATION_NASDATA="application/nasdata",a.APPLICATION_NEWS_CHECKGROUPS="application/news-checkgroups",a.APPLICATION_NEWS_GROUPINFO="application/news-groupinfo",a.APPLICATION_NEWS_TRANSMISSION="application/news-transmission",a.APPLICATION_NLSML_XML="application/nlsml+xml",a.APPLICATION_NODE="application/node",a.APPLICATION_NSS="application/nss",a.APPLICATION_OAUTH_AUTHZ_REQ_JWT="application/oauth-authz-req+jwt",a.APPLICATION_OBLIVIOUS_DNS_MESSAGE="application/oblivious-dns-message",a.APPLICATION_OCSP_REQUEST="application/ocsp-request",a.APPLICATION_OCSP_RESPONSE="application/ocsp-response",a.APPLICATION_OCTET_STREAM="application/octet-stream",a.APPLICATION_ODA="application/ODA",a.APPLICATION_ODM_XML="application/odm+xml",a.APPLICATION_ODX="application/ODX",a.APPLICATION_OEBPS_PACKAGE_XML="application/oebps-package+xml",a.APPLICATION_OGG="application/ogg",a.APPLICATION_OHTTP_KEYS="application/ohttp-keys",a.APPLICATION_OPC_NODESET_XML="application/opc-nodeset+xml",a.APPLICATION_OSCORE="application/oscore",a.APPLICATION_OXPS="application/oxps",a.APPLICATION_P21="application/p21",a.APPLICATION_P21_ZIP="application/p21+zip",a.APPLICATION_P2P_OVERLAY_XML="application/p2p-overlay+xml",a.APPLICATION_PARITYFEC="application/parityfec",a.APPLICATION_PASSPORT="application/passport",a.APPLICATION_PATCH_OPS_ERROR_XML="application/patch-ops-error+xml",a.APPLICATION_PDF="application/pdf",a.APPLICATION_PDX="application/PDX",a.APPLICATION_PEM_CERTIFICATE_CHAIN="application/pem-certificate-chain",a.APPLICATION_PGP_ENCRYPTED="application/pgp-encrypted",a.APPLICATION_PGP_KEYS="application/pgp-keys",a.APPLICATION_PGP_SIGNATURE="application/pgp-signature",a.APPLICATION_PIDF_DIFF_XML="application/pidf-diff+xml",a.APPLICATION_PIDF_XML="application/pidf+xml",a.APPLICATION_PKCS10="application/pkcs10",a.APPLICATION_PKCS7_MIME="application/pkcs7-mime",a.APPLICATION_PKCS7_SIGNATURE="application/pkcs7-signature",a.APPLICATION_PKCS8="application/pkcs8",a.APPLICATION_PKCS8_ENCRYPTED="application/pkcs8-encrypted",a.APPLICATION_PKCS12="application/pkcs12",a.APPLICATION_PKIX_ATTR_CERT="application/pkix-attr-cert",a.APPLICATION_PKIX_CERT="application/pkix-cert",a.APPLICATION_PKIX_CRL="application/pkix-crl",a.APPLICATION_PKIX_PKIPATH="application/pkix-pkipath",a.APPLICATION_PKIXCMP="application/pkixcmp",a.APPLICATION_PLS_XML="application/pls+xml",a.APPLICATION_POC_SETTINGS_XML="application/poc-settings+xml",a.APPLICATION_POSTSCRIPT="application/postscript",a.APPLICATION_PPSP_TRACKER_JSON="application/ppsp-tracker+json",a.APPLICATION_PRIVATE_TOKEN_ISSUER_DIRECTORY="application/private-token-issuer-directory",a.APPLICATION_PRIVATE_TOKEN_REQUEST="application/private-token-request",a.APPLICATION_PRIVATE_TOKEN_RESPONSE="application/private-token-response",a.APPLICATION_PROBLEM_JSON="application/problem+json",a.APPLICATION_PROBLEM_XML="application/problem+xml",a.APPLICATION_PROTOBUF="application/protobuf",a.APPLICATION_PROTOBUF_JSON="application/protobuf+json",a.APPLICATION_PROVENANCE_XML="application/provenance+xml",a.APPLICATION_PROVIDED_CLAIMS_JWT="application/provided-claims+jwt",a.APPLICATION_PRS_ALVESTRAND_TITRAX_SHEET="application/prs.alvestrand.titrax-sheet",a.APPLICATION_PRS_ARCHIVE_MARKDOWN_FORMAT="application/prs.archive-markdown-format",a.APPLICATION_PRS_BWTC32KEY="application/prs.bwtc32key",a.APPLICATION_PRS_CWW="application/prs.cww",a.APPLICATION_PRS_CYN="application/prs.cyn",a.APPLICATION_PRS_HPUB_ZIP="application/prs.hpub+zip",a.APPLICATION_PRS_IMPLIED_DOCUMENT_XML="application/prs.implied-document+xml",a.APPLICATION_PRS_IMPLIED_EXECUTABLE="application/prs.implied-executable",a.APPLICATION_PRS_IMPLIED_OBJECT_JSON="application/prs.implied-object+json",a.APPLICATION_PRS_IMPLIED_OBJECT_JSON_SEQ="application/prs.implied-object+json-seq",a.APPLICATION_PRS_IMPLIED_OBJECT_YAML="application/prs.implied-object+yaml",a.APPLICATION_PRS_IMPLIED_STRUCTURE="application/prs.implied-structure",a.APPLICATION_PRS_MAYFILE="application/prs.mayfile",a.APPLICATION_PRS_NPREND="application/prs.nprend",a.APPLICATION_PRS_PLUCKER="application/prs.plucker",a.APPLICATION_PRS_RDF_XML_CRYPT="application/prs.rdf-xml-crypt",a.APPLICATION_PRS_SCLT="application/prs.sclt",a.APPLICATION_PRS_VCFBZIP2="application/prs.vcfbzip2",a.APPLICATION_PRS_XSF_XML="application/prs.xsf+xml",a.APPLICATION_PSKC_XML="application/pskc+xml",a.APPLICATION_PVD_JSON="application/pvd+json",a.APPLICATION_RDF_XML="application/rdf+xml",a.APPLICATION_ROUGHTIME_MALFEASANCE_JSON="application/roughtime-malfeasance+json",a.APPLICATION_ROUGHTIME_SERVER_JSON="application/roughtime-server+json",a.APPLICATION_ROUTE_APD_XML="application/route-apd+xml",a.APPLICATION_ROUTE_S_TSID_XML="application/route-s-tsid+xml",a.APPLICATION_ROUTE_USD_XML="application/route-usd+xml",a.APPLICATION_RPKI_CCR="application/rpki-ccr",a.APPLICATION_RPKI_CCR_GZIP="application/rpki-ccr+gzip",a.APPLICATION_QSIG="application/QSIG",a.APPLICATION_RAPTORFEC="application/raptorfec",a.APPLICATION_RDAP_JSON="application/rdap+json",a.APPLICATION_REGINFO_XML="application/reginfo+xml",a.APPLICATION_RELAX_NG_COMPACT_SYNTAX="application/relax-ng-compact-syntax",a.APPLICATION_REMOTE_PRINTING="application/remote-printing",a.APPLICATION_REPUTON_JSON="application/reputon+json",a.APPLICATION_RESOLVE_RESPONSE_JWT="application/resolve-response+jwt",a.APPLICATION_RESOURCE_LISTS_DIFF_XML="application/resource-lists-diff+xml",a.APPLICATION_RESOURCE_LISTS_XML="application/resource-lists+xml",a.APPLICATION_RFC_XML="application/rfc+xml",a.APPLICATION_RISCOS="application/riscos",a.APPLICATION_RLMI_XML="application/rlmi+xml",a.APPLICATION_RLS_SERVICES_XML="application/rls-services+xml",a.APPLICATION_RPKI_CHECKLIST="application/rpki-checklist",a.APPLICATION_RPKI_GHOSTBUSTERS="application/rpki-ghostbusters",a.APPLICATION_RPKI_MANIFEST="application/rpki-manifest",a.APPLICATION_RPKI_PUBLICATION="application/rpki-publication",a.APPLICATION_RPKI_ROA="application/rpki-roa",a.APPLICATION_RPKI_SIGNED_TAL="application/rpki-signed-tal",a.APPLICATION_RPKI_UPDOWN="application/rpki-updown",a.APPLICATION_RS_METADATA_XML="application/rs-metadata+xml",a.APPLICATION_RTF="application/rtf",a.APPLICATION_RTPLOOPBACK="application/rtploopback",a.APPLICATION_RTX="application/rtx",a.APPLICATION_SAMLASSERTION_XML="application/samlassertion+xml",a.APPLICATION_SAMLMETADATA_XML="application/samlmetadata+xml",a.APPLICATION_SARIF_EXTERNAL_PROPERTIES_JSON="application/sarif-external-properties+json",a.APPLICATION_SARIF_JSON="application/sarif+json",a.APPLICATION_SBE="application/sbe",a.APPLICATION_SBML_XML="application/sbml+xml",a.APPLICATION_SCAIP_XML="application/scaip+xml",a.APPLICATION_SCIM_JSON="application/scim+json",a.APPLICATION_SCITT_RECEIPT_COSE="application/scitt-receipt+cose",a.APPLICATION_SCITT_STATEMENT_COSE="application/scitt-statement+cose",a.APPLICATION_SCVP_CV_REQUEST="application/scvp-cv-request",a.APPLICATION_SCVP_CV_RESPONSE="application/scvp-cv-response",a.APPLICATION_SCVP_VP_REQUEST="application/scvp-vp-request",a.APPLICATION_SCVP_VP_RESPONSE="application/scvp-vp-response",a.APPLICATION_SD_JWT="application/sd-jwt",a.APPLICATION_SD_JWT_JSON="application/sd-jwt+json",a.APPLICATION_SDF_JSON="application/sdf+json",a.APPLICATION_SDP="application/sdp",a.APPLICATION_SECEVENT_JWT="application/secevent+jwt",a.APPLICATION_SENML_ETCH_CBOR="application/senml-etch+cbor",a.APPLICATION_SENML_ETCH_JSON="application/senml-etch+json",a.APPLICATION_SENML_EXI="application/senml-exi",a.APPLICATION_SENML_CBOR="application/senml+cbor",a.APPLICATION_SENML_JSON="application/senml+json",a.APPLICATION_SENML_XML="application/senml+xml",a.APPLICATION_SENSML_EXI="application/sensml-exi",a.APPLICATION_SENSML_CBOR="application/sensml+cbor",a.APPLICATION_SENSML_JSON="application/sensml+json",a.APPLICATION_SENSML_XML="application/sensml+xml",a.APPLICATION_SEP_EXI="application/sep-exi",a.APPLICATION_SEP_XML="application/sep+xml",a.APPLICATION_SESSION_INFO="application/session-info",a.APPLICATION_SET_PAYMENT="application/set-payment",a.APPLICATION_SET_PAYMENT_INITIATION="application/set-payment-initiation",a.APPLICATION_SET_REGISTRATION="application/set-registration",a.APPLICATION_SET_REGISTRATION_INITIATION="application/set-registration-initiation",a.APPLICATION_SGML="application/SGML",a.APPLICATION_SGML_OPEN_CATALOG="application/sgml-open-catalog",a.APPLICATION_SHF_XML="application/shf+xml",a.APPLICATION_SIEVE="application/sieve",a.APPLICATION_SIMPLE_FILTER_XML="application/simple-filter+xml",a.APPLICATION_SIMPLE_MESSAGE_SUMMARY="application/simple-message-summary",a.APPLICATION_SIMPLESYMBOLCONTAINER="application/simpleSymbolContainer",a.APPLICATION_SIPC="application/sipc",a.APPLICATION_SLATE="application/slate",a.APPLICATION_SMIL="application/smil",a.APPLICATION_SMIL_XML="application/smil+xml",a.APPLICATION_SMPTE336M="application/smpte336m",a.APPLICATION_SOAP_FASTINFOSET="application/soap+fastinfoset",a.APPLICATION_SOAP_XML="application/soap+xml",a.APPLICATION_SPARQL_QUERY="application/sparql-query",a.APPLICATION_SPDX_JSON="application/spdx+json",a.APPLICATION_SPDX3_JSON="application/spdx3+json",a.APPLICATION_SPARQL_RESULTS_XML="application/sparql-results+xml",a.APPLICATION_SPIRITS_EVENT_XML="application/spirits-event+xml",a.APPLICATION_SQL="application/sql",a.APPLICATION_SRGS="application/srgs",a.APPLICATION_SRGS_XML="application/srgs+xml",a.APPLICATION_SRU_XML="application/sru+xml",a.APPLICATION_SSLKEYLOGFILE="application/sslkeylogfile",a.APPLICATION_SSML_XML="application/ssml+xml",a.APPLICATION_ST2110_41="application/ST2110-41",a.APPLICATION_STATUSLIST_CWT="application/statuslist+cwt",a.APPLICATION_STATUSLIST_JWT="application/statuslist+jwt",a.APPLICATION_STIX_JSON="application/stix+json",a.APPLICATION_STRATUM="application/stratum",a.APPLICATION_SUIT_ENVELOPE_COSE="application/suit-envelope+cose",a.APPLICATION_SUIT_REPORT_COSE="application/suit-report+cose",a.APPLICATION_SWID_CBOR="application/swid+cbor",a.APPLICATION_SWID_XML="application/swid+xml",a.APPLICATION_SYSLOG_MSG="application/syslog-msg",a.APPLICATION_TAMP_APEX_UPDATE="application/tamp-apex-update",a.APPLICATION_TAMP_APEX_UPDATE_CONFIRM="application/tamp-apex-update-confirm",a.APPLICATION_TAMP_COMMUNITY_UPDATE="application/tamp-community-update",a.APPLICATION_TAMP_COMMUNITY_UPDATE_CONFIRM="application/tamp-community-update-confirm",a.APPLICATION_TAMP_ERROR="application/tamp-error",a.APPLICATION_TAMP_SEQUENCE_ADJUST="application/tamp-sequence-adjust",a.APPLICATION_TAMP_SEQUENCE_ADJUST_CONFIRM="application/tamp-sequence-adjust-confirm",a.APPLICATION_TAMP_STATUS_QUERY="application/tamp-status-query",a.APPLICATION_TAMP_STATUS_RESPONSE="application/tamp-status-response",a.APPLICATION_TAMP_UPDATE="application/tamp-update",a.APPLICATION_TAMP_UPDATE_CONFIRM="application/tamp-update-confirm",a.APPLICATION_TAXII_JSON="application/taxii+json",a.APPLICATION_TD_JSON="application/td+json",a.APPLICATION_TEEP_CBOR="application/teep+cbor",a.APPLICATION_TEI_XML="application/tei+xml",a.APPLICATION_TETRA_ISI="application/TETRA_ISI",a.APPLICATION_TEXINFO="application/texinfo",a.APPLICATION_THRAUD_XML="application/thraud+xml",a.APPLICATION_TIMESTAMP_QUERY="application/timestamp-query",a.APPLICATION_TIMESTAMP_REPLY="application/timestamp-reply",a.APPLICATION_TIMESTAMPED_DATA="application/timestamped-data",a.APPLICATION_TLSRPT_GZIP="application/tlsrpt+gzip",a.APPLICATION_TLSRPT_JSON="application/tlsrpt+json",a.APPLICATION_TM_JSON="application/tm+json",a.APPLICATION_TNAUTHLIST="application/tnauthlist",a.APPLICATION_TOC_CBOR="application/toc+cbor",a.APPLICATION_TOKEN_INTROSPECTION_JWT="application/token-introspection+jwt",a.APPLICATION_TOML="application/toml",a.APPLICATION_TRICKLE_ICE_SDPFRAG="application/trickle-ice-sdpfrag",a.APPLICATION_TRIG="application/trig",a.APPLICATION_TRUST_CHAIN_JSON="application/trust-chain+json",a.APPLICATION_TRUST_MARK_JWT="application/trust-mark+jwt",a.APPLICATION_TRUST_MARK_DELEGATION_JWT="application/trust-mark-delegation+jwt",a.APPLICATION_TRUST_MARK_STATUS_RESPONSE_JWT="application/trust-mark-status-response+jwt",a.APPLICATION_TTML_XML="application/ttml+xml",a.APPLICATION_TVE_TRIGGER="application/tve-trigger",a.APPLICATION_TZIF="application/tzif",a.APPLICATION_TZIF_LEAP="application/tzif-leap",a.APPLICATION_UCCS_CBOR="application/uccs+cbor",a.APPLICATION_UJCS_JSON="application/ujcs+json",a.APPLICATION_ULPFEC="application/ulpfec",a.APPLICATION_URC_GRPSHEET_XML="application/urc-grpsheet+xml",a.APPLICATION_URC_RESSHEET_XML="application/urc-ressheet+xml",a.APPLICATION_URC_TARGETDESC_XML="application/urc-targetdesc+xml",a.APPLICATION_URC_UISOCKETDESC_XML="application/urc-uisocketdesc+xml",a.APPLICATION_V3C="application/v3c",a.APPLICATION_VC="application/vc",a.APPLICATION_VC_COSE="application/vc+cose",a.APPLICATION_VC_JWT="application/vc+jwt",a.APPLICATION_VC_SD_JWT="application/vc+sd-jwt",a.APPLICATION_VCARD_JSON="application/vcard+json",a.APPLICATION_VCARD_XML="application/vcard+xml",a.APPLICATION_VEC_XML="application/vec+xml",a.APPLICATION_VEC_PACKAGE_GZIP="application/vec-package+gzip",a.APPLICATION_VEC_PACKAGE_ZIP="application/vec-package+zip",a.APPLICATION_VEMMI="application/vemmi",a.APPLICATION_VND_1000MINDS_DECISION_MODEL_XML="application/vnd.1000minds.decision-model+xml",a.APPLICATION_VND_1OB="application/vnd.1ob",a.APPLICATION_VND_3GPP_5GNAS="application/vnd.3gpp.5gnas",a.APPLICATION_VND_3GPP_5GSA2X="application/vnd.3gpp.5gsa2x",a.APPLICATION_VND_3GPP_5GSA2X_LOCAL_SERVICE_INFORMATION="application/vnd.3gpp.5gsa2x-local-service-information",a.APPLICATION_VND_3GPP_5GSV2X="application/vnd.3gpp.5gsv2x",a.APPLICATION_VND_3GPP_5GSV2X_LOCAL_SERVICE_INFORMATION="application/vnd.3gpp.5gsv2x-local-service-information",a.APPLICATION_VND_3GPP_ACCESS_TRANSFER_EVENTS_XML="application/vnd.3gpp.access-transfer-events+xml",a.APPLICATION_VND_3GPP_BSF_XML="application/vnd.3gpp.bsf+xml",a.APPLICATION_VND_3GPP_CRS_XML="application/vnd.3gpp.crs+xml",a.APPLICATION_VND_3GPP_CURRENT_LOCATION_DISCOVERY_XML="application/vnd.3gpp.current-location-discovery+xml",a.APPLICATION_VND_3GPP_GMOP_XML="application/vnd.3gpp.GMOP+xml",a.APPLICATION_VND_3GPP_GTPC="application/vnd.3gpp.gtpc",a.APPLICATION_VND_3GPP_INTERWORKING_DATA="application/vnd.3gpp.interworking-data",a.APPLICATION_VND_3GPP_LPP="application/vnd.3gpp.lpp",a.APPLICATION_VND_3GPP_MC_SIGNALLING_EAR="application/vnd.3gpp.mc-signalling-ear",a.APPLICATION_VND_3GPP_MCDATA_AFFILIATION_COMMAND_XML="application/vnd.3gpp.mcdata-affiliation-command+xml",a.APPLICATION_VND_3GPP_MCDATA_INFO_XML="application/vnd.3gpp.mcdata-info+xml",a.APPLICATION_VND_3GPP_MCDATA_MSGSTORE_CTRL_REQUEST_XML="application/vnd.3gpp.mcdata-msgstore-ctrl-request+xml",a.APPLICATION_VND_3GPP_MCDATA_PAYLOAD="application/vnd.3gpp.mcdata-payload",a.APPLICATION_VND_3GPP_MCDATA_REGROUP_XML="application/vnd.3gpp.mcdata-regroup+xml",a.APPLICATION_VND_3GPP_MCDATA_SERVICE_CONFIG_XML="application/vnd.3gpp.mcdata-service-config+xml",a.APPLICATION_VND_3GPP_MCDATA_SIGNALLING="application/vnd.3gpp.mcdata-signalling",a.APPLICATION_VND_3GPP_MCDATA_UE_CONFIG_XML="application/vnd.3gpp.mcdata-ue-config+xml",a.APPLICATION_VND_3GPP_MCDATA_USER_PROFILE_XML="application/vnd.3gpp.mcdata-user-profile+xml",a.APPLICATION_VND_3GPP_MCPTT_AFFILIATION_COMMAND_XML="application/vnd.3gpp.mcptt-affiliation-command+xml",a.APPLICATION_VND_3GPP_MCPTT_FLOOR_REQUEST_XML="application/vnd.3gpp.mcptt-floor-request+xml",a.APPLICATION_VND_3GPP_MCPTT_INFO_XML="application/vnd.3gpp.mcptt-info+xml",a.APPLICATION_VND_3GPP_MCPTT_LOCATION_INFO_XML="application/vnd.3gpp.mcptt-location-info+xml",a.APPLICATION_VND_3GPP_MCPTT_MBMS_USAGE_INFO_XML="application/vnd.3gpp.mcptt-mbms-usage-info+xml",a.APPLICATION_VND_3GPP_MCPTT_REGROUP_XML="application/vnd.3gpp.mcptt-regroup+xml",a.APPLICATION_VND_3GPP_MCPTT_SERVICE_CONFIG_XML="application/vnd.3gpp.mcptt-service-config+xml",a.APPLICATION_VND_3GPP_MCPTT_SIGNED_XML="application/vnd.3gpp.mcptt-signed+xml",a.APPLICATION_VND_3GPP_MCPTT_UE_CONFIG_XML="application/vnd.3gpp.mcptt-ue-config+xml",a.APPLICATION_VND_3GPP_MCPTT_UE_INIT_CONFIG_XML="application/vnd.3gpp.mcptt-ue-init-config+xml",a.APPLICATION_VND_3GPP_MCPTT_USER_PROFILE_XML="application/vnd.3gpp.mcptt-user-profile+xml",a.APPLICATION_VND_3GPP_MCS_LOCATION_USER_CONFIG_XML="application/vnd.3gpp.mcs-location-user-config+xml",a.APPLICATION_VND_3GPP_MCVIDEO_AFFILIATION_COMMAND_XML="application/vnd.3gpp.mcvideo-affiliation-command+xml",a.APPLICATION_VND_3GPP_MCVIDEO_AFFILIATION_INFO_XML="application/vnd.3gpp.mcvideo-affiliation-info+xml",a.APPLICATION_VND_3GPP_MCVIDEO_INFO_XML="application/vnd.3gpp.mcvideo-info+xml",a.APPLICATION_VND_3GPP_MCVIDEO_LOCATION_INFO_XML="application/vnd.3gpp.mcvideo-location-info+xml",a.APPLICATION_VND_3GPP_MCVIDEO_MBMS_USAGE_INFO_XML="application/vnd.3gpp.mcvideo-mbms-usage-info+xml",a.APPLICATION_VND_3GPP_MCVIDEO_REGROUP_XML="application/vnd.3gpp.mcvideo-regroup+xml",a.APPLICATION_VND_3GPP_MCVIDEO_SERVICE_CONFIG_XML="application/vnd.3gpp.mcvideo-service-config+xml",a.APPLICATION_VND_3GPP_MCVIDEO_TRANSMISSION_REQUEST_XML="application/vnd.3gpp.mcvideo-transmission-request+xml",a.APPLICATION_VND_3GPP_MCVIDEO_UE_CONFIG_XML="application/vnd.3gpp.mcvideo-ue-config+xml",a.APPLICATION_VND_3GPP_MCVIDEO_USER_PROFILE_XML="application/vnd.3gpp.mcvideo-user-profile+xml",a.APPLICATION_VND_3GPP_MID_CALL_XML="application/vnd.3gpp.mid-call+xml",a.APPLICATION_VND_3GPP_NGAP="application/vnd.3gpp.ngap",a.APPLICATION_VND_3GPP_PFCP="application/vnd.3gpp.pfcp",a.APPLICATION_VND_3GPP_PIC_BW_LARGE="application/vnd.3gpp.pic-bw-large",a.APPLICATION_VND_3GPP_PIC_BW_SMALL="application/vnd.3gpp.pic-bw-small",a.APPLICATION_VND_3GPP_PIC_BW_VAR="application/vnd.3gpp.pic-bw-var",a.APPLICATION_VND_3GPP_PINAPP_INFO_XML="application/vnd.3gpp.pinapp-info+xml",a.APPLICATION_VND_3GPP_PROSE_PC3A_XML="application/vnd.3gpp-prose-pc3a+xml",a.APPLICATION_VND_3GPP_PROSE_PC3ACH_XML="application/vnd.3gpp-prose-pc3ach+xml",a.APPLICATION_VND_3GPP_PROSE_PC3CH_XML="application/vnd.3gpp-prose-pc3ch+xml",a.APPLICATION_VND_3GPP_PROSE_PC8_XML="application/vnd.3gpp-prose-pc8+xml",a.APPLICATION_VND_3GPP_PROSE_XML="application/vnd.3gpp-prose+xml",a.APPLICATION_VND_3GPP_S1AP="application/vnd.3gpp.s1ap",a.APPLICATION_VND_3GPP_SEAL_APP_COMM_REQUIREMENTS_INFO_XML="application/vnd.3gpp.seal-app-comm-requirements-info+xml",a.APPLICATION_VND_3GPP_SEAL_DATA_DELIVERY_INFO_CBOR="application/vnd.3gpp.seal-data-delivery-info+cbor",a.APPLICATION_VND_3GPP_SEAL_DATA_DELIVERY_INFO_XML="application/vnd.3gpp.seal-data-delivery-info+xml",a.APPLICATION_VND_3GPP_SEAL_GROUP_DOC_XML="application/vnd.3gpp.seal-group-doc+xml",a.APPLICATION_VND_3GPP_SEAL_INFO_XML="application/vnd.3gpp.seal-info+xml",a.APPLICATION_VND_3GPP_SEAL_LOCATION_INFO_CBOR="application/vnd.3gpp.seal-location-info+cbor",a.APPLICATION_VND_3GPP_SEAL_LOCATION_INFO_XML="application/vnd.3gpp.seal-location-info+xml",a.APPLICATION_VND_3GPP_SEAL_MBMS_USAGE_INFO_XML="application/vnd.3gpp.seal-mbms-usage-info+xml",a.APPLICATION_VND_3GPP_SEAL_MBS_USAGE_INFO_XML="application/vnd.3gpp.seal-mbs-usage-info+xml",a.APPLICATION_VND_3GPP_SEAL_NETWORK_QOS_MANAGEMENT_INFO_XML="application/vnd.3gpp.seal-network-QoS-management-info+xml",a.APPLICATION_VND_3GPP_SEAL_NETWORK_RESOURCE_INFO_CBOR="application/vnd.3gpp.seal-network-resource-info+cbor",a.APPLICATION_VND_3GPP_SEAL_STORE_FORWARD_EVENTS_INFO_XML="application/vnd.3gpp.seal-store-forward-events-info+xml",a.APPLICATION_VND_3GPP_SEAL_UE_CONFIG_INFO_XML="application/vnd.3gpp.seal-ue-config-info+xml",a.APPLICATION_VND_3GPP_SEAL_UNICAST_INFO_XML="application/vnd.3gpp.seal-unicast-info+xml",a.APPLICATION_VND_3GPP_SEAL_USER_PROFILE_INFO_XML="application/vnd.3gpp.seal-user-profile-info+xml",a.APPLICATION_VND_3GPP_SMS="application/vnd.3gpp.sms",a.APPLICATION_VND_3GPP_SMS_XML="application/vnd.3gpp.sms+xml",a.APPLICATION_VND_3GPP_SRVCC_EXT_XML="application/vnd.3gpp.srvcc-ext+xml",a.APPLICATION_VND_3GPP_SRVCC_INFO_XML="application/vnd.3gpp.SRVCC-info+xml",a.APPLICATION_VND_3GPP_STATE_AND_EVENT_INFO_XML="application/vnd.3gpp.state-and-event-info+xml",a.APPLICATION_VND_3GPP_USSD_XML="application/vnd.3gpp.ussd+xml",a.APPLICATION_VND_3GPP_VAE_INFO_XML="application/vnd.3gpp.vae-info+xml",a.APPLICATION_VND_3GPP_V2X_LOCAL_SERVICE_INFORMATION="application/vnd.3gpp-v2x-local-service-information",a.APPLICATION_VND_3GPP2_BCMCSINFO_XML="application/vnd.3gpp2.bcmcsinfo+xml",a.APPLICATION_VND_3GPP2_SMS="application/vnd.3gpp2.sms",a.APPLICATION_VND_3GPP2_TCAP="application/vnd.3gpp2.tcap",a.APPLICATION_VND_3GPP_V2X="application/vnd.3gpp.v2x",a.APPLICATION_VND_3LIGHTSSOFTWARE_IMAGESCAL="application/vnd.3lightssoftware.imagescal",a.APPLICATION_VND_3M_POST_IT_NOTES="application/vnd.3M.Post-it-Notes",a.APPLICATION_VND_ABDALSECURITYGROUP_LOCKBOX="application/vnd.abdalsecuritygroup.lockbox",a.APPLICATION_VND_ACCPAC_SIMPLY_ASO="application/vnd.accpac.simply.aso",a.APPLICATION_VND_ACCPAC_SIMPLY_IMP="application/vnd.accpac.simply.imp",a.APPLICATION_VND_ACM_ADDRESSXFER_JSON="application/vnd.acm.addressxfer+json",a.APPLICATION_VND_ACM_CHATBOT_JSON="application/vnd.acm.chatbot+json",a.APPLICATION_VND_ACUCOBOL="application/vnd.acucobol",a.APPLICATION_VND_ACUCORP="application/vnd.acucorp",a.APPLICATION_VND_ADOBE_FLASH_MOVIE="application/vnd.adobe.flash.movie",a.APPLICATION_VND_ADOBE_FORMSCENTRAL_FCDT="application/vnd.adobe.formscentral.fcdt",a.APPLICATION_VND_ADOBE_FXP="application/vnd.adobe.fxp",a.APPLICATION_VND_ADOBE_PARTIAL_UPLOAD="application/vnd.adobe.partial-upload",a.APPLICATION_VND_ADOBE_XDP_XML="application/vnd.adobe.xdp+xml",a.APPLICATION_VND_AEP_ZIP="application/vnd.aep+zip",a.APPLICATION_VND_AETHEL_PACKAGE="application/vnd.aethel.package",a.APPLICATION_VND_AETHER_IMP="application/vnd.aether.imp",a.APPLICATION_VND_AFPC_AFPLINEDATA="application/vnd.afpc.afplinedata",a.APPLICATION_VND_AFPC_AFPLINEDATA_PAGEDEF="application/vnd.afpc.afplinedata-pagedef",a.APPLICATION_VND_AFPC_CMOCA_CMRESOURCE="application/vnd.afpc.cmoca-cmresource",a.APPLICATION_VND_AFPC_FOCA_CHARSET="application/vnd.afpc.foca-charset",a.APPLICATION_VND_AFPC_FOCA_CODEDFONT="application/vnd.afpc.foca-codedfont",a.APPLICATION_VND_AFPC_FOCA_CODEPAGE="application/vnd.afpc.foca-codepage",a.APPLICATION_VND_AFPC_MODCA="application/vnd.afpc.modca",a.APPLICATION_VND_AFPC_MODCA_CMTABLE="application/vnd.afpc.modca-cmtable",a.APPLICATION_VND_AFPC_MODCA_FORMDEF="application/vnd.afpc.modca-formdef",a.APPLICATION_VND_AFPC_MODCA_MEDIUMMAP="application/vnd.afpc.modca-mediummap",a.APPLICATION_VND_AFPC_MODCA_OBJECTCONTAINER="application/vnd.afpc.modca-objectcontainer",a.APPLICATION_VND_AFPC_MODCA_OVERLAY="application/vnd.afpc.modca-overlay",a.APPLICATION_VND_AFPC_MODCA_PAGESEGMENT="application/vnd.afpc.modca-pagesegment",a.APPLICATION_VND_AGE="application/vnd.age",a.APPLICATION_VND_AGENTMUG_AGENT_JSON="application/vnd.agentmug.agent+json",a.APPLICATION_VND_AGTP_IDENTITY_JSON="application/vnd.agtp.identity+json",a.APPLICATION_VND_AGTP_IDENTITY_YAML="application/vnd.agtp.identity+yaml",a.APPLICATION_VND_AH_BARCODE="application/vnd.ah-barcode",a.APPLICATION_VND_AHEAD_SPACE="application/vnd.ahead.space",a.APPLICATION_VND_AIA="application/vnd.aia",a.APPLICATION_VND_AIRZIP_FILESECURE_AZF="application/vnd.airzip.filesecure.azf",a.APPLICATION_VND_AIRZIP_FILESECURE_AZS="application/vnd.airzip.filesecure.azs",a.APPLICATION_VND_AMADEUS_JSON="application/vnd.amadeus+json",a.APPLICATION_VND_AMAZON_MOBI8_EBOOK="application/vnd.amazon.mobi8-ebook",a.APPLICATION_VND_AMERICANDYNAMICS_ACC="application/vnd.americandynamics.acc",a.APPLICATION_VND_AMIGA_AMI="application/vnd.amiga.ami",a.APPLICATION_VND_AMUNDSEN_MAZE_XML="application/vnd.amundsen.maze+xml",a.APPLICATION_VND_ANDROID_OTA="application/vnd.android.ota",a.APPLICATION_VND_ANKI="application/vnd.anki",a.APPLICATION_VND_ANSER_WEB_CERTIFICATE_ISSUE_INITIATION="application/vnd.anser-web-certificate-issue-initiation",a.APPLICATION_VND_ANTIX_GAME_COMPONENT="application/vnd.antix.game-component",a.APPLICATION_VND_APACHE_ARROW_FILE="application/vnd.apache.arrow.file",a.APPLICATION_VND_APACHE_ARROW_STREAM="application/vnd.apache.arrow.stream",a.APPLICATION_VND_APACHE_PARQUET="application/vnd.apache.parquet",a.APPLICATION_VND_APACHE_THRIFT_BINARY="application/vnd.apache.thrift.binary",a.APPLICATION_VND_APACHE_THRIFT_COMPACT="application/vnd.apache.thrift.compact",a.APPLICATION_VND_APACHE_THRIFT_JSON="application/vnd.apache.thrift.json",a.APPLICATION_VND_APEXLANG="application/vnd.apexlang",a.APPLICATION_VND_API_JSON="application/vnd.api+json",a.APPLICATION_VND_APLEXTOR_WARRP_JSON="application/vnd.aplextor.warrp+json",a.APPLICATION_VND_APOTHEKENDE_RESERVATION_JSON="application/vnd.apothekende.reservation+json",a.APPLICATION_VND_APPLE_INSTALLER_XML="application/vnd.apple.installer+xml",a.APPLICATION_VND_APPLE_KEYNOTE="application/vnd.apple.keynote",a.APPLICATION_VND_APPLE_MPEGURL="application/vnd.apple.mpegurl",a.APPLICATION_VND_APPLE_NUMBERS="application/vnd.apple.numbers",a.APPLICATION_VND_APPLE_PAGES="application/vnd.apple.pages",a.APPLICATION_VND_APPLE_STEERING_LIST="application/vnd.apple.steering-list",a.APPLICATION_VND_ARASTRA_SWI="application/vnd.arastra.swi",a.APPLICATION_VND_ARISTANETWORKS_SWI="application/vnd.aristanetworks.swi",a.APPLICATION_VND_ARTISAN_JSON="application/vnd.artisan+json",a.APPLICATION_VND_ARTSQUARE="application/vnd.artsquare",a.APPLICATION_VND_AS207960_VAS_CONFIG_JER="application/vnd.as207960.vas.config+jer",a.APPLICATION_VND_AS207960_VAS_CONFIG_UPER="application/vnd.as207960.vas.config+uper",a.APPLICATION_VND_AS207960_VAS_TAP_JER="application/vnd.as207960.vas.tap+jer",a.APPLICATION_VND_AS207960_VAS_TAP_UPER="application/vnd.as207960.vas.tap+uper",a.APPLICATION_VND_ASTRAEA_SOFTWARE_IOTA="application/vnd.astraea-software.iota",a.APPLICATION_VND_AUDIOGRAPH="application/vnd.audiograph",a.APPLICATION_VND_AUMTRIX_AUM="application/vnd.aumtrix.aum",a.APPLICATION_VND_AUTOPACKAGE="application/vnd.autopackage",a.APPLICATION_VND_AVALON_JSON="application/vnd.avalon+json",a.APPLICATION_VND_AVISTAR_XML="application/vnd.avistar+xml",a.APPLICATION_VND_BALSAMIQ_BMML_XML="application/vnd.balsamiq.bmml+xml",a.APPLICATION_VND_BALSAMIQ_BMPR="application/vnd.balsamiq.bmpr",a.APPLICATION_VND_BANANA_ACCOUNTING="application/vnd.banana-accounting",a.APPLICATION_VND_BBF_USP_ERROR="application/vnd.bbf.usp.error",a.APPLICATION_VND_BBF_USP_MSG="application/vnd.bbf.usp.msg",a.APPLICATION_VND_BBF_USP_MSG_JSON="application/vnd.bbf.usp.msg+json",a.APPLICATION_VND_BCG_TRUSTDECLARATION="application/vnd.BCG.TrustDeclaration",a.APPLICATION_VND_BEKITZUR_STECH_JSON="application/vnd.bekitzur-stech+json",a.APPLICATION_VND_BELIGHTSOFT_LHZD_ZIP="application/vnd.belightsoft.lhzd+zip",a.APPLICATION_VND_BELIGHTSOFT_LHZL_ZIP="application/vnd.belightsoft.lhzl+zip",a.APPLICATION_VND_BINT_MED_CONTENT="application/vnd.bint.med-content",a.APPLICATION_VND_BIOPAX_RDF_XML="application/vnd.biopax.rdf+xml",a.APPLICATION_VND_BLINK_IDB_VALUE_WRAPPER="application/vnd.blink-idb-value-wrapper",a.APPLICATION_VND_BLOCKFACT_FACTS="application/vnd.blockfact.facts",a.APPLICATION_VND_BLUEICE_MULTIPASS="application/vnd.blueice.multipass",a.APPLICATION_VND_BLUETOOTH_EP_OOB="application/vnd.bluetooth.ep.oob",a.APPLICATION_VND_BLUETOOTH_LE_OOB="application/vnd.bluetooth.le.oob",a.APPLICATION_VND_BMI="application/vnd.bmi",a.APPLICATION_VND_BPF="application/vnd.bpf",a.APPLICATION_VND_BPF3="application/vnd.bpf3",a.APPLICATION_VND_BUSINESSOBJECTS="application/vnd.businessobjects",a.APPLICATION_VND_BYU_UAPI_JSON="application/vnd.byu.uapi+json",a.APPLICATION_VND_BZIP3="application/vnd.bzip3",a.APPLICATION_VND_C3VOC_SCHEDULE_XML="application/vnd.c3voc.schedule+xml",a.APPLICATION_VND_CAB_JSCRIPT="application/vnd.cab-jscript",a.APPLICATION_VND_CANON_CPDL="application/vnd.canon-cpdl",a.APPLICATION_VND_CANON_LIPS="application/vnd.canon-lips",a.APPLICATION_VND_CAPASYSTEMS_PG_JSON="application/vnd.capasystems-pg+json",a.APPLICATION_VND_CEL="application/vnd.cel",a.APPLICATION_VND_CENDIO_THINLINC_CLIENTCONF="application/vnd.cendio.thinlinc.clientconf",a.APPLICATION_VND_CENTURY_SYSTEMS_TCP_STREAM="application/vnd.century-systems.tcp_stream",a.APPLICATION_VND_CHEMDRAW_XML="application/vnd.chemdraw+xml",a.APPLICATION_VND_CHESS_PGN="application/vnd.chess-pgn",a.APPLICATION_VND_CHIPNUTS_KARAOKE_MMD="application/vnd.chipnuts.karaoke-mmd",a.APPLICATION_VND_CIEDI="application/vnd.ciedi",a.APPLICATION_VND_CINDERELLA="application/vnd.cinderella",a.APPLICATION_VND_CIRPACK_ISDN_EXT="application/vnd.cirpack.isdn-ext",a.APPLICATION_VND_CITATIONSTYLES_STYLE_XML="application/vnd.citationstyles.style+xml",a.APPLICATION_VND_CLAYMORE="application/vnd.claymore",a.APPLICATION_VND_CLOANTO_RP9="application/vnd.cloanto.rp9",a.APPLICATION_VND_CLONK_C4GROUP="application/vnd.clonk.c4group",a.APPLICATION_VND_CLUETRUST_CARTOMOBILE_CONFIG="application/vnd.cluetrust.cartomobile-config",a.APPLICATION_VND_CLUETRUST_CARTOMOBILE_CONFIG_PKG="application/vnd.cluetrust.cartomobile-config-pkg",a.APPLICATION_VND_CMMF_CONFIGURATION_INFORMATION_JSON="application/vnd.cmmf-configuration-information+json",a.APPLICATION_VND_CMMF_EFD_XML="application/vnd.cmmf-efd+xml",a.APPLICATION_VND_CMMF_ENCODER_CONFIGURATION_JSON="application/vnd.cmmf-encoder-configuration+json",a.APPLICATION_VND_CNCF_HELM_CHART_CONTENT_V1_TAR_GZIP="application/vnd.cncf.helm.chart.content.v1.tar+gzip",a.APPLICATION_VND_CNCF_HELM_CHART_PROVENANCE_V1_PROV="application/vnd.cncf.helm.chart.provenance.v1.prov",a.APPLICATION_VND_CNCF_HELM_CONFIG_V1_JSON="application/vnd.cncf.helm.config.v1+json",a.APPLICATION_VND_COFFEESCRIPT="application/vnd.coffeescript",a.APPLICATION_VND_COLLABIO_XODOCUMENTS_DOCUMENT="application/vnd.collabio.xodocuments.document",a.APPLICATION_VND_COLLABIO_XODOCUMENTS_DOCUMENT_TEMPLATE="application/vnd.collabio.xodocuments.document-template",a.APPLICATION_VND_COLLABIO_XODOCUMENTS_PRESENTATION="application/vnd.collabio.xodocuments.presentation",a.APPLICATION_VND_COLLABIO_XODOCUMENTS_PRESENTATION_TEMPLATE="application/vnd.collabio.xodocuments.presentation-template",a.APPLICATION_VND_COLLABIO_XODOCUMENTS_SPREADSHEET="application/vnd.collabio.xodocuments.spreadsheet",a.APPLICATION_VND_COLLABIO_XODOCUMENTS_SPREADSHEET_TEMPLATE="application/vnd.collabio.xodocuments.spreadsheet-template",a.APPLICATION_VND_COLLECTION_DOC_JSON="application/vnd.collection.doc+json",a.APPLICATION_VND_COLLECTION_JSON="application/vnd.collection+json",a.APPLICATION_VND_COLLECTION_NEXT_JSON="application/vnd.collection.next+json",a.APPLICATION_VND_COMICBOOK_RAR="application/vnd.comicbook-rar",a.APPLICATION_VND_COMICBOOK_ZIP="application/vnd.comicbook+zip",a.APPLICATION_VND_COMMERCE_BATTELLE="application/vnd.commerce-battelle",a.APPLICATION_VND_COMMONSPACE="application/vnd.commonspace",a.APPLICATION_VND_COREOS_IGNITION_JSON="application/vnd.coreos.ignition+json",a.APPLICATION_VND_COSMOCALLER="application/vnd.cosmocaller",a.APPLICATION_VND_CONTACT_CMSG="application/vnd.contact.cmsg",a.APPLICATION_VND_CRICK_CLICKER="application/vnd.crick.clicker",a.APPLICATION_VND_CRICK_CLICKER_KEYBOARD="application/vnd.crick.clicker.keyboard",a.APPLICATION_VND_CRICK_CLICKER_PALETTE="application/vnd.crick.clicker.palette",a.APPLICATION_VND_CRICK_CLICKER_TEMPLATE="application/vnd.crick.clicker.template",a.APPLICATION_VND_CRICK_CLICKER_WORDBANK="application/vnd.crick.clicker.wordbank",a.APPLICATION_VND_CRITICALTOOLS_WBS_XML="application/vnd.criticaltools.wbs+xml",a.APPLICATION_VND_CRYPTII_PIPE_JSON="application/vnd.cryptii.pipe+json",a.APPLICATION_VND_CRYPTO_SHADE_FILE="application/vnd.crypto-shade-file",a.APPLICATION_VND_CRYPTOMATOR_ENCRYPTED="application/vnd.cryptomator.encrypted",a.APPLICATION_VND_CRYPTOMATOR_VAULT="application/vnd.cryptomator.vault",a.APPLICATION_VND_CTC_POSML="application/vnd.ctc-posml",a.APPLICATION_VND_CTCT_WS_XML="application/vnd.ctct.ws+xml",a.APPLICATION_VND_CUPS_PDF="application/vnd.cups-pdf",a.APPLICATION_VND_CUPS_POSTSCRIPT="application/vnd.cups-postscript",a.APPLICATION_VND_CUPS_PPD="application/vnd.cups-ppd",a.APPLICATION_VND_CUPS_RASTER="application/vnd.cups-raster",a.APPLICATION_VND_CUPS_RAW="application/vnd.cups-raw",a.APPLICATION_VND_CURL="application/vnd.curl",a.APPLICATION_VND_CYAN_DEAN_ROOT_XML="application/vnd.cyan.dean.root+xml",a.APPLICATION_VND_CYBANK="application/vnd.cybank",a.APPLICATION_VND_CYCLONEDX_JSON="application/vnd.cyclonedx+json",a.APPLICATION_VND_CYCLONEDX_XML="application/vnd.cyclonedx+xml",a.APPLICATION_VND_D2L_COURSEPACKAGE1P0_ZIP="application/vnd.d2l.coursepackage1p0+zip",a.APPLICATION_VND_D3M_DATASET="application/vnd.d3m-dataset",a.APPLICATION_VND_D3M_PROBLEM="application/vnd.d3m-problem",a.APPLICATION_VND_DAI="application/vnd.dai",a.APPLICATION_VND_DART="application/vnd.dart",a.APPLICATION_VND_DATA_VISION_RDZ="application/vnd.data-vision.rdz",a.APPLICATION_VND_DATALOG="application/vnd.datalog",a.APPLICATION_VND_DATAPACKAGE_JSON="application/vnd.datapackage+json",a.APPLICATION_VND_DATARESOURCE_JSON="application/vnd.dataresource+json",a.APPLICATION_VND_DBF="application/vnd.dbf",a.APPLICATION_VND_DCMP_XML="application/vnd.dcmp+xml",a.APPLICATION_VND_DEBIAN_BINARY_PACKAGE="application/vnd.debian.binary-package",a.APPLICATION_VND_DECE_DATA="application/vnd.dece.data",a.APPLICATION_VND_DECE_TTML_XML="application/vnd.dece.ttml+xml",a.APPLICATION_VND_DECE_UNSPECIFIED="application/vnd.dece.unspecified",a.APPLICATION_VND_DECE_ZIP="application/vnd.dece.zip",a.APPLICATION_VND_DECKYARD_DECK="application/vnd.deckyard.deck",a.APPLICATION_VND_DENOVO_FCSELAYOUT_LINK="application/vnd.denovo.fcselayout-link",a.APPLICATION_VND_DESMUME_MOVIE="application/vnd.desmume.movie",a.APPLICATION_VND_DEUT_JSON="application/vnd.deut+json",a.APPLICATION_VND_DGL="application/vnd.dgl",a.APPLICATION_VND_DIGITALSTACK_DOCUMENT_ZIP="application/vnd.digitalstack.document+zip",a.APPLICATION_VND_DIR_BI_PLATE_DL_NOSUFFIX="application/vnd.dir-bi.plate-dl-nosuffix",a.APPLICATION_VND_DM_DELEGATION_XML="application/vnd.dm.delegation+xml",a.APPLICATION_VND_DNA="application/vnd.dna",a.APPLICATION_VND_DOCUMENT_JSON="application/vnd.document+json",a.APPLICATION_VND_DOLBY_MOBILE_1="application/vnd.dolby.mobile.1",a.APPLICATION_VND_DOLBY_MOBILE_2="application/vnd.dolby.mobile.2",a.APPLICATION_VND_DOREMIR_SCORECLOUD_BINARY_DOCUMENT="application/vnd.doremir.scorecloud-binary-document",a.APPLICATION_VND_DPGRAPH="application/vnd.dpgraph",a.APPLICATION_VND_DRAWOBLE_DRAWING_ZIP="application/vnd.drawoble.drawing+zip",a.APPLICATION_VND_DREAMFACTORY="application/vnd.dreamfactory",a.APPLICATION_VND_DRIVE_JSON="application/vnd.drive+json",a.APPLICATION_VND_DTG_LOCAL="application/vnd.dtg.local",a.APPLICATION_VND_DTG_LOCAL_FLASH="application/vnd.dtg.local.flash",a.APPLICATION_VND_DTG_LOCAL_HTML="application/vnd.dtg.local.html",a.APPLICATION_VND_DVB_AIT="application/vnd.dvb.ait",a.APPLICATION_VND_DVB_DASH_PLAYLIST_XML="application/vnd.dvb.dash-playlist+xml",a.APPLICATION_VND_DVB_DVBISL_XML="application/vnd.dvb.dvbisl+xml",a.APPLICATION_VND_DVB_DVBJ="application/vnd.dvb.dvbj",a.APPLICATION_VND_DVB_ESGCONTAINER="application/vnd.dvb.esgcontainer",a.APPLICATION_VND_DVB_IPDCDFTNOTIFACCESS="application/vnd.dvb.ipdcdftnotifaccess",a.APPLICATION_VND_DVB_IPDCESGACCESS="application/vnd.dvb.ipdcesgaccess",a.APPLICATION_VND_DVB_IPDCESGACCESS2="application/vnd.dvb.ipdcesgaccess2",a.APPLICATION_VND_DVB_IPDCESGPDD="application/vnd.dvb.ipdcesgpdd",a.APPLICATION_VND_DVB_IPDCROAMING="application/vnd.dvb.ipdcroaming",a.APPLICATION_VND_DVB_IPTV_ALFEC_BASE="application/vnd.dvb.iptv.alfec-base",a.APPLICATION_VND_DVB_IPTV_ALFEC_ENHANCEMENT="application/vnd.dvb.iptv.alfec-enhancement",a.APPLICATION_VND_DVB_NOTIF_AGGREGATE_ROOT_XML="application/vnd.dvb.notif-aggregate-root+xml",a.APPLICATION_VND_DVB_NOTIF_CONTAINER_XML="application/vnd.dvb.notif-container+xml",a.APPLICATION_VND_DVB_NOTIF_GENERIC_XML="application/vnd.dvb.notif-generic+xml",a.APPLICATION_VND_DVB_NOTIF_IA_MSGLIST_XML="application/vnd.dvb.notif-ia-msglist+xml",a.APPLICATION_VND_DVB_NOTIF_IA_REGISTRATION_REQUEST_XML="application/vnd.dvb.notif-ia-registration-request+xml",a.APPLICATION_VND_DVB_NOTIF_IA_REGISTRATION_RESPONSE_XML="application/vnd.dvb.notif-ia-registration-response+xml",a.APPLICATION_VND_DVB_NOTIF_INIT_XML="application/vnd.dvb.notif-init+xml",a.APPLICATION_VND_DVB_PFR="application/vnd.dvb.pfr",a.APPLICATION_VND_DVB_SERVICE="application/vnd.dvb.service",a.APPLICATION_VND_DXR="application/vnd.dxr",a.APPLICATION_VND_DYNAGEO="application/vnd.dynageo",a.APPLICATION_VND_DZR="application/vnd.dzr",a.APPLICATION_VND_EASYKARAOKE_CDGDOWNLOAD="application/vnd.easykaraoke.cdgdownload",a.APPLICATION_VND_ECIP_RLP="application/vnd.ecip.rlp",a.APPLICATION_VND_EDULITH_EDUX_JSON="application/vnd.edulith.edux+json",a.APPLICATION_VND_ECDIS_UPDATE="application/vnd.ecdis-update",a.APPLICATION_VND_ECLIPSE_DITTO_JSON="application/vnd.eclipse.ditto+json",a.APPLICATION_VND_ECOWIN_CHART="application/vnd.ecowin.chart",a.APPLICATION_VND_ECOWIN_FILEREQUEST="application/vnd.ecowin.filerequest",a.APPLICATION_VND_ECOWIN_FILEUPDATE="application/vnd.ecowin.fileupdate",a.APPLICATION_VND_ECOWIN_SERIES="application/vnd.ecowin.series",a.APPLICATION_VND_ECOWIN_SERIESREQUEST="application/vnd.ecowin.seriesrequest",a.APPLICATION_VND_ECOWIN_SERIESUPDATE="application/vnd.ecowin.seriesupdate",a.APPLICATION_VND_EFI_IMG="application/vnd.efi.img",a.APPLICATION_VND_EFI_ISO="application/vnd.efi.iso",a.APPLICATION_VND_ELN_ZIP="application/vnd.eln+zip",a.APPLICATION_VND_EMCLIENT_ACCESSREQUEST_XML="application/vnd.emclient.accessrequest+xml",a.APPLICATION_VND_EMILIA_AUTHORIZATION_EVIDENCE_CHALLENGE_JSON="application/vnd.emilia.authorization-evidence-challenge+json",a.APPLICATION_VND_ENLIVEN="application/vnd.enliven",a.APPLICATION_VND_ENPHASE_ENVOY="application/vnd.enphase.envoy",a.APPLICATION_VND_EPRINTS_DATA_XML="application/vnd.eprints.data+xml",a.APPLICATION_VND_EPSON_ESF="application/vnd.epson.esf",a.APPLICATION_VND_EPSON_MSF="application/vnd.epson.msf",a.APPLICATION_VND_EPSON_QUICKANIME="application/vnd.epson.quickanime",a.APPLICATION_VND_EPSON_SALT="application/vnd.epson.salt",a.APPLICATION_VND_EPSON_SSF="application/vnd.epson.ssf",a.APPLICATION_VND_ERICSSON_QUICKCALL="application/vnd.ericsson.quickcall",a.APPLICATION_VND_EROFS="application/vnd.erofs",a.APPLICATION_VND_ESPASS_ESPASS_ZIP="application/vnd.espass-espass+zip",a.APPLICATION_VND_ESZIGNO3_XML="application/vnd.eszigno3+xml",a.APPLICATION_VND_ETSI_AOC_XML="application/vnd.etsi.aoc+xml",a.APPLICATION_VND_ETSI_ASIC_S_ZIP="application/vnd.etsi.asic-s+zip",a.APPLICATION_VND_ETSI_ASIC_E_ZIP="application/vnd.etsi.asic-e+zip",a.APPLICATION_VND_ETSI_CUG_XML="application/vnd.etsi.cug+xml",a.APPLICATION_VND_ETSI_IPTVCOMMAND_XML="application/vnd.etsi.iptvcommand+xml",a.APPLICATION_VND_ETSI_IPTVDISCOVERY_XML="application/vnd.etsi.iptvdiscovery+xml",a.APPLICATION_VND_ETSI_IPTVPROFILE_XML="application/vnd.etsi.iptvprofile+xml",a.APPLICATION_VND_ETSI_IPTVSAD_BC_XML="application/vnd.etsi.iptvsad-bc+xml",a.APPLICATION_VND_ETSI_IPTVSAD_COD_XML="application/vnd.etsi.iptvsad-cod+xml",a.APPLICATION_VND_ETSI_IPTVSAD_NPVR_XML="application/vnd.etsi.iptvsad-npvr+xml",a.APPLICATION_VND_ETSI_IPTVSERVICE_XML="application/vnd.etsi.iptvservice+xml",a.APPLICATION_VND_ETSI_IPTVSYNC_XML="application/vnd.etsi.iptvsync+xml",a.APPLICATION_VND_ETSI_IPTVUEPROFILE_XML="application/vnd.etsi.iptvueprofile+xml",a.APPLICATION_VND_ETSI_MCID_XML="application/vnd.etsi.mcid+xml",a.APPLICATION_VND_ETSI_MHEG5="application/vnd.etsi.mheg5",a.APPLICATION_VND_ETSI_OVERLOAD_CONTROL_POLICY_DATASET_XML="application/vnd.etsi.overload-control-policy-dataset+xml",a.APPLICATION_VND_ETSI_PSTN_XML="application/vnd.etsi.pstn+xml",a.APPLICATION_VND_ETSI_SCI_XML="application/vnd.etsi.sci+xml",a.APPLICATION_VND_ETSI_SIMSERVS_XML="application/vnd.etsi.simservs+xml",a.APPLICATION_VND_ETSI_TIMESTAMP_TOKEN="application/vnd.etsi.timestamp-token",a.APPLICATION_VND_ETSI_TSL_XML="application/vnd.etsi.tsl+xml",a.APPLICATION_VND_ETSI_TSL_DER="application/vnd.etsi.tsl.der",a.APPLICATION_VND_EU_KASPARIAN_CAR_JSON="application/vnd.eu.kasparian.car+json",a.APPLICATION_VND_EUDORA_DATA="application/vnd.eudora.data",a.APPLICATION_VND_EVOLV_ECIG_PROFILE="application/vnd.evolv.ecig.profile",a.APPLICATION_VND_EVOLV_ECIG_SETTINGS="application/vnd.evolv.ecig.settings",a.APPLICATION_VND_EVOLV_ECIG_THEME="application/vnd.evolv.ecig.theme",a.APPLICATION_VND_EXCELANO_SLIPCASE_ZIP="application/vnd.excelano.slipcase+zip",a.APPLICATION_VND_EXSTREAM_EMPOWER_ZIP="application/vnd.exstream-empower+zip",a.APPLICATION_VND_EXSTREAM_PACKAGE="application/vnd.exstream-package",a.APPLICATION_VND_EZPIX_ALBUM="application/vnd.ezpix-album",a.APPLICATION_VND_EZPIX_PACKAGE="application/vnd.ezpix-package",a.APPLICATION_VND_F_SECURE_MOBILE="application/vnd.f-secure.mobile",a.APPLICATION_VND_FABYLON_BOOK="application/vnd.fabylon.book",a.APPLICATION_VND_FAF_YAML="application/vnd.faf+yaml",a.APPLICATION_VND_FAFA_YAML="application/vnd.fafa+yaml",a.APPLICATION_VND_FAFM_YAML="application/vnd.fafm+yaml",a.APPLICATION_VND_FASTCOPY_DISK_IMAGE="application/vnd.fastcopy-disk-image",a.APPLICATION_VND_FAMILYSEARCH_GEDCOM_ZIP="application/vnd.familysearch.gedcom+zip",a.APPLICATION_VND_FDSN_MSEED="application/vnd.fdsn.mseed",a.APPLICATION_VND_FDSN_SEED="application/vnd.fdsn.seed",a.APPLICATION_VND_FDSN_STATIONXML_XML="application/vnd.fdsn.stationxml+xml",a.APPLICATION_VND_FFSNS="application/vnd.ffsns",a.APPLICATION_VND_FGB="application/vnd.fgb",a.APPLICATION_VND_FICLAB_FLB_ZIP="application/vnd.ficlab.flb+zip",a.APPLICATION_VND_FIDUSWRITER_BOOK_ZIP="application/vnd.fiduswriter.book+zip",a.APPLICATION_VND_FIDUSWRITER_TEMPLATE_ZIP="application/vnd.fiduswriter.template+zip",a.APPLICATION_VND_FIDUSWRITER_ZIP="application/vnd.fiduswriter+zip",a.APPLICATION_VND_FILMIT_ZFC="application/vnd.filmit.zfc",a.APPLICATION_VND_FINTS="application/vnd.fints",a.APPLICATION_VND_FIREMONKEYS_CLOUDCELL="application/vnd.firemonkeys.cloudcell",a.APPLICATION_VND_FLOGRAPHIT="application/vnd.FloGraphIt",a.APPLICATION_VND_FLUXTIME_CLIP="application/vnd.fluxtime.clip",a.APPLICATION_VND_FONT_FONTFORGE_SFD="application/vnd.font-fontforge-sfd",a.APPLICATION_VND_FORITECH_CONTAINER="application/vnd.foritech.container",a.APPLICATION_VND_FRAMEMAKER="application/vnd.framemaker",a.APPLICATION_VND_FREELOG_COMIC="application/vnd.freelog.comic",a.APPLICATION_VND_FROGANS_FNC="application/vnd.frogans.fnc",a.APPLICATION_VND_FROGANS_LTF="application/vnd.frogans.ltf",a.APPLICATION_VND_FSC_WEBLAUNCH="application/vnd.fsc.weblaunch",a.APPLICATION_VND_FUJIFILM_FB_DOCUWORKS="application/vnd.fujifilm.fb.docuworks",a.APPLICATION_VND_FUJIFILM_FB_DOCUWORKS_BINDER="application/vnd.fujifilm.fb.docuworks.binder",a.APPLICATION_VND_FUJIFILM_FB_DOCUWORKS_CONTAINER="application/vnd.fujifilm.fb.docuworks.container",a.APPLICATION_VND_FUJIFILM_FB_JFI_XML="application/vnd.fujifilm.fb.jfi+xml",a.APPLICATION_VND_FUJITSU_OASYS="application/vnd.fujitsu.oasys",a.APPLICATION_VND_FUJITSU_OASYS2="application/vnd.fujitsu.oasys2",a.APPLICATION_VND_FUJITSU_OASYS3="application/vnd.fujitsu.oasys3",a.APPLICATION_VND_FUJITSU_OASYSGP="application/vnd.fujitsu.oasysgp",a.APPLICATION_VND_FUJITSU_OASYSPRS="application/vnd.fujitsu.oasysprs",a.APPLICATION_VND_FUJIXEROX_ART4="application/vnd.fujixerox.ART4",a.APPLICATION_VND_FUJIXEROX_ART_EX="application/vnd.fujixerox.ART-EX",a.APPLICATION_VND_FUJIXEROX_DDD="application/vnd.fujixerox.ddd",a.APPLICATION_VND_FUJIXEROX_DOCUWORKS="application/vnd.fujixerox.docuworks",a.APPLICATION_VND_FUJIXEROX_DOCUWORKS_BINDER="application/vnd.fujixerox.docuworks.binder",a.APPLICATION_VND_FUJIXEROX_DOCUWORKS_CONTAINER="application/vnd.fujixerox.docuworks.container",a.APPLICATION_VND_FUJIXEROX_HBPL="application/vnd.fujixerox.HBPL",a.APPLICATION_VND_FUT_MISNET="application/vnd.fut-misnet",a.APPLICATION_VND_FUTOIN_CBOR="application/vnd.futoin+cbor",a.APPLICATION_VND_FUTOIN_JSON="application/vnd.futoin+json",a.APPLICATION_VND_FUZZYSHEET="application/vnd.fuzzysheet",a.APPLICATION_VND_G3PIX_G3FC="application/vnd.g3pix.g3fc",a.APPLICATION_VND_GA4GH_PASSPORT_JWT="application/vnd.ga4gh.passport+jwt",a.APPLICATION_VND_GENOMATIX_TUXEDO="application/vnd.genomatix.tuxedo",a.APPLICATION_VND_GENOZIP="application/vnd.genozip",a.APPLICATION_VND_GENTICS_GRD_JSON="application/vnd.gentics.grd+json",a.APPLICATION_VND_GENTOO_CATMETADATA_XML="application/vnd.gentoo.catmetadata+xml",a.APPLICATION_VND_GENTOO_EBUILD="application/vnd.gentoo.ebuild",a.APPLICATION_VND_GENTOO_ECLASS="application/vnd.gentoo.eclass",a.APPLICATION_VND_GENTOO_GPKG="application/vnd.gentoo.gpkg",a.APPLICATION_VND_GENTOO_MANIFEST="application/vnd.gentoo.manifest",a.APPLICATION_VND_GENTOO_XPAK="application/vnd.gentoo.xpak",a.APPLICATION_VND_GENTOO_PKGMETADATA_XML="application/vnd.gentoo.pkgmetadata+xml",a.APPLICATION_VND_GEO_JSON="application/vnd.geo+json",a.APPLICATION_VND_GEOCUBE_XML="application/vnd.geocube+xml",a.APPLICATION_VND_GEOGEBRA_FILE="application/vnd.geogebra.file",a.APPLICATION_VND_GEOGEBRA_PINBOARD="application/vnd.geogebra.pinboard",a.APPLICATION_VND_GEOGEBRA_SLIDES="application/vnd.geogebra.slides",a.APPLICATION_VND_GEOGEBRA_TOOL="application/vnd.geogebra.tool",a.APPLICATION_VND_GEOMETRY_EXPLORER="application/vnd.geometry-explorer",a.APPLICATION_VND_GEONEXT="application/vnd.geonext",a.APPLICATION_VND_GEOPLAN="application/vnd.geoplan",a.APPLICATION_VND_GEOSPACE="application/vnd.geospace",a.APPLICATION_VND_GEOVIRTUALLIS_GEOV_ZIP="application/vnd.geovirtuallis.geov+zip",a.APPLICATION_VND_GERBER="application/vnd.gerber",a.APPLICATION_VND_GLOBALPLATFORM_CARD_CONTENT_MGT="application/vnd.globalplatform.card-content-mgt",a.APPLICATION_VND_GLOBALPLATFORM_CARD_CONTENT_MGT_RESPONSE="application/vnd.globalplatform.card-content-mgt-response",a.APPLICATION_VND_GMX="application/vnd.gmx",a.APPLICATION_VND_GNU_TALER_EXCHANGE_JSON="application/vnd.gnu.taler.exchange+json",a.APPLICATION_VND_GNU_TALER_MERCHANT_JSON="application/vnd.gnu.taler.merchant+json",a.APPLICATION_VND_GODOT_PROJECT_BINARY="application/vnd.godot.project.binary",a.APPLICATION_VND_GODOT_PROJECT_TEXT="application/vnd.godot.project.text",a.APPLICATION_VND_GODOT_RESOURCE_BINARY="application/vnd.godot.resource.binary",a.APPLICATION_VND_GODOT_RESOURCE_TEXT="application/vnd.godot.resource.text",a.APPLICATION_VND_GOOGLE_EARTH_KML_XML="application/vnd.google-earth.kml+xml",a.APPLICATION_VND_GOOGLE_EARTH_KMZ="application/vnd.google-earth.kmz",a.APPLICATION_VND_GOV_SK_E_FORM_XML="application/vnd.gov.sk.e-form+xml",a.APPLICATION_VND_GOV_SK_E_FORM_ZIP="application/vnd.gov.sk.e-form+zip",a.APPLICATION_VND_GOV_SK_XMLDATACONTAINER_XML="application/vnd.gov.sk.xmldatacontainer+xml",a.APPLICATION_VND_GP3="application/vnd.gp3",a.APPLICATION_VND_GPXSEE_MAP_XML="application/vnd.gpxsee.map+xml",a.APPLICATION_VND_GRAFEQ="application/vnd.grafeq",a.APPLICATION_VND_GRIDMP="application/vnd.gridmp",a.APPLICATION_VND_GROOVE_ACCOUNT="application/vnd.groove-account",a.APPLICATION_VND_GROOVE_HELP="application/vnd.groove-help",a.APPLICATION_VND_GROOVE_IDENTITY_MESSAGE="application/vnd.groove-identity-message",a.APPLICATION_VND_GROOVE_INJECTOR="application/vnd.groove-injector",a.APPLICATION_VND_GROOVE_TOOL_MESSAGE="application/vnd.groove-tool-message",a.APPLICATION_VND_GROOVE_TOOL_TEMPLATE="application/vnd.groove-tool-template",a.APPLICATION_VND_GROOVE_VCARD="application/vnd.groove-vcard",a.APPLICATION_VND_HAL_JSON="application/vnd.hal+json",a.APPLICATION_VND_HAL_XML="application/vnd.hal+xml",a.APPLICATION_VND_HANDHELD_ENTERTAINMENT_XML="application/vnd.HandHeld-Entertainment+xml",a.APPLICATION_VND_HBCI="application/vnd.hbci",a.APPLICATION_VND_HC_JSON="application/vnd.hc+json",a.APPLICATION_VND_HCL_BIREPORTS="application/vnd.hcl-bireports",a.APPLICATION_VND_HDFGROUP_HDF4="application/vnd.hdfgroup.hdf4",a.APPLICATION_VND_HDFGROUP_HDF5="application/vnd.hdfgroup.hdf5",a.APPLICATION_VND_HDT="application/vnd.hdt",a.APPLICATION_VND_HEROKU_JSON="application/vnd.heroku+json",a.APPLICATION_VND_HHE_LESSON_PLAYER="application/vnd.hhe.lesson-player",a.APPLICATION_VND_HP_HPGL="application/vnd.hp-HPGL",a.APPLICATION_VND_HP_HPID="application/vnd.hp-hpid",a.APPLICATION_VND_HP_HPS="application/vnd.hp-hps",a.APPLICATION_VND_HP_JLYT="application/vnd.hp-jlyt",a.APPLICATION_VND_HP_PCL="application/vnd.hp-PCL",a.APPLICATION_VND_HP_PCLXL="application/vnd.hp-PCLXL",a.APPLICATION_VND_HSL="application/vnd.hsl",a.APPLICATION_VND_HTTPHONE="application/vnd.httphone",a.APPLICATION_VND_HYDROSTATIX_SOF_DATA="application/vnd.hydrostatix.sof-data",a.APPLICATION_VND_HYPER_ITEM_JSON="application/vnd.hyper-item+json",a.APPLICATION_VND_HYPER_JSON="application/vnd.hyper+json",a.APPLICATION_VND_HYPERDRIVE_JSON="application/vnd.hyperdrive+json",a.APPLICATION_VND_HZN_3D_CROSSWORD="application/vnd.hzn-3d-crossword",a.APPLICATION_VND_IBM_AFPLINEDATA="application/vnd.ibm.afplinedata",a.APPLICATION_VND_IBM_ELECTRONIC_MEDIA="application/vnd.ibm.electronic-media",a.APPLICATION_VND_IBM_MINIPAY="application/vnd.ibm.MiniPay",a.APPLICATION_VND_IBM_MODCAP="application/vnd.ibm.modcap",a.APPLICATION_VND_IBM_RIGHTS_MANAGEMENT="application/vnd.ibm.rights-management",a.APPLICATION_VND_IBM_SECURE_CONTAINER="application/vnd.ibm.secure-container",a.APPLICATION_VND_IBUS_JSON="application/vnd.ibus+json",a.APPLICATION_VND_ICCPROFILE="application/vnd.iccprofile",a.APPLICATION_VND_IDOP_ZIP="application/vnd.idop+zip",a.APPLICATION_VND_IEEE_1905="application/vnd.ieee.1905",a.APPLICATION_VND_IGLOADER="application/vnd.igloader",a.APPLICATION_VND_IMAGEMETER_FOLDER_ZIP="application/vnd.imagemeter.folder+zip",a.APPLICATION_VND_IMAGEMETER_IMAGE_ZIP="application/vnd.imagemeter.image+zip",a.APPLICATION_VND_IMMERVISION_IVP="application/vnd.immervision-ivp",a.APPLICATION_VND_IMMERVISION_IVU="application/vnd.immervision-ivu",a.APPLICATION_VND_IMS_IMSCCV1P1="application/vnd.ims.imsccv1p1",a.APPLICATION_VND_IMS_IMSCCV1P2="application/vnd.ims.imsccv1p2",a.APPLICATION_VND_IMS_IMSCCV1P3="application/vnd.ims.imsccv1p3",a.APPLICATION_VND_IMS_LIS_V2_RESULT_JSON="application/vnd.ims.lis.v2.result+json",a.APPLICATION_VND_IMS_LTI_V2_TOOLCONSUMERPROFILE_JSON="application/vnd.ims.lti.v2.toolconsumerprofile+json",a.APPLICATION_VND_IMS_LTI_V2_TOOLPROXY_ID_JSON="application/vnd.ims.lti.v2.toolproxy.id+json",a.APPLICATION_VND_IMS_LTI_V2_TOOLPROXY_JSON="application/vnd.ims.lti.v2.toolproxy+json",a.APPLICATION_VND_IMS_LTI_V2_TOOLSETTINGS_JSON="application/vnd.ims.lti.v2.toolsettings+json",a.APPLICATION_VND_IMS_LTI_V2_TOOLSETTINGS_SIMPLE_JSON="application/vnd.ims.lti.v2.toolsettings.simple+json",a.APPLICATION_VND_INFORMEDCONTROL_RMS_XML="application/vnd.informedcontrol.rms+xml",a.APPLICATION_VND_INFOTECH_PROJECT="application/vnd.infotech.project",a.APPLICATION_VND_INFOTECH_PROJECT_XML="application/vnd.infotech.project+xml",a.APPLICATION_VND_INFORMIX_VISIONARY="application/vnd.informix-visionary",a.APPLICATION_VND_INNOPATH_WAMP_NOTIFICATION="application/vnd.innopath.wamp.notification",a.APPLICATION_VND_INSORS_IGM="application/vnd.insors.igm",a.APPLICATION_VND_INTERCON_FORMNET="application/vnd.intercon.formnet",a.APPLICATION_VND_INTERGEO="application/vnd.intergeo",a.APPLICATION_VND_INTERTRUST_DIGIBOX="application/vnd.intertrust.digibox",a.APPLICATION_VND_INTERTRUST_NNCP="application/vnd.intertrust.nncp",a.APPLICATION_VND_INTU_QBO="application/vnd.intu.qbo",a.APPLICATION_VND_INTU_QFX="application/vnd.intu.qfx",a.APPLICATION_VND_IPFS_IPNS_RECORD="application/vnd.ipfs.ipns-record",a.APPLICATION_VND_IPLD_CAR="application/vnd.ipld.car",a.APPLICATION_VND_IPLD_DAG_CBOR="application/vnd.ipld.dag-cbor",a.APPLICATION_VND_IPLD_DAG_JSON="application/vnd.ipld.dag-json",a.APPLICATION_VND_IPLD_RAW="application/vnd.ipld.raw",a.APPLICATION_VND_IPTC_G2_CATALOGITEM_XML="application/vnd.iptc.g2.catalogitem+xml",a.APPLICATION_VND_IPTC_G2_CONCEPTITEM_XML="application/vnd.iptc.g2.conceptitem+xml",a.APPLICATION_VND_IPTC_G2_KNOWLEDGEITEM_XML="application/vnd.iptc.g2.knowledgeitem+xml",a.APPLICATION_VND_IPTC_G2_NEWSITEM_XML="application/vnd.iptc.g2.newsitem+xml",a.APPLICATION_VND_IPTC_G2_NEWSMESSAGE_XML="application/vnd.iptc.g2.newsmessage+xml",a.APPLICATION_VND_IPTC_G2_PACKAGEITEM_XML="application/vnd.iptc.g2.packageitem+xml",a.APPLICATION_VND_IPTC_G2_PLANNINGITEM_XML="application/vnd.iptc.g2.planningitem+xml",a.APPLICATION_VND_IPUNPLUGGED_RCPROFILE="application/vnd.ipunplugged.rcprofile",a.APPLICATION_VND_IREPOSITORY_PACKAGE_XML="application/vnd.irepository.package+xml",a.APPLICATION_VND_IS_XPR="application/vnd.is-xpr",a.APPLICATION_VND_ISAC_FCS="application/vnd.isac.fcs",a.APPLICATION_VND_JAM="application/vnd.jam",a.APPLICATION_VND_ISO11783_10_ZIP="application/vnd.iso11783-10+zip",a.APPLICATION_VND_JAPANNET_DIRECTORY_SERVICE="application/vnd.japannet-directory-service",a.APPLICATION_VND_JAPANNET_JPNSTORE_WAKEUP="application/vnd.japannet-jpnstore-wakeup",a.APPLICATION_VND_JAPANNET_PAYMENT_WAKEUP="application/vnd.japannet-payment-wakeup",a.APPLICATION_VND_JAPANNET_REGISTRATION="application/vnd.japannet-registration",a.APPLICATION_VND_JAPANNET_REGISTRATION_WAKEUP="application/vnd.japannet-registration-wakeup",a.APPLICATION_VND_JAPANNET_SETSTORE_WAKEUP="application/vnd.japannet-setstore-wakeup",a.APPLICATION_VND_JAPANNET_VERIFICATION="application/vnd.japannet-verification",a.APPLICATION_VND_JAPANNET_VERIFICATION_WAKEUP="application/vnd.japannet-verification-wakeup",a.APPLICATION_VND_JCP_JAVAME_MIDLET_RMS="application/vnd.jcp.javame.midlet-rms",a.APPLICATION_VND_JISP="application/vnd.jisp",a.APPLICATION_VND_JOOST_JODA_ARCHIVE="application/vnd.joost.joda-archive",a.APPLICATION_VND_JSK_ISDN_NGN="application/vnd.jsk.isdn-ngn",a.APPLICATION_VND_JUPITER_JDX_JSON="application/vnd.jupiter.jdx+json",a.APPLICATION_VND_JUPYTER="application/vnd.jupyter",a.APPLICATION_VND_KAHOOTZ="application/vnd.kahootz",a.APPLICATION_VND_KDE_KARBON="application/vnd.kde.karbon",a.APPLICATION_VND_KDE_KCHART="application/vnd.kde.kchart",a.APPLICATION_VND_KDE_KFORMULA="application/vnd.kde.kformula",a.APPLICATION_VND_KDE_KIVIO="application/vnd.kde.kivio",a.APPLICATION_VND_KDE_KONTOUR="application/vnd.kde.kontour",a.APPLICATION_VND_KDE_KPRESENTER="application/vnd.kde.kpresenter",a.APPLICATION_VND_KDE_KSPREAD="application/vnd.kde.kspread",a.APPLICATION_VND_KDE_KWORD="application/vnd.kde.kword",a.APPLICATION_VND_KDL="application/vnd.kdl",a.APPLICATION_VND_KENAMEAAPP="application/vnd.kenameaapp",a.APPLICATION_VND_KEYMAN_KMP_ZIP="application/vnd.keyman.kmp+zip",a.APPLICATION_VND_KEYMAN_KMX="application/vnd.keyman.kmx",a.APPLICATION_VND_KIDSPIRATION="application/vnd.kidspiration",a.APPLICATION_VND_KINAR="application/vnd.Kinar",a.APPLICATION_VND_KLYPIX_ZIP="application/vnd.klypix+zip",a.APPLICATION_VND_KOAN="application/vnd.koan",a.APPLICATION_VND_KODAK_DESCRIPTOR="application/vnd.kodak-descriptor",a.APPLICATION_VND_LAS="application/vnd.las",a.APPLICATION_VND_LAS_LAS_JSON="application/vnd.las.las+json",a.APPLICATION_VND_LAS_LAS_XML="application/vnd.las.las+xml",a.APPLICATION_VND_LASZIP="application/vnd.laszip",a.APPLICATION_VND_LDEV_PRODUCTLICENSING="application/vnd.ldev.productlicensing",a.APPLICATION_VND_LEAP_JSON="application/vnd.leap+json",a.APPLICATION_VND_LIBERTY_REQUEST_XML="application/vnd.liberty-request+xml",a.APPLICATION_VND_LLAMAGRAPHICS_LIFE_BALANCE_DESKTOP="application/vnd.llamagraphics.life-balance.desktop",a.APPLICATION_VND_LLAMAGRAPHICS_LIFE_BALANCE_EXCHANGE_XML="application/vnd.llamagraphics.life-balance.exchange+xml",a.APPLICATION_VND_LOGIPIPE_CIRCUIT_ZIP="application/vnd.logipipe.circuit+zip",a.APPLICATION_VND_LOOM="application/vnd.loom",a.APPLICATION_VND_LOTUS_1_2_3="application/vnd.lotus-1-2-3",a.APPLICATION_VND_LOTUS_APPROACH="application/vnd.lotus-approach",a.APPLICATION_VND_LOTUS_FREELANCE="application/vnd.lotus-freelance",a.APPLICATION_VND_LOTUS_NOTES="application/vnd.lotus-notes",a.APPLICATION_VND_LOTUS_ORGANIZER="application/vnd.lotus-organizer",a.APPLICATION_VND_LOTUS_SCREENCAM="application/vnd.lotus-screencam",a.APPLICATION_VND_LOTUS_WORDPRO="application/vnd.lotus-wordpro",a.APPLICATION_VND_LUKUID_PACKAGE_ZIP="application/vnd.lukuid.package+zip",a.APPLICATION_VND_MACPORTS_PORTPKG="application/vnd.macports.portpkg",a.APPLICATION_VND_MAJIKAH_BUNDLE="application/vnd.majikah.bundle",a.APPLICATION_VND_MAJIKAH_MJKSIG="application/vnd.majikah.mjksig",a.APPLICATION_VND_MAJIKAH_MJKSMAP="application/vnd.majikah.mjksmap",a.APPLICATION_VND_MAML="application/vnd.maml",a.APPLICATION_VND_MAPBOX_VECTOR_TILE="application/vnd.mapbox-vector-tile",a.APPLICATION_VND_MARLIN_DRM_ACTIONTOKEN_XML="application/vnd.marlin.drm.actiontoken+xml",a.APPLICATION_VND_MARLIN_DRM_CONFTOKEN_XML="application/vnd.marlin.drm.conftoken+xml",a.APPLICATION_VND_MARLIN_DRM_LICENSE_XML="application/vnd.marlin.drm.license+xml",a.APPLICATION_VND_MARLIN_DRM_MDCF="application/vnd.marlin.drm.mdcf",a.APPLICATION_VND_MASON_JSON="application/vnd.mason+json",a.APPLICATION_VND_MAXAR_ARCHIVE_3TZ_ZIP="application/vnd.maxar.archive.3tz+zip",a.APPLICATION_VND_MAXMIND_MAXMIND_DB="application/vnd.maxmind.maxmind-db",a.APPLICATION_VND_MCAP="application/vnd.mcap",a.APPLICATION_VND_MCD="application/vnd.mcd",a.APPLICATION_VND_MDL="application/vnd.mdl",a.APPLICATION_VND_MDL_MBSDF="application/vnd.mdl-mbsdf",a.APPLICATION_VND_MEDCALCDATA="application/vnd.medcalcdata",a.APPLICATION_VND_MEDIASTATION_CDKEY="application/vnd.mediastation.cdkey",a.APPLICATION_VND_MEDICALHOLODECK_RECORDXR="application/vnd.medicalholodeck.recordxr",a.APPLICATION_VND_MERIDIAN_SLINGSHOT="application/vnd.meridian-slingshot",a.APPLICATION_VND_MERMAID="application/vnd.mermaid",a.APPLICATION_VND_MFER="application/vnd.MFER",a.APPLICATION_VND_MFMP="application/vnd.mfmp",a.APPLICATION_VND_MICRO_JSON="application/vnd.micro+json",a.APPLICATION_VND_MICROGRAFX_FLO="application/vnd.micrografx.flo",a.APPLICATION_VND_MICROGRAFX_IGX="application/vnd.micrografx.igx",a.APPLICATION_VND_MICROSOFT_PORTABLE_EXECUTABLE="application/vnd.microsoft.portable-executable",a.APPLICATION_VND_MICROSOFT_WINDOWS_THUMBNAIL_CACHE="application/vnd.microsoft.windows.thumbnail-cache",a.APPLICATION_VND_MIELE_JSON="application/vnd.miele+json",a.APPLICATION_VND_MIF="application/vnd.mif",a.APPLICATION_VND_MINISOFT_HP3000_SAVE="application/vnd.minisoft-hp3000-save",a.APPLICATION_VND_MITSUBISHI_MISTY_GUARD_TRUSTWEB="application/vnd.mitsubishi.misty-guard.trustweb",a.APPLICATION_VND_MOBIUS_DAF="application/vnd.Mobius.DAF",a.APPLICATION_VND_MOBIUS_DIS="application/vnd.Mobius.DIS",a.APPLICATION_VND_MOBIUS_MBK="application/vnd.Mobius.MBK",a.APPLICATION_VND_MOBIUS_MQY="application/vnd.Mobius.MQY",a.APPLICATION_VND_MOBIUS_MSL="application/vnd.Mobius.MSL",a.APPLICATION_VND_MOBIUS_PLC="application/vnd.Mobius.PLC",a.APPLICATION_VND_MOBIUS_TXF="application/vnd.Mobius.TXF",a.APPLICATION_VND_MODL="application/vnd.modl",a.APPLICATION_VND_MOHNETIC="application/vnd.mohnetic",a.APPLICATION_VND_MOPHUN_APPLICATION="application/vnd.mophun.application",a.APPLICATION_VND_MOPHUN_CERTIFICATE="application/vnd.mophun.certificate",a.APPLICATION_VND_MOTOROLA_FLEXSUITE="application/vnd.motorola.flexsuite",a.APPLICATION_VND_MOTOROLA_FLEXSUITE_ADSI="application/vnd.motorola.flexsuite.adsi",a.APPLICATION_VND_MOTOROLA_FLEXSUITE_FIS="application/vnd.motorola.flexsuite.fis",a.APPLICATION_VND_MOTOROLA_FLEXSUITE_GOTAP="application/vnd.motorola.flexsuite.gotap",a.APPLICATION_VND_MOTOROLA_FLEXSUITE_KMR="application/vnd.motorola.flexsuite.kmr",a.APPLICATION_VND_MOTOROLA_FLEXSUITE_TTC="application/vnd.motorola.flexsuite.ttc",a.APPLICATION_VND_MOTOROLA_FLEXSUITE_WEM="application/vnd.motorola.flexsuite.wem",a.APPLICATION_VND_MOTOROLA_IPRM="application/vnd.motorola.iprm",a.APPLICATION_VND_MOZILLA_XUL_XML="application/vnd.mozilla.xul+xml",a.APPLICATION_VND_MS_ARTGALRY="application/vnd.ms-artgalry",a.APPLICATION_VND_MS_ASF="application/vnd.ms-asf",a.APPLICATION_VND_MS_CAB_COMPRESSED="application/vnd.ms-cab-compressed",a.APPLICATION_VND_MS_3MFDOCUMENT="application/vnd.ms-3mfdocument",a.APPLICATION_VND_MS_EXCEL="application/vnd.ms-excel",a.APPLICATION_VND_MS_EXCEL_ADDIN_MACROENABLED_12="application/vnd.ms-excel.addin.macroEnabled.12",a.APPLICATION_VND_MS_EXCEL_SHEET_BINARY_MACROENABLED_12="application/vnd.ms-excel.sheet.binary.macroEnabled.12",a.APPLICATION_VND_MS_EXCEL_SHEET_MACROENABLED_12="application/vnd.ms-excel.sheet.macroEnabled.12",a.APPLICATION_VND_MS_EXCEL_TEMPLATE_MACROENABLED_12="application/vnd.ms-excel.template.macroEnabled.12",a.APPLICATION_VND_MS_FONTOBJECT="application/vnd.ms-fontobject",a.APPLICATION_VND_MS_HTMLHELP="application/vnd.ms-htmlhelp",a.APPLICATION_VND_MS_IMS="application/vnd.ms-ims",a.APPLICATION_VND_MS_LRM="application/vnd.ms-lrm",a.APPLICATION_VND_MS_OFFICE_ACTIVEX_XML="application/vnd.ms-office.activeX+xml",a.APPLICATION_VND_MS_OFFICETHEME="application/vnd.ms-officetheme",a.APPLICATION_VND_MS_PLAYREADY_INITIATOR_XML="application/vnd.ms-playready.initiator+xml",a.APPLICATION_VND_MS_POWERPOINT="application/vnd.ms-powerpoint",a.APPLICATION_VND_MS_POWERPOINT_ADDIN_MACROENABLED_12="application/vnd.ms-powerpoint.addin.macroEnabled.12",a.APPLICATION_VND_MS_POWERPOINT_PRESENTATION_MACROENABLED_12="application/vnd.ms-powerpoint.presentation.macroEnabled.12",a.APPLICATION_VND_MS_POWERPOINT_SLIDE_MACROENABLED_12="application/vnd.ms-powerpoint.slide.macroEnabled.12",a.APPLICATION_VND_MS_POWERPOINT_SLIDESHOW_MACROENABLED_12="application/vnd.ms-powerpoint.slideshow.macroEnabled.12",a.APPLICATION_VND_MS_POWERPOINT_TEMPLATE_MACROENABLED_12="application/vnd.ms-powerpoint.template.macroEnabled.12",a.APPLICATION_VND_MS_PRINTDEVICECAPABILITIES_XML="application/vnd.ms-PrintDeviceCapabilities+xml",a.APPLICATION_VND_MS_PRINTSCHEMATICKET_XML="application/vnd.ms-PrintSchemaTicket+xml",a.APPLICATION_VND_MS_PROJECT="application/vnd.ms-project",a.APPLICATION_VND_MS_TNEF="application/vnd.ms-tnef",a.APPLICATION_VND_MS_WINDOWS_DEVICEPAIRING="application/vnd.ms-windows.devicepairing",a.APPLICATION_VND_MS_WINDOWS_NWPRINTING_OOB="application/vnd.ms-windows.nwprinting.oob",a.APPLICATION_VND_MS_WINDOWS_PRINTERPAIRING="application/vnd.ms-windows.printerpairing",a.APPLICATION_VND_MS_WINDOWS_WSD_OOB="application/vnd.ms-windows.wsd.oob",a.APPLICATION_VND_MS_WMDRM_LIC_CHLG_REQ="application/vnd.ms-wmdrm.lic-chlg-req",a.APPLICATION_VND_MS_WMDRM_LIC_RESP="application/vnd.ms-wmdrm.lic-resp",a.APPLICATION_VND_MS_WMDRM_METER_CHLG_REQ="application/vnd.ms-wmdrm.meter-chlg-req",a.APPLICATION_VND_MS_WMDRM_METER_RESP="application/vnd.ms-wmdrm.meter-resp",a.APPLICATION_VND_MS_WORD_DOCUMENT_MACROENABLED_12="application/vnd.ms-word.document.macroEnabled.12",a.APPLICATION_VND_MS_WORD_TEMPLATE_MACROENABLED_12="application/vnd.ms-word.template.macroEnabled.12",a.APPLICATION_VND_MS_WORKS="application/vnd.ms-works",a.APPLICATION_VND_MS_WPL="application/vnd.ms-wpl",a.APPLICATION_VND_MS_XPSDOCUMENT="application/vnd.ms-xpsdocument",a.APPLICATION_VND_MSA_DISK_IMAGE="application/vnd.msa-disk-image",a.APPLICATION_VND_MSEQ="application/vnd.mseq",a.APPLICATION_VND_MSGPACK="application/vnd.msgpack",a.APPLICATION_VND_MSIGN="application/vnd.msign",a.APPLICATION_VND_MULTIAD_CREATOR="application/vnd.multiad.creator",a.APPLICATION_VND_MULTIAD_CREATOR_CIF="application/vnd.multiad.creator.cif",a.APPLICATION_VND_MUSICIAN="application/vnd.musician",a.APPLICATION_VND_MUSIC_NIFF="application/vnd.music-niff",a.APPLICATION_VND_MUVEE_STYLE="application/vnd.muvee.style",a.APPLICATION_VND_MYNFC="application/vnd.mynfc",a.APPLICATION_VND_NACAMAR_YBRID_JSON="application/vnd.nacamar.ybrid+json",a.APPLICATION_VND_NANORIX_AUDITPROOF_JSON="application/vnd.nanorix.auditproof+json",a.APPLICATION_VND_NATO_BINDINGDATAOBJECT_CBOR="application/vnd.nato.bindingdataobject+cbor",a.APPLICATION_VND_NATO_BINDINGDATAOBJECT_JSON="application/vnd.nato.bindingdataobject+json",a.APPLICATION_VND_NATO_BINDINGDATAOBJECT_XML="application/vnd.nato.bindingdataobject+xml",a.APPLICATION_VND_NATO_OPENXMLFORMATS_PACKAGE_IEPD_ZIP="application/vnd.nato.openxmlformats-package.iepd+zip",a.APPLICATION_VND_NCD_CONTROL="application/vnd.ncd.control",a.APPLICATION_VND_NCD_REFERENCE="application/vnd.ncd.reference",a.APPLICATION_VND_NEARST_INV_JSON="application/vnd.nearst.inv+json",a.APPLICATION_VND_NEBUMIND_LINE="application/vnd.nebumind.line",a.APPLICATION_VND_NERVANA="application/vnd.nervana",a.APPLICATION_VND_NETFPX="application/vnd.netfpx",a.APPLICATION_VND_NEUROLANGUAGE_NLU="application/vnd.neurolanguage.nlu",a.APPLICATION_VND_NGDTUANH_ABOOK_ZIP="application/vnd.ngdtuanh.abook+zip",a.APPLICATION_VND_NGDTUANH_ABOOKPROJ_ZIP="application/vnd.ngdtuanh.abookproj+zip",a.APPLICATION_VND_NILA_PROTOBUF_BUNDLE_ZIP="application/vnd.nila.protobuf-bundle+zip",a.APPLICATION_VND_NIMN="application/vnd.nimn",a.APPLICATION_VND_NINTENDO_SNES_ROM="application/vnd.nintendo.snes.rom",a.APPLICATION_VND_NINTENDO_NITRO_ROM="application/vnd.nintendo.nitro.rom",a.APPLICATION_VND_NITF="application/vnd.nitf",a.APPLICATION_VND_NNU_PROFILE_JSON="application/vnd.nnu.profile+json",a.APPLICATION_VND_NOBLENET_DIRECTORY="application/vnd.noblenet-directory",a.APPLICATION_VND_NOBLENET_SEALER="application/vnd.noblenet-sealer",a.APPLICATION_VND_NOBLENET_WEB="application/vnd.noblenet-web",a.APPLICATION_VND_NOKIA_CATALOGS="application/vnd.nokia.catalogs",a.APPLICATION_VND_NOKIA_CONML_WBXML="application/vnd.nokia.conml+wbxml",a.APPLICATION_VND_NOKIA_CONML_XML="application/vnd.nokia.conml+xml",a.APPLICATION_VND_NOKIA_IPTV_CONFIG_XML="application/vnd.nokia.iptv.config+xml",a.APPLICATION_VND_NOKIA_ISDS_RADIO_PRESETS="application/vnd.nokia.iSDS-radio-presets",a.APPLICATION_VND_NOKIA_LANDMARK_WBXML="application/vnd.nokia.landmark+wbxml",a.APPLICATION_VND_NOKIA_LANDMARK_XML="application/vnd.nokia.landmark+xml",a.APPLICATION_VND_NOKIA_LANDMARKCOLLECTION_XML="application/vnd.nokia.landmarkcollection+xml",a.APPLICATION_VND_NOKIA_NCD="application/vnd.nokia.ncd",a.APPLICATION_VND_NOKIA_N_GAGE_AC_XML="application/vnd.nokia.n-gage.ac+xml",a.APPLICATION_VND_NOKIA_N_GAGE_DATA="application/vnd.nokia.n-gage.data",a.APPLICATION_VND_NOKIA_N_GAGE_SYMBIAN_INSTALL="application/vnd.nokia.n-gage.symbian.install",a.APPLICATION_VND_NOKIA_PCD_WBXML="application/vnd.nokia.pcd+wbxml",a.APPLICATION_VND_NOKIA_PCD_XML="application/vnd.nokia.pcd+xml",a.APPLICATION_VND_NOKIA_RADIO_PRESET="application/vnd.nokia.radio-preset",a.APPLICATION_VND_NOKIA_RADIO_PRESETS="application/vnd.nokia.radio-presets",a.APPLICATION_VND_NOMOS_JSON="application/vnd.nomos+json",a.APPLICATION_VND_NOVADIGM_EDM="application/vnd.novadigm.EDM",a.APPLICATION_VND_NOVADIGM_EDX="application/vnd.novadigm.EDX",a.APPLICATION_VND_NOVADIGM_EXT="application/vnd.novadigm.EXT",a.APPLICATION_VND_NTT_LOCAL_CONTENT_SHARE="application/vnd.ntt-local.content-share",a.APPLICATION_VND_NTT_LOCAL_FILE_TRANSFER="application/vnd.ntt-local.file-transfer",a.APPLICATION_VND_NTT_LOCAL_OGW_REMOTE_ACCESS="application/vnd.ntt-local.ogw_remote-access",a.APPLICATION_VND_NTT_LOCAL_SIP_TA_REMOTE="application/vnd.ntt-local.sip-ta_remote",a.APPLICATION_VND_NTT_LOCAL_SIP_TA_TCP_STREAM="application/vnd.ntt-local.sip-ta_tcp_stream",a.APPLICATION_VND_NUBALTEC_NUDOKU_GAME="application/vnd.nubaltec.nudoku-game",a.APPLICATION_VND_OAI_WORKFLOWS="application/vnd.oai.workflows",a.APPLICATION_VND_OAI_WORKFLOWS_JSON="application/vnd.oai.workflows+json",a.APPLICATION_VND_OAI_WORKFLOWS_YAML="application/vnd.oai.workflows+yaml",a.APPLICATION_VND_OASIS_OPENDOCUMENT_BASE="application/vnd.oasis.opendocument.base",a.APPLICATION_VND_OASIS_OPENDOCUMENT_CHART="application/vnd.oasis.opendocument.chart",a.APPLICATION_VND_OASIS_OPENDOCUMENT_CHART_TEMPLATE="application/vnd.oasis.opendocument.chart-template",a.APPLICATION_VND_OASIS_OPENDOCUMENT_DATABASE="application/vnd.oasis.opendocument.database",a.APPLICATION_VND_OASIS_OPENDOCUMENT_FORMULA="application/vnd.oasis.opendocument.formula",a.APPLICATION_VND_OASIS_OPENDOCUMENT_FORMULA_TEMPLATE="application/vnd.oasis.opendocument.formula-template",a.APPLICATION_VND_OASIS_OPENDOCUMENT_GRAPHICS="application/vnd.oasis.opendocument.graphics",a.APPLICATION_VND_OASIS_OPENDOCUMENT_GRAPHICS_TEMPLATE="application/vnd.oasis.opendocument.graphics-template",a.APPLICATION_VND_OASIS_OPENDOCUMENT_IMAGE="application/vnd.oasis.opendocument.image",a.APPLICATION_VND_OASIS_OPENDOCUMENT_IMAGE_TEMPLATE="application/vnd.oasis.opendocument.image-template",a.APPLICATION_VND_OASIS_OPENDOCUMENT_PRESENTATION="application/vnd.oasis.opendocument.presentation",a.APPLICATION_VND_OASIS_OPENDOCUMENT_PRESENTATION_TEMPLATE="application/vnd.oasis.opendocument.presentation-template",a.APPLICATION_VND_OASIS_OPENDOCUMENT_SPREADSHEET="application/vnd.oasis.opendocument.spreadsheet",a.APPLICATION_VND_OASIS_OPENDOCUMENT_SPREADSHEET_TEMPLATE="application/vnd.oasis.opendocument.spreadsheet-template",a.APPLICATION_VND_OASIS_OPENDOCUMENT_TEXT="application/vnd.oasis.opendocument.text",a.APPLICATION_VND_OASIS_OPENDOCUMENT_TEXT_MASTER="application/vnd.oasis.opendocument.text-master",a.APPLICATION_VND_OASIS_OPENDOCUMENT_TEXT_MASTER_TEMPLATE="application/vnd.oasis.opendocument.text-master-template",a.APPLICATION_VND_OASIS_OPENDOCUMENT_TEXT_TEMPLATE="application/vnd.oasis.opendocument.text-template",a.APPLICATION_VND_OASIS_OPENDOCUMENT_TEXT_WEB="application/vnd.oasis.opendocument.text-web",a.APPLICATION_VND_OBN="application/vnd.obn",a.APPLICATION_VND_OCF_CBOR="application/vnd.ocf+cbor",a.APPLICATION_VND_OCI_IMAGE_MANIFEST_V1_JSON="application/vnd.oci.image.manifest.v1+json",a.APPLICATION_VND_OFTN_L10N_JSON="application/vnd.oftn.l10n+json",a.APPLICATION_VND_OIPF_CONTENTACCESSDOWNLOAD_XML="application/vnd.oipf.contentaccessdownload+xml",a.APPLICATION_VND_OIPF_CONTENTACCESSSTREAMING_XML="application/vnd.oipf.contentaccessstreaming+xml",a.APPLICATION_VND_OIPF_CSPG_HEXBINARY="application/vnd.oipf.cspg-hexbinary",a.APPLICATION_VND_OIPF_DAE_SVG_XML="application/vnd.oipf.dae.svg+xml",a.APPLICATION_VND_OIPF_DAE_XHTML_XML="application/vnd.oipf.dae.xhtml+xml",a.APPLICATION_VND_OIPF_MIPPVCONTROLMESSAGE_XML="application/vnd.oipf.mippvcontrolmessage+xml",a.APPLICATION_VND_OIPF_PAE_GEM="application/vnd.oipf.pae.gem",a.APPLICATION_VND_OIPF_SPDISCOVERY_XML="application/vnd.oipf.spdiscovery+xml",a.APPLICATION_VND_OIPF_SPDLIST_XML="application/vnd.oipf.spdlist+xml",a.APPLICATION_VND_OIPF_UEPROFILE_XML="application/vnd.oipf.ueprofile+xml",a.APPLICATION_VND_OIPF_USERPROFILE_XML="application/vnd.oipf.userprofile+xml",a.APPLICATION_VND_OLPC_SUGAR="application/vnd.olpc-sugar",a.APPLICATION_VND_OMA_BCAST_ASSOCIATED_PROCEDURE_PARAMETER_XML="application/vnd.oma.bcast.associated-procedure-parameter+xml",a.APPLICATION_VND_OMA_BCAST_DRM_TRIGGER_XML="application/vnd.oma.bcast.drm-trigger+xml",a.APPLICATION_VND_OMA_BCAST_IMD_XML="application/vnd.oma.bcast.imd+xml",a.APPLICATION_VND_OMA_BCAST_LTKM="application/vnd.oma.bcast.ltkm",a.APPLICATION_VND_OMA_BCAST_NOTIFICATION_XML="application/vnd.oma.bcast.notification+xml",a.APPLICATION_VND_OMA_BCAST_PROVISIONINGTRIGGER="application/vnd.oma.bcast.provisioningtrigger",a.APPLICATION_VND_OMA_BCAST_SGBOOT="application/vnd.oma.bcast.sgboot",a.APPLICATION_VND_OMA_BCAST_SGDD_XML="application/vnd.oma.bcast.sgdd+xml",a.APPLICATION_VND_OMA_BCAST_SGDU="application/vnd.oma.bcast.sgdu",a.APPLICATION_VND_OMA_BCAST_SIMPLE_SYMBOL_CONTAINER="application/vnd.oma.bcast.simple-symbol-container",a.APPLICATION_VND_OMA_BCAST_SMARTCARD_TRIGGER_XML="application/vnd.oma.bcast.smartcard-trigger+xml",a.APPLICATION_VND_OMA_BCAST_SPROV_XML="application/vnd.oma.bcast.sprov+xml",a.APPLICATION_VND_OMA_BCAST_STKM="application/vnd.oma.bcast.stkm",a.APPLICATION_VND_OMA_CAB_ADDRESS_BOOK_XML="application/vnd.oma.cab-address-book+xml",a.APPLICATION_VND_OMA_CAB_FEATURE_HANDLER_XML="application/vnd.oma.cab-feature-handler+xml",a.APPLICATION_VND_OMA_CAB_PCC_XML="application/vnd.oma.cab-pcc+xml",a.APPLICATION_VND_OMA_CAB_SUBS_INVITE_XML="application/vnd.oma.cab-subs-invite+xml",a.APPLICATION_VND_OMA_CAB_USER_PREFS_XML="application/vnd.oma.cab-user-prefs+xml",a.APPLICATION_VND_OMA_DCD="application/vnd.oma.dcd",a.APPLICATION_VND_OMA_DCDC="application/vnd.oma.dcdc",a.APPLICATION_VND_OMA_DD2_XML="application/vnd.oma.dd2+xml",a.APPLICATION_VND_OMA_DRM_RISD_XML="application/vnd.oma.drm.risd+xml",a.APPLICATION_VND_OMA_GROUP_USAGE_LIST_XML="application/vnd.oma.group-usage-list+xml",a.APPLICATION_VND_OMA_LWM2M_CBOR="application/vnd.oma.lwm2m+cbor",a.APPLICATION_VND_OMA_LWM2M_JSON="application/vnd.oma.lwm2m+json",a.APPLICATION_VND_OMA_LWM2M_TLV="application/vnd.oma.lwm2m+tlv",a.APPLICATION_VND_OMA_PAL_XML="application/vnd.oma.pal+xml",a.APPLICATION_VND_OMA_POC_DETAILED_PROGRESS_REPORT_XML="application/vnd.oma.poc.detailed-progress-report+xml",a.APPLICATION_VND_OMA_POC_FINAL_REPORT_XML="application/vnd.oma.poc.final-report+xml",a.APPLICATION_VND_OMA_POC_GROUPS_XML="application/vnd.oma.poc.groups+xml",a.APPLICATION_VND_OMA_POC_INVOCATION_DESCRIPTOR_XML="application/vnd.oma.poc.invocation-descriptor+xml",a.APPLICATION_VND_OMA_POC_OPTIMIZED_PROGRESS_REPORT_XML="application/vnd.oma.poc.optimized-progress-report+xml",a.APPLICATION_VND_OMA_PUSH="application/vnd.oma.push",a.APPLICATION_VND_OMA_SCIDM_MESSAGES_XML="application/vnd.oma.scidm.messages+xml",a.APPLICATION_VND_OMA_XCAP_DIRECTORY_XML="application/vnd.oma.xcap-directory+xml",a.APPLICATION_VND_OMADS_EMAIL_XML="application/vnd.omads-email+xml",a.APPLICATION_VND_OMADS_FILE_XML="application/vnd.omads-file+xml",a.APPLICATION_VND_OMADS_FOLDER_XML="application/vnd.omads-folder+xml",a.APPLICATION_VND_OMALOC_SUPL_INIT="application/vnd.omaloc-supl-init",a.APPLICATION_VND_OMA_SCWS_CONFIG="application/vnd.oma-scws-config",a.APPLICATION_VND_OMA_SCWS_HTTP_REQUEST="application/vnd.oma-scws-http-request",a.APPLICATION_VND_OMA_SCWS_HTTP_RESPONSE="application/vnd.oma-scws-http-response",a.APPLICATION_VND_OMS_CELLULAR_COSE_CONTENT_CBOR="application/vnd.oms.cellular-cose-content+cbor",a.APPLICATION_VND_ONEPAGER="application/vnd.onepager",a.APPLICATION_VND_ONEPAGERTAMP="application/vnd.onepagertamp",a.APPLICATION_VND_ONEPAGERTAMX="application/vnd.onepagertamx",a.APPLICATION_VND_ONEPAGERTAT="application/vnd.onepagertat",a.APPLICATION_VND_ONEPAGERTATP="application/vnd.onepagertatp",a.APPLICATION_VND_ONEPAGERTATX="application/vnd.onepagertatx",a.APPLICATION_VND_ONVIF_METADATA="application/vnd.onvif.metadata",a.APPLICATION_VND_OOTMM_PATCH_ZIP="application/vnd.ootmm.patch+zip",a.APPLICATION_VND_OPENBLOX_GAME_BINARY="application/vnd.openblox.game-binary",a.APPLICATION_VND_OPENBLOX_GAME_XML="application/vnd.openblox.game+xml",a.APPLICATION_VND_OPENEYE_OEB="application/vnd.openeye.oeb",a.APPLICATION_VND_OPENPRINTTAG="application/vnd.openprinttag",a.APPLICATION_VND_OPENSTREETMAP_DATA_XML="application/vnd.openstreetmap.data+xml",a.APPLICATION_VND_OPENTIMESTAMPS_OTS="application/vnd.opentimestamps.ots",a.APPLICATION_VND_OPENVPI_DSPX_JSON="application/vnd.openvpi.dspx+json",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_CUSTOM_PROPERTIES_XML="application/vnd.openxmlformats-officedocument.custom-properties+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_CUSTOMXMLPROPERTIES_XML="application/vnd.openxmlformats-officedocument.customXmlProperties+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_DRAWING_XML="application/vnd.openxmlformats-officedocument.drawing+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_DRAWINGML_CHART_XML="application/vnd.openxmlformats-officedocument.drawingml.chart+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_DRAWINGML_CHARTSHAPES_XML="application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_DRAWINGML_DIAGRAMCOLORS_XML="application/vnd.openxmlformats-officedocument.drawingml.diagramColors+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_DRAWINGML_DIAGRAMDATA_XML="application/vnd.openxmlformats-officedocument.drawingml.diagramData+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_DRAWINGML_DIAGRAMLAYOUT_XML="application/vnd.openxmlformats-officedocument.drawingml.diagramLayout+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_DRAWINGML_DIAGRAMSTYLE_XML="application/vnd.openxmlformats-officedocument.drawingml.diagramStyle+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_EXTENDED_PROPERTIES_XML="application/vnd.openxmlformats-officedocument.extended-properties+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_COMMENTAUTHORS_XML="application/vnd.openxmlformats-officedocument.presentationml.commentAuthors+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_COMMENTS_XML="application/vnd.openxmlformats-officedocument.presentationml.comments+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_HANDOUTMASTER_XML="application/vnd.openxmlformats-officedocument.presentationml.handoutMaster+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_NOTESMASTER_XML="application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_NOTESSLIDE_XML="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_PRESENTATION="application/vnd.openxmlformats-officedocument.presentationml.presentation",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_PRESENTATION_MAIN_XML="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_PRESPROPS_XML="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_SLIDE="application/vnd.openxmlformats-officedocument.presentationml.slide",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_SLIDE_XML="application/vnd.openxmlformats-officedocument.presentationml.slide+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_SLIDELAYOUT_XML="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_SLIDEMASTER_XML="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_SLIDESHOW="application/vnd.openxmlformats-officedocument.presentationml.slideshow",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_SLIDESHOW_MAIN_XML="application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_SLIDEUPDATEINFO_XML="application/vnd.openxmlformats-officedocument.presentationml.slideUpdateInfo+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_TABLESTYLES_XML="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_TAGS_XML="application/vnd.openxmlformats-officedocument.presentationml.tags+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_TEMPLATE="application/vnd.openxmlformats-officedocument.presentationml.template",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_TEMPLATE_MAIN_XML="application/vnd.openxmlformats-officedocument.presentationml.template.main+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_VIEWPROPS_XML="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_CALCCHAIN_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.calcChain+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_CHARTSHEET_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_COMMENTS_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_CONNECTIONS_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_DIALOGSHEET_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_EXTERNALLINK_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.externalLink+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_PIVOTCACHEDEFINITION_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheDefinition+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_PIVOTCACHERECORDS_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheRecords+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_PIVOTTABLE_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.pivotTable+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_QUERYTABLE_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.queryTable+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_REVISIONHEADERS_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.revisionHeaders+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_REVISIONLOG_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.revisionLog+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_SHAREDSTRINGS_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_SHEET="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_SHEET_MAIN_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_SHEETMETADATA_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.sheetMetadata+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_STYLES_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_TABLE_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_TABLESINGLECELLS_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.tableSingleCells+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_TEMPLATE="application/vnd.openxmlformats-officedocument.spreadsheetml.template",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_TEMPLATE_MAIN_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_USERNAMES_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.userNames+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_VOLATILEDEPENDENCIES_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.volatileDependencies+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_WORKSHEET_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_THEME_XML="application/vnd.openxmlformats-officedocument.theme+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_THEMEOVERRIDE_XML="application/vnd.openxmlformats-officedocument.themeOverride+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_VMLDRAWING="application/vnd.openxmlformats-officedocument.vmlDrawing",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_COMMENTS_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_DOCUMENT="application/vnd.openxmlformats-officedocument.wordprocessingml.document",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_DOCUMENT_GLOSSARY_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_DOCUMENT_MAIN_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_ENDNOTES_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_FONTTABLE_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_FOOTER_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_FOOTNOTES_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_NUMBERING_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_SETTINGS_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_STYLES_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_TEMPLATE="application/vnd.openxmlformats-officedocument.wordprocessingml.template",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_TEMPLATE_MAIN_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml",a.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_WEBSETTINGS_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.webSettings+xml",a.APPLICATION_VND_OPENXMLFORMATS_PACKAGE_CORE_PROPERTIES_XML="application/vnd.openxmlformats-package.core-properties+xml",a.APPLICATION_VND_OPENXMLFORMATS_PACKAGE_DIGITAL_SIGNATURE_XMLSIGNATURE_XML="application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml",a.APPLICATION_VND_OPENXMLFORMATS_PACKAGE_RELATIONSHIPS_XML="application/vnd.openxmlformats-package.relationships+xml",a.APPLICATION_VND_ORACLE_RESOURCE_JSON="application/vnd.oracle.resource+json",a.APPLICATION_VND_ORANGE_INDATA="application/vnd.orange.indata",a.APPLICATION_VND_OSA_NETDEPLOY="application/vnd.osa.netdeploy",a.APPLICATION_VND_OSGEO_MAPGUIDE_PACKAGE="application/vnd.osgeo.mapguide.package",a.APPLICATION_VND_OSGI_BUNDLE="application/vnd.osgi.bundle",a.APPLICATION_VND_OSGI_DP="application/vnd.osgi.dp",a.APPLICATION_VND_OSGI_SUBSYSTEM="application/vnd.osgi.subsystem",a.APPLICATION_VND_OTPS_CT_KIP_XML="application/vnd.otps.ct-kip+xml",a.APPLICATION_VND_OXLI_COUNTGRAPH="application/vnd.oxli.countgraph",a.APPLICATION_VND_PAGERDUTY_JSON="application/vnd.pagerduty+json",a.APPLICATION_VND_PALM="application/vnd.palm",a.APPLICATION_VND_PANOPLY="application/vnd.panoply",a.APPLICATION_VND_PAOS_XML="application/vnd.paos.xml",a.APPLICATION_VND_PASTI_STX_DISK_IMAGE="application/vnd.pasti-stx-disk-image",a.APPLICATION_VND_PATENTDIVE="application/vnd.patentdive",a.APPLICATION_VND_PATIENTECOMMSDOC="application/vnd.patientecommsdoc",a.APPLICATION_VND_PAWAAFILE="application/vnd.pawaafile",a.APPLICATION_VND_PCOS="application/vnd.pcos",a.APPLICATION_VND_PEBBLESTREAM_PSOSF_ZIP="application/vnd.pebblestream.psosf+zip",a.APPLICATION_VND_PENGUIN_PN_THEUIP="application/vnd.penguin-pn.theuip",a.APPLICATION_VND_PG_FORMAT="application/vnd.pg.format",a.APPLICATION_VND_PG_OSASLI="application/vnd.pg.osasli",a.APPLICATION_VND_PHBK_XML="application/vnd.phbk+xml",a.APPLICATION_VND_PIACCESS_APPLICATION_LICENCE="application/vnd.piaccess.application-licence",a.APPLICATION_VND_PICSEL="application/vnd.picsel",a.APPLICATION_VND_PMI_WIDGET="application/vnd.pmi.widget",a.APPLICATION_VND_PMTILES="application/vnd.pmtiles",a.APPLICATION_VND_POC_GROUP_ADVERTISEMENT_XML="application/vnd.poc.group-advertisement+xml",a.APPLICATION_VND_POCKETLEARN="application/vnd.pocketlearn",a.APPLICATION_VND_PORTABLEWEB_ZIP="application/vnd.portableweb+zip",a.APPLICATION_VND_POWERBUILDER6="application/vnd.powerbuilder6",a.APPLICATION_VND_POWERBUILDER6_S="application/vnd.powerbuilder6-s",a.APPLICATION_VND_POWERBUILDER7="application/vnd.powerbuilder7",a.APPLICATION_VND_POWERBUILDER75="application/vnd.powerbuilder75",a.APPLICATION_VND_POWERBUILDER75_S="application/vnd.powerbuilder75-s",a.APPLICATION_VND_POWERBUILDER7_S="application/vnd.powerbuilder7-s",a.APPLICATION_VND_PP_SYSTEMVERIFY_XML="application/vnd.pp.systemverify+xml",a.APPLICATION_VND_PREMINET="application/vnd.preminet",a.APPLICATION_VND_PREVIEWSYSTEMS_BOX="application/vnd.previewsystems.box",a.APPLICATION_VND_PRISMATIC="application/vnd.prismatic",a.APPLICATION_VND_PRML_YAML="application/vnd.prml+yaml",a.APPLICATION_VND_PROJECT_GRAPH="application/vnd.project-graph",a.APPLICATION_VND_PROTEUS_MAGAZINE="application/vnd.proteus.magazine",a.APPLICATION_VND_PSFS="application/vnd.psfs",a.APPLICATION_VND_PT_MUNDUSMUNDI="application/vnd.pt.mundusmundi",a.APPLICATION_VND_PUBLISHARE_DELTA_TREE="application/vnd.publishare-delta-tree",a.APPLICATION_VND_PVI_PTID1="application/vnd.pvi.ptid1",a.APPLICATION_VND_PWG_MULTIPLEXED="application/vnd.pwg-multiplexed",a.APPLICATION_VND_PWG_XHTML_PRINT_XML="application/vnd.pwg-xhtml-print+xml",a.APPLICATION_VND_PYON_JSON="application/vnd.pyon+json",a.APPLICATION_VND_QUALCOMM_BREW_APP_RES="application/vnd.qualcomm.brew-app-res",a.APPLICATION_VND_QUANTUMSEQURITY_QNSQY="application/vnd.quantumsequrity.qnsqy",a.APPLICATION_VND_QUARANTAINENET="application/vnd.quarantainenet",a.APPLICATION_VND_QUARK_QUARKXPRESS="application/vnd.Quark.QuarkXPress",a.APPLICATION_VND_QUOBJECT_QUOXDOCUMENT="application/vnd.quobject-quoxdocument",a.APPLICATION_VND_R74N_SANDBOXELS_JSON="application/vnd.R74n.sandboxels+json",a.APPLICATION_VND_RADISYS_MOML_XML="application/vnd.radisys.moml+xml",a.APPLICATION_VND_RADISYS_MSML_AUDIT_CONF_XML="application/vnd.radisys.msml-audit-conf+xml",a.APPLICATION_VND_RADISYS_MSML_AUDIT_CONN_XML="application/vnd.radisys.msml-audit-conn+xml",a.APPLICATION_VND_RADISYS_MSML_AUDIT_DIALOG_XML="application/vnd.radisys.msml-audit-dialog+xml",a.APPLICATION_VND_RADISYS_MSML_AUDIT_STREAM_XML="application/vnd.radisys.msml-audit-stream+xml",a.APPLICATION_VND_RADISYS_MSML_AUDIT_XML="application/vnd.radisys.msml-audit+xml",a.APPLICATION_VND_RADISYS_MSML_CONF_XML="application/vnd.radisys.msml-conf+xml",a.APPLICATION_VND_RADISYS_MSML_DIALOG_BASE_XML="application/vnd.radisys.msml-dialog-base+xml",a.APPLICATION_VND_RADISYS_MSML_DIALOG_FAX_DETECT_XML="application/vnd.radisys.msml-dialog-fax-detect+xml",a.APPLICATION_VND_RADISYS_MSML_DIALOG_FAX_SENDRECV_XML="application/vnd.radisys.msml-dialog-fax-sendrecv+xml",a.APPLICATION_VND_RADISYS_MSML_DIALOG_GROUP_XML="application/vnd.radisys.msml-dialog-group+xml",a.APPLICATION_VND_RADISYS_MSML_DIALOG_SPEECH_XML="application/vnd.radisys.msml-dialog-speech+xml",a.APPLICATION_VND_RADISYS_MSML_DIALOG_TRANSFORM_XML="application/vnd.radisys.msml-dialog-transform+xml",a.APPLICATION_VND_RADISYS_MSML_DIALOG_XML="application/vnd.radisys.msml-dialog+xml",a.APPLICATION_VND_RADISYS_MSML_XML="application/vnd.radisys.msml+xml",a.APPLICATION_VND_RAINSTOR_DATA="application/vnd.rainstor.data",a.APPLICATION_VND_RAPID="application/vnd.rapid",a.APPLICATION_VND_RAR="application/vnd.rar",a.APPLICATION_VND_REALVNC_BED="application/vnd.realvnc.bed",a.APPLICATION_VND_RECORDARE_MUSICXML="application/vnd.recordare.musicxml",a.APPLICATION_VND_RECORDARE_MUSICXML_XML="application/vnd.recordare.musicxml+xml",a.APPLICATION_VND_REGO="application/vnd.rego",a.APPLICATION_VND_RELPIPE="application/vnd.relpipe",a.APPLICATION_VND_RENLEARN_RLPRINT="application/vnd.RenLearn.rlprint",a.APPLICATION_VND_RESILIENT_LOGIC="application/vnd.resilient.logic",a.APPLICATION_VND_RESTFUL_JSON="application/vnd.restful+json",a.APPLICATION_VND_RIG_CRYPTONOTE="application/vnd.rig.cryptonote",a.APPLICATION_VND_ROUTE66_LINK66_XML="application/vnd.route66.link66+xml",a.APPLICATION_VND_RS_274X="application/vnd.rs-274x",a.APPLICATION_VND_RUCKUS_DOWNLOAD="application/vnd.ruckus.download",a.APPLICATION_VND_S3SMS="application/vnd.s3sms",a.APPLICATION_VND_SAILINGTRACKER_TRACK="application/vnd.sailingtracker.track",a.APPLICATION_VND_SALVANOTE_SAL="application/vnd.salvanote.sal",a.APPLICATION_VND_SAR="application/vnd.sar",a.APPLICATION_VND_SBM_CID="application/vnd.sbm.cid",a.APPLICATION_VND_SBM_MID2="application/vnd.sbm.mid2",a.APPLICATION_VND_SCRIBUS="application/vnd.scribus",a.APPLICATION_VND_SEALED_3DF="application/vnd.sealed.3df",a.APPLICATION_VND_SEALED_CSF="application/vnd.sealed.csf",a.APPLICATION_VND_SEALED_DOC="application/vnd.sealed.doc",a.APPLICATION_VND_SEALED_EML="application/vnd.sealed.eml",a.APPLICATION_VND_SEALED_MHT="application/vnd.sealed.mht",a.APPLICATION_VND_SEALED_NET="application/vnd.sealed.net",a.APPLICATION_VND_SEALED_PPT="application/vnd.sealed.ppt",a.APPLICATION_VND_SEALED_TIFF="application/vnd.sealed.tiff",a.APPLICATION_VND_SEALED_XLS="application/vnd.sealed.xls",a.APPLICATION_VND_SEALEDMEDIA_SOFTSEAL_HTML="application/vnd.sealedmedia.softseal.html",a.APPLICATION_VND_SEALEDMEDIA_SOFTSEAL_PDF="application/vnd.sealedmedia.softseal.pdf",a.APPLICATION_VND_SEEMAIL="application/vnd.seemail",a.APPLICATION_VND_SEIS_JSON="application/vnd.seis+json",a.APPLICATION_VND_SEMA="application/vnd.sema",a.APPLICATION_VND_SEMD="application/vnd.semd",a.APPLICATION_VND_SEMF="application/vnd.semf",a.APPLICATION_VND_SHADE_SAVE_FILE="application/vnd.shade-save-file",a.APPLICATION_VND_SHANA_INFORMED_FORMDATA="application/vnd.shana.informed.formdata",a.APPLICATION_VND_SHANA_INFORMED_FORMTEMPLATE="application/vnd.shana.informed.formtemplate",a.APPLICATION_VND_SHANA_INFORMED_INTERCHANGE="application/vnd.shana.informed.interchange",a.APPLICATION_VND_SHANA_INFORMED_PACKAGE="application/vnd.shana.informed.package",a.APPLICATION_VND_SHOOTPROOF_JSON="application/vnd.shootproof+json",a.APPLICATION_VND_SHOPKICK_JSON="application/vnd.shopkick+json",a.APPLICATION_VND_SHP="application/vnd.shp",a.APPLICATION_VND_SHX="application/vnd.shx",a.APPLICATION_VND_SIGROK_SESSION="application/vnd.sigrok.session",a.APPLICATION_VND_SIMTECH_MINDMAPPER="application/vnd.SimTech-MindMapper",a.APPLICATION_VND_SIREN_JSON="application/vnd.siren+json",a.APPLICATION_VND_SIRTX_VMV0="application/vnd.sirtx.vmv0",a.APPLICATION_VND_SKETCHOMETRY="application/vnd.sketchometry",a.APPLICATION_VND_SMAF="application/vnd.smaf",a.APPLICATION_VND_SMART_NOTEBOOK="application/vnd.smart.notebook",a.APPLICATION_VND_SMART_TEACHER="application/vnd.smart.teacher",a.APPLICATION_VND_SMINTIO_PORTALS_ARCHIVE="application/vnd.smintio.portals.archive",a.APPLICATION_VND_SNESDEV_PAGE_TABLE="application/vnd.snesdev-page-table",a.APPLICATION_VND_SOFTPRES_IPF_DISK_IMAGE="application/vnd.softpres-ipf-disk-image",a.APPLICATION_VND_SOFTWARE602_FILLER_FORM_XML="application/vnd.software602.filler.form+xml",a.APPLICATION_VND_SOFTWARE602_FILLER_FORM_XML_ZIP="application/vnd.software602.filler.form-xml-zip",a.APPLICATION_VND_SOLENT_SDKM_XML="application/vnd.solent.sdkm+xml",a.APPLICATION_VND_SPOTFIRE_DXP="application/vnd.spotfire.dxp",a.APPLICATION_VND_SPOTFIRE_SFS="application/vnd.spotfire.sfs",a.APPLICATION_VND_SQLITE3="application/vnd.sqlite3",a.APPLICATION_VND_SRI="application/vnd.sri",a.APPLICATION_VND_SSS_COD="application/vnd.sss-cod",a.APPLICATION_VND_SSS_DTF="application/vnd.sss-dtf",a.APPLICATION_VND_SSS_NTF="application/vnd.sss-ntf",a.APPLICATION_VND_STEPMANIA_PACKAGE="application/vnd.stepmania.package",a.APPLICATION_VND_STEPMANIA_STEPCHART="application/vnd.stepmania.stepchart",a.APPLICATION_VND_STREET_STREAM="application/vnd.street-stream",a.APPLICATION_VND_SUN_WADL_XML="application/vnd.sun.wadl+xml",a.APPLICATION_VND_SUPERCARD_PRO_DISK_IMAGE="application/vnd.supercard-pro-disk-image",a.APPLICATION_VND_SUPERFILE_SUPER="application/vnd.superfile.super",a.APPLICATION_VND_SUS_CALENDAR="application/vnd.sus-calendar",a.APPLICATION_VND_SVD="application/vnd.svd",a.APPLICATION_VND_SVR_RECEIPT_JSON="application/vnd.svr.receipt+json",a.APPLICATION_VND_SWIFTVIEW_ICS="application/vnd.swiftview-ics",a.APPLICATION_VND_SYBYL_MOL2="application/vnd.sybyl.mol2",a.APPLICATION_VND_SYCLE_XML="application/vnd.sycle+xml",a.APPLICATION_VND_SYFT_JSON="application/vnd.syft+json",a.APPLICATION_VND_SYNCML_DM_NOTIFICATION="application/vnd.syncml.dm.notification",a.APPLICATION_VND_SYNCML_DMDDF_XML="application/vnd.syncml.dmddf+xml",a.APPLICATION_VND_SYNCML_DMTNDS_WBXML="application/vnd.syncml.dmtnds+wbxml",a.APPLICATION_VND_SYNCML_DMTNDS_XML="application/vnd.syncml.dmtnds+xml",a.APPLICATION_VND_SYNCML_DMDDF_WBXML="application/vnd.syncml.dmddf+wbxml",a.APPLICATION_VND_SYNCML_DM_WBXML="application/vnd.syncml.dm+wbxml",a.APPLICATION_VND_SYNCML_DM_XML="application/vnd.syncml.dm+xml",a.APPLICATION_VND_SYNCML_DS_NOTIFICATION="application/vnd.syncml.ds.notification",a.APPLICATION_VND_SYNCML_XML="application/vnd.syncml+xml",a.APPLICATION_VND_TABLAFOCUS_NOTATION="application/vnd.tablafocus.notation",a.APPLICATION_VND_TABLESCHEMA_JSON="application/vnd.tableschema+json",a.APPLICATION_VND_TAO_INTENT_MODULE_ARCHIVE="application/vnd.tao.intent-module-archive",a.APPLICATION_VND_TCPDUMP_PCAP="application/vnd.tcpdump.pcap",a.APPLICATION_VND_THINK_CELL_PPTTC_JSON="application/vnd.think-cell.ppttc+json",a.APPLICATION_VND_TML="application/vnd.tml",a.APPLICATION_VND_TMD_MEDIAFLEX_API_XML="application/vnd.tmd.mediaflex.api+xml",a.APPLICATION_VND_TMOBILE_LIVETV="application/vnd.tmobile-livetv",a.APPLICATION_VND_TRI_ONESOURCE="application/vnd.tri.onesource",a.APPLICATION_VND_TRID_TPT="application/vnd.trid.tpt",a.APPLICATION_VND_TRISCAPE_MXS="application/vnd.triscape.mxs",a.APPLICATION_VND_TRUEAPP="application/vnd.trueapp",a.APPLICATION_VND_TRUEDOC="application/vnd.truedoc",a.APPLICATION_VND_UBISOFT_WEBPLAYER="application/vnd.ubisoft.webplayer",a.APPLICATION_VND_UFDL="application/vnd.ufdl",a.APPLICATION_VND_UIC_DOSIPAS_V1="application/vnd.uic.dosipas.v1",a.APPLICATION_VND_UIC_DOSIPAS_V2="application/vnd.uic.dosipas.v2",a.APPLICATION_VND_UIC_OSDM_JSON="application/vnd.uic.osdm+json",a.APPLICATION_VND_UIC_TLB_FCB="application/vnd.uic.tlb-fcb",a.APPLICATION_VND_UIQ_THEME="application/vnd.uiq.theme",a.APPLICATION_VND_UMAJIN="application/vnd.umajin",a.APPLICATION_VND_UNITY="application/vnd.unity",a.APPLICATION_VND_UOML_XML="application/vnd.uoml+xml",a.APPLICATION_VND_UPLANET_ALERT="application/vnd.uplanet.alert",a.APPLICATION_VND_UPLANET_ALERT_WBXML="application/vnd.uplanet.alert-wbxml",a.APPLICATION_VND_UPLANET_BEARER_CHOICE="application/vnd.uplanet.bearer-choice",a.APPLICATION_VND_UPLANET_BEARER_CHOICE_WBXML="application/vnd.uplanet.bearer-choice-wbxml",a.APPLICATION_VND_UPLANET_CACHEOP="application/vnd.uplanet.cacheop",a.APPLICATION_VND_UPLANET_CACHEOP_WBXML="application/vnd.uplanet.cacheop-wbxml",a.APPLICATION_VND_UPLANET_CHANNEL="application/vnd.uplanet.channel",a.APPLICATION_VND_UPLANET_CHANNEL_WBXML="application/vnd.uplanet.channel-wbxml",a.APPLICATION_VND_UPLANET_LIST="application/vnd.uplanet.list",a.APPLICATION_VND_UPLANET_LISTCMD="application/vnd.uplanet.listcmd",a.APPLICATION_VND_UPLANET_LISTCMD_WBXML="application/vnd.uplanet.listcmd-wbxml",a.APPLICATION_VND_UPLANET_LIST_WBXML="application/vnd.uplanet.list-wbxml",a.APPLICATION_VND_URI_MAP="application/vnd.uri-map",a.APPLICATION_VND_UPLANET_SIGNAL="application/vnd.uplanet.signal",a.APPLICATION_VND_VALVE_SOURCE_MATERIAL="application/vnd.valve.source.material",a.APPLICATION_VND_VCX="application/vnd.vcx",a.APPLICATION_VND_VD_STUDY="application/vnd.vd-study",a.APPLICATION_VND_VECTORWORKS="application/vnd.vectorworks",a.APPLICATION_VND_VEL_JSON="application/vnd.vel+json",a.APPLICATION_VND_VERAISON_NVIDIA_GPU_EVIDENCE_JSON="application/vnd.veraison.nvidia-gpu-evidence+json",a.APPLICATION_VND_VERAISON_TSM_REPORT_CBOR="application/vnd.veraison.tsm-report+cbor",a.APPLICATION_VND_VERAISON_TSM_REPORT_JSON="application/vnd.veraison.tsm-report+json",a.APPLICATION_VND_VERIFIER_ATTESTATION_JWT="application/vnd.verifier-attestation+jwt",a.APPLICATION_VND_VERIMATRIX_VCAS="application/vnd.verimatrix.vcas",a.APPLICATION_VND_VERITONE_AION_JSON="application/vnd.veritone.aion+json",a.APPLICATION_VND_VERTIFILE_PVF="application/vnd.vertifile.pvf",a.APPLICATION_VND_VERYANT_THIN="application/vnd.veryant.thin",a.APPLICATION_VND_VES_ENCRYPTED="application/vnd.ves.encrypted",a.APPLICATION_VND_VIDSOFT_VIDCONFERENCE="application/vnd.vidsoft.vidconference",a.APPLICATION_VND_VIMINA_VMA="application/vnd.vimina.vma",a.APPLICATION_VND_VISIO="application/vnd.visio",a.APPLICATION_VND_VISIONARY="application/vnd.visionary",a.APPLICATION_VND_VIVIDENCE_SCRIPTFILE="application/vnd.vividence.scriptfile",a.APPLICATION_VND_VOCALSHAPER_VSP4="application/vnd.vocalshaper.vsp4",a.APPLICATION_VND_VSF="application/vnd.vsf",a.APPLICATION_VND_VUQ="application/vnd.vuq",a.APPLICATION_VND_WANTVERSE="application/vnd.wantverse",a.APPLICATION_VND_WAP_SIC="application/vnd.wap.sic",a.APPLICATION_VND_WAP_SLC="application/vnd.wap.slc",a.APPLICATION_VND_WAP_WBXML="application/vnd.wap.wbxml",a.APPLICATION_VND_WAP_WMLC="application/vnd.wap.wmlc",a.APPLICATION_VND_WAP_WMLSCRIPTC="application/vnd.wap.wmlscriptc",a.APPLICATION_VND_WASMFLOW_WAFL="application/vnd.wasmflow.wafl",a.APPLICATION_VND_WEBTURBO="application/vnd.webturbo",a.APPLICATION_VND_WFA_DPP="application/vnd.wfa.dpp",a.APPLICATION_VND_WFA_P2P="application/vnd.wfa.p2p",a.APPLICATION_VND_WFA_WSC="application/vnd.wfa.wsc",a.APPLICATION_VND_WINDOWS_DEVICEPAIRING="application/vnd.windows.devicepairing",a.APPLICATION_VND_WMAP="application/vnd.wmap",a.APPLICATION_VND_WMC="application/vnd.wmc",a.APPLICATION_VND_WMF_BOOTSTRAP="application/vnd.wmf.bootstrap",a.APPLICATION_VND_WOLFRAM_MATHEMATICA="application/vnd.wolfram.mathematica",a.APPLICATION_VND_WOLFRAM_MATHEMATICA_PACKAGE="application/vnd.wolfram.mathematica.package",a.APPLICATION_VND_WOLFRAM_PLAYER="application/vnd.wolfram.player",a.APPLICATION_VND_WORDLIFT="application/vnd.wordlift",a.APPLICATION_VND_WORDPERFECT="application/vnd.wordperfect",a.APPLICATION_VND_WQD="application/vnd.wqd",a.APPLICATION_VND_WRQ_HP3000_LABELLED="application/vnd.wrq-hp3000-labelled",a.APPLICATION_VND_WT_STF="application/vnd.wt.stf",a.APPLICATION_VND_WV_CSP_XML="application/vnd.wv.csp+xml",a.APPLICATION_VND_WV_CSP_WBXML="application/vnd.wv.csp+wbxml",a.APPLICATION_VND_WV_SSP_XML="application/vnd.wv.ssp+xml",a.APPLICATION_VND_XACML_JSON="application/vnd.xacml+json",a.APPLICATION_VND_XARA="application/vnd.xara",a.APPLICATION_VND_XARIN_CPJ="application/vnd.xarin.cpj",a.APPLICATION_VND_XCDN="application/vnd.xcdn",a.APPLICATION_VND_XECRETS_ENCRYPTED="application/vnd.xecrets-encrypted",a.APPLICATION_VND_XFDL="application/vnd.xfdl",a.APPLICATION_VND_XFDL_WEBFORM="application/vnd.xfdl.webform",a.APPLICATION_VND_XMI_XML="application/vnd.xmi+xml",a.APPLICATION_VND_XMPIE_CPKG="application/vnd.xmpie.cpkg",a.APPLICATION_VND_XMPIE_DPKG="application/vnd.xmpie.dpkg",a.APPLICATION_VND_XMPIE_PLAN="application/vnd.xmpie.plan",a.APPLICATION_VND_XMPIE_PPKG="application/vnd.xmpie.ppkg",a.APPLICATION_VND_XMPIE_XLIM="application/vnd.xmpie.xlim",a.APPLICATION_VND_YAMAHA_HV_DIC="application/vnd.yamaha.hv-dic",a.APPLICATION_VND_YAMAHA_HV_SCRIPT="application/vnd.yamaha.hv-script",a.APPLICATION_VND_YAMAHA_HV_VOICE="application/vnd.yamaha.hv-voice",a.APPLICATION_VND_YAMAHA_OPENSCOREFORMAT_OSFPVG_XML="application/vnd.yamaha.openscoreformat.osfpvg+xml",a.APPLICATION_VND_YAMAHA_OPENSCOREFORMAT="application/vnd.yamaha.openscoreformat",a.APPLICATION_VND_YAMAHA_REMOTE_SETUP="application/vnd.yamaha.remote-setup",a.APPLICATION_VND_YAMAHA_SMAF_AUDIO="application/vnd.yamaha.smaf-audio",a.APPLICATION_VND_YAMAHA_SMAF_PHRASE="application/vnd.yamaha.smaf-phrase",a.APPLICATION_VND_YAMAHA_THROUGH_NGN="application/vnd.yamaha.through-ngn",a.APPLICATION_VND_YAMAHA_TUNNEL_UDPENCAP="application/vnd.yamaha.tunnel-udpencap",a.APPLICATION_VND_YAOWEME="application/vnd.yaoweme",a.APPLICATION_VND_YELLOWRIVER_CUSTOM_MENU="application/vnd.yellowriver-custom-menu",a.APPLICATION_VND_YOUTUBE_YT="application/vnd.youtube.yt",a.APPLICATION_VND_ZOHO_DOCUMENT_WRITER="application/vnd.zoho-document.writer",a.APPLICATION_VND_ZOHO_PRESENTATION_SHOW="application/vnd.zoho-presentation.show",a.APPLICATION_VND_ZOHO_SPREADSHEETML_SHEET="application/vnd.zoho.spreadsheetml.sheet",a.APPLICATION_VND_ZUL="application/vnd.zul",a.APPLICATION_VND_ZZAZZ_DECK_XML="application/vnd.zzazz.deck+xml",a.APPLICATION_VOICEXML_XML="application/voicexml+xml",a.APPLICATION_VOUCHER_CMS_JSON="application/voucher-cms+json",a.APPLICATION_VOUCHER_JWS_JSON="application/voucher-jws+json",a.APPLICATION_VP="application/vp",a.APPLICATION_VP_COSE="application/vp+cose",a.APPLICATION_VP_JWT="application/vp+jwt",a.APPLICATION_VP_SD_JWT="application/vp+sd-jwt",a.APPLICATION_VQ_RTCPXR="application/vq-rtcpxr",a.APPLICATION_WASM="application/wasm",a.APPLICATION_WATCHERINFO_XML="application/watcherinfo+xml",a.APPLICATION_WEBPUSH_OPTIONS_JSON="application/webpush-options+json",a.APPLICATION_WHOISPP_QUERY="application/whoispp-query",a.APPLICATION_WHOISPP_RESPONSE="application/whoispp-response",a.APPLICATION_WIDGET="application/widget",a.APPLICATION_WITA="application/wita",a.APPLICATION_WORDPERFECT5_1="application/wordperfect5.1",a.APPLICATION_WSDL_XML="application/wsdl+xml",a.APPLICATION_WSPOLICY_XML="application/wspolicy+xml",a.APPLICATION_X_PKI_MESSAGE="application/x-pki-message",a.APPLICATION_X_WWW_FORM_URLENCODED="application/x-www-form-urlencoded",a.APPLICATION_X_X509_CA_CERT="application/x-x509-ca-cert",a.APPLICATION_X_X509_CA_RA_CERT="application/x-x509-ca-ra-cert",a.APPLICATION_X_X509_NEXT_CA_CERT="application/x-x509-next-ca-cert",a.APPLICATION_X400_BP="application/x400-bp",a.APPLICATION_XACML_XML="application/xacml+xml",a.APPLICATION_XCAP_ATT_XML="application/xcap-att+xml",a.APPLICATION_XCAP_CAPS_XML="application/xcap-caps+xml",a.APPLICATION_XCAP_DIFF_XML="application/xcap-diff+xml",a.APPLICATION_XCAP_EL_XML="application/xcap-el+xml",a.APPLICATION_XCAP_ERROR_XML="application/xcap-error+xml",a.APPLICATION_XCAP_NS_XML="application/xcap-ns+xml",a.APPLICATION_XCON_CONFERENCE_INFO_DIFF_XML="application/xcon-conference-info-diff+xml",a.APPLICATION_XCON_CONFERENCE_INFO_XML="application/xcon-conference-info+xml",a.APPLICATION_XENC_XML="application/xenc+xml",a.APPLICATION_XFDF="application/xfdf",a.APPLICATION_XHTML_XML="application/xhtml+xml",a.APPLICATION_XLIFF_XML="application/xliff+xml",a.APPLICATION_XML="application/xml",a.APPLICATION_XML_DTD="application/xml-dtd",a.APPLICATION_XML_EXTERNAL_PARSED_ENTITY="application/xml-external-parsed-entity",a.APPLICATION_XML_PATCH_XML="application/xml-patch+xml",a.APPLICATION_XMPP_XML="application/xmpp+xml",a.APPLICATION_XOP_XML="application/xop+xml",a.APPLICATION_XSLT_XML="application/xslt+xml",a.APPLICATION_XV_XML="application/xv+xml",a.APPLICATION_YAML="application/yaml",a.APPLICATION_YANG="application/yang",a.APPLICATION_YANG_DATA_CBOR="application/yang-data+cbor",a.APPLICATION_YANG_DATA_JSON="application/yang-data+json",a.APPLICATION_YANG_DATA_XML="application/yang-data+xml",a.APPLICATION_YANG_PATCH_JSON="application/yang-patch+json",a.APPLICATION_YANG_PATCH_XML="application/yang-patch+xml",a.APPLICATION_YANG_SID_JSON="application/yang-sid+json",a.APPLICATION_YIN_XML="application/yin+xml",a.APPLICATION_ZIP="application/zip",a.APPLICATION_ZLIB="application/zlib",a.APPLICATION_ZSTD="application/zstd",a.AUDIO_1D_INTERLEAVED_PARITYFEC="audio/1d-interleaved-parityfec",a.AUDIO_32KADPCM="audio/32kadpcm",a.AUDIO_3GPP="audio/3gpp",a.AUDIO_3GPP2="audio/3gpp2",a.AUDIO_AAC="audio/aac",a.AUDIO_AC3="audio/ac3",a.AUDIO_AMR="audio/AMR",a.AUDIO_AMR_WB="audio/AMR-WB",a.AUDIO_AMR_WB_="audio/amr-wb+",a.AUDIO_APTX="audio/aptx",a.AUDIO_ASC="audio/asc",a.AUDIO_ATRAC_ADVANCED_LOSSLESS="audio/ATRAC-ADVANCED-LOSSLESS",a.AUDIO_ATRAC_X="audio/ATRAC-X",a.AUDIO_ATRAC3="audio/ATRAC3",a.AUDIO_BASIC="audio/basic",a.AUDIO_BV16="audio/BV16",a.AUDIO_BV32="audio/BV32",a.AUDIO_CLEARMODE="audio/clearmode",a.AUDIO_CN="audio/CN",a.AUDIO_DAT12="audio/DAT12",a.AUDIO_DLS="audio/dls",a.AUDIO_DSR_ES201108="audio/dsr-es201108",a.AUDIO_DSR_ES202050="audio/dsr-es202050",a.AUDIO_DSR_ES202211="audio/dsr-es202211",a.AUDIO_DSR_ES202212="audio/dsr-es202212",a.AUDIO_DV="audio/DV",a.AUDIO_DVI4="audio/DVI4",a.AUDIO_EAC3="audio/eac3",a.AUDIO_ENCAPRTP="audio/encaprtp",a.AUDIO_EVRC="audio/EVRC",a.AUDIO_EVRC_QCP="audio/EVRC-QCP",a.AUDIO_EVRC0="audio/EVRC0",a.AUDIO_EVRC1="audio/EVRC1",a.AUDIO_EVRCB="audio/EVRCB",a.AUDIO_EVRCB0="audio/EVRCB0",a.AUDIO_EVRCB1="audio/EVRCB1",a.AUDIO_EVRCNW="audio/EVRCNW",a.AUDIO_EVRCNW0="audio/EVRCNW0",a.AUDIO_EVRCNW1="audio/EVRCNW1",a.AUDIO_EVRCWB="audio/EVRCWB",a.AUDIO_EVRCWB0="audio/EVRCWB0",a.AUDIO_EVRCWB1="audio/EVRCWB1",a.AUDIO_EVS="audio/EVS",a.AUDIO_EXAMPLE="audio/example",a.AUDIO_FLAC="audio/flac",a.AUDIO_FLEXFEC="audio/flexfec",a.AUDIO_FWDRED="audio/fwdred",a.AUDIO_G711_0="audio/G711-0",a.AUDIO_G719="audio/G719",a.AUDIO_G7221="audio/G7221",a.AUDIO_G722="audio/G722",a.AUDIO_G723="audio/G723",a.AUDIO_G726_16="audio/G726-16",a.AUDIO_G726_24="audio/G726-24",a.AUDIO_G726_32="audio/G726-32",a.AUDIO_G726_40="audio/G726-40",a.AUDIO_G728="audio/G728",a.AUDIO_G729="audio/G729",a.AUDIO_G7291="audio/G7291",a.AUDIO_G729D="audio/G729D",a.AUDIO_G729E="audio/G729E",a.AUDIO_GSM="audio/GSM",a.AUDIO_GSM_EFR="audio/GSM-EFR",a.AUDIO_GSM_HR_08="audio/GSM-HR-08",a.AUDIO_ILBC="audio/iLBC",a.AUDIO_IP_MR_V2_5="audio/ip-mr_v2.5",a.AUDIO_L8="audio/L8",a.AUDIO_L16="audio/L16",a.AUDIO_L20="audio/L20",a.AUDIO_L24="audio/L24",a.AUDIO_LPC="audio/LPC",a.AUDIO_MATROSKA="audio/matroska",a.AUDIO_MELP="audio/MELP",a.AUDIO_MELP600="audio/MELP600",a.AUDIO_MELP1200="audio/MELP1200",a.AUDIO_MELP2400="audio/MELP2400",a.AUDIO_MHAS="audio/mhas",a.AUDIO_MIDI_CLIP="audio/midi-clip",a.AUDIO_MOBILE_XMF="audio/mobile-xmf",a.AUDIO_MPA="audio/MPA",a.AUDIO_MP4="audio/mp4",a.AUDIO_MP4A_LATM="audio/MP4A-LATM",a.AUDIO_MPA_ROBUST="audio/mpa-robust",a.AUDIO_MPEG="audio/mpeg",a.AUDIO_MPEG4_GENERIC="audio/mpeg4-generic",a.AUDIO_OGG="audio/ogg",a.AUDIO_OPUS="audio/opus",a.AUDIO_PARITYFEC="audio/parityfec",a.AUDIO_PCMA="audio/PCMA",a.AUDIO_PCMA_WB="audio/PCMA-WB",a.AUDIO_PCMU="audio/PCMU",a.AUDIO_PCMU_WB="audio/PCMU-WB",a.AUDIO_PRS_AAUD="audio/prs.aaud",a.AUDIO_PRS_ELUPON_EUA="audio/prs.elupon-eua",a.AUDIO_PRS_SID="audio/prs.sid",a.AUDIO_QCELP="audio/QCELP",a.AUDIO_RAPTORFEC="audio/raptorfec",a.AUDIO_RED="audio/RED",a.AUDIO_RTP_ENC_AESCM128="audio/rtp-enc-aescm128",a.AUDIO_RTPLOOPBACK="audio/rtploopback",a.AUDIO_RTP_MIDI="audio/rtp-midi",a.AUDIO_RTX="audio/rtx",a.AUDIO_SCIP="audio/scip",a.AUDIO_SMV="audio/SMV",a.AUDIO_SMV0="audio/SMV0",a.AUDIO_SMV_QCP="audio/SMV-QCP",a.AUDIO_SOFA="audio/sofa",a.AUDIO_SOUNDFONT="audio/soundfont",a.AUDIO_SP_MIDI="audio/sp-midi",a.AUDIO_SPEEX="audio/speex",a.AUDIO_T140C="audio/t140c",a.AUDIO_T38="audio/t38",a.AUDIO_TELEPHONE_EVENT="audio/telephone-event",a.AUDIO_TETRA_ACELP="audio/TETRA_ACELP",a.AUDIO_TETRA_ACELP_BB="audio/TETRA_ACELP_BB",a.AUDIO_TONE="audio/tone",a.AUDIO_TSVCIS="audio/TSVCIS",a.AUDIO_UEMCLIP="audio/UEMCLIP",a.AUDIO_ULPFEC="audio/ulpfec",a.AUDIO_USAC="audio/usac",a.AUDIO_VDVI="audio/VDVI",a.AUDIO_VMR_WB="audio/VMR-WB",a.AUDIO_VND_3GPP_IUFP="audio/vnd.3gpp.iufp",a.AUDIO_VND_4SB="audio/vnd.4SB",a.AUDIO_VND_AUDIOKOZ="audio/vnd.audiokoz",a.AUDIO_VND_BLOCKFACT_FACTA="audio/vnd.blockfact.facta",a.AUDIO_VND_CELP="audio/vnd.CELP",a.AUDIO_VND_CISCO_NSE="audio/vnd.cisco.nse",a.AUDIO_VND_CMLES_RADIO_EVENTS="audio/vnd.cmles.radio-events",a.AUDIO_VND_CNS_ANP1="audio/vnd.cns.anp1",a.AUDIO_VND_CNS_INF1="audio/vnd.cns.inf1",a.AUDIO_VND_DECE_AUDIO="audio/vnd.dece.audio",a.AUDIO_VND_DIGITAL_WINDS="audio/vnd.digital-winds",a.AUDIO_VND_DLNA_ADTS="audio/vnd.dlna.adts",a.AUDIO_VND_DOLBY_HEAAC_1="audio/vnd.dolby.heaac.1",a.AUDIO_VND_DOLBY_HEAAC_2="audio/vnd.dolby.heaac.2",a.AUDIO_VND_DOLBY_MLP="audio/vnd.dolby.mlp",a.AUDIO_VND_DOLBY_MPS="audio/vnd.dolby.mps",a.AUDIO_VND_DOLBY_PL2="audio/vnd.dolby.pl2",a.AUDIO_VND_DOLBY_PL2X="audio/vnd.dolby.pl2x",a.AUDIO_VND_DOLBY_PL2Z="audio/vnd.dolby.pl2z",a.AUDIO_VND_DOLBY_PULSE_1="audio/vnd.dolby.pulse.1",a.AUDIO_VND_DRA="audio/vnd.dra",a.AUDIO_VND_DTS="audio/vnd.dts",a.AUDIO_VND_DTS_HD="audio/vnd.dts.hd",a.AUDIO_VND_DTS_UHD="audio/vnd.dts.uhd",a.AUDIO_VND_DVB_FILE="audio/vnd.dvb.file",a.AUDIO_VND_EVERAD_PLJ="audio/vnd.everad.plj",a.AUDIO_VND_HNS_AUDIO="audio/vnd.hns.audio",a.AUDIO_VND_LUCENT_VOICE="audio/vnd.lucent.voice",a.AUDIO_VND_MS_PLAYREADY_MEDIA_PYA="audio/vnd.ms-playready.media.pya",a.AUDIO_VND_NOKIA_MOBILE_XMF="audio/vnd.nokia.mobile-xmf",a.AUDIO_VND_NORTEL_VBK="audio/vnd.nortel.vbk",a.AUDIO_VND_NUERA_ECELP4800="audio/vnd.nuera.ecelp4800",a.AUDIO_VND_NUERA_ECELP7470="audio/vnd.nuera.ecelp7470",a.AUDIO_VND_NUERA_ECELP9600="audio/vnd.nuera.ecelp9600",a.AUDIO_VND_OCTEL_SBC="audio/vnd.octel.sbc",a.AUDIO_VND_OPENNBS_NBS="audio/vnd.opennbs.nbs",a.AUDIO_VND_PRESONUS_MULTITRACK="audio/vnd.presonus.multitrack",a.AUDIO_VND_QCELP="audio/vnd.qcelp",a.AUDIO_VND_RHETOREX_32KADPCM="audio/vnd.rhetorex.32kadpcm",a.AUDIO_VND_RIP="audio/vnd.rip",a.AUDIO_VND_SEALEDMEDIA_SOFTSEAL_MPEG="audio/vnd.sealedmedia.softseal.mpeg",a.AUDIO_VND_VMX_CVSD="audio/vnd.vmx.cvsd",a.AUDIO_VORBIS="audio/vorbis",a.AUDIO_VORBIS_CONFIG="audio/vorbis-config",a.FONT_COLLECTION="font/collection",a.FONT_OTF="font/otf",a.FONT_SFNT="font/sfnt",a.FONT_TTF="font/ttf",a.FONT_WOFF="font/woff",a.FONT_WOFF2="font/woff2",a.HAPTICS_IVS="haptics/ivs",a.HAPTICS_HJIF="haptics/hjif",a.HAPTICS_HMPG="haptics/hmpg",a.IMAGE_ACES="image/aces",a.IMAGE_APNG="image/apng",a.IMAGE_AVCI="image/avci",a.IMAGE_AVCS="image/avcs",a.IMAGE_AVIF="image/avif",a.IMAGE_BMP="image/bmp",a.IMAGE_CGM="image/cgm",a.IMAGE_DICOM_RLE="image/dicom-rle",a.IMAGE_DPX="image/dpx",a.IMAGE_EMF="image/emf",a.IMAGE_EXAMPLE="image/example",a.IMAGE_FITS="image/fits",a.IMAGE_G3FAX="image/g3fax",a.IMAGE_GIF="image/gif",a.IMAGE_HEIC="image/heic",a.IMAGE_HEIC_SEQUENCE="image/heic-sequence",a.IMAGE_HEIF="image/heif",a.IMAGE_HEIF_SEQUENCE="image/heif-sequence",a.IMAGE_HEJ2K="image/hej2k",a.IMAGE_HSJ2="image/hsj2",a.IMAGE_IEF="image/ief",a.IMAGE_J2C="image/j2c",a.IMAGE_JAII="image/jaii",a.IMAGE_JAIS="image/jais",a.IMAGE_JLS="image/jls",a.IMAGE_JP2="image/jp2",a.IMAGE_JPEG="image/jpeg",a.IMAGE_JPH="image/jph",a.IMAGE_JPHC="image/jphc",a.IMAGE_JPM="image/jpm",a.IMAGE_JPX="image/jpx",a.IMAGE_JXL="image/jxl",a.IMAGE_JXR="image/jxr",a.IMAGE_JXRA="image/jxrA",a.IMAGE_JXRS="image/jxrS",a.IMAGE_JXS="image/jxs",a.IMAGE_JXSC="image/jxsc",a.IMAGE_JXSI="image/jxsi",a.IMAGE_JXSS="image/jxss",a.IMAGE_KTX="image/ktx",a.IMAGE_KTX2="image/ktx2",a.IMAGE_NAPLPS="image/naplps",a.IMAGE_PNG="image/png",a.IMAGE_PRS_AIMG="image/prs.aimg",a.IMAGE_PRS_BTIF="image/prs.btif",a.IMAGE_PRS_PTI="image/prs.pti",a.IMAGE_PWG_RASTER="image/pwg-raster",a.IMAGE_SVG_XML="image/svg+xml",a.IMAGE_T38="image/t38",a.IMAGE_TIFF="image/tiff",a.IMAGE_TIFF_FX="image/tiff-fx",a.IMAGE_VND_ADOBE_PHOTOSHOP="image/vnd.adobe.photoshop",a.IMAGE_VND_AIRZIP_ACCELERATOR_AZV="image/vnd.airzip.accelerator.azv",a.IMAGE_VND_BLOCKFACT_FACTI="image/vnd.blockfact.facti",a.IMAGE_VND_CLIP="image/vnd.clip",a.IMAGE_VND_CNS_INF2="image/vnd.cns.inf2",a.IMAGE_VND_DECE_GRAPHIC="image/vnd.dece.graphic",a.IMAGE_VND_DJVU="image/vnd.djvu",a.IMAGE_VND_DWG="image/vnd.dwg",a.IMAGE_VND_DXF="image/vnd.dxf",a.IMAGE_VND_DVB_SUBTITLE="image/vnd.dvb.subtitle",a.IMAGE_VND_FASTBIDSHEET="image/vnd.fastbidsheet",a.IMAGE_VND_FPX="image/vnd.fpx",a.IMAGE_VND_FST="image/vnd.fst",a.IMAGE_VND_FUJIXEROX_EDMICS_MMR="image/vnd.fujixerox.edmics-mmr",a.IMAGE_VND_FUJIXEROX_EDMICS_RLC="image/vnd.fujixerox.edmics-rlc",a.IMAGE_VND_GLOBALGRAPHICS_PGB="image/vnd.globalgraphics.pgb",a.IMAGE_VND_MICROSOFT_ICON="image/vnd.microsoft.icon",a.IMAGE_VND_MIX="image/vnd.mix",a.IMAGE_VND_MS_MODI="image/vnd.ms-modi",a.IMAGE_VND_MOZILLA_APNG="image/vnd.mozilla.apng",a.IMAGE_VND_NET_FPX="image/vnd.net-fpx",a.IMAGE_VND_PCO_B16="image/vnd.pco.b16",a.IMAGE_VND_RADIANCE="image/vnd.radiance",a.IMAGE_VND_SEALED_PNG="image/vnd.sealed.png",a.IMAGE_VND_SEALEDMEDIA_SOFTSEAL_GIF="image/vnd.sealedmedia.softseal.gif",a.IMAGE_VND_SLD="image/vnd.sld",a.IMAGE_VND_SEALEDMEDIA_SOFTSEAL_JPG="image/vnd.sealedmedia.softseal.jpg",a.IMAGE_VND_SVF="image/vnd.svf",a.IMAGE_VND_TENCENT_TAP="image/vnd.tencent.tap",a.IMAGE_VND_VALVE_SOURCE_TEXTURE="image/vnd.valve.source.texture",a.IMAGE_VND_WAP_WBMP="image/vnd.wap.wbmp",a.IMAGE_VND_XIFF="image/vnd.xiff",a.IMAGE_VND_ZBRUSH_PCX="image/vnd.zbrush.pcx",a.IMAGE_WEBP="image/webp",a.IMAGE_WMF="image/wmf",a.IMAGE_X_EMF="image/x-emf",a.IMAGE_X_WMF="image/x-wmf",a.MESSAGE_BHTTP="message/bhttp",a.MESSAGE_CPIM="message/CPIM",a.MESSAGE_DELIVERY_STATUS="message/delivery-status",a.MESSAGE_DISPOSITION_NOTIFICATION="message/disposition-notification",a.MESSAGE_EXAMPLE="message/example",a.MESSAGE_EXTERNAL_BODY="message/external-body",a.MESSAGE_FEEDBACK_REPORT="message/feedback-report",a.MESSAGE_GLOBAL="message/global",a.MESSAGE_GLOBAL_DELIVERY_STATUS="message/global-delivery-status",a.MESSAGE_GLOBAL_DISPOSITION_NOTIFICATION="message/global-disposition-notification",a.MESSAGE_GLOBAL_HEADERS="message/global-headers",a.MESSAGE_HTTP="message/http",a.MESSAGE_IMDN_XML="message/imdn+xml",a.MESSAGE_MLS="message/mls",a.MESSAGE_NEWS="message/news",a.MESSAGE_OHTTP_CHUNKED_REQ="message/ohttp-chunked-req",a.MESSAGE_OHTTP_CHUNKED_RES="message/ohttp-chunked-res",a.MESSAGE_OHTTP_REQ="message/ohttp-req",a.MESSAGE_OHTTP_RES="message/ohttp-res",a.MESSAGE_PARTIAL="message/partial",a.MESSAGE_RFC822="message/rfc822",a.MESSAGE_S_HTTP="message/s-http",a.MESSAGE_SIP="message/sip",a.MESSAGE_SIPFRAG="message/sipfrag",a.MESSAGE_TRACKING_STATUS="message/tracking-status",a.MESSAGE_VND_SI_SIMP="message/vnd.si.simp",a.MESSAGE_VND_WFA_WSC="message/vnd.wfa.wsc",a.MODEL_3MF="model/3mf",a.MODEL_E57="model/e57",a.MODEL_EXAMPLE="model/example",a.MODEL_GLTF_BINARY="model/gltf-binary",a.MODEL_GLTF_JSON="model/gltf+json",a.MODEL_JT="model/JT",a.MODEL_IGES="model/iges",a.MODEL_MESH="model/mesh",a.MODEL_MTL="model/mtl",a.MODEL_OBJ="model/obj",a.MODEL_PRC="model/prc",a.MODEL_STEP="model/step",a.MODEL_STEP_XML="model/step+xml",a.MODEL_STEP_ZIP="model/step+zip",a.MODEL_STEP_XML_ZIP="model/step-xml+zip",a.MODEL_STL="model/stl",a.MODEL_U3D="model/u3d",a.MODEL_VND_BARY="model/vnd.bary",a.MODEL_VND_CLD="model/vnd.cld",a.MODEL_VND_COLLADA_XML="model/vnd.collada+xml",a.MODEL_VND_DWF="model/vnd.dwf",a.MODEL_VND_FLATLAND_3DML="model/vnd.flatland.3dml",a.MODEL_VND_GDL="model/vnd.gdl",a.MODEL_VND_GODOT_SCENE_BINARY="model/vnd.godot.scene.binary",a.MODEL_VND_GODOT_SCENE_TEXT="model/vnd.godot.scene.text",a.MODEL_VND_GS_GDL="model/vnd.gs-gdl",a.MODEL_VND_GTW="model/vnd.gtw",a.MODEL_VND_MOML_XML="model/vnd.moml+xml",a.MODEL_VND_MTS="model/vnd.mts",a.MODEL_VND_OPENGEX="model/vnd.opengex",a.MODEL_VND_PARASOLID_TRANSMIT_BINARY="model/vnd.parasolid.transmit.binary",a.MODEL_VND_PARASOLID_TRANSMIT_TEXT="model/vnd.parasolid.transmit.text",a.MODEL_VND_PYGRASSREAL_PY3S="model/vnd.pygrassreal.py3s",a.MODEL_VND_PYTHA_PYOX="model/vnd.pytha.pyox",a.MODEL_VND_ROSETTE_ANNOTATED_DATA_MODEL="model/vnd.rosette.annotated-data-model",a.MODEL_VND_SAP_VDS="model/vnd.sap.vds",a.MODEL_VND_SDF3D_S3D="model/vnd.sdf3d.s3d",a.MODEL_VND_USDA="model/vnd.usda",a.MODEL_VND_USDZ_ZIP="model/vnd.usdz+zip",a.MODEL_VND_VALVE_SOURCE_COMPILED_MAP="model/vnd.valve.source.compiled-map",a.MODEL_VND_VTU="model/vnd.vtu",a.MODEL_VRML="model/vrml",a.MODEL_X3D_VRML="model/x3d-vrml",a.MODEL_X3D_FASTINFOSET="model/x3d+fastinfoset",a.MODEL_X3D_XML="model/x3d+xml",a.MULTIPART_ALTERNATIVE="multipart/alternative",a.MULTIPART_APPLEDOUBLE="multipart/appledouble",a.MULTIPART_BYTERANGES="multipart/byteranges",a.MULTIPART_DIGEST="multipart/digest",a.MULTIPART_ENCRYPTED="multipart/encrypted",a.MULTIPART_EXAMPLE="multipart/example",a.MULTIPART_FORM_DATA="multipart/form-data",a.MULTIPART_HEADER_SET="multipart/header-set",a.MULTIPART_MIXED="multipart/mixed",a.MULTIPART_MULTILINGUAL="multipart/multilingual",a.MULTIPART_PARALLEL="multipart/parallel",a.MULTIPART_RELATED="multipart/related",a.MULTIPART_REPORT="multipart/report",a.MULTIPART_SIGNED="multipart/signed",a.MULTIPART_VND_BINT_MED_PLUS="multipart/vnd.bint.med-plus",a.MULTIPART_VOICE_MESSAGE="multipart/voice-message",a.MULTIPART_X_MIXED_REPLACE="multipart/x-mixed-replace",a.TEXT_1D_INTERLEAVED_PARITYFEC="text/1d-interleaved-parityfec",a.TEXT_CACHE_MANIFEST="text/cache-manifest",a.TEXT_CALENDAR="text/calendar",a.TEXT_CQL="text/cql",a.TEXT_CQL_EXPRESSION="text/cql-expression",a.TEXT_CQL_IDENTIFIER="text/cql-identifier",a.TEXT_CSS="text/css",a.TEXT_CSV="text/csv",a.TEXT_CSV_SCHEMA="text/csv-schema",a.TEXT_DIRECTORY="text/directory",a.TEXT_DNS="text/dns",a.TEXT_ECMASCRIPT="text/ecmascript",a.TEXT_ENCAPRTP="text/encaprtp",a.TEXT_ENRICHED="text/enriched",a.TEXT_EXAMPLE="text/example",a.TEXT_FHIRPATH="text/fhirpath",a.TEXT_FLEXFEC="text/flexfec",a.TEXT_FWDRED="text/fwdred",a.TEXT_GFF3="text/gff3",a.TEXT_GRAMMAR_REF_LIST="text/grammar-ref-list",a.TEXT_HL7V2="text/hl7v2",a.TEXT_HTML="text/html",a.TEXT_JAVASCRIPT="text/javascript",a.TEXT_JCR_CND="text/jcr-cnd",a.TEXT_MARKDOWN="text/markdown",a.TEXT_MIZAR="text/mizar",a.TEXT_N3="text/n3",a.TEXT_ORG="text/org",a.TEXT_PARAMETERS="text/parameters",a.TEXT_PARITYFEC="text/parityfec",a.TEXT_PLAIN="text/plain",a.TEXT_PROVENANCE_NOTATION="text/provenance-notation",a.TEXT_PRS_FALLENSTEIN_RST="text/prs.fallenstein.rst",a.TEXT_PRS_LINES_TAG="text/prs.lines.tag",a.TEXT_PRS_MTSV="text/prs.mtsv",a.TEXT_PRS_PROP_LOGIC="text/prs.prop.logic",a.TEXT_PRS_ROWIH="text/prs.rowih",a.TEXT_PRS_TEXI="text/prs.texi",a.TEXT_QML="text/qml",a.TEXT_RAPTORFEC="text/raptorfec",a.TEXT_RED="text/RED",a.TEXT_RFC822_HEADERS="text/rfc822-headers",a.TEXT_RICHTEXT="text/richtext",a.TEXT_RTF="text/rtf",a.TEXT_RTP_ENC_AESCM128="text/rtp-enc-aescm128",a.TEXT_RTPLOOPBACK="text/rtploopback",a.TEXT_RTX="text/rtx",a.TEXT_SGML="text/SGML",a.TEXT_SHACLC="text/shaclc",a.TEXT_SHEX="text/shex",a.TEXT_SPDX="text/spdx",a.TEXT_STRINGS="text/strings",a.TEXT_T140="text/t140",a.TEXT_TAB_SEPARATED_VALUES="text/tab-separated-values",a.TEXT_TROFF="text/troff",a.TEXT_TURTLE="text/turtle",a.TEXT_ULPFEC="text/ulpfec",a.TEXT_URI_LIST="text/uri-list",a.TEXT_VCARD="text/vcard",a.TEXT_VND_A="text/vnd.a",a.TEXT_VND_ABC="text/vnd.abc",a.TEXT_VND_ASCII_ART="text/vnd.ascii-art",a.TEXT_VND_BOVNAR="text/vnd.bovnar",a.TEXT_VND_CURL="text/vnd.curl",a.TEXT_VND_DEBIAN_COPYRIGHT="text/vnd.debian.copyright",a.TEXT_VND_DMCLIENTSCRIPT="text/vnd.DMClientScript",a.TEXT_VND_DVB_SUBTITLE="text/vnd.dvb.subtitle",a.TEXT_VND_ESMERTEC_THEME_DESCRIPTOR="text/vnd.esmertec.theme-descriptor",a.TEXT_VND_EXCHANGEABLE="text/vnd.exchangeable",a.TEXT_VND_FAMILYSEARCH_GEDCOM="text/vnd.familysearch.gedcom",a.TEXT_VND_FICLAB_FLT="text/vnd.ficlab.flt",a.TEXT_VND_FLY="text/vnd.fly",a.TEXT_VND_FMI_FLEXSTOR="text/vnd.fmi.flexstor",a.TEXT_VND_GEML="text/vnd.geml",a.TEXT_VND_GIST_MX="text/vnd.gist.mx",a.TEXT_VND_GML="text/vnd.gml",a.TEXT_VND_GODOT_GDSCRIPT="text/vnd.godot.gdscript",a.TEXT_VND_GODOT_GDSHADER="text/vnd.godot.gdshader",a.TEXT_VND_GRAPHVIZ="text/vnd.graphviz",a.TEXT_VND_HANS="text/vnd.hans",a.TEXT_VND_HEKAYA="text/vnd.hekaya",a.TEXT_VND_HGL="text/vnd.hgl",a.TEXT_VND_IN3D_3DML="text/vnd.in3d.3dml",a.TEXT_VND_IN3D_SPOT="text/vnd.in3d.spot",a.TEXT_VND_IPTC_NEWSML="text/vnd.IPTC.NewsML",a.TEXT_VND_IPTC_NITF="text/vnd.IPTC.NITF",a.TEXT_VND_LATEX_Z="text/vnd.latex-z",a.TEXT_VND_LONGFORM="text/vnd.longform",a.TEXT_VND_MOTOROLA_REFLEX="text/vnd.motorola.reflex",a.TEXT_VND_MS_MEDIAPACKAGE="text/vnd.ms-mediapackage",a.TEXT_VND_NET2PHONE_COMMCENTER_COMMAND="text/vnd.net2phone.commcenter.command",a.TEXT_VND_RADISYS_MSML_BASIC_LAYOUT="text/vnd.radisys.msml-basic-layout",a.TEXT_VND_SENX_WARPSCRIPT="text/vnd.senx.warpscript",a.TEXT_VND_SI_URICATALOGUE="text/vnd.si.uricatalogue",a.TEXT_VND_SUN_J2ME_APP_DESCRIPTOR="text/vnd.sun.j2me.app-descriptor",a.TEXT_VND_SOSI="text/vnd.sosi",a.TEXT_VND_TPS="text/vnd.tps",a.TEXT_VND_TYPST="text/vnd.typst",a.TEXT_VND_TROLLTECH_LINGUIST="text/vnd.trolltech.linguist",a.TEXT_VND_VCF="text/vnd.vcf",a.TEXT_VND_VRI="text/vnd.vri",a.TEXT_VND_WAP_SI="text/vnd.wap.si",a.TEXT_VND_WAP_SL="text/vnd.wap.sl",a.TEXT_VND_WAP_WML="text/vnd.wap.wml",a.TEXT_VND_WAP_WMLSCRIPT="text/vnd.wap.wmlscript",a.TEXT_VND_ZOO_KCL="text/vnd.zoo.kcl",a.TEXT_VTT="text/vtt",a.TEXT_WGSL="text/wgsl",a.TEXT_XML="text/xml",a.TEXT_XML_EXTERNAL_PARSED_ENTITY="text/xml-external-parsed-entity",a.VIDEO_1D_INTERLEAVED_PARITYFEC="video/1d-interleaved-parityfec",a.VIDEO_3GPP="video/3gpp",a.VIDEO_3GPP2="video/3gpp2",a.VIDEO_3GPP_TT="video/3gpp-tt",a.VIDEO_AV1="video/AV1",a.VIDEO_BMPEG="video/BMPEG",a.VIDEO_BT656="video/BT656",a.VIDEO_CELB="video/CelB",a.VIDEO_DV="video/DV",a.VIDEO_ENCAPRTP="video/encaprtp",a.VIDEO_EVC="video/evc",a.VIDEO_EXAMPLE="video/example",a.VIDEO_FFV1="video/FFV1",a.VIDEO_FLEXFEC="video/flexfec",a.VIDEO_H261="video/H261",a.VIDEO_H263="video/H263",a.VIDEO_H263_1998="video/H263-1998",a.VIDEO_H263_2000="video/H263-2000",a.VIDEO_H264="video/H264",a.VIDEO_H264_RCDO="video/H264-RCDO",a.VIDEO_H264_SVC="video/H264-SVC",a.VIDEO_H265="video/H265",a.VIDEO_H266="video/H266",a.VIDEO_ISO_SEGMENT="video/iso.segment",a.VIDEO_JPEG="video/JPEG",a.VIDEO_JPEG2000="video/jpeg2000",a.VIDEO_JPEG2000_SCL="video/jpeg2000-scl",a.VIDEO_JXSV="video/jxsv",a.VIDEO_LOTTIE_JSON="video/lottie+json",a.VIDEO_MATROSKA="video/matroska",a.VIDEO_MATROSKA_3D="video/matroska-3d",a.VIDEO_MJ2="video/mj2",a.VIDEO_MP1S="video/MP1S",a.VIDEO_MP2P="video/MP2P",a.VIDEO_MP2T="video/MP2T",a.VIDEO_MP4="video/mp4",a.VIDEO_MP4V_ES="video/MP4V-ES",a.VIDEO_MPV="video/MPV",a.VIDEO_MPEG="video/mpeg",a.VIDEO_MPEG4_GENERIC="video/mpeg4-generic",a.VIDEO_NV="video/nv",a.VIDEO_OGG="video/ogg",a.VIDEO_PARITYFEC="video/parityfec",a.VIDEO_POINTER="video/pointer",a.VIDEO_PRS_AVID="video/prs.avid",a.VIDEO_QUICKTIME="video/quicktime",a.VIDEO_RAPTORFEC="video/raptorfec",a.VIDEO_RAW="video/raw",a.VIDEO_RTP_ENC_AESCM128="video/rtp-enc-aescm128",a.VIDEO_RTPLOOPBACK="video/rtploopback",a.VIDEO_RTX="video/rtx",a.VIDEO_SCIP="video/scip",a.VIDEO_SMPTE291="video/smpte291",a.VIDEO_SMPTE292M="video/SMPTE292M",a.VIDEO_ULPFEC="video/ulpfec",a.VIDEO_VC1="video/vc1",a.VIDEO_VC2="video/vc2",a.VIDEO_VND_BLOCKFACT_FACTV="video/vnd.blockfact.factv",a.VIDEO_VND_CCTV="video/vnd.CCTV",a.VIDEO_VND_DECE_HD="video/vnd.dece.hd",a.VIDEO_VND_DECE_MOBILE="video/vnd.dece.mobile",a.VIDEO_VND_DECE_MP4="video/vnd.dece.mp4",a.VIDEO_VND_DECE_PD="video/vnd.dece.pd",a.VIDEO_VND_DECE_SD="video/vnd.dece.sd",a.VIDEO_VND_DECE_VIDEO="video/vnd.dece.video",a.VIDEO_VND_DIRECTV_MPEG="video/vnd.directv.mpeg",a.VIDEO_VND_DIRECTV_MPEG_TTS="video/vnd.directv.mpeg-tts",a.VIDEO_VND_DLNA_MPEG_TTS="video/vnd.dlna.mpeg-tts",a.VIDEO_VND_DVB_FILE="video/vnd.dvb.file",a.VIDEO_VND_FVT="video/vnd.fvt",a.VIDEO_VND_HNS_VIDEO="video/vnd.hns.video",a.VIDEO_VND_IPTVFORUM_1DPARITYFEC_1010="video/vnd.iptvforum.1dparityfec-1010",a.VIDEO_VND_IPTVFORUM_1DPARITYFEC_2005="video/vnd.iptvforum.1dparityfec-2005",a.VIDEO_VND_IPTVFORUM_2DPARITYFEC_1010="video/vnd.iptvforum.2dparityfec-1010",a.VIDEO_VND_IPTVFORUM_2DPARITYFEC_2005="video/vnd.iptvforum.2dparityfec-2005",a.VIDEO_VND_IPTVFORUM_TTSAVC="video/vnd.iptvforum.ttsavc",a.VIDEO_VND_IPTVFORUM_TTSMPEG2="video/vnd.iptvforum.ttsmpeg2",a.VIDEO_VND_MOTOROLA_VIDEO="video/vnd.motorola.video",a.VIDEO_VND_MOTOROLA_VIDEOP="video/vnd.motorola.videop",a.VIDEO_VND_MPEGURL="video/vnd.mpegurl",a.VIDEO_VND_MS_PLAYREADY_MEDIA_PYV="video/vnd.ms-playready.media.pyv",a.VIDEO_VND_NOKIA_INTERLEAVED_MULTIMEDIA="video/vnd.nokia.interleaved-multimedia",a.VIDEO_VND_NOKIA_MP4VR="video/vnd.nokia.mp4vr",a.VIDEO_VND_NOKIA_VIDEOVOIP="video/vnd.nokia.videovoip",a.VIDEO_VND_OBJECTVIDEO="video/vnd.objectvideo",a.VIDEO_VND_PLANAR="video/vnd.planar",a.VIDEO_VND_RADGAMETTOOLS_BINK="video/vnd.radgamettools.bink",a.VIDEO_VND_RADGAMETTOOLS_SMACKER="video/vnd.radgamettools.smacker",a.VIDEO_VND_SEALED_MPEG1="video/vnd.sealed.mpeg1",a.VIDEO_VND_SEALED_MPEG4="video/vnd.sealed.mpeg4",a.VIDEO_VND_SEALED_SWF="video/vnd.sealed.swf",a.VIDEO_VND_SEALEDMEDIA_SOFTSEAL_MOV="video/vnd.sealedmedia.softseal.mov",a.VIDEO_VND_UVVU_MP4="video/vnd.uvvu.mp4",a.VIDEO_VND_YOUTUBE_YT="video/vnd.youtube.yt",a.VIDEO_VND_VIVO="video/vnd.vivo",a.VIDEO_VP8="video/VP8",a.VIDEO_VP9="video/VP9",a))(Fa||{});const Sn="2026-10-30";/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/value_objects/data/code/mimeCode
 * │ Filename        │ mimeCode.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ MimeCode: the UN/CEFACT D25A MIME_ Code. Type (UN02000117),
 * │                 │ agency 379 (IANA), with values from the IANA Media Types
 * │                 │ registry.
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/code/mimeCode
 * @file mimeCode.ts
 * @author Gurpinder Gill
 * @license MIT
 */class fn{constructor(n){e(this,"value");e(this,"listAgencyId","379");e(this,"listVersionId",Sn);e(this,"listName","Media Types");e(this,"listUri",new W("https://www.iana.org/assignments/media-types/media-types.xhtml"));this.value=n}}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/echo
 * │ Filename        │ echo.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `echo` command: prints text, or writes/appends it to a
 * │                 │ file with > / >> as a UTF-8 text/plain BinaryObject.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/echo
 * @file echo.ts
 * @author Gurpinder Gill
 * @license MIT
 */const hn={name:"echo",description:"print text, or write/append it to a file with > / >>",run:({fs:a,args:n})=>{const t=n.findIndex(_=>_===">"||_===">>");if(t===-1)return[n.join(" ")];const r=n[t]===">>",p=n[t+1];if(!p)throw new Error("lira: syntax error near unexpected token `newline'");const o=new TextEncoder().encode(n.slice(0,t).join(" ")+`
`);return a.writeFile(p,un(o,{mimeCode:new fn(Fa.TEXT_PLAIN),characterSetCode:"UTF-8"}),{append:r}),[]}};/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/rm
 * │ Filename        │ rm.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `rm` command: removes files, or directories with -r.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/rm
 * @file rm.ts
 * @author Gurpinder Gill
 * @license MIT
 */const Vn={name:"rm",description:"remove files or directories (-r for directories)",run:({fs:a,args:n})=>{const t=n.some(p=>p.startsWith("-")&&p.includes("r")),r=n.filter(p=>!p.startsWith("-"));if(r.length===0)throw new Error("rm: missing operand");return Ia(r,p=>a.remove(p,{recursive:t}))}};/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/mv
 * │ Filename        │ mv.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `mv` command: moves or renames a file or directory.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/mv
 * @file mv.ts
 * @author Gurpinder Gill
 * @license MIT
 */const gn={name:"mv",description:"move or rename a file or directory",run:({fs:a,args:n})=>{if(n.length!==2)throw new Error("mv: missing destination file operand");return a.move(n[0],n[1]),[]}};/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/cp
 * │ Filename        │ cp.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `cp` command: copies a file, or a directory with -r.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/cp
 * @file cp.ts
 * @author Gurpinder Gill
 * @license MIT
 */const Rn={name:"cp",description:"copy a file or directory (-r for directories)",run:({fs:a,args:n})=>{const t=n.some(p=>p.startsWith("-")&&p.includes("r")),r=n.filter(p=>!p.startsWith("-"));if(r.length!==2)throw new Error("cp: missing destination file operand");return a.copy(r[0],r[1],{recursive:t}),[]}};/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/df
 * │ Filename        │ df.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `df` command: reports the virtual filesystem's size,
 * │                 │ used and free space in `df -h` form.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/df
 * @file df.ts
 * @author Gurpinder Gill
 * @license MIT
 */const xn={name:"df",description:"show virtual filesystem capacity usage",run:({fs:a})=>{const n=a.usedBytes(),t=a.capacityBytes,r=t===0?0:Math.round(n/t*100);return["Filesystem      Size    Used    Avail   Use%",`blobfs          ${y(t).padEnd(8)}${y(n).padEnd(8)}${y(t-n).padEnd(8)}${r}%`]}};/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/ps
 * │ Filename        │ ps.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `ps` command: lists the Portal's Background Services
 * │                 │ with live uptime and heap metrics from their workers.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/ps
 * @file ps.ts
 * @author Gurpinder Gill
 * @license MIT
 */const Cn={"not-ported":"NOT PORTED",idle:"IDLE",running:"RUNNING",done:"DONE",error:"ERROR"};function mn(a,n){if(a==="vocabulary")return n.vocabularyClient;if(a==="linguistics")return n.linguisticsClient}const bn={name:"ps",description:"list running Services with live memory metrics",run:async({services:a})=>{const n=a.statusBoard.all(),t=new Map;await Promise.all(n.map(async o=>{const _=mn(o.id,a);if(_)try{t.set(o.id,await _.getMetrics())}catch{}}));const r="PID   SERVICE               STATE        UPTIME     HEAP          %HEAP",p=n.map((o,_)=>wn(_+1,o,t.get(o.id)));return[r,...p]}};function wn(a,n,t){const r=t?Fn(t.uptimeMs):"-",p=(t==null?void 0:t.heapUsedBytes)!==void 0&&t.heapLimitBytes!==void 0?`${y(t.heapUsedBytes)}/${y(t.heapLimitBytes)}`:"-",o=(t==null?void 0:t.heapUsedBytes)!==void 0&&t.heapLimitBytes?`${Math.round(t.heapUsedBytes/t.heapLimitBytes*100)}%`:"-";return`${String(a).padEnd(6)}${n.label.padEnd(22)}${Cn[n.state].padEnd(13)}${r.padEnd(11)}${p.padEnd(14)}${o}`}function Fn(a){const n=Math.floor(a/1e3),t=Math.floor(n/3600),r=Math.floor(n%3600/60),p=n%60;return[t,r,p].map(o=>String(o).padStart(2,"0")).join(":")}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/gpu
 * │ Filename        │ gpu.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-26
 * │ Modified Date   │ 2026-10-26
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `gpu` command: reports the browser's real WebGPU
 * │                 │ adapter and device information.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/gpu
 * @file gpu.ts
 * @author Gurpinder Gill
 * @license MIT
 */const Xn=["maxTextureDimension1D","maxTextureDimension2D","maxTextureDimension3D","maxTextureArrayLayers","maxBindGroups","maxBindGroupsPlusVertexBuffers","maxBindingsPerBindGroup","maxDynamicUniformBuffersPerPipelineLayout","maxDynamicStorageBuffersPerPipelineLayout","maxSampledTexturesPerShaderStage","maxSamplersPerShaderStage","maxStorageBuffersPerShaderStage","maxStorageTexturesPerShaderStage","maxUniformBuffersPerShaderStage","maxUniformBufferBindingSize","maxStorageBufferBindingSize","minUniformBufferOffsetAlignment","minStorageBufferOffsetAlignment","maxVertexBuffers","maxBufferSize","maxVertexAttributes","maxVertexBufferArrayStride","maxInterStageShaderVariables","maxColorAttachments","maxColorAttachmentBytesPerSample","maxComputeWorkgroupStorageSize","maxComputeInvocationsPerWorkgroup","maxComputeWorkgroupSizeX","maxComputeWorkgroupSizeY","maxComputeWorkgroupSizeZ","maxComputeWorkgroupsPerDimension"];function yn(a){return a.gpu}async function Un(a){if(a.info)return a.info;if(typeof a.requestAdapterInfo=="function")return a.requestAdapterInfo()}function B(a){return a&&a.length>0?a:"-"}const Gn={name:"gpu",description:"report real GPU adapter information via WebGPU",run:async()=>{const a=yn(navigator);if(!a)throw new Error("gpu: WebGPU is not supported in this browser (navigator.gpu is undefined)");const n=await a.requestAdapter();if(!n)throw new Error("gpu: WebGPU is supported, but no GPU adapter is available (requestAdapter() returned null)");const t=await Un(n),r=Array.from(n.features).sort();return["Adapter",`  vendor               ${B(t==null?void 0:t.vendor)}`,`  architecture         ${B(t==null?void 0:t.architecture)}`,`  device               ${B(t==null?void 0:t.device)}`,`  description          ${B(t==null?void 0:t.description)}`,`  fallback adapter     ${n.isFallbackAdapter}`,`  preferred canvas fmt ${a.getPreferredCanvasFormat()}`,"",`Features (${r.length})`,...r.length>0?r.map(o=>`  ${o}`):["  (none)"],"","Limits",...Xn.map(o=>`  ${o.padEnd(42)}${n.limits[o].toLocaleString()}`)]}};/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_commands/index
 * │ Filename        │ index.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-26
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console command registry: maps each typed command name to its
 * │                 │ ConsoleCommand implementation.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/index
 * @file index.ts
 * @author Gurpinder Gill
 * @license MIT
 */const Bn=[ln,On,Tn,Ln,En,dn,Dn,vn,hn,Vn,gn,Rn,xn,bn,Gn],La=Object.fromEntries(Bn.map(a=>[a.name,a]));/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/console_view
 * │ Filename        │ console_view.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-24
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ ConsoleView: the terminal-styled command console in the
 * │                 │ Vocabulary pane, dispatching typed lines to Console commands.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_view
 * @file console_view.ts
 * @author Gurpinder Gill
 * @license MIT
 */class kn{constructor(n,t,r){e(this,"container");e(this,"collapsed",!1);e(this,"fs",new In);e(this,"services");e(this,"lines",Hn.map(n=>({kind:"banner",text:n})));e(this,"commandHistory",[]);e(this,"historyIndex");e(this,"draftBeforeRecall","");this.services={statusBoard:n,vocabularyClient:t,linguisticsClient:r}}mount(n){this.container=n,this.ensureStyles(),n.addEventListener("click",t=>this.handleClick(t)),n.addEventListener("keydown",t=>this.handleKeydown(t)),this.paint()}paint(){this.container&&(this.container.innerHTML=this.renderPanel(),this.focusInput(),this.scrollToBottom())}handleClick(n){const t=n.target;if(t.closest("[data-action='toggle-console']")){this.collapsed=!this.collapsed,this.paint();return}t.closest(".console-body")&&!t.closest("a,button")&&this.focusInput()}handleKeydown(n){const t=n.target;if(!t.classList.contains("console-input"))return;const r=t;if(n.key==="Enter"){n.preventDefault();const p=r.value;r.value="",this.historyIndex=void 0,this.runCommand(p)}else n.key==="ArrowUp"?(n.preventDefault(),this.recall(r,-1)):n.key==="ArrowDown"&&(n.preventDefault(),this.recall(r,1))}recall(n,t){if(this.commandHistory.length!==0){if(this.historyIndex===void 0){if(t===1)return;this.draftBeforeRecall=n.value,this.historyIndex=this.commandHistory.length-1}else{const r=this.historyIndex+t;if(r<0)return;if(r>=this.commandHistory.length){this.historyIndex=void 0,n.value=this.draftBeforeRecall;return}this.historyIndex=r}n.value=this.commandHistory[this.historyIndex]}}runCommand(n){const t=n.trim();if(this.lines.push({kind:"command",text:n,prompt:Ea(this.fs.pwd())}),t.length===0){this.paint();return}this.commandHistory.push(t);const[r,...p]=jn(t),o=La[r.toLowerCase()];if(!o){this.lines.push({kind:"error",text:`lira: command not found: ${r} (not implemented yet)`}),this.paint();return}Promise.resolve(o.run({fs:this.fs,args:p,commands:La,clearScrollback:()=>this.lines=[],services:this.services})).then(_=>{for(const c of _)this.lines.push({kind:"output",text:c})}).catch(_=>{this.lines.push({kind:"error",text:_ instanceof Error?_.message:String(_)})}).finally(()=>this.paint())}focusInput(){var n,t;(t=(n=this.container)==null?void 0:n.querySelector(".console-input"))==null||t.focus()}scrollToBottom(){var t;const n=(t=this.container)==null?void 0:t.querySelector(".console-lines");n&&(n.scrollTop=n.scrollHeight)}renderPanel(){return`
      <div class="console-panel ${this.collapsed?"collapsed":""}">
        <button type="button" class="console-header" data-action="toggle-console" aria-expanded="${!this.collapsed}">
          <span class="console-label">Console</span>
          ${this.collapsed?`<span class="console-summary">${this.commandHistory.length} command${this.commandHistory.length===1?"":"s"}</span>`:""}
          <span class="console-chevron">${Wn}</span>
        </button>
        <div class="console-body" role="log" aria-live="polite">
          <div class="console-lines">
            ${this.lines.map(n=>this.renderLine(n)).join("")}
          </div>
          <div class="console-prompt-row">
            <span class="console-prompt" aria-hidden="true">${k(Ea(this.fs.pwd()))}</span>
            <input type="text" class="console-input" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Console command input">
          </div>
        </div>
      </div>
    `}renderLine(n){return n.kind==="command"?`<div class="console-line console-line-command"><span class="console-prompt" aria-hidden="true">${k(n.prompt)}</span>${k(n.text)}</div>`:`<div class="console-line console-line-${n.kind}">${k(n.text)}</div>`}ensureStyles(){if(document.getElementById(da))return;const n=document.createElement("style");n.id=da,n.textContent=$n,document.head.appendChild(n)}}const Hn=["LIRA Operating System","Type 'help' to get started."];function Ea(a){return`lira:${a}$ `}function jn(a){const n=[],t=/"([^"]*)"|(\S+)/g;let r;for(;(r=t.exec(a))!==null;)n.push(r[1]!==void 0?r[1]:r[2]);return n}function k(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const Wn='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',da="lira-console-styles",$n=`
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
`;/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/gpu_canvas/mat4
 * │ Filename        │ mat4.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-27
 * │ Modified Date   │ 2026-10-31
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Minimal column-major 4x4 matrix and vector math for the Canvas
 * │                 │ scene's camera and model transforms.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/mat4
 * @file mat4.ts
 * @author Gurpinder Gill
 * @license MIT
 */function Pa(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}function j(a,n){const t=new Float32Array(16);for(let r=0;r<4;r++)for(let p=0;p<4;p++){let o=0;for(let _=0;_<4;_++)o+=a[_*4+p]*n[r*4+_];t[r*4+p]=o}return t}function ea(...a){return a.reduce((n,t)=>j(n,t),Pa())}function Da([a,n,t]){const r=Pa();return r[12]=a,r[13]=n,r[14]=t,r}function va(a){const n=Pa();return n[0]=a,n[5]=a,n[10]=a,n}function U([a,n,t],r){const p=Math.cos(r),o=Math.sin(r),_=1-p;return new Float32Array([_*a*a+p,_*a*n+o*t,_*a*t-o*n,0,_*a*n-o*t,_*n*n+p,_*n*t+o*a,0,_*a*t+o*n,_*n*t-o*a,_*t*t+p,0,0,0,0,1])}function Jn(a,n,t,r){const p=1/Math.tan(a/2),o=1/(t-r);return new Float32Array([p/n,0,0,0,0,p,0,0,0,0,r*o,-1,0,0,r*t*o,0])}function Kn(a,n,t){const r=ia(Yn(a,n)),p=ia(ua(t,r)),o=ua(r,p);return new Float32Array([p[0],o[0],r[0],0,p[1],o[1],r[1],0,p[2],o[2],r[2],0,-Z(p,a),-Z(o,a),-Z(r,a),1])}function Yn(a,n){return[a[0]-n[0],a[1]-n[1],a[2]-n[2]]}function ua(a,n){return[a[1]*n[2]-a[2]*n[1],a[2]*n[0]-a[0]*n[2],a[0]*n[1]-a[1]*n[0]]}function Z(a,n){return a[0]*n[0]+a[1]*n[1]+a[2]*n[2]}function ia(a){const n=Math.hypot(a[0],a[1],a[2]);return n===0?[0,0,0]:[a[0]/n,a[1]/n,a[2]/n]}function zn(a,n,t){const r=a*Math.PI/180,p=n*Math.PI/180,o=t*Math.PI/180;return ea(U([0,0,1],r),U([1,0,0],p),U([0,1,0],o))}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/gpu_canvas/geometry
 * │ Filename        │ geometry.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-27
 * │ Modified Date   │ 2026-10-29
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Mesh builders for the Canvas scene: interleaved position/normal
 * │                 │ cube and sphere meshes, plus the textured camera cube.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/geometry
 * @file geometry.ts
 * @author Gurpinder Gill
 * @license MIT
 */const $=6,w=[{normal:[1,0,0],right:[0,0,-1],up:[0,1,0]},{normal:[-1,0,0],right:[0,0,1],up:[0,1,0]},{normal:[0,1,0],right:[1,0,0],up:[0,0,-1]},{normal:[0,-1,0],right:[1,0,0],up:[0,0,1]},{normal:[0,0,1],right:[1,0,0],up:[0,1,0]},{normal:[0,0,-1],right:[-1,0,0],up:[0,1,0]}];function qn(a){const n=a/2,t=new Float32Array(w.length*4*$),r=new Uint16Array(w.length*6);return w.forEach((p,o)=>{const[_,c,i]=p.normal;[T(T(p.normal,p.right,-1),p.up,-1),T(T(p.normal,p.right,1),p.up,-1),T(T(p.normal,p.right,1),p.up,1),T(T(p.normal,p.right,-1),p.up,1)].forEach((L,O)=>{const D=(o*4+O)*$;t[D]=L[0]*n,t[D+1]=L[1]*n,t[D+2]=L[2]*n,t[D+3]=_,t[D+4]=c,t[D+5]=i});const P=o*4,l=o*6;r[l]=P,r[l+1]=P+1,r[l+2]=P+2,r[l+3]=P,r[l+4]=P+2,r[l+5]=P+3}),{vertices:t,indices:r}}function T(a,n,t){return[a[0]+n[0]*t,a[1]+n[1]*t,a[2]+n[2]*t]}const Sa=5,fa=[[0,1],[1,1],[1,0],[0,0]];function Mn(a){const n=a/2,t=new Float32Array(w.length*4*Sa),r=new Uint16Array(w.length*6);return w.forEach((p,o)=>{[T(T(p.normal,p.right,-1),p.up,-1),T(T(p.normal,p.right,1),p.up,-1),T(T(p.normal,p.right,1),p.up,1),T(T(p.normal,p.right,-1),p.up,1)].forEach((A,P)=>{const l=(o*4+P)*Sa;t[l]=A[0]*n,t[l+1]=A[1]*n,t[l+2]=A[2]*n,t[l+3]=fa[P][0],t[l+4]=fa[P][1]});const c=o*4,i=o*6;r[i]=c,r[i+1]=c+1,r[i+2]=c+2,r[i+3]=c,r[i+4]=c+2,r[i+5]=c+3}),{vertices:t,indices:r}}function Zn(a,n,t){const r=n+1,p=t+1,o=new Float32Array(r*p*$);for(let c=0;c<r;c++){const i=c/n*Math.PI,A=Math.sin(i),P=Math.cos(i);for(let l=0;l<p;l++){const L=l/t*Math.PI*2,O=A*Math.cos(L),D=P,N=A*Math.sin(L),v=(c*p+l)*$;o[v]=O*a,o[v+1]=D*a,o[v+2]=N*a,o[v+3]=O,o[v+4]=D,o[v+5]=N}}const _=[];for(let c=0;c<n;c++)for(let i=0;i<t;i++){const A=c*p+i,P=(c+1)*p+i,l=(c+1)*p+i+1,L=c*p+i+1;c!==0&&_.push(A,L,P),c!==n-1&&_.push(P,L,l)}return{vertices:o,indices:new Uint16Array(_)}}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/gpu_canvas/scene
 * │ Filename        │ scene.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-27
 * │ Modified Date   │ 2026-10-29
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Canvas scene model: randomly placed cube, sphere and camera
 * │                 │ entities, and the bouncing/spinning physics that moves them.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/scene
 * @file scene.ts
 * @author Gurpinder Gill
 * @license MIT
 */function Qn(a,n,t,r=Math.random){const p=[];for(let o=0;o<a;o++)p.push(Aa("cube",t,r));for(let o=0;o<n;o++)p.push(Aa("sphere",t,r));return p}function Aa(a,n,t){const r=.6+t()*1.2,p=ia([t()*2-1,t()*2-1,t()*2-1]);return{kind:a,position:[Q(n.min[0],n.max[0],t),Q(n.min[1],n.max[1],t),Q(n.min[2],n.max[2],t)],velocity:[aa(r,t),aa(r,t),aa(r,t)],rotationAxis:p[0]===0&&p[1]===0&&p[2]===0?[0,1,0]:p,rotationSpeed:.4+t()*1.6,rotationAngle:t()*Math.PI*2,scale:.45+t()*.35,color:[...nt(t(),.65,.55),1]}}function Q(a,n,t){return a+(n-a)*t()}function aa(a,n){return(n()<.5?-1:1)*a}function at(a,n,t){a.rotationAngle+=a.rotationSpeed*n;for(let r=0;r<3;r++){a.position[r]+=a.velocity[r]*n;const p=t.min[r]+a.scale,o=t.max[r]-a.scale;a.position[r]<p?(a.position[r]=p,a.velocity[r]=Math.abs(a.velocity[r])):a.position[r]>o&&(a.position[r]=o,a.velocity[r]=-Math.abs(a.velocity[r]))}}function nt(a,n,t){const r=t+n-t*n,p=2*t-r;return[na(p,r,a+1/3),na(p,r,a),na(p,r,a-1/3)]}function na(a,n,t){let r=t;return r<0&&(r+=1),r>1&&(r-=1),r<1/6?a+(n-a)*6*r:r<1/2?n:r<2/3?a+(n-a)*(2/3-r)*6:a}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/gpu_canvas/shader
 * │ Filename        │ shader.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-27
 * │ Modified Date   │ 2026-10-29
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ WGSL shaders and uniform layouts for the Canvas scene's lit
 * │                 │ entities and its camera-textured cube.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/shader
 * @file shader.ts
 * @author Gurpinder Gill
 * @license MIT
 */const tt=`
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
`,Xa=144,rt=Xa/4,pt=`
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
`,ya=64,ot=ya/4;/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/gpu_canvas/webgpu_types
 * │ Filename        │ webgpu_types.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-27
 * │ Modified Date   │ 2026-10-29
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Minimal structural WebGPU type declarations, since the bundled
 * │                 │ DOM types declare none and the project has no @webgpu/types.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/webgpu_types
 * @file webgpu_types.ts
 * @author Gurpinder Gill
 * @license MIT
 */function K(){const a=globalThis;return{buffer:a.GPUBufferUsage,texture:a.GPUTextureUsage}}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/gpu_canvas/scene_renderer
 * │ Filename        │ scene_renderer.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-27
 * │ Modified Date   │ 2026-10-31
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ WebGPU renderer for the Canvas scene: pipelines, buffers and the
 * │                 │ per-frame draw, including the camera- and orientation-driven cube.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/scene_renderer
 * @file scene_renderer.ts
 * @author Gurpinder Gill
 * @license MIT
 */const Ua=[0,2,10],_t=[0,0,0],ct=[0,1,0],Ga=55*Math.PI/180,et=.1,it=100,ta=2.5,At=.85;function ra(a){const t=(Ua[2]-ta)*Math.tan(Ga/2)*At,r=t*a;return{min:[-r,-t,-ta],max:[r,t,ta]}}const It=8,Pt=8,st=1.1,Nt=.6,lt=16,Ot=24,Tt=3.2,Lt={r:.04,g:.05,b:.08,a:1},sa="depth24plus";function Et(a,n,t,r){const p=dt(a,t),o=pa(a,qn(st)),_=pa(a,Zn(Nt,lt,Ot)),c=Math.max(1,r.width)/Math.max(1,r.height),i=Qn(It,Pt,ra(c)).map(E=>ut(a,p,E)),A=new Float32Array(rt);let P,l,L=0,O=0,D,N,v;const Na=new Float32Array(ot);function ja(E){v=E}function Wa(E){if(N)return;const F=Dt(a,t),R=pa(a,Mn(Tt)),{buffer:h,texture:x}=K(),G=a.createBuffer({size:J(ya),usage:h.UNIFORM|h.COPY_DST}),Y=a.createSampler({magFilter:"linear",minFilter:"linear"}),X=a.createTexture({size:[E.width,E.height],format:"rgba8unorm",usage:x.TEXTURE_BINDING|x.COPY_DST|x.RENDER_ATTACHMENT}),z=a.createBindGroup({layout:F.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:G}},{binding:1,resource:Y},{binding:2,resource:X.createView()}]}),V=Aa("camera",ra(Math.max(1,r.width)/Math.max(1,r.height)),Math.random);V.scale=1,V.position=[0,0,0],V.velocity=[0,0,0],N={camera:E,entity:V,pipeline:F,meshBuffers:R,uniformBuffer:G,bindGroup:z,texture:X,textureWidth:E.width,textureHeight:E.height}}function $a(E){D===void 0&&(D=E);const F=Math.min((E-D)/1e3,.1);D=E;const R=Math.max(1,r.width),h=Math.max(1,r.height);(!P||L!==R||O!==h)&&(P==null||P.destroy(),P=vt(a,R,h),l=P.createView(),L=R,O=h);const x=R/h,G=Jn(Ga,x,et,it),Y=Kn(Ua,_t,ct),X=j(G,Y),z=ra(x);for(const d of i){at(d.entity,F,z);const S=ea(Da(d.entity.position),U(d.entity.rotationAxis,d.entity.rotationAngle),va(d.entity.scale)),q=j(X,S);A.set(q,0),A.set(S,16),A.set(d.entity.color,32),a.queue.writeBuffer(d.uniformBuffer,0,A)}if(N){const d=v==null?void 0:v.orientation;let S;d?S=zn(d.alpha,d.beta,d.gamma):(N.entity.rotationAngle+=N.entity.rotationSpeed*F,S=U(N.entity.rotationAxis,N.entity.rotationAngle));const q=ea(Da(N.entity.position),S,va(N.entity.scale));Na.set(j(X,q),0),a.queue.writeBuffer(N.uniformBuffer,0,Na),N.camera.isReady&&a.queue.copyExternalImageToTexture({source:N.camera.element},{texture:N.texture},[N.textureWidth,N.textureHeight])}const V=a.createCommandEncoder(),u=V.beginRenderPass({colorAttachments:[{view:n.getCurrentTexture().createView(),clearValue:Lt,loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:l,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});u.setPipeline(p);for(const d of i){const S=d.entity.kind==="cube"?o:_;u.setBindGroup(0,d.bindGroup),u.setVertexBuffer(0,S.vertexBuffer),u.setIndexBuffer(S.indexBuffer,"uint16"),u.drawIndexed(S.indexCount)}N&&(u.setPipeline(N.pipeline),u.setBindGroup(0,N.bindGroup),u.setVertexBuffer(0,N.meshBuffers.vertexBuffer),u.setIndexBuffer(N.meshBuffers.indexBuffer,"uint16"),u.drawIndexed(N.meshBuffers.indexCount)),u.end(),a.queue.submit([V.finish()])}function Ja(){P==null||P.destroy(),o.vertexBuffer.destroy(),o.indexBuffer.destroy(),_.vertexBuffer.destroy(),_.indexBuffer.destroy();for(const E of i)E.uniformBuffer.destroy();N&&(N.texture.destroy(),N.meshBuffers.vertexBuffer.destroy(),N.meshBuffers.indexBuffer.destroy(),N.uniformBuffer.destroy(),N=void 0)}return{renderFrame:$a,attachCamera:Wa,attachOrientation:ja,destroy:Ja}}function dt(a,n){const t=a.createShaderModule({code:tt});return a.createRenderPipeline({layout:"auto",vertex:{module:t,entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:t,entryPoint:"fs_main",targets:[{format:n}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{format:sa,depthWriteEnabled:!0,depthCompare:"less"}})}function Dt(a,n){const t=a.createShaderModule({code:pt});return a.createRenderPipeline({layout:"auto",vertex:{module:t,entryPoint:"vs_camera",buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:t,entryPoint:"fs_camera",targets:[{format:n}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{format:sa,depthWriteEnabled:!0,depthCompare:"less"}})}function vt(a,n,t){const{texture:r}=K();return a.createTexture({size:[n,t],format:sa,usage:r.RENDER_ATTACHMENT})}function ut(a,n,t){const{buffer:r}=K(),p=a.createBuffer({size:J(Xa),usage:r.UNIFORM|r.COPY_DST}),o=a.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:p}}]});return{entity:t,uniformBuffer:p,bindGroup:o}}function pa(a,n){const{buffer:t}=K(),r=a.createBuffer({size:J(n.vertices.byteLength),usage:t.VERTEX|t.COPY_DST});a.queue.writeBuffer(r,0,n.vertices);const p=a.createBuffer({size:J(n.indices.byteLength),usage:t.INDEX|t.COPY_DST});return a.queue.writeBuffer(p,0,n.indices),{vertexBuffer:r,indexBuffer:p,indexCount:n.indices.length}}function J(a){return Math.ceil(a/4)*4}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/data/camera_capture
 * │ Filename        │ camera_capture.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-29
 * │ Modified Date   │ 2026-10-29
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Live camera feed wrapper: owns one getUserMedia() MediaStream
 * │                 │ and its <video> element for the Canvas tab's camera cube.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/data/camera_capture
 * @file camera_capture.ts
 * @author Gurpinder Gill
 * @license MIT
 */class St{constructor(n=document.createElement("video"),t=navigator.mediaDevices){e(this,"video");e(this,"mediaDevices");e(this,"stream");this.video=n,this.video.muted=!0,this.video.playsInline=!0,this.mediaDevices=t}async start(){if(!this.mediaDevices)throw new Error("Camera capture is not supported in this browser (navigator.mediaDevices is undefined).");this.stream=await this.mediaDevices.getUserMedia({video:!0,audio:!1}),this.video.srcObject=this.stream,await this.video.play(),await ft(this.video)}get element(){return this.video}get isReady(){return this.video.videoWidth>0&&this.video.videoHeight>0}get width(){return this.video.videoWidth}get height(){return this.video.videoHeight}stop(){var n;(n=this.stream)==null||n.getTracks().forEach(t=>t.stop()),this.stream=void 0,this.video.srcObject=null}}function ft(a){return a.videoWidth>0&&a.videoHeight>0?Promise.resolve():new Promise(n=>{const t=()=>{a.videoWidth===0||a.videoHeight===0||(a.removeEventListener("loadeddata",t),n())};a.addEventListener("loadeddata",t)})}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/data/device_orientation
 * │ Filename        │ device_orientation.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-31
 * │ Modified Date   │ 2026-10-31
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Device tilt/heading wrapper: owns one deviceorientation listener
 * │                 │ feeding the Canvas tab's camera cube rotation.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/data/device_orientation
 * @file device_orientation.ts
 * @author Gurpinder Gill
 * @license MIT
 */class ht{constructor(n=window,t=window.DeviceOrientationEvent){e(this,"target");e(this,"eventConstructor");e(this,"latest");e(this,"listening",!1);e(this,"handleEvent",n=>{n.alpha===null||n.beta===null||n.gamma===null||(this.latest={alpha:n.alpha,beta:n.beta,gamma:n.gamma})});this.target=n,this.eventConstructor=t}async start(){if(!this.eventConstructor)throw new Error("Device orientation is not supported in this browser (DeviceOrientationEvent is undefined).");if(typeof this.eventConstructor.requestPermission=="function"){const n=await this.eventConstructor.requestPermission();if(n!=="granted")throw new Error(`Device orientation permission was not granted (${n}).`)}this.target.addEventListener("deviceorientation",this.handleEvent),this.listening=!0}get orientation(){return this.latest}get isReady(){return this.latest!==void 0}stop(){this.listening&&this.target.removeEventListener("deviceorientation",this.handleEvent),this.listening=!1,this.latest=void 0}}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/gpu_canvas_view
 * │ Filename        │ gpu_canvas_view.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-27
 * │ Modified Date   │ 2026-10-31
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ GpuCanvasView: the Canvas tab, hosting the WebGPU scene and
 * │                 │ reporting failures visibly through the Logger.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas_view
 * @file gpu_canvas_view.ts
 * @author Gurpinder Gill
 * @license MIT
 */function Vt(a){return a.gpu}function gt(a){return a.getContext("webgpu")}class Rt{constructor(n,t=()=>new St,r=()=>new ht){e(this,"container");e(this,"device");e(this,"renderer");e(this,"cameraCapture");e(this,"orientationSensor");e(this,"animationFrame");e(this,"resizeObserver");e(this,"sessionToken",0);this.logger=n,this.createCamera=t,this.createOrientationSensor=r}mount(n){this.destroy(),this.container=n;const t=++this.sessionToken;n.innerHTML='<canvas class="gpu-canvas-surface"></canvas>',this.start(t)}destroy(){var n,t,r,p,o;this.animationFrame!==void 0&&(cancelAnimationFrame(this.animationFrame),this.animationFrame=void 0),(n=this.resizeObserver)==null||n.disconnect(),this.resizeObserver=void 0,(t=this.cameraCapture)==null||t.stop(),this.cameraCapture=void 0,(r=this.orientationSensor)==null||r.stop(),this.orientationSensor=void 0,(p=this.renderer)==null||p.destroy(),this.renderer=void 0,(o=this.device)==null||o.destroy(),this.device=void 0}async start(n){const t=this.container;if(t)try{const r=Vt(navigator);if(!r)throw new Error("WebGPU is not supported in this browser (navigator.gpu is undefined).");const p=await r.requestAdapter();if(n!==this.sessionToken)return;if(!p)throw new Error("WebGPU is supported, but no GPU adapter is available (requestAdapter() returned null).");const o=await p.requestDevice();if(n!==this.sessionToken){o.destroy();return}this.device=o;const _=t.querySelector(".gpu-canvas-surface"),c=_?gt(_):null;if(!_||!c)throw new Error("This browser's canvas element has no WebGPU context.");c.configure({device:o,format:r.getPreferredCanvasFormat()});const i=()=>{const O=window.devicePixelRatio||1;_.width=Math.max(1,Math.floor(_.clientWidth*O)),_.height=Math.max(1,Math.floor(_.clientHeight*O))};this.resizeObserver=new ResizeObserver(i),this.resizeObserver.observe(_),i(),this.renderer=Et(o,c,r.getPreferredCanvasFormat(),_);const A=this.renderer;this.logger.info("Requesting camera access…");const P=this.createCamera();this.cameraCapture=P,P.start().then(()=>{n===this.sessionToken&&(A.attachCamera(P),this.logger.info(`Camera ready (${P.width}x${P.height}) -- textured onto one cube in the scene.`))}).catch(O=>{n===this.sessionToken&&this.logger.warn(`Camera unavailable: ${O instanceof Error?O.message:String(O)}`)}),this.logger.info("Requesting device orientation access…");const l=this.createOrientationSensor();this.orientationSensor=l,l.start().then(()=>{n===this.sessionToken&&(A.attachOrientation(l),this.logger.info("Device orientation ready -- the camera cube now tilts to match the phone's own real orientation."))}).catch(O=>{n===this.sessionToken&&this.logger.warn(`Device orientation unavailable: ${O instanceof Error?O.message:String(O)}`)});const L=()=>{n===this.sessionToken&&(A.renderFrame(performance.now()),this.animationFrame=requestAnimationFrame(L))};this.animationFrame=requestAnimationFrame(L)}catch(r){if(n!==this.sessionToken||!this.container)return;const p=r instanceof Error?r.message:String(r);this.logger.warn(p),this.destroy(),this.container.innerHTML=`<div class="portal-view-empty">${xt(p)}</div>`}}}function xt(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/vocabulary/data/enums/part_of_speech
 * │ Filename        │ part_of_speech.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-08-25
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ PartOfSpeech: numeric part-of-speech codes.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/enums/part_of_speech
 * @file part_of_speech.ts
 * @author Gurpinder Gill
 * @license MIT
 */var s=(a=>(a[a.NOUN=0]="NOUN",a[a.VERB=1]="VERB",a[a.ADJECTIVE=2]="ADJECTIVE",a[a.ADVERB=3]="ADVERB",a[a.PRONOUN=4]="PRONOUN",a[a.DETERMINER=5]="DETERMINER",a[a.PREPOSITION=6]="PREPOSITION",a[a.CONJUNCTION=7]="CONJUNCTION",a[a.INTERJECTION=8]="INTERJECTION",a[a.NUMERAL=9]="NUMERAL",a[a.AUXILIARY=11]="AUXILIARY",a[a.PROPER_NOUN=12]="PROPER_NOUN",a[a.SYMBOL=13]="SYMBOL",a[a.PUNCTUATION=14]="PUNCTUATION",a[a.OTHER=15]="OTHER",a))(s||{});/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/linguistics/ui/sentence_reader_view
 * │ Filename        │ sentence_reader_view.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-09-13
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ SentenceReaderView: the Portal UI for reading typed or pasted
 * │                 │ text through the Linguistics read path.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/ui/sentence_reader_view
 * @file sentence_reader_view.ts
 * @author Gurpinder Gill
 * @license MIT
 */const Ct={[s[s.NOUN]]:"#3B6EA5",[s[s.PROPER_NOUN]]:"#274472",[s[s.VERB]]:"#B2542D",[s[s.ADJECTIVE]]:"#7A5CA6",[s[s.ADVERB]]:"#B08900",[s[s.PRONOUN]]:"#5B7B6F",[s[s.DETERMINER]]:"#6E7B8B",[s[s.PREPOSITION]]:"#7B6E5B",[s[s.CONJUNCTION]]:"#6B7280",[s[s.AUXILIARY]]:"#5B6E8B",[s[s.INTERJECTION]]:"#C2544B",[s[s.NUMERAL]]:"#4B8A7B",[s[s.SYMBOL]]:"#8A8A8A",[s[s.PUNCTUATION]]:"#9A9A9A",[s[s.OTHER]]:"#7A7A7A"},b={VALID:"#2B6E63",UNRESOLVED:"#B08900",INVALID:"#B2542D"},ha=["A meaning is a representation.","The word over the meaning.","The use is a state.","The word wants to use the meaning.","The meaning and the word perceive the state."],Va="lira-sentence-reader-styles";class mt{constructor(n){e(this,"container");e(this,"reading",!1);e(this,"requestToken",0);e(this,"documentResult");e(this,"expandedNodes",new Set);e(this,"selectedKey");e(this,"detailCache",new Map);e(this,"detailToken",0);this.client=n}mount(n){this.container=n,this.ensureStyles(),n.innerHTML=this.renderShell(),this.wire();const t=n.querySelector(".lira-sr-textarea");t!=null&&t.value&&this.read(t.value)}destroy(){this.container=void 0}wire(){const n=this.container;if(!n)return;const t=n.querySelector(".lira-sr-textarea"),r=n.querySelector(".lira-sr-read-btn");t&&r&&(r.addEventListener("click",()=>void this.read(t.value)),t.addEventListener("keydown",o=>{(o.metaKey||o.ctrlKey)&&o.key==="Enter"&&this.read(t.value)})),n.querySelectorAll(".lira-sr-example").forEach(o=>{o.addEventListener("click",()=>{const _=o.dataset.example??"";t&&(t.value=_),this.read(_)})});const p=n.querySelector(".lira-sr-tree");p==null||p.addEventListener("click",o=>this.handleTreeClick(o)),p==null||p.addEventListener("keydown",o=>this.handleTreeKeydown(o))}handleTreeClick(n){const t=n.target,r=t.closest('[data-action="toggle-node"]');if(r){this.toggleNode(r.dataset.node??"");return}const p=t.closest('.lira-tree-row[data-kind="sentence"]');p&&this.selectSentenceNode(p.dataset.node??"")}handleTreeKeydown(n){if(n.key!=="Enter"&&n.key!==" ")return;const t=n.target;if(t.closest('[data-action="toggle-node"]'))return;const r=t.closest('.lira-tree-row[data-kind="sentence"]');r&&(n.preventDefault(),this.selectSentenceNode(r.dataset.node??""))}toggleNode(n){if(!n||!this.documentResult)return;const t=!this.expandedNodes.has(n);if(t?this.expandedNodes.add(n):this.expandedNodes.delete(n),t&&ga(n)&&!this.detailCache.has(n)){this.selectSentenceNode(n);return}this.renderTreeInPlace()}renderTreeInPlace(){var t;if(!this.documentResult)return;const n=(t=this.container)==null?void 0:t.querySelector(".lira-sr-tree");n&&(n.innerHTML=this.renderTree(this.documentResult))}async selectSentenceNode(n){const t=this.documentResult,r=ga(n);if(!t||!r)return;const p=t.blocks[r.blockIndex];if(!p||p.blockKind!=="paragraph")return;const o=p.sentences[r.sentenceIndex];if(!o)return;this.selectedKey=n,this.expandedNodes.add(`b${r.blockIndex}`),this.expandedNodes.add(n),this.renderTreeInPlace();const _=this.detailCache.get(n);if(_){this.renderDetail(_);return}this.setPanelPlaceholder(".lira-sr-predicted","Loading…"),this.setPanelPlaceholder(".lira-sr-winner-panel","Loading…"),this.setPanelPlaceholder(".lira-sr-trace","Loading…");const c=++this.detailToken,i=this.isLearningEnabled();try{const A=await this.client.read(o.text,i,!0);if(c!==this.detailToken||!this.container)return;this.detailCache.set(n,A),this.renderTreeInPlace(),this.renderDetail(A)}catch(A){if(c!==this.detailToken||!this.container)return;this.setError(A instanceof Error?A.message:String(A))}}isLearningEnabled(){var t;const n=(t=this.container)==null?void 0:t.querySelector(".lira-sr-learning-toggle");return(n==null?void 0:n.checked)??!0}async read(n){const t=n.trim();if(!t||this.reading)return;const r=++this.requestToken,p=this.isLearningEnabled();this.reading=!0,this.setBusy(!0),this.setError(void 0);try{const o=await this.client.readDocument(t,p);if(r!==this.requestToken||!this.container)return;this.renderDocument(o)}catch(o){if(r!==this.requestToken||!this.container)return;this.setError(o instanceof Error?o.message:String(o))}finally{r===this.requestToken&&(this.reading=!1,this.setBusy(!1))}}setBusy(n){var r;const t=(r=this.container)==null?void 0:r.querySelector(".lira-sr-read-btn");t&&(t.disabled=n,t.textContent=n?"Reading…":"Read")}setLearningStatus(n){var p;const t=(p=this.container)==null?void 0:p.querySelector(".lira-sr-learning-status");if(!t)return;if(!n||!n.enabled){t.textContent="Learning off";return}const r=n.recordedThisRead>0?` (+${n.recordedThisRead})`:"";t.textContent=`Learning: ${n.totalObservations} observation${n.totalObservations===1?"":"s"}${r}`}setError(n){var r;const t=(r=this.container)==null?void 0:r.querySelector(".lira-sr-error");t&&(t.textContent=n??"",t.style.display=n?"block":"none")}renderDocument(n){this.documentResult=n.document,this.detailCache.clear(),this.expandedNodes=new Set(["doc"]),this.selectedKey=void 0,this.setLearningStatus(n.learning);const t=bt(n.document);if(t){this.selectSentenceNode(t);return}this.renderTreeInPlace(),this.setPanelPlaceholder(".lira-sr-predicted","No sentences found in this text."),this.setPanelPlaceholder(".lira-sr-winner-panel","No sentences found in this text."),this.setPanelPlaceholder(".lira-sr-trace","No sentences found in this text.")}renderDetail(n){var o,_,c;const t=(o=this.container)==null?void 0:o.querySelector(".lira-sr-predicted"),r=(_=this.container)==null?void 0:_.querySelector(".lira-sr-winner-panel"),p=(c=this.container)==null?void 0:c.querySelector(".lira-sr-trace");t&&(t.innerHTML=this.renderPredicted(n.predicted,n.words)),r&&(r.innerHTML=this.renderWinner(n.predicted,n.trace)),p&&(p.innerHTML=this.renderTrace(n.trace))}setPanelPlaceholder(n,t){var p;const r=(p=this.container)==null?void 0:p.querySelector(n);r&&(r.innerHTML=`<div class="lira-sr-placeholder">${I(t)}</div>`)}ensureStyles(){if(document.getElementById(Va))return;const n=document.createElement("style");n.id=Va,n.textContent=Bt,document.head.appendChild(n)}renderShell(){return`
      <div class="lira-sr">
        <div class="lira-sr-input-card">
          <textarea class="lira-sr-textarea" placeholder="e.g. A meaning is a representation.">${I(ha[0])}</textarea>
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
            ${ha.map(n=>`<button type="button" class="lira-sr-example" data-example="${I(n)}">${I(n)}</button>`).join("")}
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
    `}renderTree(n){const t=this.expandedNodes.has("doc"),r=b[n.validation]??"#7A7A7A",p=n.blocks.filter(i=>i.blockKind==="paragraph").length,o=n.blocks.length-p,_=n.blocks.reduce((i,A)=>i+(A.blockKind==="paragraph"?A.errors.length:0),0),c=[`${p} paragraph${p===1?"":"s"}`,o?`${o} heading${o===1?"":"s"}`:"",_?`${_} error${_===1?"":"s"}`:""].filter(Boolean).join(", ");return`
      <ul class="lira-tree-root">
        <li class="lira-tree-node">
          <div class="lira-tree-row" data-node="doc" data-kind="document">
            ${oa("doc",t)}
            <span class="lira-tree-dot" style="background:${r}"></span>
            <span class="lira-tree-label">Document</span>
            ${t?"":`<span class="lira-tree-summary">${I(c)}</span>`}
          </div>
          ${t?`<ul>${n.blocks.map((i,A)=>this.renderBlockNode(i,A)).join("")}</ul>`:""}
        </li>
      </ul>`}renderBlockNode(n,t){const r=`b${t}`;if(n.blockKind==="heading")return`
        <li class="lira-tree-node lira-tree-leaf">
          <div class="lira-tree-row" data-node="${r}" data-kind="heading">
            <span class="lira-tree-spacer"></span>
            <span class="lira-tree-heading-pill">H${n.level}</span>
            <span class="lira-tree-label">${I(H(n.text,48))}</span>
          </div>
        </li>`;const p=this.expandedNodes.has(r),o=b[n.validation]??"#7A7A7A",_=[`${n.sentences.length} sentence${n.sentences.length===1?"":"s"}`,n.errors.length?`${n.errors.length} error${n.errors.length===1?"":"s"}`:""].filter(Boolean).join(", ");return`
      <li class="lira-tree-node">
        <div class="lira-tree-row" data-node="${r}" data-kind="paragraph">
          ${oa(r,p)}
          <span class="lira-tree-dot" style="background:${o}"></span>
          <span class="lira-tree-label">Paragraph ${t+1}</span>
          ${p?"":`<span class="lira-tree-summary">${I(_)}</span>`}
        </div>
        ${p?`<ul>${n.sentences.map((c,i)=>this.renderSentenceNode(c,r,i)).join("")}</ul>`:""}
      </li>`}renderSentenceNode(n,t,r){const p=`${t}s${r}`,o=b[n.validation]??"#7A7A7A",_=this.expandedNodes.has(p),c=this.detailCache.get(p),i=_?`<ul>${c?c.predicted.clauses.map((A,P)=>this.renderClauseNode(A,`${p}c${P}`)).join(""):'<li class="lira-tree-node"><div class="lira-tree-row"><span class="lira-tree-spacer"></span><span class="lira-tree-summary">Loading…</span></div></li>'}</ul>`:"";return`
      <li class="lira-tree-node">
        <div class="lira-tree-row ${this.selectedKey===p?"selected":""}" data-node="${p}" data-kind="sentence" role="button" tabindex="0">
          ${oa(p,_)}
          <span class="lira-tree-dot" style="background:${o}"></span>
          <span class="lira-tree-label">Sentence ${r+1}</span>
          <span class="lira-tree-snippet">${I(H(n.text,40))}</span>
          ${n.errors.length?`<span class="lira-tree-error-count">${n.errors.length}</span>`:""}
        </div>
        ${i}
      </li>`}renderClauseNode(n,t,r){const p=b[n.validation]??"#7A7A7A",_=[["subject",n.subject],["predicate",n.predicate],["object",n.object],["complement",n.complement],...n.modifiers.map(c=>["modifier",c])].filter(c=>c[1]!==null).map(([c,i],A)=>Ba(i)?this.renderClauseNode(i,`${t}r${A}`,c):this.renderPhraseNode(i,`${t}r${A}`,c)).join("");return`
      <li class="lira-tree-node">
        <div class="lira-tree-row" data-node="${t}" data-kind="clause">
          <span class="lira-tree-spacer"></span>
          <span class="lira-tree-dot" style="background:${p}"></span>
          ${r?`<span class="lira-tree-role-pill">${I(r)}</span>`:""}
          <span class="lira-tree-label">Clause</span>
          <span class="lira-tree-summary">${I(n.clauseType??"?")}</span>
          <span class="lira-tree-snippet">${I(H(n.text,40))}</span>
        </div>
        ${_?`<ul>${_}</ul>`:""}
      </li>`}renderPhraseNode(n,t,r){const p=b[n.validation]??"#7A7A7A",o=n.nestedPhrases.map((_,c)=>this.renderPhraseNode(_,`${t}n${c}`)).join("");return`
      <li class="lira-tree-node">
        <div class="lira-tree-row" data-node="${t}" data-kind="phrase">
          <span class="lira-tree-spacer"></span>
          <span class="lira-tree-dot" style="background:${p}"></span>
          ${r?`<span class="lira-tree-role-pill">${I(r)}</span>`:""}
          <span class="lira-tree-label">Phrase</span>
          <span class="lira-tree-summary">${I(n.phraseType??"?")}</span>
          <span class="lira-tree-snippet">${I(H(n.text,40))}</span>
        </div>
        ${o?`<ul>${o}</ul>`:""}
      </li>`}renderWinner(n,t){const r=n.clauses[0],o=(r?[["subject",r.subject],["predicate",r.predicate],["object",r.object],["complement",r.complement],...r.modifiers.map(c=>["modifier",c])]:[]).map(([c,i])=>ka(c,i)).join(""),_=t.length?`<div class="lira-sr-winner-positions">
          ${t.map(c=>`
            <span class="lira-sr-winner-chip">
              <span class="lira-sr-mono lira-sr-faint">#${c.startIndex}</span>
              <span class="lira-sr-strong lira-sr-mono">${I(c.tokenText??"")}</span>
              <span class="lira-sr-faint">${I(c.winnerPhraseType??"none")}</span>
            </span>`).join("")}
        </div>`:"";return`
      <div class="lira-sr-winner-head">
        ${Ra(n.validation)}
        <span class="lira-sr-strong">${I(n.sentenceType??"UNRESOLVED")}</span>
        <span class="lira-sr-faint">confidence ${n.confidence.toFixed(2)}</span>
      </div>
      ${o?`<div class="lira-sr-winner-roles">${o}</div>`:""}
      ${_}
    `}renderPredicted(n,t){return`${`
      <div class="lira-sr-clause-head">
        ${Ra(n.validation)}
        <span class="lira-sr-strong">${I(n.sentenceType??"UNRESOLVED")}</span>
        <span class="lira-sr-faint">confidence ${n.confidence.toFixed(2)}</span>
        <span class="lira-sr-faint">${n.punctuation?`terminal "${I(n.punctuation)}"`:"no terminal punctuation"}</span>
      </div>`}${wt(t)}${Ut(n.errors)}`}renderTrace(n){return n.length?n.map(t=>this.renderPosition(t)).join(""):'<div class="lira-sr-empty">No trace positions recorded.</div>'}renderPosition(n){const t=n.candidatePartsOfSpeech.length?n.candidatePartsOfSpeech.join(", "):n.isKnown===!1?"unseeded":"",r=n.winnerPartsOfSpeech.length?`<div class="lira-sr-winner-pos">
          <span class="lira-sr-faint">Predicted part(s) of speech:</span>
          ${n.winnerPartsOfSpeech.map(p=>Ha(p.text,p.partOfSpeech)).join("")}
        </div>`:"";return`
      <div class="lira-sr-position">
        <div class="lira-sr-position-head">
          <span class="lira-sr-mono lira-sr-faint">#${n.startIndex}</span>
          <span class="lira-sr-strong lira-sr-mono">${I(n.tokenText??"")}</span>
          <span class="lira-sr-faint">${I(t)}</span>
          <span class="lira-sr-winner">&#8594; won by ${I(n.winnerPhraseType??"none")}</span>
        </div>
        ${r}
        ${n.attempts.map(p=>this.renderAttempt(p)).join("")}
      </div>`}renderAttempt(n){const t=n.completions.length?n.completions.map(r=>`
          <div class="lira-sr-completion ${r.isWinner?"winner":""}">
            ${r.isWinner?'<span class="lira-sr-win-mark">&#10003; winner</span>':""}
            "${I(r.text)}" — ${I(r.validation)}, confidence ${r.confidence.toFixed(2)}
            ${yt(r.tokens)}
          </div>`).join(""):n.rejectionReason?`<div class="lira-sr-rejection">${I(n.rejectionReason)}</div>`:"";return`
      <div class="lira-sr-attempt ${n.startMatch?"":"rejected"}">
        <div class="lira-sr-attempt-head">
          <span class="lira-sr-attempt-type">${I(n.phraseType)}</span>
          <span class="lira-sr-match-mark ${n.startMatch?"yes":"no"}">${n.startMatch?"start matched":"no start match"}</span>
          <span class="lira-sr-faint lira-sr-mono">requires: ${n.requiredStart.map(I).join(", ")}</span>
        </div>
        ${t}
      </div>`}}function Ba(a){return"clauseType"in a}function ka(a,n){if(!n)return"";if(Ba(n)){const t=[["subject",n.subject],["predicate",n.predicate],["object",n.object],["complement",n.complement],...n.modifiers.map(r=>["modifier",r])];return`
      <div class="lira-sr-winner-role-row">
        <span class="lira-sr-winner-role-label">${I(a)}</span>
        <span class="lira-sr-mono">"${I(n.text)}"</span>
        <span class="lira-sr-faint">embedded clause · ${I(n.clauseType??"?")}</span>
      </div>
      <div class="lira-sr-winner-roles lira-sr-winner-roles-nested">${t.map(([r,p])=>ka(r,p)).join("")}</div>`}return`
    <div class="lira-sr-winner-role-row">
      <span class="lira-sr-winner-role-label">${I(a)}</span>
      <span class="lira-sr-mono">"${I(n.text)}"</span>
      <span class="lira-sr-faint">${I(n.phraseType??"?")}</span>
    </div>`}function oa(a,n){return`<button type="button" class="lira-tree-toggle" data-action="toggle-node" data-node="${a}" aria-expanded="${n}">${Gt}</button>`}function H(a,n){const t=a.trim();return t.length>n?`${t.slice(0,n-1)}…`:t}function ga(a){const n=/^b(\d+)s(\d+)$/.exec(a);if(n)return{blockIndex:Number(n[1]),sentenceIndex:Number(n[2])}}function bt(a){for(let n=0;n<a.blocks.length;n+=1){const t=a.blocks[n];if(t.blockKind!=="paragraph")continue;const r=t.sentences.findIndex(p=>p.errors.length>0);if(r>=0)return`b${n}s${r}`}for(let n=0;n<a.blocks.length;n+=1){const t=a.blocks[n];if(t.blockKind==="paragraph"&&t.sentences.length>0)return`b${n}s0`}}function wt(a){if(!a.length)return'<div class="lira-sr-empty">No words to show.</div>';let n="";return a.forEach((t,r)=>{const p=/^[.,!?;:]+$/.test(t.text);r>0&&!p&&(n+=" "),n+=Ft(t,r)}),`<div class="lira-sr-sentence">${n}</div>`}function Ft(a,n){return`<span class="lira-sr-word${a.resolved?"":" lira-sr-word-unfound"}" tabindex="0" data-word-index="${n}">${I(a.text)}${Xt(a)}</span>`}function Xt(a){if(!a.resolved)return`<span class="lira-sr-word-tooltip"><span class="tt-title">${I(a.text)}</span><span class="tt-meta">Not found in the Common Vocabulary Cache</span></span>`;const n=[a.validation??"UNRESOLVED",a.phraseType??"no phrase"],t=[a.partOfSpeech??"?",`conf ${a.confidence!==null?a.confidence.toFixed(2):"—"}`];return`<span class="lira-sr-word-tooltip"><span class="tt-title">${I(a.text)}</span><span class="tt-meta">${n.map(I).join(" · ")}</span><span class="tt-meta">${t.map(I).join(" · ")}</span></span>`}function Ra(a){return`<span class="lira-sr-badge" style="background:${b[a]??"#7A7A7A"}">${I(a)}</span>`}function Ha(a,n){return`
    <span class="lira-sr-pos-chip" style="background:${Ct[n]??"#7A7A7A"}">
      <span class="w">${I(a)}</span>
      <span class="p">${I(n)}</span>
    </span>`}function yt(a){return a.length?`<div class="lira-sr-trace-tokens">${a.map(t=>Ha(t.text,t.partOfSpeech??"UNKNOWN")).join("")}</div>`:""}function Ut(a){return a.length?`
    <div class="lira-sr-errors">
      ${a.map(n=>`
        <div class="lira-sr-error-row">
          <span class="lira-sr-strong">${I(n.kind)}:</span>
          ${I(n.message)}${n.tokenText?` ("${I(n.tokenText)}")`:""}
        </div>`).join("")}
    </div>`:""}function I(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const Gt='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',Bt=`
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
`;/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/portal_shell
 * │ Filename        │ portal_shell.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-10-29
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ PortalShell: the Portal's top-level UI. Lays out the view
 * │                 │ panes, wires the Vocabulary and Linguistics workers, and owns
 * │                 │ Domain save/load downloads.
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/portal_shell
 * @file portal_shell.ts
 * @author Gurpinder Gill
 * @license MIT
 */const m="Common",xa=[{id:"vocabulary",label:"Vocabulary",available:!0},{id:"linguistics",label:"Linguistics",available:!0},{id:"knowledge",label:"Knowledge",available:!1},{id:"canvas",label:"Canvas",available:!0}],Ca="lira-portal-shell-styles",ma="lira-vocabulary-fragment-styles";class kt{constructor(n,t,r,p,o={}){e(this,"mode");e(this,"mobileScreen","browse");e(this,"selectedName");e(this,"selectedComponent","vocabulary");e(this,"treeCollapsed",!1);e(this,"title");e(this,"container");e(this,"serviceStatusView");e(this,"consoleView");e(this,"sentenceReaderView");e(this,"gpuCanvasView");e(this,"logBoard",new tn);e(this,"loggersBySource",new Map);e(this,"renderToken",0);e(this,"ioInFlight",!1);e(this,"domainSnapshots",new Map);e(this,"currentVocabularyDomainName");var _;this.registry=n,this.vocabularyClient=t,this.statusBoard=p,this.title=o.title??"LIRA",this.mode=typeof window<"u"&&window.matchMedia("(max-width: 720px)").matches?"mobile":"desktop",this.selectedName=(_=this.registry.roots()[0])==null?void 0:_.name,this.serviceStatusView=new pn(p,[],this.logBoard),this.consoleView=new kn(p,t,r),this.sentenceReaderView=new mt(r),this.gpuCanvasView=new Rt(this.loggerFor("Canvas")),this.vocabularyClient.onLog((c,i,A)=>{this.loggerFor(i)[c](A)}),this.statusBoard.subscribe(c=>{const i=c.find(A=>A.id==="vocabulary");i&&this.updateVocabToolbar(i)}),this.vocabularyClient.onDomainUpdated(c=>{this.registry.add(c),this.render()}),this.vocabularyClient.onDomainSnapshot((c,i)=>{this.handleDomainSnapshot(c,i)}),this.searchWordsBridge(),this.searchPhrasesBridge(),this.searchSensesBridge(),this.searchRelationshipsBridge(),this.searchLexicalRelationshipsBridge(),this.resolveHierarchyBridge()}searchWordsBridge(){document.addEventListener("lira-search-words",n=>{const t=n.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchWords(this.currentVocabularyDomainName,{wordId:t.wordId,word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,domainLabel:t.domain,rootWordsOnly:t.rootWordsOnly,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-words-result",{detail:{requestId:t.requestId,words:r.words,totalMatches:r.totalMatches}}))})})}searchPhrasesBridge(){document.addEventListener("lira-search-phrases",n=>{const t=n.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchPhrases(this.currentVocabularyDomainName,{word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-phrases-result",{detail:{requestId:t.requestId,phrases:r.phrases,totalMatches:r.totalMatches}}))})})}searchSensesBridge(){document.addEventListener("lira-search-senses",n=>{const t=n.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchSenses(this.currentVocabularyDomainName,{word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-senses-result",{detail:{requestId:t.requestId,senses:r.senses,totalMatches:r.totalMatches}}))})})}searchRelationshipsBridge(){document.addEventListener("lira-search-relationships",n=>{const t=n.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchRelationships(this.currentVocabularyDomainName,{wordId:t.wordId,query:t.query,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-relationships-result",{detail:{requestId:t.requestId,relationships:r.relationships,totalMatches:r.totalMatches}}))})})}searchLexicalRelationshipsBridge(){document.addEventListener("lira-search-lexical-relationships",n=>{const t=n.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchLexicalRelationships(this.currentVocabularyDomainName,{wordId:t.wordId,query:t.query,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-search-lexical-relationships-result",{detail:{requestId:t.requestId,relationships:r.relationships,totalMatches:r.totalMatches}}))})})}resolveHierarchyBridge(){document.addEventListener("lira-resolve-hierarchy",n=>{const t=n.detail;this.currentVocabularyDomainName&&this.vocabularyClient.resolveHierarchy(this.currentVocabularyDomainName,{kind:t.kind,wordId:t.wordId,limit:t.limit}).then(r=>{document.dispatchEvent(new CustomEvent("lira-resolve-hierarchy-result",{detail:{requestId:t.requestId,...r}}))})})}mount(n){this.container=n,document.title=this.title,this.ensureStyles(),n.addEventListener("click",t=>this.handleClick(t)),n.addEventListener("change",t=>this.handleFileInputChange(t)),this.render()}handleClick(n){var p,o;const t=n.target.closest("[data-action]");if(!t||t.disabled)return;const r=t.dataset.action;r==="select"?(this.selectedName=t.dataset.domain,this.mode==="mobile"&&(this.mobileScreen="view"),this.render()):r==="mode"?(this.mode=t.dataset.mode,this.mode==="mobile"&&(this.mobileScreen=this.selectedName?"view":"browse"),this.render()):r==="back"?(this.mobileScreen="browse",this.render()):r==="component"?(this.selectedComponent=t.dataset.component,this.render()):r==="toggle-tree"?(this.treeCollapsed=!this.treeCollapsed,this.render()):r==="seed-wordnet"?this.vocabularyClient.seedWordNet(m):r==="seed-common-vocabulary"?this.vocabularyClient.seedCommonVocabulary(m):r==="save-vocabulary"?this.saveVocabulary():r==="load-vocabulary"&&((o=(p=this.container)==null?void 0:p.querySelector(".portal-vocab-file-input"))==null||o.click())}saveVocabulary(){this.ioInFlight=!0,this.render();const n=m.toLowerCase();this.vocabularyClient.exportDomain(m).then(t=>{g(t.words,`${n}-words.json`),g(t.phrases,`${n}-phrases.json`),g(t.wordForms,`${n}-word_forms.json`),g(t.senses,`${n}-senses.json`),g(t.coordinations,`${n}-coordinations.json`),g(t.semanticRelationships,`${n}-semantic-relationships.json`),g(t.lexicalRelationships,`${n}-lexical-relationships.json`)}).catch(()=>{}).finally(()=>{this.ioInFlight=!1,this.render()})}handleFileInputChange(n){const t=n.target;if(!t.classList.contains("portal-vocab-file-input")||!t.files||t.files.length===0)return;const r=[...t.files];t.value="",this.ioInFlight=!0,this.render(),Promise.all(r.map(async p=>{const o=Ht(p.name);return o?[o,await p.text()]:void 0})).then(p=>{const o={};for(const _ of p)_&&(o[_[0]]=_[1]);return this.vocabularyClient.importDomain(m,o)}).catch(()=>{}).finally(()=>{this.ioInFlight=!1,this.render()})}handleDomainSnapshot(n,t){const r=this.domainSnapshots.get(n);if(r)for(const c of r)URL.revokeObjectURL(c.url);const p=n.toLowerCase(),o=[["Words",`${p}-words.json`,t.words],["Phrases",`${p}-phrases.json`,t.phrases],["Word Forms",`${p}-word_forms.json`,t.wordForms],["Senses",`${p}-senses.json`,t.senses],["Coordinations",`${p}-coordinations.json`,t.coordinations],["Semantic Relationships",`${p}-semantic-relationships.json`,t.semanticRelationships],["Lexical Relationships",`${p}-lexical-relationships.json`,t.lexicalRelationships]];this.domainSnapshots.set(n,o.map(([c,i,A])=>({label:c,filename:i,url:URL.createObjectURL(new Blob([A],{type:"application/json"}))})));const _=this.statusBoard.get("vocabulary");_&&this.updateVocabToolbar(_)}renderVocabToolbar(){return`<div class="portal-vocab-toolbar">${this.vocabToolbarInner(this.statusBoard.get("vocabulary"))}</div>`}vocabToolbarInner(n){const t=(n==null?void 0:n.state)==="running",r=t||this.ioInFlight,p=n==null?void 0:n.progress;return`
      <button type="button" class="portal-vocab-toolbar-action" data-action="seed-common-vocabulary" ${t?"disabled":""}>Seed Vocabulary</button>
      <button type="button" class="portal-vocab-toolbar-action" data-action="seed-wordnet" ${t?"disabled":""}>Load WordNet</button>
      <button type="button" class="portal-vocab-toolbar-action" data-action="save-vocabulary" ${r?"disabled":""}>Save</button>
      <button type="button" class="portal-vocab-toolbar-action" data-action="load-vocabulary" ${r?"disabled":""}>Load from File</button>
      <input type="file" class="portal-vocab-file-input" multiple accept=".json" style="display:none">
      <span class="portal-vocab-toolbar-detail">${n!=null&&n.detail?f(n.detail):""}</span>
      ${p!==void 0?`<div class="portal-vocab-toolbar-progress"><div class="portal-vocab-toolbar-progress-fill" style="width:${Math.round(p*100)}%"></div></div>`:""}
      ${this.snapshotLinksHtml()}
    `}snapshotLinksHtml(){const n=this.domainSnapshots.get(m);return!n||n.length===0?"":`<div class="portal-vocab-snapshot-links"><span class="portal-vocab-snapshot-label">Last seed snapshot:</span>${n.map(r=>`<a class="portal-vocab-snapshot-link" href="${r.url}" download="${f(r.filename)}">${f(r.label)}</a>`).join("")}</div>`}updateVocabToolbar(n){var r;const t=(r=this.container)==null?void 0:r.querySelector(".portal-vocab-toolbar");t&&(t.innerHTML=this.vocabToolbarInner(n))}loggerFor(n){let t=this.loggersBySource.get(n);return t||(t=new rn(n,r=>this.logBoard.append(r)),this.loggersBySource.set(n,t)),t}ensureStyles(){if(document.getElementById(Ca))return;const n=document.createElement("style");n.id=Ca,n.textContent=Zt,document.head.appendChild(n)}ensureFragmentStyles(n){if(document.getElementById(ma))return;const t=document.createElement("style");t.id=ma,t.textContent=n,document.head.appendChild(t)}render(){if(!this.container)return;const n=this.selectedName?this.registry.get(this.selectedName):void 0;this.renderToken++;const t=this.mode==="desktop"&&this.treeCollapsed?"tree-collapsed":"";this.container.innerHTML=`
      <div class="portal-shell mode-${this.mode} ${t}">
        ${this.renderTopbar(n)}
        <div class="portal-body">
          ${this.renderBody(n)}
        </div>
      </div>
    `;const r=this.container.querySelector(".portal-service-status");r&&this.serviceStatusView.mount(r);const p=this.container.querySelector(".portal-console");p&&this.consoleView.mount(p),n&&this.selectedComponent==="vocabulary"?this.loadView(n):n&&this.selectedComponent==="linguistics"?this.loadLinguisticsView():n&&this.selectedComponent==="canvas"&&this.loadCanvasView()}loadLinguisticsView(){if(!this.container)return;const n=this.container.querySelector(".portal-fragment-mount");n&&this.sentenceReaderView.mount(n)}loadCanvasView(){if(!this.container)return;const n=this.container.querySelector(".portal-fragment-mount");n&&this.gpuCanvasView.mount(n)}async loadView(n){const t=++this.renderToken;this.setViewStatus("Loading Vocabulary…");let r;try{r=await this.vocabularyClient.renderDomain(n.name)}catch(o){if(t!==this.renderToken)return;this.setViewStatus(`Couldn't load this Domain's Vocabulary view: ${o instanceof Error?o.message:String(o)}`);return}if(t!==this.renderToken||!this.container)return;this.ensureFragmentStyles(r.style);const p=this.container.querySelector(".portal-fragment-mount");if(p){p.innerHTML=r.body,this.currentVocabularyDomainName=n.name;const o=document.createElement("script");o.textContent=`(function () {
${r.script}
})();`,p.appendChild(o)}this.setViewStatus(void 0)}setViewStatus(n){var r;const t=(r=this.container)==null?void 0:r.querySelector(".portal-view-status");t&&(t.textContent=n??"",t.style.display=n?"block":"none")}renderTopbar(n){const t=`
      <div class="portal-mode-toggle" role="group" aria-label="Layout">
        <button type="button" data-action="mode" data-mode="desktop" class="${this.mode==="desktop"?"active":""}">${Yt} Desktop</button>
        <button type="button" data-action="mode" data-mode="mobile" class="${this.mode==="mobile"?"active":""}">${zt} Mobile</button>
      </div>`;if(this.mode==="mobile")return this.mobileScreen==="view"&&n?`
          <div class="portal-topbar">
            <button type="button" class="portal-back" data-action="back" aria-label="Back to Domains">${Kt}</button>
            <span class="portal-topbar-title">${f(n.name)}</span>
            ${t}
          </div>`:`<div class="portal-topbar"><span class="portal-topbar-title">All Domains</span>${t}</div>`;const r=n?this.registry.ancestryOf(n.name):[];return`<div class="portal-topbar"><nav class="portal-breadcrumb">${[`<span class="crumb-root">${Jt} All Domains</span>`,...r.map(o=>`<span>${f(o.name)}</span>`)].join(`<span class="crumb-sep">${$t}</span>`)}</nav>${t}</div>`}renderBody(n){return this.mode==="desktop"?`${this.renderTree()}${this.renderViewPane(n)}`:this.mobileScreen==="browse"?`<div class="portal-tree portal-tree--mobile">${this.renderTreeRows(0)}</div>`:this.renderViewPane(n,!0)}renderTree(){return this.treeCollapsed?`
        <nav class="portal-tree portal-tree--collapsed">
          <button type="button" class="portal-tree-toggle" data-action="toggle-tree" title="Expand Domains" aria-label="Expand Domains" aria-expanded="false">${Mt}</button>
        </nav>`:`
      <nav class="portal-tree">
        <div class="portal-tree-label">
          <span>Domains</span>
          <button type="button" class="portal-tree-toggle" data-action="toggle-tree" title="Collapse Domains" aria-label="Collapse Domains" aria-expanded="true">${qt}</button>
        </div>
        ${this.renderTreeRows(0)}
      </nav>`}renderTreeRows(n,t){return(n===0?this.registry.roots():this.registry.children(t??"")).map(p=>{const o=this.registry.children(p.name),_=p.name===this.selectedName;return`
          <div class="portal-tree-row depth-${n} ${_?"selected":""}" data-action="select" data-domain="${f(p.name)}">
            ${o.length>0?Wt:'<span class="chev-spacer"></span>'}
            ${jt}
            <span class="name">${f(p.name)}</span>
            <span class="count">${p.wordCount.toLocaleString()}</span>
          </div>
          ${o.length>0?this.renderTreeRows(n+1,p.name):""}
        `}).join("")}renderComponentSwitcher(){return`
      <div class="portal-component-switcher" role="tablist" aria-label="UI Component">
        ${xa.map(n=>`
          <button
            type="button"
            role="tab"
            data-action="component"
            data-component="${n.id}"
            class="${n.id===this.selectedComponent?"active":""}"
            ${n.available?"":"disabled"}
            title="${n.available?"":"Not ported yet"}"
            aria-selected="${n.id===this.selectedComponent}"
          >${f(n.label)}${n.available?"":' <span class="not-ported-badge">Not ported</span>'}</button>
        `).join("")}
      </div>`}renderViewPane(n,t=!1){const r=this.renderComponentSwitcher(),p='<div class="portal-console"></div>',o='<div class="portal-service-status"></div>',_=this.selectedComponent==="vocabulary"?this.renderVocabToolbar():"";if(!n)return`
        <div class="portal-view ${t?"portal-view--full":""}">
          ${r}
          ${_}
          <div class="portal-view-empty">Select a Domain to continue.</div>
          ${p}
          ${o}
        </div>`;const c=xa.find(A=>A.id===this.selectedComponent),i=c!=null&&c.available?`
        <div class="portal-view-status" style="display:none"></div>
        <div class="portal-fragment-mount"></div>`:`<div class="portal-view-empty">${f((c==null?void 0:c.label)??"This component")} is not ported yet.</div>`;return`
      <div class="portal-view ${t?"portal-view--full":""}">
        ${r}
        ${_}
        ${i}
        ${p}
        ${o}
      </div>`}}function f(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function g(a,n){const t=new Blob([a],{type:"application/json"}),r=URL.createObjectURL(t),p=document.createElement("a");p.href=r,p.download=n,p.click(),URL.revokeObjectURL(r)}function Ht(a){const n=a.toLowerCase();if(n.includes("word_forms")||n.includes("wordforms"))return"wordForms";if(n.includes("words"))return"words";if(n.includes("phrases"))return"phrases";if(n.includes("senses"))return"senses";if(n.includes("coordinations"))return"coordinations";if(n.includes("semantic"))return"semanticRelationships";if(n.includes("lexical"))return"lexicalRelationships"}const jt='<svg class="i-folder" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.5A1 1 0 0 1 2.5 2.5h3.6l1.2 1.4H13.5A1 1 0 0 1 14.5 5v7A1 1 0 0 1 13.5 13h-11a1 1 0 0 1-1-1v-8.5z"/></svg>',Wt='<svg class="i-chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',$t='<svg class="i-chev-right" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>',Jt='<svg class="i-home" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 8l6-5 6 5M4 7v6h8V7"/></svg>',Kt='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3L5 8l5 5"/></svg>',Yt='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1.5" y="2.5" width="13" height="9" rx="1"/><path d="M6 13.5h4"/></svg>',zt='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4.5" y="1.5" width="7" height="13" rx="1.4"/></svg>',qt='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3L5 8l5 5"/></svg>',Mt='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>',Zt=`
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
`;/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/vocabulary/role/web_worker/vocabulary_worker_client
 * │ Filename        │ vocabulary_worker_client.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Main-thread client for the Vocabulary Service worker: search,
 * │                 │ render, and Domain import/export.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/role/web_worker/vocabulary_worker_client
 * @file vocabulary_worker_client.ts
 * @author Gurpinder Gill
 * @license MIT
 */class Qt{constructor(){e(this,"worker");e(this,"statusListeners",new Set);e(this,"domainUpdateListeners",new Set);e(this,"domainSnapshotListeners",new Set);e(this,"logListeners",new Set);e(this,"readyResolvers",[]);e(this,"pendingRenders",new Map);e(this,"pendingExports",new Map);e(this,"pendingImports",new Map);e(this,"pendingSearches",new Map);e(this,"pendingPhraseSearches",new Map);e(this,"pendingSenseSearches",new Map);e(this,"pendingRelationshipSearches",new Map);e(this,"pendingLexicalRelationshipSearches",new Map);e(this,"pendingHierarchyResolutions",new Map);e(this,"pendingMetrics",new Map);this.worker=new Worker(new URL(""+new URL("vocabulary_worker-BNZNrjCY.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.addEventListener("message",n=>{this.handleMessage(n.data)})}onStatus(n){return this.statusListeners.add(n),()=>{this.statusListeners.delete(n)}}onLog(n){return this.logListeners.add(n),()=>{this.logListeners.delete(n)}}init(){return new Promise(n=>{this.readyResolvers.push(n),this.post({type:"init"})})}linkPort(n){this.worker.postMessage({type:"link-port",port:n},[n])}renderDomain(n){const t=`${n}-${Math.random().toString(36).slice(2)}`;return new Promise((r,p)=>{this.pendingRenders.set(t,{resolve:r,reject:p}),this.post({type:"render",requestId:t,domain:n})})}exportDomain(n){const t=`export-${n}-${Math.random().toString(36).slice(2)}`;return new Promise((r,p)=>{this.pendingExports.set(t,{resolve:r,reject:p}),this.post({type:"export-domain",requestId:t,domain:n})})}importDomain(n,t){const r=`import-${n}-${Math.random().toString(36).slice(2)}`;return new Promise((p,o)=>{this.pendingImports.set(r,{resolve:p,reject:o}),this.post({type:"import-domain",requestId:r,domain:n,...t})})}getMetrics(){const n=`metrics-${Math.random().toString(36).slice(2)}`;return new Promise(t=>{this.pendingMetrics.set(n,t),this.post({type:"metrics",requestId:n})})}seedWordNet(n){this.post({type:"seed-wordnet",domain:n})}seedCommonVocabulary(n){this.post({type:"seed-common-vocabulary",domain:n})}onDomainUpdated(n){return this.domainUpdateListeners.add(n),()=>{this.domainUpdateListeners.delete(n)}}onDomainSnapshot(n){return this.domainSnapshotListeners.add(n),()=>{this.domainSnapshotListeners.delete(n)}}searchWords(n,t){const r=`search-${n}-${Math.random().toString(36).slice(2)}`;return new Promise(p=>{this.pendingSearches.set(r,p),this.post({type:"search-words",requestId:r,domain:n,wordId:t.wordId,word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,domainLabel:t.domainLabel,rootWordsOnly:t.rootWordsOnly,limit:t.limit})})}searchPhrases(n,t){const r=`phrase-search-${n}-${Math.random().toString(36).slice(2)}`;return new Promise(p=>{this.pendingPhraseSearches.set(r,p),this.post({type:"search-phrases",requestId:r,domain:n,word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,limit:t.limit})})}searchSenses(n,t){const r=`sense-search-${n}-${Math.random().toString(36).slice(2)}`;return new Promise(p=>{this.pendingSenseSearches.set(r,p),this.post({type:"search-senses",requestId:r,domain:n,word:t.word,gloss:t.gloss,definition:t.definition,pos:t.pos,limit:t.limit})})}searchRelationships(n,t){const r=`rel-search-${n}-${Math.random().toString(36).slice(2)}`;return new Promise(p=>{this.pendingRelationshipSearches.set(r,p),this.post({type:"search-relationships",requestId:r,domain:n,wordId:t.wordId,query:t.query,limit:t.limit})})}searchLexicalRelationships(n,t){const r=`lexical-rel-search-${n}-${Math.random().toString(36).slice(2)}`;return new Promise(p=>{this.pendingLexicalRelationshipSearches.set(r,p),this.post({type:"search-lexical-relationships",requestId:r,domain:n,wordId:t.wordId,query:t.query,limit:t.limit})})}resolveHierarchy(n,t){const r=`hierarchy-${n}-${Math.random().toString(36).slice(2)}`;return new Promise(p=>{this.pendingHierarchyResolutions.set(r,p),this.post({type:"resolve-hierarchy",requestId:r,domain:n,kind:t.kind,wordId:t.wordId,limit:t.limit})})}post(n){this.worker.postMessage(n)}handleMessage(n){if(n.type==="status")for(const t of this.statusListeners)t(n.state,n.detail,n.progress);else if(n.type==="ready"){const t=this.readyResolvers.splice(0);for(const r of t)r(n.domains)}else if(n.type==="rendered"){const t=this.pendingRenders.get(n.requestId);t&&(this.pendingRenders.delete(n.requestId),t.resolve(n.fragment))}else if(n.type==="render-error"){const t=this.pendingRenders.get(n.requestId);t&&(this.pendingRenders.delete(n.requestId),t.reject(new Error(n.message)))}else if(n.type==="export-domain-result"){const t=this.pendingExports.get(n.requestId);t&&(this.pendingExports.delete(n.requestId),t.resolve({words:n.words,phrases:n.phrases,wordForms:n.wordForms,senses:n.senses,coordinations:n.coordinations,semanticRelationships:n.semanticRelationships,lexicalRelationships:n.lexicalRelationships}))}else if(n.type==="export-domain-error"){const t=this.pendingExports.get(n.requestId);t&&(this.pendingExports.delete(n.requestId),t.reject(new Error(n.message)))}else if(n.type==="import-domain-result"){const t=this.pendingImports.get(n.requestId);t&&(this.pendingImports.delete(n.requestId),t.resolve(n.domain))}else if(n.type==="import-domain-error"){const t=this.pendingImports.get(n.requestId);t&&(this.pendingImports.delete(n.requestId),t.reject(new Error(n.message)))}else if(n.type==="metrics-result"){const t=this.pendingMetrics.get(n.requestId);t&&(this.pendingMetrics.delete(n.requestId),t(n.metrics))}else if(n.type==="domain-updated")for(const t of this.domainUpdateListeners)t(n.domain);else if(n.type==="domain-snapshot")for(const t of this.domainSnapshotListeners)t(n.domain,{words:n.words,phrases:n.phrases,wordForms:n.wordForms,senses:n.senses,coordinations:n.coordinations,semanticRelationships:n.semanticRelationships,lexicalRelationships:n.lexicalRelationships});else if(n.type==="log")for(const t of this.logListeners)t(n.level,n.source,n.message,n.timestamp);else if(n.type==="search-words-result"){const t=this.pendingSearches.get(n.requestId);t&&(this.pendingSearches.delete(n.requestId),t({words:n.words,totalMatches:n.totalMatches}))}else if(n.type==="search-phrases-result"){const t=this.pendingPhraseSearches.get(n.requestId);t&&(this.pendingPhraseSearches.delete(n.requestId),t({phrases:n.phrases,totalMatches:n.totalMatches}))}else if(n.type==="search-senses-result"){const t=this.pendingSenseSearches.get(n.requestId);t&&(this.pendingSenseSearches.delete(n.requestId),t({senses:n.senses,totalMatches:n.totalMatches}))}else if(n.type==="search-relationships-result"){const t=this.pendingRelationshipSearches.get(n.requestId);t&&(this.pendingRelationshipSearches.delete(n.requestId),t({relationships:n.relationships,totalMatches:n.totalMatches}))}else if(n.type==="search-lexical-relationships-result"){const t=this.pendingLexicalRelationshipSearches.get(n.requestId);t&&(this.pendingLexicalRelationshipSearches.delete(n.requestId),t({relationships:n.relationships,totalMatches:n.totalMatches}))}else if(n.type==="resolve-hierarchy-result"){const t=this.pendingHierarchyResolutions.get(n.requestId);t&&(this.pendingHierarchyResolutions.delete(n.requestId),t({nodes:n.nodes,edges:n.edges,roots:n.roots,totalEdgeCount:n.totalEdgeCount,totalNodeCount:n.totalNodeCount,fellBack:n.fellBack,truncated:n.truncated}))}else n.type==="error"&&console.error("Vocabulary Service error:",n.message)}}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/linguistics/role/web_worker/linguistics_worker_client
 * │ Filename        │ linguistics_worker_client.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-10-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Main-thread client for the Linguistics Service worker, exposing
 * │                 │ its messages as promise-based calls.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/web_worker/linguistics_worker_client
 * @file linguistics_worker_client.ts
 * @author Gurpinder Gill
 * @license MIT
 */class ar{constructor(){e(this,"worker");e(this,"statusListeners",new Set);e(this,"readyResolvers",[]);e(this,"pendingReads",new Map);e(this,"pendingReadDocuments",new Map);e(this,"pendingMetrics",new Map);this.worker=new Worker(new URL(""+new URL("linguistics_worker-Cldfhp1Y.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.addEventListener("message",n=>{this.handleMessage(n.data)})}onStatus(n){return this.statusListeners.add(n),()=>{this.statusListeners.delete(n)}}init(){return new Promise(n=>{this.readyResolvers.push(n),this.post({type:"init"})})}linkVocabularyPort(n){this.worker.postMessage({type:"link-vocabulary-port",port:n},[n])}read(n,t,r=!1){const p=`read-${Math.random().toString(36).slice(2)}`;return new Promise((o,_)=>{this.pendingReads.set(p,{resolve:o,reject:_}),this.post({type:"read",requestId:p,text:n,learningEnabled:t,skipLearning:r})})}readDocument(n,t){const r=`read-doc-${Math.random().toString(36).slice(2)}`;return new Promise((p,o)=>{this.pendingReadDocuments.set(r,{resolve:p,reject:o}),this.post({type:"read-document",requestId:r,text:n,learningEnabled:t})})}getMetrics(){const n=`metrics-${Math.random().toString(36).slice(2)}`;return new Promise(t=>{this.pendingMetrics.set(n,t),this.post({type:"metrics",requestId:n})})}post(n){this.worker.postMessage(n)}handleMessage(n){if(n.type==="status")for(const t of this.statusListeners)t(n.state,n.detail);else if(n.type==="ready"){const t=this.readyResolvers.splice(0);for(const r of t)r(n.wordCount)}else if(n.type==="read-result"){const t=this.pendingReads.get(n.requestId);t&&(this.pendingReads.delete(n.requestId),t.resolve(n.result))}else if(n.type==="read-document-result"){const t=this.pendingReadDocuments.get(n.requestId);t&&(this.pendingReadDocuments.delete(n.requestId),t.resolve(n.result))}else if(n.type==="metrics-result"){const t=this.pendingMetrics.get(n.requestId);t&&(this.pendingMetrics.delete(n.requestId),t(n.metrics))}else if(n.type==="error"){if(n.requestId){const t=this.pendingReads.get(n.requestId);if(t){this.pendingReads.delete(n.requestId),t.reject(new Error(n.message));return}const r=this.pendingReadDocuments.get(n.requestId);if(r){this.pendingReadDocuments.delete(n.requestId),r.reject(new Error(n.message));return}}console.error("Linguistic Service error:",n.message)}}}/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ main
 * │ Filename        │ main.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-09-13
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Portal entry point: boots the Portal shell and registers one
 * │                 │ Background Service per Architectural Layer with a UI component.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module main
 * @file main.ts
 * @author Gurpinder Gill
 * @license MIT
 */function nr(){const a=document.querySelector("#app");if(!a)return;a.style.height="100vh";const n=new za;n.register("vocabulary","Vocabulary Service","idle","Starting…"),n.register("linguistics","Linguistic Service","idle","Starting…"),n.register("knowledge","Knowledge Service","not-ported");const t=new Ma(n,"LIRA");t.mount(a);const r=new Qt;r.onStatus((_,c,i)=>n.update("vocabulary",_,c,i));const p=new ar;p.onStatus((_,c)=>n.update("linguistics",_,c));const o=new MessageChannel;r.linkPort(o.port1),p.linkVocabularyPort(o.port2),Promise.all([r.init(),p.init()]).then(([_])=>{t.destroy();const c=new qa(_);new kt(c,r,p,n,{title:"LIRA"}).mount(a)}).catch(_=>{n.update("vocabulary","error",_ instanceof Error?_.message:String(_))})}nr();
