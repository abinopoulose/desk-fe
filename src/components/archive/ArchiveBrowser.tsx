import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { 
  Search, 
  ArrowLeft, 
  ChevronRight, 
  FolderClosed, 
  FolderOpen,
  Ticket, 
  Layers, 
  ArrowRight,
  FolderTree,
  Sparkles
} from 'lucide-react';
import { useArchiveBrowser } from '../../hooks/useArchiveBrowser';
import { ROUTES } from '../../constants';
import type { FolderDTO } from '../../types/folder';

/** Supports both folder and ticket DTO formats for ticket type items */
interface TicketItem {
  id: string;
  title: string;
  description?: string;
  departmentId?: string;
  departmentName?: string;
  folderPath?: string;
  isActive: boolean;
}

const getDepartmentBadgeStyle = (dept: string = '') => {
  const styles = [
    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', bar: 'bg-indigo-500' },
    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' },
    { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', bar: 'bg-violet-500' },
    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', bar: 'bg-blue-500' },
    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500' },
    { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', bar: 'bg-rose-500' },
  ];
  let hash = 0;
  for (let i = 0; i < dept.length; i++) {
    hash = dept.charCodeAt(i) + ((hash << 5) - hash);
  }
  return styles[Math.abs(hash) % styles.length];
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

  const handleTicketTypeClick = (type: TicketItem) => {
    navigate(`${ROUTES.TICKETS.NEW}?typeId=${type.id}`);
  };

  const parentFolder = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;
  const parentName = parentFolder ? parentFolder.name : 'All Categories';
  const currentFolderName = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : null;

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Banner / Header Container */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 shadow-xs">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Service Catalog
              </span>
              <span className="text-xs text-slate-400 font-medium">New Ticket Request</span>
            </div>
            
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              {currentFolderName ? currentFolderName : 'Select Ticket Category'}
            </h1>
            <p className="text-slate-500 text-sm mt-1 max-w-xl">
              Browse categories and ticket templates below, or search directly to file a new ticket.
            </p>
          </div>

          {/* GLOBAL SEARCH BAR */}
          <div className="w-full md:w-[420px] shrink-0">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                aria-label="Search all case files"
                placeholder="Search ticket types, issues, or services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300/80 focus:border-indigo-600 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/60 transition-colors"
                >
                  <span className="text-base leading-none font-bold">×</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 flex-1 flex flex-col">
        
        {/* Navigation Bar: Back Button & Breadcrumbs */}
        {!isSearching && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              {currentFolderId !== null && (
                <button
                  type="button"
                  onClick={navigateBack}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-indigo-600 text-xs font-medium rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Return to {parentName}</span>
                </button>
              )}

              {/* Breadcrumb Path */}
              <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 bg-white/80 border border-slate-200/70 px-3 py-1.5 rounded-lg shadow-2xs">
                <button
                  type="button"
                  onClick={navigateToRoot}
                  className="font-medium hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <FolderTree className="w-3.5 h-3.5 text-slate-400" />
                  <span>All Categories</span>
                </button>
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={crumb.id}>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-1 shrink-0" />
                      <button
                        type="button"
                        onClick={() => navigateToFolder(crumb.id)}
                        disabled={isLast}
                        className={`transition-colors cursor-pointer ${
                          isLast
                            ? 'font-semibold text-slate-800 pointer-events-none'
                            : 'font-medium text-slate-500 hover:text-indigo-600'
                        }`}
                      >
                        {crumb.name}
                      </button>
                    </React.Fragment>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* LOADING SKELETON */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl h-44 border border-slate-200 p-5 flex flex-col shadow-xs">
                <div className="h-5 w-1/3 bg-slate-100 rounded mb-3"></div>
                <div className="h-6 w-3/4 bg-slate-100 rounded mb-2"></div>
                <div className="h-4 w-full bg-slate-100 rounded mb-1"></div>
                <div className="h-4 w-2/3 bg-slate-100 rounded mb-4"></div>
                <div className="mt-auto h-5 w-1/2 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : isSearching ? (
          /* SEARCH RESULTS VIEW */
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span>Search Results</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-full border border-indigo-100">
                  {searchResults.length}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-500 hover:text-indigo-600 font-medium cursor-pointer"
              >
                Clear Search
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200 p-8">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Search className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">No matching ticket types</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  We couldn't find any ticket forms matching "{searchQuery}". Try different keywords or browse the catalog.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
                <AnimatePresence>
                  {searchResults.map((type, index) => (
                    <TicketTypeCard
                      key={type.id}
                      type={type}
                      index={index}
                      onClick={() => handleTicketTypeClick(type)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        ) : (
          /* CATEGORIES & TICKET TEMPLATES VIEW */
          <div className="space-y-10">
            {/* SUBFOLDERS / CATEGORIES */}
            {contents && contents.subfolders.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Categories & Sub-Folders</span>
                  </h2>
                  <span className="text-xs text-slate-400 font-medium">
                    {contents.subfolders.length} {contents.subfolders.length === 1 ? 'folder' : 'folders'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                  <AnimatePresence>
                    {contents.subfolders.map((sub, index) => (
                      <FolderCard
                        key={sub.id}
                        folder={sub}
                        index={index}
                        onClick={() => navigateToFolder(sub.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* TICKET TYPES */}
            {contents && contents.ticketTypes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-slate-400" />
                    <span>Available Ticket Forms</span>
                  </h2>
                  <span className="text-xs text-slate-400 font-medium">
                    {contents.ticketTypes.length} {contents.ticketTypes.length === 1 ? 'template' : 'templates'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
                  <AnimatePresence>
                    {contents.ticketTypes.map((type, index) => (
                      <TicketTypeCard
                        key={type.id}
                        type={type}
                        index={index}
                        onClick={() => handleTicketTypeClick(type)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* EMPTY FOLDER STATE */}
            {contents && contents.subfolders.length === 0 && contents.ticketTypes.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center mb-4">
                  <FolderOpen className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">This archive is empty</h3>
                <p className="text-sm text-slate-500 max-w-sm mb-4">
                  No ticket types or subcategories are currently filed under this folder.
                </p>
                {currentFolderId && (
                  <button
                    type="button"
                    onClick={navigateBack}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    ← Go back to previous folder
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/** Physical Archive Folder Card component */
const FolderCard = ({ folder, index, onClick }: { folder: FolderDTO; index: number; onClick: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
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
      className="relative cursor-pointer group pt-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl select-none"
    >
      {/* Physical Folder Tab cutout */}
      <div className="absolute top-0 left-3 w-2/5 h-3 bg-amber-200/90 group-hover:bg-amber-300 rounded-t-md border-t border-x border-amber-300/80 transition-colors z-0" />

      {/* Main Folder Body with soft warm paper tone & subtle embossed edge */}
      <div className="relative z-10 bg-gradient-to-b from-amber-50/90 to-amber-100/70 group-hover:from-amber-50 group-hover:to-amber-100 rounded-2xl rounded-tl-none p-4.5 border border-amber-200/90 group-hover:border-amber-300 shadow-xs group-hover:shadow-md transition-all flex flex-col justify-between min-h-[130px]">
        
        <div className="flex items-start justify-between gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-200/70 group-hover:bg-amber-200 flex items-center justify-center text-amber-800 transition-colors shadow-2xs">
            <FolderClosed className="w-5 h-5 group-hover:scale-105 transition-transform" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800/60 bg-amber-200/40 px-1.5 py-0.5 rounded">
            Folder
          </span>
        </div>

        <div>
          <span className="font-semibold text-slate-800 text-sm line-clamp-2 group-hover:text-amber-950 transition-colors">
            {folder.name}
          </span>
          <span className="text-[11px] text-amber-800/60 font-medium group-hover:text-amber-800 mt-0.5 flex items-center gap-1">
            <span>Browse folder</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </motion.div>
  );
};

/** Modern Ticketing System Ticket Type Card */
const TicketTypeCard = ({ type, index, onClick }: { type: TicketItem; index: number; onClick: () => void }) => {
  const badgeStyle = getDepartmentBadgeStyle(type.departmentName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035 }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
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
      className="cursor-pointer relative bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between p-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 group select-none overflow-hidden"
    >
      {/* Top Department Color Strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${badgeStyle.bar}`} />

      <div>
        {/* Header row: Department badge & Ticket icon */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
            {type.departmentName || 'General'}
          </span>
          <div className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
            <Ticket className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Ticket Form Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-1.5 line-clamp-2">
          {type.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {type.description || 'Submit a new request or report an issue with this form.'}
        </p>
      </div>

      {/* Footer details: Folder location and Action CTA */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto text-xs">
        <span className="text-[11px] text-slate-400 truncate max-w-[140px]" title={type.folderPath || 'Service Catalog'}>
          {type.folderPath || 'General'}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 group-hover:text-indigo-700">
          <span>Create</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </motion.div>
  );
};
