import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(
  new URL("../app/page.tsx", import.meta.url),
  "utf8",
);

test("all three check-in entry buttons share the state-updating handler", () => {
  assert.match(
    pageSource,
    /const openCheckin = \(\) => \{\s*setCheckinSent\(true\);\s*navigate\("checkin"\);\s*\};/,
  );

  assert.equal(
    pageSource.match(/\bonClick=\{openCheckin\}/g)?.length,
    3,
    "home, action guide, and family must all use openCheckin",
  );

  assert.doesNotMatch(
    pageSource,
    /onClick=\{\(\) => navigate\("checkin"\)\}/,
    "a check-in entry must not navigate without updating state",
  );
});
