import type { FormEvent } from "react";

type RunComposerCardProps = {
  objective: string;
  owner: string;
  templateId: string;
  templates: { id: string; name: string }[];
  onObjectiveChange: (value: string) => void;
  onOwnerChange: (value: string) => void;
  onTemplateChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
};

export default function RunComposerCard({
  objective,
  owner,
  templateId,
  templates,
  onObjectiveChange,
  onOwnerChange,
  onTemplateChange,
  onSubmit,
  onReset
}: RunComposerCardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Run composer</h2>
        <span className="hint">Queue a run with saved defaults.</span>
      </div>
      <form className="composer" onSubmit={onSubmit} aria-label="Run composer">
        <div className="field">
          <label htmlFor="composer-objective">Objective</label>
          <input
            id="composer-objective"
            value={objective}
            onChange={(event) => onObjectiveChange(event.target.value)}
            placeholder="Define the outcome"
            required
          />
        </div>
        <div className="composer-grid">
          <div className="field">
            <label htmlFor="composer-owner">Owner</label>
            <select
              id="composer-owner"
              value={owner}
              onChange={(event) => onOwnerChange(event.target.value)}
            >
              <option value="Ops">Ops</option>
              <option value="Research">Research</option>
              <option value="QA">QA</option>
              <option value="Security">Security</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="composer-template">Template</label>
            <select
              id="composer-template"
              value={templateId}
              onChange={(event) => onTemplateChange(event.target.value)}
            >
              <option value="none">No template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="composer-actions">
          <button className="primary" type="submit">
            Queue run
          </button>
          <button className="ghost" type="button" onClick={onReset}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
