/** Message protocol for one HTML Processor Web Worker.
 *
 * The HTML worker no longer owns crawl state. It performs exactly one page job
 * at a time: read the URL, parse it into LIRA HTML data, discover the page's
 * outgoing HTTP(S) links, and return the result to its coordinator.
 *
 * WebCrawler_web_worker.ts owns URL scheduling, de-duplication, depth/limits and
 * the pool of these workers. */

import type { Document as HtmlDocument } from "../../data/html/document/document";

export type HTMLServiceState = "idle" | "running" | "done" | "error";

export interface HTMLWorkerInitRequest {
  type: "init";
}

export interface HTMLProcessPageRequest {
  type: "process-page";
  requestId: string;
  url: string;
  depth: number;
}

export type HTMLWorkerRequest = HTMLWorkerInitRequest | HTMLProcessPageRequest;

export interface HTMLStatusMessage {
  type: "status";
  state: HTMLServiceState;
  detail?: string;
  requestId?: string;
}

export interface HTMLReadyMessage {
  type: "ready";
}

/** Structured-clone-safe result of one HTML processing job. */
export interface HTMLProcessedPage {
  url: string;
  depth: number;
  html: string;
  document: HtmlDocument;
  /** Absolute, fragment-free HTTP(S) destinations discovered in <a href>. */
  discoveredUrls: readonly string[];
}

export interface HTMLProcessPageResultMessage {
  type: "process-page-result";
  requestId: string;
  page: HTMLProcessedPage;
}

export interface HTMLErrorMessage {
  type: "error";
  requestId?: string;
  message: string;
}

export type HTMLWorkerMessage =
  | HTMLStatusMessage
  | HTMLReadyMessage
  | HTMLProcessPageResultMessage
  | HTMLErrorMessage;
