import { FC, useEffect, useMemo, useState } from 'react';
import { StepInstruction, HelpType } from 'shared';
import '../styles/app.css';
import ModeToggle from '../components/ModeToggle.js';
import StepCard from '../components/StepCard.js';
import HelpPanel from '../components/HelpPanel.js';
import {
  executeStep,
  requestHelp,
  skipAction,
  fetchGuide,
  sendConsent,
  sendFeedback
} from '../services/api.js';

const generateSessionId = () => crypto.randomUUID();

type Mode = 'do' | 'guide';

const App: FC = () => {
  const [mode, setMode] = useState<Mode>('do');
  const [sessionId] = useState<string>(generateSessionId);
  const [task, setTask] = useState('');
  const [context, setContext] = useState('');
  const [currentStep, setCurrentStep] = useState<StepInstruction | null>(null);
  const [history, setHistory] = useState<StepInstruction[]>([]);
  const [outline, setOutline] = useState<
    Array<{ title: string; description: string; steps: StepInstruction[] }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpResult, setHelpResult] =
    useState<{ strategy: string; recommendation: string; confidence?: number } | null>(null);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentId, setConsentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (consentAccepted && !consentId) {
      sendConsent({ userId: sessionId, accepted: true })
        .then((response) => setConsentId(response.consentId))
        .catch(() => {
          setError('无法保存体验许可');
        });
    }
    if (!consentAccepted && consentId) {
      sendConsent({ userId: sessionId, accepted: false })
        .then(() => setConsentId(null))
        .catch(() => {
          setError('无法更新体验许可');
        });
    }
  }, [consentAccepted, consentId, sessionId]);

  const startTask = async () => {
    setLoading(true);
    setError(null);
    setHelpResult(null);
    let baseHistory: StepInstruction[] = history;
    if (mode === 'do') {
      baseHistory = [];
      setHistory([]);
      setCurrentStep(null);
    } else {
      setOutline([]);
    }
    try {
      if (mode === 'do') {
        const result = await executeStep({
          sessionId,
          task,
          context,
          history: baseHistory,
          consentId: consentId ?? undefined
        });
        setCurrentStep(result.nextStep);
        setHistory([result.nextStep]);
      } else {
        const result = await fetchGuide({ task, context, consentId: consentId ?? undefined });
        setOutline(result.outline);
      }
    } catch (apiError) {
      setError((apiError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const requestNextStep = async () => {
    if (!task) {
      return;
    }
    setLoading(true);
    setError(null);
    setHelpResult(null);
    try {
      const result = await executeStep({
        sessionId,
        task,
        context,
        history,
        consentId: consentId ?? undefined
      });
      setCurrentStep(result.nextStep);
      setHistory((prev) => [...prev, result.nextStep]);
    } catch (apiError) {
      setError((apiError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const completeCurrentStep = async () => {
    if (!currentStep) {
      return;
    }
    setHistory((prev) =>
      prev.map((step) => (step.id === currentStep.id ? { ...step, status: 'complete' } : step))
    );
    await requestNextStep();
  };

  const handleHelp = () => {
    setShowHelpPanel(true);
  };

  const handleHelpSelect = async (type: HelpType) => {
    if (!currentStep) {
      return;
    }
    setLoading(true);
    setError(null);
    setHelpResult(null);
    try {
      const result = await requestHelp({
        sessionId,
        task,
        stepId: currentStep.id,
        helpType: type,
        context,
        consentId: consentId ?? undefined
      });
      setHelpResult({
        strategy: result.strategy,
        recommendation: result.recommendation,
        confidence: result.confidence
      });
    } catch (apiError) {
      setError((apiError as Error).message);
    } finally {
      setLoading(false);
      setShowHelpPanel(false);
    }
  };

  const handleSkip = async () => {
    if (!currentStep) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setHistory((prev) =>
        prev.map((step) => (step.id === currentStep.id ? { ...step, status: 'skipped' } : step))
      );
      const result = await skipAction({
        sessionId,
        task,
        stepId: currentStep.id,
        consentId: consentId ?? undefined
      });
      setCurrentStep(result.replacementStep);
      setHistory((prev) => [...prev, result.replacementStep]);
    } catch (apiError) {
      setError((apiError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sendUserFeedback = async () => {
    if (!feedback.trim()) {
      return;
    }
    try {
      await sendFeedback({ message: feedback, sessionId, userId: sessionId });
      setFeedback('');
      setFeedbackSent(true);
    } catch (apiError) {
      setError((apiError as Error).message);
    }
  };

  useEffect(() => {
    if (mode === 'guide') {
      setCurrentStep(null);
      setHistory([]);
    } else {
      setOutline([]);
    }
  }, [mode]);

  const historyList = useMemo(
    () =>
      history.map((step) => (
        <li key={step.id} className={step.status === 'complete' ? 'done' : ''}>
          {step.action}
        </li>
      )),
    [history]
  );

  return (
    <div className="app-shell">
      <header className="hero">
        <h1>分解力 · 让复杂任务拆解成简单行动</h1>
        <p>切换模式获取实时行动步骤或结构化指导，遇到困难随时求助。</p>
      </header>
      <main className="content">
        <section className="card">
          <ModeToggle mode={mode} onChange={setMode} />
          <label className="input-label" htmlFor="task">
            你的任务
          </label>
          <textarea
            id="task"
            value={task}
            onChange={(event) => setTask(event.target.value)}
            placeholder="例如：准备一份产品发布计划"
          />
          <label className="input-label" htmlFor="context">
            补充信息（可选）
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(event) => setContext(event.target.value)}
            placeholder="写下背景、目标或限制条件"
          />
          <label className="consent">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(event) => setConsentAccepted(event.target.checked)}
            />
            我同意用于体验改进的匿名化分析
          </label>
          <button
            type="button"
            className="primary start"
            onClick={startTask}
            disabled={loading || !task}
          >
            {loading ? '处理中...' : '开始拆解'}
          </button>
          {error ? <div className="error">{error}</div> : null}
        </section>

        {mode === 'do' ? (
          <section className="card">
            <h2>当前行动</h2>
            {currentStep ? (
              <StepCard
                step={currentStep}
                onComplete={completeCurrentStep}
                onHelp={handleHelp}
                onSkip={handleSkip}
              />
            ) : (
              <p className="placeholder">先输入任务并点击开始。</p>
            )}
            {helpResult ? (
              <div className="help-result">
                <h4>{helpResult.strategy}</h4>
                <p>{helpResult.recommendation}</p>
                {'confidence' in helpResult ? (
                  <span className="confidence">信心指数：{(helpResult as { confidence?: number }).confidence?.toFixed(2) ?? '—'}</span>
                ) : null}
              </div>
            ) : null}
            {showHelpPanel ? (
              <HelpPanel onSelect={handleHelpSelect} onClose={() => setShowHelpPanel(false)} />
            ) : null}
            <div className="history">
              <h3>历史步骤</h3>
              <ol>{historyList}</ol>
            </div>
          </section>
        ) : (
          <section className="card">
            <h2>执行大纲</h2>
            {outline.length === 0 ? (
              <p className="placeholder">输入任务并点击开始查看结构化指导。</p>
            ) : (
              <div className="outline">
                {outline.map((item, index) => (
                  <div key={item.title} className="outline-section">
                    <div className="outline-index">{index + 1}</div>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <ul>
                        {item.steps.map((step) => (
                          <li key={step.id}>{step.action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="card feedback">
          <h2>反馈</h2>
          <p>告诉我们你的体验，帮助分解力持续改进。</p>
          <textarea
            value={feedback}
            onChange={(event) => {
              setFeedback(event.target.value);
              setFeedbackSent(false);
            }}
            placeholder="留下建议或想法"
          />
          <button type="button" onClick={sendUserFeedback} disabled={!feedback.trim()}>
            提交反馈
          </button>
          {feedbackSent ? <span className="success">感谢反馈！</span> : null}
        </section>
      </main>
      <footer className="footer">© {new Date().getFullYear()} 分解力 Decompo</footer>
    </div>
  );
};

export default App;
