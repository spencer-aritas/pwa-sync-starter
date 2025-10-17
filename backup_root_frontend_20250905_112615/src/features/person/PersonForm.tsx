// src/features/person/PersonForm.tsx
import React, { useState } from 'react'
import { Orchestrator } from '../../agents/orchestrator'
import { db } from '../../lib/db'

export default function PersonForm() {
  const [form, setForm] = useState<any>({})
  const [status, setStatus] = useState<string>('')
  const [issues, setIssues] = useState<string[]>([])

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('Submitting...'); setIssues([])
    const res = await Orchestrator.createPerson(form)
    if (!res.ok) { setIssues(res.issues); setStatus(''); return }
    await db.persons.add(res.value)
    setStatus('Saved locally. Will sync when online.')
    setForm({})
  }

  return (
    <form className="slds-form slds-p-around_medium" onSubmit={handleSubmit}>
      <div className="slds-grid slds-wrap slds-gutters">
        <div className="slds-col slds-size_1-of-2">
          <div className="slds-form-element">
            <label className="slds-form-element__label">First Name</label>
            <div className="slds-form-element__control">
              <input className="slds-input" value={form.firstName||''} onChange={e=>update('firstName', e.target.value)} required/>
            </div>
          </div>
        </div>
        <div className="slds-col slds-size_1-of-2">
          <div className="slds-form-element">
            <label className="slds-form-element__label">Last Name</label>
            <div className="slds-form-element__control">
              <input className="slds-input" value={form.lastName||''} onChange={e=>update('lastName', e.target.value)} required/>
            </div>
          </div>
        </div>
        <div className="slds-col slds-size_1-of-2">
          <div className="slds-form-element">
            <label className="slds-form-element__label">Email</label>
            <div className="slds-form-element__control">
              <input type="email" className="slds-input" value={form.email||''} onChange={e=>update('email', e.target.value)}/>
            </div>
          </div>
        </div>
        <div className="slds-col slds-size_1-of-2">
          <div className="slds-form-element">
            <label className="slds-form-element__label">Phone</label>
            <div className="slds-form-element__control">
              <input className="slds-input" value={form.phone||''} onChange={e=>update('phone', e.target.value)}/>
            </div>
          </div>
        </div>
        <div className="slds-col slds-size_1-of-2">
          <div className="slds-form-element">
            <label className="slds-form-element__label">Birthdate</label>
            <div className="slds-form-element__control">
              <input type="date" className="slds-input" value={form.birthdate||''} onChange={e=>update('birthdate', e.target.value)}/>
            </div>
          </div>
        </div>
        <div className="slds-col slds-size_1-of-2">
          <div className="slds-form-element">
            <label className="slds-form-element__label">Street</label>
            <div className="slds-form-element__control">
              <input className="slds-input" value={form.street||''} onChange={e=>update('street', e.target.value)}/>
            </div>
          </div>
        </div>
        <div className="slds-col slds-size_1-of-2">
          <div className="slds-form-element">
            <label className="slds-form-element__label">City</label>
            <div className="slds-form-element__control">
              <input className="slds-input" value={form.city||''} onChange={e=>update('city', e.target.value)}/>
            </div>
          </div>
        </div>
        <div className="slds-col slds-size_1-of-4">
          <div className="slds-form-element">
            <label className="slds-form-element__label">State</label>
            <div className="slds-form-element__control">
              <input className="slds-input" value={form.state||''} onChange={e=>update('state', e.target.value)}/>
            </div>
          </div>
        </div>
        <div className="slds-col slds-size_1-of-4">
          <div className="slds-form-element">
            <label className="slds-form-element__label">Postal Code</label>
            <div className="slds-form-element__control">
              <input className="slds-input" value={form.postalCode||''} onChange={e=>update('postalCode', e.target.value)}/>
            </div>
          </div>
        </div>
      </div>
      {issues.length>0 && (
        <div className="slds-text-color_error slds-m-top_small">
          {issues.map((m,i)=><div key={i}>• {m}</div>)}
        </div>
      )}
      <div className="slds-m-top_medium">
        <button className="slds-button slds-button_brand" type="submit">Save Person</button>
        <span className="slds-m-left_small">{status}</span>
      </div>
    </form>
  )
}
