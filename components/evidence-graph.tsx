"use client";

import { useMemo, type ReactNode } from "react";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import type { Workspace } from "@/lib/types";
import styles from "./evidence-graph.module.css";

interface GraphNodeData extends Record<string, unknown> {
  label: ReactNode;
}

function truncate(value: string, length = 128) {
  return value.length <= length ? value : `${value.slice(0, length - 1)}…`;
}

function spreadY(index: number, count: number) {
  if (count <= 1) return 210;
  return 35 + index * Math.max(105, 430 / (count - 1));
}

export function EvidenceGraph({ workspace }: { workspace: Workspace }) {
  const { nodes, edges, hiddenCount } = useMemo(() => {
    const visibleClaims = workspace.claims.slice(0, 10);
    const visibleClaimIds = new Set(visibleClaims.map((claim) => claim.id));

    const linkedSourceIds = new Set(
      workspace.evidenceLinks
        .filter((link) => visibleClaimIds.has(link.claimId))
        .map((link) => link.sourceId),
    );
    const visibleSources = workspace.sources
      .filter((source) => linkedSourceIds.has(source.id))
      .slice(0, 10);
    const visibleSourceIds = new Set(visibleSources.map((source) => source.id));

    const visibleCounterarguments = workspace.counterarguments
      .filter((item) => !item.targetClaimId || visibleClaimIds.has(item.targetClaimId))
      .slice(0, 8);

    const graphNodes: Node<GraphNodeData>[] = [
      ...visibleSources.map((source, index) => ({
        id: `source:${source.id}`,
        position: { x: 0, y: spreadY(index, visibleSources.length) },
        data: {
          label: (
            <div className={styles.nodeContent}>
              <span className={styles.nodeKind}>Source</span>
              <strong>{truncate(source.title, 84)}</strong>
              <small>{source.publisher ?? new URL(source.url).hostname}</small>
            </div>
          ),
        },
        className: `${styles.node} ${styles.sourceNode}`,
        style: { width: 245 },
        ariaRole: "article" as const,
      })),
      ...visibleClaims.map((claim, index) => ({
        id: `claim:${claim.id}`,
        position: { x: 355, y: spreadY(index, visibleClaims.length) },
        data: {
          label: (
            <div className={styles.nodeContent}>
              <span className={styles.nodeKind}>Claim · {claim.stance}</span>
              <strong>{truncate(claim.text)}</strong>
              <small>{Math.round(claim.confidence * 100)}% confidence</small>
            </div>
          ),
        },
        className: `${styles.node} ${styles.claimNode} ${styles[`claim_${claim.stance}`]}`,
        style: { width: 280 },
        ariaRole: "article" as const,
      })),
      ...visibleCounterarguments.map((item, index) => ({
        id: `counter:${item.id}`,
        position: { x: 760, y: spreadY(index, visibleCounterarguments.length) },
        data: {
          label: (
            <div className={styles.nodeContent}>
              <span className={styles.nodeKind}>Counterargument · {item.strength}</span>
              <strong>{truncate(item.text)}</strong>
            </div>
          ),
        },
        className: `${styles.node} ${styles.counterNode}`,
        style: { width: 280 },
        ariaRole: "article" as const,
      })),
    ];

    const evidenceEdges: Edge[] = workspace.evidenceLinks
      .filter((link) => visibleClaimIds.has(link.claimId) && visibleSourceIds.has(link.sourceId))
      .map((link) => ({
        id: `evidence:${link.id}`,
        source: `source:${link.sourceId}`,
        target: `claim:${link.claimId}`,
        type: "smoothstep",
        label: link.relationship,
        markerEnd: { type: MarkerType.ArrowClosed },
        className: `${styles.edge} ${styles[`edge_${link.relationship}`]}`,
      }));

    const counterEdges: Edge[] = visibleCounterarguments
      .filter((item) => item.targetClaimId && visibleClaimIds.has(item.targetClaimId))
      .map((item) => ({
        id: `counter-edge:${item.id}`,
        source: `counter:${item.id}`,
        target: `claim:${item.targetClaimId}`,
        type: "smoothstep",
        label: "challenges",
        markerEnd: { type: MarkerType.ArrowClosed },
        className: `${styles.edge} ${styles.edge_challenges}`,
      }));

    const visibleCount = visibleClaims.length + visibleSources.length + visibleCounterarguments.length;
    const totalCount = workspace.claims.length + workspace.sources.length + workspace.counterarguments.length;

    return {
      nodes: graphNodes,
      edges: [...evidenceEdges, ...counterEdges],
      hiddenCount: Math.max(0, totalCount - visibleCount),
    };
  }, [workspace]);

  if (nodes.length === 0) {
    return <div className={styles.empty}>Add claims and linked sources to build the evidence graph.</div>;
  }

  return (
    <div>
      <div className={styles.legend} aria-label="Evidence graph legend">
        <span>Sources → claims show stored evidence relationships.</span>
        <span>Counterarguments → claims show explicit challenges.</span>
        {hiddenCount > 0 ? <span>{hiddenCount} older items hidden for readability.</span> : null}
      </div>
      <div className={styles.canvas}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.35}
          maxZoom={1.5}
          nodesFocusable
          edgesFocusable
          autoPanOnNodeFocus
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
        >
          <Background gap={24} size={1} />
          <MiniMap pannable zoomable ariaLabel="Evidence graph minimap" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
