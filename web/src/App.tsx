// web/src/App.tsx
import React, { useEffect, useState } from "react"
import PersonForm from "./features/person/PersonForm"
import { addNote, getNotes, pushPendingMutations } from "./db/client"

export default function App() {
  const [text, setText] = useState("")
  const [notes, setNotes] = useState<any[]>([])
  const [status, setStatus] = useState<string>("")

  async function refresh() {
    const rows = await getNotes()
    setNotes(rows)
  }

  useEffect(() => {
    refresh()
    const onOnline = () => { pushPendingMutations().then(refresh) }
    window.addEventListener("online", onOnline)
    return () => window.removeEventListener("online", onOnline)
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    await addNote({ body: text.trim() })
    setText("")
    setStatus("Saved locally.")
    await pushPendingMutations()
    await refresh()
  }

  return (
    <div className="slds slds-p-around_large">
      <header className="slds-page-header slds-m-bottom_large">
        <div className="slds-media">
          <div className="slds-media__body">
            <h1 className="slds-page-header__title slds-truncate">TGTHR PWA — MVP</h1>
            <p className="slds-page-header__info">Local-first • SLDS</p>
          </div>
        </div>
      </header>

      {/* Person Account form */}
      <PersonForm />

      {/* Notes UI */}
      <section className="slds-box slds-m-top_large">
        <h2 className="slds-text-heading_small slds-m-bottom_small">Offline Notes (MVP)</h2>

        <form onSubmit={handleAdd} className="slds-grid slds-gutters slds-m-bottom_small">
          <div className="slds-col slds-size_3-of-4">
            <input
              className="slds-input"
              placeholder="Type a note..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="slds-col slds-size_1-of-4 slds-text-align_right">
            <button className="slds-button slds-button_brand" type="submit">Add</button>
          </div>
        </form>

        {status && <div className="slds-text-color_success slds-m-bottom_small">{status}</div>}

        <ul className="slds-has-dividers_around-space">
          {notes.map(n => (
            <li key={n.id} className="slds-item slds-p-around_small">
              <div className="slds-text-title_caps slds-text-color_weak slds-truncate">{n.id}</div>
              <div className="slds-m-vertical_x-small">{n.body}</div>
              <div className="slds-text-color_weak slds-text-body_small">
                {new Date(n.updatedAt).toLocaleString()}
              </div>
            </li>
          ))}
          {notes.length === 0 && (
            <li className="slds-item slds-p-around_small slds-text-color_weak">No notes yet.</li>
          )}
        </ul>
      </section>
    </div>
  )
}
