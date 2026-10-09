const fs = require('fs');
let c = fs.readFileSync('src/components/folders/FolderContents.tsx', 'utf-8');

// Add MUI imports
if (!c.includes('Breadcrumbs')) {
  c = `import { Breadcrumbs, Link as MuiLink, Typography, Box } from '@mui/material';\nimport { NavigateNext as NavigateNextIcon } from '@mui/icons-material';\n` + c;
}

// Replace the top bar
const oldBar = `<h2 className="text-xl font-normal text-slate-800 flex items-center">
          {fullPath.map((part, index, arr) => (
            <React.Fragment key={index}>
              <span 
                className={\`cursor-pointer hover:bg-slate-200 px-2 py-1 rounded transition-colors \${index === arr.length - 1 ? 'font-medium text-slate-900' : 'text-slate-600'} \${index === 0 ? 'text-xl' : ''}\`}
                onClick={() => {
                  if (part.id === 'root') onSelectFolder(null);
                  else if (part.id) onSelectFolder(part.id);
                }}
              >
                {part.name}
              </span>
              {index < arr.length - 1 && (
                <svg className="mx-0.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              )}
            </React.Fragment>
          ))}
        </h2>`;

const newBar = `<Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          {fullPath.map((part, index, arr) => {
            const isLast = index === arr.length - 1;
            return isLast ? (
              <Typography key={index} color="text.primary" sx={{ fontWeight: 600 }}>
                {part.name}
              </Typography>
            ) : (
              <MuiLink
                key={index}
                underline="hover"
                color="inherit"
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  if (part.id === 'root') onSelectFolder(null);
                  else if (part.id) onSelectFolder(part.id);
                }}
              >
                {part.name}
              </MuiLink>
            );
          })}
        </Breadcrumbs>`;

c = c.replace(oldBar, newBar);

fs.writeFileSync('src/components/folders/FolderContents.tsx', c, 'utf-8');
