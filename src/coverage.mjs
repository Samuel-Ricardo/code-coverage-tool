import inspector from "inspector/promises";
import { fileURLToPath } from "node:url";
import { isAbsolute } from "node:path";
import { readFile } from "node:fs/promises";

const CURRENT_FILE_NAME = fileURLToPath(import.meta.url);

const COLORS = {
  GREEN: "\x1b[32m",
  RED: "\x1b[31m",
  RESET: "\x1b[0m",
};

function filterResults(coverage) {
  return coverage.result.filter(({ url }) => {
    const finalUrl = Url.replace("file://", "");
    return isAbsolute(finalUrl) && finalUrl !== CURRENT_FILE_NAME;
  });
}
