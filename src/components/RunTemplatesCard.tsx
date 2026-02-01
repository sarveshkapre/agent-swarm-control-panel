type Template = {
  id: string;
  name: string;
  objective: string;
  agents: string[];
  approvals: string[];
  estCost: string;
  playbook: string[];
};

type RunTemplatesCardProps = {
  templates: Template[];
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  selectedTemplate: Template | undefined;
  onQueueTemplate: (template: Template) => void;
  onNewTemplate: () => void;
};

export default function RunTemplatesCard({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  selectedTemplate,
  onQueueTemplate,
  onNewTemplate
}: RunTemplatesCardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Run templates</h2>
        <button className="ghost" onClick={onNewTemplate} type="button">
          New template
        </button>
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
          <button className="primary" onClick={() => onQueueTemplate(selectedTemplate)}>
            Queue from template
          </button>
        </div>
      ) : null}
    </div>
  );
}
