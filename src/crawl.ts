import { JSDOM } from "jsdom";


export function normalizeUrl(url: string): string {
    url = url.replace(/\/$/, '').toLowerCase();
    const urlObject = new URL(url);
    return `${urlObject.hostname}${urlObject.pathname}`;
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
    try {
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        const anchorElements = doc.querySelectorAll("a[href]");
        const urls: string[] = [];

        anchorElements.forEach(anchor => {
            const href = anchor.getAttribute("href");
            if (href) {
                try {
                    const url = new URL(href, baseURL);
                    urls.push(url.href);
                } catch {
                    // Ignore invalid URLs
                }
            }
        });

        return urls;
    } catch {
        return [];
    }
}

export function getImagesFromHTML(html: string, baseURL: string): string[] {
    try {
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        const imgElements = doc.querySelectorAll("img[src]");
        const imgUrls: string[] = [];

        imgElements.forEach(img => {
            const src = img.getAttribute("src");
            if (src) {
                try {
                    const url = new URL(src, baseURL);
                    imgUrls.push(url.href);
                } catch {
                    // Ignore invalid URLs
                }
            }
        });

        return imgUrls;
    } catch {
        return [];
    }
}