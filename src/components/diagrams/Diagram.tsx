"use client";

import type { DiagramId } from "../projects";
import { BellPair } from "./BellPair";
import { FleetAverage } from "./FleetAverage";
import { PacketFlow } from "./PacketFlow";
import styles from "./Diagram.module.css";

/**
 * An animated diagram by name, with its own controls; `fit` fills the closer look instead of
 * the story's width, and `onOpen` (in the story) opens the closer look.
 */
export function Diagram({
  id,
  fit,
  onOpen,
}: {
  id: DiagramId;
  fit?: boolean;
  onOpen?: () => void;
}) {
  const className = fit ? styles.fit : undefined;
  switch (id) {
    case "packet-flow":
      return <PacketFlow className={className} onOpen={onOpen} />;
    case "bell-pair":
      return <BellPair className={className} onOpen={onOpen} />;
    case "fleet-average":
      return <FleetAverage className={className} onOpen={onOpen} />;
  }
}
