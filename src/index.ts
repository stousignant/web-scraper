import { getHTML } from './crawl';


async function main() {
    if (process.argv.length < 3) {
        console.error("No website URL provided.");
        process.exit(1);
    }

    if (process.argv.length > 3) {
        console.error("Too many arguments provided.");
        process.exit(1);
    }

    const baseUrl = process.argv[2];
    console.log(`Crawler starting at : ${baseUrl}`);

    const html = await getHTML(baseUrl);
    console.log(html);

    process.exit(0);
}

main();