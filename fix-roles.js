const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.controller.ts') || file.endsWith('.service.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('d:/NJ DARSLAR/7_oy_imtihon/7_oy_crm_backned/src');
let changed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Fix Roles decorators
  newContent = newContent.replace(/@Roles\(([^)]*UserRole\.SUPERADMIN[^)]*)\)/g, (match, p1) => {
    if (!p1.includes('UserRole.CREATOR')) {
      return '@Roles(UserRole.CREATOR, ' + p1 + ')';
    }
    return match;
  });

  // Fix ApiOperation summaries
  newContent = newContent.replace(/\$\{UserRole\.SUPERADMIN\}/g, '${UserRole.CREATOR}, ${UserRole.SUPERADMIN}');

  // Also in services we might have UserRole.SUPERADMIN checks
  newContent = newContent.replace(/role === \"SUPERADMIN\"/g, 'role === \"CREATOR\" || role === \"SUPERADMIN\"');
  newContent = newContent.replace(/role == \"SUPERADMIN\"/g, 'role == \"CREATOR\" || role == \"SUPERADMIN\"');

  if (newContent !== content) {
    fs.writeFileSync(file, newContent);
    changed++;
  }
});

console.log('Modified files:', changed);
