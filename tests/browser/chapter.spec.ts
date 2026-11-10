import { test, expect, type Page } from "@playwright/test";
import words from "../../src/content/words.json" with { type: "json" };
const storageKey = "flock-and-key:game:v2";
async function quiet(page: Page) {
  await page.goto("/");
  await expect(page.getByText("החווה מוכנה", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "מוזיקה פועלת", exact: true }).click();
}
async function start(page: Page, mode?: string) {
  if (mode)
    await page
      .getByRole("button")
      .filter({ has: page.getByText(mode, { exact: true }) })
      .click();
  else
    await page
      .getByRole("button", { name: "יוצאים לחקירה ←", exact: true })
      .click();
  await page
    .getByRole("button", { name: "מכירים את המשימה ←", exact: true })
    .click();
  await page
    .getByRole("button", { name: "מוכנים, מתחילים ←", exact: true })
    .click();
}
async function expectedWord(page: Page) {
  return page.evaluate((key) => {
    const p = JSON.parse(localStorage.getItem(key)!);
    const s = p.sessions.find((s: { id: string }) => s.id === p.currentId);
    return s.tasks[s.stage][s.index].expected as string;
  }, storageKey);
}
async function submit(page: Page, word: string) {
  await page.getByRole("textbox").fill(word);
  await page.getByRole("textbox").press("Enter");
}

test("Hebrew correction, physical keys, exact position and prizes survive refresh", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await quiet(page);
  await start(page);
  expect(await page.locator("canvas").count()).toBe(1);
  await expect(
    page.getByRole("img", {
      name: "איור יד שמאל ויד ימין, עם חמש אצבעות בכל יד, במבט מלמעלה",
    }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("guided.png"),
    fullPage: true,
  });
  await page
    .getByRole("textbox")
    .dispatchEvent("keydown", { key: "ד", code: "KeyS" });
  await submit(page, "דק");
  await expect(page.getByRole("status")).toContainText("אפשר לתקן");
  await page.getByRole("textbox").press("Backspace");
  await page.keyboard.insertText("ג");
  await page.getByRole("textbox").press("Enter");
  await expect(page.getByRole("status")).toContainText("כל הכבוד");
  await expect(page.getByTestId("balance")).toContainText("10");
  await page.getByRole("button", { name: "המשך עכשיו ←", exact: true }).click();
  await page.getByRole("textbox").fill("ג");
  await page.reload();
  await page.getByRole("button", { name: "ממשיכים מאיפה שעצרנו" }).click();
  await expect(page.getByRole("textbox")).toHaveValue("ג");
  await expect(
    page
      .getByRole("region", { name: "אבא מציג את המילה" })
      .getByTestId("target-word"),
  ).toHaveText("גל");
  await expect(page.getByRole("textbox")).toHaveAccessibleName(
    "כתבו על הארגז את המילה שאבא מבקש",
  );
  await expect(page.getByText("הדוגמה לשלט החדש", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.getByRole("button", { name: "להורים", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "התקדמות וטעויות" }),
  ).toBeVisible();
  await expect(page.locator("tbody").last()).toContainText("דק");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("flock-and-key:game:v2")!).sessions[0]
          .attempts[0].physicalCodes,
    ),
  ).toContain("KeyS");
  expect(errors).toEqual([]);
});

test("spelling hides the answer, plays local audio and retains exposure classification on reload", async ({
  page,
}) => {
  const errors: string[] = [];
  const remote: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:5173") &&
      !r.url().startsWith("ws://127.0.0.1:5173")
    )
      remote.push(r.url());
  });
  await quiet(page);
  const clipResponse = page.waitForResponse(
    (response) => response.url().includes("/audio/words/") && response.ok(),
  );
  await start(page, "הדואר המבולבל");
  await clipResponse;
  const word = await expectedWord(page);
  await expect(page.getByTestId("revealed-word")).toHaveCount(0);
  await expect(page.getByTestId("target-word")).toHaveCount(0);
  const duration = await page.evaluate(
    (path) =>
      new Promise<number>((resolve, reject) => {
        const clip = new Audio(path);
        clip.onloadedmetadata = () => resolve(clip.duration);
        clip.onerror = () => reject(Error("audio decode failed"));
      }),
    words.find((w) => w.text === word)!.audio,
  );
  expect(duration).toBeGreaterThan(2);
  await page.getByRole("button", { name: "רמז ראשון", exact: true }).click();
  await expect(page.getByText("האות הראשונה:", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "הצגת המילה", exact: true }).click();
  await expect(page.getByTestId("revealed-word")).toHaveText(word);
  await page.reload();
  await page.getByRole("button", { name: "ממשיכים מאיפה שעצרנו" }).click();
  await expect(page.getByTestId("revealed-word")).toHaveText(word);
  // The child can submit after the clip ends; disable speech to avoid depending on audio duration.
  await page.getByRole("button", { name: "הקראה פועלת", exact: true }).click();
  await submit(page, word);
  await expect(page.getByRole("status")).toContainText("בעזרת המילה הכתובה");
  const a = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("flock-and-key:game:v2")!)
      .sessions.at(-1)
      .attempts.at(-1),
  );
  expect(a.aid).toBe("copy");
  expect(a.points).toBe(10);
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
});

