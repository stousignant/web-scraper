import { JSDOM } from "jsdom";
import pLimit from 'p-limit';

class ConcurrentCrawler {
    private baseUrl: string;
    private pages: Record<string, ExtractedPageData>;
    private limit: <T>(fn: () => Promise<T>) => Promise<T>;
    private maxPages: number;
    private visited = new Set<string>;
    private shouldStop = false;
    private allTasks = new Set<Promise<void>>();
    private abortController = new AbortController();

    constructor(baseUrl: string, maxConcurrency: number = 5, maxPages: number = 100) {
        this.baseUrl = baseUrl;
        this.pages = {};
        this.limit = pLimit(maxConcurrency);
        this.maxPages = Math.max(1, maxPages);
    }

    public async crawl(): Promise<Record<string, ExtractedPageData>> {
        const rootTask = this.crawlPage(this.baseUrl);
        this.allTasks.add(rootTask);
        try {
            await rootTask;
        } finally {
            this.allTasks.delete(rootTask);
        }
        await Promise.allSettled(Array.from(this.allTasks));
        return this.pages;
    }

    private async crawlPage(currentUrl: string): Promise<void> {
        if (this.shouldStop) {
            return;
        }

        const currentUrlObj = new URL(currentUrl);
        const baseUrlObj = new URL(this.baseUrl);
        const isSameDomain: boolean = currentUrlObj.hostname === baseUrlObj.hostname
        if (!isSameDomain) {
            return;
        }

        let normalizedCurrentUrl: string = normalizeUrl(currentUrl);

        const isNewPage = this.addPageVisit(normalizedCurrentUrl);
        if (!isNewPage) {
            return;
        }

        let validHtml: string | null = null;
        try {
            validHtml = await this.getHtml(currentUrl);
            if (!validHtml) {
                return;
            }
        } catch (err) {
            console.log(`${(err as Error).message}`);
            return;
        }

        if (this.shouldStop) {
            return;
        }

        const data = extractPageData(validHtml, currentUrl);
        this.pages[normalizedCurrentUrl] = data;

        const crawlPromises: Promise<void>[] = [];
        for (const nextUrl of data.outgoing_links) {
            if (this.shouldStop) {
                break;
            }

            const task = this.crawlPage(nextUrl);
            this.allTasks.add(task);
            task.finally(() => this.allTasks.delete(task));
            crawlPromises.push(task);
        }

        await Promise.all(crawlPromises);
    }

    private addPageVisit(normalizedUrl: string): boolean {
        if (this.shouldStop) {
            return false;
        }

        if (this.visited.has(normalizedUrl)) {
            return false;
        }

        if (this.visited.size >= this.maxPages) {
            this.shouldStop = true;
            console.log("Reached maximum number of pages to crawl.");
            this.abortController.abort();
            return false;
        }

        this.visited.add(normalizedUrl);
        return true;
    }

    private async getHtml(url: string): Promise<string | null> {
        const { signal } = this.abortController;
        return await this.limit(async () => {
            let response;
            try {
                response = await fetch(url, {
                    method: 'GET',
                    headers: { 'User-Agent': 'BootCrawler/1.0' },
                    signal,
                });
            }
            catch (err) {
                throw new Error(`Network error fetching ${url}: ${(err as Error).message}`);
            }

            if (response.status >= 400 && response.status < 500) {
                console.log(`Client error fetching ${url}: ${response.status} ${response.statusText}`);
                return null;
            }

            if (!response.ok) {
                console.log(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
                return null;
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("text/html")) {
                return null;
            }

            return response.text();
        });
    }
}

export async function crawlSiteAsync(
    baseUrl: string,
    maxConcurrency: number = 5,
    maxPages: number = 100,
): Promise<Record<string, ExtractedPageData>> {
    const crawler = new ConcurrentCrawler(baseUrl, maxConcurrency, maxPages);
    return await crawler.crawl();
}

export type ExtractedPageData = {
    url: string;
    h1: string;
    first_paragraph: string;
    outgoing_links: string[];
    image_urls: string[];
}

export function extractPageData(html: string, pageUrl: string): ExtractedPageData {
    return {
        url: pageUrl,
        h1: getH1FromHtml(html),
        first_paragraph: getFirstParagraphFromHtml(html),
        outgoing_links: getUrlsFromHtml(html, pageUrl),
        image_urls: getImagesFromHtml(html, pageUrl),
    };
}

export function normalizeUrl(url: string): string {
    url = url.replace(/\/$/, '').toLowerCase();
    const urlObject = new URL(url);
    let fullPath = `${urlObject.hostname}${urlObject.pathname}`;
    if (fullPath.slice(-1) === "/") {
        fullPath = fullPath.slice(0, -1);
    }
    return fullPath;
}

export function getH1FromHtml(html: string): string {
    try {
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        const h1Element = doc.querySelector("h1");
        return (h1Element?.textContent ?? "").trim();
    } catch {
        return "";
    }
}

export function getFirstParagraphFromHtml(html: string): string {
    try {
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        // Find <main> tag for better results
        const mainElement = doc.querySelector("main");
        const pElement = mainElement?.querySelector("p") ?? doc.querySelector("p");
        return (pElement?.textContent ?? "").trim();
    } catch {
        return "";
    }
}

export function getUrlsFromHtml(html: string, baseURL: string): string[] {
    const urls: string[] = [];
    try {
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        const anchorElements = doc.querySelectorAll("a[href]");

        anchorElements.forEach(anchor => {
            const href = anchor.getAttribute("href");
            if (!href) return;

            try {
                const absoluteUrl = new URL(href, baseURL).toString();
                urls.push(absoluteUrl);
            } catch (err) {
                console.error(`invalid href '${href}':`, err);
            }
        });
    } catch (err) {
        console.error("failed to parse HTML:", err);
    }

    return urls;
}

export function getImagesFromHtml(html: string, baseUrl: string): string[] {
    const imgUrls: string[] = [];
    try {
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        const imgElements = doc.querySelectorAll("img[src]");

        imgElements.forEach(img => {
            const src = img.getAttribute("src");
            if (!src) return;

            try {
                const absoluteUrl = new URL(src, baseUrl).toString();
                imgUrls.push(absoluteUrl);
            } catch (err) {
                console.error(`invalid src '${src}':`, err);
            }
        });
    } catch (err) {
        console.error("failed to parse HTML:", err);
    }

    return imgUrls;
}
