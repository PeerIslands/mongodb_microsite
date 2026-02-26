import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import '@/styles/features/admin/AcceleratorList.css';
import { acceleratorsService } from '@/api/services/accelerators.service';
import type { AcceleratorDetail, AcceleratorStatus } from '@/types/models/accelerator';
import { toast } from 'react-toastify';

interface AcceleratorListProps {
  onAddNew: () => void;
  onEdit: (id: string) => void;
  onLoadComplete?: () => void;
}

function SortableRow({
  accelerator,
  index,
  onToggleStatus,
  onEdit,
  onDelete,
}: {
  accelerator: AcceleratorDetail;
  index: number;
  onToggleStatus: (id: string, status: AcceleratorStatus) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: accelerator.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style} className={isDragging ? 'row-dragging' : ''}>
      <td className="order-cell">
        <span className="drag-handle" title="Drag to reorder" {...attributes} {...listeners}>
          ⋮⋮
        </span>
        <span className="order-number">{index + 1}</span>
      </td>
      <td>
        <div className="title-cell">
          {accelerator.title}
          {accelerator.feature_on_homepage && <span className="featured-badge">Featured</span>}
        </div>
      </td>
      <td>
        <button
          className={`status-badge ${accelerator.status === 'published' ? 'published' : 'draft'}`}
          onClick={() => onToggleStatus(accelerator.id, accelerator.status)}
          title="Click to toggle status"
        >
          {accelerator.status === 'published' ? 'Published' : 'Draft'}
        </button>
      </td>
      <td>{new Date(accelerator.created_at).toLocaleDateString()}</td>
      <td>
        <div className="action-buttons">
          <button
            className="action-button edit"
            onClick={() => onEdit(accelerator.id)}
            title="Edit"
          >
            ✏️
          </button>
          <button
            className="action-button delete"
            onClick={() => onDelete(accelerator.id)}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
}

const AcceleratorList = ({ onAddNew, onEdit, onLoadComplete }: AcceleratorListProps) => {
  const [accelerators, setAccelerators] = useState<AcceleratorDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reorderSaving, setReorderSaving] = useState(false);

  const hasFetchedRef = useRef(false);

  const fetchAccelerators = useCallback(async () => {
    try {
      setError(null);
      const data = await acceleratorsService.getAll();
      setAccelerators(data);
    } catch (err) {
      console.error('Failed to fetch accelerators:', err);
      setError('Failed to load accelerators. Please try again.');
    } finally {
      onLoadComplete?.();
    }
  }, [onLoadComplete]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchAccelerators();
  }, [fetchAccelerators]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this accelerator?')) {
      try {
        await acceleratorsService.delete(id);
        fetchAccelerators();
      } catch (err) {
        console.error('Failed to delete accelerator:', err);
        toast.error('Failed to delete accelerator. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: AcceleratorStatus) => {
    try {
      const newStatus: AcceleratorStatus = currentStatus === 'published' ? 'draft' : 'published';
      await acceleratorsService.update(id, { status: newStatus });
      fetchAccelerators();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('Failed to update status. Please try again.');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = accelerators.findIndex((a) => a.id === active.id);
    const newIndex = accelerators.findIndex((a) => a.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(accelerators, oldIndex, newIndex);
    setAccelerators(reordered);

    try {
      setReorderSaving(true);
      await acceleratorsService.reorder(
        reordered.map((a, i) => ({ id: a.id, display_order: i + 1 }))
      );
      toast.success('Order updated.');
    } catch (err) {
      console.error('Failed to save order:', err);
      toast.error('Failed to save order. Reverting.');
      fetchAccelerators();
    } finally {
      setReorderSaving(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (error) {
    return (
      <div className="accelerator-list">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchAccelerators} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="accelerator-list">
      <div className="list-header">
        <div className="list-header-left">
          <h2 className="list-title">Accelerators</h2>
          <span className="list-count">{accelerators.length} Total</span>
          {reorderSaving && <span className="saving-badge">Saving order…</span>}
        </div>
        <button className="add-new-button" onClick={onAddNew}>
          <span className="add-icon">+</span>
          Add New Accelerator
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <div className="stat-value">{accelerators.length}</div>
            <div className="stat-label">Total Accelerators</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{accelerators.filter((a) => a.status === 'published').length}</div>
            <div className="stat-label">Published</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{accelerators.filter((a) => a.feature_on_homepage).length}</div>
            <div className="stat-label">Featured</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{accelerators.filter((a) => a.status === 'draft').length}</div>
            <div className="stat-label">Drafts</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="accelerator-table">
          <thead>
            <tr>
              <th className="order-col">Order</th>
              <th>Title</th>
              <th>Status</th>
              <th>Created On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accelerators.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  No accelerators found. Click "Add New Accelerator" to create one.
                </td>
              </tr>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={accelerators.map((a) => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {accelerators.map((accelerator, index) => (
                    <SortableRow
                      key={accelerator.id}
                      accelerator={accelerator}
                      index={index}
                      onToggleStatus={handleToggleStatus}
                      onEdit={onEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AcceleratorList;
