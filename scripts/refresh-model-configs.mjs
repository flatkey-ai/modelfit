import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectModelConfig, normalizeModelConfig } from "./lib/model-config.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(join(root, "data", "model-manifest.json"), "utf8"));
const dataPath = join(root, "data", "model-configs.json");
const current = JSON.parse(await readFile(dataPath, "utf8"));
const previous = new Map(current.models.map((entry) => [entry.slug, entry]));
const models = [];
const failures = [];

for (const entry of manifest) {
  try {
    models.push(await collectModelConfig(entry));
  } catch (error) {
    failures.push(`${entry.modelId}: ${error.message}`);
    const lastKnown = previous.get(entry.slug);
    if (lastKnown) {
      models.push({ ...lastKnown, status: "last-known-good", lastCheckError: error.message });
      continue;
    }
    models.push({
      ...normalizeModelConfig(entry, {}, current.generatedAt, `https://huggingface.co/${entry.modelId}/blob/main/config.json`),
      status: "manifest-fallback",
      lastCheckError: error.message,
    });
  }
}

if (models.filter((entry) => entry.status === "verified").length < 6) {
  throw new Error(`Only ${models.filter((entry) => entry.status === "verified").length} model configs verified; refusing to replace the dataset`);
}

const output = { schemaVersion: 1, generatedAt: new Date().toISOString(), models };
const tempPath = `${dataPath}.tmp`;
await writeFile(tempPath, `${JSON.stringify(output, null, 2)}\n`);
await rename(tempPath, dataPath);
console.log(`Verified ${models.filter((entry) => entry.status === "verified").length}/${models.length} model configs`);
if (failures.length) console.warn(`Retained fallbacks for ${failures.length}:\n- ${failures.join("\n- ")}`);
