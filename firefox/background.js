const GITHUB_REPO = "fangyuan99/cookie-share";
const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours

// 检查更新函数
async function checkForUpdates() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
    );
    const data = await response.json();

    const currentVersion = chrome.runtime.getManifest().version;
    const latestVersion = data.tag_name.replace("v", "");

    return {
      hasUpdate: latestVersion > currentVersion,
      currentVersion,
      latestVersion,
      releaseUrl: data.html_url,
    };
  } catch (error) {
    console.error("Error checking for updates:", error);
    return {
      hasUpdate: false,
      currentVersion: chrome.runtime.getManifest().version,
      error: error.message,
    };
  }
}

// 自动检查更新（每天一次）
async function autoCheckUpdate() {
  // 获取上次检查时间
  const { lastCheckTime = 0 } = await chrome.storage.local.get("lastCheckTime");
  const now = Date.now();

  // 如果距离上次检查超过24小时，则进行检查
  if (now - lastCheckTime >= ONE_DAY) {
    await checkForUpdates();
    // 更新检查时间
    await chrome.storage.local.set({ lastCheckTime: now });
  }
}

// 导出函数供popup使用
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkUpdate") {
    checkForUpdates().then(sendResponse);
    return true; // 保持消息通道开启
  }
});

// 启动时检查一次
autoCheckUpdate();

// 监听浏览器启动
chrome.runtime.onStartup.addListener(() => {
  autoCheckUpdate();
});
