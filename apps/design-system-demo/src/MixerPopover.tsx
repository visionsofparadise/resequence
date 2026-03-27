import { Meter, Fader } from '@resequence/design-system';

interface Channel {
  name: string;
  level: number;
  gain: number;
  color: string;
}

const MixerPopover = ({ channels }: { channels: Array<Channel> }) => (
  <div
    style={{
      backgroundColor: 'var(--color-elevated)',
      border: '1px solid var(--color-border)',
      padding: '8px 10px',
      display: 'flex',
      gap: 12,
    }}
  >
    {channels.map((ch) => (
      <div key={ch.name} className="flex flex-col items-center gap-2" style={{ width: 36 }}>
        <div className="flex items-center gap-1" style={{ height: 80 }}>
          <Meter level={ch.level} height={80} />
          <Fader value={ch.gain} label="" height={80} />
        </div>
        <div
          style={{
            width: 6,
            height: 6,
            backgroundColor: ch.color,
            flexShrink: 0,
          }}
        />
        <span className="type-label text-[8px] text-center" style={{ lineHeight: 1.2 }}>
          {ch.name}
        </span>
      </div>
    ))}
  </div>
);

export default MixerPopover;