test("composition is not validated until committed and paste never earns an independent spelling result", async ({
  page,
}) => {
  await quiet(page);
  await page.getByRole("button", { name: "הקראה פועלת", exact: true }).click();
  await start(page, "הדואר המבולבל");
  const word = await expectedWord(page);
  const input = page.getByRole("textbox");
  await input.dispatchEvent("compositionstart");
  await input.fill(word);
  await input.press("Enter");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("flock-and-key:game:v2")!).sessions.at(
          -1,
        ).attempts.length,
    ),
  ).toBe(0);
  await input.dispatchEvent("compositionend", { data: word });
  await input.dispatchEvent("paste");
  await input.press("Enter");
  await expect(page.getByRole("status")).toContainText("בעזרת המילה הכתובה");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("flock-and-key:game:v2")!)
          .sessions.at(-1)
          .attempts.at(-1).pasted,
    ),
  ).toBe(true);
});

test("complete all four modes, skip difficulty, decorate the world and export real history", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await quiet(page);
  await page.getByRole("button", { name: "הקראה פועלת", exact: true }).click();
  await start(page);
  for (let stage = 0; stage < 4; stage++) {
    if (stage > 0) {
      await page
        .getByRole("button", { name: "מכירים את המשימה ←", exact: true })
        .click();
      await page
        .getByRole("button", { name: "מוכנים, מתחילים ←", exact: true })
        .click();
    }
    const length = stage === 2 ? 10 : 8;
    for (let index = 0; index < length; index++) {
      if (stage === 2 && index === 1)
        await page
          .getByRole("button", {
            name: "קשה כרגע? ממשיכים בסיפור",
            exact: true,
          })
          .click();
      else await submit(page, await expectedWord(page));
      await expect(page.getByRole("textbox")).toBeDisabled();
      await page
        .getByRole("button", {
          name: stage === 2 && index === 1 ? "למשימה הבאה ←" : "המשך עכשיו ←",
          exact: true,
        })
        .click();
    }
    await page
      .getByRole("button", {
        name: stage === 3 ? "לסיום ←" : "ממשיכים בעקבות הרמז ←",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "הכבשים התאמנו למופע פעמונים!" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "משנים את החווה ←", exact: true })
    .click();
  const hat = page.locator("article").filter({ hasText: "כובע בלשי לפיצי" });
  await hat.getByRole("button", { name: "לפתוח", exact: true }).click();
  await expect(hat.getByRole("button")).toHaveText("להוריד");
  await page.reload();
  await page
    .getByRole("button", { name: "משנים את החווה", exact: true })
    .click();
  await expect(hat.getByRole("button")).toHaveText("להוריד");
  await page.getByRole("button", { name: "להורים", exact: true }).click();
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "ייצוא JSON מלא", exact: true })
    .click();
  const file = await downloaded;
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const exported = JSON.parse(Buffer.concat(chunks).toString());
  expect(exported.sessions[0].status).toBe("completed");
  expect(exported.sessions[0].attempts).toHaveLength(34);
  expect(exported.owned).toContain("hat");
  expect(
    exported.sessions[0].attempts.some((a: { skipped: boolean }) => a.skipped),
  ).toBe(true);
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("recall after a reveal in this session is kept separate from independent spelling", async ({
  page,
}) => {
  await quiet(page);
  await page.getByRole("button", { name: "הקראה פועלת", exact: true }).click();
  await start(page, "הדואר המבולבל");
  const first = await expectedWord(page);
  await page
    .getByRole("button", { name: "צריכים להעתיק?", exact: true })
    .click();
  await submit(page, first);
  await page.getByRole("button", { name: "המשך עכשיו ←", exact: true }).click();
  for (let i = 1; i < 8; i++) {
    await page
      .getByRole("button", { name: "קשה כרגע? ממשיכים בסיפור", exact: true })
      .click();
    await page
      .getByRole("button", { name: "למשימה הבאה ←", exact: true })
      .click();
  }
  expect(await expectedWord(page)).toBe(first);
  await submit(page, first);
  await expect(page.getByRole("status")).toContainText("אחרי שראינו אותה קודם");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("flock-and-key:game:v2")!)
          .sessions.at(-1)
          .attempts.at(-1).aid,
    ),
  ).toBe("recall");
});

