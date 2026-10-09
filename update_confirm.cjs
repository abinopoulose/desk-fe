const fs = require('fs');
const file = 'src/components/common/ConfirmDialog.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { WarningAmber as WarningAmberIcon } from '@mui/icons-material';",
  "import { WarningAmber as WarningAmberIcon } from '@mui/icons-material';\nimport { motion, useReducedMotion } from 'framer-motion';"
);

content = content.replace(
  '    <Dialog\n      open={open}',
  '    const shouldReduceMotion = useReducedMotion();\n\n    return (\n    <Dialog\n      open={open}'
);

content = content.replace(
  '      <DialogTitle',
  '      <motion.div initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, ease: "easeOut" }}>\n      <DialogTitle'
);

content = content.replace(
  '      </DialogActions>\n    </Dialog>',
  '      </DialogActions>\n      </motion.div>\n    </Dialog>'
);

// We need to fix the return statement replace because I prepended `const shouldReduceMotion ...`
content = content.replace(
  'return (\n    const shouldReduceMotion = useReducedMotion();',
  'const shouldReduceMotion = useReducedMotion();\n\n    return ('
);

fs.writeFileSync(file, content);
