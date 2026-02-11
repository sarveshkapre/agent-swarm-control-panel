import type { RefObject } from "react";
import type { RunTemplate } from "../types";

type RunTemplatesCardProps = {
  templates: RunTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  selectedTemplate: RunTemplate | undefined;
  onQueueTemplate: (template: RunTemplate) => void;
  queueingPaused: boolean;
  onNewTemplate: () => void;
  onEditTemplate: (template: RunTemplate) => void;
  onDuplicateTemplate: (template: RunTemplate) => void;
  onDeleteTemplate: (template: RunTemplate) => void;
  onExportTemplates: () => void;
  onImportTemplatesClick: () => void;
  onImportTemplatesFile: (file: File | null) => void;
  importInputRef: RefObject<HTMLInputElement>;
};

export default function RunTemplatesCard({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  selectedTemplate,
  onQueueTemplate,
  queueingPaused,
  onNewTemplate,
  onEditTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onExportTemplates,
  onImportTemplatesClick,
  onImportTemplatesFile,
  importInputRef
}: RunTemplatesCardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Run templates</h2>
        <div className="header-actions">
          <button className="ghost" onClick={onImportTemplatesClick} type="button">
            Import JSON
          </button>
          <button className="ghost" onClick={onExportTemplates} type="button">
            Export JSON
          </button>
          <button className="ghost" onClick={onNewTemplate} type="button">
            New template
          </button>
        </div>
        <input
          ref={importInputRef}
          className="file-input"
          type="file"
          accept="application/json"
          onChange={(event) => onImportTemplatesFile(event.target.files?.[0] ?? null)}
        />
      </div>
      <div className="template-grid">
        {templates.map((template) => (
          <button
            key={template.id}
            className={`template-card ${template.id === selectedTemplateId ? "active" : ""}`}
            onClick={() => onSelectTemplate(template.id)}
          >
            <div>
              <p className="run-title">{template.name}</p>
              <p className="muted">{template.objective}</p>
            </div>
            <div className="template-meta">
              <span className="pill low">{template.agents.join(" · ")}</span>
              <span className="pill">{template.estCost}</span>
            </div>
          </button>
        ))}
      </div>
      {selectedTemplate ? (
        <div className="template-detail">
          <div className="header-actions">
            <button
              className="ghost"
              type="button"
              onClick={() => onEditTemplate(selectedTemplate)}
            >
              Edit
            </button>
            <button
              className="ghost"
              type="button"
              onClick={() => onDuplicateTemplate(selectedTemplate)}
            >
              Duplicate
            </button>
            <button
              className="ghost"
              type="button"
              onClick={() => onDeleteTemplate(selectedTemplate)}
            >
              Delete
            </button>
          </div>
          <div>
            <p className="muted">Approvals</p>
            <strong>{selectedTemplate.approvals.join(", ")}</strong>
          </div>
          <div>
            <p className="muted">Playbook</p>
            <ol className="stack">
              {selectedTemplate.playbook.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <button
            className="primary"
            onClick={() => onQueueTemplate(selectedTemplate)}
            disabled={queueingPaused}
          >
            Queue from template
          </button>
        </div>
      ) : null}
    </div>
  );
}
