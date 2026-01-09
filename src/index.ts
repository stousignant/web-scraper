import { crawlSiteAsync } from './crawl';


async function main() {
    if (process.argv.length < 5) {
        console.log("not enough arguments provided");
        console.log("usage: node dist/index.js <baseURL> <maxConcurrency> <maxPages>");
        process.exit(1);
    }

    if (process.argv.length > 5) {
        console.error("Too many arguments provided.");
        process.exit(1);
    }

    const baseUrl = process.argv[2];
    const maxConcurrency = Number(process.argv[3]);
    const maxPages = Number(process.argv[4]);

    if (!Number.isFinite(maxConcurrency) || maxConcurrency <= 0) {
        console.log("Invalid maxConcurrency");
        process.exit(1);
    }
    if (!Number.isFinite(maxPages) || maxPages <= 0) {
        console.log("Invalid maxPages");
        process.exit(1);
    }

    console.log(`Crawler starting at : ${baseUrl} (concurrency ${maxConcurrency}, maxPages ${maxPages})...`);

    const pages = await crawlSiteAsync(baseUrl, maxConcurrency, maxPages);
    console.log(pages);

    process.exit(0);
}

main();