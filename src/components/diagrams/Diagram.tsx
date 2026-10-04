"use client";

import type { DiagramId } from "../projects";
import { BellPair } from "./BellPair";
import { CurlCount } from "./CurlCount";
import { FeedStyles } from "./FeedStyles";
import { FleetAverage } from "./FleetAverage";
import { NovaCards } from "./NovaCards";
import { NovaHome } from "./NovaHome";
import { PacketFlow } from "./PacketFlow";
import { RaoJoin } from "./RaoJoin";
import { QuoteFlow } from "./QuoteFlow";
import { SignInFlow } from "./SignInFlow";
import { SubmissionFlow } from "./SubmissionFlow";
import {
  AmeroSystem,
  MutinySystem,
  NovaSystem,
  RaoSystem,
  SpotmiesSystem,
  TmnSystem,
} from "./SystemCard";
import { TwoScripts } from "./TwoScripts";
import styles from "./Diagram.module.css";

/** The diagrams drawn on a phone screen (tall): the TL;DR panel sizes them by height. */
const PHONE: DiagramId[] = [
  "submission-flow",
  "quote-flow",
  "sign-in-flow",
  "two-scripts",
  "feed-styles",
  "nova-home",
  "nova-cards",
  "rao-join",
];
export const isPhoneDiagram = (id: DiagramId) => PHONE.includes(id);

/** The older lab diagrams, drawn for a wide screen; the rest are widgets, sized like a card. */
const WIDE: DiagramId[] = ["packet-flow", "bell-pair", "fleet-average"];
export const isCompactDiagram = (id: DiagramId) => !WIDE.includes(id);

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
    case "submission-flow":
      return <SubmissionFlow className={className} onOpen={onOpen} />;
    case "quote-flow":
      return <QuoteFlow className={className} onOpen={onOpen} />;
    case "sign-in-flow":
      return <SignInFlow className={className} onOpen={onOpen} />;
    case "two-scripts":
      return <TwoScripts className={className} onOpen={onOpen} />;
    case "feed-styles":
      return <FeedStyles className={className} onOpen={onOpen} />;
    case "tmn-system":
      return <TmnSystem className={className} onOpen={onOpen} />;
    case "nova-home":
      return <NovaHome className={className} onOpen={onOpen} />;
    case "nova-cards":
      return <NovaCards className={className} onOpen={onOpen} />;
    case "nova-system":
      return <NovaSystem className={className} onOpen={onOpen} />;
    case "rao-join":
      return <RaoJoin className={className} onOpen={onOpen} />;
    case "rao-system":
      return <RaoSystem className={className} onOpen={onOpen} />;
    case "curl-count":
      return <CurlCount className={className} onOpen={onOpen} />;
    case "amero-system":
      return <AmeroSystem className={className} onOpen={onOpen} />;
    case "mutiny-system":
      return <MutinySystem className={className} onOpen={onOpen} />;
    case "spotmies-system":
      return <SpotmiesSystem className={className} onOpen={onOpen} />;
  }
}
