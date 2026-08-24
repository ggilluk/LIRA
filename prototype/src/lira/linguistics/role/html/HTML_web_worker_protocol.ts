/** Message protocol between the main thread and HTML_web_worker.ts.
 * Mirrors the existing Linguistics/Vocabulary worker split: requests and
 * messages are plain structured-clone-safe data, while the worker owns the
 * real HTMLProcessor/WebCrawler instances inside its own global scope. */

import type { CrawledPage } from "./WebCrawler";

export type HTMLServiceState = "idle" | "running" | "done" | "error";

export interface HTMLWorkerInitRequest {
  type: "init";
}

/** Clone-safe subset of WebCrawlerOptions. `shouldVisit` is deliberately not
 * present because functions cannot cross a Web Worker postMessage boundary. */
export interface HTMLCrawlOptions {
  maxPages?: number;
  maxDepth?: number;
  sameOriginOnly?: boolean;
  requestDelayMs?: number;
}

export interface HTMLCrawlRequest {
  type: "crawl";
  requestId: string;
  seedUrl: string;
  options?: HTMLCrawlOptions;
}

export interface HTMLCancelCrawlRequest {
  type: "cancel-crawl";
  requestId: string;
}

export type HTMLWorkerRequest = HTMLWorkerInitRequest | HTMLCrawlRequest | HTMLCancelCrawlRequest;

export interface HTMLStatusMessage {
  type: "status";
  state: HTMLServiceState;
  detail?: string;
  requestId?: string;
}

export interface HTMLReadyMessage {
  type: "ready";
}

/** One successfully-read page is streamed as soon as WebCrawler has already
 * supplied it to HTMLProcessor and received its LIRA HTML Document. */
export interface HTMLCrawledPageMessage {
  type: "crawl-page";
  requestId: string;
  page: CrawledPage;
}

export interface HTMLCrawlResult {
  pageCount: number;
  cancelled: boolean;
}

export interface HTMLCrawlResultMessage {
  type: "crawl-result";
  requestId: string;
  result: HTMLCrawlResult;
}

export interface HTMLErrorMessage {
  type: "error";
  requestId?: string;
  message: string;
}

export type HTMLWorkerMessage =
  | HTMLStatusMessage
  | HTMLReadyMessage
  | HTMLCrawledPageMessage
  | HTMLCrawlResultMessage
  | HTMLErrorMessage;
