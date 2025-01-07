const path = require("path");
const fs = require("fs");

const setDelay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function updateRequestID(nameTool, page) {
  try {
    let frames = page.frames();
    if (!frames) {
      await setDelay(20000);
      frames = page.frames();
    }
    const newFrame = frames[0];
    const frameUrl = newFrame.url();
    if (frameUrl) {
      const requestID = await checkIframeAndGetQueryId(page);
      await saveToJSON(nameTool, requestID.query_id);
    } else {
      console.log("Không tìm thấy chuỗi user% trong URL của iframe.");
    }
  } catch (err) {
    console.error("Error in updateRequestID:", err);
    return undefined;
  }
}

async function saveToJSON(nameTool, data) {
  try {
    const filePath = path.join(__dirname, "../update_data.json");
    let jsonData = {};

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      jsonData = JSON.parse(fileContent);
    }

    if (!jsonData[nameTool]) {
      jsonData[nameTool] = { data: [], id: [] };
    }

    if (!jsonData[nameTool].data.includes(data)) {
      jsonData[nameTool].data.push(data);
    }

    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 4), "utf-8");
    console.log(`Đã lưu dữ liệu vào tệp: ${filePath} `);
  } catch (err) {
    console.error("Error in saveToJSON:", err);
    return undefined;
  }
}

async function clearAllData(selectIDs) {
  try {
    for (const item of selectIDs) {
      await clearToolData(item);
    }
  } catch (err) {
    console.error("Error in clearAllData:", err);
    return undefined;
  }
}

async function clearToolData(nameTool) {
  try {
    const filePath = path.join(__dirname, "../update_data.json");
    let jsonData = {};

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      jsonData = JSON.parse(fileContent);
    }

    if (jsonData[nameTool]) {
      jsonData[nameTool] = { data: [], id: [] };
      console.log(`Đã làm trống dữ liệu của tool: ${nameTool}`);
    }

    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 4), "utf-8");
  } catch (err) {
    console.error("Error in clearToolData:", err);
    return undefined;
  }
}

async function checkIframeAndGetQueryId(page) {
  try {
    return await page.evaluate(async () => {
      async function checkIframe(retries = 3) {
        return new Promise((resolve) => {
          const game = document.querySelector("iframe");
          if (game) {
            const src = game?.getAttribute("src");
            console.log("SRC found:", src);
            if (src) {
              const startIndex =
                src.indexOf("#tgWebAppData=") + "#tgWebAppData=".length;
              const endIndex = src.indexOf("&", startIndex);
              if (startIndex !== -1 && endIndex !== -1) {
                let query_id = src.substring(startIndex, endIndex);
                query_id = decodeURIComponent(query_id);
                console.log("Đã lấy được Query ID:", query_id);
                resolve({ query_id, src });
              } else {
                console.log("Query ID not found in src.");
                resolve({ query_id: null, src });
              }
            } else {
              console.log("Không tìm thấy src trong iframe.");
              if (retries > 0) {
                console.log(`Thử lại... (${3 - retries + 1})`);
                setTimeout(() => resolve(checkIframe(retries - 1)), 500);
              } else {
                resolve({ query_id: null, src });
              }
            }
          } else {
            console.log("Iframe not found.");
            if (retries > 0) {
              console.log(`Thử lại... (${3 - retries + 1})`);
              setTimeout(() => resolve(checkIframe(retries - 1)), 500);
            } else {
              resolve({ query_id: null, src });
            }
          }
        });
      }
      return await checkIframe();
    });
  } catch (err) {
    console.error("Error in checkIframeAndGetQueryId:", err);
    return undefined;
  }
}

async function playToolForKeyword(page) {
  try {
    const keywords = ["start","Daily Lucky Draw", "open wallet", "Hi PIN", "open", "go", "play", "mở", "kick", "launch", "game"];
    const buttons = await page.$$("button");
    

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const buttonText = await page.evaluate(
        (el) => el.textContent.trim().toLowerCase(),
        button
      );
      const isMatch = keywords.some((keyword) =>
        buttonText.includes(keyword.toLowerCase())
      );

      if (isMatch) {
        console.log(`Button ${i + 1}: "${buttonText}" chứa từ khóa.`);
        console.log("buttons", button)
        try {
          await Promise.all([button.click(), setDelay(6000)]);

          const modal = await page
            .waitForSelector(".modal-container", { timeout: 8000 })
            .catch(() => undefined);
          if (modal) {
            const buttonConfirm = await page
              .waitForSelector(".modal-container .confirm-dialog-button", {
                timeout: 6000,
              })
              .catch(() => undefined);
            if (buttonConfirm) {
              await buttonConfirm.click();
            }
          }

          await setDelay(4000);
          break;
        } catch (error) {
          console.error(
            `Không thể nhấp vào button ${i + 1}: "${buttonText}". Lỗi:`,
            error
          );
        }
      }
    }
  } catch (err) {
    console.error("Error in playTool:", err);
    return undefined;
  }
}

