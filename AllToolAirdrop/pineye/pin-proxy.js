const fs = require("fs");
const path = require("path");
const axios = require("axios");
const readline = require("readline");
const colors = require("colors");
const { HttpsProxyAgent } = require("https-proxy-agent");

class PinEye {
  constructor() {
    this.proxyList = this.loadProxies();
    this.currentProxy = null;
  }

  loadProxies() {
    try {
      return fs
        .readFileSync("proxy.txt", "utf8")
        .replace(/\r/g, "")
        .split("\n")
        .filter(Boolean);
    } catch (error) {
      this.log(`Error loading proxies: ${error.message}`, "error");
      return [];
    }
  }

  async checkProxyIP(proxy) {
    try {
      const proxyAgent = new HttpsProxyAgent(proxy);
      const response = await axios.get("https://api.ipify.org?format=json", {
        httpsAgent: proxyAgent,
        timeout: 10000,
      });
      if (response.status === 200) {
        return response.data.ip;
      } else {
        throw new Error(
          `Không thể kiểm tra IP của proxy. Status code: ${response.status}`
        );
      }
    } catch (error) {
      throw new Error(`Error khi kiểm tra IP của proxy: ${error.message}`);
    }
  }

  headers(token = "") {
    const headers = {
      Accept: "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language":
        "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
      "Content-Type": "application/json",
      Origin: "https://app.pineye.io",
      Referer: "https://app.pineye.io/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  getAxiosConfig(token = "") {
    return {
      headers: this.headers(token),
      timeout: 50000,
      ...(this.currentProxy && {
        httpsAgent: new HttpsProxyAgent(this.currentProxy),
      }),
    };
  }

  async auth(userinfo) {
    const url = "https://api2.pineye.io/api/v2/Login";
    const payload = { userinfo };

    try {
      const response = await axios.post(url, payload, this.getAxiosConfig());
      return response.data;
    } catch (error) {
      this.log(`Error: ${error.message}`, "error");
      return null;
    }
  }

  async getProfile(token) {
    const url = "https://api2.pineye.io/api/v3/Profile/GetBalance";
    try {
      const response = await axios.get(url, this.getAxiosConfig(token));
      return response.data;
    } catch (error) {
      this.log(`Error: ${error.message}`, "error");
      return null;
    }
  }

  async getBoosters(token) {
    const url = "https://api2.pineye.io/api/v2/Booster";
    try {
      const response = await axios.get(url, this.getAxiosConfig(token));
      return response.data;
    } catch (error) {
      this.log(`Lỗi rồi: ${error.message}`, "error");
      return null;
    }
  }

  async buyBooster(token, boosterId) {
    const url = `https://api2.pineye.io/api/v2/Booster/Buy?boosterId=${boosterId}`;
    try {
      const response = await axios.post(url, {}, this.getAxiosConfig(token));
      return response.data;
    } catch (error) {
      this.log(`Không thể nâng cấp ${boosterId}: ${error.message}`, "error");
      return null;
    }
  }

  async manageBoosters(token, balance) {
    const boostersData = await this.getBoosters(token);
    if (!boostersData || !boostersData.data) {
      this.log("Không lấy được dữ liệu boosts!", "error");
      return;
    }

    for (const booster of boostersData.data) {
      while (balance >= booster.cost) {
        const result = await this.buyBooster(token, booster.id);
        if (result && !result.errors) {
          this.log(
            `Nâng cấp ${booster.title} thành công. Balance còn: ${result.data.balance}`,
            "success"
          );
          balance = result.data.balance;
        } else {
          this.log(`Không thể mua ${booster.title}.`, "warning");
          break;
        }
      }
    }
  }

  async tapEnergy(token, energy) {
    const url = `https://api2.pineye.io/api/v1/Tap?count=${energy}`;
    try {
      const response = await axios.get(url, this.getAxiosConfig(token));
      if (response.data && !response.data.errors) {
        this.log(
          `Tap thành công | Balance: ${response.data.data.balance}`,
          "custom"
        );
      }
    } catch (error) {
      this.log(`Không thể tap: ${error.message}`, "error");
    }
  }

  async dailyReward(token) {
    const url = "https://api2.pineye.io/api/v1/DailyReward";
    try {
      const response = await axios.get(url, this.getAxiosConfig(token));
      if (response.data && response.data.data && response.data.data.canClaim) {
        const claimUrl = "https://api2.pineye.io/api/v1/DailyReward/claim";
        const claimResponse = await axios.post(
          claimUrl,
          {},
          this.getAxiosConfig(token)
        );
        if (claimResponse.data && !claimResponse.data.errors) {
          this.log(
            `Điểm danh thành công | Balance: ${claimResponse.data.data.balance}`,
            "success"
          );
        }
      } else {
        this.log("Hôm nay bạn đã điểm danh rồi!", "warning");
      }
    } catch (error) {
      this.log(`Không lấy được thông tin điểm danh: ${error.message}`, "error");
    }
  }

  async checkAndBuyLottery(token) {
    const url = "https://api2.pineye.io/api/v1/Lottery";
    try {
      const response = await axios.get(url, this.getAxiosConfig(token));
      const { ticket } = response.data.data;
      if (!ticket.hasBuyed) {
        const buyTicketUrl = "https://api2.pineye.io/api/v1/Lottery/BuyTicket";
        const buyResponse = await axios.post(
          buyTicketUrl,
          {},
          this.getAxiosConfig(token)
        );
        const { code, balance } = buyResponse.data.data;
        this.log(
          `Mua thành công vé số ${code} | Balance còn: ${balance}`,
          "custom"
        );
      } else {
        this.log(`Bạn đã mua vé số rồi: ${ticket.code}`, "warning");
      }
    } catch (error) {
      this.log(`Không thể mua vé số: ${error.message}`, "error");
    }
  }

  async getSocialTasks(token) {
    const url = "https://api2.pineye.io/api/v1/Social";
    try {
      const response = await axios.get(url, this.getAxiosConfig(token));
      return response.data.data.map((task) => ({
        id: task.id,
        title: task.title,
        score: task.score,
        isClaimed: task.isClaimed,
      }));
    } catch (error) {
      this.log(
        `Không thể lấy danh sách nhiệm vụ xã hội: ${error.message}`,
        "error"
      );
      return [];
    }
  }

  async claimSocialTask(token, socialId) {
    const url = `https://api2.pineye.io/api/v1/SocialFollower/claim?socialId=${socialId}`;
    try {
      const response = await axios.post(url, {}, this.getAxiosConfig(token));
      if (response.data && !response.data.errors) {
        this.log(`Làm nhiệm vụ thành công`, "success");
        return response.data.data;
      } else {
        this.log(
          `Không thể hoàn thành nhiệm vụ, cần làm tay hoặc chưa đủ điều kiện`,
          "error"
        );
        return null;
      }
    } catch (error) {
      this.log(
        `Không thể hoàn thành nhiệm vụ, cần làm tay hoặc chưa đủ điều kiện`,
        "error"
      );
      return null;
    }
  }

  async managePranaGameCards(token, balance) {
    const marketplaceData = await this.getPranaGameMarketplace(token);
    if (!marketplaceData) {
      this.log("Không thể lấy dữ liệu marketplace", "error");
      return;
    }

    let eligibleCards = [];
    for (const category of marketplaceData.data.categories) {
      if (category.cards) {
        const filteredCards = category.cards.filter(
          (card) =>
            !card.hasStartDependency &&
            !card.isCompleted &&
            card.cost <= balance &&
            card.currentLevel < card.maxLevel &&
            card.cooldownTime === 0
        );
        eligibleCards = [...eligibleCards, ...filteredCards];
      }
    }

    eligibleCards.sort((a, b) => b.profit - a.profit);

    for (const card of eligibleCards) {
      if (balance >= card.cost) {
        const nextLevel = card.currentLevel + 1;
        const purchaseResult = await this.purchasePranaGameCard(
          token,
          card.id,
          nextLevel
        );

        if (
          purchaseResult &&
          purchaseResult.data &&
          purchaseResult.data.isSuccess
        ) {
          balance = purchaseResult.data.balance;
          this.log(
            `Nâng cấp thẻ ${card.title} lên level ${nextLevel} thành công | Balance: ${purchaseResult.data.balance} | Profit: ${purchaseResult.data.profit}`,
            "success"
          );
        } else {
          this.log(
            `Không thể mua thẻ ${card.title} level ${nextLevel}`,
            "error"
          );
        }
      }
    }
  }

  async getPranaGameMarketplace(token) {
    const url = "https://api2.pineye.io/api/v1/PranaGame/Marketplace";
    try {
      const response = await axios.get(url, this.getAxiosConfig(token));
      return response.data;
    } catch (error) {
      this.log(`Không thể lấy danh sách thẻ: ${error.message}`, "error");
      return null;
    }
  }

  async purchasePranaGameCard(token, cardId, level) {
    const url = `https://api2.pineye.io/api/v1/PranaGame/Purch?cardId=${cardId}&level=${level}`;
    try {
      const response = await axios.post(url, {}, this.getAxiosConfig(token));
      return response.data;
    } catch (error) {
      this.log(
        `Không thể mua thẻ ID ${cardId} level ${level}: ${error.message}`,
        "error"
      );
      return null;
    }
  }

  log(msg, type = "info") {
    const timestamp = new Date().toLocaleTimeString();
    switch (type) {
      case "success":
        console.log(`[${timestamp}] [*] ${msg}`.green);
        break;
      case "custom":
        console.log(`[${timestamp}] [*] ${msg}`.magenta);
        break;
      case "error":
        console.log(`[${timestamp}] [!] ${msg}`.red);
        break;
      case "warning":
        console.log(`[${timestamp}] [*] ${msg}`.yellow);
        break;
      default:
        console.log(`[${timestamp}] [*] ${msg}`.blue);
    }
  }

  async Countdown(seconds) {
    for (let i = seconds; i >= 0; i--) {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(
        `[${new Date().toLocaleTimeString()}] [*] Chờ ${i} giây để tiếp tục...`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log("");
  }

  extractFirstName(userinfo) {
    try {
      const decodedData = decodeURIComponent(userinfo);
      const userMatch = decodedData.match(/user=({.*?})/);
      if (userMatch && userMatch[1]) {
        const userObject = JSON.parse(userMatch[1]);
        return userObject.first_name;
      } else {
        this.log("Không lấy được firstname.", "warning");
        return "Unknown";
      }
    } catch (error) {
      this.log(`Không lấy được firstname: ${error.message}`, "error");
      return "Unknown";
    }
  }

  askQuestion(query) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) =>
      rl.question(query, (ans) => {
        rl.close();
        resolve(ans);
      })
    );
  }

