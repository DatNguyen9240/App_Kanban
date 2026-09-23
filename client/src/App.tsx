import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Board } from './components/kanban/Board';
import { ListView } from './components/views/ListView';
import { CalendarView } from './components/views/CalendarView';
import { TimelineView } from './components/views/TimelineView';
import { CardDetailModal } from './components/kanban/CardDetailModal';
import { NewCardModal } from './components/kanban/NewCardModal';
import { NewProjectModal } from './components/kanban/NewProjectModal';
import { NewColumnModal } from './components/kanban/NewColumnModal';
import { CommandPalette } from './components/command/CommandPalette';
import { InboxModal } from './components/modals/InboxModal';
import { SettingsModal } from './components/modals/SettingsModal';
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
  const [density, setDensity] = useState<CardDensity>('comfortable');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMyIssues, setIsMyIssues] = useState(false);

  // Modals
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isNewCardOpen, setIsNewCardOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  // 4. Keyboard shortcuts (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 5. Drag & Drop Move Card
  const handleMoveCard = async (
    cardId: string,
    targetColumnId: string,
    prevCardId?: string,
    nextCardId?: string
  ) => {
    if (!currentBoard) return;

    // Optimistic local state update
    const previousColumns = [...currentBoard.columns];
    let movedCard: Card | null = null;

    const newColumns = currentBoard.columns.map((col) => {
      const found = col.cards?.find((c) => c.id === cardId);
      if (found) {
        movedCard = { ...found, column_id: targetColumnId };
        return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
      }
      return col;
    });

    if (movedCard) {
      const targetCol = newColumns.find((c) => c.id === targetColumnId);
      if (targetCol) {
        targetCol.cards = [...(targetCol.cards || []), movedCard];
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
    try {
      const updated = await api.updateCard(cardId, data);
      setSelectedCard(updated);
      refreshBoard();
    } catch (err) {
      console.error('Failed to update card:', err);
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

  // Filtered board according to search query & My Issues
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

            const matchesMyIssues = !isMyIssues || (c.assignees && c.assignees.length > 0);
            return matchesQuery && matchesMyIssues;
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      {/* Left Sidebar */}
      <Sidebar
        workspace={workspace}
        currentProject={currentProject}
        onSelectProject={handleSelectProject}
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        onOpenCommand={() => setIsCommandOpen(true)}
        onNewProject={() => setIsNewProjectOpen(true)}
        isMyIssues={isMyIssues}
        onToggleMyIssues={() => setIsMyIssues(!isMyIssues)}
        onOpenInbox={() => setIsInboxOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header */}
        <Header
          project={currentProject}
          board={currentBoard}
          onOpenNewCard={() => setIsNewCardOpen(true)}
          onOpenCommand={() => setIsCommandOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          density={density}
          onDensityChange={setDensity}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenNewColumn={() => setIsNewColumnOpen(true)}
        />

        {/* View Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {currentView === 'board' && filteredBoard && (
            <Board
              board={filteredBoard}
              density={density}
              onMoveCard={handleMoveCard}
              onSelectCard={setSelectedCard}
              onQuickAddCard={handleQuickAddCard}
              onAddColumn={handleAddColumn}
              onDeleteColumn={handleDeleteColumn}
              onUpdateColumn={handleUpdateColumn}
            />
          )}

          {currentView === 'list' && filteredBoard && (
            <ListView
              board={filteredBoard}
              onSelectCard={setSelectedCard}
              onDeleteCard={handleDeleteCard}
            />
          )}

          {currentView === 'calendar' && filteredBoard && (
            <CalendarView board={filteredBoard} onSelectCard={setSelectedCard} />
          )}

          {currentView === 'timeline' && filteredBoard && (
            <TimelineView board={filteredBoard} onSelectCard={setSelectedCard} />
          )}
        </main>
      </div>

      {/* Modals */}
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

      <NewCardModal
        isOpen={isNewCardOpen}
        columns={currentBoard?.columns || []}
        onClose={() => setIsNewCardOpen(false)}
        onSubmit={handleCreateCard}
      />

      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onSubmit={handleCreateProject}
      />

      <NewColumnModal
        isOpen={isNewColumnOpen}
        onClose={() => setIsNewColumnOpen(false)}
        onSubmit={(name, color) => handleAddColumn(name, color)}
      />

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNewIssue={() => setIsNewCardOpen(true)}
        onSelectView={(v) => setCurrentView(v)}
      />

      <InboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
      />

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
    </div>
  );
};

export default App;
