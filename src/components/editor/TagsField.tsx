"use client";
import { useState } from "react";
import { input } from "./styles";

const MAX_TAGS = 10;

/** Free-form tags: Enter or comma adds, × removes. Duplicates are ignored case-insensitively. */
export default function TagsField({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim().slice(0, 30);
    setDraft("");
    if (t && tags.length < MAX_TAGS && !tags.some((x) => x.toLowerCase() === t.toLowerCase())) onChange([...tags, t]);
  };
  return (
    <div>
      <label>Tags
        <input className={input} value={draft} placeholder='e.g. "Local favorite", "Ghost confirmed"' disabled={tags.length >= MAX_TAGS}
          onChange={(e) => setDraft(e.target.value.replace(",", ""))}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
          onBlur={add} />
      </label>
      <span className="text-xs text-neutral-500">Travelers can filter tours by these. Press Enter to add (up to {MAX_TAGS}).</span>
      {tags.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {tags.map((t) => (
            <li key={t} className="flex items-center gap-1 rounded-full border border-black/20 px-3 py-1 text-sm">
              {t}
              <button type="button" aria-label={`Remove tag ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
