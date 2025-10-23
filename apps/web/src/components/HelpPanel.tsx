import { FC } from 'react';
import { HelpType } from 'shared';

interface HelpPanelProps {
  onSelect: (type: HelpType) => void;
  onClose: () => void;
}

const HELP_OPTIONS: Array<{ type: HelpType; label: string; description: string }> = [
  { type: 'simpler', label: '更简单', description: '换成更易上手的方式' },
  { type: 'alternative', label: '换个做法', description: '提供不同路径' },
  { type: 'hint', label: '提示', description: '给出提示或方向' },
  { type: 'smaller', label: '拆小一点', description: '拆解成更小的动作' }
];

const HelpPanel: FC<HelpPanelProps> = ({ onSelect, onClose }) => {
  return (
    <div className="help-panel">
      <h4>遇到困难了吗？</h4>
      <p>选择一种你需要的支持：</p>
      <div className="help-options">
        {HELP_OPTIONS.map((option) => (
          <button
            key={option.type}
            type="button"
            className="help-option"
            onClick={() => onSelect(option.type)}
          >
            <strong>{option.label}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
      <button type="button" className="link" onClick={onClose}>
        先继续试试
      </button>
    </div>
  );
};

export default HelpPanel;
