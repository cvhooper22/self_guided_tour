"use client";
import type { CSSProperties, ReactNode } from "react";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

type Props<T> = {
  items: T[];
  /** A string unique within the list. Index-based ids are fine for lists that can hold duplicates. */
  getId: (item: T, index: number) => string;
  /** Called with the full list in its new order. */
  onReorder: (items: T[]) => void;
  /** Render one row's contents. Put `handle` wherever the grip should go; the rest of the row stays clickable. */
  renderItem: (item: T, index: number, handle: ReactNode) => ReactNode;
  /** Classes for the row's <li>. */
  itemClassName?: (item: T, index: number) => string;
  /** Rendered after the rows (e.g. an empty-state <li>). */
  footer?: ReactNode;
  className?: string;
  /** Tag the grip is labelled with for screen readers, e.g. "stop". */
  label?: string;
};

/**
 * The one drag-and-drop reorder list for the app: drag a row by its grip with mouse or touch, or focus the grip and use
 * space/enter to lift and the arrow keys to move. Rows are controlled; this only reports the new order.
 */
export default function SortableList<T>({ items, getId, onReorder, renderItem, itemClassName, footer, className = "mt-3 space-y-1", label = "item" }: Props<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(getId);
  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id)), to = ids.indexOf(String(over.id));
    if (from >= 0 && to >= 0) onReorder(arrayMove(items, from, to));
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className={className}>
          {items.map((item, i) => <Row key={ids[i]} id={ids[i]} label={label} className={itemClassName?.(item, i) ?? ""}>{(handle) => renderItem(item, i, handle)}</Row>)}
          {footer}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

function Row({ id, label, className, children }: { id: string; label: string; className: string; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = { transform: CSS.Translate.toString(transform), transition, position: "relative", zIndex: isDragging ? 10 : undefined, opacity: isDragging ? 0.85 : undefined };
  const handle = (
    <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={`Reorder ${label}`} title="Drag to reorder" className="cursor-grab touch-none select-none px-1 text-neutral-500 active:cursor-grabbing">⠿</button>
  );
  return <li ref={setNodeRef} style={style} className={`${className} ${isDragging ? "shadow-lg" : ""}`}>{children(handle)}</li>;
}
