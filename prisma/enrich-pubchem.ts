import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type PubChemResult = {
  cid?: number;
  name?: string;
  synonyms?: string[];
  toxicity_text?: string;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

dotenv.config({ path: path.join(repoRoot, ".env") });
dotenv.config({ path: path.join(repoRoot, ".env.local"), override: true });

const connectionString = process.env.DATABASE_URL;
const pubChemServiceUrl = process.env.PUBCHEM_SERVICE_URL?.trim();

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

if (!pubChemServiceUrl) {
  throw new Error("PUBCHEM_SERVICE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const NOISE_PATTERNS = [
  /^ingredients?$/i,
  /^may contain$/i,
  /^for external use only$/i,
  /^warning/i,
  /^directions/i,
  /^how to use/i,
 /^sku[:\s-]/i,
  /^item[:\s-]/i,
  /^shade[:\s-]/i,
  /^color[:\s-]/i,
  /^net wt/i,
  /^please be aware/i,
  /^made in/i,
  /^distributed by/i,
  /^product description/i,
  /^natural origin of total$/i,
  /^\d+\s?(ml|oz|g|kg|lb)$/i,
];

const OCR_CORRECTIONS: Array<[RegExp, string]> = [
  [/\bdime\s*thicone\b/gi, "dimethicone"],
  [/\balchohol\b/gi, "alcohol"],
  [/\baoua\b/gi, "aqua"],
  [/\bdipropyleneglycol\b/gi, "dipropylene glycol"],
  [/\boryzasativa\b/gi, "oryza sativa"],
  [/\bretynyl\b/gi, "retinyl"],
  [/\balkirt\b/gi, "alkyl"],
  [/\blimethylammonium\b/gi, "dimethylammonium"],
];

function normalizeIngredientName(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(input: string | null | undefined, maxLength: number) {
  if (!input) {
    return null;
  }

  const normalized = input.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

const pubChemCache = new Map<string, PubChemResult | null>();

function cleanIngredientToken(token: string) {
  return token
    .replace(/&amp;/gi, "&")
    .replace(/&lt;\/?br&gt;/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[\+\/-\s*may contain:[^\]]*\]/gi, "")
    .replace(/may contain.*$/i, "")
    .replace(/ingredients?\s*[:\-]?\s*/gi, "")
    .replace(/^[-*•·+\s]+|[-*•·+\s]+$/g, "")
    .replace(/^[,;:.()[\]/\\]+|[,;:.()[\]/\\]+$/g, "")
    .replace(/\b(f\.?\s*i\.?\s*l\.?|ci)\b[^,;]*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function applyOcrCorrections(input: string) {
  return OCR_CORRECTIONS.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    input
  );
}

function isLikelyNoiseToken(token: string) {
  if (!token) {
    return true;
  }

  if (!/[a-zA-Z]/.test(token)) {
    return true;
  }

  if (token.length <= 1) {
    return true;
  }

  if (NOISE_PATTERNS.some((pattern) => pattern.test(token))) {
    return true;
  }

  const lower = token.toLowerCase();

  if (
    lower.includes("up to date list of ingredients") ||
    lower.includes("committed to delivering") ||
    lower.includes("bed head by") ||
    lower.includes("magnetic eyeliner") ||
    lower.includes("eyeshadow palette") ||
    lower.includes("ginseng with vitamins") ||
    lower.includes("making it radiant")
  ) {
    return true;
  }

  return false;
}

function splitIngredientCandidates(input: string) {
  return input
    .split(/\s*\/\s*|\s*;\s*|\s*,\s*|\s+\+\s+|\s+and\s+/i)
    .map((token) => cleanIngredientToken(token))
    .filter(Boolean);
}

function sanitizeIngredientForPubChem(rawName: string) {
  let candidate = cleanIngredientToken(rawName)
    .replace(/^\*+/, "")
    .replace(/\([^)]*$/g, "")
    .replace(/%+/g, " ")
    .replace(/\borganic\b/gi, "")
    .replace(/\bnatural\b/gi, "")
    .replace(/\bextract\*$/i, "extract")
    .replace(/\s+/g, " ")
    .trim();

  candidate = applyOcrCorrections(candidate);

  if (isLikelyNoiseToken(candidate)) {
    return null;
  }

  const splitCandidates = splitIngredientCandidates(candidate);
  const preferred =
    splitCandidates.find((token) => {
      if (isLikelyNoiseToken(token)) {
        return false;
      }

      const normalized = token.toLowerCase();
      return (
        !normalized.includes("water") ||
        splitCandidates.length === 1
      );
    }) ?? splitCandidates[0];

  if (!preferred || isLikelyNoiseToken(preferred)) {
    return null;
  }

  const normalized = normalizeIngredientName(preferred);

  if (
    normalized.length < 3 ||
    normalized.split(" ").length > 8 ||
    /\b(may contain|ingredients|water eau|up to date|package you receive)\b/i.test(preferred)
  ) {
    return null;
  }

  return preferred;
}

async function fetchPubChemEnrichment(rawName: string): Promise<PubChemResult | null> {
  const sanitizedName = sanitizeIngredientForPubChem(rawName);
  if (!sanitizedName) {
    return null;
  }

  const normalizedName = normalizeIngredientName(sanitizedName);
  if (!normalizedName) {
    return null;
  }

  if (pubChemCache.has(normalizedName)) {
    return pubChemCache.get(normalizedName) ?? null;
  }

  try {
    const url = new URL("/search", pubChemServiceUrl);
    url.searchParams.set("q", sanitizedName);
    url.searchParams.set("limit", "1");
    url.searchParams.set("max_synonyms", "15");

    const response = await fetch(url.toString());
    if (!response.ok) {
      pubChemCache.set(normalizedName, null);
      return null;
    }

    const payload = (await response.json()) as { results?: PubChemResult[] };
    const result = payload.results?.[0] ?? null;

    pubChemCache.set(normalizedName, result);
    return result;
  } catch {
    pubChemCache.set(normalizedName, null);
    return null;
  }
}

async function main() {
  const ingredients = await prisma.ingredient.findMany({
    where: {
      source: "PRODUCT_DATASET_IMPORT",
      aliases: {
        none: {},
      },
    },
    take: 5000,
    include: {
      aliases: true,
    },
  });

  console.log(`Enriching up to ${ingredients.length} imported ingredients via PubChem...`);

  let enriched = 0;
  let skipped = 0;

  for (const ingredient of ingredients) {
    const result = await fetchPubChemEnrichment(ingredient.name);

    if (!result) {
      skipped += 1;
      continue;
    }

    const aliases = [...new Set((result.synonyms ?? []).map((alias) => alias.trim()).filter(Boolean))]
      .filter(
        (alias) =>
          normalizeIngredientName(alias) !== normalizeIngredientName(ingredient.name)
      )
      .slice(0, 15);

    const description = truncateText(result.toxicity_text, 1200);

    await prisma.ingredient.update({
      where: { id: ingredient.id },
      data: {
        source: "PRODUCT_DATASET_IMPORT+PUBCHEM",
        description: description ?? ingredient.description,
      },
    });

    for (const alias of aliases) {
      await prisma.ingredientAlias.upsert({
        where: { alias },
        update: {
          ingredientId: ingredient.id,
        },
        create: {
          alias,
          ingredientId: ingredient.id,
        },
      });
    }

    enriched += 1;

    if (enriched % 100 === 0) {
      console.log(`Enriched ${enriched}/${ingredients.length} ingredients...`);
    }
  }

  console.log(`PubChem enrichment complete: ${enriched} enriched, ${skipped} skipped.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("PubChem enrichment failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
