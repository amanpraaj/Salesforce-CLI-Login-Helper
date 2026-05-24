const MENU_ID = "connect-salesforce-org";
const PENDING_KEY = "pendingConnection";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Generate Salesforce CLI command",
    contexts: ["page"],
    documentUrlPatterns: [
      "https://*.cloudforce.com/*",
      "https://*.cloudforce.mil/*",
      "https://*.crmforce.mil/*",
      "https://*.lightning.force.com/*",
      "https://*.lightning.force.mil/*",
      "https://*.salesforce-setup.com/*",
      "https://*.salesforce.com/*",
      "https://*.salesforce.mil/*",
      "https://*.sfcrmapps.cn/*",
      "https://*.sfcrmproducts.cn/*",
      "https://*.vf.force.com/*",
      "https://*.vf.force.mil/*",
      "https://*.visual.force.com/*",
      "https://*.visual.force.mil/*",
      "https://*.visualforce.com/*",
      "https://*.visualforce.mil/*"
    ]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.url) {
    return;
  }

  try {
    await chrome.storage.session.remove(PENDING_KEY);

    const target = new URL(tab.url);
    const normalizedHost = normalizeSalesforceHostname(target.hostname);
    const sid = await getSidCookie(target);

    if (!sid) {
      throw new Error(
        "No Salesforce session cookie was found. Make sure you are logged into the org in this tab."
      );
    }

    const requestPayload = {
      instanceUrl: `${target.protocol}//${normalizedHost}`,
      hostname: target.hostname,
      sourceUrl: tab.url,
      sid
    };

    await chrome.storage.session.set({
      [PENDING_KEY]: {
        requestPayload,
        suggestedAlias: buildSuggestedAlias(target.hostname)
      }
    });

    await chrome.scripting.executeScript({
      target: {
        tabId: tab.id
      },
      files: ["src/overlay.js"]
    });

    await chrome.tabs.sendMessage(tab.id, {
      type: "sf:openOverlay",
      payload: {
        requestPayload,
        suggestedAlias: buildSuggestedAlias(target.hostname)
      }
    });
  } catch (error) {
    await showStatus("ERR", error.message || "Unknown error");
  }
});

function buildSuggestedAlias(hostname) {
  const short = buildShortOrgAlias(hostname);
  return short || "sf-org";
}

function buildShortOrgAlias(hostname) {
  const clean = hostname
    .replace(/\.lightning\.force\.com$/i, "")
    .replace(/\.my\.salesforce\.com$/i, "");

  const parts = clean
    .split(/[^a-zA-Z0-9]+/)
    .map(part => part.trim().toLowerCase())
    .filter(Boolean)
    .filter(part => !["lightning", "force", "salesforce", "com", "my"].includes(part));

  const unique = [];
  for (const part of parts) {
    if (!unique.includes(part)) {
      unique.push(part);
    }
  }

  return unique.slice(0, 3).join("-").slice(0, 36);
}

async function getSidCookie(target) {
  const orgId = await getOrgIdCookie(target);
  const cookieCandidates = [
    `${target.protocol}//${normalizeSalesforceHostname(target.hostname)}`,
    `${target.protocol}//${target.hostname}`,
    `${target.protocol}//${target.hostname.replace(/^my\./, "")}`
  ];

  for (const url of cookieCandidates) {
    const cookie = await chrome.cookies.get({
      url,
      name: "sid"
    });

    if (cookie?.value) {
      return normalizeSalesforceSid(cookie.value, orgId);
    }
  }

  return null;
}

async function getOrgIdCookie(target) {
  const cookieNames = ["oid", "orgId", "organizationId"];
  const cookieCandidates = [
    `${target.protocol}//${normalizeSalesforceHostname(target.hostname)}`,
    `${target.protocol}//${target.hostname}`,
    `${target.protocol}//${target.hostname.replace(/^my\./, "")}`
  ];

  for (const url of cookieCandidates) {
    for (const name of cookieNames) {
      const cookie = await chrome.cookies.get({
        url,
        name
      });

      if (looksLikeOrgId(cookie?.value)) {
        return cookie.value;
      }
    }
  }

  return null;
}

function normalizeSalesforceSid(sid, orgId) {
  const value = String(sid || "").trim();
  if (!value) {
    return null;
  }

  if (value.startsWith("00D")) {
    return value;
  }

  if (orgId && value.startsWith("!")) {
    return `${orgId}${value}`;
  }

  return value;
}

function looksLikeOrgId(value) {
  return /^00D[A-Za-z0-9]{12,15}$/.test(String(value || ""));
}

function normalizeSalesforceHostname(hostname) {
  if (hostname.endsWith(".lightning.force.com")) {
    return hostname.replace(/\.lightning\.force\.com$/, ".my.salesforce.com");
  }

  if (hostname.endsWith(".my.salesforce-setup.com")) {
    return hostname.replace(/\.my\.salesforce-setup\.com$/, ".my.salesforce.com");
  }

  if (hostname.endsWith(".salesforce-setup.com")) {
    return hostname.replace(/\.salesforce-setup\.com$/, ".salesforce.com");
  }

  return hostname;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "sf:getPendingConnection") {
    chrome.storage.session.get(PENDING_KEY).then(store => {
      sendResponse(store[PENDING_KEY] || null);
    });
    return true;
  }

  if (message?.type === "sf:clearPendingConnection") {
    chrome.storage.session.remove(PENDING_KEY).then(() => {
      sendResponse({
        ok: true
      });
    });
    return true;
  }

  if (message?.type === "sf:copiedCommand") {
    showStatus("OK", "Salesforce CLI command copied to clipboard.").then(() => {
      sendResponse({
        ok: true
      });
    });
    return true;
  }

  if (message?.type === "sf:copyFailed") {
    showStatus("ERR", message.error || "Could not copy command.").then(() => {
      sendResponse({
        ok: true
      });
    });
    return true;
  }
});

async function showStatus(text, title) {
  await chrome.action.setBadgeBackgroundColor({
    color: text === "OK" ? "#0f766e" : "#b91c1c"
  });
  await chrome.action.setBadgeText({
    text
  });
  await chrome.action.setTitle({
    title
  });

  setTimeout(() => {
    chrome.action.setBadgeText({
      text: ""
    });
    chrome.action.setTitle({
      title: "Salesforce CLI Login Helper"
    });
  }, 5000);
}