async function playTool(page) {
  try {
    const buttonSelector = 'button.Button.bot-menu[aria-label="Open bot command keyboard"]';
    let button;
    let attempts = 0;
    while (attempts < 3) {
      attempts++;
      button = await page.$(buttonSelector);
      if (button)  break;
      console.log(`Không tìm thấy button. Đợi 4 giây trước khi thử lại...`);
      await setDelay(4000);
    }
    if (!button) return;

    try {
      await Promise.all([button.click(), setDelay(6000)]);
      const modal = await page
        .waitForSelector(".modal-container", { timeout: 8000 })
        .catch(() => undefined);
      if (modal) {
        const buttonConfirm = await page
          .waitForSelector(".modal-container .confirm-dialog-button", {
            timeout: 6000,
          })
          .catch(() => undefined);
        if (buttonConfirm) {
          console.log("Nhấp vào nút xác nhận trong modal...");
          await buttonConfirm.click();
        }
      }

      await setDelay(4000);
    } catch (error) {
      console.error("Lỗi khi nhấp vào button:", error);
    }
  } catch (err) {
    console.error("Error in playTool:", err);
    return undefined;
  }
}

async function clickButton(page, targetButton) {
  try {
    if (targetButton) {
      await page.evaluate((btn) => btn.click(), targetButton);
      console.log('Đã click vào button "Let’s Gooooooo!"');
    }
  } catch (err) {
    console.error("Error in clickButton:", err);
    return undefined;
  }
}

async function handleFrame(page) {
  try {
    let frames = page.frames();
    if (!frames || frames.length === 0) {
      console.log("Không tìm thấy frame. Đang chờ thêm thời gian...");
      await setDelay(10000);
      frames = page.frames();
    }
    return frames[0];
  } catch (err) {
    console.error("Error in handleFrame:", err);
    return undefined;
  }
}

async function handleCanvasClick(
  page,
  canvasHandle,
  xRange,
  yRange,
  targetColor
) {
  try {
    const box = await canvasHandle.boundingBox();
    if (box) {
      // Tính toán tọa độ ngẫu nhiên trong phạm vi tọa độ được cung cấp
      const randomX = Math.random() * (xRange.max - xRange.min) + xRange.min;
      const randomY = Math.random() * (yRange.max - yRange.min) + yRange.min;
      await page.mouse.click(box.x + randomX, box.y + randomY);
      console.log(
        `Đã click vào tọa độ (${(box.x + randomX).toFixed(2)}, ${(
          box.y + randomY
        ).toFixed(2)}) trong canvas.`
      );

      await setDelay(1000);

      // Kiểm tra mã màu của class _active_color_hqiqj_51
      const isColorMatch = await page.evaluate((targetColor) => {
        const activeElement = document.querySelector("._active_color_hqiqj_51");
        if (activeElement) {
          const bgColor =
            window.getComputedStyle(activeElement).backgroundColor;
          return bgColor === targetColor;
        }
        return false;
      }, targetColor);

      if (isColorMatch) {
        console.log("Mã màu khớp với màu mục tiêu.");
        // Thực hiện click tiếp theo nếu mã màu khớp
        await page.mouse.click(box.x + randomX, box.y + randomY);
        console.log(
          `Đã click lần thứ hai vào tọa độ (${(box.x + randomX).toFixed(2)}, ${(
            box.y + randomY
          ).toFixed(2)}) trong canvas.`
        );
      } else {
        // Click vào một class khác nếu mã màu không khớp
        const otherElement = await page.$("._other_class_to_click");
        if (otherElement) {
          await otherElement.click();
          console.log("Đã click vào class khác vì mã màu không khớp.");
        } else {
          console.log("Không tìm thấy class khác để click.");
        }
      }
    } else {
      console.log("Không thể lấy kích thước của phần tử canvas.");
    }
  } catch (err) {
    console.error("Error in handleCanvasClick:", err);
    return undefined;
  }
}

async function handleButtons(page, keywords) {
  try {
    const buttons = await page.$$("button");
    await setDelay(4000);
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const buttonText = await page.evaluate(
        (el) => el.textContent.trim().toLowerCase(),
        button
      );
      const isMatch = keywords.some((keyword) =>
        buttonText.includes(keyword.toLowerCase())
      );
      if (isMatch) {
        console.log(`Button ${i + 1}: "${buttonText}" chứa từ khóa.`);
        const match = buttonText.match(/\d+/);
        const singleNumber = match ? parseInt(match[0], 10) : 0;
        if (singleNumber > 0) {
          const randomClicks = Math.floor(Math.random() * singleNumber) + 1;
          console.log("Số lần click ngẫu nhiên được chọn:", randomClicks);
          await setDelay(2000);
          for (let j = 0; j < randomClicks; j++) {
            await button.click();
            console.log(`Đã click vào button "${buttonText}" lần ${j + 1}.`);
            await setDelay(2000);
          }
        } else {
          console.log("Không tìm thấy số trong chuỗi.");
        }
        break;
      }
    }
  } catch (err) {
    console.error("Error in handleButtons:", err);
    return undefined;
  }
}

async function openPageAndLogin(browser, site) {
  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
    });

    await page.goto(`https://web.telegram.org/a/#${site}`, {
      waitUntil: "networkidle2",
    });
    await setDelay(4000);

    const element = await page.$("#auth-qr-form");
    if (element) {
      console.log(
        "Bạn chưa đăng nhập cho tài khoản cho browser này! Đợi 30s để đăng nhập."
      );
      await setDelay(30000);
      await page.goto(`https://web.telegram.org/a/#${site}`, {
        waitUntil: "networkidle2",
      });
    }

    return page;
  } catch (err) {
    console.error("Error in openPageAndLogin:", err);
    return undefined;
  }
}

module.exports = {
  updateRequestID,
  saveToJSON,
  clearAllData,
  checkIframeAndGetQueryId,
  playTool,
  setDelay,
  clickButton,
  handleFrame,
  handleCanvasClick,
  openPageAndLogin,
  handleButtons,
};
