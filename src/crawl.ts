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