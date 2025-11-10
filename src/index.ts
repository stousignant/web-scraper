import { getHTML } from './crawl';


async function main() {
    if (process.argv.length < 3) {
        console.error("Please provide at least one URL as an argument.");
        process.exit(1);
    }

    if (process.argv.length > 3) {
        console.error("Please provide only one URL at a time.");
        process.exit(1);
    }

    const url = process.argv[2];
    console.log(`Crawler starting at : ${url}`);
    await getHTML(url);

    process.exit(0);
}

main();