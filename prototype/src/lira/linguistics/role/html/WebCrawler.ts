import type { Document as HtmlDocument } from "../../data/html/document/document";
import { HTMLProcessor } from "./HTML_Processor";

/** One page successfully read by WebCrawler and handed to HTMLProcessor. */
export interface CrawledPage {
  /** Absolute URL after URL resolution and normalisation. */
  url: string;

  /** Crawl depth from the seed URL. The seed page is depth 0. */
  depth: number;

  /** Source HTML returned by HTMLProcessor.readPage(). */
  html: string;

  /** LIRA HTML5-aligned representation returned by HTMLProcessor.parsePage(). */
  document: HtmlDocument;
}

/** Configuration for one crawl operation. */
export interface WebCrawlerOptions {
  /** Maximum number of pages to read. Defaults to 100. */
  maxPages?: number;

  /** Maximum link depth from the seed page. Defaults to 2. */
  maxDepth?: number;

  /**
   * Restrict crawling to the seed URL's origin by default.
   * Set false only when cross-origin crawling is explicitly required.
   */
  sameOriginOnly?: boolean;

  /** Optional delay between page requests, in milliseconds. Defaults to 0. */
  requestDelayMs?: number;

  /** Request options passed to HTMLProcessor.readPage(). */
  requestInit?: RequestInit;

  /**
   * Optional caller-supplied URL acceptance rule. It runs after URL
   * normalisation and the same-origin rule and before a URL is queued.
   */
  shouldVisit?: (url: URL) => boolean;
}

interface CrawlQueueEntry {
  url: URL;
  depth: number;
}

/**
 * WebCrawler discovers web pages and supplies each page to HTMLProcessor.
 *
 * Responsibility is deliberately split:
 *
 *   WebCrawler
 *     -> discovers and schedules URLs
 *     -> asks HTMLProcessor to read the page
 *     -> discovers links from the returned HTML
 *     -> asks HTMLProcessor to parse the page into LIRA
 *
 *   HTMLProcessor
 *     -> owns HTML acquisition for one URL
 *     -> owns HTML5 -> LIRA parsing
 *     -> owns LIRA -> HTML writing
 *
 * WebCrawler therefore knows nothing about Sentence, Clause, Phrase, Word,
 * PartOfSpeech or WordForm. Text encountered inside an HTML page enters that
 * linguistic hierarchy through HTMLProcessor and its element processors.
 *
 * The crawler is breadth-first: pages nearer the seed URL are processed before
 * deeper pages. URLs are normalised and de-duplicated before they are queued.
 */
export class WebCrawler {
  constructor(private readonly htmlProcessor: HTMLProcessor = new HTMLProcessor()) {}

  /**
   * Crawls from `seedUrl` and returns each successfully processed page in crawl
   * order. Every returned page has already been passed through HTMLProcessor.
   *
   * A page that cannot be read or parsed is skipped rather than terminating the
   * complete crawl. Use `crawlPages()` when pages should be consumed one at a
   * time instead of accumulated in memory.
   */
  async crawl(seedUrl: string | URL, options: WebCrawlerOptions = {}): Promise<readonly CrawledPage[]> {
    const pages: CrawledPage[] = [];
    for await (const page of this.crawlPages(seedUrl, options)) pages.push(page);
    return pages;
  }

  /**
   * Async-generator form of crawl(). Each page is yielded immediately after it
   * has been read and parsed by HTMLProcessor, allowing a caller to ingest or
   * persist pages without retaining the complete crawl in memory.
   */
  async *crawlPages(seedUrl: string | URL, options: WebCrawlerOptions = {}): AsyncGenerator<CrawledPage> {
    const seed = normaliseUrl(new URL(seedUrl));
    const maxPages = positiveInteger(options.maxPages, 100, "maxPages");
    const maxDepth = nonNegativeInteger(options.maxDepth, 2, "maxDepth");
    const sameOriginOnly = options.sameOriginOnly ?? true;
    const requestDelayMs = nonNegativeInteger(options.requestDelayMs, 0, "requestDelayMs");

    const queue: CrawlQueueEntry[] = [{ url: seed, depth: 0 }];
    const queued = new Set<string>([seed.href]);
    const visited = new Set<string>();
    let processed = 0;

    while (queue.length > 0 && processed < maxPages) {
      const entry = queue.shift()!;
      if (visited.has(entry.url.href)) continue;
      visited.add(entry.url.href);

      if (requestDelayMs > 0 && processed > 0) await delay(requestDelayMs);

      let html: string;
      let document: HtmlDocument;
      try {
        html = await this.htmlProcessor.readPage(entry.url, options.requestInit);
        document = this.htmlProcessor.parsePage(html);
      } catch {
        // One malformed, inaccessible or unsupported page must not prevent the
        // crawler from continuing with other URLs already discovered.
        continue;
      }

      processed += 1;
      yield { url: entry.url.href, depth: entry.depth, html, document };

      if (entry.depth >= maxDepth) continue;

      for (const discovered of discoverPageUrls(html, entry.url)) {
        const candidate = normaliseUrl(discovered);
        if (!isHttpUrl(candidate)) continue;
        if (sameOriginOnly && candidate.origin !== seed.origin) continue;
        if (options.shouldVisit !== undefined && !options.shouldVisit(candidate)) continue;
        if (visited.has(candidate.href) || queued.has(candidate.href)) continue;

        queued.add(candidate.href);
        queue.push({ url: candidate, depth: entry.depth + 1 });
      }
    }
  }
}

/**
 * Reads crawlable <a href> destinations from one HTML page. Fragment-only
 * differences are collapsed by normaliseUrl(), while relative URLs are resolved
 * against the page that contained them.
 */
export function discoverPageUrls(html: string, baseUrl: string | URL): readonly URL[] {
  if (typeof DOMParser === "undefined") {
    throw new Error("WebCrawler.discoverPageUrls requires a DOMParser-capable runtime.");
  }

  const source = new DOMParser().parseFromString(html, "text/html");
  const urls: URL[] = [];

  for (const anchor of Array.from(source.querySelectorAll("a[href]"))) {
    const href = anchor.getAttribute("href")?.trim();
    if (!href) continue;

    try {
      urls.push(new URL(href, baseUrl));
    } catch {
      // Invalid href values are source-data errors; ignore only that link.
    }
  }

  return urls;
}

/** Removes URL fragments because they identify locations within one page. */
function normaliseUrl(url: URL): URL {
  const normalised = new URL(url.href);
  normalised.hash = "";
  return normalised;
}

/** Only HTTP(S) resources are web pages for this crawler. */
function isHttpUrl(url: URL): boolean {
  return url.protocol === "http:" || url.protocol === "https:";
}

function positiveInteger(value: number | undefined, fallback: number, name: string): number {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return resolved;
}

function nonNegativeInteger(value: number | undefined, fallback: number, name: string): number {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }
  return resolved;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
