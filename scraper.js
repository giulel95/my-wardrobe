/**
 * scraper.js
 *
 * Provides a function to scrape a product page from an online shop.
 * Uses the AllOrigins API as a CORS proxy.
 * Extracts OpenGraph metadata: title, image, description, price (if available).
 *
 * Usage: Call window.scrapeProductData(url) which returns a Promise.
 */

window.scrapeProductData = async function(url) {
  // Use AllOrigins API to bypass CORS restrictions.
  const proxyUrl = 'https://api.allorigins.hexocode.repl.co/get?disableCache=true&url=' + encodeURIComponent(url);

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    const html = data.contents;

    // Parse the HTML using DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Extract OpenGraph meta tags
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || "";
    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || "";
    const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || "";
    const ogPrice = doc.querySelector('meta[property="product:price:amount"]')?.getAttribute('content') || "";

    return {
      title: ogTitle,
      image: ogImage,
      description: ogDescription,
      price: ogPrice,
    };
  } catch (error) {
    console.error("Error scraping product data:", error);
    throw error;
  }
};