test("missing audio offers an explicit copying fallback rather than blocking the story", async ({
  page,
}) => {
  await page.route("**/audio/words/*.mp3", (route) => route.abort());
  await quiet(page);
  await start(page, "הדואר המבולבל");
  await expect(page.getByRole("alert")).toContainText("ההקראה לא נטענה");
  await page
    .getByRole("button", { name: "צריכים להעתיק?", exact: true })
    .click();
  await submit(page, await expectedWord(page));
  await expect(page.getByRole("status")).toContainText("בעזרת המילה הכתובה");
  await expect(
    page.getByRole("button", { name: "המשך עכשיו ←", exact: true }),
  ).toBeVisible();
});

test("engagement time is saved separately and stops during a break", async ({
  page,
}) => {
  await quiet(page);
  await start(page);
  await page.bringToFront();
  const engagement = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("flock-and-key:game:v2")!).sessions.at(
          -1,
        ).playMs as number,
    );
  await expect.poll(engagement).toBeGreaterThan(0);
  await page.getByRole("button", { name: "הפסקה", exact: true }).click();
  const paused = await engagement();
  await page.waitForTimeout(1100);
  expect(await engagement()).toBe(paused);
  await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
  await expect.poll(engagement).toBeGreaterThan(paused);
});

test("spelling keyboard help finds keys without revealing or highlighting the answer", async ({
  page,
}) => {
  await quiet(page);
  await page.getByRole("button", { name: "הקראה פועלת", exact: true }).click();
  await start(page, "הדואר המבולבל");
  await page
    .getByRole("button", { name: "פתיחת מקלדת עזר", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "מקלדת עברית לעזרה" }),
  ).toBeVisible();
  await expect(page.locator(".key.target")).toHaveCount(0);
  await expect(page.getByTestId("revealed-word")).toHaveCount(0);
  await submit(page, await expectedWord(page));
  const attempt = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("flock-and-key:game:v2")!)
      .sessions.at(-1)
      .attempts.at(-1),
  );
  expect(attempt.aid).toBe("independent");
  expect(attempt.keyboardHelp).toBe(true);
});

