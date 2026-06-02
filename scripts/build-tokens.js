const fs = require("fs");
const path = require("path");

const TOKENS_PATH = path.join(__dirname, "../tokens.json");
const OUTPUT_PATH = path.join(__dirname, "../dist/theme.css");

const rawTokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf-8"));

function flattenTokens(obj, prefix = "") {
    let result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith("$")) continue;

        const newKey = prefix ? `${prefix}-${key}` : key;

        if (
            value &&
            typeof value === "object" &&
            (value.$value !== undefined || value.value !== undefined)
        ) {
            result[newKey] =
                value.$value !== undefined ? value.$value : value.value;
        } else if (value && typeof value === "object") {
            Object.assign(result, flattenTokens(value, newKey));
        }
    }

    return result;
}

function formatValue(value) {
    if (
        typeof value === "string" &&
        value.startsWith("{") &&
        value.endsWith("}")
    ) {
        const alias = value
            .slice(1, -1)
            .replace(/\./g, "-")
            .replace(/\s+/g, "")
            .toLowerCase();

        return `var(--${alias})`;
    }

    return value;
}

let cssContent = `/* AUTO-GENERATED DESIGN TOKENS */\n/* Do not edit directly. Update tokens.json instead. */\n\n`;

for (const [themeName, themeData] of Object.entries(rawTokens)) {
    if (themeName.startsWith("$")) continue;

    console.log(`Processing theme: ${themeName}...`);
    const flatTokens = flattenTokens(themeData);

    if (
        themeName.toLowerCase() === "primitives" ||
        themeName.toLowerCase() === "global"
    ) {
        cssContent += `:root {\n`;
    } else {
        cssContent += `[data-theme="${themeName.toLowerCase()}"] {\n`;
    }

    for (const [key, value] of Object.entries(flatTokens)) {
        const cssKey = key.toLowerCase().replace(/\s+/g, "-");
        const cssValue = formatValue(value);
        cssContent += `  --${cssKey}: ${cssValue};\n`;
    }

    cssContent += `}\n\n`;
}

if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
    fs.mkdirSync(path.dirname(OUTPUT_PATH));
}

fs.writeFileSync(OUTPUT_PATH, cssContent);

console.log("theme.css generated successfully.");
