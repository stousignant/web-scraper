import { describe, expect, test } from 'vitest';
import { normalizeUrl, getH1FromHTML, getFirstParagraphFromHTML, getURLsFromHTML, getImagesFromHTML, extractPageData } from "./crawl";

describe.each([
    ['HTTP URL with trailing slash', 'HTTP://Example.com/Path/', 'example.com/path'],
    ['HTTPS URL without trailing slash', 'https://Example.com/Path', 'example.com/path'],
    ['URL with mixed case and trailing slash', 'HtTpS://ExAmPlE.CoM/PaTh/', 'example.com/path'],
    ['URL without trailing slash and mixed case', 'HtTpS://ExAmPlE.CoM/PaTh', 'example.com/path'],
])('normalizeUrl - %s', (_name, input, expected) => {
    test(`should normalize "${input}" to "${expected}"`, () => {
        const result = normalizeUrl(input);
        expect(result).toBe(expected);
    });
});

describe.each([
    ['HTML with single H1', '<html><body><h1>Title</h1></body></html>', 'Title'],
    ['HTML with multiple H1s', '<html><body><h1>First Title</h1><h1>Second Title</h1></body></html>', 'First Title'],
    ['HTML without H1', '<html><body><p>No title here</p></body></html>', ""],
    ['HTML with nested H1', '<html><body><div><h1>Nested Title</h1></div></body></html>', 'Nested Title'],
])('getH1FromHTML - %s', (_name, input, expected) => {
    test(`should extract H1 "${expected}" from HTML`, () => {
        const result = getH1FromHTML(input);
        expect(result).toBe(expected);
    });
});

describe.each([
    ['HTML with single paragraph', '<html><body><p>First paragraph.</p></body></html>', 'First paragraph.'],
    ['HTML with multiple paragraphs', '<html><body><p>First paragraph.</p><p>Second paragraph.</p></body></html>', 'First paragraph.'],
    ['HTML without paragraph', '<html><body><h1>No paragraphs here</h1></body></html>', ""],
    ['HTML with nested paragraph', '<html><body><div><p>Nested paragraph.</p></div></body></html>', 'Nested paragraph.'],
    ['HTML with main tag', '<html><body><div><p>Nested paragraph.</p></div><main><p>Main paragraph.</p></main></body></html>', 'Main paragraph.'],
])('getFirstParagraphFromHTML - %s', (_name, input, expected) => {
    test(`should extract first paragraph "${expected}" from HTML`, () => {
        const result = getFirstParagraphFromHTML(input);
        expect(result).toBe(expected);
    });
});

describe.each([
    [
        'HTML with one absolute URL',
        '<html><body><a href="https://example.com/page1">Link 1</a></body></html>',
        'https://example.com',
        ['https://example.com/page1']
    ],
    [
        'HTML with absolute and relative URLs',
        '<html><body><a href="https://example.com/page1">Link 1</a><a href="/page2">Link 2</a></body></html>',
        'https://example.com',
        ['https://example.com/page1', 'https://example.com/page2']
    ],
    [
        'HTML without links',
        '<html><body><h1>No links here</h1></body></html>',
        'https://example.com',
        []
    ],
])('getURLsFromHTML - %s', (_name, input, baseURL, expected) => {
    test(`should extract URLs ${JSON.stringify(expected)} from HTML`, () => {
        const result = getURLsFromHTML(input, baseURL);
        expect(result).toEqual(expected);
    });
});

describe.each([
    [
        'HTML with one image',
        '<html><body><img src="https://example.com/image1.jpg" /></body></html>',
        'https://example.com',
        ['https://example.com/image1.jpg']
    ],
    [
        'HTML with absolute and relative image URLs',
        '<html><body><img src="https://example.com/image1.jpg" /><img src="/image2.jpg" /></body></html>',
        'https://example.com',
        ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
    ],
    [
        'HTML without images',
        '<html><body><h1>No images here</h1></body></html>',
        'https://example.com',
        []
    ],
])('getImagesFromHTML - %s', (_name, input, baseURL, expected) => {
    test(`should extract image URLs ${JSON.stringify(expected)} from HTML`, () => {
        const result = getImagesFromHTML(input, baseURL);
        expect(result).toEqual(expected);
    });
});

test("extract_page_data basic", () => {
    const inputURL = "https://blog.boot.dev";
    const inputBody = `
    <html><body>
      <h1>Test Title</h1>
      <p>This is the first paragraph.</p>
      <a href="/link1">Link 1</a>
      <img src="/image1.jpg" alt="Image 1">
    </body></html>
  `;

    const actual = extractPageData(inputBody, inputURL);
    const expected = {
        url: "blog.boot.dev",
        h1: "Test Title",
        first_paragraph: "This is the first paragraph.",
        outgoing_links: ["https://blog.boot.dev/link1"],
        image_urls: ["https://blog.boot.dev/image1.jpg"],
    };

    expect(actual).toEqual(expected);
});

test("extract_page_data main section priority", () => {
    const inputURL = "https://blog.boot.dev";
    const inputBody = `
    <html><body>
      <nav><p>Navigation paragraph</p></nav>
      <main>
        <h1>Main Title</h1>
        <p>Main paragraph content.</p>
      </main>
    </body></html>
  `;

    const actual = extractPageData(inputBody, inputURL);
    expect(actual.h1).toEqual("Main Title");
    expect(actual.first_paragraph).toEqual("Main paragraph content.");
});

test("extract_page_data missing elements", () => {
    const inputURL = "https://blog.boot.dev";
    const inputBody = `<html><body><div>No h1, p, links, or images</div></body></html>`;

    const actual = extractPageData(inputBody, inputURL);
    const expected = {
        url: "blog.boot.dev",
        h1: "",
        first_paragraph: "",
        outgoing_links: [],
        image_urls: [],
    };

    expect(actual).toEqual(expected);
});
