const fs = require("fs");
const path = require("path");

const fontPath = path.join(__dirname, "../src/fonts/Cairo-Regular.ttf");
const outputPath = path.join(__dirname, "../src/fonts/cairo-vfs.js");

const font = fs.readFileSync(fontPath);
const base64 = font.toString("base64");

const content = `export const cairoVfs = {
  "Cairo.ttf": "${base64}"
};`;


fs.writeFileSync(outputPath, content);

console.log("✅ Cairo font converted successfully");
