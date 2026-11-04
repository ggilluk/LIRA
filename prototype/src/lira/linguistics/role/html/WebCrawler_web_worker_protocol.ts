/**
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
 * │ Module Name     │ lira/linguistics/role/html/WebCrawler_web_worker_protocol
 * │ Filename        │ WebCrawler_web_worker_protocol.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Message protocol between the Web Crawler coordinator worker and
 * │                 │ its client.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/WebCrawler_web_worker_protocol
 * @file WebCrawler_web_worker_protocol.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** Message protocol for the Web Crawler coordinator worker.
 *
 * The crawler owns crawl state and a pool of HTML Processor workers. Requests
 * remain structured-clone-safe so the main thread never shares live parser or
 * crawler objects with the worker. */

import type { HTMLProcessedPage } from "./HTML_web_worker_protocol";

export type WebCrawlerServiceState = "idle" | "running" | "done" | "error";

export interface WebCrawlerInitRequest {
  type: "init";
  /** Number of HTML Processor workers to host. Defaults to 4. */
  processorCount?: number;
}

export interface WebCrawlerOptions {
  maxPages?: number;
  maxDepth?: number;
  sameOriginOnly?: boolean;
}

export interface WebCrawlerCrawlRequest {
  type: "crawl";
  requestId: string;
  seedUrl: string;
  options?: WebCrawlerOptions;
}

export interface WebCrawlerCancelRequest {
  type: "cancel-crawl";
  requestId: string;
}

export type WebCrawlerWorkerRequest = WebCrawlerInitRequest | WebCrawlerCrawlRequest | WebCrawlerCancelRequest;

export interface WebCrawlerStatusMessage {
  type: "status";
  state: WebCrawlerServiceState;
  detail?: string;
  requestId?: string;
}

export interface WebCrawlerReadyMessage {
  type: "ready";
  processorCount: number;
}

export interface WebCrawlerPageMessage {
  type: "crawl-page";
  requestId: string;
  page: HTMLProcessedPage;
}

export interface WebCrawlerResult {
  pageCount: number;
  cancelled: boolean;
}

export interface WebCrawlerResultMessage {
  type: "crawl-result";
  requestId: string;
  result: WebCrawlerResult;
}

export interface WebCrawlerErrorMessage {
  type: "error";
  requestId?: string;
  message: string;
}

export type WebCrawlerWorkerMessage =
  | WebCrawlerStatusMessage
  | WebCrawlerReadyMessage
  | WebCrawlerPageMessage
  | WebCrawlerResultMessage
  | WebCrawlerErrorMessage;
