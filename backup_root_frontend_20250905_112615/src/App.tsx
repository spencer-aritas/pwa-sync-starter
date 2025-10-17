// src/App.tsx
import React, { useEffect } from 'react'
import PersonForm from './features/person/PersonForm'
import ProgramIntakeForm from './features/intake/ProgramIntakeForm'
import { startPolling, registerSyncEvents } from './lib/sync'

export default function App() {
  useEffect(() => {
    registerSyncEvents()
    const id = startPolling(30_000) // 30s for MVP
    return () => clearInterval(id)
  }, [])

  const [tab, setTab] = React.useState<'person'|'intake'>('person')

  return (
    <div className="slds">
      <header className="slds-page-header slds-p-around_medium">
        <div className="slds-media">
          <div className="slds-media__figure">
            <span className="slds-icon_container slds-icon-standard-contact" title="contact">
              <svg className="slds-icon slds-icon_small" aria-hidden="true">
                <use xlinkHref="/icons/standard-sprite/svg/symbols.svg#contact"></use>
              </svg>
            </span>
          </div>
          <div className="slds-media__body">
            <h1 className="slds-page-header__title slds-truncate">TGTHR PWA — MVP</h1>
            <p className="slds-page-header__info">Local‑first data collection • SLDS‑styled</p>
          </div>
        </div>
      </header>

      <div className="slds-grid slds-gutters slds-p-horizontal_medium">
        <div className="slds-col slds-size_1-of-1">
          <div className="slds-button-group" role="group">
            <button className={"slds-button " + (tab==='person'?'slds-button_brand':'slds-button_neutral')} onClick={()=>setTab('person')}>Person</button>
            <button className={"slds-button " + (tab==='intake'?'slds-button_brand':'slds-button_neutral')} onClick={()=>setTab('intake')}>Program Intake</button>
          </div>
          <div className="slds-m-top_medium">
            {tab==='person' ? <PersonForm/> : <ProgramIntakeForm/>}
          </div>
        </div>
      </div>
    </div>
  )
}
