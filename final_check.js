const fs = require('fs');
const vm = require('vm');
const code = fs.readFileSync('js/dashboard.js?v=6.0', 'utf8');
try {
    new vm.Script(code);
    console.log("Syntax OK");
} catch (e) {
    console.error(e);
}
