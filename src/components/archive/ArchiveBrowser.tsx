import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { 
  Search, 
  ArrowLeft, 
  ChevronRight, 
  FolderClosed, 
  Archive, 
  FileBox 
} from 'lucide-react';
import { useArchiveBrowser } from '../../hooks/useArchiveBrowser';
import { ROUTES } from '../../constants';
import type { FolderDTO } from '../../types/folder';

/** Works for both folder.ts and ticket.ts TicketTypeSummaryDTO shapes */
interface CaseFileItem {
  id: string;
  title: string;
  description?: string;
  departmentName?: string;
  folderPath?: string;
  isActive: boolean;
}

const getDepartmentColor = (dept: string = '') => {
  const colors = ['bg-red-600', 'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-orange-600'];
  let hash = 0;
  for (let i = 0; i < dept.length; i++) {
    hash = dept.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const ArchiveBrowser: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentFolderId,
    breadcrumbs,
    contents,
    isLoading,
    searchQuery,
    searchResults,
    isSearching,
    navigateToFolder,
    navigateBack,
    navigateToRoot,
    setSearchQuery,
  } = useArchiveBrowser();

  const handleTicketTypeClick = (type: CaseFileItem) => {
    navigate(`${ROUTES.TICKETS.NEW}?typeId=${type.id}`);
  };

  const parentFolder = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : null;
  const parentName = parentFolder ? parentFolder.name : 'Archives';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-stone-900 relative overflow-x-hidden flex flex-col">
      {/* Texture Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 z-0" 
        style={{ 
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)' 
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 container mx-auto px-6 py-8 flex flex-col h-full flex-grow">
        
        {/* HEADER AREA */}
        <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-shrink-0">
            <h1 className="text-4xl font-serif text-amber-400 font-bold tracking-tight mb-2 drop-shadow-md">
              Case Archives
            </h1>
            <p className="text-slate-400 text-sm italic">
              Select a case file to open a new investigation...
            </p>
          </div>

          <div className="flex flex-col items-end gap-4 w-full md:w-auto">
            {/* GLOBAL SEARCH BAR */}
            <div className="relative w-full md:w-[450px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                aria-label="Search all case files"
                placeholder="Search all case files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/60 backdrop-blur border border-slate-600/50 text-slate-200 placeholder-slate-500 rounded-xl py-3 pl-12 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded-full hover:bg-slate-700/50 transition-colors"
                >
                  <span className="text-lg leading-none font-bold">×</span>
                </button>
              )}
            </div>

            {/* BREADCRUMB TRAIL */}
            {!isSearching && (
              <div className="flex items-center space-x-1 text-sm overflow-x-auto whitespace-nowrap bg-slate-900/40 px-4 py-2 rounded-lg border border-slate-700/50 max-w-full">
                <button 
                  onClick={navigateToRoot} 
                  className="text-amber-300/80 hover:text-amber-100 flex items-center transition-colors"
                >
                  <Archive className="w-4 h-4 mr-1.5" /> Archives
                </button>
                {breadcrumbs.map((b, i) => (
                  <React.Fragment key={b.id}>
                    <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mx-1" />
                    <button
                      onClick={() => navigateToFolder(b.id)}
                      className={`transition-colors ${
                        i === breadcrumbs.length - 1 
                          ? 'text-amber-100 font-medium' 
                          : 'text-amber-300/80 hover:text-amber-100'
                      }`}
                    >
                      {b.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BACK BUTTON */}
        {!isSearching && currentFolderId !== null && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={navigateBack}
            className="flex items-center text-slate-300 hover:text-amber-400 mb-6 w-fit transition-colors group bg-slate-800/40 px-4 py-2 rounded-lg border border-slate-700/50 backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Return to {parentName}</span>
          </motion.button>
        )}

        {/* MAIN CONTENT AREA */}
        <div className="flex-grow">
          {isLoading ? (
            /* LOADING STATE */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-800/50 rounded-xl h-48 border border-slate-700/50 p-5 flex flex-col">
                  <div className="h-1.5 w-full bg-slate-700 mb-4 rounded"></div>
                  <div className="h-6 w-3/4 bg-slate-700 rounded mb-3"></div>
                  <div className="h-4 w-full bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 w-5/6 bg-slate-700 rounded mb-4"></div>
                  <div className="mt-auto h-6 w-1/3 bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : isSearching ? (
            /* SEARCH RESULTS */
            <div className="space-y-6">
              <h2 className="text-xl font-serif text-amber-200 border-b border-slate-700/50 pb-2">
                Search Results ({searchResults.length})
              </h2>
              
              {searchResults.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center">
                  <Search className="w-16 h-16 text-slate-600 mb-4 opacity-50" />
                  <p className="text-lg font-serif italic text-slate-300">No leads found.</p>
                  <p className="text-sm">The archives contain no records matching your query.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  <AnimatePresence>
                    {searchResults.map((type, index) => (
                      <TicketTypeCard key={type.id} type={type} index={index} onClick={() => handleTicketTypeClick(type)} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ) : (
            /* NORMAL VIEW (Folders & Files) */
            <div className="space-y-10">
              {/* FOLDERS SECTION */}
              {contents && contents.subfolders.length > 0 && (
                <div>
                  <h2 className="text-sm uppercase tracking-widest text-slate-500 font-semibold mb-4 ml-1">
                    Departments & Categories
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <AnimatePresence>
                      {contents.subfolders.map((sub, index) => (
                        <FolderCard key={sub.id} folder={sub} index={index} onClick={() => navigateToFolder(sub.id)} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* FILES SECTION */}
              {contents && contents.ticketTypes.length > 0 && (
                <div>
                  <h2 className="text-sm uppercase tracking-widest text-slate-500 font-semibold mb-4 ml-1">
                    Available Case Files
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    <AnimatePresence>
                      {contents.ticketTypes.map((type, index) => (
                        <TicketTypeCard key={type.id} type={type} index={index} onClick={() => handleTicketTypeClick(type)} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* EMPTY STATE */}
              {contents && contents.subfolders.length === 0 && contents.ticketTypes.length === 0 && (
                <div className="py-24 flex flex-col items-center justify-center text-center">
                  <FileBox className="w-20 h-20 text-amber-900/40 mb-6" />
                  <h3 className="text-2xl font-serif text-amber-200/50 mb-2">This archive is empty</h3>
                  <p className="text-slate-500 max-w-md">
                    No active case files or sub-directories are stored in this location. The trail goes cold here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-components

const FolderCard = ({ folder, index, onClick }: { folder: FolderDTO, index: number, onClick: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -5, boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.5)' }}
      whileTap={{ scale: 0.98 }}
      role="button"
      tabIndex={0}
      aria-label={`Open folder ${folder.name}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="relative cursor-pointer group pt-2 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg"
    >
      {/* Physical Manila Folder Tab with tab cutout */}
      <div className="absolute top-0 left-3 w-2/5 h-3 bg-amber-400/90 rounded-t-md border-t border-x border-amber-500/50 flex items-center px-1.5 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600/70 inline-block"></span>
      </div>
      
      {/* Folder Body with vintage manila texture and stitching border */}
      <div className="relative z-10 bg-gradient-to-b from-amber-100 via-amber-50 to-amber-100/90 rounded-lg rounded-tl-none p-5 shadow-lg border-2 border-amber-300/80 flex flex-col items-center justify-center min-h-[135px] transition-all group-hover:border-amber-400 group-hover:from-amber-50 group-hover:to-white">
        {/* Vintage Archive Tab Label */}
        <div className="w-12 h-1 bg-amber-300/60 rounded-full mb-3 group-hover:bg-amber-400/80 transition-colors"></div>
        <FolderClosed className="w-12 h-12 text-amber-800/80 mb-3 group-hover:scale-110 group-hover:text-amber-700 transition-all duration-300 drop-shadow" />
        <span className="font-bold text-slate-800 text-center text-sm line-clamp-2 px-1 tracking-tight">
          {folder.name}
        </span>
        <span className="text-[10px] text-amber-800/60 uppercase font-semibold tracking-wider mt-1">
          Folder
        </span>
      </div>
    </motion.div>
  );
};

const TicketTypeCard = ({ type, index, onClick }: { type: CaseFileItem, index: number, onClick: () => void }) => {
  // Deterministic slight rotation for visual interest (-0.5 to +0.5 degrees)
  const rotation = index % 2 === 0 ? '0.6deg' : '-0.6deg';
  const deptColor = getDepartmentColor(type.departmentName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ 
        y: -6, 
        rotate: 0,
        boxShadow: '0 18px 35px -6px rgba(245, 158, 11, 0.2)',
        scale: 1.02
      }}
      whileTap={{ scale: 0.98 }}
      role="button"
      tabIndex={0}
      aria-label={`Open case file ${type.title}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{ transform: `rotate(${rotation})` }}
      className="cursor-pointer relative bg-stone-50 rounded-md shadow-xl border-2 border-stone-200/90 overflow-hidden flex flex-col h-full hover:z-20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
    >
      {/* Top Department Color Stripe */}
      <div className={`h-2 w-full ${deptColor}`} />
      
      <div className="p-5 flex flex-col flex-grow relative bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNjY2MiLz4KPC9zdmc+')] bg-repeat">
        
        {/* Detective "CLASSIFIED" / "CASE FILE" Stamp */}
        <div className="absolute top-4 right-3 border-2 border-red-700/30 text-red-700/40 text-[10px] font-black tracking-widest px-2 py-0.5 rounded-sm rotate-[12deg] uppercase pointer-events-none select-none">
          Case File
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-2 pr-14 leading-tight drop-shadow-sm font-serif">
          {type.title}
        </h3>
        
        <p className="text-sm text-slate-600 line-clamp-2 flex-grow mb-5 leading-relaxed">
          {type.description || 'Standard incident dossier. Click to file report.'}
        </p>

        <div className="mt-auto pt-4 border-t border-stone-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-block bg-slate-200/90 text-slate-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-xs">
              {type.departmentName || 'General'}
            </span>
          </div>
          
          <div className="text-[10px] text-slate-500 flex items-center bg-stone-100/90 rounded px-2 py-1 w-fit max-w-full border border-stone-200/60">
            <Archive className="w-3 h-3 mr-1.5 flex-shrink-0 text-amber-700" />
            <span className="truncate">{type.folderPath || 'Case Records'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