  async getPractices(token) {
    const url = "https://api2.pineye.io/api/v1/PranaGame/GetAllPractices";
    try {
      const response = await axios.get(url, this.getAxiosConfig(token));
      return response.data.data.practiceList;
    } catch (error) {
      this.log(`Lỗi rồi: ${error.message}`, "error");
      return null;
    }
  }

  async getPracticeDetails(token, practiceId) {
    const url = `https://api2.pineye.io/api/v1/PranaGame/GetPracticeDetails?practiceId=${practiceId}`;
    try {
      const response = await axios.get(url, this.getAxiosConfig(token));
      return response.data;
    } catch (error) {
      this.log(
        `Lỗi không đọc được thông tin luyện tập ${practiceId}: ${error.message}`,
        "error"
      );
      return null;
    }
  }

  async claimPractice(token, practiceId) {
    const url = `https://api2.pineye.io/api/v1/PranaGame/ClaimPractice?practiceId=${practiceId}`;
    try {
      const response = await axios.get(url, this.getAxiosConfig(token));
      return response.data;
    } catch (error) {
      this.log(
        `Không thể yêu cầu luyện tập ${practiceId}: ${error.message}`,
        "error"
      );
      return null;
    }
  }

  async managePractices(token) {
    const practices = await this.getPractices(token);
    if (!practices) return;

    const currentTime = Math.floor(Date.now() / 1000);
    const availablePractices = practices.filter(
      (practice) =>
        practice.nextPracticeTime < currentTime ||
        practice.nextPracticeTime === 0
    );

    for (const practice of availablePractices) {
      this.log(`Bắt đầu luyện tập: ${practice.title}`, "info");

      const details = await this.getPracticeDetails(token, practice.id);
      if (!details) continue;

      this.log(`Chờ ${practice.practiceTime} giây để hoàn thành...`, "info");
      await this.Countdown(practice.practiceTime);

      const claimResult = await this.claimPractice(token, practice.id);
      if (claimResult && claimResult.data) {
        this.log(
          `Luyện tập thành công! Earned ${claimResult.data.profit} | Balance: ${claimResult.data.balance}`,
          "success"
        );
      }
    }

    if (availablePractices.length === 0) {
      this.log("No practices available at this time", "warning");
    }
  }

