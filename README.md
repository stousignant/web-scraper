# Web Scraper

Web Scraper is a command-line interface (CLI) tool for analyzing websites for SEO purposes. This project demonstrates the implementation of a concurrent web crawler using TypeScript and Node.js, capable of traversing web pages, extracting key information, and generating structured reports.

## Tech Stack

-   **Language**: TypeScript
-   **Runtime**: Node.js
-   **Testing**: Vitest
-   **Tooling**: npm
-   **Key Libraries**: `jsdom` (HTML parsing), `p-limit` (concurrency control)

## Features

-   **Concurrent Crawling**: Efficiently traverses multiple pages simultaneously with a configurable concurrency limit to respect server load.
-   **Data Extraction**: Automatically extracts key SEO metrics from each visited page:
    -   **Links**: Collects all outgoing links to build a map of the site structure.
    -   **Images**: Scrapes all image URLs.
    -   **Content**: Captures the main heading (`<h1>`) and the first paragraph for content analysis.
-   **Domain Containment**: Strictly follows links within the same domain as the starting URL, preventing the crawler from wandering off to external sites.
-   **CSV Reporting**: Generates a detailed `report.csv` file containing the scraped data for easy analysis in spreadsheet software.
-   **Configurable**: Simple CLI arguments to control the starting URL, maximum concurrency, and maximum pages to crawl.

## Achievements & Key Learnings

Building this Web Scraper provided valuable experience in:
-   **Concurrency Patterns**: Implementing `p-limit` to manage concurrent asynchronous operations, ensuring efficient crawling without overwhelming the target server or the local machine.
-   **Recursion & Graph Traversal**: Designing algorithms to traverse the web graph (pages and links), handling cycles (visited pages), and managing the depth/breadth of the crawl.
-   **DOM Manipulation**: Utilizing `jsdom` to parse raw HTML strings server-side and interact with the DOM API to query elements and attributes.
-   **Data Normalization**: Developing robust URL normalization logic to handle relative paths, trailing slashes, and different URL formats to avoid duplicate work.
-   **CLI Development**: Creating a user-friendly command-line interface that accepts and validates arguments.

## Getting Started

### Prerequisites

-   **Node.js** (v20+ recommended)
-   **npm**

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/web-scraper.git
    cd web-scraper
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Usage

To start the crawler, use the `npm start` command followed by the required arguments:

```bash
npm start -- <baseURL> <maxConcurrency> <maxPages>
```

-   `baseURL`: The starting URL for the crawler (e.g., `https://example.com`).
-   `maxConcurrency`: The maximum number of concurrent requests (e.g., `5`).
-   `maxPages`: The maximum number of pages to crawl (e.g., `100`).

**Example:**

```bash
npm start -- https://wagslane.dev 3 10
```

This command will:
1.  Start crawling at `https://wagslane.dev`.
2.  Use a maximum of 3 concurrent requests.
3.  Crawl up to 10 unique pages.
4.  Generate a `report.csv` file in the current directory.

### Running Tests

To run the test suite:

```bash
npm test
```

## Output

The tool generates a `report.csv` file with the following columns:
-   `page_url`: The normalized URL of the visited page.
-   `h1`: The text content of the first `<h1>` tag found.
-   `first_paragraph`: The text content of the first `<p>` tag found (prioritizing those inside `<main>`).
-   `outgoing_link_urls`: A semicolon-separated list of all links found on the page.
-   `image_urls`: A semicolon-separated list of all image sources found on the page.

---
*This project was built as part of the backend engineering curriculum at [Boot.dev](https://www.boot.dev/).*
