// src/features/intake/ProgramIntakeForm.tsx
import React, { useEffect, useState } from 'react'
import { Orchestrator } from '../../agents/orchestrator'
import { db } from '../../lib/db'

export default function ProgramIntakeForm() {
  const [people, setPeople] = useState<any[]>([])
  const [form, setForm] = useState<any>({})
  const [status, setStatus] = useState<string>('')
  const [issues, setIssues] = useState<string[]>([])

  useEffect(() => {
    db.persons.toArray().then(setPeople)
  }, [])

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('Submitting...'); setIssues([])
    const person = people.find(p => p.id === form.personLocalId)
    const res = await Orchestrator.createIntake(form, person)
    if (!res.ok) { setIssues(res.issues); setStatus(''); return }
    await db.intakes.add(res.value)
    setStatus('Saved locally. Will sync when online.')
    setForm({})
  }

  return (
    <form className="slds-form slds-p-around_medium" onSubmit={handleSubmit}>
      <div className="slds-form-element">
        <label className="slds-form-element__label">Person</label>
        <div className="slds-form-element__control">
          <div className="slds-select_container">
            <select className="slds-select" value={form.personLocalId||''} onChange={e=>update('personLocalId', e.target.value)} required>
              <option value="">Select a person</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.lastName}, {p.firstName}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="slds-form-element slds-m-top_small">
        <label className="slds-form-element__label">Program</label>
        <div className="slds-form-element__control">
          <input className="slds-input" value={form.programId||''} onChange={e=>update('programId', e.target.value)} placeholder="Program Id or Code" required/>
        </div>
      </div>

      <div className="slds-form-element slds-m-top_small">
        <label className="slds-form-element__label">Start Date</label>
        <div className="slds-form-element__control">
          <input type="date" className="slds-input" value={form.startDate||''} onChange={e=>update('startDate', e.target.value)}/>
        </div>
      </div>

      <div className="slds-form-element slds-m-top_small">
        <label className="slds-checkbox">
          <input type="checkbox" checked={!!form.consentSigned} onChange={e=>update('consentSigned', e.target.checked)} />
          <span className="slds-checkbox_faux"></span>
          <span className="slds-form-element__label">Consent Signed</span>
        </label>
      </div>

      <div className="slds-form-element slds-m-top_small">
        <label className="slds-form-element__label">Notes</label>
        <div className="slds-form-element__control">
          <textarea className="slds-textarea" value={form.notes||''} onChange={e=>update('notes', e.target.value)} />
        </div>
      </div>

      {issues.length>0 && (
        <div className="slds-text-color_error slds-m-top_small">
          {issues.map((m,i)=><div key={i}>• {m}</div>)}
        </div>
      )}

      <div className="slds-m-top_medium">
        <button className="slds-button slds-button_brand" type="submit">Save Intake</button>
        <span className="slds-m-left_small">{status}</span>
      </div>
    </form>
  )
}
