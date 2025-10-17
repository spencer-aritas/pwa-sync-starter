import { useState, type FormEvent } from "react";
import { v4 as uuid } from "uuid";
import { postSync } from "@/lib/api";

type Person = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthdate?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  ssnLast4?: string;
  hmisId?: string;
  alternateEmail?: string;
  genderIdentity?: string;
  eyeColor?: string;
  hairDescription?: string;
  height?: string;
  weight?: string;
  preferredLanguage?: string;
  translatorNeeded?: boolean;
  notableFeatures?: string;
  genderIdentityOther?: string;
  pronouns?: string;
  pronounsOther?: string;
  raceEthnicity?: string;
  veteranService?: string;
};

const GENDER_OPTIONS = [
  "Man (Boy, if child)",
  "Woman (Girl, if child)",
  "Non-Binary",
  "Cultural Specific Identity (e.g., Two  Spirit)",
  "Questioning",
  "Different Identity",
  "Doesn't Know",
  "Prefers Not to Answer",
  "Data Not Collected",
];

const SF = import.meta.env.VITE_SF_LIGHTNING_DOMAIN as string | undefined;

export default function PersonForm() {
  const [form, setForm] = useState<Partial<Person>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [sfId, setSfId] = useState<string | null>(null);
  const [errs, setErrs] = useState<string[]>([]);

  function update<K extends keyof Person>(k: K, v: Person[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrs([]);
    setMsg("");
    setSfId(null);

    // Validate first
    const issues: string[] = [];
    if (!form.firstName?.trim()) issues.push("First name is required");
    if (!form.lastName?.trim()) issues.push("Last name is required");
    if (issues.length) {
      setErrs(issues);
      return;
    }

    // Build payload once
    const payload = { localId: uuid(), person: form };

    setBusy(true);
    try {
      // Uses Service Worker + Background Sync when offline
      const result = await postSync("/sync/PersonAccount", payload);

      if ("queued" in result) {
        setMsg("Saved (queued to sync)");
      } else {
        setMsg("Saved");
        if ((result as any).salesforceId) setSfId((result as any).salesforceId);
      }
      setForm({});
    } catch (err: any) {
      setErrs([String(err?.message || err)]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="slds-box slds-m-bottom_large">
      <h2 className="slds-text-heading_medium slds-m-bottom_medium">Create Person Account</h2>
      <form className="slds-form" onSubmit={onSubmit}>
        {/* ... your existing form fields unchanged ... */}
        {/* (keep all the inputs you already have) */}

        {errs.length > 0 && (
          <div className="slds-text-color_error slds-m-top_small">
            {errs.map((e, i) => (
              <div key={i}>• {e}</div>
            ))}
          </div>
        )}

        {sfId && SF && (
          <div className="slds-m-top_small">
            <a className="slds-button slds-button_neutral" href={`${SF}/lightning/r/Account/${sfId}/view`} target="_blank">
              Open in Salesforce
            </a>
          </div>
        )}

        <div className="slds-m-top_medium">
          <button className="slds-button slds-button_brand" type="submit" disabled={busy}>
            {busy ? "Submitting..." : "Create Person Account"}
          </button>
          {msg && <span className="slds-m-left_small slds-text-color_success">{msg}</span>}
          {sfId && (
            <div className="slds-m-top_small">
              <span className="slds-badge">Salesforce Id: {sfId}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
