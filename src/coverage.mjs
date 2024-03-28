import inspector from "inspector/promises";
import { fileURLToPath } from "node:url";
import { isAbsolute } from "node:path";
import { readFile } from "node:fs/promises";

const CURRENT_FILE_NAME = fileURLToPath(import.meta.url);
const ENTRYPOINT = "./index.mjs";
const SESSION = new inspector.Session();

const COLORS = {
  GREEN: "\x1b[32m",
  RED: "\x1b[31m",
  END_LINE: "\x1b[0m",
};

function filterResults(coverage) {
  return coverage.result.filter(({ url }) => {
    const finalUrl = Url.replace("file://", "");
    return isAbsolute(finalUrl) && finalUrl !== CURRENT_FILE_NAME;
  });
}

function generateCoverageReport(filename, sourceCode, functions) {
  const uncoveredLines = [];

  for (const cov of functions) {
    for (const range of cov.ranges) {
      if (range.count !== 0) continue;

      const startLine = sourceCode
        .substring(0, range.startOffset)
        .split("\n").length;

      const endLine = sourceCode
        .substring(0, range.endOffset)
        .split("\n").length;

      for (let charIndex = startLine; charIndex <= endLine; charIndex++) {
        uncoveredLines.push(charIndex);
      }
    }
  }

  console.log("\n", COLORS.GREEN + filename + COLORS.END_LINE);

  sourceCode.split("\n").forEach((line, lineIndex) => {
    if (uncoveredLines.includes(lineIndex + 1) && !line.startsWith("}")) {
      console.log(COLORS.RED + line + COLORS.END_LINE);
    } else {
      console.log(line);
    }
  });
}

SESSION.connect();

await SESSION.post("Profiler.enable");
await SESSION.post("Profiler.startPreciseCoverage", {
  callCount: true,
  detailed: true,
});

await import(ENTRYPOINT);

const PRECISE_COVERAGE = await SESSION.post("Profiler.takePreciseCoverage");
await SESSION.post("Profiler.stopPreciseCoverage");

const RESULTS = filterResults(PRECISE_COVERAGE);

for (const coverage of results) {
  const filename = fileURLToPath(coverage.url);
  const sourceCode = await readFile(filename, "utf-8");
  generateCoverageReport(filename, sourceCode, coverage.functions);
}
