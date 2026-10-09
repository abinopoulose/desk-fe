const fs = require('fs');

let c = fs.readFileSync('src/pages/admin/TicketStatusManager.tsx', 'utf-8');

// Add imports
c = `import { ConfirmDialog } from "../../components/common/ConfirmDialog";\nimport { DataGridSkeleton } from "../../components/common/Skeletons";\n` + c;

// Fix loader
c = c.replace(/<div className="p-6">Loading\.\.\.<\/div>/, '<div className="p-6"><DataGridSkeleton rows={5} columns={4} /></div>');

// Add state and edit hook
c = c.replace(/  \} = useTicketStatuses\(\);/, `  } = useTicketStatuses();

  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeleteClick = (id: string) => {
    setConfirmDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await remove(confirmDelete, true);
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  };`);

// Replace onClick
c = c.replace(/onClick=\{\(\) => remove\(status\.id\)\}/g, 'onClick={() => handleDeleteClick(status.id)}');

// Add ConfirmDialog
c = c.replace(/    <\/PrivilegeGate>/, `      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleConfirmDelete} title="Delete Status" description={<>Are you sure you want to delete this status? This action cannot be undone.</>} loading={isDeleting} />\n    </PrivilegeGate>`);

fs.writeFileSync('src/pages/admin/TicketStatusManager.tsx', c, 'utf-8');
