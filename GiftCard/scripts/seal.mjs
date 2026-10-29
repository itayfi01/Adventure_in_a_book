import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const GATE_ITERATIONS = 150000;

const SALT_BYTES = 16;
const IV_BYTES = 12;

export function normalizeAnswer(answer) {
    return answer.trim().toLowerCase();
}

function toBase64(bytes) {
    return Buffer.from(bytes).toString("base64");
}

function fromBase64(value) {
    return new Uint8Array(Buffer.from(value, "base64"));
}

async function deriveKey(answer, salt, usages) {
    const material = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(normalizeAnswer(answer)),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: GATE_ITERATIONS,
            hash: "SHA-256"
        },
        material,
        { name: "AES-GCM", length: 256 },
        false,
        usages
    );
}

export async function sealUrl(answer, url) {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const key = await deriveKey(answer, salt, ["encrypt"]);
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        new TextEncoder().encode(url)
    ));
    return {
        iterations: GATE_ITERATIONS,
        salt: toBase64(salt),
        iv: toBase64(iv),
        ciphertext: toBase64(ciphertext)
    };
}

export async function openSeal(answer, sealed) {
    const key = await deriveKey(answer, fromBase64(sealed.salt), ["decrypt"]);
    const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: fromBase64(sealed.iv) },
        key,
        fromBase64(sealed.ciphertext)
    );
    return new TextDecoder().decode(plain);
}

function readArg(flag) {
    const index = process.argv.indexOf(flag);
    const value = index === -1 ? "" : process.argv[index + 1];
    if (!value || value.startsWith("--")) {
        throw new Error(`Missing ${flag}. Usage: node scripts/seal.mjs --question "..." --answer "..." --url "https://..."`);
    }
    return value;
}

function gateSource(question, sealed) {
    return `const GATE = {
    question: ${JSON.stringify(question)},
    iterations: ${sealed.iterations},
    salt: ${JSON.stringify(sealed.salt)},
    iv: ${JSON.stringify(sealed.iv)},
    ciphertext: ${JSON.stringify(sealed.ciphertext)}
};
`;
}

async function main() {
    const question = readArg("--question");
    const answer = readArg("--answer");
    const url = readArg("--url");
    const sealed = await sealUrl(answer, url);
    const opened = await openSeal(answer, sealed);
    if (opened !== url) {
        throw new Error("Seal check failed.");
    }
    const destination = fileURLToPath(new URL("../js/gate.js", import.meta.url));
    await writeFile(destination, gateSource(question, sealed), "utf8");
    console.log(`Sealed ${url} into js/gate.js`);
}

function isDirectRun() {
    const entry = process.argv[1];
    if (!entry) return false;
    return import.meta.url === pathToFileURL(path.resolve(entry)).href;
}

if (isDirectRun()) {
    main().catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
}
