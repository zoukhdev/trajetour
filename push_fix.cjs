const { execSync } = require('child_process');
const GIT = 'C:\\Program Files\\Git\\bin\\git.exe';
const opts = { cwd: 'd:/WRtour', stdio: 'inherit' };

try {
  execSync(`"${GIT}" add .`, opts);
  execSync(`"${GIT}" commit -m "fix(mobile): improved header responsiveness and centering on small screens"`, opts);
  execSync(`"${GIT}" push origin main`, opts);
  console.log('\n✅ Done! Changes pushed.');
} catch (e) {
  console.error('\n❌ Error:', e.message);
  process.exit(1);
}
