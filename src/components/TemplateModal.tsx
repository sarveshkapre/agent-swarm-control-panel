import type { Dispatch, RefObject, SetStateAction } from "react";

type TemplateDraft = {
  mode: "create" | "edit";
  id: string | null;
  name: string;
  objective: string;
  agentsText: string;
  approvalsText: string;
  estCost: string;
  playbookText: string;
};

type TemplateModalProps = {
  draft: TemplateDraft;
  setDraft: Dispatch<SetStateAction<TemplateDraft>>;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  panelRef: RefObject<HTMLDivElement>;
};

export type { TemplateDraft };

export default function TemplateModal({
  draft,
  setDraft,
  onClose,
  onSave,
  onDelete,
  panelRef
}: TemplateModalProps) {
  const title = draft.mode === "edit" ? "Edit template" : "New template";

  return (
    <div className="modal">
      <button
        className="overlay-close"
        type="button"
        aria-label="Close template editor"
        onClick={onClose}
      />
      <div
        className="modal-panel"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-title"
      >
        <div className="drawer-header">
          <h2 id="template-title">{title}</h2>
          <div className="header-actions">
            {onDelete ? (
              <button className="ghost" type="button" onClick={onDelete}>
                Delete
              </button>
            ) : null}
            <button className="ghost" onClick={onClose} type="button">
              Close
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="field">
            <label htmlFor="tpl-name">Name</label>
            <input
              id="tpl-name"
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Template name"
            />
          </div>

          <div className="field">
            <label htmlFor="tpl-objective">Objective</label>
            <textarea
              id="tpl-objective"
              value={draft.objective}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, objective: event.target.value }))
              }
              rows={2}
              placeholder="What outcome should this run achieve?"
            />
          </div>

          <div className="field">
            <label htmlFor="tpl-agents">Agents (comma or newline separated)</label>
            <textarea
              id="tpl-agents"
              value={draft.agentsText}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, agentsText: event.target.value }))
              }
              rows={2}
              placeholder="Researcher, Coder, Tester"
            />
          </div>

          <div className="field">
            <label htmlFor="tpl-approvals">Approvals (comma or newline separated)</label>
            <textarea
              id="tpl-approvals"
              value={draft.approvalsText}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, approvalsText: event.target.value }))
              }
              rows={2}
              placeholder="Repo write, External HTTP"
            />
          </div>

          <div className="field">
            <label htmlFor="tpl-cost">Est. cost</label>
            <input
              id="tpl-cost"
              value={draft.estCost}
              onChange={(event) => setDraft((prev) => ({ ...prev, estCost: event.target.value }))}
              placeholder="$3-5"
            />
          </div>

          <div className="field">
            <label htmlFor="tpl-playbook">Playbook steps (one per line)</label>
            <textarea
              id="tpl-playbook"
              value={draft.playbookText}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, playbookText: event.target.value }))
              }
              rows={5}
              placeholder={"Kickoff checklist\nImplement UI + tests\nQA validation + evidence pack"}
            />
          </div>

          <div className="header-actions">
            <button className="primary" type="button" onClick={onSave}>
              Save template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

