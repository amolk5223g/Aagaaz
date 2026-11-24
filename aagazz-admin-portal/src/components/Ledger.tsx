import React, { useEffect, useRef } from 'react';

/** A loose sheet laid over the register. */
export const Sheet: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);
  return (
    <dialog ref={ref} className="sheet" onCancel={onClose} aria-label={title}>
      <h2>{title}</h2>
      {children}
    </dialog>
  );
};

interface PagerProps {
  page: number;
  total: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

export const Pager: React.FC<PagerProps> = ({ page, total, setPage }) => (
  <div className="pager">
    <span>Page {page} of {Math.ceil(total / 50) || 1}</span>
    <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
    <button className="btn" onClick={() => setPage((p) => p + 1)} disabled={page * 50 >= total}>Next</button>
  </div>
);
