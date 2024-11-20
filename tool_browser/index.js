const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
// puppeteer.use(StealthPlugin());

const path = require("path");
const fs = require("fs");
const {
  clearAllData,
  checkIframeAndGetQueryId,
  setDelay,
  updateRequestID,
  playTool,
  handleFrame,
  handleCanvasClick,
  clickButton,
  handleButtons,
  openPageAndLogin,
} = require("./helper");

(async () => {
  try {
    const data = fs.readFileSync("../setup.json", "utf8");
    const toolID = fs.readFileSync("../toolID.json", "utf-8");
    const coverData = JSON.parse(data);
    const dataSets = coverData?.dataSets;
    const selectIDs = coverData?.selectIDs;
    const parseToolID = JSON.parse(toolID, "utf-8");

    let siteTool = selectIDs?.length > 0 ? selectIDs : Object.keys(parseToolID);

    await clearAllData(siteTool, parseToolID);
    console.log(`dataSets= ${dataSets}, selectIDs=${selectIDs}`);

    const bypassTele = path.join(__dirname, "../extension/telewebtoadrv2");
    const insertCodeToWeb = path.join(__dirname, "../extension/violentmonkey");

    for (const dataSet of dataSets) {
      const userDataDir = path.resolve(__dirname, `../data/${dataSet}`);
      const browser = await puppeteer.launch({
        headless: false,
        userDataDir: userDataDir,
        defaultViewport: null,
        args: [
          "--window-size=300,700",
          `--disable-extensions-except=${bypassTele},${insertCodeToWeb}`,
          `--load-extension=${bypassTele},${insertCodeToWeb}`,
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--ignore-certificate-errors",
          "--disable-infobars",
          "--disable-session-crashed-bubble",
          "--disable-features=InfiniteSessionRestore",
          "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
          "--disable-notifications",
          "--disable-popup-blocking",
          "--disable-translate",
        ],
      });

      openALLTool(browser, siteTool, parseToolID);
     //goAnyTool(browser);
      //goNotPixel(browser);
    }
  } catch (err) {
    console.error("Error in main function:", err);
  }
})();

async function openALLTool(browser, siteTool, parseToolID) {
  try {
    for (const site of siteTool) {
      const nameTool = parseToolID[site];
      console.log("nameTool", nameTool);

      const page = await openPageAndLogin(browser, site);
      await playTool(page);
      await updateRequestID(nameTool, page);
      await page.close();
    }
    await browser.close();
  } catch (err) {
    console.error("Error in openALLTool:", err);
    return undefined;
  }
}

async function goAnyTool(browser) {
  try {
    const page = await browser.newPage();
    await page.goto(`https://web.telegram.org/a/#6865543862`, {
      waitUntil: "networkidle2",
    });

    await page.evaluate(() => {
      const closeButtons = document.querySelectorAll('[aria-label="Close"]');
      closeButtons.forEach((button) => button.click());
    });
    await setDelay(4000);
    await playTool(page);
  } catch (err) {
    console.error("Error in goAnyTool:", err);
    return undefined;
  }
}

async function goNotPixel(browser) {
  try {
    const page = await browser.newPage();
    await page.goto(`https://web.telegram.org/a/#7297255616`, {
      waitUntil: "networkidle2",
    });
    await setDelay(4000);
    await playTool(page);

    const newFrame = await handleFrame(page);
    const frameUrl = newFrame.url();
    if (frameUrl) {
      const requestID = await checkIframeAndGetQueryId(page);
      if (requestID && requestID.src) {
        await page.goto(requestID.src, { waitUntil: "networkidle2" });
        await setDelay(4000);
      } else {
        console.log("Không tìm thấy requestID hoặc src.");
      }
    } else {
      console.log("Không tìm thấy chuỗi user% trong URL của iframe.");
    }

    await page.waitForSelector("#canvasHolder");
    const canvasHandle = await page.$("#canvasHolder");

    const targetButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return (
        buttons.find((btn) => btn.textContent.trim() === "Let’s Gooooooo!") ||
        null
      );
    });

    await clickButton(page, targetButton);
    if (!targetButton) {
      // Tìm và click vào button có class "_button_wekpw_2" và img src chứa đoạn string cụ thể
      const buttonClicked = await page.evaluate(() => {
        const buttons = Array.from(
          document.querySelectorAll("button._button_wekpw_2")
        );
        const specialButton = buttons.find((button) => {
          const img = button.querySelector("img._image_wekpw_19");
          return (
            img &&
            img.src.includes(
              "https://static.notpx.app/templates/7200016718.png"
            )
          );
        });
        if (specialButton) {
          specialButton.click();
          return true;
        }
        return false;
      });

      if (buttonClicked) {
        console.log("Đã click vào button có class");
      } else {
        console.log("Không tìm thấy button có class");
      }

      // Cập nhật phạm vi tọa độ tại đây
      const xRange = { min: 50, max: 150 };
      const yRange = { min: 50, max: 150 };
      const targetColor = "rgb(255, 150, 0)"; // Màu bạn muốn kiểm tra
      await handleCanvasClick(page, canvasHandle, xRange, yRange, targetColor);
    }

    await handleButtons(page, ["Paint", "paint"]);
    await setDelay(20000);
  } catch (err) {
    console.error("Error in goNotPixel:", err);
    return undefined;
  }
}
