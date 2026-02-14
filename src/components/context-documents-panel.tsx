"use client";

import { Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export type ContextDocumentDraft = {
  id: string;
  label: string;
  path: string;
  priority: number;
  content: string;
};

type ContextDocumentsPanelProps = {
  documents: ContextDocumentDraft[];
  onChange: (next: ContextDocumentDraft[]) => void;
};

function createEmptyContextDocument(seed: number): ContextDocumentDraft {
  return {
    id: `context-${seed}`,
    label: "",
    path: "",
    priority: 5,
    content: "",
  };
}

export function ContextDocumentsPanel({ documents, onChange }: ContextDocumentsPanelProps) {
  function updateDocument(id: string, patch: Partial<ContextDocumentDraft>) {
    onChange(
      documents.map((doc) => {
        if (doc.id !== id) {
          return doc;
        }
        return {
          ...doc,
          ...patch,
        };
      }),
    );
  }

  function addDocument() {
    onChange([...documents, createEmptyContextDocument(Date.now())]);
  }

  function removeDocument(id: string) {
    onChange(documents.filter((doc) => doc.id !== id));
  }

  return (
    <Card className="panel-glow border-border/50 bg-card/75">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-sm font-semibold uppercase tracking-widest font-display">
            Project Context
          </CardTitle>
          <CardDescription className="text-xs">
            Optional: include AGENTS, rules, or workflow snippets for cross-document checks.
          </CardDescription>
        </div>
        <Badge variant="outline" className="font-mono text-[10px]">
          {documents.length} docs
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.length === 0 ? (
          <p className="rounded-md border border-border/40 bg-background/40 p-3 text-xs italic text-muted-foreground">
            No context documents added.
          </p>
        ) : (
          documents.map((doc, index) => (
            <article key={doc.id} className="space-y-2 rounded-md border border-border/40 bg-background/45 p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_120px_auto]">
                <input
                  value={doc.label}
                  onChange={(event) => updateDocument(doc.id, { label: event.target.value })}
                  placeholder={`Document ${index + 1} label`}
                  className="h-9 rounded-md border border-border/60 bg-background/70 px-2 text-xs outline-none ring-offset-background placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/40"
                />
                <input
                  value={doc.path}
                  onChange={(event) => updateDocument(doc.id, { path: event.target.value })}
                  placeholder="Path (optional)"
                  className="h-9 rounded-md border border-border/60 bg-background/70 px-2 text-xs outline-none ring-offset-background placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/40"
                />
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={doc.priority}
                  onChange={(event) => {
                    const parsed = Number(event.target.value);
                    updateDocument(doc.id, {
                      priority: Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 10) : 5,
                    });
                  }}
                  className="h-9 rounded-md border border-border/60 bg-background/70 px-2 text-xs outline-none ring-offset-background placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/40"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeDocument(doc.id)}
                  aria-label={`Remove context document ${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <Textarea
                value={doc.content}
                onChange={(event) => updateDocument(doc.id, { content: event.target.value })}
                placeholder="Paste context artifact content..."
                className="h-28 resize-y rounded-md border-border/60 bg-background/70 font-mono text-xs"
              />
            </article>
          ))
        )}

        <Button type="button" variant="secondary" onClick={addDocument} className="gap-2">
          <Plus className="size-4" />
          Add Context Document
        </Button>
      </CardContent>
    </Card>
  );
}

export function normalizeContextDocuments(docs: ContextDocumentDraft[]) {
  return docs
    .map((doc) => ({
      label: doc.label.trim() || "context-document",
      path: doc.path.trim() || undefined,
      priority: Number.isFinite(doc.priority) ? doc.priority : 5,
      content: doc.content.trim(),
    }))
    .filter((doc) => doc.content.length > 0);
}
