"use client";

import { AboutTimeline } from "../AboutTimeline";
import { timelineItems } from "../record";

/** The home page's timeline ruler, on the About page above the month-by-month list. */
export function RecordTimeline() {
  return <AboutTimeline items={timelineItems} focus={null} onScrub={() => {}} />;
}
