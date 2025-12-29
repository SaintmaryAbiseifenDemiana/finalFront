const fs = require("fs");

// المسار الكامل للخط
const font = fs.readFileSync("C:/Users/DELL/myApp-clean/myApp-client/src/fonts/Cairo-Regular.ttf").toString("base64");

console.log(font);
