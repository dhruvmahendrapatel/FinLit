/*
 * End-to-end smoke test over the exported web build (dist/). Runs the real UI:
 *   demo family → kid claims & submits a chore → parent approves → kid finishes a lesson
 *   → parent buys Premium → kid-mode time limit blocks the kid screen.
 * Usage: npx expo export --platform web && node e2e/smoke.cjs
 */
const { chromium } = require("playwright");
const http = require("http");
const path = require("path");
const fs = require("fs");

const DIST = path.resolve(__dirname, "..", "dist");
const OUT = path.resolve(__dirname, "output");
const PORT = Number(process.env.PORT || 4177);
const BASE = `http://localhost:${PORT}`;
const MIME = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json", ".ttf": "font/ttf", ".svg": "image/svg+xml", ".map": "application/json" };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split("?")[0]);
      const candidates = [url, `${url}.html`, path.join(url, "index.html"), "/index.html"].map((c) => path.join(DIST, c));
      const file = candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
      if (!file) return void res.writeHead(404).end();
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(PORT, () => resolve(server));
  });
}

const failures = [];
async function step(name, fn) {
  try {
    await fn();
    console.log(`✔ ${name}`);
  } catch (err) {
    failures.push(name);
    console.log(`✘ ${name}: ${String(err.message || err).split("\n")[0]}`);
  }
}

(async () => {
  if (!fs.existsSync(path.join(DIST, "index.html"))) {
    console.error("dist/ not found. Run: npx expo export --platform web");
    process.exit(2);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const server = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  const shot = (name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });
  const unlockParent = () =>
    page.evaluate(() => {
      const raw = localStorage.getItem("chillar.session.v1");
      const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
      parsed.state = { ...parsed.state, parentUnlockedUntil: Date.now() + 60 * 60 * 1000 };
      localStorage.setItem("chillar.session.v1", JSON.stringify(parsed));
    });

  await step("welcome → demo family → profile picker", async () => {
    await page.goto(`${BASE}/welcome`, { waitUntil: "networkidle" });
    await page.getByText("Try the demo family").click();
    await page.waitForURL(/\/who/);
    await page.getByText("Aarav").waitFor();
  });

  await step("kid home greets Aarav with jars and streak", async () => {
    await page.getByLabel("Enter as Aarav").click();
    await page.waitForURL(/\/kid$/);
    await page.getByText("Hi Aarav!").waitFor();
    await page.getByText("My jars").waitFor();
    await page.getByText("day streak").first().waitFor();
    await shot("01-kid-home");
  });

  await step("kid claims a chore and submits it with a note", async () => {
    await page.goto(`${BASE}/kid/chores`, { waitUntil: "networkidle" });
    await page.getByText("I'll do it!").first().click();
    await page.getByText("It's yours!").waitFor();
    await page.getByText("Mark done ✅").first().click();
    await page.waitForURL(/\/kid\/chore\//);
    await page.getByText("Show your work").waitFor();
    await page.getByText("All clean ✨").click();
    await page.getByText("Send for approval").click();
    await page.getByText("Sent for approval").waitFor();
    await page.goto(`${BASE}/kid/chores`, { waitUntil: "networkidle" });
    await page.getByText("Waiting · 2").waitFor();
    await shot("02-kid-chores-waiting");
  });

  await step("kid completes a lesson and earns XP", async () => {
    await page.goto(`${BASE}/kid/lesson/l_bank_of_mum_dad`, { waitUntil: "networkidle" });
    await page.getByText("Money that grows while you sleep").waitFor();
    await page.getByText("Next", { exact: true }).click();
    await page.getByText("Next", { exact: true }).click();
    await page.getByText("Quiz time!").click();
    for (let q = 0; q < 2; q++) {
      await page.getByText("Question", { exact: false }).first().waitFor();
      await page.getByText(/^[A-D]$/).first().locator("..").click();
      const next = page.getByText(q === 1 ? "Finish" : "Next question");
      await next.click();
    }
    await page.getByText(/Lesson complete!|Nice try!/).waitFor();
    await page.getByText("XP earned").waitFor();
    await shot("03-lesson-complete");
  });

  await step("parent sees approvals and pays the chore", async () => {
    await unlockParent();
    await page.goto(`${BASE}/parent`, { waitUntil: "networkidle" });
    await page.getByText("Needs your thumbs-up").waitFor();
    await page.getByText("2 waiting").waitFor();
    await page.getByText(/^Approve · ₹/).first().click();
    await page.getByText(/^Paid ₹/).waitFor();
    await shot("04-parent-approved");
  });

  await step("parent upgrades to Family Premium", async () => {
    await page.goto(`${BASE}/parent/premium`, { waitUntil: "networkidle" });
    await page.getByText("Start 7-day free trial").click();
    await page.getByText("Welcome to Family Premium!").waitFor({ timeout: 10000 });
    await page.goto(`${BASE}/parent/family`, { waitUntil: "networkidle" });
    await page.getByText("Family Premium · Yearly").waitFor();
    await shot("05-premium-active");
  });

  await step("premium removes the parent ad slot and unlocks premium lessons", async () => {
    await page.goto(`${BASE}/parent`, { waitUntil: "networkidle" });
    const ads = await page.getByTestId("ad-slot-parent_home").count();
    if (ads !== 0) throw new Error("ad slot still rendered on Premium");
    await page.goto(`${BASE}/kid/learn`, { waitUntil: "networkidle" });
    const premiumNote = await page.getByText("Lessons with a gold lock").count();
    if (premiumNote !== 0) throw new Error("premium lock notice still shown");
  });

  await step("kid-mode daily limit shows the time-up screen", async () => {
    await page.evaluate(() => {
      const raw = localStorage.getItem("chillar.session.v1");
      const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      parsed.state = { ...parsed.state, usage: { date: today, seconds: 99999 }, extensionUntil: null };
      localStorage.setItem("chillar.session.v1", JSON.stringify(parsed));
    });
    await page.goto(`${BASE}/kid`, { waitUntil: "networkidle" });
    await page.getByTestId("time-up").waitFor();
    await page.getByText("That’s all for today!").waitFor();
    await shot("06-time-up");
  });

  await browser.close();
  server.close();
  if (pageErrors.length) {
    console.log("--- page errors ---");
    for (const e of [...new Set(pageErrors)]) console.log(e);
  }
  if (failures.length || pageErrors.length) {
    console.log(`\n${failures.length} step(s) failed, ${pageErrors.length} page error(s)`);
    process.exit(1);
  }
  console.log("\nAll smoke steps passed");
})();
