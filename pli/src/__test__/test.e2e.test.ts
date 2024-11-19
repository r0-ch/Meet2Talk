/**
 * @jest-environment node
 */

import puppeteer, { Page } from "puppeteer";
const delay = (time) => new Promise((res) => setTimeout(res, time));

describe("Username Match Test", () => {
  let browser;
  let page : Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it("should match username with usernames", async () => {
    await page.goto("http://localhost:3000"); // Remplacez par l'URL de votre application
    await delay(1000);
    await page.waitForSelector("#start-to-talk");
    await page.click("#start-to-talk");
    await delay(1000);
    const username = "TestUser";
    await page.waitForSelector("#username");
    await page.type("#username", username);
    await page.select("#language", "fr");
    await page.waitForSelector("#join-room");
    await page.click("#join-room");
    await page.waitForSelector("#usernames");
    const displayedUsername = await page.$eval("#usernames", (el) => el.textContent);
    expect(displayedUsername).toBe(username);
  },16000);
});
