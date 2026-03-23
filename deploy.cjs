const { execSync } = require('child_process');
const GIT = 'C:\\Program Files\\Git\\bin\\git.exe';
const opts = { cwd: 'd:/WRtour', stdio: 'inherit' };

try {
  execSync(`"${GIT}" add server/src/routes/auth.ts server/src/middleware/tenant.ts`, opts);
  execSync(`"${GIT}" commit -m "fix: use masterPool in auth login and tenant middleware for correct agencyId lookup"`, opts);
  execSync(`"${GIT}" push origin main`, opts);
  console.log('\n✅ Done! Changes pushed.');
} catch (e) {
  console.error('\n❌ Error:', e.message);
  process.exit(1);
}
