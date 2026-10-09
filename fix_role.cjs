const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/RoleAdminPage.tsx', 'utf8');

// First undo the bad seds
content = content.replace(/return \(<><>/g, 'return (');
content = content.replace(/return \(<>/g, 'return (');
content = content.replace(/<\/>\);/g, ');');

content = content.replace(
  "  return (\n    <div className=\"p-6\">",
  "  return (\n    <>\n    <div className=\"p-6\">"
);

// find the last );
const lastParenIndex = content.lastIndexOf(');');
if (lastParenIndex !== -1) {
    content = content.substring(0, lastParenIndex) + '    </>\n  ' + content.substring(lastParenIndex);
}

fs.writeFileSync('src/pages/admin/RoleAdminPage.tsx', content);
