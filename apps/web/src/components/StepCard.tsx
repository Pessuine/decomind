import { FC } from 'react';
import { StepInstruction } from 'shared';

interface StepCardProps {
  step: StepInstruction;
  onComplete: () => void;
  onHelp: () => void;
  onSkip: () => void;
}

const StepCard: FC<StepCardProps> = ({ step, onComplete, onHelp, onSkip }) => {
  return (
    <div className="step-card">
      <h3>{step.title}</h3>
      <p>{step.action}</p>
      {step.details ? <span className="step-details">{step.details}</span> : null}
      <div className="step-actions">
        <button type="button" className="primary" onClick={onComplete}>
          完成这一步
        </button>
        <button type="button" onClick={onHelp}>
          遇到困难
        </button>
        <button type="button" onClick={onSkip}>
          换个做法
        </button>
      </div>
    </div>
  );
};

export default StepCard;
