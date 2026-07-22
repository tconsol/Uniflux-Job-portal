const geoip = require('geoip-lite');

// Client IP from the request (strips IPv6-mapped ::ffff: prefix).
function clientIpFrom(req) {
  const ip = req.ip || '';
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

// Region a user belongs to, defaulted from their IP at signup.
// India → 'IN'; everything else (and unknown/localhost) → 'US'.
function regionForIp(ip) {
  const geo = geoip.lookup(ip);
  return geo && geo.country === 'IN' ? 'IN' : 'US';
}

module.exports = { clientIpFrom, regionForIp };
