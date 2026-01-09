import { JSDOM } from "jsdom";


export function normalizeUrl(url: string): string {
    url = url.replace(/\/$/, '').toLowerCase();
    const urlObject = new URL(url);
    let fullPath = `${urlObject.hostname}${urlObject.pathname}`;
    if (fullPath.slice(-1) === "/") {
        fullPath = fullPath.slice(0, -1);
    }
    return fullPath;
}

export function getH1FromHTML(html: string): string {
    try {
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        const h1Element = doc.querySelector("h1");
        return h1Element?.textContent ?? "";
    } catch {
        return "";
    }
}

export function getFirstParagraphFromHTML(html: string): string {
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

export function getURLsFromHTML(html: string, baseURL: string): string[] {
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

export function getImagesFromHTML(html: string, baseURL: string): string[] {
    const imgUrls: string[] = [];
    try {
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        const imgElements = doc.querySelectorAll("img[src]");

        imgElements.forEach(img => {
            const src = img.getAttribute("src");
            if (!src) return;

            try {
                const absoluteUrl = new URL(src, baseURL).toString();
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

export type ExtractedPageData = {
    url: string;
    h1: string;
    first_paragraph: string;
    outgoing_links: string[];
    image_urls: string[];
}


export function extractPageData(html: string, pageURL: string): ExtractedPageData {
    return {
        url: normalizeUrl(pageURL),
        h1: getH1FromHTML(html),
        first_paragraph: getFirstParagraphFromHTML(html),
        outgoing_links: getURLsFromHTML(html, pageURL),
        image_urls: getImagesFromHTML(html, pageURL),
    };
}

export async function getHTML(url: string) {
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
