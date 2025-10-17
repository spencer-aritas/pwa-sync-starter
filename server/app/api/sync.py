# server/app/api/sync.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Literal, Dict, Any
from ..models.db import SessionLocal
from ..schema import Note, Meta
from ..salesforce.sf_client import _get_token, _api, _sf, get_person_account_record_type_id, create_person_account
from ..sync_runner import SyncRunner
import uuid
import logging

logger = logging.getLogger("sync")

router = APIRouter()
create_program_intake = None  # TODO: Placeholder for create_program_intake function
# ---------------- Existing sync (notes) --------------------------------------
class Mutation(BaseModel):
    from pydantic import Field
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    table: Literal['notes']
    op: Literal['insert','update','delete']
    payload: dict
    clientTs: str
    deviceId: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_next_version(db: Session) -> int:
    rec = db.get(Meta, 'serverVersion')
    v = int(rec.value) if rec else 0
    v += 1
    if rec:
        rec.value = str(v)
    else:
        db.add(Meta(key='serverVersion', value=str(v)))
    return v

@router.post('/sync/upload')
def upload(mutations: List[Mutation], db: Session = Depends(get_db)):
    accepted = []
    serverVersion = None
    for m in mutations:
        if m.table == 'notes':
            note_id = m.payload.get('id')
            if m.op in ('insert','update'):
                n = db.get(Note, note_id) or Note(id=note_id)
                n.enrolleeId = m.payload.get('enrolleeId')
                n.body = m.payload.get('body','')
                n.createdAt = m.payload.get('createdAt')
                n.updatedAt = m.payload.get('updatedAt')
                n.deviceId = m.payload.get('deviceId')
                serverVersion = get_next_version(db)
                n.version = serverVersion
                db.add(n)
            elif m.op == 'delete':
                n = db.get(Note, note_id)
                if n: db.delete(n)
                serverVersion = get_next_version(db)
            accepted.append(m.id)
    db.commit()
    if serverVersion is None:
        serverVersion = int((db.get(Meta, 'serverVersion') or Meta(key='serverVersion', value='0')).value)
    return { 'acceptedIds': accepted, 'serverVersion': serverVersion }

@router.get('/sync/pull')
def pull(since: int = 0, db: Session = Depends(get_db)):
    rows = db.query(Note).filter(Note.version > since).all()
    notes = [{
        'id': r.id,
        'enrolleeId': r.enrolleeId,
        'body': r.body,
        'createdAt': r.createdAt,
        'updatedAt': r.updatedAt,
        'deviceId': r.deviceId,
        'version': r.version
    } for r in rows]
    current = db.get(Meta, 'serverVersion')
    v = int(current.value) if current else 0
    return { 'notes': notes, 'serverVersion': v }

# ---------------- New endpoints for PWA MVP ----------------------------------
class PersonPayload(BaseModel):
    localId: str
    person: Dict[str, Any]  # { firstName, lastName, email, ... }

class IntakePayload(BaseModel):
    localId: str
    intake: Dict[str, Any]  # { personLocalId?, programId, startDate, consentSigned, ... }

@router.post('/sync/PersonAccount')
def sync_person_account(data: PersonPayload):
    data.person["uuid"] = data.localId
    """
    Creates/upserts a Salesforce Person Account and returns the mapping.
    Frontend expects: { localId, salesforceId }
    """
    try:
        sf_id = create_person_account(data.person)  # must return Account Id
        return {"localId": data.localId, "salesforceId": sf_id}
    except Exception as e:
        logger.error(f"SF create_person_account failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={
            "message": "Failed to create Person Account in Salesforce.",
            "error": str(e)
        })

@router.post('/sync/ProgramIntake')
def sync_program_intake(data: IntakePayload):
    """
    Creates a Program Enrollment (or equivalent) in Salesforce.
    Frontend only needs: { ok: true } on success.
    """
    try:
        create_program_intake(data.intake)
    except Exception as e:
        logger.error(f"SF create_program_intake failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={
            "message": "Failed to create Program Intake in Salesforce.",
            "error": str(e)
        })
    # For MVP/dev, succeed even without a live SF client
    return {"ok": True}
# Add sync management endpoints
@router.get('/sync/status')
def get_sync_status():
    """Get current sync status and statistics"""
    try:
        runner = SyncRunner()
        return runner.get_sync_status()
    except Exception as e:
        logger.error(f"Error getting sync status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/sync/run-full')
def run_full_sync():
    """Trigger a full sync from Salesforce"""
    try:
        runner = SyncRunner()
        result = runner.run_full_sync()
        return {"success": True, "counts": result}
    except Exception as e:
        logger.error(f"Full sync failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

sf_router = APIRouter(prefix="/sf", tags=["sf"])

@sf_router.get("/whoami")
def whoami():
    try:
        token, base = _get_token()
        j = _sf(_api("/limits"))
        return {"instance_url": base, "ok": True, "limits": list(j.keys())[:5]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@sf_router.get("/person-rt")
def person_rt():
    try:
        rid = get_person_account_record_type_id()
        return {"recordTypeId": rid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))