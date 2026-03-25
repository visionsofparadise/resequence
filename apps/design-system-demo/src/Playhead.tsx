interface PlayheadProps {
  beat: number;
  pixelsPerBeat: number;
  height: number | string;
}

const Playhead = ({ beat, pixelsPerBeat, height }: PlayheadProps) => (
  <div
    className="bg-accent-primary absolute top-0 pointer-events-none z-10"
    style={{
      left: beat * pixelsPerBeat,
      width: 1,
      height,
    }}
  />
);

export default Playhead;
