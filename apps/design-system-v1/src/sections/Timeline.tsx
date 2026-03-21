import DemoSection from "@/components/DemoSection";
import { AutomationCurve } from "@/components/timeline/AutomationCurve";
import { PianoRoll } from "@/components/timeline/PianoRoll";
import { Playhead } from "@/components/timeline/Playhead";
import { TimelineRuler } from "@/components/timeline/TimelineRuler";
import { WaveformDisplay } from "@/components/timeline/WaveformDisplay";

function ComposedTimeline() {
  return (
    <div className="relative overflow-hidden rounded-[4px] border border-border-default">
      <TimelineRuler />
      <PianoRoll />
      <AutomationCurve height={80} />
      <Playhead animated />
    </div>
  );
}

export default function Timeline() {
  return (
    <div>
      <DemoSection
        id="piano-roll"
        title="Composed Timeline"
        description="Timeline ruler, piano roll grid, and automation curve stacked with animated playhead overlay."
      >
        <ComposedTimeline />
      </DemoSection>

      <DemoSection
        id="curves"
        title="Automation Curve"
        description="Bezier curve through keyframe points with gradient fill below."
      >
        <AutomationCurve height={120} />
      </DemoSection>

      <DemoSection
        id="ruler"
        title="Timeline Ruler"
        description="Bar numbers with beat and subdivision tick marks."
      >
        <TimelineRuler />
      </DemoSection>

      <DemoSection
        id="waveform"
        title="Waveform Display"
        description="Synthetic waveform with amplitude envelope, mirrored above and below centerline."
      >
        <WaveformDisplay height={100} />
      </DemoSection>
    </div>
  );
}
