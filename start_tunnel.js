const localtunnel = require('localtunnel');
const fs = require('fs');
(async () => {
  const tunnel = await localtunnel({ port: 3000 });
  fs.writeFileSync('lt_url.txt', tunnel.url);
  console.log(`TUNNEL_URL=${tunnel.url}`);
  tunnel.on('close', () => {
    // tunnels are closed
  });
})();
