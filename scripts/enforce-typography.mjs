import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import postcss from "postcss";

const stylesheetUrl = new URL("../app/globals.css", import.meta.url);
const shouldWrite = process.argv.includes("--write");

const actionOrTitlePatterns = [
  "button",
  ".location-pill",
  ".message-input > span",
  ".bottom-nav",
  ".text-button",
  ".photo-upload-button",
  ".remove-photo",
  ".location-refresh",
  ".family-action-grid strong",
  ".one-click-checkin strong",
  ".sample-button strong",
  ".role-selector button strong",
  ".quiz-options button",
  ".location-grid strong",
  ".danger-note strong",
  ".check-copy strong",
  ".reward-ticket strong",
  ".unlock-card strong",
  ".next-zone-card strong",
  ".profile-card strong",
  ".skill-row strong",
  ".recommend-card strong",
  ".checkin-detail-card strong",
  ".family-status-card strong",
  ".quiz-feedback strong",
  ".ai-route-heading strong",
  ".route-metrics strong",
  ".nearby-shelters article strong",
  ".family-notifications article strong",
  ".family-person strong",
  ".character-item strong",
  ".photo-puzzle-piece strong",
  ".role-selector legend",
  ".spark-status strong",
];

const prominentBodyPatterns = [
  ".onboarding-copy p",
  ".mission-hero > p",
  ".reward-screen > p",
  ".checkin-success p",
  ".photo-reward-intro p",
];

const supportingPatterns = [
  " p",
  "small",
  "time",
  ".message-input > span",
  ".form-error",
  ".reward-row",
  ".spark-status strong",
  ".mission-progress",
  ".report-stats span",
  ".skill-row",
  ".role-selector legend",
  ".route-metrics span",
  ".reward-gallery-row article span",
  ".parsed-alert div span",
  ".source-note",
  ".map-disclaimer",
  ".report-disclaimer",
  ".profile-card span",
  ".onboarding-brand > span",
  ".world-place strong",
];

const typeRoles = {
  action: {
    minimum: 14,
    size: "var(--type-label-large-size)",
    line: "var(--type-label-large-line)",
  },
  supporting: {
    minimum: 12,
    size: "var(--type-body-small-size)",
    line: "var(--type-body-small-line)",
  },
  micro: {
    minimum: 11,
    size: "var(--type-label-small-size)",
    line: "var(--type-label-small-line)",
  },
};

function roleFor(selector) {
  if (prominentBodyPatterns.some((pattern) => selector.includes(pattern))) {
    return typeRoles.action;
  }
  if (supportingPatterns.some((pattern) => selector.includes(pattern))) {
    return typeRoles.supporting;
  }
  if (actionOrTitlePatterns.some((pattern) => selector.includes(pattern))) {
    return typeRoles.action;
  }
  return typeRoles.micro;
}

function numericSize(value) {
  const tokenSizes = new Map([
    ["var(--type-label-large-size)", 14],
    ["var(--type-body-small-size)", 12],
    ["var(--type-label-small-size)", 11],
  ]);
  if (tokenSizes.has(value)) return tokenSizes.get(value);
  const match = value.match(/^(\d+(?:\.\d+)?)px$/);
  return match ? Number(match[1]) : null;
}

const source = await readFile(stylesheetUrl, "utf8");
const root = postcss.parse(source, { from: stylesheetUrl.pathname });
const violations = [];
let changes = 0;

root.walkRules((rule) => {
  const role = roleFor(rule.selector);
  const sizeDeclaration = rule.nodes.find(
    (node) => node.type === "decl" && node.prop === "font-size",
  );
  if (!sizeDeclaration) return;

  const size = numericSize(sizeDeclaration.value);
  if (size === null) return;
  const shouldNormalizeToken =
    shouldWrite && size === role.minimum && sizeDeclaration.value !== role.size;
  if (size >= role.minimum && !shouldNormalizeToken) return;

  if (size < role.minimum) {
    violations.push({
      selector: rule.selector.replace(/\s+/g, " "),
      before: sizeDeclaration.value,
      after: role.size,
    });
  }

  if (!shouldWrite) return;

  sizeDeclaration.value = role.size;
  const hasLineHeight = rule.nodes.some(
    (node) => node.type === "decl" && node.prop === "line-height",
  );
  if (!hasLineHeight) {
    sizeDeclaration.cloneAfter({ prop: "line-height", value: role.line });
  }
  changes += 1;
});

if (shouldWrite) {
  await writeFile(stylesheetUrl, root.toString(), "utf8");
  console.log(`Updated ${changes} typography declarations.`);
} else if (violations.length > 0) {
  for (const violation of violations) {
    console.error(
      `${violation.selector}: ${violation.before} must be ${violation.after} or larger`,
    );
  }
  process.exitCode = 1;
} else {
  console.log("Typography minimums passed.");
}