test("the sign-painting introduction explains the goal through separate character turns", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await quiet(page);
  await page.screenshot({
    path: test.info().outputPath("adventure-home.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "יוצאים לחקירה ←", exact: true })
    .click();
  const conversation = page.getByRole("list", { name: "שיחת הדמויות" });
  await expect(conversation.getByRole("listitem")).toHaveCount(3);
  await expect(conversation.getByRole("listitem").nth(0)).toContainText("אבא");
  await expect(conversation.getByRole("listitem").nth(0)).toContainText(
    "כל הכיתובים נמרחו",
  );
  await expect(conversation.getByRole("listitem").nth(1)).toContainText("תום");
  await expect(conversation.getByRole("listitem").nth(2)).toContainText(
    "נצבע מחדש את המילים על הארגזים",
  );
  await expect(
    page.getByRole("heading", { name: "המשימה: כותבים על הארגזים" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "אבא יציג מילה בבועה בצד ימין. כתבו אותה על הארגז בצד שמאל ולחצו Enter.",
      {
        exact: false,
      },
    ),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("sign-dialogue.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "מכירים את המשימה ←", exact: true })
    .click();
  await page
    .getByRole("button", { name: "מוכנים, מתחילים ←", exact: true })
    .click();
  await expect(page.getByRole("textbox")).toBeFocused();
  await submit(page, "דג");
  await expect(page.getByRole("status")).toContainText("כל הכבוד");
  expect(errors).toEqual([]);
});

test("desktop home keeps the start and all four games in the viewport, also when resuming", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1024, height: 600 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByText("החווה מוכנה", { exact: true })).toBeVisible();
    const fits = () =>
      page.evaluate(
        () =>
          document.documentElement.scrollHeight <= innerHeight + 1 &&
          document.documentElement.scrollWidth <= innerWidth + 1,
      );
    await expect.poll(fits).toBe(true);
    for (const name of [
      "צובעים ארגזים",
      "עקבות בחשיכה",
      "הדואר המבולבל",
      "פיצי במרדף",
    ]) {
      const button = page
        .getByRole("button")
        .filter({ has: page.getByText(name, { exact: true }) });
      const box = await button.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    }
    await page.screenshot({
      path: test
        .info()
        .outputPath(`home-${viewport.width}x${viewport.height}.png`),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "יוצאים לחקירה ←", exact: true })
      .or(page.getByRole("button", { name: "פרק חדש", exact: true }))
      .click();
    await page
      .getByRole("button", { name: "שמירה ויציאה", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "ממשיכים מאיפה שעצרנו", exact: true }),
    ).toBeVisible();
    await expect.poll(fits).toBe(true);
  }
});

test("correct answers advance automatically once, while mistakes, pause and navigation do not", async ({
  page,
}) => {
  await quiet(page);
  await page.clock.install();
  await start(page);
  await submit(page, "דק");
  await page.clock.runFor(2500);
  await expect(page.getByRole("textbox")).toHaveValue("דק");
  await expect(page.getByRole("textbox")).toBeEnabled();
  await submit(page, "דג");
  await page.clock.runFor(1500);
  await expect(page.getByRole("textbox")).toBeDisabled();
  await page.getByRole("button", { name: "הפסקה", exact: true }).click();
  await page.clock.runFor(5000);
  await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
  await expect(page.getByTestId("target-word")).toHaveText("דג");
  await page.clock.runFor(2100);
  await expect(page.getByRole("textbox")).toBeEnabled();
  await expect(page.getByRole("textbox")).toBeFocused();
  await expect(page.getByTestId("target-word")).toHaveText("גל");
  await submit(page, "גל");
  await page.getByRole("button", { name: "שמירה ויציאה", exact: true }).click();
  await page.clock.runFor(5000);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("flock-and-key:game:v2")!).sessions.at(
          -1,
        ).index,
    ),
  ).toBe(1);
  await page
    .getByRole("button", { name: "ממשיכים מאיפה שעצרנו", exact: true })
    .click();
  await page.clock.runFor(2100);
  await expect(page.getByTestId("target-word")).toHaveText("יד");
  for (let i = 2; i < 8; i++) {
    await submit(page, await expectedWord(page));
    await page.clock.runFor(2100);
  }
  await expect(
    page.getByRole("heading", { name: "נייר מנצנץ עם ציור של תו מוזיקלי" }),
  ).toBeVisible();
  const attempts = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("flock-and-key:game:v2")!).sessions.at(-1)
        .attempts,
  );
  expect(attempts.filter((a: { correct: boolean }) => a.correct)).toHaveLength(
    8,
  );
  expect(
    new Set(
      attempts
        .filter((a: { correct: boolean }) => a.correct)
        .map((a: { task: number }) => a.task),
    ).size,
  ).toBe(8);
});

test("parent reset requires confirmation, supports cancellation and stays reset after refresh", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await quiet(page);
  await start(page);
  await submit(page, "דג");
  await page.getByRole("button", { name: "המשך עכשיו ←", exact: true }).click();
  await submit(page, "גל");
  await page.getByRole("button", { name: "שמירה ויציאה", exact: true }).click();
  await page
    .getByRole("button", { name: "משנים את החווה", exact: true })
    .click();
  await page
    .locator("article")
    .filter({ hasText: "כובע בלשי לפיצי" })
    .getByRole("button", { name: "לפתוח", exact: true })
    .click();
  await page.getByRole("button", { name: "להורים", exact: true }).click();
  await page.evaluate(() => localStorage.setItem("other-app", "keep"));
  const before = await page.evaluate(() =>
    localStorage.getItem("flock-and-key:game:v2"),
  );
  await page
    .getByRole("button", { name: "איפוס התקדמות", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "לאפס את כל ההתקדמות?" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", {
      name: "ביטול, שומרים את ההתקדמות",
      exact: true,
    }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("flock-and-key:game:v2")),
  ).toBe(before);
  await page
    .getByRole("button", { name: "איפוס התקדמות", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "ביטול, שומרים את ההתקדמות", exact: true })
    .click();
  expect(
    await page.evaluate(() => localStorage.getItem("flock-and-key:game:v2")),
  ).toBe(before);
  await page
    .getByRole("button", { name: "איפוס התקדמות", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "כן, לאפס את ההתקדמות", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("ההתקדמות אופסה");
  const reset = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("flock-and-key:game:v2")!),
  );
  expect(reset.sessions).toEqual([]);
  expect(reset.currentId).toBeNull();
  expect(reset.earned).toBe(0);
  expect(reset.balance).toBe(0);
  expect(reset.owned).toEqual([]);
  expect(reset.equipped).toEqual([]);
  expect(reset.knownCodes).toEqual([]);
  expect(reset.settings.music).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem("other-app"))).toBe(
    "keep",
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "ממשיכים מאיפה שעצרנו", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "להורים", exact: true }).click();
  await expect(
    page.getByText("עוד אין סשנים. הנתונים יופיעו אחרי תחילת משחק.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("a failed parent reset keeps the history available and reports failure", async ({
  page,
}) => {
  await quiet(page);
  await start(page);
  await submit(page, "דג");
  await page.getByRole("button", { name: "להורים", exact: true }).click();
  const before = await page.evaluate(() =>
    localStorage.getItem("flock-and-key:game:v2"),
  );
  await page.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw new Error("storage blocked");
    };
  });
  await page
    .getByRole("button", { name: "איפוס התקדמות", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "לאפס את כל ההתקדמות?" });
  await dialog
    .getByRole("button", { name: "כן, לאפס את ההתקדמות", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("ההתקדמות לא אופסה");
  expect(
    await page.evaluate(() => localStorage.getItem("flock-and-key:game:v2")),
  ).toBe(before);
  await dialog
    .getByRole("button", { name: "ביטול, שומרים את ההתקדמות", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "ייצוא JSON מלא", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "ממשיכים מאיפה שעצרנו", exact: true }),
  ).toBeVisible();
});

