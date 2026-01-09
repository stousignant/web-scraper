import { JSDOM } from "jsdom";

export async function crawlPage(
    baseUrl: string,
    currentUrl: string = baseUrl,
    pages: Record<string, number> = {},
) {
    const currentUrlObj = new URL(currentUrl);
    const baseUrlObj = new URL(baseUrl);
    const isSameDomain: boolean = currentUrlObj.hostname === baseUrlObj.hostname
    if (!isSameDomain) {
        return pages;
    }

    let normalizedCurrentUrl: string = normalizeUrl(currentUrl);

    if (pages[normalizedCurrentUrl]) {
        pages[normalizedCurrentUrl]++;
        return pages;
    }

    pages[normalizedCurrentUrl] = 1;

    let validHtml = "";
    try {
        const html = await getHtml(currentUrl);
        if (!html) {
            return pages;
        }
        validHtml = html;
    } catch (err) {
        console.log(`${(err as Error).message}`);
        return pages;
    }

    const nextUrls = getURLsFromHtml(validHtml, baseUrl);
    for (const nextUrl of nextUrls) {
        pages = await crawlPage(baseUrl, nextUrl, pages);
    }

    return pages;
}

export async function getHtml(url: string) {
    console.log(`Crawling ${url}`);

    let response;
    try {
        response = await fetch(url, {
            method: 'GET',
            headers: { 'User-Agent': 'BootCrawler/1.0' }
        });
    }
    catch (err) {
        throw new Error(`Network error fetching ${url}: ${(err as Error).message}`);
    }

    if (response.status >= 400 && response.status < 500) {
        console.log(`Client error fetching ${url}: ${response.status} ${response.statusText}`);
        return;
    }

    if (!response.ok) {
        console.log(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        return;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
        console.log(`Non-HTML content at ${url}: ${contentType}`);
        return;
    }

    return response.text();
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
        url: normalizeUrl(pageUrl),
        h1: getH1FromHtml(html),
        first_paragraph: getFirstParagraphFromHtml(html),
        outgoing_links: getURLsFromHtml(html, pageUrl),
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
        return h1Element?.textContent ?? "";
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
        return pElement?.textContent ?? "";
    } catch {
        return "";
    }
}

export function getURLsFromHtml(html: string, baseURL: string): string[] {
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
