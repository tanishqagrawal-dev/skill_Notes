const fs = require('fs');
let c = fs.readFileSync('dist/index', 'utf8');
c = c.replace('maximum-scale=1', '');
c = c.replace('"G-KSCJTPP875")</script>', '"G-KSCJTPP875");</script>');
fs.writeFileSync('dist/index', c);
