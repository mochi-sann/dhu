import {
  chromium,
  LaunchOptions,
  BrowserContext,
  Page,
  Browser,
} from "playwright-chromium";
import {
  LOGIN_ID,
  LOGIN_PASSWORD,
  LOGIN_SUBMIT_BUTTON,
  URL_TOP,
} from "./selectors";
import { getUserInfo, removeUserInfo } from "./userInfo";
import { waitForNavigation } from "./utils";
export type LoginResult = {
  page: Page;
  browser: Browser;
};

export async function login(option?: LaunchOptions) {
  const { id, password } = await getUserInfo();
  const browser = await chromium.launch(option);
  // @ts-ignore
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  await page.goto(URL_TOP);

  await page.type(LOGIN_ID, id);
  await page.type(LOGIN_PASSWORD, password);
  await waitForNavigation(page, () => page.click(LOGIN_SUBMIT_BUTTON));
  const err = await page.evaluate(() => {
    const e = document.querySelector(".ui-messages-error-detail");
    const textContentOf = (e?: Element | null) => e?.textContent?.trim() ?? "";
    return e === null ? e : textContentOf(e);
  });

  if (err) {
    console.error(err);
    await removeUserInfo();
    process.exit();
  }
  return { page, browser };
}

export async function exposeGlobalHelper(ctx: BrowserContext) {}

export async function withLogin<T>(
  fn: (ctx: LoginResult) => Promise<T>,
  option?: LaunchOptions
) {
  const loginCtx = await login(option);
  const result = await fn(loginCtx);
  await loginCtx.browser.close();
  return result;
}

export async function withPage<T>(
  fn: (page: Page) => Promise<T>,
  option?: LaunchOptions
) {
  return await withLogin(async ({ page }) => await fn(page), option);
}

export async function withBrowser<T>(
  fn: (browser: Browser) => T,
  option?: LaunchOptions
) {
  return await withLogin(async ({ browser }) => fn(browser), option);
}