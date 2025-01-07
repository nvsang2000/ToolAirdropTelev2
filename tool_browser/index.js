const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
//puppeteer.use(StealthPlugin());
const path = require("path");
const fs = require("fs");
const {
  clearAllData,
  setDelay,
  updateRequestID,
  playTool,
  openPageAndLogin,
} = require("./helper");

(async () => {
  try {
    const data = fs.readFileSync("../setup.json", "utf8");
    const toolID = fs.readFileSync("../toolID.json", "utf-8");
    const coverData = JSON.parse(data);
    const dataSets = coverData?.dataSets;
    const selectIDs = coverData?.folderArray;
    const parseToolID = JSON.parse(toolID, "utf-8");
    console.log(`dataSets: `, dataSets, selectIDs);
    await clearAllData(selectIDs);

    const bypassTele = path.join(__dirname, "../extension/telewebtoadrv2");
    const insertCodeToWeb = path.join(__dirname, "../extension/violentmonkey");
    //const metamask = path.join(__dirname, "../extension/metamask");
    //const vpn = path.join(__dirname, "../extension/touch_vpn");
    const useExtension = `${bypassTele},${insertCodeToWeb}`;

    for (const dataSet of dataSets) {
      const userDataDir = path.resolve(__dirname, `../../data_browser/${dataSet}`);
      const browser = await puppeteer.launch({
        headless: false,
        userDataDir: userDataDir,
        defaultViewport: null,
        args: [
          "--window-size=300,700",
          `--disable-extensions-except=${useExtension}`,
          `--load-extension=${useExtension}`,
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--ignore-certificate-errors",
          "--disable-infobars",
          "--disable-session-crashed-bubble",
          "--disable-features=InfiniteSessionRestore",
          "--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
          "--disable-notifications",
          "--disable-popup-blocking",
          "--disable-translate",
        ],
      });

      //openALLTool(browser, selectIDs, parseToolID);
      goOneTool(browser, parseToolID);
      //autoChat(browser, parseToolID)
      //openTestnet(browser)
    }
  } catch (err) {
    console.error("Error in main function:", err);
  }
})();

//https://faucet.testnet.humanity.org/
//https://testnet.humanity.org
async function openTestnet(browser) {
  try {
    const page = await browser.newPage();
    await page.goto(`https://genesis.chainbase.com/`, {
      waitUntil: "networkidle2",
    });
  } catch (error) {
    console.error("Error in openTestnet:", error);
  }
}

async function openALLTool(browser, selectIDs, parseToolID) {
  try {
    for (const site of selectIDs) {
      const { name, id } = parseToolID[site];
      console.log("Site: ", site);
      if (id === "TESTNET") {
        console.log("Site TESTNET bỏ qua");
        continue;
      }
      const page = await openPageAndLogin(browser, id);
      await playTool(page);
      await updateRequestID(name, page);
      await page.close();
    }
    await browser.close();
  } catch (err) {
    console.error("Error in openALLTool:", err);
    await browser.close();
  }
}

async function goOneTool(browser, parseToolID) {
  try {
    //blums seed yescoin midas paws pineye uxuywallet w3bflix pinai moonbix
    const sites = [
      // "blums",
      // "seed",
      // "yescoin",
      // "midas",
      "hotwallet",
    ];
   
    for (const site of sites) {
      const { name, id } = parseToolID[site];
      console.log("Site: ", site, parseToolID[site]);
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
      });
      await page.goto(`https://web.telegram.org/a/#${id}`, {
        waitUntil: "networkidle2",
      });

      await page.evaluate(() => {
        const closeButtons = document.querySelectorAll('[aria-label="Close"]');
        closeButtons.forEach((button) => button.click());
      });
      await setDelay(4000);
      playTool(page);
    }
  } catch (err) {
    console.error("Error in goAnyTool:", err);
    return undefined;
  }
}

async function autoChat(browser, parseToolID) {
  try {
    const page = await browser.newPage();
    await page.goto(`https://web.telegram.org/a/#-1001400086031`, {
      waitUntil: "networkidle2",
    });

    const filePath = path.join(__dirname, "mess.txt");
    const rawContent = await fs.promises.readFile(filePath, "utf8");
    console.log("Content:", rawContent);
    let count = 0;

    while (true) {
      await setDelay(4000);

      await page.evaluate((text) => {
        const inputDiv = document.querySelector(
          ".input-scroller-content .form-control"
        );
        if (inputDiv) {
          inputDiv.focus();
          inputDiv.textContent = text;
          const event = new Event("input", { bubbles: true });
          inputDiv.dispatchEvent(event);
        }
      }, rawContent);

      await setDelay(2000);
      await page.keyboard.press("Enter"); // Nhấn Enter
      count++;
      console.log(`Clicked send: ${count}`);
      await setDelay(300000);
    }
  } catch (error) {
    console.error("Error in autoChat:", error);
  }
}