  async main() {
    const dataFile = path.join(__dirname, "data.txt");

    const coverdata = fs
      .readFileSync(dataFile, "utf8")
      .replace(/\r/g, "")
      .split("\n")
      .filter(Boolean);

    const userData = coverdata.map((line) => line.trim());

    const nangcapturbo = await this.askQuestion(
      "Bạn có muốn nâng cấp boosters không? (y/n): "
    );
    const hoiturbo = nangcapturbo.toLowerCase() === "y";

    const muaPranaCards = await this.askQuestion(
      "Bạn có muốn mua Thẻ Prana không? (y/n): "
    );
    const hoiPranaCards = muaPranaCards.toLowerCase() === "y";

    this.log(`Tool được share tại kênh telegram Dân Cày Airdrop!`, "custom");

    while (true) {
      for (let i = 0; i < userData.length; i++) {
        this.currentProxy = this.proxyList[i] || null;
        const userinfo = userData[i];
        const first_name = this.extractFirstName(userinfo);

        let proxyIP = "Unknown";
        if (this.currentProxy) {
          try {
            proxyIP = await this.checkProxyIP(this.currentProxy);
          } catch (error) {
            this.log(`Proxy check failed: ${error.message}`, "warning");
          }
        }

        console.log(
          `========== Tài khoản ${
            i + 1
          } | ${first_name} | ip: ${proxyIP} ==========`.green
        );

        const apiResponse = await this.auth(userinfo);
        if (apiResponse && apiResponse.data && apiResponse.data.token) {
          const token = apiResponse.data.token;
          const profileResponse = await this.getProfile(token);
          if (profileResponse && profileResponse.data) {
            let { totalBalance, level, earnPerTap } =
              profileResponse.data.profile;
            const { maxEnergy, currentEnergy } = profileResponse.data.energy;

            this.log(`Balance: ${totalBalance}`, "success");
            this.log(`Lv: ${level}`, "success");
            this.log(`Earn Per Tap: ${earnPerTap}`, "success");
            this.log(`Năng lượng: ${currentEnergy} / ${maxEnergy}`, "success");

            if (currentEnergy > 0) {
              await this.tapEnergy(token, currentEnergy);
              const updatedProfile = await this.getProfile(token);
              if (updatedProfile && updatedProfile.data) {
                totalBalance = updatedProfile.data.profile.totalBalance;
              }
            }

            await this.dailyReward(token);

            if (hoiturbo) {
              await this.manageBoosters(token, totalBalance);
              const updatedProfile = await this.getProfile(token);
              if (updatedProfile && updatedProfile.data) {
                totalBalance = updatedProfile.data.profile.totalBalance;
              }
            }

            if (hoiPranaCards) {
              await this.managePranaGameCards(token, totalBalance);
            }
            await this.managePractices(token);
            const socialTasks = await this.getSocialTasks(token);
            const unclaimedTasks = socialTasks.filter(
              (task) => !task.isClaimed
            );
            for (const task of unclaimedTasks) {
              this.log(
                `Nhận thưởng cho nhiệm vụ "${task.title}" (${task.score} điểm)`,
                "info"
              );
              await this.claimSocialTask(token, task.id);
            }
          } else {
            this.log(
              `Không lấy được dữ liệu: ${
                profileResponse ? profileResponse.errors : "No response data"
              }`,
              "error"
            );
          }
        } else {
          this.log(
            `Đăng nhập thất bại: ${
              apiResponse ? apiResponse.errors : "No response data"
            }`,
            "error"
          );
        }
      }
      await this.Countdown(60);
    }
  }
}

if (require.main === module) {
  const pineye = new PinEye();
  pineye.main().catch((err) => {
    console.error(err.toString().red);
    process.exit(1);
  });
}
