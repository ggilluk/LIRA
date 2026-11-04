var ia=Object.defineProperty;var Pa=(n,a,_)=>a in n?ia(n,a,{enumerable:!0,configurable:!0,writable:!0,value:_}):n[a]=_;var c=(n,a,_)=>Pa(n,typeof a!="symbol"?a+"":a,_);(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))p(t);new MutationObserver(t=>{for(const r of t)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&p(o)}).observe(document,{childList:!0,subtree:!0});function _(t){const r={};return t.integrity&&(r.integrity=t.integrity),t.referrerPolicy&&(r.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?r.credentials="include":t.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function p(t){if(t.ep)return;t.ep=!0;const r=_(t);fetch(t.href,r)}})();/**
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
 */class ea{constructor(){c(this,"statuses",new Map);c(this,"listeners",new Set)}register(a,_,p="idle",t){this.statuses.set(a,{id:a,label:_,state:p,detail:t}),this.notify()}update(a,_,p,t){const r=this.statuses.get(a);r&&(this.statuses.set(a,{...r,state:_,detail:p,progress:t}),this.notify())}get(a){return this.statuses.get(a)}all(){return[...this.statuses.values()]}subscribe(a){return this.listeners.add(a),a(this.all()),()=>{this.listeners.delete(a)}}notify(){const a=this.all();for(const _ of this.listeners)_(a)}}/**
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
 */class Na{constructor(a=[]){c(this,"domains",new Map);for(const _ of a)this.add(_)}add(a){this.domains.set(a.name,a)}get(a){return this.domains.get(a)}all(){return[...this.domains.values()]}roots(){return this.all().filter(a=>a.parentName===void 0)}children(a){return this.all().filter(_=>_.parentName===a)}ancestryOf(a){const _=[];let p=this.get(a);for(;p!==void 0;)_.unshift(p),p=p.parentName!==void 0?this.get(p.parentName):void 0;return _}}/**
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
 */class sa{constructor(a,_="LIRA"){c(this,"unsubscribe");this.board=a,this.title=_}mount(a){var _;this.ensureStyles(),(_=this.unsubscribe)==null||_.call(this),this.unsubscribe=this.board.subscribe(p=>{a.innerHTML=this.renderScreen(p)})}waitFor(...a){return new Promise(_=>{const p=o=>o==="done"||o==="error",t=o=>{const I=o.filter(A=>a.includes(A.id));I.length===a.length&&I.every(A=>p(A.state))&&(r(),_())},r=this.board.subscribe(t)})}destroy(){var a;(a=this.unsubscribe)==null||a.call(this),this.unsubscribe=void 0}renderScreen(a){return`
      <div class="loading-screen">
        <div class="loading-box">
          <div class="loading-title">${_n(this.title)}</div>
          <div class="loading-subtitle">Initialising…</div>
          <div class="loading-steps">
            ${a.map(_=>this.renderStep(_)).join("")}
          </div>
        </div>
      </div>
    `}renderStep(a){return`
      <div class="loading-step state-${a.state}">
        <span class="loading-step-icon">${Ta[a.state]}</span>
        <span class="loading-step-label">${_n(a.label)}</span>
        <span class="loading-step-detail">${_n(a.detail??Oa[a.state])}</span>
      </div>
    `}ensureStyles(){if(document.getElementById(vn))return;const a=document.createElement("style");a.id=vn,a.textContent=la,document.head.appendChild(a)}}const Oa={"not-ported":"Not ported yet",idle:"Waiting…",running:"Working…",done:"Ready",error:"Failed"},Ta={"not-ported":"–",idle:"○",running:'<span class="loading-spinner"></span>',done:"✓",error:"✕"};function _n(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const vn="lira-loading-screen-styles",la=`
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
 */const Ea=300;class La{constructor(){c(this,"events",[]);c(this,"listeners",new Set)}append(a){this.events.push(a),this.events.length>Ea&&this.events.shift(),this.notify()}all(){return[...this.events]}subscribe(a){return this.listeners.add(a),a(this.all()),()=>{this.listeners.delete(a)}}notify(){const a=this.all();for(const _ of this.listeners)_(a)}}/**
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
 */class Da{constructor(a,_){this.source=a,this.sink=_}info(a){this.emit("info",a)}warn(a){this.emit("warn",a)}error(a){this.emit("error",a)}emit(a,_){this.sink({timestamp:Date.now(),level:a,source:this.source,message:_})}}/**
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
 */class da{constructor(a,_=[],p){c(this,"unsubscribeStatus");c(this,"unsubscribeLog");c(this,"collapsed",!1);c(this,"logCollapsed",!1);c(this,"latestStatuses",[]);c(this,"latestEvents",[]);c(this,"container");this.board=a,this.actions=_,this.logBoard=p}mount(a){var _,p;this.container=a,this.ensureStyles(),(_=this.unsubscribeStatus)==null||_.call(this),(p=this.unsubscribeLog)==null||p.call(this),a.addEventListener("click",t=>this.handleClick(t)),this.unsubscribeStatus=this.board.subscribe(t=>{this.latestStatuses=t,this.paint()}),this.logBoard&&(this.unsubscribeLog=this.logBoard.subscribe(t=>{this.latestEvents=t,this.paint()}))}destroy(){var a,_;(a=this.unsubscribeStatus)==null||a.call(this),this.unsubscribeStatus=void 0,(_=this.unsubscribeLog)==null||_.call(this),this.unsubscribeLog=void 0}paint(){this.container&&(this.container.innerHTML=this.renderPanel())}handleClick(a){const _=a.target.closest("[data-action]");if(!(!_||_.disabled)){if(_.dataset.action==="toggle")this.collapsed=!this.collapsed,this.paint();else if(_.dataset.action==="toggle-log")this.logCollapsed=!this.logCollapsed,this.paint();else if(_.dataset.action==="run"){const p=this.actions.find(t=>t.id===_.dataset.actionId);p==null||p.onClick()}}}renderPanel(){const a=this.latestStatuses,_=a.filter(p=>p.state==="running"||p.state==="done").length;return`
      <div class="service-status-panel ${this.collapsed?"collapsed":""}">
        <button type="button" class="service-status-header" data-action="toggle" aria-expanded="${!this.collapsed}">
          <span class="service-status-label">Background Services</span>
          ${this.collapsed?`<span class="service-status-summary">${_}/${a.length} running</span>`:""}
          <span class="service-status-chevron">${un}</span>
        </button>
        <div class="service-status-rows">
          ${a.map(p=>this.renderRow(p)).join("")}
        </div>
      </div>
      ${this.logBoard?this.renderLogPanel():""}
    `}renderRow(a){const _=this.actions.find(t=>t.id===a.id),p=a.progress!==void 0?`<div class="service-status-progress"><div class="service-status-progress-fill" style="width:${Math.round(a.progress*100)}%"></div></div>`:"";return`
      <div class="service-status-row-group">
        <div class="service-status-row state-${a.state}">
          <span class="service-status-dot"></span>
          <span class="service-status-name">${m(a.label)}</span>
          <span class="service-status-pill">${va[a.state]}</span>
          ${a.detail?`<span class="service-status-detail">${m(a.detail)}</span>`:""}
          ${_?`<button type="button" class="service-status-action" data-action="run" data-action-id="${m(_.id)}" ${a.state==="running"?"disabled":""}>${m(_.label)}</button>`:""}
        </div>
        ${p}
      </div>
    `}renderLogPanel(){const a=this.latestEvents;return`
      <div class="service-log-panel ${this.logCollapsed?"collapsed":""}">
        <button type="button" class="service-status-header" data-action="toggle-log" aria-expanded="${!this.logCollapsed}">
          <span class="service-status-label">Event Log</span>
          ${this.logCollapsed?`<span class="service-status-summary">${a.length} event${a.length===1?"":"s"}</span>`:""}
          <span class="service-status-chevron">${un}</span>
        </button>
        <div class="service-log-rows">
          ${a.length===0?'<div class="service-log-empty">No events yet.</div>':[...a].reverse().map(_=>this.renderLogRow(_)).join("")}
        </div>
      </div>
    `}renderLogRow(a){return`
      <div class="service-log-row level-${a.level}">
        <span class="service-log-time">${Sa(a.timestamp)}</span>
        <span class="service-log-level-pill">${ua[a.level]}</span>
        <span class="service-log-source">${m(a.source)}</span>
        <span class="service-log-message">${m(a.message)}</span>
      </div>
    `}ensureStyles(){if(document.getElementById(Sn))return;const a=document.createElement("style");a.id=Sn,a.textContent=fa,document.head.appendChild(a)}}const va={"not-ported":"Not ported",idle:"Idle",running:"Running",done:"Running",error:"Error"},ua={info:"Info",warn:"Warn",error:"Error"};function m(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Sa(n){return new Date(n).toLocaleTimeString(void 0,{hour12:!1})}const un='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',Sn="lira-service-status-styles",fa=`
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
 * │ Module Name     │ lira/value_objects/data/binary_object
 * │ Filename        │ binary_object.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-02
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ BinaryObject: the immutable CCTS Binary Object. Type (UN/CEFACT
 * │                 │ D25A UDT000002) - bytes plus format, MIME code, encoding,
 * │                 │ character set code, URI and filename.
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
 */function ga(n,a={}){return{value:n,...a}}/**
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
 */class H{constructor(a){c(this,"value");if(!H.isValid(a))throw new Error(`not a valid absolute URI: '${a}'`);this.value=a}static isValid(a){try{return new URL(a),!0}catch{return!1}}static fromUrl(a){return new H(a.href)}toUrl(){return new URL(this.value)}}/**
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
 * │ Module Name     │ lira/value_objects/data/enum/characterSetCodelist
 * │ Filename        │ characterSetCodelist.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ CharacterSetCodelist: the 257 IANA character sets of UN/CEFACT
 * │                 │ D25A's IANA_CharacterSetCode list (2013-01-23), with their
 * │                 │ names, aliases and a label lookup.
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/enum/characterSetCodelist
 * @file characterSetCodelist.ts
 * @author Gurpinder Gill
 * @license MIT
 */var Wn=(n=>(n[n.US_ASCII=3]="US_ASCII",n[n.ISO_8859_1_1987=4]="ISO_8859_1_1987",n[n.ISO_8859_2_1987=5]="ISO_8859_2_1987",n[n.ISO_8859_3_1988=6]="ISO_8859_3_1988",n[n.ISO_8859_4_1988=7]="ISO_8859_4_1988",n[n.ISO_8859_5_1988=8]="ISO_8859_5_1988",n[n.ISO_8859_6_1987=9]="ISO_8859_6_1987",n[n.ISO_8859_7_1987=10]="ISO_8859_7_1987",n[n.ISO_8859_8_1988=11]="ISO_8859_8_1988",n[n.ISO_8859_9_1989=12]="ISO_8859_9_1989",n[n.ISO_8859_10=13]="ISO_8859_10",n[n.ISO_6937_2_ADD=14]="ISO_6937_2_ADD",n[n.JIS_X0201=15]="JIS_X0201",n[n.JIS_ENCODING=16]="JIS_ENCODING",n[n.SHIFT_JIS=17]="SHIFT_JIS",n[n.EXTENDED_UNIX_CODE_PACKED_FORMAT_FOR_JAPANESE=18]="EXTENDED_UNIX_CODE_PACKED_FORMAT_FOR_JAPANESE",n[n.EXTENDED_UNIX_CODE_FIXED_WIDTH_FOR_JAPANESE=19]="EXTENDED_UNIX_CODE_FIXED_WIDTH_FOR_JAPANESE",n[n.BS_4730=20]="BS_4730",n[n.SEN_850200_C=21]="SEN_850200_C",n[n.IT=22]="IT",n[n.ES=23]="ES",n[n.DIN_66003=24]="DIN_66003",n[n.NS_4551_1=25]="NS_4551_1",n[n.NF_Z_62_010=26]="NF_Z_62_010",n[n.ISO_10646_UTF_1=27]="ISO_10646_UTF_1",n[n.ISO_646_BASIC_1983=28]="ISO_646_BASIC_1983",n[n.INVARIANT=29]="INVARIANT",n[n.ISO_646_IRV_1983=30]="ISO_646_IRV_1983",n[n.NATS_SEFI=31]="NATS_SEFI",n[n.NATS_SEFI_ADD=32]="NATS_SEFI_ADD",n[n.NATS_DANO=33]="NATS_DANO",n[n.NATS_DANO_ADD=34]="NATS_DANO_ADD",n[n.SEN_850200_B=35]="SEN_850200_B",n[n.KS_C_5601_1987=36]="KS_C_5601_1987",n[n.ISO_2022_KR=37]="ISO_2022_KR",n[n.EUC_KR=38]="EUC_KR",n[n.ISO_2022_JP=39]="ISO_2022_JP",n[n.ISO_2022_JP_2=40]="ISO_2022_JP_2",n[n.JIS_C6220_1969_JP=41]="JIS_C6220_1969_JP",n[n.JIS_C6220_1969_RO=42]="JIS_C6220_1969_RO",n[n.PT=43]="PT",n[n.GREEK7_OLD=44]="GREEK7_OLD",n[n.LATIN_GREEK=45]="LATIN_GREEK",n[n.NF_Z_62_010_1973=46]="NF_Z_62_010_1973",n[n.LATIN_GREEK_1=47]="LATIN_GREEK_1",n[n.ISO_5427=48]="ISO_5427",n[n.JIS_C6226_1978=49]="JIS_C6226_1978",n[n.BS_VIEWDATA=50]="BS_VIEWDATA",n[n.INIS=51]="INIS",n[n.INIS_8=52]="INIS_8",n[n.INIS_CYRILLIC=53]="INIS_CYRILLIC",n[n.ISO_5427_1981=54]="ISO_5427_1981",n[n.ISO_5428_1980=55]="ISO_5428_1980",n[n.GB_1988_80=56]="GB_1988_80",n[n.GB_2312_80=57]="GB_2312_80",n[n.NS_4551_2=58]="NS_4551_2",n[n.VIDEOTEX_SUPPL=59]="VIDEOTEX_SUPPL",n[n.PT2=60]="PT2",n[n.ES2=61]="ES2",n[n.MSZ_7795_3=62]="MSZ_7795_3",n[n.JIS_C6226_1983=63]="JIS_C6226_1983",n[n.GREEK7=64]="GREEK7",n[n.ASMO_449=65]="ASMO_449",n[n.ISO_IR_90=66]="ISO_IR_90",n[n.JIS_C6229_1984_A=67]="JIS_C6229_1984_A",n[n.JIS_C6229_1984_B=68]="JIS_C6229_1984_B",n[n.JIS_C6229_1984_B_ADD=69]="JIS_C6229_1984_B_ADD",n[n.JIS_C6229_1984_HAND=70]="JIS_C6229_1984_HAND",n[n.JIS_C6229_1984_HAND_ADD=71]="JIS_C6229_1984_HAND_ADD",n[n.JIS_C6229_1984_KANA=72]="JIS_C6229_1984_KANA",n[n.ISO_2033_1983=73]="ISO_2033_1983",n[n.ANSI_X3_110_1983=74]="ANSI_X3_110_1983",n[n.T_61_7BIT=75]="T_61_7BIT",n[n.T_61_8BIT=76]="T_61_8BIT",n[n.ECMA_CYRILLIC=77]="ECMA_CYRILLIC",n[n.CSA_Z243_4_1985_1=78]="CSA_Z243_4_1985_1",n[n.CSA_Z243_4_1985_2=79]="CSA_Z243_4_1985_2",n[n.CSA_Z243_4_1985_GR=80]="CSA_Z243_4_1985_GR",n[n.ISO_8859_6_E=81]="ISO_8859_6_E",n[n.ISO_8859_6_I=82]="ISO_8859_6_I",n[n.T_101_G2=83]="T_101_G2",n[n.ISO_8859_8_E=84]="ISO_8859_8_E",n[n.ISO_8859_8_I=85]="ISO_8859_8_I",n[n.CSN_369103=86]="CSN_369103",n[n.JUS_I_B1_002=87]="JUS_I_B1_002",n[n.IEC_P27_1=88]="IEC_P27_1",n[n.JUS_I_B1_003_SERB=89]="JUS_I_B1_003_SERB",n[n.JUS_I_B1_003_MAC=90]="JUS_I_B1_003_MAC",n[n.GREEK_CCITT=91]="GREEK_CCITT",n[n.NC_NC00_10_81=92]="NC_NC00_10_81",n[n.ISO_6937_2_25=93]="ISO_6937_2_25",n[n.GOST_19768_74=94]="GOST_19768_74",n[n.ISO_8859_SUPP=95]="ISO_8859_SUPP",n[n.ISO_10367_BOX=96]="ISO_10367_BOX",n[n.LATIN_LAP=97]="LATIN_LAP",n[n.JIS_X0212_1990=98]="JIS_X0212_1990",n[n.DS_2089=99]="DS_2089",n[n.US_DK=100]="US_DK",n[n.DK_US=101]="DK_US",n[n.KSC5636=102]="KSC5636",n[n.UNICODE_1_1_UTF_7=103]="UNICODE_1_1_UTF_7",n[n.ISO_2022_CN=104]="ISO_2022_CN",n[n.ISO_2022_CN_EXT=105]="ISO_2022_CN_EXT",n[n.UTF_8=106]="UTF_8",n[n.ISO_8859_13=109]="ISO_8859_13",n[n.ISO_8859_14=110]="ISO_8859_14",n[n.ISO_8859_15=111]="ISO_8859_15",n[n.ISO_8859_16=112]="ISO_8859_16",n[n.GBK=113]="GBK",n[n.GB18030=114]="GB18030",n[n.OSD_EBCDIC_DF04_15=115]="OSD_EBCDIC_DF04_15",n[n.OSD_EBCDIC_DF03_IRV=116]="OSD_EBCDIC_DF03_IRV",n[n.OSD_EBCDIC_DF04_1=117]="OSD_EBCDIC_DF04_1",n[n.ISO_11548_1=118]="ISO_11548_1",n[n.KZ_1048=119]="KZ_1048",n[n.ISO_10646_UCS_2=1e3]="ISO_10646_UCS_2",n[n.ISO_10646_UCS_4=1001]="ISO_10646_UCS_4",n[n.ISO_10646_UCS_BASIC=1002]="ISO_10646_UCS_BASIC",n[n.ISO_10646_UNICODE_LATIN1=1003]="ISO_10646_UNICODE_LATIN1",n[n.ISO_10646_J_1=1004]="ISO_10646_J_1",n[n.ISO_UNICODE_IBM_1261=1005]="ISO_UNICODE_IBM_1261",n[n.ISO_UNICODE_IBM_1268=1006]="ISO_UNICODE_IBM_1268",n[n.ISO_UNICODE_IBM_1276=1007]="ISO_UNICODE_IBM_1276",n[n.ISO_UNICODE_IBM_1264=1008]="ISO_UNICODE_IBM_1264",n[n.ISO_UNICODE_IBM_1265=1009]="ISO_UNICODE_IBM_1265",n[n.UNICODE_1_1=1010]="UNICODE_1_1",n[n.SCSU=1011]="SCSU",n[n.UTF_7=1012]="UTF_7",n[n.UTF_16BE=1013]="UTF_16BE",n[n.UTF_16LE=1014]="UTF_16LE",n[n.UTF_16=1015]="UTF_16",n[n.CESU_8=1016]="CESU_8",n[n.UTF_32=1017]="UTF_32",n[n.UTF_32BE=1018]="UTF_32BE",n[n.UTF_32LE=1019]="UTF_32LE",n[n.BOCU_1=1020]="BOCU_1",n[n.ISO_8859_1_WINDOWS_3_0_LATIN_1=2e3]="ISO_8859_1_WINDOWS_3_0_LATIN_1",n[n.ISO_8859_1_WINDOWS_3_1_LATIN_1=2001]="ISO_8859_1_WINDOWS_3_1_LATIN_1",n[n.ISO_8859_2_WINDOWS_LATIN_2=2002]="ISO_8859_2_WINDOWS_LATIN_2",n[n.ISO_8859_9_WINDOWS_LATIN_5=2003]="ISO_8859_9_WINDOWS_LATIN_5",n[n.HP_ROMAN8=2004]="HP_ROMAN8",n[n.ADOBE_STANDARD_ENCODING=2005]="ADOBE_STANDARD_ENCODING",n[n.VENTURA_US=2006]="VENTURA_US",n[n.VENTURA_INTERNATIONAL=2007]="VENTURA_INTERNATIONAL",n[n.DEC_MCS=2008]="DEC_MCS",n[n.IBM850=2009]="IBM850",n[n.IBM852=2010]="IBM852",n[n.IBM437=2011]="IBM437",n[n.PC8_DANISH_NORWEGIAN=2012]="PC8_DANISH_NORWEGIAN",n[n.IBM862=2013]="IBM862",n[n.PC8_TURKISH=2014]="PC8_TURKISH",n[n.IBM_SYMBOLS=2015]="IBM_SYMBOLS",n[n.IBM_THAI=2016]="IBM_THAI",n[n.HP_LEGAL=2017]="HP_LEGAL",n[n.HP_PI_FONT=2018]="HP_PI_FONT",n[n.HP_MATH8=2019]="HP_MATH8",n[n.ADOBE_SYMBOL_ENCODING=2020]="ADOBE_SYMBOL_ENCODING",n[n.HP_DESKTOP=2021]="HP_DESKTOP",n[n.VENTURA_MATH=2022]="VENTURA_MATH",n[n.MICROSOFT_PUBLISHING=2023]="MICROSOFT_PUBLISHING",n[n.WINDOWS_31J=2024]="WINDOWS_31J",n[n.GB2312=2025]="GB2312",n[n.BIG5=2026]="BIG5",n[n.MACINTOSH=2027]="MACINTOSH",n[n.IBM037=2028]="IBM037",n[n.IBM038=2029]="IBM038",n[n.IBM273=2030]="IBM273",n[n.IBM274=2031]="IBM274",n[n.IBM275=2032]="IBM275",n[n.IBM277=2033]="IBM277",n[n.IBM278=2034]="IBM278",n[n.IBM280=2035]="IBM280",n[n.IBM281=2036]="IBM281",n[n.IBM284=2037]="IBM284",n[n.IBM285=2038]="IBM285",n[n.IBM290=2039]="IBM290",n[n.IBM297=2040]="IBM297",n[n.IBM420=2041]="IBM420",n[n.IBM423=2042]="IBM423",n[n.IBM424=2043]="IBM424",n[n.IBM500=2044]="IBM500",n[n.IBM851=2045]="IBM851",n[n.IBM855=2046]="IBM855",n[n.IBM857=2047]="IBM857",n[n.IBM860=2048]="IBM860",n[n.IBM861=2049]="IBM861",n[n.IBM863=2050]="IBM863",n[n.IBM864=2051]="IBM864",n[n.IBM865=2052]="IBM865",n[n.IBM868=2053]="IBM868",n[n.IBM869=2054]="IBM869",n[n.IBM870=2055]="IBM870",n[n.IBM871=2056]="IBM871",n[n.IBM880=2057]="IBM880",n[n.IBM891=2058]="IBM891",n[n.IBM903=2059]="IBM903",n[n.IBM904=2060]="IBM904",n[n.IBM905=2061]="IBM905",n[n.IBM918=2062]="IBM918",n[n.IBM1026=2063]="IBM1026",n[n.EBCDIC_AT_DE=2064]="EBCDIC_AT_DE",n[n.EBCDIC_AT_DE_A=2065]="EBCDIC_AT_DE_A",n[n.EBCDIC_CA_FR=2066]="EBCDIC_CA_FR",n[n.EBCDIC_DK_NO=2067]="EBCDIC_DK_NO",n[n.EBCDIC_DK_NO_A=2068]="EBCDIC_DK_NO_A",n[n.EBCDIC_FI_SE=2069]="EBCDIC_FI_SE",n[n.EBCDIC_FI_SE_A=2070]="EBCDIC_FI_SE_A",n[n.EBCDIC_FR=2071]="EBCDIC_FR",n[n.EBCDIC_IT=2072]="EBCDIC_IT",n[n.EBCDIC_PT=2073]="EBCDIC_PT",n[n.EBCDIC_ES=2074]="EBCDIC_ES",n[n.EBCDIC_ES_A=2075]="EBCDIC_ES_A",n[n.EBCDIC_ES_S=2076]="EBCDIC_ES_S",n[n.EBCDIC_UK=2077]="EBCDIC_UK",n[n.EBCDIC_US=2078]="EBCDIC_US",n[n.UNKNOWN_8BIT=2079]="UNKNOWN_8BIT",n[n.MNEMONIC=2080]="MNEMONIC",n[n.MNEM=2081]="MNEM",n[n.VISCII=2082]="VISCII",n[n.VIQR=2083]="VIQR",n[n.KOI8_R=2084]="KOI8_R",n[n.HZ_GB_2312=2085]="HZ_GB_2312",n[n.IBM866=2086]="IBM866",n[n.IBM775=2087]="IBM775",n[n.KOI8_U=2088]="KOI8_U",n[n.IBM00858=2089]="IBM00858",n[n.IBM00924=2090]="IBM00924",n[n.IBM01140=2091]="IBM01140",n[n.IBM01141=2092]="IBM01141",n[n.IBM01142=2093]="IBM01142",n[n.IBM01143=2094]="IBM01143",n[n.IBM01144=2095]="IBM01144",n[n.IBM01145=2096]="IBM01145",n[n.IBM01146=2097]="IBM01146",n[n.IBM01147=2098]="IBM01147",n[n.IBM01148=2099]="IBM01148",n[n.IBM01149=2100]="IBM01149",n[n.BIG5_HKSCS=2101]="BIG5_HKSCS",n[n.IBM1047=2102]="IBM1047",n[n.PTCP154=2103]="PTCP154",n[n.AMIGA_1251=2104]="AMIGA_1251",n[n.KOI7_SWITCHED=2105]="KOI7_SWITCHED",n[n.BRF=2106]="BRF",n[n.TSCII=2107]="TSCII",n[n.CP51932=2108]="CP51932",n[n.WINDOWS_874=2109]="WINDOWS_874",n[n.WINDOWS_1250=2250]="WINDOWS_1250",n[n.WINDOWS_1251=2251]="WINDOWS_1251",n[n.WINDOWS_1252=2252]="WINDOWS_1252",n[n.WINDOWS_1253=2253]="WINDOWS_1253",n[n.WINDOWS_1254=2254]="WINDOWS_1254",n[n.WINDOWS_1255=2255]="WINDOWS_1255",n[n.WINDOWS_1256=2256]="WINDOWS_1256",n[n.WINDOWS_1257=2257]="WINDOWS_1257",n[n.WINDOWS_1258=2258]="WINDOWS_1258",n[n.TIS_620=2259]="TIS_620",n[n.CP50220=2260]="CP50220",n))(Wn||{});const Mn="2013-01-23",jn={3:["US-ASCII","iso-ir-6","ANSI_X3.4-1968","ANSI_X3.4-1986","ISO_646.irv:1991","ISO646-US","us","IBM367","cp367","csASCII"],4:["ISO_8859-1:1987","iso-ir-100","ISO_8859-1","ISO-8859-1","latin1","l1","IBM819","CP819","csISOLatin1"],5:["ISO_8859-2:1987","iso-ir-101","ISO_8859-2","ISO-8859-2","latin2","l2","csISOLatin2"],6:["ISO_8859-3:1988","iso-ir-109","ISO_8859-3","ISO-8859-3","latin3","l3","csISOLatin3"],7:["ISO_8859-4:1988","iso-ir-110","ISO_8859-4","ISO-8859-4","latin4","l4","csISOLatin4"],8:["ISO_8859-5:1988","iso-ir-144","ISO_8859-5","ISO-8859-5","cyrillic","csISOLatinCyrillic"],9:["ISO_8859-6:1987","iso-ir-127","ISO_8859-6","ISO-8859-6","ECMA-114","ASMO-708","arabic","csISOLatinArabic"],10:["ISO_8859-7:1987","iso-ir-126","ISO_8859-7","ISO-8859-7","ELOT_928","ECMA-118","greek","greek8","csISOLatinGreek"],11:["ISO_8859-8:1988","iso-ir-138","ISO_8859-8","ISO-8859-8","hebrew","csISOLatinHebrew"],12:["ISO_8859-9:1989","iso-ir-148","ISO_8859-9","ISO-8859-9","latin5","l5","csISOLatin5"],13:["ISO-8859-10","iso-ir-157","l6","ISO_8859-10:1992","csISOLatin6","latin6"],14:["ISO_6937-2-add","iso-ir-142","csISOTextComm"],15:["JIS_X0201","X0201","csHalfWidthKatakana"],16:["JIS_Encoding","csJISEncoding"],17:["Shift_JIS","MS_Kanji","csShiftJIS"],18:["Extended_UNIX_Code_Packed_Format_for_Japanese","csEUCPkdFmtJapanese","EUC-JP"],19:["Extended_UNIX_Code_Fixed_Width_for_Japanese","csEUCFixWidJapanese"],20:["BS_4730","iso-ir-4","ISO646-GB","gb","uk","csISO4UnitedKingdom"],21:["SEN_850200_C","iso-ir-11","ISO646-SE2","se2","csISO11SwedishForNames"],22:["IT","iso-ir-15","ISO646-IT","csISO15Italian"],23:["ES","iso-ir-17","ISO646-ES","csISO17Spanish"],24:["DIN_66003","iso-ir-21","de","ISO646-DE","csISO21German"],25:["NS_4551-1","iso-ir-60","ISO646-NO","no","csISO60DanishNorwegian","csISO60Norwegian1"],26:["NF_Z_62-010","iso-ir-69","ISO646-FR","fr","csISO69French"],27:["ISO-10646-UTF-1","csISO10646UTF1"],28:["ISO_646.basic:1983","ref","csISO646basic1983"],29:["INVARIANT","csINVARIANT"],30:["ISO_646.irv:1983","iso-ir-2","irv","csISO2IntlRefVersion"],31:["NATS-SEFI","iso-ir-8-1","csNATSSEFI"],32:["NATS-SEFI-ADD","iso-ir-8-2","csNATSSEFIADD"],33:["NATS-DANO","iso-ir-9-1","csNATSDANO"],34:["NATS-DANO-ADD","iso-ir-9-2","csNATSDANOADD"],35:["SEN_850200_B","iso-ir-10","FI","ISO646-FI","ISO646-SE","se","csISO10Swedish"],36:["KS_C_5601-1987","iso-ir-149","KS_C_5601-1989","KSC_5601","korean","csKSC56011987"],37:["ISO-2022-KR","csISO2022KR"],38:["EUC-KR","csEUCKR"],39:["ISO-2022-JP","csISO2022JP"],40:["ISO-2022-JP-2","csISO2022JP2"],41:["JIS_C6220-1969-jp","JIS_C6220-1969","iso-ir-13","katakana","x0201-7","csISO13JISC6220jp"],42:["JIS_C6220-1969-ro","iso-ir-14","jp","ISO646-JP","csISO14JISC6220ro"],43:["PT","iso-ir-16","ISO646-PT","csISO16Portuguese"],44:["greek7-old","iso-ir-18","csISO18Greek7Old"],45:["latin-greek","iso-ir-19","csISO19LatinGreek"],46:["NF_Z_62-010_(1973)","iso-ir-25","ISO646-FR1","csISO25French"],47:["Latin-greek-1","iso-ir-27","csISO27LatinGreek1"],48:["ISO_5427","iso-ir-37","csISO5427Cyrillic"],49:["JIS_C6226-1978","iso-ir-42","csISO42JISC62261978"],50:["BS_viewdata","iso-ir-47","csISO47BSViewdata"],51:["INIS","iso-ir-49","csISO49INIS"],52:["INIS-8","iso-ir-50","csISO50INIS8"],53:["INIS-cyrillic","iso-ir-51","csISO51INISCyrillic"],54:["ISO_5427:1981","iso-ir-54","ISO5427Cyrillic1981","csISO54271981"],55:["ISO_5428:1980","iso-ir-55","csISO5428Greek"],56:["GB_1988-80","iso-ir-57","cn","ISO646-CN","csISO57GB1988"],57:["GB_2312-80","iso-ir-58","chinese","csISO58GB231280"],58:["NS_4551-2","ISO646-NO2","iso-ir-61","no2","csISO61Norwegian2"],59:["videotex-suppl","iso-ir-70","csISO70VideotexSupp1"],60:["PT2","iso-ir-84","ISO646-PT2","csISO84Portuguese2"],61:["ES2","iso-ir-85","ISO646-ES2","csISO85Spanish2"],62:["MSZ_7795.3","iso-ir-86","ISO646-HU","hu","csISO86Hungarian"],63:["JIS_C6226-1983","iso-ir-87","x0208","JIS_X0208-1983","csISO87JISX0208"],64:["greek7","iso-ir-88","csISO88Greek7"],65:["ASMO_449","ISO_9036","arabic7","iso-ir-89","csISO89ASMO449"],66:["iso-ir-90","csISO90"],67:["JIS_C6229-1984-a","iso-ir-91","jp-ocr-a","csISO91JISC62291984a"],68:["JIS_C6229-1984-b","iso-ir-92","ISO646-JP-OCR-B","jp-ocr-b","csISO92JISC62991984b"],69:["JIS_C6229-1984-b-add","iso-ir-93","jp-ocr-b-add","csISO93JIS62291984badd"],70:["JIS_C6229-1984-hand","iso-ir-94","jp-ocr-hand","csISO94JIS62291984hand"],71:["JIS_C6229-1984-hand-add","iso-ir-95","jp-ocr-hand-add","csISO95JIS62291984handadd"],72:["JIS_C6229-1984-kana","iso-ir-96","csISO96JISC62291984kana"],73:["ISO_2033-1983","iso-ir-98","e13b","csISO2033"],74:["ANSI_X3.110-1983","iso-ir-99","CSA_T500-1983","NAPLPS","csISO99NAPLPS"],75:["T.61-7bit","iso-ir-102","csISO102T617bit"],76:["T.61-8bit","T.61","iso-ir-103","csISO103T618bit"],77:["ECMA-cyrillic","iso-ir-111","KOI8-E","csISO111ECMACyrillic"],78:["CSA_Z243.4-1985-1","iso-ir-121","ISO646-CA","csa7-1","csa71","ca","csISO121Canadian1"],79:["CSA_Z243.4-1985-2","iso-ir-122","ISO646-CA2","csa7-2","csa72","csISO122Canadian2"],80:["CSA_Z243.4-1985-gr","iso-ir-123","csISO123CSAZ24341985gr"],81:["ISO_8859-6-E","csISO88596E","ISO-8859-6-E"],82:["ISO_8859-6-I","csISO88596I","ISO-8859-6-I"],83:["T.101-G2","iso-ir-128","csISO128T101G2"],84:["ISO_8859-8-E","csISO88598E","ISO-8859-8-E"],85:["ISO_8859-8-I","csISO88598I","ISO-8859-8-I"],86:["CSN_369103","iso-ir-139","csISO139CSN369103"],87:["JUS_I.B1.002","iso-ir-141","ISO646-YU","js","yu","csISO141JUSIB1002"],88:["IEC_P27-1","iso-ir-143","csISO143IECP271"],89:["JUS_I.B1.003-serb","iso-ir-146","serbian","csISO146Serbian"],90:["JUS_I.B1.003-mac","macedonian","iso-ir-147","csISO147Macedonian"],91:["greek-ccitt","iso-ir-150","csISO150","csISO150GreekCCITT"],92:["NC_NC00-10:81","cuba","iso-ir-151","ISO646-CU","csISO151Cuba"],93:["ISO_6937-2-25","iso-ir-152","csISO6937Add"],94:["GOST_19768-74","ST_SEV_358-88","iso-ir-153","csISO153GOST1976874"],95:["ISO_8859-supp","iso-ir-154","latin1-2-5","csISO8859Supp"],96:["ISO_10367-box","iso-ir-155","csISO10367Box"],97:["latin-lap","lap","iso-ir-158","csISO158Lap"],98:["JIS_X0212-1990","x0212","iso-ir-159","csISO159JISX02121990"],99:["DS_2089","DS2089","ISO646-DK","dk","csISO646Danish"],100:["us-dk","csUSDK"],101:["dk-us","csDKUS"],102:["KSC5636","ISO646-KR","csKSC5636"],103:["UNICODE-1-1-UTF-7","csUnicode11UTF7"],104:["ISO-2022-CN","csISO2022CN"],105:["ISO-2022-CN-EXT","csISO2022CNEXT"],106:["UTF-8","csUTF8"],109:["ISO-8859-13","csISO885913"],110:["ISO-8859-14","iso-ir-199","ISO_8859-14:1998","ISO_8859-14","latin8","iso-celtic","l8","csISO885914"],111:["ISO-8859-15","ISO_8859-15","Latin-9","csISO885915"],112:["ISO-8859-16","iso-ir-226","ISO_8859-16:2001","ISO_8859-16","latin10","l10","csISO885916"],113:["GBK","CP936","MS936","windows-936","csGBK"],114:["GB18030","csGB18030"],115:["OSD_EBCDIC_DF04_15","csOSDEBCDICDF0415"],116:["OSD_EBCDIC_DF03_IRV","csOSDEBCDICDF03IRV"],117:["OSD_EBCDIC_DF04_1","csOSDEBCDICDF041"],118:["ISO-11548-1","ISO_11548-1","ISO_TR_11548-1","csISO115481"],119:["KZ-1048","STRK1048-2002","RK1048","csKZ1048"],1e3:["ISO-10646-UCS-2","csUnicode"],1001:["ISO-10646-UCS-4","csUCS4"],1002:["ISO-10646-UCS-Basic","csUnicodeASCII"],1003:["ISO-10646-Unicode-Latin1","csUnicodeLatin1","ISO-10646"],1004:["ISO-10646-J-1","csUnicodeJapanese"],1005:["ISO-Unicode-IBM-1261","csUnicodeIBM1261"],1006:["ISO-Unicode-IBM-1268","csUnicodeIBM1268"],1007:["ISO-Unicode-IBM-1276","csUnicodeIBM1276"],1008:["ISO-Unicode-IBM-1264","csUnicodeIBM1264"],1009:["ISO-Unicode-IBM-1265","csUnicodeIBM1265"],1010:["UNICODE-1-1","csUnicode11"],1011:["SCSU","csSCSU"],1012:["UTF-7","csUTF7"],1013:["UTF-16BE","csUTF16BE"],1014:["UTF-16LE","csUTF16LE"],1015:["UTF-16","csUTF16"],1016:["CESU-8","csCESU8","csCESU-8"],1017:["UTF-32","csUTF32"],1018:["UTF-32BE","csUTF32BE"],1019:["UTF-32LE","csUTF32LE"],1020:["BOCU-1","csBOCU1","csBOCU-1"],2e3:["ISO-8859-1-Windows-3.0-Latin-1","csWindows30Latin1"],2001:["ISO-8859-1-Windows-3.1-Latin-1","csWindows31Latin1"],2002:["ISO-8859-2-Windows-Latin-2","csWindows31Latin2"],2003:["ISO-8859-9-Windows-Latin-5","csWindows31Latin5"],2004:["hp-roman8","roman8","r8","csHPRoman8"],2005:["Adobe-Standard-Encoding","csAdobeStandardEncoding"],2006:["Ventura-US","csVenturaUS"],2007:["Ventura-International","csVenturaInternational"],2008:["DEC-MCS","dec","csDECMCS"],2009:["IBM850","cp850","850","csPC850Multilingual"],2010:["IBM852","cp852","852","csPCp852"],2011:["IBM437","cp437","437","csPC8CodePage437"],2012:["PC8-Danish-Norwegian","csPC8DanishNorwegian"],2013:["IBM862","cp862","862","csPC862LatinHebrew"],2014:["PC8-Turkish","csPC8Turkish"],2015:["IBM-Symbols","csIBMSymbols"],2016:["IBM-Thai","csIBMThai"],2017:["HP-Legal","csHPLegal"],2018:["HP-Pi-font","csHPPiFont"],2019:["HP-Math8","csHPMath8"],2020:["Adobe-Symbol-Encoding","csHPPSMath"],2021:["HP-DeskTop","csHPDesktop"],2022:["Ventura-Math","csVenturaMath"],2023:["Microsoft-Publishing","csMicrosoftPublishing"],2024:["Windows-31J","csWindows31J"],2025:["GB2312","csGB2312"],2026:["Big5","csBig5"],2027:["macintosh","mac","csMacintosh"],2028:["IBM037","cp037","ebcdic-cp-us","ebcdic-cp-ca","ebcdic-cp-wt","ebcdic-cp-nl","csIBM037"],2029:["IBM038","EBCDIC-INT","cp038","csIBM038"],2030:["IBM273","CP273","csIBM273"],2031:["IBM274","EBCDIC-BE","CP274","csIBM274"],2032:["IBM275","EBCDIC-BR","cp275","csIBM275"],2033:["IBM277","EBCDIC-CP-DK","EBCDIC-CP-NO","csIBM277"],2034:["IBM278","CP278","ebcdic-cp-fi","ebcdic-cp-se","csIBM278"],2035:["IBM280","CP280","ebcdic-cp-it","csIBM280"],2036:["IBM281","EBCDIC-JP-E","cp281","csIBM281"],2037:["IBM284","CP284","ebcdic-cp-es","csIBM284"],2038:["IBM285","CP285","ebcdic-cp-gb","csIBM285"],2039:["IBM290","cp290","EBCDIC-JP-kana","csIBM290"],2040:["IBM297","cp297","ebcdic-cp-fr","csIBM297"],2041:["IBM420","cp420","ebcdic-cp-ar1","csIBM420"],2042:["IBM423","cp423","ebcdic-cp-gr","csIBM423"],2043:["IBM424","cp424","ebcdic-cp-he","csIBM424"],2044:["IBM500","CP500","ebcdic-cp-be","ebcdic-cp-ch","csIBM500"],2045:["IBM851","cp851","851","csIBM851"],2046:["IBM855","cp855","855","csIBM855"],2047:["IBM857","cp857","857","csIBM857"],2048:["IBM860","cp860","860","csIBM860"],2049:["IBM861","cp861","861","cp-is","csIBM861"],2050:["IBM863","cp863","863","csIBM863"],2051:["IBM864","cp864","csIBM864"],2052:["IBM865","cp865","865","csIBM865"],2053:["IBM868","CP868","cp-ar","csIBM868"],2054:["IBM869","cp869","869","cp-gr","csIBM869"],2055:["IBM870","CP870","ebcdic-cp-roece","ebcdic-cp-yu","csIBM870"],2056:["IBM871","CP871","ebcdic-cp-is","csIBM871"],2057:["IBM880","cp880","EBCDIC-Cyrillic","csIBM880"],2058:["IBM891","cp891","csIBM891"],2059:["IBM903","cp903","csIBM903"],2060:["IBM904","cp904","904","csIBBM904"],2061:["IBM905","CP905","ebcdic-cp-tr","csIBM905"],2062:["IBM918","CP918","ebcdic-cp-ar2","csIBM918"],2063:["IBM1026","CP1026","csIBM1026"],2064:["EBCDIC-AT-DE","csIBMEBCDICATDE"],2065:["EBCDIC-AT-DE-A","csEBCDICATDEA"],2066:["EBCDIC-CA-FR","csEBCDICCAFR"],2067:["EBCDIC-DK-NO","csEBCDICDKNO"],2068:["EBCDIC-DK-NO-A","csEBCDICDKNOA"],2069:["EBCDIC-FI-SE","csEBCDICFISE"],2070:["EBCDIC-FI-SE-A","csEBCDICFISEA"],2071:["EBCDIC-FR","csEBCDICFR"],2072:["EBCDIC-IT","csEBCDICIT"],2073:["EBCDIC-PT","csEBCDICPT"],2074:["EBCDIC-ES","csEBCDICES"],2075:["EBCDIC-ES-A","csEBCDICESA"],2076:["EBCDIC-ES-S","csEBCDICESS"],2077:["EBCDIC-UK","csEBCDICUK"],2078:["EBCDIC-US","csEBCDICUS"],2079:["UNKNOWN-8BIT","csUnknown8BiT"],2080:["MNEMONIC","csMnemonic"],2081:["MNEM","csMnem"],2082:["VISCII","csVISCII"],2083:["VIQR","csVIQR"],2084:["KOI8-R","csKOI8R"],2085:["HZ-GB-2312"],2086:["IBM866","cp866","866","csIBM866"],2087:["IBM775","cp775","csPC775Baltic"],2088:["KOI8-U","csKOI8U"],2089:["IBM00858","CCSID00858","CP00858","PC-Multilingual-850+euro","csIBM00858"],2090:["IBM00924","CCSID00924","CP00924","ebcdic-Latin9--euro","csIBM00924"],2091:["IBM01140","CCSID01140","CP01140","ebcdic-us-37+euro","csIBM01140"],2092:["IBM01141","CCSID01141","CP01141","ebcdic-de-273+euro","csIBM01141"],2093:["IBM01142","CCSID01142","CP01142","ebcdic-dk-277+euro","ebcdic-no-277+euro","csIBM01142"],2094:["IBM01143","CCSID01143","CP01143","ebcdic-fi-278+euro","ebcdic-se-278+euro","csIBM01143"],2095:["IBM01144","CCSID01144","CP01144","ebcdic-it-280+euro","csIBM01144"],2096:["IBM01145","CCSID01145","CP01145","ebcdic-es-284+euro","csIBM01145"],2097:["IBM01146","CCSID01146","CP01146","ebcdic-gb-285+euro","csIBM01146"],2098:["IBM01147","CCSID01147","CP01147","ebcdic-fr-297+euro","csIBM01147"],2099:["IBM01148","CCSID01148","CP01148","ebcdic-international-500+euro","csIBM01148"],2100:["IBM01149","CCSID01149","CP01149","ebcdic-is-871+euro","csIBM01149"],2101:["Big5-HKSCS","csBig5HKSCS"],2102:["IBM1047","IBM-1047","csIBM1047"],2103:["PTCP154","csPTCP154","PT154","CP154","Cyrillic-Asian","csPTCP154"],2104:["Amiga-1251","Ami1251","Amiga1251","Ami-1251","csAmiga1251 (Aliases are provided for historical reasons and should not be used) [Malyshev]"],2105:["KOI7-switched","csKOI7switched"],2106:["BRF","csBRF"],2107:["TSCII","csTSCII"],2108:["CP51932","csCP51932"],2109:["windows-874","cswindows874"],2250:["windows-1250","cswindows1250"],2251:["windows-1251","cswindows1251"],2252:["windows-1252","cswindows1252"],2253:["windows-1253","cswindows1253"],2254:["windows-1254","cswindows1254"],2255:["windows-1255","cswindows1255"],2256:["windows-1256","cswindows1256"],2257:["windows-1257","cswindows1257"],2258:["windows-1258","cswindows1258"],2259:["TIS-620","csTIS620"],2260:["CP50220","csCP50220"]};/**
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
 * │ Module Name     │ lira/value_objects/data/code/characterSetCode
 * │ Filename        │ characterSetCode.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ CharacterSetCode: the UN/CEFACT D25A Binary Object Character Set_
 * │                 │ Code. Type (UN02000179) over the IANA character set list.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/code/characterSetCode
 * @file characterSetCode.ts
 * @author Gurpinder Gill
 * @license MIT
 */class Jn{constructor(a){c(this,"value");c(this,"codelist");c(this,"listAgencyId","379");c(this,"listVersionId",Mn);c(this,"listName","Character Set Code");this.codelist=a,this.value=String(a)}labels(){return jn[this.codelist]}}/**
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
 */var En=(n=>(n.APPLICATION_1D_INTERLEAVED_PARITYFEC="application/1d-interleaved-parityfec",n.APPLICATION_3GPDASH_QOE_REPORT_XML="application/3gpdash-qoe-report+xml",n.APPLICATION_3GPP_IMS_XML="application/3gpp-ims+xml",n.APPLICATION_3GPP_MBS_OBJECT_MANIFEST_JSON="application/3gpp-mbs-object-manifest+json",n.APPLICATION_3GPP_MBS_USER_SERVICE_DESCRIPTIONS_JSON="application/3gpp-mbs-user-service-descriptions+json",n.APPLICATION_3GPP_MEDIA_DELIVERY_METRICS_REPORT_JSON="application/3gpp-media-delivery-metrics-report+json",n.APPLICATION_3GPPHAL_JSON="application/3gppHal+json",n.APPLICATION_3GPPHALFORMS_JSON="application/3gppHalForms+json",n.APPLICATION_AAS_ZIP="application/aas+zip",n.APPLICATION_A2L="application/A2L",n.APPLICATION_ACE_GROUPCOMM_CBOR="application/ace-groupcomm+cbor",n.APPLICATION_ACE_TRL_CBOR="application/ace-trl+cbor",n.APPLICATION_ACE_CBOR="application/ace+cbor",n.APPLICATION_ACE_JSON="application/ace+json",n.APPLICATION_ACTIVEMESSAGE="application/activemessage",n.APPLICATION_ACTIVITY_JSON="application/activity+json",n.APPLICATION_AIF_CBOR="application/aif+cbor",n.APPLICATION_AIF_JSON="application/aif+json",n.APPLICATION_ALTO_CDNI_JSON="application/alto-cdni+json",n.APPLICATION_ALTO_CDNIFILTER_JSON="application/alto-cdnifilter+json",n.APPLICATION_ALTO_COSTMAP_JSON="application/alto-costmap+json",n.APPLICATION_ALTO_COSTMAPFILTER_JSON="application/alto-costmapfilter+json",n.APPLICATION_ALTO_DIRECTORY_JSON="application/alto-directory+json",n.APPLICATION_ALTO_ENDPOINTPROP_JSON="application/alto-endpointprop+json",n.APPLICATION_ALTO_ENDPOINTPROPPARAMS_JSON="application/alto-endpointpropparams+json",n.APPLICATION_ALTO_ENDPOINTCOST_JSON="application/alto-endpointcost+json",n.APPLICATION_ALTO_ENDPOINTCOSTPARAMS_JSON="application/alto-endpointcostparams+json",n.APPLICATION_ALTO_ERROR_JSON="application/alto-error+json",n.APPLICATION_ALTO_NETWORKMAPFILTER_JSON="application/alto-networkmapfilter+json",n.APPLICATION_ALTO_NETWORKMAP_JSON="application/alto-networkmap+json",n.APPLICATION_ALTO_PROPMAP_JSON="application/alto-propmap+json",n.APPLICATION_ALTO_PROPMAPPARAMS_JSON="application/alto-propmapparams+json",n.APPLICATION_ALTO_TIPS_JSON="application/alto-tips+json",n.APPLICATION_ALTO_TIPSPARAMS_JSON="application/alto-tipsparams+json",n.APPLICATION_ALTO_UPDATESTREAMCONTROL_JSON="application/alto-updatestreamcontrol+json",n.APPLICATION_ALTO_UPDATESTREAMPARAMS_JSON="application/alto-updatestreamparams+json",n.APPLICATION_AML="application/AML",n.APPLICATION_ANDREW_INSET="application/andrew-inset",n.APPLICATION_APPLEFILE="application/applefile",n.APPLICATION_ASYNCAPI_JSON="application/asyncapi+json",n.APPLICATION_ASYNCAPI_YAML="application/asyncapi+yaml",n.APPLICATION_AT_JWT="application/at+jwt",n.APPLICATION_ATF="application/ATF",n.APPLICATION_ATFX="application/ATFX",n.APPLICATION_ATOM_XML="application/atom+xml",n.APPLICATION_ATOMCAT_XML="application/atomcat+xml",n.APPLICATION_ATOMDELETED_XML="application/atomdeleted+xml",n.APPLICATION_ATOMICMAIL="application/atomicmail",n.APPLICATION_ATOMSVC_XML="application/atomsvc+xml",n.APPLICATION_ATSC_DWD_XML="application/atsc-dwd+xml",n.APPLICATION_ATSC_DYNAMIC_EVENT_MESSAGE="application/atsc-dynamic-event-message",n.APPLICATION_ATSC_HELD_XML="application/atsc-held+xml",n.APPLICATION_ATSC_RDT_JSON="application/atsc-rdt+json",n.APPLICATION_ATSC_RSAT_XML="application/atsc-rsat+xml",n.APPLICATION_ATXML="application/ATXML",n.APPLICATION_AUTH_POLICY_XML="application/auth-policy+xml",n.APPLICATION_AUTOMATIONML_AML_XML="application/automationml-aml+xml",n.APPLICATION_AUTOMATIONML_AMLX_ZIP="application/automationml-amlx+zip",n.APPLICATION_BACNET_XDD_ZIP="application/bacnet-xdd+zip",n.APPLICATION_BATCH_SMTP="application/batch-SMTP",n.APPLICATION_BEEP_XML="application/beep+xml",n.APPLICATION_BUFR="application/bufr",n.APPLICATION_C2PA="application/c2pa",n.APPLICATION_CALENDAR_JSON="application/calendar+json",n.APPLICATION_CALENDAR_XML="application/calendar+xml",n.APPLICATION_CALL_COMPLETION="application/call-completion",n.APPLICATION_CALS_1840="application/CALS-1840",n.APPLICATION_CAPTIVE_JSON="application/captive+json",n.APPLICATION_CBOR="application/cbor",n.APPLICATION_CBOR_SEQ="application/cbor-seq",n.APPLICATION_CCCEX="application/cccex",n.APPLICATION_CCMP_XML="application/ccmp+xml",n.APPLICATION_CCXML_XML="application/ccxml+xml",n.APPLICATION_CDA_XML="application/cda+xml",n.APPLICATION_CDFX_XML="application/CDFX+XML",n.APPLICATION_CDMI_CAPABILITY="application/cdmi-capability",n.APPLICATION_CDMI_CONTAINER="application/cdmi-container",n.APPLICATION_CDMI_DOMAIN="application/cdmi-domain",n.APPLICATION_CDMI_OBJECT="application/cdmi-object",n.APPLICATION_CDMI_QUEUE="application/cdmi-queue",n.APPLICATION_CDNI="application/cdni",n.APPLICATION_CE_CBOR="application/ce+cbor",n.APPLICATION_CEA="application/CEA",n.APPLICATION_CEA_2018_XML="application/cea-2018+xml",n.APPLICATION_CELLML_XML="application/cellml+xml",n.APPLICATION_CFW="application/cfw",n.APPLICATION_CID="application/cid",n.APPLICATION_CID_EDHOC_CBOR_SEQ="application/cid-edhoc+cbor-seq",n.APPLICATION_CITY_JSON="application/city+json",n.APPLICATION_CITY_JSON_SEQ="application/city+json-seq",n.APPLICATION_CLIENT_AUTHENTICATION_JWT="application/client-authentication+jwt",n.APPLICATION_CLOUDEVENTS_BATCH_JSON="application/cloudevents-batch+json",n.APPLICATION_CLOUDEVENTS_JSON="application/cloudevents+json",n.APPLICATION_CLR="application/clr",n.APPLICATION_CLUE_INFO_XML="application/clue_info+xml",n.APPLICATION_CLUE_XML="application/clue+xml",n.APPLICATION_CMCD="application/cmcd",n.APPLICATION_CMS="application/cms",n.APPLICATION_CMW_CBOR="application/cmw+cbor",n.APPLICATION_CMW_COSE="application/cmw+cose",n.APPLICATION_CMW_JSON="application/cmw+json",n.APPLICATION_CMW_JWS="application/cmw+jws",n.APPLICATION_CNRP_XML="application/cnrp+xml",n.APPLICATION_COAP_EAP="application/coap-eap",n.APPLICATION_COAP_GROUP_JSON="application/coap-group+json",n.APPLICATION_COAP_PAYLOAD="application/coap-payload",n.APPLICATION_COMMONGROUND="application/commonground",n.APPLICATION_CONCISE_PROBLEM_DETAILS_CBOR="application/concise-problem-details+cbor",n.APPLICATION_CONFERENCE_INFO_XML="application/conference-info+xml",n.APPLICATION_CPL_XML="application/cpl+xml",n.APPLICATION_COSE="application/cose",n.APPLICATION_COSE_C509_CBOR="application/cose-c509+cbor",n.APPLICATION_COSE_C509_CERT_CBOR="application/cose-c509-cert+cbor",n.APPLICATION_COSE_C509_CRTEMPLATE_CBOR="application/cose-c509-crtemplate+cbor",n.APPLICATION_COSE_C509_PEM_CBOR="application/cose-c509-pem+cbor",n.APPLICATION_COSE_C509_PKCS10_CBOR="application/cose-c509-pkcs10+cbor",n.APPLICATION_COSE_C509_PRIVKEY_CBOR="application/cose-c509-privkey+cbor",n.APPLICATION_COSE_CERTHASH_CBOR="application/cose-certhash+cbor",n.APPLICATION_COSE_KEY="application/cose-key",n.APPLICATION_COSE_KEY_SET="application/cose-key-set",n.APPLICATION_COSE_X509="application/cose-x509",n.APPLICATION_CSRATTRS="application/csrattrs",n.APPLICATION_CSTA_XML="application/csta+xml",n.APPLICATION_CSTADATA_XML="application/CSTAdata+xml",n.APPLICATION_CSVM_JSON="application/csvm+json",n.APPLICATION_CWL="application/cwl",n.APPLICATION_CWL_JSON="application/cwl+json",n.APPLICATION_CWL_YAML="application/cwl+yaml",n.APPLICATION_CWT="application/cwt",n.APPLICATION_VND_CXTF="application/vnd.cxtf",n.APPLICATION_VND_CXZIP="application/vnd.cxzip",n.APPLICATION_CYBERCASH="application/cybercash",n.APPLICATION_DASH_XML="application/dash+xml",n.APPLICATION_DASH_PATCH_XML="application/dash-patch+xml",n.APPLICATION_DASHDELTA="application/dashdelta",n.APPLICATION_DAVMOUNT_XML="application/davmount+xml",n.APPLICATION_DCA_RFT="application/dca-rft",n.APPLICATION_DCD="application/DCD",n.APPLICATION_DEC_DX="application/dec-dx",n.APPLICATION_DIALOG_INFO_XML="application/dialog-info+xml",n.APPLICATION_DICOM="application/dicom",n.APPLICATION_DICOM_JSON="application/dicom+json",n.APPLICATION_DICOM_XML="application/dicom+xml",n.APPLICATION_DID="application/did",n.APPLICATION_DII="application/DII",n.APPLICATION_DIT="application/DIT",n.APPLICATION_DNS="application/dns",n.APPLICATION_DNS_JSON="application/dns+json",n.APPLICATION_DNS_MESSAGE="application/dns-message",n.APPLICATION_DOTS_CBOR="application/dots+cbor",n.APPLICATION_DPOP_JWT="application/dpop+jwt",n.APPLICATION_DSKPP_XML="application/dskpp+xml",n.APPLICATION_DSSC_DER="application/dssc+der",n.APPLICATION_DSSC_XML="application/dssc+xml",n.APPLICATION_DVCS="application/dvcs",n.APPLICATION_EAT_CWT="application/eat+cwt",n.APPLICATION_EAT_JWT="application/eat+jwt",n.APPLICATION_EAT_BUN_CBOR="application/eat-bun+cbor",n.APPLICATION_EAT_BUN_JSON="application/eat-bun+json",n.APPLICATION_EAT_UCS_CBOR="application/eat-ucs+cbor",n.APPLICATION_EAT_UCS_JSON="application/eat-ucs+json",n.APPLICATION_ECMASCRIPT="application/ecmascript",n.APPLICATION_EDHOC_CBOR_SEQ="application/edhoc+cbor-seq",n.APPLICATION_EDI_CONSENT="application/EDI-consent",n.APPLICATION_EDIFACT="application/EDIFACT",n.APPLICATION_EDI_X12="application/EDI-X12",n.APPLICATION_EFI="application/efi",n.APPLICATION_ELM_JSON="application/elm+json",n.APPLICATION_ELM_XML="application/elm+xml",n.APPLICATION_EMERGENCYCALLDATA_CAP_XML="application/EmergencyCallData.cap+xml",n.APPLICATION_EMERGENCYCALLDATA_COMMENT_XML="application/EmergencyCallData.Comment+xml",n.APPLICATION_EMERGENCYCALLDATA_CONTROL_XML="application/EmergencyCallData.Control+xml",n.APPLICATION_EMERGENCYCALLDATA_DEVICEINFO_XML="application/EmergencyCallData.DeviceInfo+xml",n.APPLICATION_EMERGENCYCALLDATA_ECALL_MSD="application/EmergencyCallData.eCall.MSD",n.APPLICATION_EMERGENCYCALLDATA_LEGACYESN_JSON="application/EmergencyCallData.LegacyESN+json",n.APPLICATION_EMERGENCYCALLDATA_PROVIDERINFO_XML="application/EmergencyCallData.ProviderInfo+xml",n.APPLICATION_EMERGENCYCALLDATA_SERVICEINFO_XML="application/EmergencyCallData.ServiceInfo+xml",n.APPLICATION_EMERGENCYCALLDATA_SUBSCRIBERINFO_XML="application/EmergencyCallData.SubscriberInfo+xml",n.APPLICATION_EMERGENCYCALLDATA_VEDS_XML="application/EmergencyCallData.VEDS+xml",n.APPLICATION_EMMA_XML="application/emma+xml",n.APPLICATION_EMOTIONML_XML="application/emotionml+xml",n.APPLICATION_ENCAPRTP="application/encaprtp",n.APPLICATION_ENTITY_STATEMENT_JWT="application/entity-statement+jwt",n.APPLICATION_EPP_XML="application/epp+xml",n.APPLICATION_EPUB_ZIP="application/epub+zip",n.APPLICATION_ESHOP="application/eshop",n.APPLICATION_EXAMPLE="application/example",n.APPLICATION_EXI="application/exi",n.APPLICATION_EXPECT_CT_REPORT_JSON="application/expect-ct-report+json",n.APPLICATION_EXPLICIT_REGISTRATION_RESPONSE_JWT="application/explicit-registration-response+jwt",n.APPLICATION_EXPRESS="application/express",n.APPLICATION_FASTINFOSET="application/fastinfoset",n.APPLICATION_FASTSOAP="application/fastsoap",n.APPLICATION_FDF="application/fdf",n.APPLICATION_FDT_XML="application/fdt+xml",n.APPLICATION_FHIR_JSON="application/fhir+json",n.APPLICATION_FHIR_XML="application/fhir+xml",n.APPLICATION_FITS="application/fits",n.APPLICATION_FLEXFEC="application/flexfec",n.APPLICATION_FONT_SFNT="application/font-sfnt",n.APPLICATION_FONT_TDPFR="application/font-tdpfr",n.APPLICATION_FONT_WOFF="application/font-woff",n.APPLICATION_FRAMEWORK_ATTRIBUTES_XML="application/framework-attributes+xml",n.APPLICATION_GEO_JSON="application/geo+json",n.APPLICATION_GEO_JSON_SEQ="application/geo+json-seq",n.APPLICATION_GEOFEED_CSV="application/geofeed+csv",n.APPLICATION_GEOPACKAGE_SQLITE3="application/geopackage+sqlite3",n.APPLICATION_GEOPOSE_JSON="application/geopose+json",n.APPLICATION_GEOXACML_JSON="application/geoxacml+json",n.APPLICATION_GEOXACML_XML="application/geoxacml+xml",n.APPLICATION_GLTF_BUFFER="application/gltf-buffer",n.APPLICATION_GML_XML="application/gml+xml",n.APPLICATION_GNAP_BINDING_JWS="application/gnap-binding-jws",n.APPLICATION_GNAP_BINDING_JWSD="application/gnap-binding-jwsd",n.APPLICATION_GNAP_BINDING_ROTATION_JWS="application/gnap-binding-rotation-jws",n.APPLICATION_GNAP_BINDING_ROTATION_JWSD="application/gnap-binding-rotation-jwsd",n.APPLICATION_GRIB="application/grib",n.APPLICATION_GZIP="application/gzip",n.APPLICATION_H224="application/H224",n.APPLICATION_HELD_XML="application/held+xml",n.APPLICATION_HL7V2_XML="application/hl7v2+xml",n.APPLICATION_HTTP="application/http",n.APPLICATION_HYPERSTUDIO="application/hyperstudio",n.APPLICATION_IBE_KEY_REQUEST_XML="application/ibe-key-request+xml",n.APPLICATION_IBE_PKG_REPLY_XML="application/ibe-pkg-reply+xml",n.APPLICATION_IBE_PP_DATA="application/ibe-pp-data",n.APPLICATION_IGES="application/iges",n.APPLICATION_IM_ISCOMPOSING_XML="application/im-iscomposing+xml",n.APPLICATION_INDEX="application/index",n.APPLICATION_INDEX_CMD="application/index.cmd",n.APPLICATION_INDEX_OBJ="application/index.obj",n.APPLICATION_INDEX_RESPONSE="application/index.response",n.APPLICATION_INDEX_VND="application/index.vnd",n.APPLICATION_INKML_XML="application/inkml+xml",n.APPLICATION_IOTP="application/IOTP",n.APPLICATION_IPFIX="application/ipfix",n.APPLICATION_IPP="application/ipp",n.APPLICATION_ISUP="application/ISUP",n.APPLICATION_ITS_XML="application/its+xml",n.APPLICATION_JAVA_ARCHIVE="application/java-archive",n.APPLICATION_JAVASCRIPT="application/javascript",n.APPLICATION_JF2FEED_JSON="application/jf2feed+json",n.APPLICATION_JOSE="application/jose",n.APPLICATION_JOSE_JSON="application/jose+json",n.APPLICATION_JRD_JSON="application/jrd+json",n.APPLICATION_JSCALENDAR_JSON="application/jscalendar+json",n.APPLICATION_JSCONTACT_JSON="application/jscontact+json",n.APPLICATION_JSON="application/json",n.APPLICATION_JSON_PATCH_JSON="application/json-patch+json",n.APPLICATION_JSON_PATCH_QUERY_JSON="application/json-patch-query+json",n.APPLICATION_JSON_SEQ="application/json-seq",n.APPLICATION_JSONPATH="application/jsonpath",n.APPLICATION_JUMBF="application/jumbf",n.APPLICATION_JWK_JSON="application/jwk+json",n.APPLICATION_JWK_SET_JSON="application/jwk-set+json",n.APPLICATION_JWK_SET_JWT="application/jwk-set+jwt",n.APPLICATION_JWT="application/jwt",n.APPLICATION_KB_JWT="application/kb+jwt",n.APPLICATION_KBL_XML="application/kbl+xml",n.APPLICATION_KPML_REQUEST_XML="application/kpml-request+xml",n.APPLICATION_KPML_RESPONSE_XML="application/kpml-response+xml",n.APPLICATION_LD_JSON="application/ld+json",n.APPLICATION_LGR_XML="application/lgr+xml",n.APPLICATION_LINK_FORMAT="application/link-format",n.APPLICATION_LINKSET="application/linkset",n.APPLICATION_LINKSET_JSON="application/linkset+json",n.APPLICATION_LOAD_CONTROL_XML="application/load-control+xml",n.APPLICATION_LOGOUT_JWT="application/logout+jwt",n.APPLICATION_LOST_XML="application/lost+xml",n.APPLICATION_LOSTSYNC_XML="application/lostsync+xml",n.APPLICATION_LPF_ZIP="application/lpf+zip",n.APPLICATION_LXF="application/LXF",n.APPLICATION_MAC_BINHEX40="application/mac-binhex40",n.APPLICATION_MACWRITEII="application/macwriteii",n.APPLICATION_MADS_XML="application/mads+xml",n.APPLICATION_MANIFEST_JSON="application/manifest+json",n.APPLICATION_MARC="application/marc",n.APPLICATION_MARCXML_XML="application/marcxml+xml",n.APPLICATION_MATHEMATICA="application/mathematica",n.APPLICATION_MATHML_XML="application/mathml+xml",n.APPLICATION_MATHML_CONTENT_XML="application/mathml-content+xml",n.APPLICATION_MATHML_PRESENTATION_XML="application/mathml-presentation+xml",n.APPLICATION_MBMS_ASSOCIATED_PROCEDURE_DESCRIPTION_XML="application/mbms-associated-procedure-description+xml",n.APPLICATION_MBMS_DEREGISTER_XML="application/mbms-deregister+xml",n.APPLICATION_MBMS_ENVELOPE_XML="application/mbms-envelope+xml",n.APPLICATION_MBMS_MSK_RESPONSE_XML="application/mbms-msk-response+xml",n.APPLICATION_MBMS_MSK_XML="application/mbms-msk+xml",n.APPLICATION_MBMS_PROTECTION_DESCRIPTION_XML="application/mbms-protection-description+xml",n.APPLICATION_MBMS_RECEPTION_REPORT_XML="application/mbms-reception-report+xml",n.APPLICATION_MBMS_REGISTER_RESPONSE_XML="application/mbms-register-response+xml",n.APPLICATION_MBMS_REGISTER_XML="application/mbms-register+xml",n.APPLICATION_MBMS_SCHEDULE_XML="application/mbms-schedule+xml",n.APPLICATION_MBMS_USER_SERVICE_DESCRIPTION_XML="application/mbms-user-service-description+xml",n.APPLICATION_MBOX="application/mbox",n.APPLICATION_MEASURED_COMPONENT_CBOR="application/measured-component+cbor",n.APPLICATION_MEASURED_COMPONENT_JSON="application/measured-component+json",n.APPLICATION_MEDIA_CONTROL_XML="application/media_control+xml",n.APPLICATION_MEDIA_POLICY_DATASET_XML="application/media-policy-dataset+xml",n.APPLICATION_MEDIASERVERCONTROL_XML="application/mediaservercontrol+xml",n.APPLICATION_MERGE_PATCH_JSON="application/merge-patch+json",n.APPLICATION_METALINK4_XML="application/metalink4+xml",n.APPLICATION_METS_XML="application/mets+xml",n.APPLICATION_MF4="application/MF4",n.APPLICATION_MIKEY="application/mikey",n.APPLICATION_MIPC="application/mipc",n.APPLICATION_MISSING_BLOCKS_CBOR_SEQ="application/missing-blocks+cbor-seq",n.APPLICATION_MMT_AEI_XML="application/mmt-aei+xml",n.APPLICATION_MMT_USD_XML="application/mmt-usd+xml",n.APPLICATION_MODS_XML="application/mods+xml",n.APPLICATION_MOSS_KEYS="application/moss-keys",n.APPLICATION_MOSS_SIGNATURE="application/moss-signature",n.APPLICATION_MOSSKEY_DATA="application/mosskey-data",n.APPLICATION_MOSSKEY_REQUEST="application/mosskey-request",n.APPLICATION_MP21="application/mp21",n.APPLICATION_MP4="application/mp4",n.APPLICATION_MPEG4_GENERIC="application/mpeg4-generic",n.APPLICATION_MPEG4_IOD="application/mpeg4-iod",n.APPLICATION_MPEG4_IOD_XMT="application/mpeg4-iod-xmt",n.APPLICATION_MRB_CONSUMER_XML="application/mrb-consumer+xml",n.APPLICATION_MRB_PUBLISH_XML="application/mrb-publish+xml",n.APPLICATION_MSC_IVR_XML="application/msc-ivr+xml",n.APPLICATION_MSC_MIXER_XML="application/msc-mixer+xml",n.APPLICATION_MSWORD="application/msword",n.APPLICATION_MUD_JSON="application/mud+json",n.APPLICATION_MULTIPART_CORE="application/multipart-core",n.APPLICATION_MXF="application/mxf",n.APPLICATION_N_QUADS="application/n-quads",n.APPLICATION_N_TRIPLES="application/n-triples",n.APPLICATION_NASDATA="application/nasdata",n.APPLICATION_NEWS_CHECKGROUPS="application/news-checkgroups",n.APPLICATION_NEWS_GROUPINFO="application/news-groupinfo",n.APPLICATION_NEWS_TRANSMISSION="application/news-transmission",n.APPLICATION_NLSML_XML="application/nlsml+xml",n.APPLICATION_NODE="application/node",n.APPLICATION_NSS="application/nss",n.APPLICATION_OAUTH_AUTHZ_REQ_JWT="application/oauth-authz-req+jwt",n.APPLICATION_OBLIVIOUS_DNS_MESSAGE="application/oblivious-dns-message",n.APPLICATION_OCSP_REQUEST="application/ocsp-request",n.APPLICATION_OCSP_RESPONSE="application/ocsp-response",n.APPLICATION_OCTET_STREAM="application/octet-stream",n.APPLICATION_ODA="application/ODA",n.APPLICATION_ODM_XML="application/odm+xml",n.APPLICATION_ODX="application/ODX",n.APPLICATION_OEBPS_PACKAGE_XML="application/oebps-package+xml",n.APPLICATION_OGG="application/ogg",n.APPLICATION_OHTTP_KEYS="application/ohttp-keys",n.APPLICATION_OPC_NODESET_XML="application/opc-nodeset+xml",n.APPLICATION_OSCORE="application/oscore",n.APPLICATION_OXPS="application/oxps",n.APPLICATION_P21="application/p21",n.APPLICATION_P21_ZIP="application/p21+zip",n.APPLICATION_P2P_OVERLAY_XML="application/p2p-overlay+xml",n.APPLICATION_PARITYFEC="application/parityfec",n.APPLICATION_PASSPORT="application/passport",n.APPLICATION_PATCH_OPS_ERROR_XML="application/patch-ops-error+xml",n.APPLICATION_PDF="application/pdf",n.APPLICATION_PDX="application/PDX",n.APPLICATION_PEM_CERTIFICATE_CHAIN="application/pem-certificate-chain",n.APPLICATION_PGP_ENCRYPTED="application/pgp-encrypted",n.APPLICATION_PGP_KEYS="application/pgp-keys",n.APPLICATION_PGP_SIGNATURE="application/pgp-signature",n.APPLICATION_PIDF_DIFF_XML="application/pidf-diff+xml",n.APPLICATION_PIDF_XML="application/pidf+xml",n.APPLICATION_PKCS10="application/pkcs10",n.APPLICATION_PKCS7_MIME="application/pkcs7-mime",n.APPLICATION_PKCS7_SIGNATURE="application/pkcs7-signature",n.APPLICATION_PKCS8="application/pkcs8",n.APPLICATION_PKCS8_ENCRYPTED="application/pkcs8-encrypted",n.APPLICATION_PKCS12="application/pkcs12",n.APPLICATION_PKIX_ATTR_CERT="application/pkix-attr-cert",n.APPLICATION_PKIX_CERT="application/pkix-cert",n.APPLICATION_PKIX_CRL="application/pkix-crl",n.APPLICATION_PKIX_PKIPATH="application/pkix-pkipath",n.APPLICATION_PKIXCMP="application/pkixcmp",n.APPLICATION_PLS_XML="application/pls+xml",n.APPLICATION_POC_SETTINGS_XML="application/poc-settings+xml",n.APPLICATION_POSTSCRIPT="application/postscript",n.APPLICATION_PPSP_TRACKER_JSON="application/ppsp-tracker+json",n.APPLICATION_PRIVATE_TOKEN_ISSUER_DIRECTORY="application/private-token-issuer-directory",n.APPLICATION_PRIVATE_TOKEN_REQUEST="application/private-token-request",n.APPLICATION_PRIVATE_TOKEN_RESPONSE="application/private-token-response",n.APPLICATION_PROBLEM_JSON="application/problem+json",n.APPLICATION_PROBLEM_XML="application/problem+xml",n.APPLICATION_PROTOBUF="application/protobuf",n.APPLICATION_PROTOBUF_JSON="application/protobuf+json",n.APPLICATION_PROVENANCE_XML="application/provenance+xml",n.APPLICATION_PROVIDED_CLAIMS_JWT="application/provided-claims+jwt",n.APPLICATION_PRS_ALVESTRAND_TITRAX_SHEET="application/prs.alvestrand.titrax-sheet",n.APPLICATION_PRS_ARCHIVE_MARKDOWN_FORMAT="application/prs.archive-markdown-format",n.APPLICATION_PRS_BWTC32KEY="application/prs.bwtc32key",n.APPLICATION_PRS_CWW="application/prs.cww",n.APPLICATION_PRS_CYN="application/prs.cyn",n.APPLICATION_PRS_HPUB_ZIP="application/prs.hpub+zip",n.APPLICATION_PRS_IMPLIED_DOCUMENT_XML="application/prs.implied-document+xml",n.APPLICATION_PRS_IMPLIED_EXECUTABLE="application/prs.implied-executable",n.APPLICATION_PRS_IMPLIED_OBJECT_JSON="application/prs.implied-object+json",n.APPLICATION_PRS_IMPLIED_OBJECT_JSON_SEQ="application/prs.implied-object+json-seq",n.APPLICATION_PRS_IMPLIED_OBJECT_YAML="application/prs.implied-object+yaml",n.APPLICATION_PRS_IMPLIED_STRUCTURE="application/prs.implied-structure",n.APPLICATION_PRS_MAYFILE="application/prs.mayfile",n.APPLICATION_PRS_NPREND="application/prs.nprend",n.APPLICATION_PRS_PLUCKER="application/prs.plucker",n.APPLICATION_PRS_RDF_XML_CRYPT="application/prs.rdf-xml-crypt",n.APPLICATION_PRS_SCLT="application/prs.sclt",n.APPLICATION_PRS_VCFBZIP2="application/prs.vcfbzip2",n.APPLICATION_PRS_XSF_XML="application/prs.xsf+xml",n.APPLICATION_PSKC_XML="application/pskc+xml",n.APPLICATION_PVD_JSON="application/pvd+json",n.APPLICATION_RDF_XML="application/rdf+xml",n.APPLICATION_ROUGHTIME_MALFEASANCE_JSON="application/roughtime-malfeasance+json",n.APPLICATION_ROUGHTIME_SERVER_JSON="application/roughtime-server+json",n.APPLICATION_ROUTE_APD_XML="application/route-apd+xml",n.APPLICATION_ROUTE_S_TSID_XML="application/route-s-tsid+xml",n.APPLICATION_ROUTE_USD_XML="application/route-usd+xml",n.APPLICATION_RPKI_CCR="application/rpki-ccr",n.APPLICATION_RPKI_CCR_GZIP="application/rpki-ccr+gzip",n.APPLICATION_QSIG="application/QSIG",n.APPLICATION_RAPTORFEC="application/raptorfec",n.APPLICATION_RDAP_JSON="application/rdap+json",n.APPLICATION_REGINFO_XML="application/reginfo+xml",n.APPLICATION_RELAX_NG_COMPACT_SYNTAX="application/relax-ng-compact-syntax",n.APPLICATION_REMOTE_PRINTING="application/remote-printing",n.APPLICATION_REPUTON_JSON="application/reputon+json",n.APPLICATION_RESOLVE_RESPONSE_JWT="application/resolve-response+jwt",n.APPLICATION_RESOURCE_LISTS_DIFF_XML="application/resource-lists-diff+xml",n.APPLICATION_RESOURCE_LISTS_XML="application/resource-lists+xml",n.APPLICATION_RFC_XML="application/rfc+xml",n.APPLICATION_RISCOS="application/riscos",n.APPLICATION_RLMI_XML="application/rlmi+xml",n.APPLICATION_RLS_SERVICES_XML="application/rls-services+xml",n.APPLICATION_RPKI_CHECKLIST="application/rpki-checklist",n.APPLICATION_RPKI_GHOSTBUSTERS="application/rpki-ghostbusters",n.APPLICATION_RPKI_MANIFEST="application/rpki-manifest",n.APPLICATION_RPKI_PUBLICATION="application/rpki-publication",n.APPLICATION_RPKI_ROA="application/rpki-roa",n.APPLICATION_RPKI_SIGNED_TAL="application/rpki-signed-tal",n.APPLICATION_RPKI_UPDOWN="application/rpki-updown",n.APPLICATION_RS_METADATA_XML="application/rs-metadata+xml",n.APPLICATION_RTF="application/rtf",n.APPLICATION_RTPLOOPBACK="application/rtploopback",n.APPLICATION_RTX="application/rtx",n.APPLICATION_SAMLASSERTION_XML="application/samlassertion+xml",n.APPLICATION_SAMLMETADATA_XML="application/samlmetadata+xml",n.APPLICATION_SARIF_EXTERNAL_PROPERTIES_JSON="application/sarif-external-properties+json",n.APPLICATION_SARIF_JSON="application/sarif+json",n.APPLICATION_SBE="application/sbe",n.APPLICATION_SBML_XML="application/sbml+xml",n.APPLICATION_SCAIP_XML="application/scaip+xml",n.APPLICATION_SCIM_JSON="application/scim+json",n.APPLICATION_SCITT_RECEIPT_COSE="application/scitt-receipt+cose",n.APPLICATION_SCITT_STATEMENT_COSE="application/scitt-statement+cose",n.APPLICATION_SCVP_CV_REQUEST="application/scvp-cv-request",n.APPLICATION_SCVP_CV_RESPONSE="application/scvp-cv-response",n.APPLICATION_SCVP_VP_REQUEST="application/scvp-vp-request",n.APPLICATION_SCVP_VP_RESPONSE="application/scvp-vp-response",n.APPLICATION_SD_JWT="application/sd-jwt",n.APPLICATION_SD_JWT_JSON="application/sd-jwt+json",n.APPLICATION_SDF_JSON="application/sdf+json",n.APPLICATION_SDP="application/sdp",n.APPLICATION_SECEVENT_JWT="application/secevent+jwt",n.APPLICATION_SENML_ETCH_CBOR="application/senml-etch+cbor",n.APPLICATION_SENML_ETCH_JSON="application/senml-etch+json",n.APPLICATION_SENML_EXI="application/senml-exi",n.APPLICATION_SENML_CBOR="application/senml+cbor",n.APPLICATION_SENML_JSON="application/senml+json",n.APPLICATION_SENML_XML="application/senml+xml",n.APPLICATION_SENSML_EXI="application/sensml-exi",n.APPLICATION_SENSML_CBOR="application/sensml+cbor",n.APPLICATION_SENSML_JSON="application/sensml+json",n.APPLICATION_SENSML_XML="application/sensml+xml",n.APPLICATION_SEP_EXI="application/sep-exi",n.APPLICATION_SEP_XML="application/sep+xml",n.APPLICATION_SESSION_INFO="application/session-info",n.APPLICATION_SET_PAYMENT="application/set-payment",n.APPLICATION_SET_PAYMENT_INITIATION="application/set-payment-initiation",n.APPLICATION_SET_REGISTRATION="application/set-registration",n.APPLICATION_SET_REGISTRATION_INITIATION="application/set-registration-initiation",n.APPLICATION_SGML="application/SGML",n.APPLICATION_SGML_OPEN_CATALOG="application/sgml-open-catalog",n.APPLICATION_SHF_XML="application/shf+xml",n.APPLICATION_SIEVE="application/sieve",n.APPLICATION_SIMPLE_FILTER_XML="application/simple-filter+xml",n.APPLICATION_SIMPLE_MESSAGE_SUMMARY="application/simple-message-summary",n.APPLICATION_SIMPLESYMBOLCONTAINER="application/simpleSymbolContainer",n.APPLICATION_SIPC="application/sipc",n.APPLICATION_SLATE="application/slate",n.APPLICATION_SMIL="application/smil",n.APPLICATION_SMIL_XML="application/smil+xml",n.APPLICATION_SMPTE336M="application/smpte336m",n.APPLICATION_SOAP_FASTINFOSET="application/soap+fastinfoset",n.APPLICATION_SOAP_XML="application/soap+xml",n.APPLICATION_SPARQL_QUERY="application/sparql-query",n.APPLICATION_SPDX_JSON="application/spdx+json",n.APPLICATION_SPDX3_JSON="application/spdx3+json",n.APPLICATION_SPARQL_RESULTS_XML="application/sparql-results+xml",n.APPLICATION_SPIRITS_EVENT_XML="application/spirits-event+xml",n.APPLICATION_SQL="application/sql",n.APPLICATION_SRGS="application/srgs",n.APPLICATION_SRGS_XML="application/srgs+xml",n.APPLICATION_SRU_XML="application/sru+xml",n.APPLICATION_SSLKEYLOGFILE="application/sslkeylogfile",n.APPLICATION_SSML_XML="application/ssml+xml",n.APPLICATION_ST2110_41="application/ST2110-41",n.APPLICATION_STATUSLIST_CWT="application/statuslist+cwt",n.APPLICATION_STATUSLIST_JWT="application/statuslist+jwt",n.APPLICATION_STIX_JSON="application/stix+json",n.APPLICATION_STRATUM="application/stratum",n.APPLICATION_SUIT_ENVELOPE_COSE="application/suit-envelope+cose",n.APPLICATION_SUIT_REPORT_COSE="application/suit-report+cose",n.APPLICATION_SWID_CBOR="application/swid+cbor",n.APPLICATION_SWID_XML="application/swid+xml",n.APPLICATION_SYSLOG_MSG="application/syslog-msg",n.APPLICATION_TAMP_APEX_UPDATE="application/tamp-apex-update",n.APPLICATION_TAMP_APEX_UPDATE_CONFIRM="application/tamp-apex-update-confirm",n.APPLICATION_TAMP_COMMUNITY_UPDATE="application/tamp-community-update",n.APPLICATION_TAMP_COMMUNITY_UPDATE_CONFIRM="application/tamp-community-update-confirm",n.APPLICATION_TAMP_ERROR="application/tamp-error",n.APPLICATION_TAMP_SEQUENCE_ADJUST="application/tamp-sequence-adjust",n.APPLICATION_TAMP_SEQUENCE_ADJUST_CONFIRM="application/tamp-sequence-adjust-confirm",n.APPLICATION_TAMP_STATUS_QUERY="application/tamp-status-query",n.APPLICATION_TAMP_STATUS_RESPONSE="application/tamp-status-response",n.APPLICATION_TAMP_UPDATE="application/tamp-update",n.APPLICATION_TAMP_UPDATE_CONFIRM="application/tamp-update-confirm",n.APPLICATION_TAXII_JSON="application/taxii+json",n.APPLICATION_TD_JSON="application/td+json",n.APPLICATION_TEEP_CBOR="application/teep+cbor",n.APPLICATION_TEI_XML="application/tei+xml",n.APPLICATION_TETRA_ISI="application/TETRA_ISI",n.APPLICATION_TEXINFO="application/texinfo",n.APPLICATION_THRAUD_XML="application/thraud+xml",n.APPLICATION_TIMESTAMP_QUERY="application/timestamp-query",n.APPLICATION_TIMESTAMP_REPLY="application/timestamp-reply",n.APPLICATION_TIMESTAMPED_DATA="application/timestamped-data",n.APPLICATION_TLSRPT_GZIP="application/tlsrpt+gzip",n.APPLICATION_TLSRPT_JSON="application/tlsrpt+json",n.APPLICATION_TM_JSON="application/tm+json",n.APPLICATION_TNAUTHLIST="application/tnauthlist",n.APPLICATION_TOC_CBOR="application/toc+cbor",n.APPLICATION_TOKEN_INTROSPECTION_JWT="application/token-introspection+jwt",n.APPLICATION_TOML="application/toml",n.APPLICATION_TRICKLE_ICE_SDPFRAG="application/trickle-ice-sdpfrag",n.APPLICATION_TRIG="application/trig",n.APPLICATION_TRUST_CHAIN_JSON="application/trust-chain+json",n.APPLICATION_TRUST_MARK_JWT="application/trust-mark+jwt",n.APPLICATION_TRUST_MARK_DELEGATION_JWT="application/trust-mark-delegation+jwt",n.APPLICATION_TRUST_MARK_STATUS_RESPONSE_JWT="application/trust-mark-status-response+jwt",n.APPLICATION_TTML_XML="application/ttml+xml",n.APPLICATION_TVE_TRIGGER="application/tve-trigger",n.APPLICATION_TZIF="application/tzif",n.APPLICATION_TZIF_LEAP="application/tzif-leap",n.APPLICATION_UCCS_CBOR="application/uccs+cbor",n.APPLICATION_UJCS_JSON="application/ujcs+json",n.APPLICATION_ULPFEC="application/ulpfec",n.APPLICATION_URC_GRPSHEET_XML="application/urc-grpsheet+xml",n.APPLICATION_URC_RESSHEET_XML="application/urc-ressheet+xml",n.APPLICATION_URC_TARGETDESC_XML="application/urc-targetdesc+xml",n.APPLICATION_URC_UISOCKETDESC_XML="application/urc-uisocketdesc+xml",n.APPLICATION_V3C="application/v3c",n.APPLICATION_VC="application/vc",n.APPLICATION_VC_COSE="application/vc+cose",n.APPLICATION_VC_JWT="application/vc+jwt",n.APPLICATION_VC_SD_JWT="application/vc+sd-jwt",n.APPLICATION_VCARD_JSON="application/vcard+json",n.APPLICATION_VCARD_XML="application/vcard+xml",n.APPLICATION_VEC_XML="application/vec+xml",n.APPLICATION_VEC_PACKAGE_GZIP="application/vec-package+gzip",n.APPLICATION_VEC_PACKAGE_ZIP="application/vec-package+zip",n.APPLICATION_VEMMI="application/vemmi",n.APPLICATION_VND_1000MINDS_DECISION_MODEL_XML="application/vnd.1000minds.decision-model+xml",n.APPLICATION_VND_1OB="application/vnd.1ob",n.APPLICATION_VND_3GPP_5GNAS="application/vnd.3gpp.5gnas",n.APPLICATION_VND_3GPP_5GSA2X="application/vnd.3gpp.5gsa2x",n.APPLICATION_VND_3GPP_5GSA2X_LOCAL_SERVICE_INFORMATION="application/vnd.3gpp.5gsa2x-local-service-information",n.APPLICATION_VND_3GPP_5GSV2X="application/vnd.3gpp.5gsv2x",n.APPLICATION_VND_3GPP_5GSV2X_LOCAL_SERVICE_INFORMATION="application/vnd.3gpp.5gsv2x-local-service-information",n.APPLICATION_VND_3GPP_ACCESS_TRANSFER_EVENTS_XML="application/vnd.3gpp.access-transfer-events+xml",n.APPLICATION_VND_3GPP_BSF_XML="application/vnd.3gpp.bsf+xml",n.APPLICATION_VND_3GPP_CRS_XML="application/vnd.3gpp.crs+xml",n.APPLICATION_VND_3GPP_CURRENT_LOCATION_DISCOVERY_XML="application/vnd.3gpp.current-location-discovery+xml",n.APPLICATION_VND_3GPP_GMOP_XML="application/vnd.3gpp.GMOP+xml",n.APPLICATION_VND_3GPP_GTPC="application/vnd.3gpp.gtpc",n.APPLICATION_VND_3GPP_INTERWORKING_DATA="application/vnd.3gpp.interworking-data",n.APPLICATION_VND_3GPP_LPP="application/vnd.3gpp.lpp",n.APPLICATION_VND_3GPP_MC_SIGNALLING_EAR="application/vnd.3gpp.mc-signalling-ear",n.APPLICATION_VND_3GPP_MCDATA_AFFILIATION_COMMAND_XML="application/vnd.3gpp.mcdata-affiliation-command+xml",n.APPLICATION_VND_3GPP_MCDATA_INFO_XML="application/vnd.3gpp.mcdata-info+xml",n.APPLICATION_VND_3GPP_MCDATA_MSGSTORE_CTRL_REQUEST_XML="application/vnd.3gpp.mcdata-msgstore-ctrl-request+xml",n.APPLICATION_VND_3GPP_MCDATA_PAYLOAD="application/vnd.3gpp.mcdata-payload",n.APPLICATION_VND_3GPP_MCDATA_REGROUP_XML="application/vnd.3gpp.mcdata-regroup+xml",n.APPLICATION_VND_3GPP_MCDATA_SERVICE_CONFIG_XML="application/vnd.3gpp.mcdata-service-config+xml",n.APPLICATION_VND_3GPP_MCDATA_SIGNALLING="application/vnd.3gpp.mcdata-signalling",n.APPLICATION_VND_3GPP_MCDATA_UE_CONFIG_XML="application/vnd.3gpp.mcdata-ue-config+xml",n.APPLICATION_VND_3GPP_MCDATA_USER_PROFILE_XML="application/vnd.3gpp.mcdata-user-profile+xml",n.APPLICATION_VND_3GPP_MCPTT_AFFILIATION_COMMAND_XML="application/vnd.3gpp.mcptt-affiliation-command+xml",n.APPLICATION_VND_3GPP_MCPTT_FLOOR_REQUEST_XML="application/vnd.3gpp.mcptt-floor-request+xml",n.APPLICATION_VND_3GPP_MCPTT_INFO_XML="application/vnd.3gpp.mcptt-info+xml",n.APPLICATION_VND_3GPP_MCPTT_LOCATION_INFO_XML="application/vnd.3gpp.mcptt-location-info+xml",n.APPLICATION_VND_3GPP_MCPTT_MBMS_USAGE_INFO_XML="application/vnd.3gpp.mcptt-mbms-usage-info+xml",n.APPLICATION_VND_3GPP_MCPTT_REGROUP_XML="application/vnd.3gpp.mcptt-regroup+xml",n.APPLICATION_VND_3GPP_MCPTT_SERVICE_CONFIG_XML="application/vnd.3gpp.mcptt-service-config+xml",n.APPLICATION_VND_3GPP_MCPTT_SIGNED_XML="application/vnd.3gpp.mcptt-signed+xml",n.APPLICATION_VND_3GPP_MCPTT_UE_CONFIG_XML="application/vnd.3gpp.mcptt-ue-config+xml",n.APPLICATION_VND_3GPP_MCPTT_UE_INIT_CONFIG_XML="application/vnd.3gpp.mcptt-ue-init-config+xml",n.APPLICATION_VND_3GPP_MCPTT_USER_PROFILE_XML="application/vnd.3gpp.mcptt-user-profile+xml",n.APPLICATION_VND_3GPP_MCS_LOCATION_USER_CONFIG_XML="application/vnd.3gpp.mcs-location-user-config+xml",n.APPLICATION_VND_3GPP_MCVIDEO_AFFILIATION_COMMAND_XML="application/vnd.3gpp.mcvideo-affiliation-command+xml",n.APPLICATION_VND_3GPP_MCVIDEO_AFFILIATION_INFO_XML="application/vnd.3gpp.mcvideo-affiliation-info+xml",n.APPLICATION_VND_3GPP_MCVIDEO_INFO_XML="application/vnd.3gpp.mcvideo-info+xml",n.APPLICATION_VND_3GPP_MCVIDEO_LOCATION_INFO_XML="application/vnd.3gpp.mcvideo-location-info+xml",n.APPLICATION_VND_3GPP_MCVIDEO_MBMS_USAGE_INFO_XML="application/vnd.3gpp.mcvideo-mbms-usage-info+xml",n.APPLICATION_VND_3GPP_MCVIDEO_REGROUP_XML="application/vnd.3gpp.mcvideo-regroup+xml",n.APPLICATION_VND_3GPP_MCVIDEO_SERVICE_CONFIG_XML="application/vnd.3gpp.mcvideo-service-config+xml",n.APPLICATION_VND_3GPP_MCVIDEO_TRANSMISSION_REQUEST_XML="application/vnd.3gpp.mcvideo-transmission-request+xml",n.APPLICATION_VND_3GPP_MCVIDEO_UE_CONFIG_XML="application/vnd.3gpp.mcvideo-ue-config+xml",n.APPLICATION_VND_3GPP_MCVIDEO_USER_PROFILE_XML="application/vnd.3gpp.mcvideo-user-profile+xml",n.APPLICATION_VND_3GPP_MID_CALL_XML="application/vnd.3gpp.mid-call+xml",n.APPLICATION_VND_3GPP_NGAP="application/vnd.3gpp.ngap",n.APPLICATION_VND_3GPP_PFCP="application/vnd.3gpp.pfcp",n.APPLICATION_VND_3GPP_PIC_BW_LARGE="application/vnd.3gpp.pic-bw-large",n.APPLICATION_VND_3GPP_PIC_BW_SMALL="application/vnd.3gpp.pic-bw-small",n.APPLICATION_VND_3GPP_PIC_BW_VAR="application/vnd.3gpp.pic-bw-var",n.APPLICATION_VND_3GPP_PINAPP_INFO_XML="application/vnd.3gpp.pinapp-info+xml",n.APPLICATION_VND_3GPP_PROSE_PC3A_XML="application/vnd.3gpp-prose-pc3a+xml",n.APPLICATION_VND_3GPP_PROSE_PC3ACH_XML="application/vnd.3gpp-prose-pc3ach+xml",n.APPLICATION_VND_3GPP_PROSE_PC3CH_XML="application/vnd.3gpp-prose-pc3ch+xml",n.APPLICATION_VND_3GPP_PROSE_PC8_XML="application/vnd.3gpp-prose-pc8+xml",n.APPLICATION_VND_3GPP_PROSE_XML="application/vnd.3gpp-prose+xml",n.APPLICATION_VND_3GPP_S1AP="application/vnd.3gpp.s1ap",n.APPLICATION_VND_3GPP_SEAL_APP_COMM_REQUIREMENTS_INFO_XML="application/vnd.3gpp.seal-app-comm-requirements-info+xml",n.APPLICATION_VND_3GPP_SEAL_DATA_DELIVERY_INFO_CBOR="application/vnd.3gpp.seal-data-delivery-info+cbor",n.APPLICATION_VND_3GPP_SEAL_DATA_DELIVERY_INFO_XML="application/vnd.3gpp.seal-data-delivery-info+xml",n.APPLICATION_VND_3GPP_SEAL_GROUP_DOC_XML="application/vnd.3gpp.seal-group-doc+xml",n.APPLICATION_VND_3GPP_SEAL_INFO_XML="application/vnd.3gpp.seal-info+xml",n.APPLICATION_VND_3GPP_SEAL_LOCATION_INFO_CBOR="application/vnd.3gpp.seal-location-info+cbor",n.APPLICATION_VND_3GPP_SEAL_LOCATION_INFO_XML="application/vnd.3gpp.seal-location-info+xml",n.APPLICATION_VND_3GPP_SEAL_MBMS_USAGE_INFO_XML="application/vnd.3gpp.seal-mbms-usage-info+xml",n.APPLICATION_VND_3GPP_SEAL_MBS_USAGE_INFO_XML="application/vnd.3gpp.seal-mbs-usage-info+xml",n.APPLICATION_VND_3GPP_SEAL_NETWORK_QOS_MANAGEMENT_INFO_XML="application/vnd.3gpp.seal-network-QoS-management-info+xml",n.APPLICATION_VND_3GPP_SEAL_NETWORK_RESOURCE_INFO_CBOR="application/vnd.3gpp.seal-network-resource-info+cbor",n.APPLICATION_VND_3GPP_SEAL_STORE_FORWARD_EVENTS_INFO_XML="application/vnd.3gpp.seal-store-forward-events-info+xml",n.APPLICATION_VND_3GPP_SEAL_UE_CONFIG_INFO_XML="application/vnd.3gpp.seal-ue-config-info+xml",n.APPLICATION_VND_3GPP_SEAL_UNICAST_INFO_XML="application/vnd.3gpp.seal-unicast-info+xml",n.APPLICATION_VND_3GPP_SEAL_USER_PROFILE_INFO_XML="application/vnd.3gpp.seal-user-profile-info+xml",n.APPLICATION_VND_3GPP_SMS="application/vnd.3gpp.sms",n.APPLICATION_VND_3GPP_SMS_XML="application/vnd.3gpp.sms+xml",n.APPLICATION_VND_3GPP_SRVCC_EXT_XML="application/vnd.3gpp.srvcc-ext+xml",n.APPLICATION_VND_3GPP_SRVCC_INFO_XML="application/vnd.3gpp.SRVCC-info+xml",n.APPLICATION_VND_3GPP_STATE_AND_EVENT_INFO_XML="application/vnd.3gpp.state-and-event-info+xml",n.APPLICATION_VND_3GPP_USSD_XML="application/vnd.3gpp.ussd+xml",n.APPLICATION_VND_3GPP_VAE_INFO_XML="application/vnd.3gpp.vae-info+xml",n.APPLICATION_VND_3GPP_V2X_LOCAL_SERVICE_INFORMATION="application/vnd.3gpp-v2x-local-service-information",n.APPLICATION_VND_3GPP2_BCMCSINFO_XML="application/vnd.3gpp2.bcmcsinfo+xml",n.APPLICATION_VND_3GPP2_SMS="application/vnd.3gpp2.sms",n.APPLICATION_VND_3GPP2_TCAP="application/vnd.3gpp2.tcap",n.APPLICATION_VND_3GPP_V2X="application/vnd.3gpp.v2x",n.APPLICATION_VND_3LIGHTSSOFTWARE_IMAGESCAL="application/vnd.3lightssoftware.imagescal",n.APPLICATION_VND_3M_POST_IT_NOTES="application/vnd.3M.Post-it-Notes",n.APPLICATION_VND_ABDALSECURITYGROUP_LOCKBOX="application/vnd.abdalsecuritygroup.lockbox",n.APPLICATION_VND_ACCPAC_SIMPLY_ASO="application/vnd.accpac.simply.aso",n.APPLICATION_VND_ACCPAC_SIMPLY_IMP="application/vnd.accpac.simply.imp",n.APPLICATION_VND_ACM_ADDRESSXFER_JSON="application/vnd.acm.addressxfer+json",n.APPLICATION_VND_ACM_CHATBOT_JSON="application/vnd.acm.chatbot+json",n.APPLICATION_VND_ACUCOBOL="application/vnd.acucobol",n.APPLICATION_VND_ACUCORP="application/vnd.acucorp",n.APPLICATION_VND_ADOBE_FLASH_MOVIE="application/vnd.adobe.flash.movie",n.APPLICATION_VND_ADOBE_FORMSCENTRAL_FCDT="application/vnd.adobe.formscentral.fcdt",n.APPLICATION_VND_ADOBE_FXP="application/vnd.adobe.fxp",n.APPLICATION_VND_ADOBE_PARTIAL_UPLOAD="application/vnd.adobe.partial-upload",n.APPLICATION_VND_ADOBE_XDP_XML="application/vnd.adobe.xdp+xml",n.APPLICATION_VND_AEP_ZIP="application/vnd.aep+zip",n.APPLICATION_VND_AETHEL_PACKAGE="application/vnd.aethel.package",n.APPLICATION_VND_AETHER_IMP="application/vnd.aether.imp",n.APPLICATION_VND_AFPC_AFPLINEDATA="application/vnd.afpc.afplinedata",n.APPLICATION_VND_AFPC_AFPLINEDATA_PAGEDEF="application/vnd.afpc.afplinedata-pagedef",n.APPLICATION_VND_AFPC_CMOCA_CMRESOURCE="application/vnd.afpc.cmoca-cmresource",n.APPLICATION_VND_AFPC_FOCA_CHARSET="application/vnd.afpc.foca-charset",n.APPLICATION_VND_AFPC_FOCA_CODEDFONT="application/vnd.afpc.foca-codedfont",n.APPLICATION_VND_AFPC_FOCA_CODEPAGE="application/vnd.afpc.foca-codepage",n.APPLICATION_VND_AFPC_MODCA="application/vnd.afpc.modca",n.APPLICATION_VND_AFPC_MODCA_CMTABLE="application/vnd.afpc.modca-cmtable",n.APPLICATION_VND_AFPC_MODCA_FORMDEF="application/vnd.afpc.modca-formdef",n.APPLICATION_VND_AFPC_MODCA_MEDIUMMAP="application/vnd.afpc.modca-mediummap",n.APPLICATION_VND_AFPC_MODCA_OBJECTCONTAINER="application/vnd.afpc.modca-objectcontainer",n.APPLICATION_VND_AFPC_MODCA_OVERLAY="application/vnd.afpc.modca-overlay",n.APPLICATION_VND_AFPC_MODCA_PAGESEGMENT="application/vnd.afpc.modca-pagesegment",n.APPLICATION_VND_AGE="application/vnd.age",n.APPLICATION_VND_AGENTMUG_AGENT_JSON="application/vnd.agentmug.agent+json",n.APPLICATION_VND_AGTP_IDENTITY_JSON="application/vnd.agtp.identity+json",n.APPLICATION_VND_AGTP_IDENTITY_YAML="application/vnd.agtp.identity+yaml",n.APPLICATION_VND_AH_BARCODE="application/vnd.ah-barcode",n.APPLICATION_VND_AHEAD_SPACE="application/vnd.ahead.space",n.APPLICATION_VND_AIA="application/vnd.aia",n.APPLICATION_VND_AIRZIP_FILESECURE_AZF="application/vnd.airzip.filesecure.azf",n.APPLICATION_VND_AIRZIP_FILESECURE_AZS="application/vnd.airzip.filesecure.azs",n.APPLICATION_VND_AMADEUS_JSON="application/vnd.amadeus+json",n.APPLICATION_VND_AMAZON_MOBI8_EBOOK="application/vnd.amazon.mobi8-ebook",n.APPLICATION_VND_AMERICANDYNAMICS_ACC="application/vnd.americandynamics.acc",n.APPLICATION_VND_AMIGA_AMI="application/vnd.amiga.ami",n.APPLICATION_VND_AMUNDSEN_MAZE_XML="application/vnd.amundsen.maze+xml",n.APPLICATION_VND_ANDROID_OTA="application/vnd.android.ota",n.APPLICATION_VND_ANKI="application/vnd.anki",n.APPLICATION_VND_ANSER_WEB_CERTIFICATE_ISSUE_INITIATION="application/vnd.anser-web-certificate-issue-initiation",n.APPLICATION_VND_ANTIX_GAME_COMPONENT="application/vnd.antix.game-component",n.APPLICATION_VND_APACHE_ARROW_FILE="application/vnd.apache.arrow.file",n.APPLICATION_VND_APACHE_ARROW_STREAM="application/vnd.apache.arrow.stream",n.APPLICATION_VND_APACHE_PARQUET="application/vnd.apache.parquet",n.APPLICATION_VND_APACHE_THRIFT_BINARY="application/vnd.apache.thrift.binary",n.APPLICATION_VND_APACHE_THRIFT_COMPACT="application/vnd.apache.thrift.compact",n.APPLICATION_VND_APACHE_THRIFT_JSON="application/vnd.apache.thrift.json",n.APPLICATION_VND_APEXLANG="application/vnd.apexlang",n.APPLICATION_VND_API_JSON="application/vnd.api+json",n.APPLICATION_VND_APLEXTOR_WARRP_JSON="application/vnd.aplextor.warrp+json",n.APPLICATION_VND_APOTHEKENDE_RESERVATION_JSON="application/vnd.apothekende.reservation+json",n.APPLICATION_VND_APPLE_INSTALLER_XML="application/vnd.apple.installer+xml",n.APPLICATION_VND_APPLE_KEYNOTE="application/vnd.apple.keynote",n.APPLICATION_VND_APPLE_MPEGURL="application/vnd.apple.mpegurl",n.APPLICATION_VND_APPLE_NUMBERS="application/vnd.apple.numbers",n.APPLICATION_VND_APPLE_PAGES="application/vnd.apple.pages",n.APPLICATION_VND_APPLE_STEERING_LIST="application/vnd.apple.steering-list",n.APPLICATION_VND_ARASTRA_SWI="application/vnd.arastra.swi",n.APPLICATION_VND_ARISTANETWORKS_SWI="application/vnd.aristanetworks.swi",n.APPLICATION_VND_ARTISAN_JSON="application/vnd.artisan+json",n.APPLICATION_VND_ARTSQUARE="application/vnd.artsquare",n.APPLICATION_VND_AS207960_VAS_CONFIG_JER="application/vnd.as207960.vas.config+jer",n.APPLICATION_VND_AS207960_VAS_CONFIG_UPER="application/vnd.as207960.vas.config+uper",n.APPLICATION_VND_AS207960_VAS_TAP_JER="application/vnd.as207960.vas.tap+jer",n.APPLICATION_VND_AS207960_VAS_TAP_UPER="application/vnd.as207960.vas.tap+uper",n.APPLICATION_VND_ASTRAEA_SOFTWARE_IOTA="application/vnd.astraea-software.iota",n.APPLICATION_VND_AUDIOGRAPH="application/vnd.audiograph",n.APPLICATION_VND_AUMTRIX_AUM="application/vnd.aumtrix.aum",n.APPLICATION_VND_AUTOPACKAGE="application/vnd.autopackage",n.APPLICATION_VND_AVALON_JSON="application/vnd.avalon+json",n.APPLICATION_VND_AVISTAR_XML="application/vnd.avistar+xml",n.APPLICATION_VND_BALSAMIQ_BMML_XML="application/vnd.balsamiq.bmml+xml",n.APPLICATION_VND_BALSAMIQ_BMPR="application/vnd.balsamiq.bmpr",n.APPLICATION_VND_BANANA_ACCOUNTING="application/vnd.banana-accounting",n.APPLICATION_VND_BBF_USP_ERROR="application/vnd.bbf.usp.error",n.APPLICATION_VND_BBF_USP_MSG="application/vnd.bbf.usp.msg",n.APPLICATION_VND_BBF_USP_MSG_JSON="application/vnd.bbf.usp.msg+json",n.APPLICATION_VND_BCG_TRUSTDECLARATION="application/vnd.BCG.TrustDeclaration",n.APPLICATION_VND_BEKITZUR_STECH_JSON="application/vnd.bekitzur-stech+json",n.APPLICATION_VND_BELIGHTSOFT_LHZD_ZIP="application/vnd.belightsoft.lhzd+zip",n.APPLICATION_VND_BELIGHTSOFT_LHZL_ZIP="application/vnd.belightsoft.lhzl+zip",n.APPLICATION_VND_BINT_MED_CONTENT="application/vnd.bint.med-content",n.APPLICATION_VND_BIOPAX_RDF_XML="application/vnd.biopax.rdf+xml",n.APPLICATION_VND_BLINK_IDB_VALUE_WRAPPER="application/vnd.blink-idb-value-wrapper",n.APPLICATION_VND_BLOCKFACT_FACTS="application/vnd.blockfact.facts",n.APPLICATION_VND_BLUEICE_MULTIPASS="application/vnd.blueice.multipass",n.APPLICATION_VND_BLUETOOTH_EP_OOB="application/vnd.bluetooth.ep.oob",n.APPLICATION_VND_BLUETOOTH_LE_OOB="application/vnd.bluetooth.le.oob",n.APPLICATION_VND_BMI="application/vnd.bmi",n.APPLICATION_VND_BPF="application/vnd.bpf",n.APPLICATION_VND_BPF3="application/vnd.bpf3",n.APPLICATION_VND_BUSINESSOBJECTS="application/vnd.businessobjects",n.APPLICATION_VND_BYU_UAPI_JSON="application/vnd.byu.uapi+json",n.APPLICATION_VND_BZIP3="application/vnd.bzip3",n.APPLICATION_VND_C3VOC_SCHEDULE_XML="application/vnd.c3voc.schedule+xml",n.APPLICATION_VND_CAB_JSCRIPT="application/vnd.cab-jscript",n.APPLICATION_VND_CANON_CPDL="application/vnd.canon-cpdl",n.APPLICATION_VND_CANON_LIPS="application/vnd.canon-lips",n.APPLICATION_VND_CAPASYSTEMS_PG_JSON="application/vnd.capasystems-pg+json",n.APPLICATION_VND_CEL="application/vnd.cel",n.APPLICATION_VND_CENDIO_THINLINC_CLIENTCONF="application/vnd.cendio.thinlinc.clientconf",n.APPLICATION_VND_CENTURY_SYSTEMS_TCP_STREAM="application/vnd.century-systems.tcp_stream",n.APPLICATION_VND_CHEMDRAW_XML="application/vnd.chemdraw+xml",n.APPLICATION_VND_CHESS_PGN="application/vnd.chess-pgn",n.APPLICATION_VND_CHIPNUTS_KARAOKE_MMD="application/vnd.chipnuts.karaoke-mmd",n.APPLICATION_VND_CIEDI="application/vnd.ciedi",n.APPLICATION_VND_CINDERELLA="application/vnd.cinderella",n.APPLICATION_VND_CIRPACK_ISDN_EXT="application/vnd.cirpack.isdn-ext",n.APPLICATION_VND_CITATIONSTYLES_STYLE_XML="application/vnd.citationstyles.style+xml",n.APPLICATION_VND_CLAYMORE="application/vnd.claymore",n.APPLICATION_VND_CLOANTO_RP9="application/vnd.cloanto.rp9",n.APPLICATION_VND_CLONK_C4GROUP="application/vnd.clonk.c4group",n.APPLICATION_VND_CLUETRUST_CARTOMOBILE_CONFIG="application/vnd.cluetrust.cartomobile-config",n.APPLICATION_VND_CLUETRUST_CARTOMOBILE_CONFIG_PKG="application/vnd.cluetrust.cartomobile-config-pkg",n.APPLICATION_VND_CMMF_CONFIGURATION_INFORMATION_JSON="application/vnd.cmmf-configuration-information+json",n.APPLICATION_VND_CMMF_EFD_XML="application/vnd.cmmf-efd+xml",n.APPLICATION_VND_CMMF_ENCODER_CONFIGURATION_JSON="application/vnd.cmmf-encoder-configuration+json",n.APPLICATION_VND_CNCF_HELM_CHART_CONTENT_V1_TAR_GZIP="application/vnd.cncf.helm.chart.content.v1.tar+gzip",n.APPLICATION_VND_CNCF_HELM_CHART_PROVENANCE_V1_PROV="application/vnd.cncf.helm.chart.provenance.v1.prov",n.APPLICATION_VND_CNCF_HELM_CONFIG_V1_JSON="application/vnd.cncf.helm.config.v1+json",n.APPLICATION_VND_COFFEESCRIPT="application/vnd.coffeescript",n.APPLICATION_VND_COLLABIO_XODOCUMENTS_DOCUMENT="application/vnd.collabio.xodocuments.document",n.APPLICATION_VND_COLLABIO_XODOCUMENTS_DOCUMENT_TEMPLATE="application/vnd.collabio.xodocuments.document-template",n.APPLICATION_VND_COLLABIO_XODOCUMENTS_PRESENTATION="application/vnd.collabio.xodocuments.presentation",n.APPLICATION_VND_COLLABIO_XODOCUMENTS_PRESENTATION_TEMPLATE="application/vnd.collabio.xodocuments.presentation-template",n.APPLICATION_VND_COLLABIO_XODOCUMENTS_SPREADSHEET="application/vnd.collabio.xodocuments.spreadsheet",n.APPLICATION_VND_COLLABIO_XODOCUMENTS_SPREADSHEET_TEMPLATE="application/vnd.collabio.xodocuments.spreadsheet-template",n.APPLICATION_VND_COLLECTION_DOC_JSON="application/vnd.collection.doc+json",n.APPLICATION_VND_COLLECTION_JSON="application/vnd.collection+json",n.APPLICATION_VND_COLLECTION_NEXT_JSON="application/vnd.collection.next+json",n.APPLICATION_VND_COMICBOOK_RAR="application/vnd.comicbook-rar",n.APPLICATION_VND_COMICBOOK_ZIP="application/vnd.comicbook+zip",n.APPLICATION_VND_COMMERCE_BATTELLE="application/vnd.commerce-battelle",n.APPLICATION_VND_COMMONSPACE="application/vnd.commonspace",n.APPLICATION_VND_COREOS_IGNITION_JSON="application/vnd.coreos.ignition+json",n.APPLICATION_VND_COSMOCALLER="application/vnd.cosmocaller",n.APPLICATION_VND_CONTACT_CMSG="application/vnd.contact.cmsg",n.APPLICATION_VND_CRICK_CLICKER="application/vnd.crick.clicker",n.APPLICATION_VND_CRICK_CLICKER_KEYBOARD="application/vnd.crick.clicker.keyboard",n.APPLICATION_VND_CRICK_CLICKER_PALETTE="application/vnd.crick.clicker.palette",n.APPLICATION_VND_CRICK_CLICKER_TEMPLATE="application/vnd.crick.clicker.template",n.APPLICATION_VND_CRICK_CLICKER_WORDBANK="application/vnd.crick.clicker.wordbank",n.APPLICATION_VND_CRITICALTOOLS_WBS_XML="application/vnd.criticaltools.wbs+xml",n.APPLICATION_VND_CRYPTII_PIPE_JSON="application/vnd.cryptii.pipe+json",n.APPLICATION_VND_CRYPTO_SHADE_FILE="application/vnd.crypto-shade-file",n.APPLICATION_VND_CRYPTOMATOR_ENCRYPTED="application/vnd.cryptomator.encrypted",n.APPLICATION_VND_CRYPTOMATOR_VAULT="application/vnd.cryptomator.vault",n.APPLICATION_VND_CTC_POSML="application/vnd.ctc-posml",n.APPLICATION_VND_CTCT_WS_XML="application/vnd.ctct.ws+xml",n.APPLICATION_VND_CUPS_PDF="application/vnd.cups-pdf",n.APPLICATION_VND_CUPS_POSTSCRIPT="application/vnd.cups-postscript",n.APPLICATION_VND_CUPS_PPD="application/vnd.cups-ppd",n.APPLICATION_VND_CUPS_RASTER="application/vnd.cups-raster",n.APPLICATION_VND_CUPS_RAW="application/vnd.cups-raw",n.APPLICATION_VND_CURL="application/vnd.curl",n.APPLICATION_VND_CYAN_DEAN_ROOT_XML="application/vnd.cyan.dean.root+xml",n.APPLICATION_VND_CYBANK="application/vnd.cybank",n.APPLICATION_VND_CYCLONEDX_JSON="application/vnd.cyclonedx+json",n.APPLICATION_VND_CYCLONEDX_XML="application/vnd.cyclonedx+xml",n.APPLICATION_VND_D2L_COURSEPACKAGE1P0_ZIP="application/vnd.d2l.coursepackage1p0+zip",n.APPLICATION_VND_D3M_DATASET="application/vnd.d3m-dataset",n.APPLICATION_VND_D3M_PROBLEM="application/vnd.d3m-problem",n.APPLICATION_VND_DAI="application/vnd.dai",n.APPLICATION_VND_DART="application/vnd.dart",n.APPLICATION_VND_DATA_VISION_RDZ="application/vnd.data-vision.rdz",n.APPLICATION_VND_DATALOG="application/vnd.datalog",n.APPLICATION_VND_DATAPACKAGE_JSON="application/vnd.datapackage+json",n.APPLICATION_VND_DATARESOURCE_JSON="application/vnd.dataresource+json",n.APPLICATION_VND_DBF="application/vnd.dbf",n.APPLICATION_VND_DCMP_XML="application/vnd.dcmp+xml",n.APPLICATION_VND_DEBIAN_BINARY_PACKAGE="application/vnd.debian.binary-package",n.APPLICATION_VND_DECE_DATA="application/vnd.dece.data",n.APPLICATION_VND_DECE_TTML_XML="application/vnd.dece.ttml+xml",n.APPLICATION_VND_DECE_UNSPECIFIED="application/vnd.dece.unspecified",n.APPLICATION_VND_DECE_ZIP="application/vnd.dece.zip",n.APPLICATION_VND_DECKYARD_DECK="application/vnd.deckyard.deck",n.APPLICATION_VND_DENOVO_FCSELAYOUT_LINK="application/vnd.denovo.fcselayout-link",n.APPLICATION_VND_DESMUME_MOVIE="application/vnd.desmume.movie",n.APPLICATION_VND_DEUT_JSON="application/vnd.deut+json",n.APPLICATION_VND_DGL="application/vnd.dgl",n.APPLICATION_VND_DIGITALSTACK_DOCUMENT_ZIP="application/vnd.digitalstack.document+zip",n.APPLICATION_VND_DIR_BI_PLATE_DL_NOSUFFIX="application/vnd.dir-bi.plate-dl-nosuffix",n.APPLICATION_VND_DM_DELEGATION_XML="application/vnd.dm.delegation+xml",n.APPLICATION_VND_DNA="application/vnd.dna",n.APPLICATION_VND_DOCUMENT_JSON="application/vnd.document+json",n.APPLICATION_VND_DOLBY_MOBILE_1="application/vnd.dolby.mobile.1",n.APPLICATION_VND_DOLBY_MOBILE_2="application/vnd.dolby.mobile.2",n.APPLICATION_VND_DOREMIR_SCORECLOUD_BINARY_DOCUMENT="application/vnd.doremir.scorecloud-binary-document",n.APPLICATION_VND_DPGRAPH="application/vnd.dpgraph",n.APPLICATION_VND_DRAWOBLE_DRAWING_ZIP="application/vnd.drawoble.drawing+zip",n.APPLICATION_VND_DREAMFACTORY="application/vnd.dreamfactory",n.APPLICATION_VND_DRIVE_JSON="application/vnd.drive+json",n.APPLICATION_VND_DTG_LOCAL="application/vnd.dtg.local",n.APPLICATION_VND_DTG_LOCAL_FLASH="application/vnd.dtg.local.flash",n.APPLICATION_VND_DTG_LOCAL_HTML="application/vnd.dtg.local.html",n.APPLICATION_VND_DVB_AIT="application/vnd.dvb.ait",n.APPLICATION_VND_DVB_DASH_PLAYLIST_XML="application/vnd.dvb.dash-playlist+xml",n.APPLICATION_VND_DVB_DVBISL_XML="application/vnd.dvb.dvbisl+xml",n.APPLICATION_VND_DVB_DVBJ="application/vnd.dvb.dvbj",n.APPLICATION_VND_DVB_ESGCONTAINER="application/vnd.dvb.esgcontainer",n.APPLICATION_VND_DVB_IPDCDFTNOTIFACCESS="application/vnd.dvb.ipdcdftnotifaccess",n.APPLICATION_VND_DVB_IPDCESGACCESS="application/vnd.dvb.ipdcesgaccess",n.APPLICATION_VND_DVB_IPDCESGACCESS2="application/vnd.dvb.ipdcesgaccess2",n.APPLICATION_VND_DVB_IPDCESGPDD="application/vnd.dvb.ipdcesgpdd",n.APPLICATION_VND_DVB_IPDCROAMING="application/vnd.dvb.ipdcroaming",n.APPLICATION_VND_DVB_IPTV_ALFEC_BASE="application/vnd.dvb.iptv.alfec-base",n.APPLICATION_VND_DVB_IPTV_ALFEC_ENHANCEMENT="application/vnd.dvb.iptv.alfec-enhancement",n.APPLICATION_VND_DVB_NOTIF_AGGREGATE_ROOT_XML="application/vnd.dvb.notif-aggregate-root+xml",n.APPLICATION_VND_DVB_NOTIF_CONTAINER_XML="application/vnd.dvb.notif-container+xml",n.APPLICATION_VND_DVB_NOTIF_GENERIC_XML="application/vnd.dvb.notif-generic+xml",n.APPLICATION_VND_DVB_NOTIF_IA_MSGLIST_XML="application/vnd.dvb.notif-ia-msglist+xml",n.APPLICATION_VND_DVB_NOTIF_IA_REGISTRATION_REQUEST_XML="application/vnd.dvb.notif-ia-registration-request+xml",n.APPLICATION_VND_DVB_NOTIF_IA_REGISTRATION_RESPONSE_XML="application/vnd.dvb.notif-ia-registration-response+xml",n.APPLICATION_VND_DVB_NOTIF_INIT_XML="application/vnd.dvb.notif-init+xml",n.APPLICATION_VND_DVB_PFR="application/vnd.dvb.pfr",n.APPLICATION_VND_DVB_SERVICE="application/vnd.dvb.service",n.APPLICATION_VND_DXR="application/vnd.dxr",n.APPLICATION_VND_DYNAGEO="application/vnd.dynageo",n.APPLICATION_VND_DZR="application/vnd.dzr",n.APPLICATION_VND_EASYKARAOKE_CDGDOWNLOAD="application/vnd.easykaraoke.cdgdownload",n.APPLICATION_VND_ECIP_RLP="application/vnd.ecip.rlp",n.APPLICATION_VND_EDULITH_EDUX_JSON="application/vnd.edulith.edux+json",n.APPLICATION_VND_ECDIS_UPDATE="application/vnd.ecdis-update",n.APPLICATION_VND_ECLIPSE_DITTO_JSON="application/vnd.eclipse.ditto+json",n.APPLICATION_VND_ECOWIN_CHART="application/vnd.ecowin.chart",n.APPLICATION_VND_ECOWIN_FILEREQUEST="application/vnd.ecowin.filerequest",n.APPLICATION_VND_ECOWIN_FILEUPDATE="application/vnd.ecowin.fileupdate",n.APPLICATION_VND_ECOWIN_SERIES="application/vnd.ecowin.series",n.APPLICATION_VND_ECOWIN_SERIESREQUEST="application/vnd.ecowin.seriesrequest",n.APPLICATION_VND_ECOWIN_SERIESUPDATE="application/vnd.ecowin.seriesupdate",n.APPLICATION_VND_EFI_IMG="application/vnd.efi.img",n.APPLICATION_VND_EFI_ISO="application/vnd.efi.iso",n.APPLICATION_VND_ELN_ZIP="application/vnd.eln+zip",n.APPLICATION_VND_EMCLIENT_ACCESSREQUEST_XML="application/vnd.emclient.accessrequest+xml",n.APPLICATION_VND_EMILIA_AUTHORIZATION_EVIDENCE_CHALLENGE_JSON="application/vnd.emilia.authorization-evidence-challenge+json",n.APPLICATION_VND_ENLIVEN="application/vnd.enliven",n.APPLICATION_VND_ENPHASE_ENVOY="application/vnd.enphase.envoy",n.APPLICATION_VND_EPRINTS_DATA_XML="application/vnd.eprints.data+xml",n.APPLICATION_VND_EPSON_ESF="application/vnd.epson.esf",n.APPLICATION_VND_EPSON_MSF="application/vnd.epson.msf",n.APPLICATION_VND_EPSON_QUICKANIME="application/vnd.epson.quickanime",n.APPLICATION_VND_EPSON_SALT="application/vnd.epson.salt",n.APPLICATION_VND_EPSON_SSF="application/vnd.epson.ssf",n.APPLICATION_VND_ERICSSON_QUICKCALL="application/vnd.ericsson.quickcall",n.APPLICATION_VND_EROFS="application/vnd.erofs",n.APPLICATION_VND_ESPASS_ESPASS_ZIP="application/vnd.espass-espass+zip",n.APPLICATION_VND_ESZIGNO3_XML="application/vnd.eszigno3+xml",n.APPLICATION_VND_ETSI_AOC_XML="application/vnd.etsi.aoc+xml",n.APPLICATION_VND_ETSI_ASIC_S_ZIP="application/vnd.etsi.asic-s+zip",n.APPLICATION_VND_ETSI_ASIC_E_ZIP="application/vnd.etsi.asic-e+zip",n.APPLICATION_VND_ETSI_CUG_XML="application/vnd.etsi.cug+xml",n.APPLICATION_VND_ETSI_IPTVCOMMAND_XML="application/vnd.etsi.iptvcommand+xml",n.APPLICATION_VND_ETSI_IPTVDISCOVERY_XML="application/vnd.etsi.iptvdiscovery+xml",n.APPLICATION_VND_ETSI_IPTVPROFILE_XML="application/vnd.etsi.iptvprofile+xml",n.APPLICATION_VND_ETSI_IPTVSAD_BC_XML="application/vnd.etsi.iptvsad-bc+xml",n.APPLICATION_VND_ETSI_IPTVSAD_COD_XML="application/vnd.etsi.iptvsad-cod+xml",n.APPLICATION_VND_ETSI_IPTVSAD_NPVR_XML="application/vnd.etsi.iptvsad-npvr+xml",n.APPLICATION_VND_ETSI_IPTVSERVICE_XML="application/vnd.etsi.iptvservice+xml",n.APPLICATION_VND_ETSI_IPTVSYNC_XML="application/vnd.etsi.iptvsync+xml",n.APPLICATION_VND_ETSI_IPTVUEPROFILE_XML="application/vnd.etsi.iptvueprofile+xml",n.APPLICATION_VND_ETSI_MCID_XML="application/vnd.etsi.mcid+xml",n.APPLICATION_VND_ETSI_MHEG5="application/vnd.etsi.mheg5",n.APPLICATION_VND_ETSI_OVERLOAD_CONTROL_POLICY_DATASET_XML="application/vnd.etsi.overload-control-policy-dataset+xml",n.APPLICATION_VND_ETSI_PSTN_XML="application/vnd.etsi.pstn+xml",n.APPLICATION_VND_ETSI_SCI_XML="application/vnd.etsi.sci+xml",n.APPLICATION_VND_ETSI_SIMSERVS_XML="application/vnd.etsi.simservs+xml",n.APPLICATION_VND_ETSI_TIMESTAMP_TOKEN="application/vnd.etsi.timestamp-token",n.APPLICATION_VND_ETSI_TSL_XML="application/vnd.etsi.tsl+xml",n.APPLICATION_VND_ETSI_TSL_DER="application/vnd.etsi.tsl.der",n.APPLICATION_VND_EU_KASPARIAN_CAR_JSON="application/vnd.eu.kasparian.car+json",n.APPLICATION_VND_EUDORA_DATA="application/vnd.eudora.data",n.APPLICATION_VND_EVOLV_ECIG_PROFILE="application/vnd.evolv.ecig.profile",n.APPLICATION_VND_EVOLV_ECIG_SETTINGS="application/vnd.evolv.ecig.settings",n.APPLICATION_VND_EVOLV_ECIG_THEME="application/vnd.evolv.ecig.theme",n.APPLICATION_VND_EXCELANO_SLIPCASE_ZIP="application/vnd.excelano.slipcase+zip",n.APPLICATION_VND_EXSTREAM_EMPOWER_ZIP="application/vnd.exstream-empower+zip",n.APPLICATION_VND_EXSTREAM_PACKAGE="application/vnd.exstream-package",n.APPLICATION_VND_EZPIX_ALBUM="application/vnd.ezpix-album",n.APPLICATION_VND_EZPIX_PACKAGE="application/vnd.ezpix-package",n.APPLICATION_VND_F_SECURE_MOBILE="application/vnd.f-secure.mobile",n.APPLICATION_VND_FABYLON_BOOK="application/vnd.fabylon.book",n.APPLICATION_VND_FAF_YAML="application/vnd.faf+yaml",n.APPLICATION_VND_FAFA_YAML="application/vnd.fafa+yaml",n.APPLICATION_VND_FAFM_YAML="application/vnd.fafm+yaml",n.APPLICATION_VND_FASTCOPY_DISK_IMAGE="application/vnd.fastcopy-disk-image",n.APPLICATION_VND_FAMILYSEARCH_GEDCOM_ZIP="application/vnd.familysearch.gedcom+zip",n.APPLICATION_VND_FDSN_MSEED="application/vnd.fdsn.mseed",n.APPLICATION_VND_FDSN_SEED="application/vnd.fdsn.seed",n.APPLICATION_VND_FDSN_STATIONXML_XML="application/vnd.fdsn.stationxml+xml",n.APPLICATION_VND_FFSNS="application/vnd.ffsns",n.APPLICATION_VND_FGB="application/vnd.fgb",n.APPLICATION_VND_FICLAB_FLB_ZIP="application/vnd.ficlab.flb+zip",n.APPLICATION_VND_FIDUSWRITER_BOOK_ZIP="application/vnd.fiduswriter.book+zip",n.APPLICATION_VND_FIDUSWRITER_TEMPLATE_ZIP="application/vnd.fiduswriter.template+zip",n.APPLICATION_VND_FIDUSWRITER_ZIP="application/vnd.fiduswriter+zip",n.APPLICATION_VND_FILMIT_ZFC="application/vnd.filmit.zfc",n.APPLICATION_VND_FINTS="application/vnd.fints",n.APPLICATION_VND_FIREMONKEYS_CLOUDCELL="application/vnd.firemonkeys.cloudcell",n.APPLICATION_VND_FLOGRAPHIT="application/vnd.FloGraphIt",n.APPLICATION_VND_FLUXTIME_CLIP="application/vnd.fluxtime.clip",n.APPLICATION_VND_FONT_FONTFORGE_SFD="application/vnd.font-fontforge-sfd",n.APPLICATION_VND_FORITECH_CONTAINER="application/vnd.foritech.container",n.APPLICATION_VND_FRAMEMAKER="application/vnd.framemaker",n.APPLICATION_VND_FREELOG_COMIC="application/vnd.freelog.comic",n.APPLICATION_VND_FROGANS_FNC="application/vnd.frogans.fnc",n.APPLICATION_VND_FROGANS_LTF="application/vnd.frogans.ltf",n.APPLICATION_VND_FSC_WEBLAUNCH="application/vnd.fsc.weblaunch",n.APPLICATION_VND_FUJIFILM_FB_DOCUWORKS="application/vnd.fujifilm.fb.docuworks",n.APPLICATION_VND_FUJIFILM_FB_DOCUWORKS_BINDER="application/vnd.fujifilm.fb.docuworks.binder",n.APPLICATION_VND_FUJIFILM_FB_DOCUWORKS_CONTAINER="application/vnd.fujifilm.fb.docuworks.container",n.APPLICATION_VND_FUJIFILM_FB_JFI_XML="application/vnd.fujifilm.fb.jfi+xml",n.APPLICATION_VND_FUJITSU_OASYS="application/vnd.fujitsu.oasys",n.APPLICATION_VND_FUJITSU_OASYS2="application/vnd.fujitsu.oasys2",n.APPLICATION_VND_FUJITSU_OASYS3="application/vnd.fujitsu.oasys3",n.APPLICATION_VND_FUJITSU_OASYSGP="application/vnd.fujitsu.oasysgp",n.APPLICATION_VND_FUJITSU_OASYSPRS="application/vnd.fujitsu.oasysprs",n.APPLICATION_VND_FUJIXEROX_ART4="application/vnd.fujixerox.ART4",n.APPLICATION_VND_FUJIXEROX_ART_EX="application/vnd.fujixerox.ART-EX",n.APPLICATION_VND_FUJIXEROX_DDD="application/vnd.fujixerox.ddd",n.APPLICATION_VND_FUJIXEROX_DOCUWORKS="application/vnd.fujixerox.docuworks",n.APPLICATION_VND_FUJIXEROX_DOCUWORKS_BINDER="application/vnd.fujixerox.docuworks.binder",n.APPLICATION_VND_FUJIXEROX_DOCUWORKS_CONTAINER="application/vnd.fujixerox.docuworks.container",n.APPLICATION_VND_FUJIXEROX_HBPL="application/vnd.fujixerox.HBPL",n.APPLICATION_VND_FUT_MISNET="application/vnd.fut-misnet",n.APPLICATION_VND_FUTOIN_CBOR="application/vnd.futoin+cbor",n.APPLICATION_VND_FUTOIN_JSON="application/vnd.futoin+json",n.APPLICATION_VND_FUZZYSHEET="application/vnd.fuzzysheet",n.APPLICATION_VND_G3PIX_G3FC="application/vnd.g3pix.g3fc",n.APPLICATION_VND_GA4GH_PASSPORT_JWT="application/vnd.ga4gh.passport+jwt",n.APPLICATION_VND_GENOMATIX_TUXEDO="application/vnd.genomatix.tuxedo",n.APPLICATION_VND_GENOZIP="application/vnd.genozip",n.APPLICATION_VND_GENTICS_GRD_JSON="application/vnd.gentics.grd+json",n.APPLICATION_VND_GENTOO_CATMETADATA_XML="application/vnd.gentoo.catmetadata+xml",n.APPLICATION_VND_GENTOO_EBUILD="application/vnd.gentoo.ebuild",n.APPLICATION_VND_GENTOO_ECLASS="application/vnd.gentoo.eclass",n.APPLICATION_VND_GENTOO_GPKG="application/vnd.gentoo.gpkg",n.APPLICATION_VND_GENTOO_MANIFEST="application/vnd.gentoo.manifest",n.APPLICATION_VND_GENTOO_XPAK="application/vnd.gentoo.xpak",n.APPLICATION_VND_GENTOO_PKGMETADATA_XML="application/vnd.gentoo.pkgmetadata+xml",n.APPLICATION_VND_GEO_JSON="application/vnd.geo+json",n.APPLICATION_VND_GEOCUBE_XML="application/vnd.geocube+xml",n.APPLICATION_VND_GEOGEBRA_FILE="application/vnd.geogebra.file",n.APPLICATION_VND_GEOGEBRA_PINBOARD="application/vnd.geogebra.pinboard",n.APPLICATION_VND_GEOGEBRA_SLIDES="application/vnd.geogebra.slides",n.APPLICATION_VND_GEOGEBRA_TOOL="application/vnd.geogebra.tool",n.APPLICATION_VND_GEOMETRY_EXPLORER="application/vnd.geometry-explorer",n.APPLICATION_VND_GEONEXT="application/vnd.geonext",n.APPLICATION_VND_GEOPLAN="application/vnd.geoplan",n.APPLICATION_VND_GEOSPACE="application/vnd.geospace",n.APPLICATION_VND_GEOVIRTUALLIS_GEOV_ZIP="application/vnd.geovirtuallis.geov+zip",n.APPLICATION_VND_GERBER="application/vnd.gerber",n.APPLICATION_VND_GLOBALPLATFORM_CARD_CONTENT_MGT="application/vnd.globalplatform.card-content-mgt",n.APPLICATION_VND_GLOBALPLATFORM_CARD_CONTENT_MGT_RESPONSE="application/vnd.globalplatform.card-content-mgt-response",n.APPLICATION_VND_GMX="application/vnd.gmx",n.APPLICATION_VND_GNU_TALER_EXCHANGE_JSON="application/vnd.gnu.taler.exchange+json",n.APPLICATION_VND_GNU_TALER_MERCHANT_JSON="application/vnd.gnu.taler.merchant+json",n.APPLICATION_VND_GODOT_PROJECT_BINARY="application/vnd.godot.project.binary",n.APPLICATION_VND_GODOT_PROJECT_TEXT="application/vnd.godot.project.text",n.APPLICATION_VND_GODOT_RESOURCE_BINARY="application/vnd.godot.resource.binary",n.APPLICATION_VND_GODOT_RESOURCE_TEXT="application/vnd.godot.resource.text",n.APPLICATION_VND_GOOGLE_EARTH_KML_XML="application/vnd.google-earth.kml+xml",n.APPLICATION_VND_GOOGLE_EARTH_KMZ="application/vnd.google-earth.kmz",n.APPLICATION_VND_GOV_SK_E_FORM_XML="application/vnd.gov.sk.e-form+xml",n.APPLICATION_VND_GOV_SK_E_FORM_ZIP="application/vnd.gov.sk.e-form+zip",n.APPLICATION_VND_GOV_SK_XMLDATACONTAINER_XML="application/vnd.gov.sk.xmldatacontainer+xml",n.APPLICATION_VND_GP3="application/vnd.gp3",n.APPLICATION_VND_GPXSEE_MAP_XML="application/vnd.gpxsee.map+xml",n.APPLICATION_VND_GRAFEQ="application/vnd.grafeq",n.APPLICATION_VND_GRIDMP="application/vnd.gridmp",n.APPLICATION_VND_GROOVE_ACCOUNT="application/vnd.groove-account",n.APPLICATION_VND_GROOVE_HELP="application/vnd.groove-help",n.APPLICATION_VND_GROOVE_IDENTITY_MESSAGE="application/vnd.groove-identity-message",n.APPLICATION_VND_GROOVE_INJECTOR="application/vnd.groove-injector",n.APPLICATION_VND_GROOVE_TOOL_MESSAGE="application/vnd.groove-tool-message",n.APPLICATION_VND_GROOVE_TOOL_TEMPLATE="application/vnd.groove-tool-template",n.APPLICATION_VND_GROOVE_VCARD="application/vnd.groove-vcard",n.APPLICATION_VND_HAL_JSON="application/vnd.hal+json",n.APPLICATION_VND_HAL_XML="application/vnd.hal+xml",n.APPLICATION_VND_HANDHELD_ENTERTAINMENT_XML="application/vnd.HandHeld-Entertainment+xml",n.APPLICATION_VND_HBCI="application/vnd.hbci",n.APPLICATION_VND_HC_JSON="application/vnd.hc+json",n.APPLICATION_VND_HCL_BIREPORTS="application/vnd.hcl-bireports",n.APPLICATION_VND_HDFGROUP_HDF4="application/vnd.hdfgroup.hdf4",n.APPLICATION_VND_HDFGROUP_HDF5="application/vnd.hdfgroup.hdf5",n.APPLICATION_VND_HDT="application/vnd.hdt",n.APPLICATION_VND_HEROKU_JSON="application/vnd.heroku+json",n.APPLICATION_VND_HHE_LESSON_PLAYER="application/vnd.hhe.lesson-player",n.APPLICATION_VND_HP_HPGL="application/vnd.hp-HPGL",n.APPLICATION_VND_HP_HPID="application/vnd.hp-hpid",n.APPLICATION_VND_HP_HPS="application/vnd.hp-hps",n.APPLICATION_VND_HP_JLYT="application/vnd.hp-jlyt",n.APPLICATION_VND_HP_PCL="application/vnd.hp-PCL",n.APPLICATION_VND_HP_PCLXL="application/vnd.hp-PCLXL",n.APPLICATION_VND_HSL="application/vnd.hsl",n.APPLICATION_VND_HTTPHONE="application/vnd.httphone",n.APPLICATION_VND_HYDROSTATIX_SOF_DATA="application/vnd.hydrostatix.sof-data",n.APPLICATION_VND_HYPER_ITEM_JSON="application/vnd.hyper-item+json",n.APPLICATION_VND_HYPER_JSON="application/vnd.hyper+json",n.APPLICATION_VND_HYPERDRIVE_JSON="application/vnd.hyperdrive+json",n.APPLICATION_VND_HZN_3D_CROSSWORD="application/vnd.hzn-3d-crossword",n.APPLICATION_VND_IBM_AFPLINEDATA="application/vnd.ibm.afplinedata",n.APPLICATION_VND_IBM_ELECTRONIC_MEDIA="application/vnd.ibm.electronic-media",n.APPLICATION_VND_IBM_MINIPAY="application/vnd.ibm.MiniPay",n.APPLICATION_VND_IBM_MODCAP="application/vnd.ibm.modcap",n.APPLICATION_VND_IBM_RIGHTS_MANAGEMENT="application/vnd.ibm.rights-management",n.APPLICATION_VND_IBM_SECURE_CONTAINER="application/vnd.ibm.secure-container",n.APPLICATION_VND_IBUS_JSON="application/vnd.ibus+json",n.APPLICATION_VND_ICCPROFILE="application/vnd.iccprofile",n.APPLICATION_VND_IDOP_ZIP="application/vnd.idop+zip",n.APPLICATION_VND_IEEE_1905="application/vnd.ieee.1905",n.APPLICATION_VND_IGLOADER="application/vnd.igloader",n.APPLICATION_VND_IMAGEMETER_FOLDER_ZIP="application/vnd.imagemeter.folder+zip",n.APPLICATION_VND_IMAGEMETER_IMAGE_ZIP="application/vnd.imagemeter.image+zip",n.APPLICATION_VND_IMMERVISION_IVP="application/vnd.immervision-ivp",n.APPLICATION_VND_IMMERVISION_IVU="application/vnd.immervision-ivu",n.APPLICATION_VND_IMS_IMSCCV1P1="application/vnd.ims.imsccv1p1",n.APPLICATION_VND_IMS_IMSCCV1P2="application/vnd.ims.imsccv1p2",n.APPLICATION_VND_IMS_IMSCCV1P3="application/vnd.ims.imsccv1p3",n.APPLICATION_VND_IMS_LIS_V2_RESULT_JSON="application/vnd.ims.lis.v2.result+json",n.APPLICATION_VND_IMS_LTI_V2_TOOLCONSUMERPROFILE_JSON="application/vnd.ims.lti.v2.toolconsumerprofile+json",n.APPLICATION_VND_IMS_LTI_V2_TOOLPROXY_ID_JSON="application/vnd.ims.lti.v2.toolproxy.id+json",n.APPLICATION_VND_IMS_LTI_V2_TOOLPROXY_JSON="application/vnd.ims.lti.v2.toolproxy+json",n.APPLICATION_VND_IMS_LTI_V2_TOOLSETTINGS_JSON="application/vnd.ims.lti.v2.toolsettings+json",n.APPLICATION_VND_IMS_LTI_V2_TOOLSETTINGS_SIMPLE_JSON="application/vnd.ims.lti.v2.toolsettings.simple+json",n.APPLICATION_VND_INFORMEDCONTROL_RMS_XML="application/vnd.informedcontrol.rms+xml",n.APPLICATION_VND_INFOTECH_PROJECT="application/vnd.infotech.project",n.APPLICATION_VND_INFOTECH_PROJECT_XML="application/vnd.infotech.project+xml",n.APPLICATION_VND_INFORMIX_VISIONARY="application/vnd.informix-visionary",n.APPLICATION_VND_INNOPATH_WAMP_NOTIFICATION="application/vnd.innopath.wamp.notification",n.APPLICATION_VND_INSORS_IGM="application/vnd.insors.igm",n.APPLICATION_VND_INTERCON_FORMNET="application/vnd.intercon.formnet",n.APPLICATION_VND_INTERGEO="application/vnd.intergeo",n.APPLICATION_VND_INTERTRUST_DIGIBOX="application/vnd.intertrust.digibox",n.APPLICATION_VND_INTERTRUST_NNCP="application/vnd.intertrust.nncp",n.APPLICATION_VND_INTU_QBO="application/vnd.intu.qbo",n.APPLICATION_VND_INTU_QFX="application/vnd.intu.qfx",n.APPLICATION_VND_IPFS_IPNS_RECORD="application/vnd.ipfs.ipns-record",n.APPLICATION_VND_IPLD_CAR="application/vnd.ipld.car",n.APPLICATION_VND_IPLD_DAG_CBOR="application/vnd.ipld.dag-cbor",n.APPLICATION_VND_IPLD_DAG_JSON="application/vnd.ipld.dag-json",n.APPLICATION_VND_IPLD_RAW="application/vnd.ipld.raw",n.APPLICATION_VND_IPTC_G2_CATALOGITEM_XML="application/vnd.iptc.g2.catalogitem+xml",n.APPLICATION_VND_IPTC_G2_CONCEPTITEM_XML="application/vnd.iptc.g2.conceptitem+xml",n.APPLICATION_VND_IPTC_G2_KNOWLEDGEITEM_XML="application/vnd.iptc.g2.knowledgeitem+xml",n.APPLICATION_VND_IPTC_G2_NEWSITEM_XML="application/vnd.iptc.g2.newsitem+xml",n.APPLICATION_VND_IPTC_G2_NEWSMESSAGE_XML="application/vnd.iptc.g2.newsmessage+xml",n.APPLICATION_VND_IPTC_G2_PACKAGEITEM_XML="application/vnd.iptc.g2.packageitem+xml",n.APPLICATION_VND_IPTC_G2_PLANNINGITEM_XML="application/vnd.iptc.g2.planningitem+xml",n.APPLICATION_VND_IPUNPLUGGED_RCPROFILE="application/vnd.ipunplugged.rcprofile",n.APPLICATION_VND_IREPOSITORY_PACKAGE_XML="application/vnd.irepository.package+xml",n.APPLICATION_VND_IS_XPR="application/vnd.is-xpr",n.APPLICATION_VND_ISAC_FCS="application/vnd.isac.fcs",n.APPLICATION_VND_JAM="application/vnd.jam",n.APPLICATION_VND_ISO11783_10_ZIP="application/vnd.iso11783-10+zip",n.APPLICATION_VND_JAPANNET_DIRECTORY_SERVICE="application/vnd.japannet-directory-service",n.APPLICATION_VND_JAPANNET_JPNSTORE_WAKEUP="application/vnd.japannet-jpnstore-wakeup",n.APPLICATION_VND_JAPANNET_PAYMENT_WAKEUP="application/vnd.japannet-payment-wakeup",n.APPLICATION_VND_JAPANNET_REGISTRATION="application/vnd.japannet-registration",n.APPLICATION_VND_JAPANNET_REGISTRATION_WAKEUP="application/vnd.japannet-registration-wakeup",n.APPLICATION_VND_JAPANNET_SETSTORE_WAKEUP="application/vnd.japannet-setstore-wakeup",n.APPLICATION_VND_JAPANNET_VERIFICATION="application/vnd.japannet-verification",n.APPLICATION_VND_JAPANNET_VERIFICATION_WAKEUP="application/vnd.japannet-verification-wakeup",n.APPLICATION_VND_JCP_JAVAME_MIDLET_RMS="application/vnd.jcp.javame.midlet-rms",n.APPLICATION_VND_JISP="application/vnd.jisp",n.APPLICATION_VND_JOOST_JODA_ARCHIVE="application/vnd.joost.joda-archive",n.APPLICATION_VND_JSK_ISDN_NGN="application/vnd.jsk.isdn-ngn",n.APPLICATION_VND_JUPITER_JDX_JSON="application/vnd.jupiter.jdx+json",n.APPLICATION_VND_JUPYTER="application/vnd.jupyter",n.APPLICATION_VND_KAHOOTZ="application/vnd.kahootz",n.APPLICATION_VND_KDE_KARBON="application/vnd.kde.karbon",n.APPLICATION_VND_KDE_KCHART="application/vnd.kde.kchart",n.APPLICATION_VND_KDE_KFORMULA="application/vnd.kde.kformula",n.APPLICATION_VND_KDE_KIVIO="application/vnd.kde.kivio",n.APPLICATION_VND_KDE_KONTOUR="application/vnd.kde.kontour",n.APPLICATION_VND_KDE_KPRESENTER="application/vnd.kde.kpresenter",n.APPLICATION_VND_KDE_KSPREAD="application/vnd.kde.kspread",n.APPLICATION_VND_KDE_KWORD="application/vnd.kde.kword",n.APPLICATION_VND_KDL="application/vnd.kdl",n.APPLICATION_VND_KENAMEAAPP="application/vnd.kenameaapp",n.APPLICATION_VND_KEYMAN_KMP_ZIP="application/vnd.keyman.kmp+zip",n.APPLICATION_VND_KEYMAN_KMX="application/vnd.keyman.kmx",n.APPLICATION_VND_KIDSPIRATION="application/vnd.kidspiration",n.APPLICATION_VND_KINAR="application/vnd.Kinar",n.APPLICATION_VND_KLYPIX_ZIP="application/vnd.klypix+zip",n.APPLICATION_VND_KOAN="application/vnd.koan",n.APPLICATION_VND_KODAK_DESCRIPTOR="application/vnd.kodak-descriptor",n.APPLICATION_VND_LAS="application/vnd.las",n.APPLICATION_VND_LAS_LAS_JSON="application/vnd.las.las+json",n.APPLICATION_VND_LAS_LAS_XML="application/vnd.las.las+xml",n.APPLICATION_VND_LASZIP="application/vnd.laszip",n.APPLICATION_VND_LDEV_PRODUCTLICENSING="application/vnd.ldev.productlicensing",n.APPLICATION_VND_LEAP_JSON="application/vnd.leap+json",n.APPLICATION_VND_LIBERTY_REQUEST_XML="application/vnd.liberty-request+xml",n.APPLICATION_VND_LLAMAGRAPHICS_LIFE_BALANCE_DESKTOP="application/vnd.llamagraphics.life-balance.desktop",n.APPLICATION_VND_LLAMAGRAPHICS_LIFE_BALANCE_EXCHANGE_XML="application/vnd.llamagraphics.life-balance.exchange+xml",n.APPLICATION_VND_LOGIPIPE_CIRCUIT_ZIP="application/vnd.logipipe.circuit+zip",n.APPLICATION_VND_LOOM="application/vnd.loom",n.APPLICATION_VND_LOTUS_1_2_3="application/vnd.lotus-1-2-3",n.APPLICATION_VND_LOTUS_APPROACH="application/vnd.lotus-approach",n.APPLICATION_VND_LOTUS_FREELANCE="application/vnd.lotus-freelance",n.APPLICATION_VND_LOTUS_NOTES="application/vnd.lotus-notes",n.APPLICATION_VND_LOTUS_ORGANIZER="application/vnd.lotus-organizer",n.APPLICATION_VND_LOTUS_SCREENCAM="application/vnd.lotus-screencam",n.APPLICATION_VND_LOTUS_WORDPRO="application/vnd.lotus-wordpro",n.APPLICATION_VND_LUKUID_PACKAGE_ZIP="application/vnd.lukuid.package+zip",n.APPLICATION_VND_MACPORTS_PORTPKG="application/vnd.macports.portpkg",n.APPLICATION_VND_MAJIKAH_BUNDLE="application/vnd.majikah.bundle",n.APPLICATION_VND_MAJIKAH_MJKSIG="application/vnd.majikah.mjksig",n.APPLICATION_VND_MAJIKAH_MJKSMAP="application/vnd.majikah.mjksmap",n.APPLICATION_VND_MAML="application/vnd.maml",n.APPLICATION_VND_MAPBOX_VECTOR_TILE="application/vnd.mapbox-vector-tile",n.APPLICATION_VND_MARLIN_DRM_ACTIONTOKEN_XML="application/vnd.marlin.drm.actiontoken+xml",n.APPLICATION_VND_MARLIN_DRM_CONFTOKEN_XML="application/vnd.marlin.drm.conftoken+xml",n.APPLICATION_VND_MARLIN_DRM_LICENSE_XML="application/vnd.marlin.drm.license+xml",n.APPLICATION_VND_MARLIN_DRM_MDCF="application/vnd.marlin.drm.mdcf",n.APPLICATION_VND_MASON_JSON="application/vnd.mason+json",n.APPLICATION_VND_MAXAR_ARCHIVE_3TZ_ZIP="application/vnd.maxar.archive.3tz+zip",n.APPLICATION_VND_MAXMIND_MAXMIND_DB="application/vnd.maxmind.maxmind-db",n.APPLICATION_VND_MCAP="application/vnd.mcap",n.APPLICATION_VND_MCD="application/vnd.mcd",n.APPLICATION_VND_MDL="application/vnd.mdl",n.APPLICATION_VND_MDL_MBSDF="application/vnd.mdl-mbsdf",n.APPLICATION_VND_MEDCALCDATA="application/vnd.medcalcdata",n.APPLICATION_VND_MEDIASTATION_CDKEY="application/vnd.mediastation.cdkey",n.APPLICATION_VND_MEDICALHOLODECK_RECORDXR="application/vnd.medicalholodeck.recordxr",n.APPLICATION_VND_MERIDIAN_SLINGSHOT="application/vnd.meridian-slingshot",n.APPLICATION_VND_MERMAID="application/vnd.mermaid",n.APPLICATION_VND_MFER="application/vnd.MFER",n.APPLICATION_VND_MFMP="application/vnd.mfmp",n.APPLICATION_VND_MICRO_JSON="application/vnd.micro+json",n.APPLICATION_VND_MICROGRAFX_FLO="application/vnd.micrografx.flo",n.APPLICATION_VND_MICROGRAFX_IGX="application/vnd.micrografx.igx",n.APPLICATION_VND_MICROSOFT_PORTABLE_EXECUTABLE="application/vnd.microsoft.portable-executable",n.APPLICATION_VND_MICROSOFT_WINDOWS_THUMBNAIL_CACHE="application/vnd.microsoft.windows.thumbnail-cache",n.APPLICATION_VND_MIELE_JSON="application/vnd.miele+json",n.APPLICATION_VND_MIF="application/vnd.mif",n.APPLICATION_VND_MINISOFT_HP3000_SAVE="application/vnd.minisoft-hp3000-save",n.APPLICATION_VND_MITSUBISHI_MISTY_GUARD_TRUSTWEB="application/vnd.mitsubishi.misty-guard.trustweb",n.APPLICATION_VND_MOBIUS_DAF="application/vnd.Mobius.DAF",n.APPLICATION_VND_MOBIUS_DIS="application/vnd.Mobius.DIS",n.APPLICATION_VND_MOBIUS_MBK="application/vnd.Mobius.MBK",n.APPLICATION_VND_MOBIUS_MQY="application/vnd.Mobius.MQY",n.APPLICATION_VND_MOBIUS_MSL="application/vnd.Mobius.MSL",n.APPLICATION_VND_MOBIUS_PLC="application/vnd.Mobius.PLC",n.APPLICATION_VND_MOBIUS_TXF="application/vnd.Mobius.TXF",n.APPLICATION_VND_MODL="application/vnd.modl",n.APPLICATION_VND_MOHNETIC="application/vnd.mohnetic",n.APPLICATION_VND_MOPHUN_APPLICATION="application/vnd.mophun.application",n.APPLICATION_VND_MOPHUN_CERTIFICATE="application/vnd.mophun.certificate",n.APPLICATION_VND_MOTOROLA_FLEXSUITE="application/vnd.motorola.flexsuite",n.APPLICATION_VND_MOTOROLA_FLEXSUITE_ADSI="application/vnd.motorola.flexsuite.adsi",n.APPLICATION_VND_MOTOROLA_FLEXSUITE_FIS="application/vnd.motorola.flexsuite.fis",n.APPLICATION_VND_MOTOROLA_FLEXSUITE_GOTAP="application/vnd.motorola.flexsuite.gotap",n.APPLICATION_VND_MOTOROLA_FLEXSUITE_KMR="application/vnd.motorola.flexsuite.kmr",n.APPLICATION_VND_MOTOROLA_FLEXSUITE_TTC="application/vnd.motorola.flexsuite.ttc",n.APPLICATION_VND_MOTOROLA_FLEXSUITE_WEM="application/vnd.motorola.flexsuite.wem",n.APPLICATION_VND_MOTOROLA_IPRM="application/vnd.motorola.iprm",n.APPLICATION_VND_MOZILLA_XUL_XML="application/vnd.mozilla.xul+xml",n.APPLICATION_VND_MS_ARTGALRY="application/vnd.ms-artgalry",n.APPLICATION_VND_MS_ASF="application/vnd.ms-asf",n.APPLICATION_VND_MS_CAB_COMPRESSED="application/vnd.ms-cab-compressed",n.APPLICATION_VND_MS_3MFDOCUMENT="application/vnd.ms-3mfdocument",n.APPLICATION_VND_MS_EXCEL="application/vnd.ms-excel",n.APPLICATION_VND_MS_EXCEL_ADDIN_MACROENABLED_12="application/vnd.ms-excel.addin.macroEnabled.12",n.APPLICATION_VND_MS_EXCEL_SHEET_BINARY_MACROENABLED_12="application/vnd.ms-excel.sheet.binary.macroEnabled.12",n.APPLICATION_VND_MS_EXCEL_SHEET_MACROENABLED_12="application/vnd.ms-excel.sheet.macroEnabled.12",n.APPLICATION_VND_MS_EXCEL_TEMPLATE_MACROENABLED_12="application/vnd.ms-excel.template.macroEnabled.12",n.APPLICATION_VND_MS_FONTOBJECT="application/vnd.ms-fontobject",n.APPLICATION_VND_MS_HTMLHELP="application/vnd.ms-htmlhelp",n.APPLICATION_VND_MS_IMS="application/vnd.ms-ims",n.APPLICATION_VND_MS_LRM="application/vnd.ms-lrm",n.APPLICATION_VND_MS_OFFICE_ACTIVEX_XML="application/vnd.ms-office.activeX+xml",n.APPLICATION_VND_MS_OFFICETHEME="application/vnd.ms-officetheme",n.APPLICATION_VND_MS_PLAYREADY_INITIATOR_XML="application/vnd.ms-playready.initiator+xml",n.APPLICATION_VND_MS_POWERPOINT="application/vnd.ms-powerpoint",n.APPLICATION_VND_MS_POWERPOINT_ADDIN_MACROENABLED_12="application/vnd.ms-powerpoint.addin.macroEnabled.12",n.APPLICATION_VND_MS_POWERPOINT_PRESENTATION_MACROENABLED_12="application/vnd.ms-powerpoint.presentation.macroEnabled.12",n.APPLICATION_VND_MS_POWERPOINT_SLIDE_MACROENABLED_12="application/vnd.ms-powerpoint.slide.macroEnabled.12",n.APPLICATION_VND_MS_POWERPOINT_SLIDESHOW_MACROENABLED_12="application/vnd.ms-powerpoint.slideshow.macroEnabled.12",n.APPLICATION_VND_MS_POWERPOINT_TEMPLATE_MACROENABLED_12="application/vnd.ms-powerpoint.template.macroEnabled.12",n.APPLICATION_VND_MS_PRINTDEVICECAPABILITIES_XML="application/vnd.ms-PrintDeviceCapabilities+xml",n.APPLICATION_VND_MS_PRINTSCHEMATICKET_XML="application/vnd.ms-PrintSchemaTicket+xml",n.APPLICATION_VND_MS_PROJECT="application/vnd.ms-project",n.APPLICATION_VND_MS_TNEF="application/vnd.ms-tnef",n.APPLICATION_VND_MS_WINDOWS_DEVICEPAIRING="application/vnd.ms-windows.devicepairing",n.APPLICATION_VND_MS_WINDOWS_NWPRINTING_OOB="application/vnd.ms-windows.nwprinting.oob",n.APPLICATION_VND_MS_WINDOWS_PRINTERPAIRING="application/vnd.ms-windows.printerpairing",n.APPLICATION_VND_MS_WINDOWS_WSD_OOB="application/vnd.ms-windows.wsd.oob",n.APPLICATION_VND_MS_WMDRM_LIC_CHLG_REQ="application/vnd.ms-wmdrm.lic-chlg-req",n.APPLICATION_VND_MS_WMDRM_LIC_RESP="application/vnd.ms-wmdrm.lic-resp",n.APPLICATION_VND_MS_WMDRM_METER_CHLG_REQ="application/vnd.ms-wmdrm.meter-chlg-req",n.APPLICATION_VND_MS_WMDRM_METER_RESP="application/vnd.ms-wmdrm.meter-resp",n.APPLICATION_VND_MS_WORD_DOCUMENT_MACROENABLED_12="application/vnd.ms-word.document.macroEnabled.12",n.APPLICATION_VND_MS_WORD_TEMPLATE_MACROENABLED_12="application/vnd.ms-word.template.macroEnabled.12",n.APPLICATION_VND_MS_WORKS="application/vnd.ms-works",n.APPLICATION_VND_MS_WPL="application/vnd.ms-wpl",n.APPLICATION_VND_MS_XPSDOCUMENT="application/vnd.ms-xpsdocument",n.APPLICATION_VND_MSA_DISK_IMAGE="application/vnd.msa-disk-image",n.APPLICATION_VND_MSEQ="application/vnd.mseq",n.APPLICATION_VND_MSGPACK="application/vnd.msgpack",n.APPLICATION_VND_MSIGN="application/vnd.msign",n.APPLICATION_VND_MULTIAD_CREATOR="application/vnd.multiad.creator",n.APPLICATION_VND_MULTIAD_CREATOR_CIF="application/vnd.multiad.creator.cif",n.APPLICATION_VND_MUSICIAN="application/vnd.musician",n.APPLICATION_VND_MUSIC_NIFF="application/vnd.music-niff",n.APPLICATION_VND_MUVEE_STYLE="application/vnd.muvee.style",n.APPLICATION_VND_MYNFC="application/vnd.mynfc",n.APPLICATION_VND_NACAMAR_YBRID_JSON="application/vnd.nacamar.ybrid+json",n.APPLICATION_VND_NANORIX_AUDITPROOF_JSON="application/vnd.nanorix.auditproof+json",n.APPLICATION_VND_NATO_BINDINGDATAOBJECT_CBOR="application/vnd.nato.bindingdataobject+cbor",n.APPLICATION_VND_NATO_BINDINGDATAOBJECT_JSON="application/vnd.nato.bindingdataobject+json",n.APPLICATION_VND_NATO_BINDINGDATAOBJECT_XML="application/vnd.nato.bindingdataobject+xml",n.APPLICATION_VND_NATO_OPENXMLFORMATS_PACKAGE_IEPD_ZIP="application/vnd.nato.openxmlformats-package.iepd+zip",n.APPLICATION_VND_NCD_CONTROL="application/vnd.ncd.control",n.APPLICATION_VND_NCD_REFERENCE="application/vnd.ncd.reference",n.APPLICATION_VND_NEARST_INV_JSON="application/vnd.nearst.inv+json",n.APPLICATION_VND_NEBUMIND_LINE="application/vnd.nebumind.line",n.APPLICATION_VND_NERVANA="application/vnd.nervana",n.APPLICATION_VND_NETFPX="application/vnd.netfpx",n.APPLICATION_VND_NEUROLANGUAGE_NLU="application/vnd.neurolanguage.nlu",n.APPLICATION_VND_NGDTUANH_ABOOK_ZIP="application/vnd.ngdtuanh.abook+zip",n.APPLICATION_VND_NGDTUANH_ABOOKPROJ_ZIP="application/vnd.ngdtuanh.abookproj+zip",n.APPLICATION_VND_NILA_PROTOBUF_BUNDLE_ZIP="application/vnd.nila.protobuf-bundle+zip",n.APPLICATION_VND_NIMN="application/vnd.nimn",n.APPLICATION_VND_NINTENDO_SNES_ROM="application/vnd.nintendo.snes.rom",n.APPLICATION_VND_NINTENDO_NITRO_ROM="application/vnd.nintendo.nitro.rom",n.APPLICATION_VND_NITF="application/vnd.nitf",n.APPLICATION_VND_NNU_PROFILE_JSON="application/vnd.nnu.profile+json",n.APPLICATION_VND_NOBLENET_DIRECTORY="application/vnd.noblenet-directory",n.APPLICATION_VND_NOBLENET_SEALER="application/vnd.noblenet-sealer",n.APPLICATION_VND_NOBLENET_WEB="application/vnd.noblenet-web",n.APPLICATION_VND_NOKIA_CATALOGS="application/vnd.nokia.catalogs",n.APPLICATION_VND_NOKIA_CONML_WBXML="application/vnd.nokia.conml+wbxml",n.APPLICATION_VND_NOKIA_CONML_XML="application/vnd.nokia.conml+xml",n.APPLICATION_VND_NOKIA_IPTV_CONFIG_XML="application/vnd.nokia.iptv.config+xml",n.APPLICATION_VND_NOKIA_ISDS_RADIO_PRESETS="application/vnd.nokia.iSDS-radio-presets",n.APPLICATION_VND_NOKIA_LANDMARK_WBXML="application/vnd.nokia.landmark+wbxml",n.APPLICATION_VND_NOKIA_LANDMARK_XML="application/vnd.nokia.landmark+xml",n.APPLICATION_VND_NOKIA_LANDMARKCOLLECTION_XML="application/vnd.nokia.landmarkcollection+xml",n.APPLICATION_VND_NOKIA_NCD="application/vnd.nokia.ncd",n.APPLICATION_VND_NOKIA_N_GAGE_AC_XML="application/vnd.nokia.n-gage.ac+xml",n.APPLICATION_VND_NOKIA_N_GAGE_DATA="application/vnd.nokia.n-gage.data",n.APPLICATION_VND_NOKIA_N_GAGE_SYMBIAN_INSTALL="application/vnd.nokia.n-gage.symbian.install",n.APPLICATION_VND_NOKIA_PCD_WBXML="application/vnd.nokia.pcd+wbxml",n.APPLICATION_VND_NOKIA_PCD_XML="application/vnd.nokia.pcd+xml",n.APPLICATION_VND_NOKIA_RADIO_PRESET="application/vnd.nokia.radio-preset",n.APPLICATION_VND_NOKIA_RADIO_PRESETS="application/vnd.nokia.radio-presets",n.APPLICATION_VND_NOMOS_JSON="application/vnd.nomos+json",n.APPLICATION_VND_NOVADIGM_EDM="application/vnd.novadigm.EDM",n.APPLICATION_VND_NOVADIGM_EDX="application/vnd.novadigm.EDX",n.APPLICATION_VND_NOVADIGM_EXT="application/vnd.novadigm.EXT",n.APPLICATION_VND_NTT_LOCAL_CONTENT_SHARE="application/vnd.ntt-local.content-share",n.APPLICATION_VND_NTT_LOCAL_FILE_TRANSFER="application/vnd.ntt-local.file-transfer",n.APPLICATION_VND_NTT_LOCAL_OGW_REMOTE_ACCESS="application/vnd.ntt-local.ogw_remote-access",n.APPLICATION_VND_NTT_LOCAL_SIP_TA_REMOTE="application/vnd.ntt-local.sip-ta_remote",n.APPLICATION_VND_NTT_LOCAL_SIP_TA_TCP_STREAM="application/vnd.ntt-local.sip-ta_tcp_stream",n.APPLICATION_VND_NUBALTEC_NUDOKU_GAME="application/vnd.nubaltec.nudoku-game",n.APPLICATION_VND_OAI_WORKFLOWS="application/vnd.oai.workflows",n.APPLICATION_VND_OAI_WORKFLOWS_JSON="application/vnd.oai.workflows+json",n.APPLICATION_VND_OAI_WORKFLOWS_YAML="application/vnd.oai.workflows+yaml",n.APPLICATION_VND_OASIS_OPENDOCUMENT_BASE="application/vnd.oasis.opendocument.base",n.APPLICATION_VND_OASIS_OPENDOCUMENT_CHART="application/vnd.oasis.opendocument.chart",n.APPLICATION_VND_OASIS_OPENDOCUMENT_CHART_TEMPLATE="application/vnd.oasis.opendocument.chart-template",n.APPLICATION_VND_OASIS_OPENDOCUMENT_DATABASE="application/vnd.oasis.opendocument.database",n.APPLICATION_VND_OASIS_OPENDOCUMENT_FORMULA="application/vnd.oasis.opendocument.formula",n.APPLICATION_VND_OASIS_OPENDOCUMENT_FORMULA_TEMPLATE="application/vnd.oasis.opendocument.formula-template",n.APPLICATION_VND_OASIS_OPENDOCUMENT_GRAPHICS="application/vnd.oasis.opendocument.graphics",n.APPLICATION_VND_OASIS_OPENDOCUMENT_GRAPHICS_TEMPLATE="application/vnd.oasis.opendocument.graphics-template",n.APPLICATION_VND_OASIS_OPENDOCUMENT_IMAGE="application/vnd.oasis.opendocument.image",n.APPLICATION_VND_OASIS_OPENDOCUMENT_IMAGE_TEMPLATE="application/vnd.oasis.opendocument.image-template",n.APPLICATION_VND_OASIS_OPENDOCUMENT_PRESENTATION="application/vnd.oasis.opendocument.presentation",n.APPLICATION_VND_OASIS_OPENDOCUMENT_PRESENTATION_TEMPLATE="application/vnd.oasis.opendocument.presentation-template",n.APPLICATION_VND_OASIS_OPENDOCUMENT_SPREADSHEET="application/vnd.oasis.opendocument.spreadsheet",n.APPLICATION_VND_OASIS_OPENDOCUMENT_SPREADSHEET_TEMPLATE="application/vnd.oasis.opendocument.spreadsheet-template",n.APPLICATION_VND_OASIS_OPENDOCUMENT_TEXT="application/vnd.oasis.opendocument.text",n.APPLICATION_VND_OASIS_OPENDOCUMENT_TEXT_MASTER="application/vnd.oasis.opendocument.text-master",n.APPLICATION_VND_OASIS_OPENDOCUMENT_TEXT_MASTER_TEMPLATE="application/vnd.oasis.opendocument.text-master-template",n.APPLICATION_VND_OASIS_OPENDOCUMENT_TEXT_TEMPLATE="application/vnd.oasis.opendocument.text-template",n.APPLICATION_VND_OASIS_OPENDOCUMENT_TEXT_WEB="application/vnd.oasis.opendocument.text-web",n.APPLICATION_VND_OBN="application/vnd.obn",n.APPLICATION_VND_OCF_CBOR="application/vnd.ocf+cbor",n.APPLICATION_VND_OCI_IMAGE_MANIFEST_V1_JSON="application/vnd.oci.image.manifest.v1+json",n.APPLICATION_VND_OFTN_L10N_JSON="application/vnd.oftn.l10n+json",n.APPLICATION_VND_OIPF_CONTENTACCESSDOWNLOAD_XML="application/vnd.oipf.contentaccessdownload+xml",n.APPLICATION_VND_OIPF_CONTENTACCESSSTREAMING_XML="application/vnd.oipf.contentaccessstreaming+xml",n.APPLICATION_VND_OIPF_CSPG_HEXBINARY="application/vnd.oipf.cspg-hexbinary",n.APPLICATION_VND_OIPF_DAE_SVG_XML="application/vnd.oipf.dae.svg+xml",n.APPLICATION_VND_OIPF_DAE_XHTML_XML="application/vnd.oipf.dae.xhtml+xml",n.APPLICATION_VND_OIPF_MIPPVCONTROLMESSAGE_XML="application/vnd.oipf.mippvcontrolmessage+xml",n.APPLICATION_VND_OIPF_PAE_GEM="application/vnd.oipf.pae.gem",n.APPLICATION_VND_OIPF_SPDISCOVERY_XML="application/vnd.oipf.spdiscovery+xml",n.APPLICATION_VND_OIPF_SPDLIST_XML="application/vnd.oipf.spdlist+xml",n.APPLICATION_VND_OIPF_UEPROFILE_XML="application/vnd.oipf.ueprofile+xml",n.APPLICATION_VND_OIPF_USERPROFILE_XML="application/vnd.oipf.userprofile+xml",n.APPLICATION_VND_OLPC_SUGAR="application/vnd.olpc-sugar",n.APPLICATION_VND_OMA_BCAST_ASSOCIATED_PROCEDURE_PARAMETER_XML="application/vnd.oma.bcast.associated-procedure-parameter+xml",n.APPLICATION_VND_OMA_BCAST_DRM_TRIGGER_XML="application/vnd.oma.bcast.drm-trigger+xml",n.APPLICATION_VND_OMA_BCAST_IMD_XML="application/vnd.oma.bcast.imd+xml",n.APPLICATION_VND_OMA_BCAST_LTKM="application/vnd.oma.bcast.ltkm",n.APPLICATION_VND_OMA_BCAST_NOTIFICATION_XML="application/vnd.oma.bcast.notification+xml",n.APPLICATION_VND_OMA_BCAST_PROVISIONINGTRIGGER="application/vnd.oma.bcast.provisioningtrigger",n.APPLICATION_VND_OMA_BCAST_SGBOOT="application/vnd.oma.bcast.sgboot",n.APPLICATION_VND_OMA_BCAST_SGDD_XML="application/vnd.oma.bcast.sgdd+xml",n.APPLICATION_VND_OMA_BCAST_SGDU="application/vnd.oma.bcast.sgdu",n.APPLICATION_VND_OMA_BCAST_SIMPLE_SYMBOL_CONTAINER="application/vnd.oma.bcast.simple-symbol-container",n.APPLICATION_VND_OMA_BCAST_SMARTCARD_TRIGGER_XML="application/vnd.oma.bcast.smartcard-trigger+xml",n.APPLICATION_VND_OMA_BCAST_SPROV_XML="application/vnd.oma.bcast.sprov+xml",n.APPLICATION_VND_OMA_BCAST_STKM="application/vnd.oma.bcast.stkm",n.APPLICATION_VND_OMA_CAB_ADDRESS_BOOK_XML="application/vnd.oma.cab-address-book+xml",n.APPLICATION_VND_OMA_CAB_FEATURE_HANDLER_XML="application/vnd.oma.cab-feature-handler+xml",n.APPLICATION_VND_OMA_CAB_PCC_XML="application/vnd.oma.cab-pcc+xml",n.APPLICATION_VND_OMA_CAB_SUBS_INVITE_XML="application/vnd.oma.cab-subs-invite+xml",n.APPLICATION_VND_OMA_CAB_USER_PREFS_XML="application/vnd.oma.cab-user-prefs+xml",n.APPLICATION_VND_OMA_DCD="application/vnd.oma.dcd",n.APPLICATION_VND_OMA_DCDC="application/vnd.oma.dcdc",n.APPLICATION_VND_OMA_DD2_XML="application/vnd.oma.dd2+xml",n.APPLICATION_VND_OMA_DRM_RISD_XML="application/vnd.oma.drm.risd+xml",n.APPLICATION_VND_OMA_GROUP_USAGE_LIST_XML="application/vnd.oma.group-usage-list+xml",n.APPLICATION_VND_OMA_LWM2M_CBOR="application/vnd.oma.lwm2m+cbor",n.APPLICATION_VND_OMA_LWM2M_JSON="application/vnd.oma.lwm2m+json",n.APPLICATION_VND_OMA_LWM2M_TLV="application/vnd.oma.lwm2m+tlv",n.APPLICATION_VND_OMA_PAL_XML="application/vnd.oma.pal+xml",n.APPLICATION_VND_OMA_POC_DETAILED_PROGRESS_REPORT_XML="application/vnd.oma.poc.detailed-progress-report+xml",n.APPLICATION_VND_OMA_POC_FINAL_REPORT_XML="application/vnd.oma.poc.final-report+xml",n.APPLICATION_VND_OMA_POC_GROUPS_XML="application/vnd.oma.poc.groups+xml",n.APPLICATION_VND_OMA_POC_INVOCATION_DESCRIPTOR_XML="application/vnd.oma.poc.invocation-descriptor+xml",n.APPLICATION_VND_OMA_POC_OPTIMIZED_PROGRESS_REPORT_XML="application/vnd.oma.poc.optimized-progress-report+xml",n.APPLICATION_VND_OMA_PUSH="application/vnd.oma.push",n.APPLICATION_VND_OMA_SCIDM_MESSAGES_XML="application/vnd.oma.scidm.messages+xml",n.APPLICATION_VND_OMA_XCAP_DIRECTORY_XML="application/vnd.oma.xcap-directory+xml",n.APPLICATION_VND_OMADS_EMAIL_XML="application/vnd.omads-email+xml",n.APPLICATION_VND_OMADS_FILE_XML="application/vnd.omads-file+xml",n.APPLICATION_VND_OMADS_FOLDER_XML="application/vnd.omads-folder+xml",n.APPLICATION_VND_OMALOC_SUPL_INIT="application/vnd.omaloc-supl-init",n.APPLICATION_VND_OMA_SCWS_CONFIG="application/vnd.oma-scws-config",n.APPLICATION_VND_OMA_SCWS_HTTP_REQUEST="application/vnd.oma-scws-http-request",n.APPLICATION_VND_OMA_SCWS_HTTP_RESPONSE="application/vnd.oma-scws-http-response",n.APPLICATION_VND_OMS_CELLULAR_COSE_CONTENT_CBOR="application/vnd.oms.cellular-cose-content+cbor",n.APPLICATION_VND_ONEPAGER="application/vnd.onepager",n.APPLICATION_VND_ONEPAGERTAMP="application/vnd.onepagertamp",n.APPLICATION_VND_ONEPAGERTAMX="application/vnd.onepagertamx",n.APPLICATION_VND_ONEPAGERTAT="application/vnd.onepagertat",n.APPLICATION_VND_ONEPAGERTATP="application/vnd.onepagertatp",n.APPLICATION_VND_ONEPAGERTATX="application/vnd.onepagertatx",n.APPLICATION_VND_ONVIF_METADATA="application/vnd.onvif.metadata",n.APPLICATION_VND_OOTMM_PATCH_ZIP="application/vnd.ootmm.patch+zip",n.APPLICATION_VND_OPENBLOX_GAME_BINARY="application/vnd.openblox.game-binary",n.APPLICATION_VND_OPENBLOX_GAME_XML="application/vnd.openblox.game+xml",n.APPLICATION_VND_OPENEYE_OEB="application/vnd.openeye.oeb",n.APPLICATION_VND_OPENPRINTTAG="application/vnd.openprinttag",n.APPLICATION_VND_OPENSTREETMAP_DATA_XML="application/vnd.openstreetmap.data+xml",n.APPLICATION_VND_OPENTIMESTAMPS_OTS="application/vnd.opentimestamps.ots",n.APPLICATION_VND_OPENVPI_DSPX_JSON="application/vnd.openvpi.dspx+json",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_CUSTOM_PROPERTIES_XML="application/vnd.openxmlformats-officedocument.custom-properties+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_CUSTOMXMLPROPERTIES_XML="application/vnd.openxmlformats-officedocument.customXmlProperties+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_DRAWING_XML="application/vnd.openxmlformats-officedocument.drawing+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_DRAWINGML_CHART_XML="application/vnd.openxmlformats-officedocument.drawingml.chart+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_DRAWINGML_CHARTSHAPES_XML="application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_DRAWINGML_DIAGRAMCOLORS_XML="application/vnd.openxmlformats-officedocument.drawingml.diagramColors+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_DRAWINGML_DIAGRAMDATA_XML="application/vnd.openxmlformats-officedocument.drawingml.diagramData+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_DRAWINGML_DIAGRAMLAYOUT_XML="application/vnd.openxmlformats-officedocument.drawingml.diagramLayout+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_DRAWINGML_DIAGRAMSTYLE_XML="application/vnd.openxmlformats-officedocument.drawingml.diagramStyle+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_EXTENDED_PROPERTIES_XML="application/vnd.openxmlformats-officedocument.extended-properties+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_COMMENTAUTHORS_XML="application/vnd.openxmlformats-officedocument.presentationml.commentAuthors+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_COMMENTS_XML="application/vnd.openxmlformats-officedocument.presentationml.comments+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_HANDOUTMASTER_XML="application/vnd.openxmlformats-officedocument.presentationml.handoutMaster+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_NOTESMASTER_XML="application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_NOTESSLIDE_XML="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_PRESENTATION="application/vnd.openxmlformats-officedocument.presentationml.presentation",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_PRESENTATION_MAIN_XML="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_PRESPROPS_XML="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_SLIDE="application/vnd.openxmlformats-officedocument.presentationml.slide",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_SLIDE_XML="application/vnd.openxmlformats-officedocument.presentationml.slide+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_SLIDELAYOUT_XML="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_SLIDEMASTER_XML="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_SLIDESHOW="application/vnd.openxmlformats-officedocument.presentationml.slideshow",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_SLIDESHOW_MAIN_XML="application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_SLIDEUPDATEINFO_XML="application/vnd.openxmlformats-officedocument.presentationml.slideUpdateInfo+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_TABLESTYLES_XML="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_TAGS_XML="application/vnd.openxmlformats-officedocument.presentationml.tags+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_TEMPLATE="application/vnd.openxmlformats-officedocument.presentationml.template",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_TEMPLATE_MAIN_XML="application/vnd.openxmlformats-officedocument.presentationml.template.main+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_PRESENTATIONML_VIEWPROPS_XML="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_CALCCHAIN_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.calcChain+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_CHARTSHEET_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_COMMENTS_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_CONNECTIONS_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_DIALOGSHEET_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_EXTERNALLINK_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.externalLink+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_PIVOTCACHEDEFINITION_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheDefinition+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_PIVOTCACHERECORDS_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheRecords+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_PIVOTTABLE_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.pivotTable+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_QUERYTABLE_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.queryTable+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_REVISIONHEADERS_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.revisionHeaders+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_REVISIONLOG_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.revisionLog+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_SHAREDSTRINGS_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_SHEET="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_SHEET_MAIN_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_SHEETMETADATA_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.sheetMetadata+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_STYLES_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_TABLE_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_TABLESINGLECELLS_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.tableSingleCells+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_TEMPLATE="application/vnd.openxmlformats-officedocument.spreadsheetml.template",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_TEMPLATE_MAIN_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_USERNAMES_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.userNames+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_VOLATILEDEPENDENCIES_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.volatileDependencies+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_SPREADSHEETML_WORKSHEET_XML="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_THEME_XML="application/vnd.openxmlformats-officedocument.theme+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_THEMEOVERRIDE_XML="application/vnd.openxmlformats-officedocument.themeOverride+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_VMLDRAWING="application/vnd.openxmlformats-officedocument.vmlDrawing",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_COMMENTS_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_DOCUMENT="application/vnd.openxmlformats-officedocument.wordprocessingml.document",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_DOCUMENT_GLOSSARY_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_DOCUMENT_MAIN_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_ENDNOTES_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_FONTTABLE_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_FOOTER_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_FOOTNOTES_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_NUMBERING_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_SETTINGS_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_STYLES_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_TEMPLATE="application/vnd.openxmlformats-officedocument.wordprocessingml.template",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_TEMPLATE_MAIN_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml",n.APPLICATION_VND_OPENXMLFORMATS_OFFICEDOCUMENT_WORDPROCESSINGML_WEBSETTINGS_XML="application/vnd.openxmlformats-officedocument.wordprocessingml.webSettings+xml",n.APPLICATION_VND_OPENXMLFORMATS_PACKAGE_CORE_PROPERTIES_XML="application/vnd.openxmlformats-package.core-properties+xml",n.APPLICATION_VND_OPENXMLFORMATS_PACKAGE_DIGITAL_SIGNATURE_XMLSIGNATURE_XML="application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml",n.APPLICATION_VND_OPENXMLFORMATS_PACKAGE_RELATIONSHIPS_XML="application/vnd.openxmlformats-package.relationships+xml",n.APPLICATION_VND_ORACLE_RESOURCE_JSON="application/vnd.oracle.resource+json",n.APPLICATION_VND_ORANGE_INDATA="application/vnd.orange.indata",n.APPLICATION_VND_OSA_NETDEPLOY="application/vnd.osa.netdeploy",n.APPLICATION_VND_OSGEO_MAPGUIDE_PACKAGE="application/vnd.osgeo.mapguide.package",n.APPLICATION_VND_OSGI_BUNDLE="application/vnd.osgi.bundle",n.APPLICATION_VND_OSGI_DP="application/vnd.osgi.dp",n.APPLICATION_VND_OSGI_SUBSYSTEM="application/vnd.osgi.subsystem",n.APPLICATION_VND_OTPS_CT_KIP_XML="application/vnd.otps.ct-kip+xml",n.APPLICATION_VND_OXLI_COUNTGRAPH="application/vnd.oxli.countgraph",n.APPLICATION_VND_PAGERDUTY_JSON="application/vnd.pagerduty+json",n.APPLICATION_VND_PALM="application/vnd.palm",n.APPLICATION_VND_PANOPLY="application/vnd.panoply",n.APPLICATION_VND_PAOS_XML="application/vnd.paos.xml",n.APPLICATION_VND_PASTI_STX_DISK_IMAGE="application/vnd.pasti-stx-disk-image",n.APPLICATION_VND_PATENTDIVE="application/vnd.patentdive",n.APPLICATION_VND_PATIENTECOMMSDOC="application/vnd.patientecommsdoc",n.APPLICATION_VND_PAWAAFILE="application/vnd.pawaafile",n.APPLICATION_VND_PCOS="application/vnd.pcos",n.APPLICATION_VND_PEBBLESTREAM_PSOSF_ZIP="application/vnd.pebblestream.psosf+zip",n.APPLICATION_VND_PENGUIN_PN_THEUIP="application/vnd.penguin-pn.theuip",n.APPLICATION_VND_PG_FORMAT="application/vnd.pg.format",n.APPLICATION_VND_PG_OSASLI="application/vnd.pg.osasli",n.APPLICATION_VND_PHBK_XML="application/vnd.phbk+xml",n.APPLICATION_VND_PIACCESS_APPLICATION_LICENCE="application/vnd.piaccess.application-licence",n.APPLICATION_VND_PICSEL="application/vnd.picsel",n.APPLICATION_VND_PMI_WIDGET="application/vnd.pmi.widget",n.APPLICATION_VND_PMTILES="application/vnd.pmtiles",n.APPLICATION_VND_POC_GROUP_ADVERTISEMENT_XML="application/vnd.poc.group-advertisement+xml",n.APPLICATION_VND_POCKETLEARN="application/vnd.pocketlearn",n.APPLICATION_VND_PORTABLEWEB_ZIP="application/vnd.portableweb+zip",n.APPLICATION_VND_POWERBUILDER6="application/vnd.powerbuilder6",n.APPLICATION_VND_POWERBUILDER6_S="application/vnd.powerbuilder6-s",n.APPLICATION_VND_POWERBUILDER7="application/vnd.powerbuilder7",n.APPLICATION_VND_POWERBUILDER75="application/vnd.powerbuilder75",n.APPLICATION_VND_POWERBUILDER75_S="application/vnd.powerbuilder75-s",n.APPLICATION_VND_POWERBUILDER7_S="application/vnd.powerbuilder7-s",n.APPLICATION_VND_PP_SYSTEMVERIFY_XML="application/vnd.pp.systemverify+xml",n.APPLICATION_VND_PREMINET="application/vnd.preminet",n.APPLICATION_VND_PREVIEWSYSTEMS_BOX="application/vnd.previewsystems.box",n.APPLICATION_VND_PRISMATIC="application/vnd.prismatic",n.APPLICATION_VND_PRML_YAML="application/vnd.prml+yaml",n.APPLICATION_VND_PROJECT_GRAPH="application/vnd.project-graph",n.APPLICATION_VND_PROTEUS_MAGAZINE="application/vnd.proteus.magazine",n.APPLICATION_VND_PSFS="application/vnd.psfs",n.APPLICATION_VND_PT_MUNDUSMUNDI="application/vnd.pt.mundusmundi",n.APPLICATION_VND_PUBLISHARE_DELTA_TREE="application/vnd.publishare-delta-tree",n.APPLICATION_VND_PVI_PTID1="application/vnd.pvi.ptid1",n.APPLICATION_VND_PWG_MULTIPLEXED="application/vnd.pwg-multiplexed",n.APPLICATION_VND_PWG_XHTML_PRINT_XML="application/vnd.pwg-xhtml-print+xml",n.APPLICATION_VND_PYON_JSON="application/vnd.pyon+json",n.APPLICATION_VND_QUALCOMM_BREW_APP_RES="application/vnd.qualcomm.brew-app-res",n.APPLICATION_VND_QUANTUMSEQURITY_QNSQY="application/vnd.quantumsequrity.qnsqy",n.APPLICATION_VND_QUARANTAINENET="application/vnd.quarantainenet",n.APPLICATION_VND_QUARK_QUARKXPRESS="application/vnd.Quark.QuarkXPress",n.APPLICATION_VND_QUOBJECT_QUOXDOCUMENT="application/vnd.quobject-quoxdocument",n.APPLICATION_VND_R74N_SANDBOXELS_JSON="application/vnd.R74n.sandboxels+json",n.APPLICATION_VND_RADISYS_MOML_XML="application/vnd.radisys.moml+xml",n.APPLICATION_VND_RADISYS_MSML_AUDIT_CONF_XML="application/vnd.radisys.msml-audit-conf+xml",n.APPLICATION_VND_RADISYS_MSML_AUDIT_CONN_XML="application/vnd.radisys.msml-audit-conn+xml",n.APPLICATION_VND_RADISYS_MSML_AUDIT_DIALOG_XML="application/vnd.radisys.msml-audit-dialog+xml",n.APPLICATION_VND_RADISYS_MSML_AUDIT_STREAM_XML="application/vnd.radisys.msml-audit-stream+xml",n.APPLICATION_VND_RADISYS_MSML_AUDIT_XML="application/vnd.radisys.msml-audit+xml",n.APPLICATION_VND_RADISYS_MSML_CONF_XML="application/vnd.radisys.msml-conf+xml",n.APPLICATION_VND_RADISYS_MSML_DIALOG_BASE_XML="application/vnd.radisys.msml-dialog-base+xml",n.APPLICATION_VND_RADISYS_MSML_DIALOG_FAX_DETECT_XML="application/vnd.radisys.msml-dialog-fax-detect+xml",n.APPLICATION_VND_RADISYS_MSML_DIALOG_FAX_SENDRECV_XML="application/vnd.radisys.msml-dialog-fax-sendrecv+xml",n.APPLICATION_VND_RADISYS_MSML_DIALOG_GROUP_XML="application/vnd.radisys.msml-dialog-group+xml",n.APPLICATION_VND_RADISYS_MSML_DIALOG_SPEECH_XML="application/vnd.radisys.msml-dialog-speech+xml",n.APPLICATION_VND_RADISYS_MSML_DIALOG_TRANSFORM_XML="application/vnd.radisys.msml-dialog-transform+xml",n.APPLICATION_VND_RADISYS_MSML_DIALOG_XML="application/vnd.radisys.msml-dialog+xml",n.APPLICATION_VND_RADISYS_MSML_XML="application/vnd.radisys.msml+xml",n.APPLICATION_VND_RAINSTOR_DATA="application/vnd.rainstor.data",n.APPLICATION_VND_RAPID="application/vnd.rapid",n.APPLICATION_VND_RAR="application/vnd.rar",n.APPLICATION_VND_REALVNC_BED="application/vnd.realvnc.bed",n.APPLICATION_VND_RECORDARE_MUSICXML="application/vnd.recordare.musicxml",n.APPLICATION_VND_RECORDARE_MUSICXML_XML="application/vnd.recordare.musicxml+xml",n.APPLICATION_VND_REGO="application/vnd.rego",n.APPLICATION_VND_RELPIPE="application/vnd.relpipe",n.APPLICATION_VND_RENLEARN_RLPRINT="application/vnd.RenLearn.rlprint",n.APPLICATION_VND_RESILIENT_LOGIC="application/vnd.resilient.logic",n.APPLICATION_VND_RESTFUL_JSON="application/vnd.restful+json",n.APPLICATION_VND_RIG_CRYPTONOTE="application/vnd.rig.cryptonote",n.APPLICATION_VND_ROUTE66_LINK66_XML="application/vnd.route66.link66+xml",n.APPLICATION_VND_RS_274X="application/vnd.rs-274x",n.APPLICATION_VND_RUCKUS_DOWNLOAD="application/vnd.ruckus.download",n.APPLICATION_VND_S3SMS="application/vnd.s3sms",n.APPLICATION_VND_SAILINGTRACKER_TRACK="application/vnd.sailingtracker.track",n.APPLICATION_VND_SALVANOTE_SAL="application/vnd.salvanote.sal",n.APPLICATION_VND_SAR="application/vnd.sar",n.APPLICATION_VND_SBM_CID="application/vnd.sbm.cid",n.APPLICATION_VND_SBM_MID2="application/vnd.sbm.mid2",n.APPLICATION_VND_SCRIBUS="application/vnd.scribus",n.APPLICATION_VND_SEALED_3DF="application/vnd.sealed.3df",n.APPLICATION_VND_SEALED_CSF="application/vnd.sealed.csf",n.APPLICATION_VND_SEALED_DOC="application/vnd.sealed.doc",n.APPLICATION_VND_SEALED_EML="application/vnd.sealed.eml",n.APPLICATION_VND_SEALED_MHT="application/vnd.sealed.mht",n.APPLICATION_VND_SEALED_NET="application/vnd.sealed.net",n.APPLICATION_VND_SEALED_PPT="application/vnd.sealed.ppt",n.APPLICATION_VND_SEALED_TIFF="application/vnd.sealed.tiff",n.APPLICATION_VND_SEALED_XLS="application/vnd.sealed.xls",n.APPLICATION_VND_SEALEDMEDIA_SOFTSEAL_HTML="application/vnd.sealedmedia.softseal.html",n.APPLICATION_VND_SEALEDMEDIA_SOFTSEAL_PDF="application/vnd.sealedmedia.softseal.pdf",n.APPLICATION_VND_SEEMAIL="application/vnd.seemail",n.APPLICATION_VND_SEIS_JSON="application/vnd.seis+json",n.APPLICATION_VND_SEMA="application/vnd.sema",n.APPLICATION_VND_SEMD="application/vnd.semd",n.APPLICATION_VND_SEMF="application/vnd.semf",n.APPLICATION_VND_SHADE_SAVE_FILE="application/vnd.shade-save-file",n.APPLICATION_VND_SHANA_INFORMED_FORMDATA="application/vnd.shana.informed.formdata",n.APPLICATION_VND_SHANA_INFORMED_FORMTEMPLATE="application/vnd.shana.informed.formtemplate",n.APPLICATION_VND_SHANA_INFORMED_INTERCHANGE="application/vnd.shana.informed.interchange",n.APPLICATION_VND_SHANA_INFORMED_PACKAGE="application/vnd.shana.informed.package",n.APPLICATION_VND_SHOOTPROOF_JSON="application/vnd.shootproof+json",n.APPLICATION_VND_SHOPKICK_JSON="application/vnd.shopkick+json",n.APPLICATION_VND_SHP="application/vnd.shp",n.APPLICATION_VND_SHX="application/vnd.shx",n.APPLICATION_VND_SIGROK_SESSION="application/vnd.sigrok.session",n.APPLICATION_VND_SIMTECH_MINDMAPPER="application/vnd.SimTech-MindMapper",n.APPLICATION_VND_SIREN_JSON="application/vnd.siren+json",n.APPLICATION_VND_SIRTX_VMV0="application/vnd.sirtx.vmv0",n.APPLICATION_VND_SKETCHOMETRY="application/vnd.sketchometry",n.APPLICATION_VND_SMAF="application/vnd.smaf",n.APPLICATION_VND_SMART_NOTEBOOK="application/vnd.smart.notebook",n.APPLICATION_VND_SMART_TEACHER="application/vnd.smart.teacher",n.APPLICATION_VND_SMINTIO_PORTALS_ARCHIVE="application/vnd.smintio.portals.archive",n.APPLICATION_VND_SNESDEV_PAGE_TABLE="application/vnd.snesdev-page-table",n.APPLICATION_VND_SOFTPRES_IPF_DISK_IMAGE="application/vnd.softpres-ipf-disk-image",n.APPLICATION_VND_SOFTWARE602_FILLER_FORM_XML="application/vnd.software602.filler.form+xml",n.APPLICATION_VND_SOFTWARE602_FILLER_FORM_XML_ZIP="application/vnd.software602.filler.form-xml-zip",n.APPLICATION_VND_SOLENT_SDKM_XML="application/vnd.solent.sdkm+xml",n.APPLICATION_VND_SPOTFIRE_DXP="application/vnd.spotfire.dxp",n.APPLICATION_VND_SPOTFIRE_SFS="application/vnd.spotfire.sfs",n.APPLICATION_VND_SQLITE3="application/vnd.sqlite3",n.APPLICATION_VND_SRI="application/vnd.sri",n.APPLICATION_VND_SSS_COD="application/vnd.sss-cod",n.APPLICATION_VND_SSS_DTF="application/vnd.sss-dtf",n.APPLICATION_VND_SSS_NTF="application/vnd.sss-ntf",n.APPLICATION_VND_STEPMANIA_PACKAGE="application/vnd.stepmania.package",n.APPLICATION_VND_STEPMANIA_STEPCHART="application/vnd.stepmania.stepchart",n.APPLICATION_VND_STREET_STREAM="application/vnd.street-stream",n.APPLICATION_VND_SUN_WADL_XML="application/vnd.sun.wadl+xml",n.APPLICATION_VND_SUPERCARD_PRO_DISK_IMAGE="application/vnd.supercard-pro-disk-image",n.APPLICATION_VND_SUPERFILE_SUPER="application/vnd.superfile.super",n.APPLICATION_VND_SUS_CALENDAR="application/vnd.sus-calendar",n.APPLICATION_VND_SVD="application/vnd.svd",n.APPLICATION_VND_SVR_RECEIPT_JSON="application/vnd.svr.receipt+json",n.APPLICATION_VND_SWIFTVIEW_ICS="application/vnd.swiftview-ics",n.APPLICATION_VND_SYBYL_MOL2="application/vnd.sybyl.mol2",n.APPLICATION_VND_SYCLE_XML="application/vnd.sycle+xml",n.APPLICATION_VND_SYFT_JSON="application/vnd.syft+json",n.APPLICATION_VND_SYNCML_DM_NOTIFICATION="application/vnd.syncml.dm.notification",n.APPLICATION_VND_SYNCML_DMDDF_XML="application/vnd.syncml.dmddf+xml",n.APPLICATION_VND_SYNCML_DMTNDS_WBXML="application/vnd.syncml.dmtnds+wbxml",n.APPLICATION_VND_SYNCML_DMTNDS_XML="application/vnd.syncml.dmtnds+xml",n.APPLICATION_VND_SYNCML_DMDDF_WBXML="application/vnd.syncml.dmddf+wbxml",n.APPLICATION_VND_SYNCML_DM_WBXML="application/vnd.syncml.dm+wbxml",n.APPLICATION_VND_SYNCML_DM_XML="application/vnd.syncml.dm+xml",n.APPLICATION_VND_SYNCML_DS_NOTIFICATION="application/vnd.syncml.ds.notification",n.APPLICATION_VND_SYNCML_XML="application/vnd.syncml+xml",n.APPLICATION_VND_TABLAFOCUS_NOTATION="application/vnd.tablafocus.notation",n.APPLICATION_VND_TABLESCHEMA_JSON="application/vnd.tableschema+json",n.APPLICATION_VND_TAO_INTENT_MODULE_ARCHIVE="application/vnd.tao.intent-module-archive",n.APPLICATION_VND_TCPDUMP_PCAP="application/vnd.tcpdump.pcap",n.APPLICATION_VND_THINK_CELL_PPTTC_JSON="application/vnd.think-cell.ppttc+json",n.APPLICATION_VND_TML="application/vnd.tml",n.APPLICATION_VND_TMD_MEDIAFLEX_API_XML="application/vnd.tmd.mediaflex.api+xml",n.APPLICATION_VND_TMOBILE_LIVETV="application/vnd.tmobile-livetv",n.APPLICATION_VND_TRI_ONESOURCE="application/vnd.tri.onesource",n.APPLICATION_VND_TRID_TPT="application/vnd.trid.tpt",n.APPLICATION_VND_TRISCAPE_MXS="application/vnd.triscape.mxs",n.APPLICATION_VND_TRUEAPP="application/vnd.trueapp",n.APPLICATION_VND_TRUEDOC="application/vnd.truedoc",n.APPLICATION_VND_UBISOFT_WEBPLAYER="application/vnd.ubisoft.webplayer",n.APPLICATION_VND_UFDL="application/vnd.ufdl",n.APPLICATION_VND_UIC_DOSIPAS_V1="application/vnd.uic.dosipas.v1",n.APPLICATION_VND_UIC_DOSIPAS_V2="application/vnd.uic.dosipas.v2",n.APPLICATION_VND_UIC_OSDM_JSON="application/vnd.uic.osdm+json",n.APPLICATION_VND_UIC_TLB_FCB="application/vnd.uic.tlb-fcb",n.APPLICATION_VND_UIQ_THEME="application/vnd.uiq.theme",n.APPLICATION_VND_UMAJIN="application/vnd.umajin",n.APPLICATION_VND_UNITY="application/vnd.unity",n.APPLICATION_VND_UOML_XML="application/vnd.uoml+xml",n.APPLICATION_VND_UPLANET_ALERT="application/vnd.uplanet.alert",n.APPLICATION_VND_UPLANET_ALERT_WBXML="application/vnd.uplanet.alert-wbxml",n.APPLICATION_VND_UPLANET_BEARER_CHOICE="application/vnd.uplanet.bearer-choice",n.APPLICATION_VND_UPLANET_BEARER_CHOICE_WBXML="application/vnd.uplanet.bearer-choice-wbxml",n.APPLICATION_VND_UPLANET_CACHEOP="application/vnd.uplanet.cacheop",n.APPLICATION_VND_UPLANET_CACHEOP_WBXML="application/vnd.uplanet.cacheop-wbxml",n.APPLICATION_VND_UPLANET_CHANNEL="application/vnd.uplanet.channel",n.APPLICATION_VND_UPLANET_CHANNEL_WBXML="application/vnd.uplanet.channel-wbxml",n.APPLICATION_VND_UPLANET_LIST="application/vnd.uplanet.list",n.APPLICATION_VND_UPLANET_LISTCMD="application/vnd.uplanet.listcmd",n.APPLICATION_VND_UPLANET_LISTCMD_WBXML="application/vnd.uplanet.listcmd-wbxml",n.APPLICATION_VND_UPLANET_LIST_WBXML="application/vnd.uplanet.list-wbxml",n.APPLICATION_VND_URI_MAP="application/vnd.uri-map",n.APPLICATION_VND_UPLANET_SIGNAL="application/vnd.uplanet.signal",n.APPLICATION_VND_VALVE_SOURCE_MATERIAL="application/vnd.valve.source.material",n.APPLICATION_VND_VCX="application/vnd.vcx",n.APPLICATION_VND_VD_STUDY="application/vnd.vd-study",n.APPLICATION_VND_VECTORWORKS="application/vnd.vectorworks",n.APPLICATION_VND_VEL_JSON="application/vnd.vel+json",n.APPLICATION_VND_VERAISON_NVIDIA_GPU_EVIDENCE_JSON="application/vnd.veraison.nvidia-gpu-evidence+json",n.APPLICATION_VND_VERAISON_TSM_REPORT_CBOR="application/vnd.veraison.tsm-report+cbor",n.APPLICATION_VND_VERAISON_TSM_REPORT_JSON="application/vnd.veraison.tsm-report+json",n.APPLICATION_VND_VERIFIER_ATTESTATION_JWT="application/vnd.verifier-attestation+jwt",n.APPLICATION_VND_VERIMATRIX_VCAS="application/vnd.verimatrix.vcas",n.APPLICATION_VND_VERITONE_AION_JSON="application/vnd.veritone.aion+json",n.APPLICATION_VND_VERTIFILE_PVF="application/vnd.vertifile.pvf",n.APPLICATION_VND_VERYANT_THIN="application/vnd.veryant.thin",n.APPLICATION_VND_VES_ENCRYPTED="application/vnd.ves.encrypted",n.APPLICATION_VND_VIDSOFT_VIDCONFERENCE="application/vnd.vidsoft.vidconference",n.APPLICATION_VND_VIMINA_VMA="application/vnd.vimina.vma",n.APPLICATION_VND_VISIO="application/vnd.visio",n.APPLICATION_VND_VISIONARY="application/vnd.visionary",n.APPLICATION_VND_VIVIDENCE_SCRIPTFILE="application/vnd.vividence.scriptfile",n.APPLICATION_VND_VOCALSHAPER_VSP4="application/vnd.vocalshaper.vsp4",n.APPLICATION_VND_VSF="application/vnd.vsf",n.APPLICATION_VND_VUQ="application/vnd.vuq",n.APPLICATION_VND_WANTVERSE="application/vnd.wantverse",n.APPLICATION_VND_WAP_SIC="application/vnd.wap.sic",n.APPLICATION_VND_WAP_SLC="application/vnd.wap.slc",n.APPLICATION_VND_WAP_WBXML="application/vnd.wap.wbxml",n.APPLICATION_VND_WAP_WMLC="application/vnd.wap.wmlc",n.APPLICATION_VND_WAP_WMLSCRIPTC="application/vnd.wap.wmlscriptc",n.APPLICATION_VND_WASMFLOW_WAFL="application/vnd.wasmflow.wafl",n.APPLICATION_VND_WEBTURBO="application/vnd.webturbo",n.APPLICATION_VND_WFA_DPP="application/vnd.wfa.dpp",n.APPLICATION_VND_WFA_P2P="application/vnd.wfa.p2p",n.APPLICATION_VND_WFA_WSC="application/vnd.wfa.wsc",n.APPLICATION_VND_WINDOWS_DEVICEPAIRING="application/vnd.windows.devicepairing",n.APPLICATION_VND_WMAP="application/vnd.wmap",n.APPLICATION_VND_WMC="application/vnd.wmc",n.APPLICATION_VND_WMF_BOOTSTRAP="application/vnd.wmf.bootstrap",n.APPLICATION_VND_WOLFRAM_MATHEMATICA="application/vnd.wolfram.mathematica",n.APPLICATION_VND_WOLFRAM_MATHEMATICA_PACKAGE="application/vnd.wolfram.mathematica.package",n.APPLICATION_VND_WOLFRAM_PLAYER="application/vnd.wolfram.player",n.APPLICATION_VND_WORDLIFT="application/vnd.wordlift",n.APPLICATION_VND_WORDPERFECT="application/vnd.wordperfect",n.APPLICATION_VND_WQD="application/vnd.wqd",n.APPLICATION_VND_WRQ_HP3000_LABELLED="application/vnd.wrq-hp3000-labelled",n.APPLICATION_VND_WT_STF="application/vnd.wt.stf",n.APPLICATION_VND_WV_CSP_XML="application/vnd.wv.csp+xml",n.APPLICATION_VND_WV_CSP_WBXML="application/vnd.wv.csp+wbxml",n.APPLICATION_VND_WV_SSP_XML="application/vnd.wv.ssp+xml",n.APPLICATION_VND_XACML_JSON="application/vnd.xacml+json",n.APPLICATION_VND_XARA="application/vnd.xara",n.APPLICATION_VND_XARIN_CPJ="application/vnd.xarin.cpj",n.APPLICATION_VND_XCDN="application/vnd.xcdn",n.APPLICATION_VND_XECRETS_ENCRYPTED="application/vnd.xecrets-encrypted",n.APPLICATION_VND_XFDL="application/vnd.xfdl",n.APPLICATION_VND_XFDL_WEBFORM="application/vnd.xfdl.webform",n.APPLICATION_VND_XMI_XML="application/vnd.xmi+xml",n.APPLICATION_VND_XMPIE_CPKG="application/vnd.xmpie.cpkg",n.APPLICATION_VND_XMPIE_DPKG="application/vnd.xmpie.dpkg",n.APPLICATION_VND_XMPIE_PLAN="application/vnd.xmpie.plan",n.APPLICATION_VND_XMPIE_PPKG="application/vnd.xmpie.ppkg",n.APPLICATION_VND_XMPIE_XLIM="application/vnd.xmpie.xlim",n.APPLICATION_VND_YAMAHA_HV_DIC="application/vnd.yamaha.hv-dic",n.APPLICATION_VND_YAMAHA_HV_SCRIPT="application/vnd.yamaha.hv-script",n.APPLICATION_VND_YAMAHA_HV_VOICE="application/vnd.yamaha.hv-voice",n.APPLICATION_VND_YAMAHA_OPENSCOREFORMAT_OSFPVG_XML="application/vnd.yamaha.openscoreformat.osfpvg+xml",n.APPLICATION_VND_YAMAHA_OPENSCOREFORMAT="application/vnd.yamaha.openscoreformat",n.APPLICATION_VND_YAMAHA_REMOTE_SETUP="application/vnd.yamaha.remote-setup",n.APPLICATION_VND_YAMAHA_SMAF_AUDIO="application/vnd.yamaha.smaf-audio",n.APPLICATION_VND_YAMAHA_SMAF_PHRASE="application/vnd.yamaha.smaf-phrase",n.APPLICATION_VND_YAMAHA_THROUGH_NGN="application/vnd.yamaha.through-ngn",n.APPLICATION_VND_YAMAHA_TUNNEL_UDPENCAP="application/vnd.yamaha.tunnel-udpencap",n.APPLICATION_VND_YAOWEME="application/vnd.yaoweme",n.APPLICATION_VND_YELLOWRIVER_CUSTOM_MENU="application/vnd.yellowriver-custom-menu",n.APPLICATION_VND_YOUTUBE_YT="application/vnd.youtube.yt",n.APPLICATION_VND_ZOHO_DOCUMENT_WRITER="application/vnd.zoho-document.writer",n.APPLICATION_VND_ZOHO_PRESENTATION_SHOW="application/vnd.zoho-presentation.show",n.APPLICATION_VND_ZOHO_SPREADSHEETML_SHEET="application/vnd.zoho.spreadsheetml.sheet",n.APPLICATION_VND_ZUL="application/vnd.zul",n.APPLICATION_VND_ZZAZZ_DECK_XML="application/vnd.zzazz.deck+xml",n.APPLICATION_VOICEXML_XML="application/voicexml+xml",n.APPLICATION_VOUCHER_CMS_JSON="application/voucher-cms+json",n.APPLICATION_VOUCHER_JWS_JSON="application/voucher-jws+json",n.APPLICATION_VP="application/vp",n.APPLICATION_VP_COSE="application/vp+cose",n.APPLICATION_VP_JWT="application/vp+jwt",n.APPLICATION_VP_SD_JWT="application/vp+sd-jwt",n.APPLICATION_VQ_RTCPXR="application/vq-rtcpxr",n.APPLICATION_WASM="application/wasm",n.APPLICATION_WATCHERINFO_XML="application/watcherinfo+xml",n.APPLICATION_WEBPUSH_OPTIONS_JSON="application/webpush-options+json",n.APPLICATION_WHOISPP_QUERY="application/whoispp-query",n.APPLICATION_WHOISPP_RESPONSE="application/whoispp-response",n.APPLICATION_WIDGET="application/widget",n.APPLICATION_WITA="application/wita",n.APPLICATION_WORDPERFECT5_1="application/wordperfect5.1",n.APPLICATION_WSDL_XML="application/wsdl+xml",n.APPLICATION_WSPOLICY_XML="application/wspolicy+xml",n.APPLICATION_X_PKI_MESSAGE="application/x-pki-message",n.APPLICATION_X_WWW_FORM_URLENCODED="application/x-www-form-urlencoded",n.APPLICATION_X_X509_CA_CERT="application/x-x509-ca-cert",n.APPLICATION_X_X509_CA_RA_CERT="application/x-x509-ca-ra-cert",n.APPLICATION_X_X509_NEXT_CA_CERT="application/x-x509-next-ca-cert",n.APPLICATION_X400_BP="application/x400-bp",n.APPLICATION_XACML_XML="application/xacml+xml",n.APPLICATION_XCAP_ATT_XML="application/xcap-att+xml",n.APPLICATION_XCAP_CAPS_XML="application/xcap-caps+xml",n.APPLICATION_XCAP_DIFF_XML="application/xcap-diff+xml",n.APPLICATION_XCAP_EL_XML="application/xcap-el+xml",n.APPLICATION_XCAP_ERROR_XML="application/xcap-error+xml",n.APPLICATION_XCAP_NS_XML="application/xcap-ns+xml",n.APPLICATION_XCON_CONFERENCE_INFO_DIFF_XML="application/xcon-conference-info-diff+xml",n.APPLICATION_XCON_CONFERENCE_INFO_XML="application/xcon-conference-info+xml",n.APPLICATION_XENC_XML="application/xenc+xml",n.APPLICATION_XFDF="application/xfdf",n.APPLICATION_XHTML_XML="application/xhtml+xml",n.APPLICATION_XLIFF_XML="application/xliff+xml",n.APPLICATION_XML="application/xml",n.APPLICATION_XML_DTD="application/xml-dtd",n.APPLICATION_XML_EXTERNAL_PARSED_ENTITY="application/xml-external-parsed-entity",n.APPLICATION_XML_PATCH_XML="application/xml-patch+xml",n.APPLICATION_XMPP_XML="application/xmpp+xml",n.APPLICATION_XOP_XML="application/xop+xml",n.APPLICATION_XSLT_XML="application/xslt+xml",n.APPLICATION_XV_XML="application/xv+xml",n.APPLICATION_YAML="application/yaml",n.APPLICATION_YANG="application/yang",n.APPLICATION_YANG_DATA_CBOR="application/yang-data+cbor",n.APPLICATION_YANG_DATA_JSON="application/yang-data+json",n.APPLICATION_YANG_DATA_XML="application/yang-data+xml",n.APPLICATION_YANG_PATCH_JSON="application/yang-patch+json",n.APPLICATION_YANG_PATCH_XML="application/yang-patch+xml",n.APPLICATION_YANG_SID_JSON="application/yang-sid+json",n.APPLICATION_YIN_XML="application/yin+xml",n.APPLICATION_ZIP="application/zip",n.APPLICATION_ZLIB="application/zlib",n.APPLICATION_ZSTD="application/zstd",n.AUDIO_1D_INTERLEAVED_PARITYFEC="audio/1d-interleaved-parityfec",n.AUDIO_32KADPCM="audio/32kadpcm",n.AUDIO_3GPP="audio/3gpp",n.AUDIO_3GPP2="audio/3gpp2",n.AUDIO_AAC="audio/aac",n.AUDIO_AC3="audio/ac3",n.AUDIO_AMR="audio/AMR",n.AUDIO_AMR_WB="audio/AMR-WB",n.AUDIO_AMR_WB_="audio/amr-wb+",n.AUDIO_APTX="audio/aptx",n.AUDIO_ASC="audio/asc",n.AUDIO_ATRAC_ADVANCED_LOSSLESS="audio/ATRAC-ADVANCED-LOSSLESS",n.AUDIO_ATRAC_X="audio/ATRAC-X",n.AUDIO_ATRAC3="audio/ATRAC3",n.AUDIO_BASIC="audio/basic",n.AUDIO_BV16="audio/BV16",n.AUDIO_BV32="audio/BV32",n.AUDIO_CLEARMODE="audio/clearmode",n.AUDIO_CN="audio/CN",n.AUDIO_DAT12="audio/DAT12",n.AUDIO_DLS="audio/dls",n.AUDIO_DSR_ES201108="audio/dsr-es201108",n.AUDIO_DSR_ES202050="audio/dsr-es202050",n.AUDIO_DSR_ES202211="audio/dsr-es202211",n.AUDIO_DSR_ES202212="audio/dsr-es202212",n.AUDIO_DV="audio/DV",n.AUDIO_DVI4="audio/DVI4",n.AUDIO_EAC3="audio/eac3",n.AUDIO_ENCAPRTP="audio/encaprtp",n.AUDIO_EVRC="audio/EVRC",n.AUDIO_EVRC_QCP="audio/EVRC-QCP",n.AUDIO_EVRC0="audio/EVRC0",n.AUDIO_EVRC1="audio/EVRC1",n.AUDIO_EVRCB="audio/EVRCB",n.AUDIO_EVRCB0="audio/EVRCB0",n.AUDIO_EVRCB1="audio/EVRCB1",n.AUDIO_EVRCNW="audio/EVRCNW",n.AUDIO_EVRCNW0="audio/EVRCNW0",n.AUDIO_EVRCNW1="audio/EVRCNW1",n.AUDIO_EVRCWB="audio/EVRCWB",n.AUDIO_EVRCWB0="audio/EVRCWB0",n.AUDIO_EVRCWB1="audio/EVRCWB1",n.AUDIO_EVS="audio/EVS",n.AUDIO_EXAMPLE="audio/example",n.AUDIO_FLAC="audio/flac",n.AUDIO_FLEXFEC="audio/flexfec",n.AUDIO_FWDRED="audio/fwdred",n.AUDIO_G711_0="audio/G711-0",n.AUDIO_G719="audio/G719",n.AUDIO_G7221="audio/G7221",n.AUDIO_G722="audio/G722",n.AUDIO_G723="audio/G723",n.AUDIO_G726_16="audio/G726-16",n.AUDIO_G726_24="audio/G726-24",n.AUDIO_G726_32="audio/G726-32",n.AUDIO_G726_40="audio/G726-40",n.AUDIO_G728="audio/G728",n.AUDIO_G729="audio/G729",n.AUDIO_G7291="audio/G7291",n.AUDIO_G729D="audio/G729D",n.AUDIO_G729E="audio/G729E",n.AUDIO_GSM="audio/GSM",n.AUDIO_GSM_EFR="audio/GSM-EFR",n.AUDIO_GSM_HR_08="audio/GSM-HR-08",n.AUDIO_ILBC="audio/iLBC",n.AUDIO_IP_MR_V2_5="audio/ip-mr_v2.5",n.AUDIO_L8="audio/L8",n.AUDIO_L16="audio/L16",n.AUDIO_L20="audio/L20",n.AUDIO_L24="audio/L24",n.AUDIO_LPC="audio/LPC",n.AUDIO_MATROSKA="audio/matroska",n.AUDIO_MELP="audio/MELP",n.AUDIO_MELP600="audio/MELP600",n.AUDIO_MELP1200="audio/MELP1200",n.AUDIO_MELP2400="audio/MELP2400",n.AUDIO_MHAS="audio/mhas",n.AUDIO_MIDI_CLIP="audio/midi-clip",n.AUDIO_MOBILE_XMF="audio/mobile-xmf",n.AUDIO_MPA="audio/MPA",n.AUDIO_MP4="audio/mp4",n.AUDIO_MP4A_LATM="audio/MP4A-LATM",n.AUDIO_MPA_ROBUST="audio/mpa-robust",n.AUDIO_MPEG="audio/mpeg",n.AUDIO_MPEG4_GENERIC="audio/mpeg4-generic",n.AUDIO_OGG="audio/ogg",n.AUDIO_OPUS="audio/opus",n.AUDIO_PARITYFEC="audio/parityfec",n.AUDIO_PCMA="audio/PCMA",n.AUDIO_PCMA_WB="audio/PCMA-WB",n.AUDIO_PCMU="audio/PCMU",n.AUDIO_PCMU_WB="audio/PCMU-WB",n.AUDIO_PRS_AAUD="audio/prs.aaud",n.AUDIO_PRS_ELUPON_EUA="audio/prs.elupon-eua",n.AUDIO_PRS_SID="audio/prs.sid",n.AUDIO_QCELP="audio/QCELP",n.AUDIO_RAPTORFEC="audio/raptorfec",n.AUDIO_RED="audio/RED",n.AUDIO_RTP_ENC_AESCM128="audio/rtp-enc-aescm128",n.AUDIO_RTPLOOPBACK="audio/rtploopback",n.AUDIO_RTP_MIDI="audio/rtp-midi",n.AUDIO_RTX="audio/rtx",n.AUDIO_SCIP="audio/scip",n.AUDIO_SMV="audio/SMV",n.AUDIO_SMV0="audio/SMV0",n.AUDIO_SMV_QCP="audio/SMV-QCP",n.AUDIO_SOFA="audio/sofa",n.AUDIO_SOUNDFONT="audio/soundfont",n.AUDIO_SP_MIDI="audio/sp-midi",n.AUDIO_SPEEX="audio/speex",n.AUDIO_T140C="audio/t140c",n.AUDIO_T38="audio/t38",n.AUDIO_TELEPHONE_EVENT="audio/telephone-event",n.AUDIO_TETRA_ACELP="audio/TETRA_ACELP",n.AUDIO_TETRA_ACELP_BB="audio/TETRA_ACELP_BB",n.AUDIO_TONE="audio/tone",n.AUDIO_TSVCIS="audio/TSVCIS",n.AUDIO_UEMCLIP="audio/UEMCLIP",n.AUDIO_ULPFEC="audio/ulpfec",n.AUDIO_USAC="audio/usac",n.AUDIO_VDVI="audio/VDVI",n.AUDIO_VMR_WB="audio/VMR-WB",n.AUDIO_VND_3GPP_IUFP="audio/vnd.3gpp.iufp",n.AUDIO_VND_4SB="audio/vnd.4SB",n.AUDIO_VND_AUDIOKOZ="audio/vnd.audiokoz",n.AUDIO_VND_BLOCKFACT_FACTA="audio/vnd.blockfact.facta",n.AUDIO_VND_CELP="audio/vnd.CELP",n.AUDIO_VND_CISCO_NSE="audio/vnd.cisco.nse",n.AUDIO_VND_CMLES_RADIO_EVENTS="audio/vnd.cmles.radio-events",n.AUDIO_VND_CNS_ANP1="audio/vnd.cns.anp1",n.AUDIO_VND_CNS_INF1="audio/vnd.cns.inf1",n.AUDIO_VND_DECE_AUDIO="audio/vnd.dece.audio",n.AUDIO_VND_DIGITAL_WINDS="audio/vnd.digital-winds",n.AUDIO_VND_DLNA_ADTS="audio/vnd.dlna.adts",n.AUDIO_VND_DOLBY_HEAAC_1="audio/vnd.dolby.heaac.1",n.AUDIO_VND_DOLBY_HEAAC_2="audio/vnd.dolby.heaac.2",n.AUDIO_VND_DOLBY_MLP="audio/vnd.dolby.mlp",n.AUDIO_VND_DOLBY_MPS="audio/vnd.dolby.mps",n.AUDIO_VND_DOLBY_PL2="audio/vnd.dolby.pl2",n.AUDIO_VND_DOLBY_PL2X="audio/vnd.dolby.pl2x",n.AUDIO_VND_DOLBY_PL2Z="audio/vnd.dolby.pl2z",n.AUDIO_VND_DOLBY_PULSE_1="audio/vnd.dolby.pulse.1",n.AUDIO_VND_DRA="audio/vnd.dra",n.AUDIO_VND_DTS="audio/vnd.dts",n.AUDIO_VND_DTS_HD="audio/vnd.dts.hd",n.AUDIO_VND_DTS_UHD="audio/vnd.dts.uhd",n.AUDIO_VND_DVB_FILE="audio/vnd.dvb.file",n.AUDIO_VND_EVERAD_PLJ="audio/vnd.everad.plj",n.AUDIO_VND_HNS_AUDIO="audio/vnd.hns.audio",n.AUDIO_VND_LUCENT_VOICE="audio/vnd.lucent.voice",n.AUDIO_VND_MS_PLAYREADY_MEDIA_PYA="audio/vnd.ms-playready.media.pya",n.AUDIO_VND_NOKIA_MOBILE_XMF="audio/vnd.nokia.mobile-xmf",n.AUDIO_VND_NORTEL_VBK="audio/vnd.nortel.vbk",n.AUDIO_VND_NUERA_ECELP4800="audio/vnd.nuera.ecelp4800",n.AUDIO_VND_NUERA_ECELP7470="audio/vnd.nuera.ecelp7470",n.AUDIO_VND_NUERA_ECELP9600="audio/vnd.nuera.ecelp9600",n.AUDIO_VND_OCTEL_SBC="audio/vnd.octel.sbc",n.AUDIO_VND_OPENNBS_NBS="audio/vnd.opennbs.nbs",n.AUDIO_VND_PRESONUS_MULTITRACK="audio/vnd.presonus.multitrack",n.AUDIO_VND_QCELP="audio/vnd.qcelp",n.AUDIO_VND_RHETOREX_32KADPCM="audio/vnd.rhetorex.32kadpcm",n.AUDIO_VND_RIP="audio/vnd.rip",n.AUDIO_VND_SEALEDMEDIA_SOFTSEAL_MPEG="audio/vnd.sealedmedia.softseal.mpeg",n.AUDIO_VND_VMX_CVSD="audio/vnd.vmx.cvsd",n.AUDIO_VORBIS="audio/vorbis",n.AUDIO_VORBIS_CONFIG="audio/vorbis-config",n.FONT_COLLECTION="font/collection",n.FONT_OTF="font/otf",n.FONT_SFNT="font/sfnt",n.FONT_TTF="font/ttf",n.FONT_WOFF="font/woff",n.FONT_WOFF2="font/woff2",n.HAPTICS_IVS="haptics/ivs",n.HAPTICS_HJIF="haptics/hjif",n.HAPTICS_HMPG="haptics/hmpg",n.IMAGE_ACES="image/aces",n.IMAGE_APNG="image/apng",n.IMAGE_AVCI="image/avci",n.IMAGE_AVCS="image/avcs",n.IMAGE_AVIF="image/avif",n.IMAGE_BMP="image/bmp",n.IMAGE_CGM="image/cgm",n.IMAGE_DICOM_RLE="image/dicom-rle",n.IMAGE_DPX="image/dpx",n.IMAGE_EMF="image/emf",n.IMAGE_EXAMPLE="image/example",n.IMAGE_FITS="image/fits",n.IMAGE_G3FAX="image/g3fax",n.IMAGE_GIF="image/gif",n.IMAGE_HEIC="image/heic",n.IMAGE_HEIC_SEQUENCE="image/heic-sequence",n.IMAGE_HEIF="image/heif",n.IMAGE_HEIF_SEQUENCE="image/heif-sequence",n.IMAGE_HEJ2K="image/hej2k",n.IMAGE_HSJ2="image/hsj2",n.IMAGE_IEF="image/ief",n.IMAGE_J2C="image/j2c",n.IMAGE_JAII="image/jaii",n.IMAGE_JAIS="image/jais",n.IMAGE_JLS="image/jls",n.IMAGE_JP2="image/jp2",n.IMAGE_JPEG="image/jpeg",n.IMAGE_JPH="image/jph",n.IMAGE_JPHC="image/jphc",n.IMAGE_JPM="image/jpm",n.IMAGE_JPX="image/jpx",n.IMAGE_JXL="image/jxl",n.IMAGE_JXR="image/jxr",n.IMAGE_JXRA="image/jxrA",n.IMAGE_JXRS="image/jxrS",n.IMAGE_JXS="image/jxs",n.IMAGE_JXSC="image/jxsc",n.IMAGE_JXSI="image/jxsi",n.IMAGE_JXSS="image/jxss",n.IMAGE_KTX="image/ktx",n.IMAGE_KTX2="image/ktx2",n.IMAGE_NAPLPS="image/naplps",n.IMAGE_PNG="image/png",n.IMAGE_PRS_AIMG="image/prs.aimg",n.IMAGE_PRS_BTIF="image/prs.btif",n.IMAGE_PRS_PTI="image/prs.pti",n.IMAGE_PWG_RASTER="image/pwg-raster",n.IMAGE_SVG_XML="image/svg+xml",n.IMAGE_T38="image/t38",n.IMAGE_TIFF="image/tiff",n.IMAGE_TIFF_FX="image/tiff-fx",n.IMAGE_VND_ADOBE_PHOTOSHOP="image/vnd.adobe.photoshop",n.IMAGE_VND_AIRZIP_ACCELERATOR_AZV="image/vnd.airzip.accelerator.azv",n.IMAGE_VND_BLOCKFACT_FACTI="image/vnd.blockfact.facti",n.IMAGE_VND_CLIP="image/vnd.clip",n.IMAGE_VND_CNS_INF2="image/vnd.cns.inf2",n.IMAGE_VND_DECE_GRAPHIC="image/vnd.dece.graphic",n.IMAGE_VND_DJVU="image/vnd.djvu",n.IMAGE_VND_DWG="image/vnd.dwg",n.IMAGE_VND_DXF="image/vnd.dxf",n.IMAGE_VND_DVB_SUBTITLE="image/vnd.dvb.subtitle",n.IMAGE_VND_FASTBIDSHEET="image/vnd.fastbidsheet",n.IMAGE_VND_FPX="image/vnd.fpx",n.IMAGE_VND_FST="image/vnd.fst",n.IMAGE_VND_FUJIXEROX_EDMICS_MMR="image/vnd.fujixerox.edmics-mmr",n.IMAGE_VND_FUJIXEROX_EDMICS_RLC="image/vnd.fujixerox.edmics-rlc",n.IMAGE_VND_GLOBALGRAPHICS_PGB="image/vnd.globalgraphics.pgb",n.IMAGE_VND_MICROSOFT_ICON="image/vnd.microsoft.icon",n.IMAGE_VND_MIX="image/vnd.mix",n.IMAGE_VND_MS_MODI="image/vnd.ms-modi",n.IMAGE_VND_MOZILLA_APNG="image/vnd.mozilla.apng",n.IMAGE_VND_NET_FPX="image/vnd.net-fpx",n.IMAGE_VND_PCO_B16="image/vnd.pco.b16",n.IMAGE_VND_RADIANCE="image/vnd.radiance",n.IMAGE_VND_SEALED_PNG="image/vnd.sealed.png",n.IMAGE_VND_SEALEDMEDIA_SOFTSEAL_GIF="image/vnd.sealedmedia.softseal.gif",n.IMAGE_VND_SLD="image/vnd.sld",n.IMAGE_VND_SEALEDMEDIA_SOFTSEAL_JPG="image/vnd.sealedmedia.softseal.jpg",n.IMAGE_VND_SVF="image/vnd.svf",n.IMAGE_VND_TENCENT_TAP="image/vnd.tencent.tap",n.IMAGE_VND_VALVE_SOURCE_TEXTURE="image/vnd.valve.source.texture",n.IMAGE_VND_WAP_WBMP="image/vnd.wap.wbmp",n.IMAGE_VND_XIFF="image/vnd.xiff",n.IMAGE_VND_ZBRUSH_PCX="image/vnd.zbrush.pcx",n.IMAGE_WEBP="image/webp",n.IMAGE_WMF="image/wmf",n.IMAGE_X_EMF="image/x-emf",n.IMAGE_X_WMF="image/x-wmf",n.MESSAGE_BHTTP="message/bhttp",n.MESSAGE_CPIM="message/CPIM",n.MESSAGE_DELIVERY_STATUS="message/delivery-status",n.MESSAGE_DISPOSITION_NOTIFICATION="message/disposition-notification",n.MESSAGE_EXAMPLE="message/example",n.MESSAGE_EXTERNAL_BODY="message/external-body",n.MESSAGE_FEEDBACK_REPORT="message/feedback-report",n.MESSAGE_GLOBAL="message/global",n.MESSAGE_GLOBAL_DELIVERY_STATUS="message/global-delivery-status",n.MESSAGE_GLOBAL_DISPOSITION_NOTIFICATION="message/global-disposition-notification",n.MESSAGE_GLOBAL_HEADERS="message/global-headers",n.MESSAGE_HTTP="message/http",n.MESSAGE_IMDN_XML="message/imdn+xml",n.MESSAGE_MLS="message/mls",n.MESSAGE_NEWS="message/news",n.MESSAGE_OHTTP_CHUNKED_REQ="message/ohttp-chunked-req",n.MESSAGE_OHTTP_CHUNKED_RES="message/ohttp-chunked-res",n.MESSAGE_OHTTP_REQ="message/ohttp-req",n.MESSAGE_OHTTP_RES="message/ohttp-res",n.MESSAGE_PARTIAL="message/partial",n.MESSAGE_RFC822="message/rfc822",n.MESSAGE_S_HTTP="message/s-http",n.MESSAGE_SIP="message/sip",n.MESSAGE_SIPFRAG="message/sipfrag",n.MESSAGE_TRACKING_STATUS="message/tracking-status",n.MESSAGE_VND_SI_SIMP="message/vnd.si.simp",n.MESSAGE_VND_WFA_WSC="message/vnd.wfa.wsc",n.MODEL_3MF="model/3mf",n.MODEL_E57="model/e57",n.MODEL_EXAMPLE="model/example",n.MODEL_GLTF_BINARY="model/gltf-binary",n.MODEL_GLTF_JSON="model/gltf+json",n.MODEL_JT="model/JT",n.MODEL_IGES="model/iges",n.MODEL_MESH="model/mesh",n.MODEL_MTL="model/mtl",n.MODEL_OBJ="model/obj",n.MODEL_PRC="model/prc",n.MODEL_STEP="model/step",n.MODEL_STEP_XML="model/step+xml",n.MODEL_STEP_ZIP="model/step+zip",n.MODEL_STEP_XML_ZIP="model/step-xml+zip",n.MODEL_STL="model/stl",n.MODEL_U3D="model/u3d",n.MODEL_VND_BARY="model/vnd.bary",n.MODEL_VND_CLD="model/vnd.cld",n.MODEL_VND_COLLADA_XML="model/vnd.collada+xml",n.MODEL_VND_DWF="model/vnd.dwf",n.MODEL_VND_FLATLAND_3DML="model/vnd.flatland.3dml",n.MODEL_VND_GDL="model/vnd.gdl",n.MODEL_VND_GODOT_SCENE_BINARY="model/vnd.godot.scene.binary",n.MODEL_VND_GODOT_SCENE_TEXT="model/vnd.godot.scene.text",n.MODEL_VND_GS_GDL="model/vnd.gs-gdl",n.MODEL_VND_GTW="model/vnd.gtw",n.MODEL_VND_MOML_XML="model/vnd.moml+xml",n.MODEL_VND_MTS="model/vnd.mts",n.MODEL_VND_OPENGEX="model/vnd.opengex",n.MODEL_VND_PARASOLID_TRANSMIT_BINARY="model/vnd.parasolid.transmit.binary",n.MODEL_VND_PARASOLID_TRANSMIT_TEXT="model/vnd.parasolid.transmit.text",n.MODEL_VND_PYGRASSREAL_PY3S="model/vnd.pygrassreal.py3s",n.MODEL_VND_PYTHA_PYOX="model/vnd.pytha.pyox",n.MODEL_VND_ROSETTE_ANNOTATED_DATA_MODEL="model/vnd.rosette.annotated-data-model",n.MODEL_VND_SAP_VDS="model/vnd.sap.vds",n.MODEL_VND_SDF3D_S3D="model/vnd.sdf3d.s3d",n.MODEL_VND_USDA="model/vnd.usda",n.MODEL_VND_USDZ_ZIP="model/vnd.usdz+zip",n.MODEL_VND_VALVE_SOURCE_COMPILED_MAP="model/vnd.valve.source.compiled-map",n.MODEL_VND_VTU="model/vnd.vtu",n.MODEL_VRML="model/vrml",n.MODEL_X3D_VRML="model/x3d-vrml",n.MODEL_X3D_FASTINFOSET="model/x3d+fastinfoset",n.MODEL_X3D_XML="model/x3d+xml",n.MULTIPART_ALTERNATIVE="multipart/alternative",n.MULTIPART_APPLEDOUBLE="multipart/appledouble",n.MULTIPART_BYTERANGES="multipart/byteranges",n.MULTIPART_DIGEST="multipart/digest",n.MULTIPART_ENCRYPTED="multipart/encrypted",n.MULTIPART_EXAMPLE="multipart/example",n.MULTIPART_FORM_DATA="multipart/form-data",n.MULTIPART_HEADER_SET="multipart/header-set",n.MULTIPART_MIXED="multipart/mixed",n.MULTIPART_MULTILINGUAL="multipart/multilingual",n.MULTIPART_PARALLEL="multipart/parallel",n.MULTIPART_RELATED="multipart/related",n.MULTIPART_REPORT="multipart/report",n.MULTIPART_SIGNED="multipart/signed",n.MULTIPART_VND_BINT_MED_PLUS="multipart/vnd.bint.med-plus",n.MULTIPART_VOICE_MESSAGE="multipart/voice-message",n.MULTIPART_X_MIXED_REPLACE="multipart/x-mixed-replace",n.TEXT_1D_INTERLEAVED_PARITYFEC="text/1d-interleaved-parityfec",n.TEXT_CACHE_MANIFEST="text/cache-manifest",n.TEXT_CALENDAR="text/calendar",n.TEXT_CQL="text/cql",n.TEXT_CQL_EXPRESSION="text/cql-expression",n.TEXT_CQL_IDENTIFIER="text/cql-identifier",n.TEXT_CSS="text/css",n.TEXT_CSV="text/csv",n.TEXT_CSV_SCHEMA="text/csv-schema",n.TEXT_DIRECTORY="text/directory",n.TEXT_DNS="text/dns",n.TEXT_ECMASCRIPT="text/ecmascript",n.TEXT_ENCAPRTP="text/encaprtp",n.TEXT_ENRICHED="text/enriched",n.TEXT_EXAMPLE="text/example",n.TEXT_FHIRPATH="text/fhirpath",n.TEXT_FLEXFEC="text/flexfec",n.TEXT_FWDRED="text/fwdred",n.TEXT_GFF3="text/gff3",n.TEXT_GRAMMAR_REF_LIST="text/grammar-ref-list",n.TEXT_HL7V2="text/hl7v2",n.TEXT_HTML="text/html",n.TEXT_JAVASCRIPT="text/javascript",n.TEXT_JCR_CND="text/jcr-cnd",n.TEXT_MARKDOWN="text/markdown",n.TEXT_MIZAR="text/mizar",n.TEXT_N3="text/n3",n.TEXT_ORG="text/org",n.TEXT_PARAMETERS="text/parameters",n.TEXT_PARITYFEC="text/parityfec",n.TEXT_PLAIN="text/plain",n.TEXT_PROVENANCE_NOTATION="text/provenance-notation",n.TEXT_PRS_FALLENSTEIN_RST="text/prs.fallenstein.rst",n.TEXT_PRS_LINES_TAG="text/prs.lines.tag",n.TEXT_PRS_MTSV="text/prs.mtsv",n.TEXT_PRS_PROP_LOGIC="text/prs.prop.logic",n.TEXT_PRS_ROWIH="text/prs.rowih",n.TEXT_PRS_TEXI="text/prs.texi",n.TEXT_QML="text/qml",n.TEXT_RAPTORFEC="text/raptorfec",n.TEXT_RED="text/RED",n.TEXT_RFC822_HEADERS="text/rfc822-headers",n.TEXT_RICHTEXT="text/richtext",n.TEXT_RTF="text/rtf",n.TEXT_RTP_ENC_AESCM128="text/rtp-enc-aescm128",n.TEXT_RTPLOOPBACK="text/rtploopback",n.TEXT_RTX="text/rtx",n.TEXT_SGML="text/SGML",n.TEXT_SHACLC="text/shaclc",n.TEXT_SHEX="text/shex",n.TEXT_SPDX="text/spdx",n.TEXT_STRINGS="text/strings",n.TEXT_T140="text/t140",n.TEXT_TAB_SEPARATED_VALUES="text/tab-separated-values",n.TEXT_TROFF="text/troff",n.TEXT_TURTLE="text/turtle",n.TEXT_ULPFEC="text/ulpfec",n.TEXT_URI_LIST="text/uri-list",n.TEXT_VCARD="text/vcard",n.TEXT_VND_A="text/vnd.a",n.TEXT_VND_ABC="text/vnd.abc",n.TEXT_VND_ASCII_ART="text/vnd.ascii-art",n.TEXT_VND_BOVNAR="text/vnd.bovnar",n.TEXT_VND_CURL="text/vnd.curl",n.TEXT_VND_DEBIAN_COPYRIGHT="text/vnd.debian.copyright",n.TEXT_VND_DMCLIENTSCRIPT="text/vnd.DMClientScript",n.TEXT_VND_DVB_SUBTITLE="text/vnd.dvb.subtitle",n.TEXT_VND_ESMERTEC_THEME_DESCRIPTOR="text/vnd.esmertec.theme-descriptor",n.TEXT_VND_EXCHANGEABLE="text/vnd.exchangeable",n.TEXT_VND_FAMILYSEARCH_GEDCOM="text/vnd.familysearch.gedcom",n.TEXT_VND_FICLAB_FLT="text/vnd.ficlab.flt",n.TEXT_VND_FLY="text/vnd.fly",n.TEXT_VND_FMI_FLEXSTOR="text/vnd.fmi.flexstor",n.TEXT_VND_GEML="text/vnd.geml",n.TEXT_VND_GIST_MX="text/vnd.gist.mx",n.TEXT_VND_GML="text/vnd.gml",n.TEXT_VND_GODOT_GDSCRIPT="text/vnd.godot.gdscript",n.TEXT_VND_GODOT_GDSHADER="text/vnd.godot.gdshader",n.TEXT_VND_GRAPHVIZ="text/vnd.graphviz",n.TEXT_VND_HANS="text/vnd.hans",n.TEXT_VND_HEKAYA="text/vnd.hekaya",n.TEXT_VND_HGL="text/vnd.hgl",n.TEXT_VND_IN3D_3DML="text/vnd.in3d.3dml",n.TEXT_VND_IN3D_SPOT="text/vnd.in3d.spot",n.TEXT_VND_IPTC_NEWSML="text/vnd.IPTC.NewsML",n.TEXT_VND_IPTC_NITF="text/vnd.IPTC.NITF",n.TEXT_VND_LATEX_Z="text/vnd.latex-z",n.TEXT_VND_LONGFORM="text/vnd.longform",n.TEXT_VND_MOTOROLA_REFLEX="text/vnd.motorola.reflex",n.TEXT_VND_MS_MEDIAPACKAGE="text/vnd.ms-mediapackage",n.TEXT_VND_NET2PHONE_COMMCENTER_COMMAND="text/vnd.net2phone.commcenter.command",n.TEXT_VND_RADISYS_MSML_BASIC_LAYOUT="text/vnd.radisys.msml-basic-layout",n.TEXT_VND_SENX_WARPSCRIPT="text/vnd.senx.warpscript",n.TEXT_VND_SI_URICATALOGUE="text/vnd.si.uricatalogue",n.TEXT_VND_SUN_J2ME_APP_DESCRIPTOR="text/vnd.sun.j2me.app-descriptor",n.TEXT_VND_SOSI="text/vnd.sosi",n.TEXT_VND_TPS="text/vnd.tps",n.TEXT_VND_TYPST="text/vnd.typst",n.TEXT_VND_TROLLTECH_LINGUIST="text/vnd.trolltech.linguist",n.TEXT_VND_VCF="text/vnd.vcf",n.TEXT_VND_VRI="text/vnd.vri",n.TEXT_VND_WAP_SI="text/vnd.wap.si",n.TEXT_VND_WAP_SL="text/vnd.wap.sl",n.TEXT_VND_WAP_WML="text/vnd.wap.wml",n.TEXT_VND_WAP_WMLSCRIPT="text/vnd.wap.wmlscript",n.TEXT_VND_ZOO_KCL="text/vnd.zoo.kcl",n.TEXT_VTT="text/vtt",n.TEXT_WGSL="text/wgsl",n.TEXT_XML="text/xml",n.TEXT_XML_EXTERNAL_PARSED_ENTITY="text/xml-external-parsed-entity",n.VIDEO_1D_INTERLEAVED_PARITYFEC="video/1d-interleaved-parityfec",n.VIDEO_3GPP="video/3gpp",n.VIDEO_3GPP2="video/3gpp2",n.VIDEO_3GPP_TT="video/3gpp-tt",n.VIDEO_AV1="video/AV1",n.VIDEO_BMPEG="video/BMPEG",n.VIDEO_BT656="video/BT656",n.VIDEO_CELB="video/CelB",n.VIDEO_DV="video/DV",n.VIDEO_ENCAPRTP="video/encaprtp",n.VIDEO_EVC="video/evc",n.VIDEO_EXAMPLE="video/example",n.VIDEO_FFV1="video/FFV1",n.VIDEO_FLEXFEC="video/flexfec",n.VIDEO_H261="video/H261",n.VIDEO_H263="video/H263",n.VIDEO_H263_1998="video/H263-1998",n.VIDEO_H263_2000="video/H263-2000",n.VIDEO_H264="video/H264",n.VIDEO_H264_RCDO="video/H264-RCDO",n.VIDEO_H264_SVC="video/H264-SVC",n.VIDEO_H265="video/H265",n.VIDEO_H266="video/H266",n.VIDEO_ISO_SEGMENT="video/iso.segment",n.VIDEO_JPEG="video/JPEG",n.VIDEO_JPEG2000="video/jpeg2000",n.VIDEO_JPEG2000_SCL="video/jpeg2000-scl",n.VIDEO_JXSV="video/jxsv",n.VIDEO_LOTTIE_JSON="video/lottie+json",n.VIDEO_MATROSKA="video/matroska",n.VIDEO_MATROSKA_3D="video/matroska-3d",n.VIDEO_MJ2="video/mj2",n.VIDEO_MP1S="video/MP1S",n.VIDEO_MP2P="video/MP2P",n.VIDEO_MP2T="video/MP2T",n.VIDEO_MP4="video/mp4",n.VIDEO_MP4V_ES="video/MP4V-ES",n.VIDEO_MPV="video/MPV",n.VIDEO_MPEG="video/mpeg",n.VIDEO_MPEG4_GENERIC="video/mpeg4-generic",n.VIDEO_NV="video/nv",n.VIDEO_OGG="video/ogg",n.VIDEO_PARITYFEC="video/parityfec",n.VIDEO_POINTER="video/pointer",n.VIDEO_PRS_AVID="video/prs.avid",n.VIDEO_QUICKTIME="video/quicktime",n.VIDEO_RAPTORFEC="video/raptorfec",n.VIDEO_RAW="video/raw",n.VIDEO_RTP_ENC_AESCM128="video/rtp-enc-aescm128",n.VIDEO_RTPLOOPBACK="video/rtploopback",n.VIDEO_RTX="video/rtx",n.VIDEO_SCIP="video/scip",n.VIDEO_SMPTE291="video/smpte291",n.VIDEO_SMPTE292M="video/SMPTE292M",n.VIDEO_ULPFEC="video/ulpfec",n.VIDEO_VC1="video/vc1",n.VIDEO_VC2="video/vc2",n.VIDEO_VND_BLOCKFACT_FACTV="video/vnd.blockfact.factv",n.VIDEO_VND_CCTV="video/vnd.CCTV",n.VIDEO_VND_DECE_HD="video/vnd.dece.hd",n.VIDEO_VND_DECE_MOBILE="video/vnd.dece.mobile",n.VIDEO_VND_DECE_MP4="video/vnd.dece.mp4",n.VIDEO_VND_DECE_PD="video/vnd.dece.pd",n.VIDEO_VND_DECE_SD="video/vnd.dece.sd",n.VIDEO_VND_DECE_VIDEO="video/vnd.dece.video",n.VIDEO_VND_DIRECTV_MPEG="video/vnd.directv.mpeg",n.VIDEO_VND_DIRECTV_MPEG_TTS="video/vnd.directv.mpeg-tts",n.VIDEO_VND_DLNA_MPEG_TTS="video/vnd.dlna.mpeg-tts",n.VIDEO_VND_DVB_FILE="video/vnd.dvb.file",n.VIDEO_VND_FVT="video/vnd.fvt",n.VIDEO_VND_HNS_VIDEO="video/vnd.hns.video",n.VIDEO_VND_IPTVFORUM_1DPARITYFEC_1010="video/vnd.iptvforum.1dparityfec-1010",n.VIDEO_VND_IPTVFORUM_1DPARITYFEC_2005="video/vnd.iptvforum.1dparityfec-2005",n.VIDEO_VND_IPTVFORUM_2DPARITYFEC_1010="video/vnd.iptvforum.2dparityfec-1010",n.VIDEO_VND_IPTVFORUM_2DPARITYFEC_2005="video/vnd.iptvforum.2dparityfec-2005",n.VIDEO_VND_IPTVFORUM_TTSAVC="video/vnd.iptvforum.ttsavc",n.VIDEO_VND_IPTVFORUM_TTSMPEG2="video/vnd.iptvforum.ttsmpeg2",n.VIDEO_VND_MOTOROLA_VIDEO="video/vnd.motorola.video",n.VIDEO_VND_MOTOROLA_VIDEOP="video/vnd.motorola.videop",n.VIDEO_VND_MPEGURL="video/vnd.mpegurl",n.VIDEO_VND_MS_PLAYREADY_MEDIA_PYV="video/vnd.ms-playready.media.pyv",n.VIDEO_VND_NOKIA_INTERLEAVED_MULTIMEDIA="video/vnd.nokia.interleaved-multimedia",n.VIDEO_VND_NOKIA_MP4VR="video/vnd.nokia.mp4vr",n.VIDEO_VND_NOKIA_VIDEOVOIP="video/vnd.nokia.videovoip",n.VIDEO_VND_OBJECTVIDEO="video/vnd.objectvideo",n.VIDEO_VND_PLANAR="video/vnd.planar",n.VIDEO_VND_RADGAMETTOOLS_BINK="video/vnd.radgamettools.bink",n.VIDEO_VND_RADGAMETTOOLS_SMACKER="video/vnd.radgamettools.smacker",n.VIDEO_VND_SEALED_MPEG1="video/vnd.sealed.mpeg1",n.VIDEO_VND_SEALED_MPEG4="video/vnd.sealed.mpeg4",n.VIDEO_VND_SEALED_SWF="video/vnd.sealed.swf",n.VIDEO_VND_SEALEDMEDIA_SOFTSEAL_MOV="video/vnd.sealedmedia.softseal.mov",n.VIDEO_VND_UVVU_MP4="video/vnd.uvvu.mp4",n.VIDEO_VND_YOUTUBE_YT="video/vnd.youtube.yt",n.VIDEO_VND_VIVO="video/vnd.vivo",n.VIDEO_VP8="video/VP8",n.VIDEO_VP9="video/VP9",n))(En||{});const $n="2026-10-30";function Va(n){const a=n.toLowerCase();return Object.values(En).find(_=>_.toLowerCase()===a)}/**
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
 * │                 │ agency 379 (IANA). Accepts any well-formed media type and says
 * │                 │ whether IANA registers it.
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
 */class Kn{constructor(a){c(this,"value");c(this,"listAgencyId","379");c(this,"listVersionId",$n);c(this,"listName","Media Types");c(this,"listUri",new H("https://www.iana.org/assignments/media-types/media-types.xhtml"));if(!Ra.test(a))throw new Error(`not a valid media type: '${a}'`);this.value=a}get isRegistered(){return Va(this.value)!==void 0}}const fn="[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}",Ra=new RegExp(`^${fn}/${fn}$`);/**
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
 * │                 │ commands. Owns its files' immutable BinaryObject content, attaches
 * │                 │ filenames at read time, refuses moves into itself, and saves to
 * │                 │ and loads from a binary disk image.
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
 */const pn=20*1024*1024;class K{constructor(a=pn){c(this,"root",{kind:"dir",children:new Map});c(this,"cwdPath",[]);this.capacity=a}get capacityBytes(){return this.capacity}usedBytes(){return C(this.root)}pwd(){return"/"+this.cwdPath.join("/")}changeDirectory(a){const _=this.resolveSegments(a),p=this.nodeAt(_);if(!p)throw new Error(`cd: ${a}: No such file or directory`);if(p.kind!=="dir")throw new Error(`cd: ${a}: Not a directory`);this.cwdPath=_}list(a){const _=a===void 0?this.cwdPath:this.resolveSegments(a),p=this.nodeAt(_);if(!p)throw new Error(`ls: cannot access '${a??"."}': No such file or directory`);return p.kind==="file"?[{name:_[_.length-1],kind:"file"}]:[...p.children.entries()].map(([t,r])=>({name:t,kind:r.kind})).sort((t,r)=>t.name.localeCompare(r.name))}stat(a){const _=this.resolveSegments(a),p=this.nodeAt(_);if(!p)throw new Error(`stat: cannot stat '${a}': No such file or directory`);const t=_.length===0?"/":_[_.length-1];if(p.kind==="dir")return{name:t,kind:"dir",size:C(p)};const{mimeCode:r,characterSetCode:o}=p.content;return{name:t,kind:"file",size:p.content.value.byteLength,...r?{mimeCode:r}:{},...o?{characterSetCode:o}:{}}}makeDirectory(a){const _=this.resolveSegments(a);if(_.length===0)throw new Error(`mkdir: cannot create directory '${a}': File exists`);const p=this.lookupParentDir(_),t=_[_.length-1];if(!p)throw new Error(`mkdir: cannot create directory '${a}': No such file or directory`);if(p.children.has(t))throw new Error(`mkdir: cannot create directory '${a}': File exists`);p.children.set(t,{kind:"dir",children:new Map})}touch(a){var r;const _=this.resolveSegments(a);if(_.length===0)throw new Error(`touch: cannot touch '${a}': Is a directory`);const p=this.lookupParentDir(_),t=_[_.length-1];if(!p)throw new Error(`touch: cannot touch '${a}': No such file or directory`);if(((r=p.children.get(t))==null?void 0:r.kind)==="dir")throw new Error(`touch: cannot touch '${a}': Is a directory`);p.children.has(t)||p.children.set(t,Nn({value:new Uint8Array(0)}))}writeFile(a,_,p={}){const t=this.resolveSegments(a);if(t.length===0)throw new Error(`${a}: Is a directory`);const r=this.lookupParentDir(t),o=t[t.length-1];if(!r)throw new Error(`${a}: No such file or directory`);const I=r.children.get(o);if((I==null?void 0:I.kind)==="dir")throw new Error(`${a}: Is a directory`);let A=_;if(p.append&&I){const P=I.content,N=ha(P,_);if(N)throw new Error(`${a}: cannot append: ${N}`);A={...sn(_),...sn(P),value:ma(P.value,_.value)}}const i=I?I.content.value.byteLength:0;if(this.usedBytes()-i+A.value.byteLength>this.capacity)throw new Error(`${a}: No space left on device`);r.children.set(o,Nn(A))}readFile(a){const _=this.resolveSegments(a),p=this.nodeAt(_);if(!p)throw new Error(`${a}: No such file or directory`);if(p.kind!=="file")throw new Error(`${a}: Is a directory`);return Object.freeze({...p.content,value:p.content.value.slice(),filename:_[_.length-1]})}remove(a,_={}){const p=this.resolveSegments(a);if(p.length===0)throw new Error(`rm: cannot remove '${a}': Device or resource busy`);const t=this.lookupParentDir(p),r=p[p.length-1],o=t==null?void 0:t.children.get(r);if(!t||!o)throw new Error(`rm: cannot remove '${a}': No such file or directory`);if(o.kind==="dir"&&!_.recursive)throw new Error(`rm: cannot remove '${a}': Is a directory`);t.children.delete(r),X(this.cwdPath,p)&&(this.cwdPath=p.slice(0,-1))}move(a,_){const p=this.resolveSegments(a),t=this.lookupParentDir(p),r=p[p.length-1],o=p.length>0?t==null?void 0:t.children.get(r):void 0;if(!t||!o)throw new Error(`mv: cannot stat '${a}': No such file or directory`);const I=this.resolveDestination(_,r);if(!I.parent)throw new Error(`mv: cannot move '${a}' to '${_}': No such file or directory`);const A=[...I.parentSegments,I.name];if(!xa(A,p)){if(o.kind==="dir"&&X(A,p))throw new Error(`mv: cannot move '${a}' to a subdirectory of itself, '${_}'`);t.children.delete(r),I.parent.children.set(I.name,o),X(this.cwdPath,p)&&(this.cwdPath=[...A,...this.cwdPath.slice(p.length)])}}copy(a,_,p={}){const t=this.resolveSegments(a),r=this.nodeAt(t);if(!r)throw new Error(`cp: cannot stat '${a}': No such file or directory`);if(r.kind==="dir"&&!p.recursive)throw new Error(`cp: -r not specified; omitting directory '${a}'`);const o=t[t.length-1]??"",I=this.resolveDestination(_,o);if(!I.parent)throw new Error(`cp: cannot create '${_}': No such file or directory`);if(r.kind==="dir"&&X([...I.parentSegments,I.name],t))throw new Error(`cp: cannot copy a directory, '${a}', into itself, '${_}'`);if(this.usedBytes()+C(r)>this.capacity)throw new Error(`cp: ${_}: No space left on device`);I.parent.children.set(I.name,Yn(r))}toBlob(){const a=[];let _=0;const p=zn(this.root,o=>{a.push(o);const I=_;return _+=o.byteLength,I}),t=new TextEncoder().encode(JSON.stringify({format:gn,version:Vn,mimeCodeListVersionId:$n,characterSetCodeListVersionId:Mn,root:p})),r=new Uint8Array(b.length+4);return r.set(b,0),new DataView(r.buffer).setUint32(b.length,t.byteLength),new Blob([r,t,...a],{type:"application/octet-stream"})}static async fromBlob(a,_=pn){return K.fromBytes(await ba(a),_)}static fromBytes(a,_=pn){const p=P=>new Error(`not a LIRA virtual filesystem image: ${P}`),t=b.length+4;if(a.byteLength<t||b.some((P,N)=>a[N]!==P))throw p("missing LIRAVFS1 header");const r=new DataView(a.buffer,a.byteOffset,a.byteLength).getUint32(b.length);if(t+r>a.byteLength)throw p("manifest runs past the end of the image");let o;try{o=JSON.parse(new TextDecoder("utf-8",{fatal:!0}).decode(a.subarray(t,t+r)))}catch{throw p("manifest is not valid JSON")}if(o.format!==gn||o.version!==Vn)throw p("unsupported format or version");const I=a.subarray(t+r),A=new K(_),i=qn(o.root,I,p);if(i.kind!=="dir")throw p("root is not a directory");if(C(i)>_)throw new Error("No space left on device");return A.root.children=i.children,A}nodeAt(a){return a.length===0?this.root:this.lookupNode(a)}resolveSegments(a){const _=a.startsWith("/")?[]:[...this.cwdPath];for(const p of a.split("/"))if(!(p===""||p===".")){if(p===".."){_.length>0&&_.pop();continue}_.push(p)}return _}lookupNode(a){let _=this.root;for(const p of a){if(_.kind!=="dir")return;const t=_.children.get(p);if(!t)return;_=t}return _}lookupParentDir(a){const _=this.nodeAt(a.slice(0,-1));return(_==null?void 0:_.kind)==="dir"?_:void 0}resolveDestination(a,_){const p=this.resolveSegments(a),t=this.nodeAt(p);return(t==null?void 0:t.kind)==="dir"?{parent:t,parentSegments:p,name:_}:{parent:this.lookupParentDir(p),parentSegments:p.slice(0,-1),name:p[p.length-1]??_}}}const b=new TextEncoder().encode("LIRAVFS1"),gn="lira-virtual-file-system",Vn=1;function Nn(n){const{filename:a,..._}=n;return{kind:"file",content:Object.freeze({...sn(_),value:n.value.slice()})}}function ha(n,a){var o,I;const _=(o=n.mimeCode)==null?void 0:o.value.toLowerCase(),p=(I=a.mimeCode)==null?void 0:I.value.toLowerCase();if(_&&p&&_!==p)return`media type '${p}' does not match the file's '${_}'`;const t=n.characterSetCode,r=a.characterSetCode;if(t&&r&&t.value!==r.value)return`character set '${r.labels()[0]}' does not match the file's '${t.labels()[0]}'`}function sn(n){return Object.fromEntries(Object.entries(n).filter(([,a])=>a!==void 0))}function X(n,a){return a.length<=n.length&&a.every((_,p)=>n[p]===_)}function xa(n,a){return n.length===a.length&&X(n,a)}function C(n){if(n.kind==="file")return n.content.value.byteLength;let a=0;for(const _ of n.children.values())a+=C(_);return a}function Yn(n){if(n.kind==="file")return{kind:"file",content:n.content};const a=new Map;for(const[_,p]of n.children)a.set(_,Yn(p));return{kind:"dir",children:a}}function zn(n,a){if(n.kind==="file"){const{value:p,format:t,mimeCode:r,encodingCode:o,characterSetCode:I,uri:A}=n.content;return{kind:"file",offset:a(p),length:p.byteLength,...t!==void 0?{format:t}:{},...r?{mimeCode:r.value}:{},...o!==void 0?{encodingCode:o}:{},...I?{characterSetCode:I.value}:{},...A?{uri:A.value}:{}}}const _={};for(const[p,t]of n.children)_[p]=zn(t,a);return{kind:"dir",children:_}}function qn(n,a,_){if(typeof n!="object"||n===null)throw _("malformed manifest entry");const p=n;if(p.kind==="dir"){if(typeof p.children!="object"||p.children===null)throw _("directory without children");const l=new Map;for(const[T,E]of Object.entries(p.children)){if(T===""||T==="."||T===".."||T.includes("/"))throw _(`invalid name '${T}'`);l.set(T,qn(E,a,_))}return{kind:"dir",children:l}}if(p.kind!=="file")throw _("unknown entry kind");const{offset:t,length:r}=p;if(!Number.isInteger(t)||!Number.isInteger(r)||t<0||r<0||t+r>a.byteLength)throw _("file bytes run past the end of the image");const o=l=>{const T=p[l];if(T!==void 0&&typeof T!="string")throw _(`'${l}' is not a string`);return T};let I;const A=o("characterSetCode");if(A!==void 0){if(!(Number(A)in jn))throw _(`unknown character set code '${A}'`);I=new Jn(Number(A))}const i=o("mimeCode"),P=o("uri");let N;try{N={value:a.slice(t,t+r),format:o("format"),mimeCode:i!==void 0?new Kn(i):void 0,encodingCode:o("encodingCode"),characterSetCode:I,uri:P!==void 0?new H(P):void 0}}catch(l){throw _(l instanceof Error?l.message:String(l))}return Nn(N)}function ma(n,a){const _=new Uint8Array(n.byteLength+a.byteLength);return _.set(n,0),_.set(a,n.byteLength),_}function ba(n){return typeof n.arrayBuffer=="function"?n.arrayBuffer().then(a=>new Uint8Array(a)):new Promise((a,_)=>{const p=new FileReader;p.onload=()=>a(new Uint8Array(p.result)),p.onerror=()=>_(p.error),p.readAsArrayBuffer(n)})}/**
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
 */const wa={name:"help",description:"list available commands",run:({commands:n})=>["Available commands:",...Object.values(n).sort((a,_)=>a.name.localeCompare(_.name)).map(a=>`  ${a.name.padEnd(8)}${a.description}`)]};/**
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
 */const Ba={name:"clear",description:"clear the console",run:({clearScrollback:n})=>(n(),[])};/**
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
 */const Fa={name:"pwd",description:"print the working directory",run:({fs:n})=>[n.pwd()]};/**
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
 * │ Description     │ Console `ls` command: lists a directory, or with -l one entry per
 * │                 │ line with type, size and media type.
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
 */const Ua={name:"ls",description:"list directory contents (-l for sizes and media types)",run:({fs:n,args:a})=>{const _=a.some(I=>I.startsWith("-")&&I.includes("l")),p=a.find(I=>!I.startsWith("-")),t=n.list(p);if(!_)return t.length===0?[]:[t.map(I=>I.kind==="dir"?`${I.name}/`:I.name).join("  ")];const r=p??".",o=n.stat(r).kind==="file";return t.map(I=>{var P;const A=n.stat(o?r:`${r}/${I.name}`);return`${I.kind==="dir"?"d":"-"} ${String(A.size).padStart(8)}  ${(((P=A.mimeCode)==null?void 0:P.value)??"-").padEnd(24)} ${I.kind==="dir"?`${I.name}/`:I.name}`})}};/**
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
 */const ya={name:"cd",description:"change the working directory",run:({fs:n,args:a})=>(n.changeDirectory(a[0]??"/"),[])};/**
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
 * │ Description     │ Helpers shared by Console commands: the multi-operand loop, byte
 * │                 │ formatting, and decoding a BinaryObject as text by its metadata.
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
 */function q(n,a){const _=[];for(const p of n)try{a(p)}catch(t){_.push(t instanceof Error?t.message:String(t))}return _}function G(n){return n<1024?`${n}B`:n<1024*1024?`${(n/1024).toFixed(1)}K`:n<1024*1024*1024?`${(n/(1024*1024)).toFixed(1)}M`:`${(n/(1024*1024*1024)).toFixed(1)}G`}const Xa=new Set(["application/json","application/xml","application/javascript","application/ecmascript","application/yaml","application/sql","application/toml"]);function Ca(n){const a=n.toLowerCase();return a.startsWith("text/")||Xa.has(a)||/\+(json|xml|yaml)$/.test(a)}function Zn(n){if(n.mimeCode&&!Ca(n.mimeCode.value))return{problem:`binary file (${n.mimeCode.value})`};let a,_="UTF-8";if(n.characterSetCode){_=n.characterSetCode.labels()[0];for(const p of n.characterSetCode.labels())try{a=new TextDecoder(p,{fatal:!0});break}catch{}if(!a)return{problem:`unsupported character set '${_}'`}}else a=new TextDecoder("utf-8",{fatal:!0});try{return{text:a.decode(n.value)}}catch{return{problem:n.characterSetCode||n.mimeCode?`not valid ${_} text`:"binary file"}}}/**
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
 */const Ga={name:"mkdir",description:"create a directory",run:({fs:n,args:a})=>{if(a.length===0)throw new Error("mkdir: missing operand");return q(a,_=>n.makeDirectory(_))}};/**
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
 */const ka={name:"touch",description:"create an empty file (no-op if it already exists)",run:({fs:n,args:a})=>{if(a.length===0)throw new Error("touch: missing operand");return q(a,_=>n.touch(_))}};/**
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
 * │ Description     │ Console `cat` command: prints each file decoded in its own
 * │                 │ character set, with a notice for binary content.
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
 */const Ha={name:"cat",description:"print file contents",run:({fs:n,args:a})=>{if(a.length===0)throw new Error("cat: missing operand");const _=[];for(const p of a)try{const t=Zn(n.readFile(p));_.push("text"in t?t.text:`cat: ${p}: ${t.problem}, not shown`)}catch(t){_.push(`cat: ${t instanceof Error?t.message:String(t)}`)}return _}};/**
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
 * │ Module Name     │ lira/common/ui/console_commands/file
 * │ Filename        │ file.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `file` command: reports each file's media type and
 * │                 │ character set, `file --mime` style.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/file
 * @file file.ts
 * @author Gurpinder Gill
 * @license MIT
 */const Wa={name:"file",description:"show each file's media type and character set",run:({fs:n,args:a})=>{if(a.length===0)throw new Error("file: missing operand");return a.map(_=>{let p;try{p=n.stat(_)}catch{return`${_}: cannot open '${_}' (No such file or directory)`}if(p.kind==="dir")return`${_}: inode/directory; charset=binary`;const t=n.readFile(_);if(t.mimeCode){const r=t.characterSetCode?t.characterSetCode.labels()[0].toLowerCase():"binary";return`${_}: ${t.mimeCode.value}; charset=${r}`}return t.value.byteLength===0?`${_}: inode/x-empty; charset=binary`:"text"in Zn(t)?`${_}: text/plain; charset=utf-8`:`${_}: application/octet-stream; charset=binary`})}};/**
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
 * │ Module Name     │ lira/common/ui/console_commands/stat
 * │ Filename        │ stat.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-04
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Console `stat` command: shows each path's size, kind, media type
 * │                 │ and character set.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/console_commands/stat
 * @file stat.ts
 * @author Gurpinder Gill
 * @license MIT
 */const Ma={name:"stat",description:"show a file's size, kind, media type and character set",run:({fs:n,args:a})=>{if(a.length===0)throw new Error("stat: missing operand");const _=[],p=q(a,t=>{const r=n.stat(t);_.push(`  File: ${t}`),_.push(`  Size: ${r.size}	${r.kind==="dir"?"directory":r.size===0?"regular empty file":"regular file"}`),r.mimeCode&&_.push(`  Type: ${r.mimeCode.value}${r.mimeCode.isRegistered?"":" (not IANA-registered)"}`),r.characterSetCode&&_.push(`Charset: ${r.characterSetCode.labels()[0]} (IANA ${r.characterSetCode.value})`)});return[..._,...p]}};/**
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
 */const ja={name:"echo",description:"print text, or write/append it to a file with > / >>",run:({fs:n,args:a})=>{const _=a.findIndex(o=>o===">"||o===">>");if(_===-1)return[a.join(" ")];const p=a[_]===">>",t=a[_+1];if(!t)throw new Error("lira: syntax error near unexpected token `newline'");const r=new TextEncoder().encode(a.slice(0,_).join(" ")+`
`);return n.writeFile(t,ga(r,{mimeCode:new Kn(En.TEXT_PLAIN),characterSetCode:new Jn(Wn.UTF_8)}),{append:p}),[]}};/**
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
 */const Ja={name:"rm",description:"remove files or directories (-r for directories)",run:({fs:n,args:a})=>{const _=a.some(t=>t.startsWith("-")&&t.includes("r")),p=a.filter(t=>!t.startsWith("-"));if(p.length===0)throw new Error("rm: missing operand");return q(p,t=>n.remove(t,{recursive:_}))}};/**
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
 */const $a={name:"mv",description:"move or rename a file or directory",run:({fs:n,args:a})=>{if(a.length!==2)throw new Error("mv: missing destination file operand");return n.move(a[0],a[1]),[]}};/**
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
 */const Ka={name:"cp",description:"copy a file or directory (-r for directories)",run:({fs:n,args:a})=>{const _=a.some(t=>t.startsWith("-")&&t.includes("r")),p=a.filter(t=>!t.startsWith("-"));if(p.length!==2)throw new Error("cp: missing destination file operand");return n.copy(p[0],p[1],{recursive:_}),[]}};/**
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
 */const Ya={name:"df",description:"show virtual filesystem capacity usage",run:({fs:n})=>{const a=n.usedBytes(),_=n.capacityBytes,p=_===0?0:Math.round(a/_*100);return["Filesystem      Size    Used    Avail   Use%",`blobfs          ${G(_).padEnd(8)}${G(a).padEnd(8)}${G(_-a).padEnd(8)}${p}%`]}};/**
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
 */const za={"not-ported":"NOT PORTED",idle:"IDLE",running:"RUNNING",done:"DONE",error:"ERROR"};function qa(n,a){if(n==="vocabulary")return a.vocabularyClient;if(n==="linguistics")return a.linguisticsClient}const Za={name:"ps",description:"list running Services with live memory metrics",run:async({services:n})=>{const a=n.statusBoard.all(),_=new Map;await Promise.all(a.map(async r=>{const o=qa(r.id,n);if(o)try{_.set(r.id,await o.getMetrics())}catch{}}));const p="PID   SERVICE               STATE        UPTIME     HEAP          %HEAP",t=a.map((r,o)=>Qa(o+1,r,_.get(r.id)));return[p,...t]}};function Qa(n,a,_){const p=_?n_(_.uptimeMs):"-",t=(_==null?void 0:_.heapUsedBytes)!==void 0&&_.heapLimitBytes!==void 0?`${G(_.heapUsedBytes)}/${G(_.heapLimitBytes)}`:"-",r=(_==null?void 0:_.heapUsedBytes)!==void 0&&_.heapLimitBytes?`${Math.round(_.heapUsedBytes/_.heapLimitBytes*100)}%`:"-";return`${String(n).padEnd(6)}${a.label.padEnd(22)}${za[a.state].padEnd(13)}${p.padEnd(11)}${t.padEnd(14)}${r}`}function n_(n){const a=Math.floor(n/1e3),_=Math.floor(a/3600),p=Math.floor(a%3600/60),t=a%60;return[_,p,t].map(r=>String(r).padStart(2,"0")).join(":")}/**
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
 */const a_=["maxTextureDimension1D","maxTextureDimension2D","maxTextureDimension3D","maxTextureArrayLayers","maxBindGroups","maxBindGroupsPlusVertexBuffers","maxBindingsPerBindGroup","maxDynamicUniformBuffersPerPipelineLayout","maxDynamicStorageBuffersPerPipelineLayout","maxSampledTexturesPerShaderStage","maxSamplersPerShaderStage","maxStorageBuffersPerShaderStage","maxStorageTexturesPerShaderStage","maxUniformBuffersPerShaderStage","maxUniformBufferBindingSize","maxStorageBufferBindingSize","minUniformBufferOffsetAlignment","minStorageBufferOffsetAlignment","maxVertexBuffers","maxBufferSize","maxVertexAttributes","maxVertexBufferArrayStride","maxInterStageShaderVariables","maxColorAttachments","maxColorAttachmentBytesPerSample","maxComputeWorkgroupStorageSize","maxComputeInvocationsPerWorkgroup","maxComputeWorkgroupSizeX","maxComputeWorkgroupSizeY","maxComputeWorkgroupSizeZ","maxComputeWorkgroupsPerDimension"];function __(n){return n.gpu}async function p_(n){if(n.info)return n.info;if(typeof n.requestAdapterInfo=="function")return n.requestAdapterInfo()}function M(n){return n&&n.length>0?n:"-"}const t_={name:"gpu",description:"report real GPU adapter information via WebGPU",run:async()=>{const n=__(navigator);if(!n)throw new Error("gpu: WebGPU is not supported in this browser (navigator.gpu is undefined)");const a=await n.requestAdapter();if(!a)throw new Error("gpu: WebGPU is supported, but no GPU adapter is available (requestAdapter() returned null)");const _=await p_(a),p=Array.from(a.features).sort();return["Adapter",`  vendor               ${M(_==null?void 0:_.vendor)}`,`  architecture         ${M(_==null?void 0:_.architecture)}`,`  device               ${M(_==null?void 0:_.device)}`,`  description          ${M(_==null?void 0:_.description)}`,`  fallback adapter     ${a.isFallbackAdapter}`,`  preferred canvas fmt ${n.getPreferredCanvasFormat()}`,"",`Features (${p.length})`,...p.length>0?p.map(r=>`  ${r}`):["  (none)"],"","Limits",...a_.map(r=>`  ${r.padEnd(42)}${a.limits[r].toLocaleString()}`)]}};/**
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
 */const r_=[wa,Ba,Fa,Ua,ya,Ga,ka,Ha,Ma,Wa,ja,Ja,$a,Ka,Ya,Za,t_],Rn=Object.fromEntries(r_.map(n=>[n.name,n]));/**
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
 */class o_{constructor(a,_,p){c(this,"container");c(this,"collapsed",!1);c(this,"fs",new K);c(this,"services");c(this,"lines",I_.map(a=>({kind:"banner",text:a})));c(this,"commandHistory",[]);c(this,"historyIndex");c(this,"draftBeforeRecall","");this.services={statusBoard:a,vocabularyClient:_,linguisticsClient:p}}mount(a){this.container=a,this.ensureStyles(),a.addEventListener("click",_=>this.handleClick(_)),a.addEventListener("keydown",_=>this.handleKeydown(_)),this.paint()}paint(){this.container&&(this.container.innerHTML=this.renderPanel(),this.focusInput(),this.scrollToBottom())}handleClick(a){const _=a.target;if(_.closest("[data-action='toggle-console']")){this.collapsed=!this.collapsed,this.paint();return}_.closest(".console-body")&&!_.closest("a,button")&&this.focusInput()}handleKeydown(a){const _=a.target;if(!_.classList.contains("console-input"))return;const p=_;if(a.key==="Enter"){a.preventDefault();const t=p.value;p.value="",this.historyIndex=void 0,this.runCommand(t)}else a.key==="ArrowUp"?(a.preventDefault(),this.recall(p,-1)):a.key==="ArrowDown"&&(a.preventDefault(),this.recall(p,1))}recall(a,_){if(this.commandHistory.length!==0){if(this.historyIndex===void 0){if(_===1)return;this.draftBeforeRecall=a.value,this.historyIndex=this.commandHistory.length-1}else{const p=this.historyIndex+_;if(p<0)return;if(p>=this.commandHistory.length){this.historyIndex=void 0,a.value=this.draftBeforeRecall;return}this.historyIndex=p}a.value=this.commandHistory[this.historyIndex]}}runCommand(a){const _=a.trim();if(this.lines.push({kind:"command",text:a,prompt:hn(this.fs.pwd())}),_.length===0){this.paint();return}this.commandHistory.push(_);const[p,...t]=c_(_),r=Rn[p.toLowerCase()];if(!r){this.lines.push({kind:"error",text:`lira: command not found: ${p} (not implemented yet)`}),this.paint();return}Promise.resolve(r.run({fs:this.fs,args:t,commands:Rn,clearScrollback:()=>this.lines=[],services:this.services})).then(o=>{for(const I of o)this.lines.push({kind:"output",text:I})}).catch(o=>{this.lines.push({kind:"error",text:o instanceof Error?o.message:String(o)})}).finally(()=>this.paint())}focusInput(){var a,_;(_=(a=this.container)==null?void 0:a.querySelector(".console-input"))==null||_.focus()}scrollToBottom(){var _;const a=(_=this.container)==null?void 0:_.querySelector(".console-lines");a&&(a.scrollTop=a.scrollHeight)}renderPanel(){return`
      <div class="console-panel ${this.collapsed?"collapsed":""}">
        <button type="button" class="console-header" data-action="toggle-console" aria-expanded="${!this.collapsed}">
          <span class="console-label">Console</span>
          ${this.collapsed?`<span class="console-summary">${this.commandHistory.length} command${this.commandHistory.length===1?"":"s"}</span>`:""}
          <span class="console-chevron">${A_}</span>
        </button>
        <div class="console-body" role="log" aria-live="polite">
          <div class="console-lines">
            ${this.lines.map(a=>this.renderLine(a)).join("")}
          </div>
          <div class="console-prompt-row">
            <span class="console-prompt" aria-hidden="true">${j(hn(this.fs.pwd()))}</span>
            <input type="text" class="console-input" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Console command input">
          </div>
        </div>
      </div>
    `}renderLine(a){return a.kind==="command"?`<div class="console-line console-line-command"><span class="console-prompt" aria-hidden="true">${j(a.prompt)}</span>${j(a.text)}</div>`:`<div class="console-line console-line-${a.kind}">${j(a.text)}</div>`}ensureStyles(){if(document.getElementById(xn))return;const a=document.createElement("style");a.id=xn,a.textContent=i_,document.head.appendChild(a)}}const I_=["LIRA Operating System","Type 'help' to get started."];function hn(n){return`lira:${n}$ `}function c_(n){const a=[],_=/"([^"]*)"|(\S+)/g;let p;for(;(p=_.exec(n))!==null;)a.push(p[1]!==void 0?p[1]:p[2]);return a}function j(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const A_='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',xn="lira-console-styles",i_=`
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
 */function Ln(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}function $(n,a){const _=new Float32Array(16);for(let p=0;p<4;p++)for(let t=0;t<4;t++){let r=0;for(let o=0;o<4;o++)r+=n[o*4+t]*a[p*4+o];_[p*4+t]=r}return _}function On(...n){return n.reduce((a,_)=>$(a,_),Ln())}function mn([n,a,_]){const p=Ln();return p[12]=n,p[13]=a,p[14]=_,p}function bn(n){const a=Ln();return a[0]=n,a[5]=n,a[10]=n,a}function k([n,a,_],p){const t=Math.cos(p),r=Math.sin(p),o=1-t;return new Float32Array([o*n*n+t,o*n*a+r*_,o*n*_-r*a,0,o*n*a-r*_,o*a*a+t,o*a*_+r*n,0,o*n*_+r*a,o*a*_-r*n,o*_*_+t,0,0,0,0,1])}function P_(n,a,_,p){const t=1/Math.tan(n/2),r=1/(_-p);return new Float32Array([t/a,0,0,0,0,t,0,0,0,0,p*r,-1,0,0,p*_*r,0])}function e_(n,a,_){const p=Tn(N_(n,a)),t=Tn(wn(_,p)),r=wn(p,t);return new Float32Array([t[0],r[0],p[0],0,t[1],r[1],p[1],0,t[2],r[2],p[2],0,-tn(t,n),-tn(r,n),-tn(p,n),1])}function N_(n,a){return[n[0]-a[0],n[1]-a[1],n[2]-a[2]]}function wn(n,a){return[n[1]*a[2]-n[2]*a[1],n[2]*a[0]-n[0]*a[2],n[0]*a[1]-n[1]*a[0]]}function tn(n,a){return n[0]*a[0]+n[1]*a[1]+n[2]*a[2]}function Tn(n){const a=Math.hypot(n[0],n[1],n[2]);return a===0?[0,0,0]:[n[0]/a,n[1]/a,n[2]/a]}function s_(n,a,_){const p=n*Math.PI/180,t=a*Math.PI/180,r=_*Math.PI/180;return On(k([0,0,1],p),k([1,0,0],t),k([0,1,0],r))}/**
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
 */const Y=6,F=[{normal:[1,0,0],right:[0,0,-1],up:[0,1,0]},{normal:[-1,0,0],right:[0,0,1],up:[0,1,0]},{normal:[0,1,0],right:[1,0,0],up:[0,0,-1]},{normal:[0,-1,0],right:[1,0,0],up:[0,0,1]},{normal:[0,0,1],right:[1,0,0],up:[0,1,0]},{normal:[0,0,-1],right:[-1,0,0],up:[0,1,0]}];function O_(n){const a=n/2,_=new Float32Array(F.length*4*Y),p=new Uint16Array(F.length*6);return F.forEach((t,r)=>{const[o,I,A]=t.normal;[L(L(t.normal,t.right,-1),t.up,-1),L(L(t.normal,t.right,1),t.up,-1),L(L(t.normal,t.right,1),t.up,1),L(L(t.normal,t.right,-1),t.up,1)].forEach((l,T)=>{const E=(r*4+T)*Y;_[E]=l[0]*a,_[E+1]=l[1]*a,_[E+2]=l[2]*a,_[E+3]=o,_[E+4]=I,_[E+5]=A});const P=r*4,N=r*6;p[N]=P,p[N+1]=P+1,p[N+2]=P+2,p[N+3]=P,p[N+4]=P+2,p[N+5]=P+3}),{vertices:_,indices:p}}function L(n,a,_){return[n[0]+a[0]*_,n[1]+a[1]*_,n[2]+a[2]*_]}const Bn=5,Fn=[[0,1],[1,1],[1,0],[0,0]];function T_(n){const a=n/2,_=new Float32Array(F.length*4*Bn),p=new Uint16Array(F.length*6);return F.forEach((t,r)=>{[L(L(t.normal,t.right,-1),t.up,-1),L(L(t.normal,t.right,1),t.up,-1),L(L(t.normal,t.right,1),t.up,1),L(L(t.normal,t.right,-1),t.up,1)].forEach((i,P)=>{const N=(r*4+P)*Bn;_[N]=i[0]*a,_[N+1]=i[1]*a,_[N+2]=i[2]*a,_[N+3]=Fn[P][0],_[N+4]=Fn[P][1]});const I=r*4,A=r*6;p[A]=I,p[A+1]=I+1,p[A+2]=I+2,p[A+3]=I,p[A+4]=I+2,p[A+5]=I+3}),{vertices:_,indices:p}}function l_(n,a,_){const p=a+1,t=_+1,r=new Float32Array(p*t*Y);for(let I=0;I<p;I++){const A=I/a*Math.PI,i=Math.sin(A),P=Math.cos(A);for(let N=0;N<t;N++){const l=N/_*Math.PI*2,T=i*Math.cos(l),E=P,O=i*Math.sin(l),v=(I*t+N)*Y;r[v]=T*n,r[v+1]=E*n,r[v+2]=O*n,r[v+3]=T,r[v+4]=E,r[v+5]=O}}const o=[];for(let I=0;I<a;I++)for(let A=0;A<_;A++){const i=I*t+A,P=(I+1)*t+A,N=(I+1)*t+A+1,l=I*t+A+1;I!==0&&o.push(i,l,P),I!==a-1&&o.push(P,l,N)}return{vertices:r,indices:new Uint16Array(o)}}/**
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
 */function E_(n,a,_,p=Math.random){const t=[];for(let r=0;r<n;r++)t.push(ln("cube",_,p));for(let r=0;r<a;r++)t.push(ln("sphere",_,p));return t}function ln(n,a,_){const p=.6+_()*1.2,t=Tn([_()*2-1,_()*2-1,_()*2-1]);return{kind:n,position:[rn(a.min[0],a.max[0],_),rn(a.min[1],a.max[1],_),rn(a.min[2],a.max[2],_)],velocity:[on(p,_),on(p,_),on(p,_)],rotationAxis:t[0]===0&&t[1]===0&&t[2]===0?[0,1,0]:t,rotationSpeed:.4+_()*1.6,rotationAngle:_()*Math.PI*2,scale:.45+_()*.35,color:[...D_(_(),.65,.55),1]}}function rn(n,a,_){return n+(a-n)*_()}function on(n,a){return(a()<.5?-1:1)*n}function L_(n,a,_){n.rotationAngle+=n.rotationSpeed*a;for(let p=0;p<3;p++){n.position[p]+=n.velocity[p]*a;const t=_.min[p]+n.scale,r=_.max[p]-n.scale;n.position[p]<t?(n.position[p]=t,n.velocity[p]=Math.abs(n.velocity[p])):n.position[p]>r&&(n.position[p]=r,n.velocity[p]=-Math.abs(n.velocity[p]))}}function D_(n,a,_){const p=_+a-_*a,t=2*_-p;return[In(t,p,n+1/3),In(t,p,n),In(t,p,n-1/3)]}function In(n,a,_){let p=_;return p<0&&(p+=1),p>1&&(p-=1),p<1/6?n+(a-n)*6*p:p<1/2?a:p<2/3?n+(a-n)*(2/3-p)*6:n}/**
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
 */const d_=`
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
`,Qn=144,v_=Qn/4,u_=`
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
`,na=64,S_=na/4;/**
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
 */function Z(){const n=globalThis;return{buffer:n.GPUBufferUsage,texture:n.GPUTextureUsage}}/**
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
 */const aa=[0,2,10],f_=[0,0,0],g_=[0,1,0],_a=55*Math.PI/180,V_=.1,R_=100,cn=2.5,h_=.85;function An(n){const _=(aa[2]-cn)*Math.tan(_a/2)*h_,p=_*n;return{min:[-p,-_,-cn],max:[p,_,cn]}}const x_=8,m_=8,b_=1.1,w_=.6,B_=16,F_=24,U_=3.2,y_={r:.04,g:.05,b:.08,a:1},Dn="depth24plus";function X_(n,a,_,p){const t=C_(n,_),r=Pn(n,O_(b_)),o=Pn(n,l_(w_,B_,F_)),I=Math.max(1,p.width)/Math.max(1,p.height),A=E_(x_,m_,An(I)).map(D=>H_(n,t,D)),i=new Float32Array(v_);let P,N,l=0,T=0,E,O,v;const dn=new Float32Array(S_);function oa(D){v=D}function Ia(D){if(O)return;const U=G_(n,_),h=Pn(n,T_(U_)),{buffer:g,texture:x}=Z(),W=n.createBuffer({size:z(na),usage:g.UNIFORM|g.COPY_DST}),Q=n.createSampler({magFilter:"linear",minFilter:"linear"}),y=n.createTexture({size:[D.width,D.height],format:"rgba8unorm",usage:x.TEXTURE_BINDING|x.COPY_DST|x.RENDER_ATTACHMENT}),nn=n.createBindGroup({layout:U.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:W}},{binding:1,resource:Q},{binding:2,resource:y.createView()}]}),V=ln("camera",An(Math.max(1,p.width)/Math.max(1,p.height)),Math.random);V.scale=1,V.position=[0,0,0],V.velocity=[0,0,0],O={camera:D,entity:V,pipeline:U,meshBuffers:h,uniformBuffer:W,bindGroup:nn,texture:y,textureWidth:D.width,textureHeight:D.height}}function ca(D){E===void 0&&(E=D);const U=Math.min((D-E)/1e3,.1);E=D;const h=Math.max(1,p.width),g=Math.max(1,p.height);(!P||l!==h||T!==g)&&(P==null||P.destroy(),P=k_(n,h,g),N=P.createView(),l=h,T=g);const x=h/g,W=P_(_a,x,V_,R_),Q=e_(aa,f_,g_),y=$(W,Q),nn=An(x);for(const d of A){L_(d.entity,U,nn);const S=On(mn(d.entity.position),k(d.entity.rotationAxis,d.entity.rotationAngle),bn(d.entity.scale)),an=$(y,S);i.set(an,0),i.set(S,16),i.set(d.entity.color,32),n.queue.writeBuffer(d.uniformBuffer,0,i)}if(O){const d=v==null?void 0:v.orientation;let S;d?S=s_(d.alpha,d.beta,d.gamma):(O.entity.rotationAngle+=O.entity.rotationSpeed*U,S=k(O.entity.rotationAxis,O.entity.rotationAngle));const an=On(mn(O.entity.position),S,bn(O.entity.scale));dn.set($(y,an),0),n.queue.writeBuffer(O.uniformBuffer,0,dn),O.camera.isReady&&n.queue.copyExternalImageToTexture({source:O.camera.element},{texture:O.texture},[O.textureWidth,O.textureHeight])}const V=n.createCommandEncoder(),u=V.beginRenderPass({colorAttachments:[{view:a.getCurrentTexture().createView(),clearValue:y_,loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:N,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});u.setPipeline(t);for(const d of A){const S=d.entity.kind==="cube"?r:o;u.setBindGroup(0,d.bindGroup),u.setVertexBuffer(0,S.vertexBuffer),u.setIndexBuffer(S.indexBuffer,"uint16"),u.drawIndexed(S.indexCount)}O&&(u.setPipeline(O.pipeline),u.setBindGroup(0,O.bindGroup),u.setVertexBuffer(0,O.meshBuffers.vertexBuffer),u.setIndexBuffer(O.meshBuffers.indexBuffer,"uint16"),u.drawIndexed(O.meshBuffers.indexCount)),u.end(),n.queue.submit([V.finish()])}function Aa(){P==null||P.destroy(),r.vertexBuffer.destroy(),r.indexBuffer.destroy(),o.vertexBuffer.destroy(),o.indexBuffer.destroy();for(const D of A)D.uniformBuffer.destroy();O&&(O.texture.destroy(),O.meshBuffers.vertexBuffer.destroy(),O.meshBuffers.indexBuffer.destroy(),O.uniformBuffer.destroy(),O=void 0)}return{renderFrame:ca,attachCamera:Ia,attachOrientation:oa,destroy:Aa}}function C_(n,a){const _=n.createShaderModule({code:d_});return n.createRenderPipeline({layout:"auto",vertex:{module:_,entryPoint:"vs_main",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:_,entryPoint:"fs_main",targets:[{format:a}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{format:Dn,depthWriteEnabled:!0,depthCompare:"less"}})}function G_(n,a){const _=n.createShaderModule({code:u_});return n.createRenderPipeline({layout:"auto",vertex:{module:_,entryPoint:"vs_camera",buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:_,entryPoint:"fs_camera",targets:[{format:a}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{format:Dn,depthWriteEnabled:!0,depthCompare:"less"}})}function k_(n,a,_){const{texture:p}=Z();return n.createTexture({size:[a,_],format:Dn,usage:p.RENDER_ATTACHMENT})}function H_(n,a,_){const{buffer:p}=Z(),t=n.createBuffer({size:z(Qn),usage:p.UNIFORM|p.COPY_DST}),r=n.createBindGroup({layout:a.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}}]});return{entity:_,uniformBuffer:t,bindGroup:r}}function Pn(n,a){const{buffer:_}=Z(),p=n.createBuffer({size:z(a.vertices.byteLength),usage:_.VERTEX|_.COPY_DST});n.queue.writeBuffer(p,0,a.vertices);const t=n.createBuffer({size:z(a.indices.byteLength),usage:_.INDEX|_.COPY_DST});return n.queue.writeBuffer(t,0,a.indices),{vertexBuffer:p,indexBuffer:t,indexCount:a.indices.length}}function z(n){return Math.ceil(n/4)*4}/**
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
 */class W_{constructor(a=document.createElement("video"),_=navigator.mediaDevices){c(this,"video");c(this,"mediaDevices");c(this,"stream");this.video=a,this.video.muted=!0,this.video.playsInline=!0,this.mediaDevices=_}async start(){if(!this.mediaDevices)throw new Error("Camera capture is not supported in this browser (navigator.mediaDevices is undefined).");this.stream=await this.mediaDevices.getUserMedia({video:!0,audio:!1}),this.video.srcObject=this.stream,await this.video.play(),await M_(this.video)}get element(){return this.video}get isReady(){return this.video.videoWidth>0&&this.video.videoHeight>0}get width(){return this.video.videoWidth}get height(){return this.video.videoHeight}stop(){var a;(a=this.stream)==null||a.getTracks().forEach(_=>_.stop()),this.stream=void 0,this.video.srcObject=null}}function M_(n){return n.videoWidth>0&&n.videoHeight>0?Promise.resolve():new Promise(a=>{const _=()=>{n.videoWidth===0||n.videoHeight===0||(n.removeEventListener("loadeddata",_),a())};n.addEventListener("loadeddata",_)})}/**
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
 */class j_{constructor(a=window,_=window.DeviceOrientationEvent){c(this,"target");c(this,"eventConstructor");c(this,"latest");c(this,"listening",!1);c(this,"handleEvent",a=>{a.alpha===null||a.beta===null||a.gamma===null||(this.latest={alpha:a.alpha,beta:a.beta,gamma:a.gamma})});this.target=a,this.eventConstructor=_}async start(){if(!this.eventConstructor)throw new Error("Device orientation is not supported in this browser (DeviceOrientationEvent is undefined).");if(typeof this.eventConstructor.requestPermission=="function"){const a=await this.eventConstructor.requestPermission();if(a!=="granted")throw new Error(`Device orientation permission was not granted (${a}).`)}this.target.addEventListener("deviceorientation",this.handleEvent),this.listening=!0}get orientation(){return this.latest}get isReady(){return this.latest!==void 0}stop(){this.listening&&this.target.removeEventListener("deviceorientation",this.handleEvent),this.listening=!1,this.latest=void 0}}/**
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
 */function J_(n){return n.gpu}function $_(n){return n.getContext("webgpu")}class K_{constructor(a,_=()=>new W_,p=()=>new j_){c(this,"container");c(this,"device");c(this,"renderer");c(this,"cameraCapture");c(this,"orientationSensor");c(this,"animationFrame");c(this,"resizeObserver");c(this,"sessionToken",0);this.logger=a,this.createCamera=_,this.createOrientationSensor=p}mount(a){this.destroy(),this.container=a;const _=++this.sessionToken;a.innerHTML='<canvas class="gpu-canvas-surface"></canvas>',this.start(_)}destroy(){var a,_,p,t,r;this.animationFrame!==void 0&&(cancelAnimationFrame(this.animationFrame),this.animationFrame=void 0),(a=this.resizeObserver)==null||a.disconnect(),this.resizeObserver=void 0,(_=this.cameraCapture)==null||_.stop(),this.cameraCapture=void 0,(p=this.orientationSensor)==null||p.stop(),this.orientationSensor=void 0,(t=this.renderer)==null||t.destroy(),this.renderer=void 0,(r=this.device)==null||r.destroy(),this.device=void 0}async start(a){const _=this.container;if(_)try{const p=J_(navigator);if(!p)throw new Error("WebGPU is not supported in this browser (navigator.gpu is undefined).");const t=await p.requestAdapter();if(a!==this.sessionToken)return;if(!t)throw new Error("WebGPU is supported, but no GPU adapter is available (requestAdapter() returned null).");const r=await t.requestDevice();if(a!==this.sessionToken){r.destroy();return}this.device=r;const o=_.querySelector(".gpu-canvas-surface"),I=o?$_(o):null;if(!o||!I)throw new Error("This browser's canvas element has no WebGPU context.");I.configure({device:r,format:p.getPreferredCanvasFormat()});const A=()=>{const T=window.devicePixelRatio||1;o.width=Math.max(1,Math.floor(o.clientWidth*T)),o.height=Math.max(1,Math.floor(o.clientHeight*T))};this.resizeObserver=new ResizeObserver(A),this.resizeObserver.observe(o),A(),this.renderer=X_(r,I,p.getPreferredCanvasFormat(),o);const i=this.renderer;this.logger.info("Requesting camera access…");const P=this.createCamera();this.cameraCapture=P,P.start().then(()=>{a===this.sessionToken&&(i.attachCamera(P),this.logger.info(`Camera ready (${P.width}x${P.height}) -- textured onto one cube in the scene.`))}).catch(T=>{a===this.sessionToken&&this.logger.warn(`Camera unavailable: ${T instanceof Error?T.message:String(T)}`)}),this.logger.info("Requesting device orientation access…");const N=this.createOrientationSensor();this.orientationSensor=N,N.start().then(()=>{a===this.sessionToken&&(i.attachOrientation(N),this.logger.info("Device orientation ready -- the camera cube now tilts to match the phone's own real orientation."))}).catch(T=>{a===this.sessionToken&&this.logger.warn(`Device orientation unavailable: ${T instanceof Error?T.message:String(T)}`)});const l=()=>{a===this.sessionToken&&(i.renderFrame(performance.now()),this.animationFrame=requestAnimationFrame(l))};this.animationFrame=requestAnimationFrame(l)}catch(p){if(a!==this.sessionToken||!this.container)return;const t=p instanceof Error?p.message:String(p);this.logger.warn(t),this.destroy(),this.container.innerHTML=`<div class="portal-view-empty">${Y_(t)}</div>`}}}function Y_(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}/**
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
 */var s=(n=>(n[n.NOUN=0]="NOUN",n[n.VERB=1]="VERB",n[n.ADJECTIVE=2]="ADJECTIVE",n[n.ADVERB=3]="ADVERB",n[n.PRONOUN=4]="PRONOUN",n[n.DETERMINER=5]="DETERMINER",n[n.PREPOSITION=6]="PREPOSITION",n[n.CONJUNCTION=7]="CONJUNCTION",n[n.INTERJECTION=8]="INTERJECTION",n[n.NUMERAL=9]="NUMERAL",n[n.AUXILIARY=11]="AUXILIARY",n[n.PROPER_NOUN=12]="PROPER_NOUN",n[n.SYMBOL=13]="SYMBOL",n[n.PUNCTUATION=14]="PUNCTUATION",n[n.OTHER=15]="OTHER",n))(s||{});/**
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
 */const z_={[s[s.NOUN]]:"#3B6EA5",[s[s.PROPER_NOUN]]:"#274472",[s[s.VERB]]:"#B2542D",[s[s.ADJECTIVE]]:"#7A5CA6",[s[s.ADVERB]]:"#B08900",[s[s.PRONOUN]]:"#5B7B6F",[s[s.DETERMINER]]:"#6E7B8B",[s[s.PREPOSITION]]:"#7B6E5B",[s[s.CONJUNCTION]]:"#6B7280",[s[s.AUXILIARY]]:"#5B6E8B",[s[s.INTERJECTION]]:"#C2544B",[s[s.NUMERAL]]:"#4B8A7B",[s[s.SYMBOL]]:"#8A8A8A",[s[s.PUNCTUATION]]:"#9A9A9A",[s[s.OTHER]]:"#7A7A7A"},B={VALID:"#2B6E63",UNRESOLVED:"#B08900",INVALID:"#B2542D"},Un=["A meaning is a representation.","The word over the meaning.","The use is a state.","The word wants to use the meaning.","The meaning and the word perceive the state."],yn="lira-sentence-reader-styles";class q_{constructor(a){c(this,"container");c(this,"reading",!1);c(this,"requestToken",0);c(this,"documentResult");c(this,"expandedNodes",new Set);c(this,"selectedKey");c(this,"detailCache",new Map);c(this,"detailToken",0);this.client=a}mount(a){this.container=a,this.ensureStyles(),a.innerHTML=this.renderShell(),this.wire();const _=a.querySelector(".lira-sr-textarea");_!=null&&_.value&&this.read(_.value)}destroy(){this.container=void 0}wire(){const a=this.container;if(!a)return;const _=a.querySelector(".lira-sr-textarea"),p=a.querySelector(".lira-sr-read-btn");_&&p&&(p.addEventListener("click",()=>void this.read(_.value)),_.addEventListener("keydown",r=>{(r.metaKey||r.ctrlKey)&&r.key==="Enter"&&this.read(_.value)})),a.querySelectorAll(".lira-sr-example").forEach(r=>{r.addEventListener("click",()=>{const o=r.dataset.example??"";_&&(_.value=o),this.read(o)})});const t=a.querySelector(".lira-sr-tree");t==null||t.addEventListener("click",r=>this.handleTreeClick(r)),t==null||t.addEventListener("keydown",r=>this.handleTreeKeydown(r))}handleTreeClick(a){const _=a.target,p=_.closest('[data-action="toggle-node"]');if(p){this.toggleNode(p.dataset.node??"");return}const t=_.closest('.lira-tree-row[data-kind="sentence"]');t&&this.selectSentenceNode(t.dataset.node??"")}handleTreeKeydown(a){if(a.key!=="Enter"&&a.key!==" ")return;const _=a.target;if(_.closest('[data-action="toggle-node"]'))return;const p=_.closest('.lira-tree-row[data-kind="sentence"]');p&&(a.preventDefault(),this.selectSentenceNode(p.dataset.node??""))}toggleNode(a){if(!a||!this.documentResult)return;const _=!this.expandedNodes.has(a);if(_?this.expandedNodes.add(a):this.expandedNodes.delete(a),_&&Xn(a)&&!this.detailCache.has(a)){this.selectSentenceNode(a);return}this.renderTreeInPlace()}renderTreeInPlace(){var _;if(!this.documentResult)return;const a=(_=this.container)==null?void 0:_.querySelector(".lira-sr-tree");a&&(a.innerHTML=this.renderTree(this.documentResult))}async selectSentenceNode(a){const _=this.documentResult,p=Xn(a);if(!_||!p)return;const t=_.blocks[p.blockIndex];if(!t||t.blockKind!=="paragraph")return;const r=t.sentences[p.sentenceIndex];if(!r)return;this.selectedKey=a,this.expandedNodes.add(`b${p.blockIndex}`),this.expandedNodes.add(a),this.renderTreeInPlace();const o=this.detailCache.get(a);if(o){this.renderDetail(o);return}this.setPanelPlaceholder(".lira-sr-predicted","Loading…"),this.setPanelPlaceholder(".lira-sr-winner-panel","Loading…"),this.setPanelPlaceholder(".lira-sr-trace","Loading…");const I=++this.detailToken,A=this.isLearningEnabled();try{const i=await this.client.read(r.text,A,!0);if(I!==this.detailToken||!this.container)return;this.detailCache.set(a,i),this.renderTreeInPlace(),this.renderDetail(i)}catch(i){if(I!==this.detailToken||!this.container)return;this.setError(i instanceof Error?i.message:String(i))}}isLearningEnabled(){var _;const a=(_=this.container)==null?void 0:_.querySelector(".lira-sr-learning-toggle");return(a==null?void 0:a.checked)??!0}async read(a){const _=a.trim();if(!_||this.reading)return;const p=++this.requestToken,t=this.isLearningEnabled();this.reading=!0,this.setBusy(!0),this.setError(void 0);try{const r=await this.client.readDocument(_,t);if(p!==this.requestToken||!this.container)return;this.renderDocument(r)}catch(r){if(p!==this.requestToken||!this.container)return;this.setError(r instanceof Error?r.message:String(r))}finally{p===this.requestToken&&(this.reading=!1,this.setBusy(!1))}}setBusy(a){var p;const _=(p=this.container)==null?void 0:p.querySelector(".lira-sr-read-btn");_&&(_.disabled=a,_.textContent=a?"Reading…":"Read")}setLearningStatus(a){var t;const _=(t=this.container)==null?void 0:t.querySelector(".lira-sr-learning-status");if(!_)return;if(!a||!a.enabled){_.textContent="Learning off";return}const p=a.recordedThisRead>0?` (+${a.recordedThisRead})`:"";_.textContent=`Learning: ${a.totalObservations} observation${a.totalObservations===1?"":"s"}${p}`}setError(a){var p;const _=(p=this.container)==null?void 0:p.querySelector(".lira-sr-error");_&&(_.textContent=a??"",_.style.display=a?"block":"none")}renderDocument(a){this.documentResult=a.document,this.detailCache.clear(),this.expandedNodes=new Set(["doc"]),this.selectedKey=void 0,this.setLearningStatus(a.learning);const _=Z_(a.document);if(_){this.selectSentenceNode(_);return}this.renderTreeInPlace(),this.setPanelPlaceholder(".lira-sr-predicted","No sentences found in this text."),this.setPanelPlaceholder(".lira-sr-winner-panel","No sentences found in this text."),this.setPanelPlaceholder(".lira-sr-trace","No sentences found in this text.")}renderDetail(a){var r,o,I;const _=(r=this.container)==null?void 0:r.querySelector(".lira-sr-predicted"),p=(o=this.container)==null?void 0:o.querySelector(".lira-sr-winner-panel"),t=(I=this.container)==null?void 0:I.querySelector(".lira-sr-trace");_&&(_.innerHTML=this.renderPredicted(a.predicted,a.words)),p&&(p.innerHTML=this.renderWinner(a.predicted,a.trace)),t&&(t.innerHTML=this.renderTrace(a.trace))}setPanelPlaceholder(a,_){var t;const p=(t=this.container)==null?void 0:t.querySelector(a);p&&(p.innerHTML=`<div class="lira-sr-placeholder">${e(_)}</div>`)}ensureStyles(){if(document.getElementById(yn))return;const a=document.createElement("style");a.id=yn,a.textContent=rp,document.head.appendChild(a)}renderShell(){return`
      <div class="lira-sr">
        <div class="lira-sr-input-card">
          <textarea class="lira-sr-textarea" placeholder="e.g. A meaning is a representation.">${e(Un[0])}</textarea>
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
            ${Un.map(a=>`<button type="button" class="lira-sr-example" data-example="${e(a)}">${e(a)}</button>`).join("")}
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
    `}renderTree(a){const _=this.expandedNodes.has("doc"),p=B[a.validation]??"#7A7A7A",t=a.blocks.filter(A=>A.blockKind==="paragraph").length,r=a.blocks.length-t,o=a.blocks.reduce((A,i)=>A+(i.blockKind==="paragraph"?i.errors.length:0),0),I=[`${t} paragraph${t===1?"":"s"}`,r?`${r} heading${r===1?"":"s"}`:"",o?`${o} error${o===1?"":"s"}`:""].filter(Boolean).join(", ");return`
      <ul class="lira-tree-root">
        <li class="lira-tree-node">
          <div class="lira-tree-row" data-node="doc" data-kind="document">
            ${en("doc",_)}
            <span class="lira-tree-dot" style="background:${p}"></span>
            <span class="lira-tree-label">Document</span>
            ${_?"":`<span class="lira-tree-summary">${e(I)}</span>`}
          </div>
          ${_?`<ul>${a.blocks.map((A,i)=>this.renderBlockNode(A,i)).join("")}</ul>`:""}
        </li>
      </ul>`}renderBlockNode(a,_){const p=`b${_}`;if(a.blockKind==="heading")return`
        <li class="lira-tree-node lira-tree-leaf">
          <div class="lira-tree-row" data-node="${p}" data-kind="heading">
            <span class="lira-tree-spacer"></span>
            <span class="lira-tree-heading-pill">H${a.level}</span>
            <span class="lira-tree-label">${e(J(a.text,48))}</span>
          </div>
        </li>`;const t=this.expandedNodes.has(p),r=B[a.validation]??"#7A7A7A",o=[`${a.sentences.length} sentence${a.sentences.length===1?"":"s"}`,a.errors.length?`${a.errors.length} error${a.errors.length===1?"":"s"}`:""].filter(Boolean).join(", ");return`
      <li class="lira-tree-node">
        <div class="lira-tree-row" data-node="${p}" data-kind="paragraph">
          ${en(p,t)}
          <span class="lira-tree-dot" style="background:${r}"></span>
          <span class="lira-tree-label">Paragraph ${_+1}</span>
          ${t?"":`<span class="lira-tree-summary">${e(o)}</span>`}
        </div>
        ${t?`<ul>${a.sentences.map((I,A)=>this.renderSentenceNode(I,p,A)).join("")}</ul>`:""}
      </li>`}renderSentenceNode(a,_,p){const t=`${_}s${p}`,r=B[a.validation]??"#7A7A7A",o=this.expandedNodes.has(t),I=this.detailCache.get(t),A=o?`<ul>${I?I.predicted.clauses.map((i,P)=>this.renderClauseNode(i,`${t}c${P}`)).join(""):'<li class="lira-tree-node"><div class="lira-tree-row"><span class="lira-tree-spacer"></span><span class="lira-tree-summary">Loading…</span></div></li>'}</ul>`:"";return`
      <li class="lira-tree-node">
        <div class="lira-tree-row ${this.selectedKey===t?"selected":""}" data-node="${t}" data-kind="sentence" role="button" tabindex="0">
          ${en(t,o)}
          <span class="lira-tree-dot" style="background:${r}"></span>
          <span class="lira-tree-label">Sentence ${p+1}</span>
          <span class="lira-tree-snippet">${e(J(a.text,40))}</span>
          ${a.errors.length?`<span class="lira-tree-error-count">${a.errors.length}</span>`:""}
        </div>
        ${A}
      </li>`}renderClauseNode(a,_,p){const t=B[a.validation]??"#7A7A7A",o=[["subject",a.subject],["predicate",a.predicate],["object",a.object],["complement",a.complement],...a.modifiers.map(I=>["modifier",I])].filter(I=>I[1]!==null).map(([I,A],i)=>pa(A)?this.renderClauseNode(A,`${_}r${i}`,I):this.renderPhraseNode(A,`${_}r${i}`,I)).join("");return`
      <li class="lira-tree-node">
        <div class="lira-tree-row" data-node="${_}" data-kind="clause">
          <span class="lira-tree-spacer"></span>
          <span class="lira-tree-dot" style="background:${t}"></span>
          ${p?`<span class="lira-tree-role-pill">${e(p)}</span>`:""}
          <span class="lira-tree-label">Clause</span>
          <span class="lira-tree-summary">${e(a.clauseType??"?")}</span>
          <span class="lira-tree-snippet">${e(J(a.text,40))}</span>
        </div>
        ${o?`<ul>${o}</ul>`:""}
      </li>`}renderPhraseNode(a,_,p){const t=B[a.validation]??"#7A7A7A",r=a.nestedPhrases.map((o,I)=>this.renderPhraseNode(o,`${_}n${I}`)).join("");return`
      <li class="lira-tree-node">
        <div class="lira-tree-row" data-node="${_}" data-kind="phrase">
          <span class="lira-tree-spacer"></span>
          <span class="lira-tree-dot" style="background:${t}"></span>
          ${p?`<span class="lira-tree-role-pill">${e(p)}</span>`:""}
          <span class="lira-tree-label">Phrase</span>
          <span class="lira-tree-summary">${e(a.phraseType??"?")}</span>
          <span class="lira-tree-snippet">${e(J(a.text,40))}</span>
        </div>
        ${r?`<ul>${r}</ul>`:""}
      </li>`}renderWinner(a,_){const p=a.clauses[0],r=(p?[["subject",p.subject],["predicate",p.predicate],["object",p.object],["complement",p.complement],...p.modifiers.map(I=>["modifier",I])]:[]).map(([I,A])=>ta(I,A)).join(""),o=_.length?`<div class="lira-sr-winner-positions">
          ${_.map(I=>`
            <span class="lira-sr-winner-chip">
              <span class="lira-sr-mono lira-sr-faint">#${I.startIndex}</span>
              <span class="lira-sr-strong lira-sr-mono">${e(I.tokenText??"")}</span>
              <span class="lira-sr-faint">${e(I.winnerPhraseType??"none")}</span>
            </span>`).join("")}
        </div>`:"";return`
      <div class="lira-sr-winner-head">
        ${Cn(a.validation)}
        <span class="lira-sr-strong">${e(a.sentenceType??"UNRESOLVED")}</span>
        <span class="lira-sr-faint">confidence ${a.confidence.toFixed(2)}</span>
      </div>
      ${r?`<div class="lira-sr-winner-roles">${r}</div>`:""}
      ${o}
    `}renderPredicted(a,_){return`${`
      <div class="lira-sr-clause-head">
        ${Cn(a.validation)}
        <span class="lira-sr-strong">${e(a.sentenceType??"UNRESOLVED")}</span>
        <span class="lira-sr-faint">confidence ${a.confidence.toFixed(2)}</span>
        <span class="lira-sr-faint">${a.punctuation?`terminal "${e(a.punctuation)}"`:"no terminal punctuation"}</span>
      </div>`}${Q_(_)}${pp(a.errors)}`}renderTrace(a){return a.length?a.map(_=>this.renderPosition(_)).join(""):'<div class="lira-sr-empty">No trace positions recorded.</div>'}renderPosition(a){const _=a.candidatePartsOfSpeech.length?a.candidatePartsOfSpeech.join(", "):a.isKnown===!1?"unseeded":"",p=a.winnerPartsOfSpeech.length?`<div class="lira-sr-winner-pos">
          <span class="lira-sr-faint">Predicted part(s) of speech:</span>
          ${a.winnerPartsOfSpeech.map(t=>ra(t.text,t.partOfSpeech)).join("")}
        </div>`:"";return`
      <div class="lira-sr-position">
        <div class="lira-sr-position-head">
          <span class="lira-sr-mono lira-sr-faint">#${a.startIndex}</span>
          <span class="lira-sr-strong lira-sr-mono">${e(a.tokenText??"")}</span>
          <span class="lira-sr-faint">${e(_)}</span>
          <span class="lira-sr-winner">&#8594; won by ${e(a.winnerPhraseType??"none")}</span>
        </div>
        ${p}
        ${a.attempts.map(t=>this.renderAttempt(t)).join("")}
      </div>`}renderAttempt(a){const _=a.completions.length?a.completions.map(p=>`
          <div class="lira-sr-completion ${p.isWinner?"winner":""}">
            ${p.isWinner?'<span class="lira-sr-win-mark">&#10003; winner</span>':""}
            "${e(p.text)}" — ${e(p.validation)}, confidence ${p.confidence.toFixed(2)}
            ${_p(p.tokens)}
          </div>`).join(""):a.rejectionReason?`<div class="lira-sr-rejection">${e(a.rejectionReason)}</div>`:"";return`
      <div class="lira-sr-attempt ${a.startMatch?"":"rejected"}">
        <div class="lira-sr-attempt-head">
          <span class="lira-sr-attempt-type">${e(a.phraseType)}</span>
          <span class="lira-sr-match-mark ${a.startMatch?"yes":"no"}">${a.startMatch?"start matched":"no start match"}</span>
          <span class="lira-sr-faint lira-sr-mono">requires: ${a.requiredStart.map(e).join(", ")}</span>
        </div>
        ${_}
      </div>`}}function pa(n){return"clauseType"in n}function ta(n,a){if(!a)return"";if(pa(a)){const _=[["subject",a.subject],["predicate",a.predicate],["object",a.object],["complement",a.complement],...a.modifiers.map(p=>["modifier",p])];return`
      <div class="lira-sr-winner-role-row">
        <span class="lira-sr-winner-role-label">${e(n)}</span>
        <span class="lira-sr-mono">"${e(a.text)}"</span>
        <span class="lira-sr-faint">embedded clause · ${e(a.clauseType??"?")}</span>
      </div>
      <div class="lira-sr-winner-roles lira-sr-winner-roles-nested">${_.map(([p,t])=>ta(p,t)).join("")}</div>`}return`
    <div class="lira-sr-winner-role-row">
      <span class="lira-sr-winner-role-label">${e(n)}</span>
      <span class="lira-sr-mono">"${e(a.text)}"</span>
      <span class="lira-sr-faint">${e(a.phraseType??"?")}</span>
    </div>`}function en(n,a){return`<button type="button" class="lira-tree-toggle" data-action="toggle-node" data-node="${n}" aria-expanded="${a}">${tp}</button>`}function J(n,a){const _=n.trim();return _.length>a?`${_.slice(0,a-1)}…`:_}function Xn(n){const a=/^b(\d+)s(\d+)$/.exec(n);if(a)return{blockIndex:Number(a[1]),sentenceIndex:Number(a[2])}}function Z_(n){for(let a=0;a<n.blocks.length;a+=1){const _=n.blocks[a];if(_.blockKind!=="paragraph")continue;const p=_.sentences.findIndex(t=>t.errors.length>0);if(p>=0)return`b${a}s${p}`}for(let a=0;a<n.blocks.length;a+=1){const _=n.blocks[a];if(_.blockKind==="paragraph"&&_.sentences.length>0)return`b${a}s0`}}function Q_(n){if(!n.length)return'<div class="lira-sr-empty">No words to show.</div>';let a="";return n.forEach((_,p)=>{const t=/^[.,!?;:]+$/.test(_.text);p>0&&!t&&(a+=" "),a+=np(_,p)}),`<div class="lira-sr-sentence">${a}</div>`}function np(n,a){return`<span class="lira-sr-word${n.resolved?"":" lira-sr-word-unfound"}" tabindex="0" data-word-index="${a}">${e(n.text)}${ap(n)}</span>`}function ap(n){if(!n.resolved)return`<span class="lira-sr-word-tooltip"><span class="tt-title">${e(n.text)}</span><span class="tt-meta">Not found in the Common Vocabulary Cache</span></span>`;const a=[n.validation??"UNRESOLVED",n.phraseType??"no phrase"],_=[n.partOfSpeech??"?",`conf ${n.confidence!==null?n.confidence.toFixed(2):"—"}`];return`<span class="lira-sr-word-tooltip"><span class="tt-title">${e(n.text)}</span><span class="tt-meta">${a.map(e).join(" · ")}</span><span class="tt-meta">${_.map(e).join(" · ")}</span></span>`}function Cn(n){return`<span class="lira-sr-badge" style="background:${B[n]??"#7A7A7A"}">${e(n)}</span>`}function ra(n,a){return`
    <span class="lira-sr-pos-chip" style="background:${z_[a]??"#7A7A7A"}">
      <span class="w">${e(n)}</span>
      <span class="p">${e(a)}</span>
    </span>`}function _p(n){return n.length?`<div class="lira-sr-trace-tokens">${n.map(_=>ra(_.text,_.partOfSpeech??"UNKNOWN")).join("")}</div>`:""}function pp(n){return n.length?`
    <div class="lira-sr-errors">
      ${n.map(a=>`
        <div class="lira-sr-error-row">
          <span class="lira-sr-strong">${e(a.kind)}:</span>
          ${e(a.message)}${a.tokenText?` ("${e(a.tokenText)}")`:""}
        </div>`).join("")}
    </div>`:""}function e(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const tp='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',rp=`
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
 */const w="Common",Gn=[{id:"vocabulary",label:"Vocabulary",available:!0},{id:"linguistics",label:"Linguistics",available:!0},{id:"knowledge",label:"Knowledge",available:!1},{id:"canvas",label:"Canvas",available:!0}],kn="lira-portal-shell-styles",Hn="lira-vocabulary-fragment-styles";class op{constructor(a,_,p,t,r={}){c(this,"mode");c(this,"mobileScreen","browse");c(this,"selectedName");c(this,"selectedComponent","vocabulary");c(this,"treeCollapsed",!1);c(this,"title");c(this,"container");c(this,"serviceStatusView");c(this,"consoleView");c(this,"sentenceReaderView");c(this,"gpuCanvasView");c(this,"logBoard",new La);c(this,"loggersBySource",new Map);c(this,"renderToken",0);c(this,"ioInFlight",!1);c(this,"domainSnapshots",new Map);c(this,"currentVocabularyDomainName");var o;this.registry=a,this.vocabularyClient=_,this.statusBoard=t,this.title=r.title??"LIRA",this.mode=typeof window<"u"&&window.matchMedia("(max-width: 720px)").matches?"mobile":"desktop",this.selectedName=(o=this.registry.roots()[0])==null?void 0:o.name,this.serviceStatusView=new da(t,[],this.logBoard),this.consoleView=new o_(t,_,p),this.sentenceReaderView=new q_(p),this.gpuCanvasView=new K_(this.loggerFor("Canvas")),this.vocabularyClient.onLog((I,A,i)=>{this.loggerFor(A)[I](i)}),this.statusBoard.subscribe(I=>{const A=I.find(i=>i.id==="vocabulary");A&&this.updateVocabToolbar(A)}),this.vocabularyClient.onDomainUpdated(I=>{this.registry.add(I),this.render()}),this.vocabularyClient.onDomainSnapshot((I,A)=>{this.handleDomainSnapshot(I,A)}),this.searchWordsBridge(),this.searchPhrasesBridge(),this.searchSensesBridge(),this.searchRelationshipsBridge(),this.searchLexicalRelationshipsBridge(),this.resolveHierarchyBridge()}searchWordsBridge(){document.addEventListener("lira-search-words",a=>{const _=a.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchWords(this.currentVocabularyDomainName,{wordId:_.wordId,word:_.word,gloss:_.gloss,definition:_.definition,pos:_.pos,domainLabel:_.domain,rootWordsOnly:_.rootWordsOnly,limit:_.limit}).then(p=>{document.dispatchEvent(new CustomEvent("lira-search-words-result",{detail:{requestId:_.requestId,words:p.words,totalMatches:p.totalMatches}}))})})}searchPhrasesBridge(){document.addEventListener("lira-search-phrases",a=>{const _=a.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchPhrases(this.currentVocabularyDomainName,{word:_.word,gloss:_.gloss,definition:_.definition,pos:_.pos,limit:_.limit}).then(p=>{document.dispatchEvent(new CustomEvent("lira-search-phrases-result",{detail:{requestId:_.requestId,phrases:p.phrases,totalMatches:p.totalMatches}}))})})}searchSensesBridge(){document.addEventListener("lira-search-senses",a=>{const _=a.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchSenses(this.currentVocabularyDomainName,{word:_.word,gloss:_.gloss,definition:_.definition,pos:_.pos,limit:_.limit}).then(p=>{document.dispatchEvent(new CustomEvent("lira-search-senses-result",{detail:{requestId:_.requestId,senses:p.senses,totalMatches:p.totalMatches}}))})})}searchRelationshipsBridge(){document.addEventListener("lira-search-relationships",a=>{const _=a.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchRelationships(this.currentVocabularyDomainName,{wordId:_.wordId,query:_.query,limit:_.limit}).then(p=>{document.dispatchEvent(new CustomEvent("lira-search-relationships-result",{detail:{requestId:_.requestId,relationships:p.relationships,totalMatches:p.totalMatches}}))})})}searchLexicalRelationshipsBridge(){document.addEventListener("lira-search-lexical-relationships",a=>{const _=a.detail;this.currentVocabularyDomainName&&this.vocabularyClient.searchLexicalRelationships(this.currentVocabularyDomainName,{wordId:_.wordId,query:_.query,limit:_.limit}).then(p=>{document.dispatchEvent(new CustomEvent("lira-search-lexical-relationships-result",{detail:{requestId:_.requestId,relationships:p.relationships,totalMatches:p.totalMatches}}))})})}resolveHierarchyBridge(){document.addEventListener("lira-resolve-hierarchy",a=>{const _=a.detail;this.currentVocabularyDomainName&&this.vocabularyClient.resolveHierarchy(this.currentVocabularyDomainName,{kind:_.kind,wordId:_.wordId,limit:_.limit}).then(p=>{document.dispatchEvent(new CustomEvent("lira-resolve-hierarchy-result",{detail:{requestId:_.requestId,...p}}))})})}mount(a){this.container=a,document.title=this.title,this.ensureStyles(),a.addEventListener("click",_=>this.handleClick(_)),a.addEventListener("change",_=>this.handleFileInputChange(_)),this.render()}handleClick(a){var t,r;const _=a.target.closest("[data-action]");if(!_||_.disabled)return;const p=_.dataset.action;p==="select"?(this.selectedName=_.dataset.domain,this.mode==="mobile"&&(this.mobileScreen="view"),this.render()):p==="mode"?(this.mode=_.dataset.mode,this.mode==="mobile"&&(this.mobileScreen=this.selectedName?"view":"browse"),this.render()):p==="back"?(this.mobileScreen="browse",this.render()):p==="component"?(this.selectedComponent=_.dataset.component,this.render()):p==="toggle-tree"?(this.treeCollapsed=!this.treeCollapsed,this.render()):p==="seed-wordnet"?this.vocabularyClient.seedWordNet(w):p==="seed-common-vocabulary"?this.vocabularyClient.seedCommonVocabulary(w):p==="save-vocabulary"?this.saveVocabulary():p==="load-vocabulary"&&((r=(t=this.container)==null?void 0:t.querySelector(".portal-vocab-file-input"))==null||r.click())}saveVocabulary(){this.ioInFlight=!0,this.render();const a=w.toLowerCase();this.vocabularyClient.exportDomain(w).then(_=>{R(_.words,`${a}-words.json`),R(_.phrases,`${a}-phrases.json`),R(_.wordForms,`${a}-word_forms.json`),R(_.senses,`${a}-senses.json`),R(_.coordinations,`${a}-coordinations.json`),R(_.semanticRelationships,`${a}-semantic-relationships.json`),R(_.lexicalRelationships,`${a}-lexical-relationships.json`)}).catch(()=>{}).finally(()=>{this.ioInFlight=!1,this.render()})}handleFileInputChange(a){const _=a.target;if(!_.classList.contains("portal-vocab-file-input")||!_.files||_.files.length===0)return;const p=[..._.files];_.value="",this.ioInFlight=!0,this.render(),Promise.all(p.map(async t=>{const r=Ip(t.name);return r?[r,await t.text()]:void 0})).then(t=>{const r={};for(const o of t)o&&(r[o[0]]=o[1]);return this.vocabularyClient.importDomain(w,r)}).catch(()=>{}).finally(()=>{this.ioInFlight=!1,this.render()})}handleDomainSnapshot(a,_){const p=this.domainSnapshots.get(a);if(p)for(const I of p)URL.revokeObjectURL(I.url);const t=a.toLowerCase(),r=[["Words",`${t}-words.json`,_.words],["Phrases",`${t}-phrases.json`,_.phrases],["Word Forms",`${t}-word_forms.json`,_.wordForms],["Senses",`${t}-senses.json`,_.senses],["Coordinations",`${t}-coordinations.json`,_.coordinations],["Semantic Relationships",`${t}-semantic-relationships.json`,_.semanticRelationships],["Lexical Relationships",`${t}-lexical-relationships.json`,_.lexicalRelationships]];this.domainSnapshots.set(a,r.map(([I,A,i])=>({label:I,filename:A,url:URL.createObjectURL(new Blob([i],{type:"application/json"}))})));const o=this.statusBoard.get("vocabulary");o&&this.updateVocabToolbar(o)}renderVocabToolbar(){return`<div class="portal-vocab-toolbar">${this.vocabToolbarInner(this.statusBoard.get("vocabulary"))}</div>`}vocabToolbarInner(a){const _=(a==null?void 0:a.state)==="running",p=_||this.ioInFlight,t=a==null?void 0:a.progress;return`
      <button type="button" class="portal-vocab-toolbar-action" data-action="seed-common-vocabulary" ${_?"disabled":""}>Seed Vocabulary</button>
      <button type="button" class="portal-vocab-toolbar-action" data-action="seed-wordnet" ${_?"disabled":""}>Load WordNet</button>
      <button type="button" class="portal-vocab-toolbar-action" data-action="save-vocabulary" ${p?"disabled":""}>Save</button>
      <button type="button" class="portal-vocab-toolbar-action" data-action="load-vocabulary" ${p?"disabled":""}>Load from File</button>
      <input type="file" class="portal-vocab-file-input" multiple accept=".json" style="display:none">
      <span class="portal-vocab-toolbar-detail">${a!=null&&a.detail?f(a.detail):""}</span>
      ${t!==void 0?`<div class="portal-vocab-toolbar-progress"><div class="portal-vocab-toolbar-progress-fill" style="width:${Math.round(t*100)}%"></div></div>`:""}
      ${this.snapshotLinksHtml()}
    `}snapshotLinksHtml(){const a=this.domainSnapshots.get(w);return!a||a.length===0?"":`<div class="portal-vocab-snapshot-links"><span class="portal-vocab-snapshot-label">Last seed snapshot:</span>${a.map(p=>`<a class="portal-vocab-snapshot-link" href="${p.url}" download="${f(p.filename)}">${f(p.label)}</a>`).join("")}</div>`}updateVocabToolbar(a){var p;const _=(p=this.container)==null?void 0:p.querySelector(".portal-vocab-toolbar");_&&(_.innerHTML=this.vocabToolbarInner(a))}loggerFor(a){let _=this.loggersBySource.get(a);return _||(_=new Da(a,p=>this.logBoard.append(p)),this.loggersBySource.set(a,_)),_}ensureStyles(){if(document.getElementById(kn))return;const a=document.createElement("style");a.id=kn,a.textContent=lp,document.head.appendChild(a)}ensureFragmentStyles(a){if(document.getElementById(Hn))return;const _=document.createElement("style");_.id=Hn,_.textContent=a,document.head.appendChild(_)}render(){if(!this.container)return;const a=this.selectedName?this.registry.get(this.selectedName):void 0;this.renderToken++;const _=this.mode==="desktop"&&this.treeCollapsed?"tree-collapsed":"";this.container.innerHTML=`
      <div class="portal-shell mode-${this.mode} ${_}">
        ${this.renderTopbar(a)}
        <div class="portal-body">
          ${this.renderBody(a)}
        </div>
      </div>
    `;const p=this.container.querySelector(".portal-service-status");p&&this.serviceStatusView.mount(p);const t=this.container.querySelector(".portal-console");t&&this.consoleView.mount(t),a&&this.selectedComponent==="vocabulary"?this.loadView(a):a&&this.selectedComponent==="linguistics"?this.loadLinguisticsView():a&&this.selectedComponent==="canvas"&&this.loadCanvasView()}loadLinguisticsView(){if(!this.container)return;const a=this.container.querySelector(".portal-fragment-mount");a&&this.sentenceReaderView.mount(a)}loadCanvasView(){if(!this.container)return;const a=this.container.querySelector(".portal-fragment-mount");a&&this.gpuCanvasView.mount(a)}async loadView(a){const _=++this.renderToken;this.setViewStatus("Loading Vocabulary…");let p;try{p=await this.vocabularyClient.renderDomain(a.name)}catch(r){if(_!==this.renderToken)return;this.setViewStatus(`Couldn't load this Domain's Vocabulary view: ${r instanceof Error?r.message:String(r)}`);return}if(_!==this.renderToken||!this.container)return;this.ensureFragmentStyles(p.style);const t=this.container.querySelector(".portal-fragment-mount");if(t){t.innerHTML=p.body,this.currentVocabularyDomainName=a.name;const r=document.createElement("script");r.textContent=`(function () {
${p.script}
})();`,t.appendChild(r)}this.setViewStatus(void 0)}setViewStatus(a){var p;const _=(p=this.container)==null?void 0:p.querySelector(".portal-view-status");_&&(_.textContent=a??"",_.style.display=a?"block":"none")}renderTopbar(a){const _=`
      <div class="portal-mode-toggle" role="group" aria-label="Layout">
        <button type="button" data-action="mode" data-mode="desktop" class="${this.mode==="desktop"?"active":""}">${Np} Desktop</button>
        <button type="button" data-action="mode" data-mode="mobile" class="${this.mode==="mobile"?"active":""}">${sp} Mobile</button>
      </div>`;if(this.mode==="mobile")return this.mobileScreen==="view"&&a?`
          <div class="portal-topbar">
            <button type="button" class="portal-back" data-action="back" aria-label="Back to Domains">${ep}</button>
            <span class="portal-topbar-title">${f(a.name)}</span>
            ${_}
          </div>`:`<div class="portal-topbar"><span class="portal-topbar-title">All Domains</span>${_}</div>`;const p=a?this.registry.ancestryOf(a.name):[];return`<div class="portal-topbar"><nav class="portal-breadcrumb">${[`<span class="crumb-root">${Pp} All Domains</span>`,...p.map(r=>`<span>${f(r.name)}</span>`)].join(`<span class="crumb-sep">${ip}</span>`)}</nav>${_}</div>`}renderBody(a){return this.mode==="desktop"?`${this.renderTree()}${this.renderViewPane(a)}`:this.mobileScreen==="browse"?`<div class="portal-tree portal-tree--mobile">${this.renderTreeRows(0)}</div>`:this.renderViewPane(a,!0)}renderTree(){return this.treeCollapsed?`
        <nav class="portal-tree portal-tree--collapsed">
          <button type="button" class="portal-tree-toggle" data-action="toggle-tree" title="Expand Domains" aria-label="Expand Domains" aria-expanded="false">${Tp}</button>
        </nav>`:`
      <nav class="portal-tree">
        <div class="portal-tree-label">
          <span>Domains</span>
          <button type="button" class="portal-tree-toggle" data-action="toggle-tree" title="Collapse Domains" aria-label="Collapse Domains" aria-expanded="true">${Op}</button>
        </div>
        ${this.renderTreeRows(0)}
      </nav>`}renderTreeRows(a,_){return(a===0?this.registry.roots():this.registry.children(_??"")).map(t=>{const r=this.registry.children(t.name),o=t.name===this.selectedName;return`
          <div class="portal-tree-row depth-${a} ${o?"selected":""}" data-action="select" data-domain="${f(t.name)}">
            ${r.length>0?Ap:'<span class="chev-spacer"></span>'}
            ${cp}
            <span class="name">${f(t.name)}</span>
            <span class="count">${t.wordCount.toLocaleString()}</span>
          </div>
          ${r.length>0?this.renderTreeRows(a+1,t.name):""}
        `}).join("")}renderComponentSwitcher(){return`
      <div class="portal-component-switcher" role="tablist" aria-label="UI Component">
        ${Gn.map(a=>`
          <button
            type="button"
            role="tab"
            data-action="component"
            data-component="${a.id}"
            class="${a.id===this.selectedComponent?"active":""}"
            ${a.available?"":"disabled"}
            title="${a.available?"":"Not ported yet"}"
            aria-selected="${a.id===this.selectedComponent}"
          >${f(a.label)}${a.available?"":' <span class="not-ported-badge">Not ported</span>'}</button>
        `).join("")}
      </div>`}renderViewPane(a,_=!1){const p=this.renderComponentSwitcher(),t='<div class="portal-console"></div>',r='<div class="portal-service-status"></div>',o=this.selectedComponent==="vocabulary"?this.renderVocabToolbar():"";if(!a)return`
        <div class="portal-view ${_?"portal-view--full":""}">
          ${p}
          ${o}
          <div class="portal-view-empty">Select a Domain to continue.</div>
          ${t}
          ${r}
        </div>`;const I=Gn.find(i=>i.id===this.selectedComponent),A=I!=null&&I.available?`
        <div class="portal-view-status" style="display:none"></div>
        <div class="portal-fragment-mount"></div>`:`<div class="portal-view-empty">${f((I==null?void 0:I.label)??"This component")} is not ported yet.</div>`;return`
      <div class="portal-view ${_?"portal-view--full":""}">
        ${p}
        ${o}
        ${A}
        ${t}
        ${r}
      </div>`}}function f(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function R(n,a){const _=new Blob([n],{type:"application/json"}),p=URL.createObjectURL(_),t=document.createElement("a");t.href=p,t.download=a,t.click(),URL.revokeObjectURL(p)}function Ip(n){const a=n.toLowerCase();if(a.includes("word_forms")||a.includes("wordforms"))return"wordForms";if(a.includes("words"))return"words";if(a.includes("phrases"))return"phrases";if(a.includes("senses"))return"senses";if(a.includes("coordinations"))return"coordinations";if(a.includes("semantic"))return"semanticRelationships";if(a.includes("lexical"))return"lexicalRelationships"}const cp='<svg class="i-folder" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.5A1 1 0 0 1 2.5 2.5h3.6l1.2 1.4H13.5A1 1 0 0 1 14.5 5v7A1 1 0 0 1 13.5 13h-11a1 1 0 0 1-1-1v-8.5z"/></svg>',Ap='<svg class="i-chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>',ip='<svg class="i-chev-right" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>',Pp='<svg class="i-home" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 8l6-5 6 5M4 7v6h8V7"/></svg>',ep='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3L5 8l5 5"/></svg>',Np='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1.5" y="2.5" width="13" height="9" rx="1"/><path d="M6 13.5h4"/></svg>',sp='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4.5" y="1.5" width="7" height="13" rx="1.4"/></svg>',Op='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3L5 8l5 5"/></svg>',Tp='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>',lp=`
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
 */class Ep{constructor(){c(this,"worker");c(this,"statusListeners",new Set);c(this,"domainUpdateListeners",new Set);c(this,"domainSnapshotListeners",new Set);c(this,"logListeners",new Set);c(this,"readyResolvers",[]);c(this,"pendingRenders",new Map);c(this,"pendingExports",new Map);c(this,"pendingImports",new Map);c(this,"pendingSearches",new Map);c(this,"pendingPhraseSearches",new Map);c(this,"pendingSenseSearches",new Map);c(this,"pendingRelationshipSearches",new Map);c(this,"pendingLexicalRelationshipSearches",new Map);c(this,"pendingHierarchyResolutions",new Map);c(this,"pendingMetrics",new Map);this.worker=new Worker(new URL(""+new URL("vocabulary_worker-BNZNrjCY.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.addEventListener("message",a=>{this.handleMessage(a.data)})}onStatus(a){return this.statusListeners.add(a),()=>{this.statusListeners.delete(a)}}onLog(a){return this.logListeners.add(a),()=>{this.logListeners.delete(a)}}init(){return new Promise(a=>{this.readyResolvers.push(a),this.post({type:"init"})})}linkPort(a){this.worker.postMessage({type:"link-port",port:a},[a])}renderDomain(a){const _=`${a}-${Math.random().toString(36).slice(2)}`;return new Promise((p,t)=>{this.pendingRenders.set(_,{resolve:p,reject:t}),this.post({type:"render",requestId:_,domain:a})})}exportDomain(a){const _=`export-${a}-${Math.random().toString(36).slice(2)}`;return new Promise((p,t)=>{this.pendingExports.set(_,{resolve:p,reject:t}),this.post({type:"export-domain",requestId:_,domain:a})})}importDomain(a,_){const p=`import-${a}-${Math.random().toString(36).slice(2)}`;return new Promise((t,r)=>{this.pendingImports.set(p,{resolve:t,reject:r}),this.post({type:"import-domain",requestId:p,domain:a,..._})})}getMetrics(){const a=`metrics-${Math.random().toString(36).slice(2)}`;return new Promise(_=>{this.pendingMetrics.set(a,_),this.post({type:"metrics",requestId:a})})}seedWordNet(a){this.post({type:"seed-wordnet",domain:a})}seedCommonVocabulary(a){this.post({type:"seed-common-vocabulary",domain:a})}onDomainUpdated(a){return this.domainUpdateListeners.add(a),()=>{this.domainUpdateListeners.delete(a)}}onDomainSnapshot(a){return this.domainSnapshotListeners.add(a),()=>{this.domainSnapshotListeners.delete(a)}}searchWords(a,_){const p=`search-${a}-${Math.random().toString(36).slice(2)}`;return new Promise(t=>{this.pendingSearches.set(p,t),this.post({type:"search-words",requestId:p,domain:a,wordId:_.wordId,word:_.word,gloss:_.gloss,definition:_.definition,pos:_.pos,domainLabel:_.domainLabel,rootWordsOnly:_.rootWordsOnly,limit:_.limit})})}searchPhrases(a,_){const p=`phrase-search-${a}-${Math.random().toString(36).slice(2)}`;return new Promise(t=>{this.pendingPhraseSearches.set(p,t),this.post({type:"search-phrases",requestId:p,domain:a,word:_.word,gloss:_.gloss,definition:_.definition,pos:_.pos,limit:_.limit})})}searchSenses(a,_){const p=`sense-search-${a}-${Math.random().toString(36).slice(2)}`;return new Promise(t=>{this.pendingSenseSearches.set(p,t),this.post({type:"search-senses",requestId:p,domain:a,word:_.word,gloss:_.gloss,definition:_.definition,pos:_.pos,limit:_.limit})})}searchRelationships(a,_){const p=`rel-search-${a}-${Math.random().toString(36).slice(2)}`;return new Promise(t=>{this.pendingRelationshipSearches.set(p,t),this.post({type:"search-relationships",requestId:p,domain:a,wordId:_.wordId,query:_.query,limit:_.limit})})}searchLexicalRelationships(a,_){const p=`lexical-rel-search-${a}-${Math.random().toString(36).slice(2)}`;return new Promise(t=>{this.pendingLexicalRelationshipSearches.set(p,t),this.post({type:"search-lexical-relationships",requestId:p,domain:a,wordId:_.wordId,query:_.query,limit:_.limit})})}resolveHierarchy(a,_){const p=`hierarchy-${a}-${Math.random().toString(36).slice(2)}`;return new Promise(t=>{this.pendingHierarchyResolutions.set(p,t),this.post({type:"resolve-hierarchy",requestId:p,domain:a,kind:_.kind,wordId:_.wordId,limit:_.limit})})}post(a){this.worker.postMessage(a)}handleMessage(a){if(a.type==="status")for(const _ of this.statusListeners)_(a.state,a.detail,a.progress);else if(a.type==="ready"){const _=this.readyResolvers.splice(0);for(const p of _)p(a.domains)}else if(a.type==="rendered"){const _=this.pendingRenders.get(a.requestId);_&&(this.pendingRenders.delete(a.requestId),_.resolve(a.fragment))}else if(a.type==="render-error"){const _=this.pendingRenders.get(a.requestId);_&&(this.pendingRenders.delete(a.requestId),_.reject(new Error(a.message)))}else if(a.type==="export-domain-result"){const _=this.pendingExports.get(a.requestId);_&&(this.pendingExports.delete(a.requestId),_.resolve({words:a.words,phrases:a.phrases,wordForms:a.wordForms,senses:a.senses,coordinations:a.coordinations,semanticRelationships:a.semanticRelationships,lexicalRelationships:a.lexicalRelationships}))}else if(a.type==="export-domain-error"){const _=this.pendingExports.get(a.requestId);_&&(this.pendingExports.delete(a.requestId),_.reject(new Error(a.message)))}else if(a.type==="import-domain-result"){const _=this.pendingImports.get(a.requestId);_&&(this.pendingImports.delete(a.requestId),_.resolve(a.domain))}else if(a.type==="import-domain-error"){const _=this.pendingImports.get(a.requestId);_&&(this.pendingImports.delete(a.requestId),_.reject(new Error(a.message)))}else if(a.type==="metrics-result"){const _=this.pendingMetrics.get(a.requestId);_&&(this.pendingMetrics.delete(a.requestId),_(a.metrics))}else if(a.type==="domain-updated")for(const _ of this.domainUpdateListeners)_(a.domain);else if(a.type==="domain-snapshot")for(const _ of this.domainSnapshotListeners)_(a.domain,{words:a.words,phrases:a.phrases,wordForms:a.wordForms,senses:a.senses,coordinations:a.coordinations,semanticRelationships:a.semanticRelationships,lexicalRelationships:a.lexicalRelationships});else if(a.type==="log")for(const _ of this.logListeners)_(a.level,a.source,a.message,a.timestamp);else if(a.type==="search-words-result"){const _=this.pendingSearches.get(a.requestId);_&&(this.pendingSearches.delete(a.requestId),_({words:a.words,totalMatches:a.totalMatches}))}else if(a.type==="search-phrases-result"){const _=this.pendingPhraseSearches.get(a.requestId);_&&(this.pendingPhraseSearches.delete(a.requestId),_({phrases:a.phrases,totalMatches:a.totalMatches}))}else if(a.type==="search-senses-result"){const _=this.pendingSenseSearches.get(a.requestId);_&&(this.pendingSenseSearches.delete(a.requestId),_({senses:a.senses,totalMatches:a.totalMatches}))}else if(a.type==="search-relationships-result"){const _=this.pendingRelationshipSearches.get(a.requestId);_&&(this.pendingRelationshipSearches.delete(a.requestId),_({relationships:a.relationships,totalMatches:a.totalMatches}))}else if(a.type==="search-lexical-relationships-result"){const _=this.pendingLexicalRelationshipSearches.get(a.requestId);_&&(this.pendingLexicalRelationshipSearches.delete(a.requestId),_({relationships:a.relationships,totalMatches:a.totalMatches}))}else if(a.type==="resolve-hierarchy-result"){const _=this.pendingHierarchyResolutions.get(a.requestId);_&&(this.pendingHierarchyResolutions.delete(a.requestId),_({nodes:a.nodes,edges:a.edges,roots:a.roots,totalEdgeCount:a.totalEdgeCount,totalNodeCount:a.totalNodeCount,fellBack:a.fellBack,truncated:a.truncated}))}else a.type==="error"&&console.error("Vocabulary Service error:",a.message)}}/**
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
 */class Lp{constructor(){c(this,"worker");c(this,"statusListeners",new Set);c(this,"readyResolvers",[]);c(this,"pendingReads",new Map);c(this,"pendingReadDocuments",new Map);c(this,"pendingMetrics",new Map);this.worker=new Worker(new URL(""+new URL("linguistics_worker-Cldfhp1Y.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.addEventListener("message",a=>{this.handleMessage(a.data)})}onStatus(a){return this.statusListeners.add(a),()=>{this.statusListeners.delete(a)}}init(){return new Promise(a=>{this.readyResolvers.push(a),this.post({type:"init"})})}linkVocabularyPort(a){this.worker.postMessage({type:"link-vocabulary-port",port:a},[a])}read(a,_,p=!1){const t=`read-${Math.random().toString(36).slice(2)}`;return new Promise((r,o)=>{this.pendingReads.set(t,{resolve:r,reject:o}),this.post({type:"read",requestId:t,text:a,learningEnabled:_,skipLearning:p})})}readDocument(a,_){const p=`read-doc-${Math.random().toString(36).slice(2)}`;return new Promise((t,r)=>{this.pendingReadDocuments.set(p,{resolve:t,reject:r}),this.post({type:"read-document",requestId:p,text:a,learningEnabled:_})})}getMetrics(){const a=`metrics-${Math.random().toString(36).slice(2)}`;return new Promise(_=>{this.pendingMetrics.set(a,_),this.post({type:"metrics",requestId:a})})}post(a){this.worker.postMessage(a)}handleMessage(a){if(a.type==="status")for(const _ of this.statusListeners)_(a.state,a.detail);else if(a.type==="ready"){const _=this.readyResolvers.splice(0);for(const p of _)p(a.wordCount)}else if(a.type==="read-result"){const _=this.pendingReads.get(a.requestId);_&&(this.pendingReads.delete(a.requestId),_.resolve(a.result))}else if(a.type==="read-document-result"){const _=this.pendingReadDocuments.get(a.requestId);_&&(this.pendingReadDocuments.delete(a.requestId),_.resolve(a.result))}else if(a.type==="metrics-result"){const _=this.pendingMetrics.get(a.requestId);_&&(this.pendingMetrics.delete(a.requestId),_(a.metrics))}else if(a.type==="error"){if(a.requestId){const _=this.pendingReads.get(a.requestId);if(_){this.pendingReads.delete(a.requestId),_.reject(new Error(a.message));return}const p=this.pendingReadDocuments.get(a.requestId);if(p){this.pendingReadDocuments.delete(a.requestId),p.reject(new Error(a.message));return}}console.error("Linguistic Service error:",a.message)}}}/**
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
 */function Dp(){const n=document.querySelector("#app");if(!n)return;n.style.height="100vh";const a=new ea;a.register("vocabulary","Vocabulary Service","idle","Starting…"),a.register("linguistics","Linguistic Service","idle","Starting…"),a.register("knowledge","Knowledge Service","not-ported");const _=new sa(a,"LIRA");_.mount(n);const p=new Ep;p.onStatus((o,I,A)=>a.update("vocabulary",o,I,A));const t=new Lp;t.onStatus((o,I)=>a.update("linguistics",o,I));const r=new MessageChannel;p.linkPort(r.port1),t.linkVocabularyPort(r.port2),Promise.all([p.init(),t.init()]).then(([o])=>{_.destroy();const I=new Na(o);new op(I,p,t,a,{title:"LIRA"}).mount(n)}).catch(o=>{a.update("vocabulary","error",o instanceof Error?o.message:String(o))})}Dp();
