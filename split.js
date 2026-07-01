const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// Extract CSS
let styleStart = html.indexOf('<style>');
let styleEnd = html.indexOf('</style>');
let css = html.substring(styleStart + 7, styleEnd).trim();
fs.writeFileSync('style.css', css);
html = html.substring(0, styleStart) + '<link rel="stylesheet" href="style.css">' + html.substring(styleEnd + 8);

// Extract Tailwind config
let twStart = html.indexOf('<script>\n        tailwind.config');
if (twStart === -1) twStart = html.indexOf('<script>\r\n        tailwind.config');
let twEnd = html.indexOf('</script>', twStart);
let twJs = html.substring(twStart + 8, twEnd).trim();
fs.writeFileSync('tailwind.config.js', twJs);
html = html.substring(0, twStart) + '<script src="tailwind.config.js"></script>' + html.substring(twEnd + 9);

// Extract Main Script
let mainScriptStart = html.indexOf('<script>', twEnd);
let mainScriptEnd = html.indexOf('</script>', mainScriptStart + 8);
let mainJs = html.substring(mainScriptStart + 8, mainScriptEnd).trim();
fs.writeFileSync('script.js', mainJs);
html = html.substring(0, mainScriptStart) + '<script src="script.js"></script>' + html.substring(mainScriptEnd + 9);

fs.writeFileSync('index.html', html);
console.log('Split completed successfully.');
