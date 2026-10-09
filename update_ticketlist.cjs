const fs = require('fs');
const file = 'src/pages/dashboard/TicketListPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add shouldReduceMotion
content = content.replace(
  'const { tickets, loading, error, pagination, filters, setFilter, setPage, refetch } = useTicketList({});',
  'const { tickets, loading, error, pagination, filters, setFilter, setPage, refetch } = useTicketList({});\n  const shouldReduceMotion = useReducedMotion();\n  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };\n  const itemVariants = { hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 }, show: { opacity: 1, y: 0 } };'
);

// Mobile
content = content.replace(
  '<Box>\n          {tickets.map(t => (\n            <MobileTicketCard key={t.id} ticket={t} onClick={() => navigate(`/tickets/${t.id}`)} />\n          ))}\n        </Box>',
  '<Box component={motion.div} initial="hidden" animate="show" variants={containerVariants}>\n          {tickets.map(t => (\n            <motion.div key={t.id} variants={itemVariants}>\n              <MobileTicketCard ticket={t} onClick={() => navigate(`/tickets/${t.id}`)} />\n            </motion.div>\n          ))}\n        </Box>'
);

// Desktop table body
content = content.replace(
  '<tbody>\n              {tickets.map(t => (',
  '<motion.tbody initial="hidden" animate="show" variants={containerVariants}>\n              {tickets.map(t => ('
);
content = content.replace(
  '<tr key={t.id}',
  '<motion.tr key={t.id} variants={itemVariants}'
);
content = content.replace(
  '</tr>\n              ))}\n            </tbody>',
  '</motion.tr>\n              ))}\n            </motion.tbody>'
);

fs.writeFileSync(file, content);