test("music is picked at stage entry, stays through tasks and resumes, and respects mute", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const clips: HTMLAudioElement[] = [];
    (window as unknown as { observedMusic: HTMLAudioElement[] }).observedMusic =
      clips;
    window.Audio = new Proxy(window.Audio, {
      construct(target, args) {
        const clip = Reflect.construct(target, args) as HTMLAudioElement;
        if (String(args[0]).endsWith(".wav")) clips.push(clip);
        return clip;
      },
    });
  });
  const music = () =>
    page.evaluate(() => {
      const clip = (
        window as unknown as { observedMusic: HTMLAudioElement[] }
      ).observedMusic.at(-1)!;
      return { path: clip.getAttribute("src"), paused: clip.paused };
    });
  await quiet(page);
  await start(page);
  const chosen = (await music()).path;
  expect(chosen).toMatch(/^\/audio\/.+\.wav$/);
  expect(chosen).not.toBe("/audio/farm-theme.wav");
  expect((await music()).paused).toBe(true);
  await page.getByRole("button", { name: "מוזיקה כבויה", exact: true }).click();
  await expect.poll(async () => (await music()).paused).toBe(false);
  await submit(page, "דג");
  await expect(page.getByTestId("target-word")).toHaveText("גל");
  expect((await music()).path).toBe(chosen);
  await page.getByRole("button", { name: "הפסקה", exact: true }).click();
  await expect.poll(async () => (await music()).paused).toBe(true);
  await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
  await expect.poll(async () => (await music()).paused).toBe(false);
  expect((await music()).path).toBe(chosen);
  await page.getByRole("button", { name: "שמירה ויציאה", exact: true }).click();
  await page
    .getByRole("button", { name: "ממשיכים מאיפה שעצרנו", exact: true })
    .click();
  expect((await music()).path).toBe(chosen);
  await page.getByRole("button", { name: "מוזיקה פועלת", exact: true }).click();
  for (let index = 1; index < 8; index++) {
    await page
      .getByRole("button", { name: "קשה כרגע? ממשיכים בסיפור", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: index === 7 ? "לרמז שמצאנו ←" : "למשימה הבאה ←",
        exact: true,
      })
      .click();
  }
  await page
    .getByRole("button", { name: "ממשיכים בעקבות הרמז ←", exact: true })
    .click();
  await expect.poll(async () => (await music()).path).not.toBe(chosen);
  expect((await music()).paused).toBe(true);
});

test("Pitsi barks in an illustrated dialogue turn before the chase starts", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await quiet(page);
  await page
    .getByRole("button")
    .filter({ has: page.getByText("פיצי במרדף", { exact: true }) })
    .click();
  const introduction = page.getByRole("list", { name: "שיחת הדמויות" });
  await expect(
    introduction.getByRole("img", {
      name: "פיצי כלב הרועים, נובח ומוכן לצאת למרדף",
    }),
  ).toBeVisible();
  await expect(
    introduction.getByRole("listitem").filter({ hasText: "הב! הב!" }),
  ).toContainText("פיצי");
  await page.screenshot({
    path: test.info().outputPath("pitsi-chase-intro.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "מכירים את המשימה ←", exact: true })
    .click();
  await page
    .getByRole("button", { name: "מוכנים, מתחילים ←", exact: true })
    .click();
  await expect(page.getByRole("textbox")).toBeFocused();
  await page.getByRole("textbox").fill(await expectedWord(page));
  await expect(page.getByRole("status")).toContainText("כל הכבוד");
  expect(errors).toEqual([]);
});
