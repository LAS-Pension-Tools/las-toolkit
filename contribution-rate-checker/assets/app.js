/* REPLACE the existing .note block with this */
.note{
  display:flex;
  gap:10px;
  align-items:flex-start;
  background: var(--panel);         /* same as card background for max contrast */
  color: var(--text);               /* always readable on the panel */
  border:2px solid var(--border);
  border-left:6px solid var(--brand); /* strong accent instead of pale fill */
  border-radius:10px;
  padding:12px 14px;
}
.note .note-icon{
  font-size:18px;
  line-height:1;
  color: var(--brand);              /* icon matches the accent */
  flex-shrink:0;
}
