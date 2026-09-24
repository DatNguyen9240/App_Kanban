import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Board } from './components/kanban/Board';
import { ListView } from './components/views/ListView';
import { CalendarView } from './components/views/CalendarView';
import { TimelineView } from './components/views/TimelineView';
import { MyIssuesView } from './components/views/MyIssuesView';
import { CardDetailModal } from './components/kanban/CardDetailModal';
import { NewCardModal } from './components/kanban/NewCardModal';
import { NewProjectModal } from './components/kanban/NewProjectModal';
import { NewColumnModal } from './components/kanban/NewColumnModal';
import { CommandPalette } from './components/command/CommandPalette';
import { InboxModal } from './components/modals/InboxModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { FolderPlus, Plus } from 'lucide-react';
import {
  Workspace,
  Project,
  Board as BoardType,
  Card,
  CardDensity,
  ViewMode,
} from './types/kanban';
import { api } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';

export const App: React.FC = () => {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentBoard, setCurrentBoard] = useState<BoardType | null>(null);
  const [loading, setLoading] = useState(true);

  // View state
  const [currentView, setCurrentView] = useState<ViewMode>('board');
  const [density, setDensity] = useState<CardDensity>(() => {
    return (localStorage.getItem('kanban_density') as CardDensity) || 'compact';
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Theme state (default to dark)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('kanban_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('kanban_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleDensityChange = (d: CardDensity) => {
    setDensity(d);
    localStorage.setItem('kanban_density', d);
  };

  // Modals
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isNewCardOpen, setIsNewCardOpen] = useState(false);
  const [newCardInitialDate, setNewCardInitialDate] = useState<string | undefined>(undefined);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kanban_sidebar_open');
      if (saved !== null) {
        return saved === 'true';
      }
      return window.innerWidth >= 768;
    }
    return true;
  });

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('kanban_sidebar_open', String(next));
      return next;
    });
  };
  const [isNewColumnOpen, setIsNewColumnOpen] = useState(false);

  // 1. Initial Load
  const loadData = async () => {
    try {
      setLoading(true);
      const workspaces = await api.getWorkspaces();
      if (workspaces.length > 0) {
        const ws = workspaces[0];
        setWorkspace(ws);
        if (ws.projects && ws.projects.length > 0) {
          const proj = ws.projects[0];
          setCurrentProject(proj);
          if (proj.boards && proj.boards.length > 0) {
            const boardDetail = await api.getBoardDetail(proj.boards[0].id);
            setCurrentBoard(boardDetail);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Refresh active board detail
  const refreshBoard = useCallback(async () => {
    if (!currentBoard) return;
    try {
      const updated = await api.getBoardDetail(currentBoard.id);
      setCurrentBoard(updated);
    } catch (err) {
      console.error('Failed to refresh board:', err);
    }
  }, [currentBoard?.id]);

  // 3. Real-time WebSocket sync
  useWebSocket(currentBoard?.id || null, (event) => {
    console.log('[App] WebSocket message:', event);
    if (
      event.event === 'CARD_MOVED' ||
      event.event === 'CARD_CREATED' ||
      event.event === 'CARD_UPDATED' ||
      event.event === 'CARD_DELETED' ||
      event.event === 'COLUMN_CREATED' ||
      event.event === 'COLUMN_UPDATED' ||
      event.event === 'COLUMN_DELETED' ||
      event.event === 'COMMENT_ADDED' ||
      event.event === 'CHECKLIST_UPDATED'
    ) {
      refreshBoard();
    }
  });

  // 4. Keyboard shortcuts (Ctrl+K and Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isCommandOpen) {
          setIsCommandOpen(false);
        } else if (isNewCardOpen) {
          setIsNewCardOpen(false);
        } else if (isNewColumnOpen) {
          setIsNewColumnOpen(false);
        } else if (isNewProjectOpen) {
          setIsNewProjectOpen(false);
        } else if (isInboxOpen) {
          setIsInboxOpen(false);
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (selectedCard) {
          setSelectedCard(null);
        } else if (isSidebarOpen && window.innerWidth < 768) {
          setIsSidebarOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCommandOpen,
    isNewCardOpen,
    isNewColumnOpen,
    isNewProjectOpen,
    isInboxOpen,
    isSettingsOpen,
    selectedCard,
    isSidebarOpen,
  ]);

  // 5. Drag & Drop Move Card
  const handleMoveCard = async (
    cardId: string,
    targetColumnId: string,
    prevCardId?: string,
    nextCardId?: string,
    destinationIndex?: number
  ) => {
    if (!currentBoard) return;

    // Deep clone columns for safe optimistic rollback
    const previousColumns = currentBoard.columns.map((col) => ({
      ...col,
      cards: [...(col.cards || [])],
    }));

    let movedCard: Card | null = null;

    const newColumns = currentBoard.columns.map((col) => {
      const colCards = col.cards || [];
      const found = colCards.find((c) => c.id === cardId);
      if (found) {
        movedCard = { ...found, column_id: targetColumnId };
        return { ...col, cards: colCards.filter((c) => c.id !== cardId) };
      }
      return { ...col, cards: [...colCards] };
    });

    if (movedCard) {
      const targetCol = newColumns.find((c) => c.id === targetColumnId);
      if (targetCol) {
        const cards = [...(targetCol.cards || [])];
        if (
          destinationIndex !== undefined &&
          destinationIndex >= 0 &&
          destinationIndex <= cards.length
        ) {
          cards.splice(destinationIndex, 0, movedCard);
        } else {
          cards.push(movedCard);
        }
        targetCol.cards = cards;
      }
      setCurrentBoard({ ...currentBoard, columns: newColumns });
    }

    try {
      await api.moveCard(cardId, targetColumnId, prevCardId, nextCardId);
    } catch (err) {
      console.error('Failed to move card:', err);
      // Revert on error
      setCurrentBoard({ ...currentBoard, columns: previousColumns });
    }
  };

  // 6. Quick add card
  const handleQuickAddCard = async (columnId: string, title: string) => {
    if (!currentBoard) return;
    try {
      await api.createCard({
        board_id: currentBoard.id,
        column_id: columnId,
        title,
      });
      refreshBoard();
    } catch (err) {
      console.error('Failed to quick add card:', err);
    }
  };

  // 7. Full Create Card
  const handleCreateCard = async (data: {
    column_id: string;
    title: string;
    description: string;
    priority: any;
    cover_image_url?: string;
    due_date?: string;
  }) => {
    if (!currentBoard) return;
    try {
      await api.createCard({
        board_id: currentBoard.id,
        ...data,
      });
      refreshBoard();
    } catch (err) {
      console.error('Failed to create card:', err);
    }
  };

  // 8. Update Card
  const handleUpdateCard = async (cardId: string, data: Partial<Card>) => {
    // Optimistically update selectedCard so UI reflects changes instantly
    setSelectedCard((prev) => (prev && prev.id === cardId ? { ...prev, ...data } : prev));

    // Optimistically update currentBoard so Board / List view reflects changes immediately
    if (currentBoard) {
      setCurrentBoard((prevBoard) => {
        if (!prevBoard) return prevBoard;
        let cardToMove: Card | null = null;
        const newCols = prevBoard.columns.map((col) => {
          const found = col.cards?.find((c) => c.id === cardId);
          if (found) {
            cardToMove = { ...found, ...data };
            if (data.column_id && data.column_id !== col.id) {
              return { ...col, cards: col.cards?.filter((c) => c.id !== cardId) || [] };
            } else {
              return {
                ...col,
                cards: col.cards?.map((c) => (c.id === cardId ? { ...c, ...data } : c)) || [],
              };
            }
          }
          return col;
        });

        if (data.column_id && cardToMove) {
          const targetCol = newCols.find((col) => col.id === data.column_id);
          if (targetCol && !targetCol.cards?.some((c) => c.id === cardId)) {
            targetCol.cards = [...(targetCol.cards || []), cardToMove];
          }
        }

        return { ...prevBoard, columns: newCols };
      });
    }

    try {
      const updated = await api.updateCard(cardId, data);
      setSelectedCard(updated);
      refreshBoard();
    } catch (err) {
      console.error('Failed to update card:', err);
      refreshBoard();
    }
  };

  // 9. Delete Card
  const handleDeleteCard = async (cardId: string) => {
    try {
      await api.deleteCard(cardId);
      setSelectedCard(null);
      refreshBoard();
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  };

  // 10. Add Comment
  const handleAddComment = async (cardId: string, content: string) => {
    try {
      await api.addComment(cardId, content);
      if (currentBoard) {
        const boardDetail = await api.getBoardDetail(currentBoard.id);
        setCurrentBoard(boardDetail);
        const updatedCard = boardDetail.columns
          .flatMap((c) => c.cards)
          .find((c) => c.id === cardId);
        if (updatedCard) setSelectedCard(updatedCard);
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  // 11. Add Column
  const handleAddColumn = async (name: string, color?: string) => {
    if (!currentBoard) return;
    try {
      await api.createColumn(currentBoard.id, name, color);
      refreshBoard();
    } catch (err) {
      console.error('Failed to create column:', err);
    }
  };

  // 12. Update Column
  const handleUpdateColumn = async (columnId: string, name: string) => {
    try {
      await api.updateColumn(columnId, { name });
      refreshBoard();
    } catch (err) {
      console.error('Failed to update column:', err);
    }
  };

  // 13. Delete Column
  const handleDeleteColumn = async (columnId: string) => {
    try {
      await api.deleteColumn(columnId);
      refreshBoard();
    } catch (err) {
      console.error('Failed to delete column:', err);
    }
  };

  // 14. Delete Project
  const handleDeleteProject = async (projectId: string) => {
    try {
      await api.deleteProject(projectId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  // 14. Checklist operations
  const handleToggleChecklist = async (itemId: string) => {
    try {
      await api.toggleChecklistItem(itemId);
      if (currentBoard) {
        const boardDetail = await api.getBoardDetail(currentBoard.id);
        setCurrentBoard(boardDetail);
        if (selectedCard) {
          const updatedCard = boardDetail.columns
            .flatMap((c) => c.cards)
            .find((c) => c.id === selectedCard.id);
          if (updatedCard) setSelectedCard(updatedCard);
        }
      }
    } catch (err) {
      console.error('Failed to toggle checklist:', err);
    }
  };

  const handleAddChecklistItem = async (cardId: string, content: string) => {
    try {
      await api.addChecklistItem(cardId, content);
      if (currentBoard) {
        const boardDetail = await api.getBoardDetail(currentBoard.id);
        setCurrentBoard(boardDetail);
        if (selectedCard) {
          const updatedCard = boardDetail.columns
            .flatMap((c) => c.cards)
            .find((c) => c.id === selectedCard.id);
          if (updatedCard) setSelectedCard(updatedCard);
        }
      }
    } catch (err) {
      console.error('Failed to add checklist item:', err);
    }
  };

  // 15. Create Project
  const handleCreateProject = async (data: { name: string; key: string; description: string; color: string }) => {
    if (!workspace) return;
    try {
      const newProj = await api.createProject({
        workspace_id: workspace.id,
        ...data,
      });
      // Reload workspaces
      const updatedWorkspaces = await api.getWorkspaces();
      if (updatedWorkspaces.length > 0) {
        setWorkspace(updatedWorkspaces[0]);
        const found = updatedWorkspaces[0].projects?.find((p) => p.id === newProj.id);
        if (found) {
          setCurrentProject(found);
          if (found.boards && found.boards.length > 0) {
            const b = await api.getBoardDetail(found.boards[0].id);
            setCurrentBoard(b);
          }
        }
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  // Switch Project
  const handleSelectProject = async (proj: Project) => {
    setCurrentProject(proj);
    if (proj.boards && proj.boards.length > 0) {
      const b = await api.getBoardDetail(proj.boards[0].id);
      setCurrentBoard(b);
    }
  };

  // Filtered board according to search query
  const filteredBoard: BoardType | null = currentBoard
    ? {
        ...currentBoard,
        columns: currentBoard.columns.map((col) => ({
          ...col,
          cards: (col.cards || []).filter((c) => {
            const matchesQuery =
              c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.issue_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.description?.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesQuery;
          }),
        })),
      }
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Kanban Flow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#0B0F17] transition-colors duration-200">
      {/* Left Sidebar */}
      <Sidebar
        workspace={workspace}
        currentProject={currentProject}
        onSelectProject={handleSelectProject}
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        onOpenCommand={() => setIsCommandOpen(true)}
        onNewProject={() => setIsNewProjectOpen(true)}
        onOpenInbox={() => setIsInboxOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onDeleteProject={handleDeleteProject}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header */}
        <Header
          project={currentProject}
          board={currentBoard}
          currentView={currentView}
          onOpenNewCard={() => setIsNewCardOpen(true)}
          onOpenCommand={() => setIsCommandOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          density={density}
          onDensityChange={handleDensityChange}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={handleToggleSidebar}
          onOpenNewColumn={() => setIsNewColumnOpen(true)}
        />

        {/* View Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {!currentProject || !currentBoard ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-transparent">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm animate-in zoom-in-95 duration-200">
                <FolderPlus className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                No project selected
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm text-center mb-6">
                There are no active projects in this workspace. Create a project to start organizing tasks, columns, and sprint boards.
              </p>
              <button
                type="button"
                onClick={() => setIsNewProjectOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Project</span>
              </button>
            </div>
          ) : (
            <>
              {currentView === 'board' && filteredBoard && (
                <Board
                  board={filteredBoard}
                  density={density}
                  onDensityChange={handleDensityChange}
                  onMoveCard={handleMoveCard}
                  onSelectCard={setSelectedCard}
                  onQuickAddCard={handleQuickAddCard}
                  onAddColumn={handleAddColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onUpdateColumn={handleUpdateColumn}
                />
              )}

              {currentView === 'my-issues' && (
                <MyIssuesView
                  board={currentBoard}
                  searchQuery={searchQuery}
                  onSelectCard={setSelectedCard}
                  onDeleteCard={handleDeleteCard}
                  onNewIssue={() => setIsNewCardOpen(true)}
                />
              )}

              {currentView === 'list' && filteredBoard && (
                <ListView
                  board={filteredBoard}
                  onSelectCard={setSelectedCard}
                  onDeleteCard={handleDeleteCard}
                  onUpdateCard={handleUpdateCard}
                  onToggleChecklist={handleToggleChecklist}
                />
              )}

              {currentView === 'calendar' && filteredBoard && (
                <CalendarView
                  board={filteredBoard}
                  onSelectCard={setSelectedCard}
                  onUpdateCard={handleUpdateCard}
                  onNewCard={(defaultDate?: string) => {
                    setNewCardInitialDate(defaultDate);
                    setIsNewCardOpen(true);
                  }}
                />
              )}

              {currentView === 'timeline' && filteredBoard && (
                <TimelineView board={filteredBoard} onSelectCard={setSelectedCard} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          columns={currentBoard?.columns || []}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleUpdateCard}
          onDelete={handleDeleteCard}
          onAddComment={handleAddComment}
          onToggleChecklist={handleToggleChecklist}
          onAddChecklistItem={handleAddChecklistItem}
        />
      )}

      {isNewCardOpen && (
        <NewCardModal
          isOpen={isNewCardOpen}
          columns={currentBoard?.columns || []}
          initialDueDate={newCardInitialDate}
          onClose={() => {
            setIsNewCardOpen(false);
            setNewCardInitialDate(undefined);
          }}
          onSubmit={handleCreateCard}
        />
      )}

      {isNewProjectOpen && (
        <NewProjectModal
          isOpen={isNewProjectOpen}
          onClose={() => setIsNewProjectOpen(false)}
          onSubmit={handleCreateProject}
        />
      )}

      {isNewColumnOpen && (
        <NewColumnModal
          isOpen={isNewColumnOpen}
          onClose={() => setIsNewColumnOpen(false)}
          onSubmit={(name, color) => handleAddColumn(name, color)}
        />
      )}

      {isCommandOpen && (
        <CommandPalette
          isOpen={isCommandOpen}
          onClose={() => setIsCommandOpen(false)}
          onNewIssue={() => setIsNewCardOpen(true)}
          onSelectView={(v) => setCurrentView(v)}
        />
      )}

      {isInboxOpen && (
        <InboxModal
          isOpen={isInboxOpen}
          onClose={() => setIsInboxOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          workspaceName={workspace?.name}
          onResetBoard={async () => {
          if (!currentBoard) return;
          // Delete all cards in all columns
          for (const col of currentBoard.columns) {
            for (const c of col.cards) {
              await api.deleteCard(c.id).catch(() => {});
            }
          }
          await refreshBoard();
        }}
      />
      )}
    </div>
  );
};

export default App;
