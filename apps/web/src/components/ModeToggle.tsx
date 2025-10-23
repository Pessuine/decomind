import { FC } from 'react';

type Mode = 'do' | 'guide';

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

const ModeToggle: FC<ModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="mode-toggle">
      <button
        className={`mode-button ${mode === 'do' ? 'active' : ''}`}
        onClick={() => onChange('do')}
        type="button"
      >
        做起来模式
      </button>
      <button
        className={`mode-button ${mode === 'guide' ? 'active' : ''}`}
        onClick={() => onChange('guide')}
        type="button"
      >
        怎么做模式
      </button>
    </div>
  );
};

export default ModeToggle;
