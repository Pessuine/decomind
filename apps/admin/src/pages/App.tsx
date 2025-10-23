import { FC, useEffect, useMemo, useState } from 'react';
import {
  login as loginApi,
  fetchDashboard,
  fetchPrompts,
  savePrompt,
  fetchModelSettings,
  saveModelSetting,
  fetchRequestLogs,
  fetchAiCalls,
  fetchSysConfig,
  saveSysConfig
} from '../services/api.js';
import '../styles/app.css';

type View = 'dashboard' | 'prompts' | 'models' | 'logs' | 'config';

interface PromptItem {
  id: string;
  name: string;
  description: string;
  activeVersion?: { content: string | null } | null;
}

interface ModelSettingItem {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  temperature: number;
  isActive: boolean;
}

interface ModelFormState extends ModelSettingItem {
  apiKey: string;
}

interface RequestLogItem {
  id: string;
  createdAt: string;
  summary: string;
  status: number;
  host: string;
}

interface AiCallItem {
  id: string;
  createdAt: string;
  success: boolean;
  modelSettingId: string;
  modelSetting?: { name: string } | null;
}

const App: FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [dashboard, setDashboard] = useState<{
    requestCount: number;
    aiCallCount: number;
    feedbackCount: number;
    consentCount: number;
  } | null>(null);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [promptSystem, setPromptSystem] = useState('');
  const [promptUser, setPromptUser] = useState('');
  const [promptDescription, setPromptDescription] = useState('');
  const [promptName, setPromptName] = useState('');
  const [models, setModels] = useState<ModelSettingItem[]>([]);
  const [modelForm, setModelForm] = useState<ModelFormState>({
    id: '',
    name: '',
    baseUrl: '',
    apiKey: '',
    model: '',
    temperature: 0.6,
    isActive: false
  });
  const [requestLogs, setRequestLogs] = useState<RequestLogItem[]>([]);
  const [aiCalls, setAiCalls] = useState<AiCallItem[]>([]);
  const [sysConfig, setSysConfig] = useState<Array<{ key: string; value: string }>>([]);
  const [saving, setSaving] = useState(false);

  const authenticated = Boolean(token);

  const performLogin = async () => {
    try {
      const result = await loginApi(password);
      setToken(result.token);
      setPassword('');
      setError(null);
    } catch (apiError) {
      setError((apiError as Error).message);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }
    const loadData = async () => {
      try {
        if (view === 'dashboard') {
          const stats = await fetchDashboard(token);
          setDashboard(stats);
        }
        if (view === 'prompts') {
          const list = (await fetchPrompts(token)) as PromptItem[];
          setPrompts(list);
        }
        if (view === 'models') {
          const list = (await fetchModelSettings(token)) as ModelSettingItem[];
          setModels(list);
        }
        if (view === 'logs') {
          const [reqLogs, aiLogList] = await Promise.all([
            fetchRequestLogs(token),
            fetchAiCalls(token)
          ]);
          setRequestLogs(reqLogs as RequestLogItem[]);
          setAiCalls(aiLogList as AiCallItem[]);
        }
        if (view === 'config') {
          const configList = await fetchSysConfig(token);
          setSysConfig(configList);
        }
      } catch (apiError) {
        setError((apiError as Error).message);
      }
    };
    void loadData();
  }, [token, view]);

  useEffect(() => {
    if (!selectedPromptId) {
      setPromptName('');
      setPromptDescription('');
      setPromptSystem('');
      setPromptUser('');
      return;
    }
    const prompt = prompts.find((item) => item.id === selectedPromptId);
    if (!prompt) {
      return;
    }
    setPromptName(prompt.name);
    setPromptDescription(prompt.description);
    if (prompt.activeVersion?.content) {
      try {
        const parsed = JSON.parse(prompt.activeVersion.content) as { system: string; user: string };
        setPromptSystem(parsed.system);
        setPromptUser(parsed.user);
      } catch (parseError) {
        setPromptSystem('');
        setPromptUser('');
      }
    }
  }, [selectedPromptId, prompts]);

  const savePromptChanges = async () => {
    if (!token) {
      return;
    }
    setSaving(true);
    try {
      await savePrompt(token, {
        id: selectedPromptId ?? undefined,
        name: promptName,
        description: promptDescription,
        content: { system: promptSystem, user: promptUser }
      });
      const list = (await fetchPrompts(token)) as PromptItem[];
      setPrompts(list);
      setError(null);
    } catch (apiError) {
      setError((apiError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const saveModel = async () => {
    if (!token) {
      return;
    }
    setSaving(true);
    try {
      await saveModelSetting(token, {
        id: modelForm.id || undefined,
        name: modelForm.name,
        baseUrl: modelForm.baseUrl,
        apiKey: modelForm.apiKey,
        model: modelForm.model,
        temperature: Number(modelForm.temperature),
        isActive: modelForm.isActive
      });
      const list = (await fetchModelSettings(token)) as ModelSettingItem[];
      setModels(list);
      setError(null);
    } catch (apiError) {
      setError((apiError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const saveConfig = async () => {
    if (!token) {
      return;
    }
    setSaving(true);
    try {
      await saveSysConfig(token, sysConfig);
      setError(null);
    } catch (apiError) {
      setError((apiError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const navigation = useMemo(
    () => (
      <nav className="sidebar">
        <h1>分解力控制台</h1>
        <button type="button" className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>
          仪表盘
        </button>
        <button type="button" className={view === 'prompts' ? 'active' : ''} onClick={() => setView('prompts')}>
          提示词管理
        </button>
        <button type="button" className={view === 'models' ? 'active' : ''} onClick={() => setView('models')}>
          模型配置
        </button>
        <button type="button" className={view === 'logs' ? 'active' : ''} onClick={() => setView('logs')}>
          日志审计
        </button>
        <button type="button" className={view === 'config' ? 'active' : ''} onClick={() => setView('config')}>
          系统设置
        </button>
        <button type="button" className="logout" onClick={() => setToken(null)}>
          退出
        </button>
      </nav>
    ),
    [view]
  );

  if (!authenticated) {
    return (
      <div className="login-container">
        <h1>分解力控制台登录</h1>
        <div className="login-card">
          <label htmlFor="password">管理员密码</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="输入管理员密码"
          />
          <button type="button" onClick={performLogin} disabled={!password}>
            登录
          </button>
          {error ? <div className="error">{error}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {navigation}
      <main className="workspace">
        {error ? <div className="error">{error}</div> : null}
        {view === 'dashboard' && dashboard ? (
          <section className="panel-grid">
            <div className="panel">
              <span className="panel-label">请求总量</span>
              <strong>{dashboard.requestCount}</strong>
            </div>
            <div className="panel">
              <span className="panel-label">模型调用</span>
              <strong>{dashboard.aiCallCount}</strong>
            </div>
            <div className="panel">
              <span className="panel-label">反馈</span>
              <strong>{dashboard.feedbackCount}</strong>
            </div>
            <div className="panel">
              <span className="panel-label">Consent</span>
              <strong>{dashboard.consentCount}</strong>
            </div>
          </section>
        ) : null}

        {view === 'prompts' ? (
          <section className="panel">
            <h2>提示词列表</h2>
            <div className="prompt-list">
              <ul>
                {prompts.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => setSelectedPromptId(item.id)}>
                      <strong>{item.name}</strong>
                      <span>{item.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="prompt-editor">
              <label>名称</label>
              <input value={promptName} onChange={(event) => setPromptName(event.target.value)} />
              <label>描述</label>
              <input value={promptDescription} onChange={(event) => setPromptDescription(event.target.value)} />
              <label>System Prompt</label>
              <textarea value={promptSystem} onChange={(event) => setPromptSystem(event.target.value)} />
              <label>User Prompt</label>
              <textarea value={promptUser} onChange={(event) => setPromptUser(event.target.value)} />
              <button type="button" onClick={savePromptChanges} disabled={saving}>
                保存并启用
              </button>
            </div>
          </section>
        ) : null}

        {view === 'models' ? (
          <section className="panel">
            <h2>模型配置</h2>
            <div className="model-list">
              <ul>
                {models.map((model) => (
                  <li key={model.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setModelForm({
                          id: model.id,
                          name: model.name,
                          baseUrl: model.baseUrl,
                          apiKey: '',
                          model: model.model,
                          temperature: model.temperature,
                          isActive: model.isActive
                        })
                      }
                    >
                      <strong>{model.name}</strong>
                      <span>{model.model}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="model-editor">
              <label>名称</label>
              <input value={modelForm.name} onChange={(event) => setModelForm({ ...modelForm, name: event.target.value })} />
              <label>Base URL</label>
              <input
                value={modelForm.baseUrl}
                onChange={(event) => setModelForm({ ...modelForm, baseUrl: event.target.value })}
              />
              <label>API Key</label>
              <input
                value={modelForm.apiKey}
                onChange={(event) => setModelForm({ ...modelForm, apiKey: event.target.value })}
                placeholder={modelForm.id ? '如需更新请重新输入' : '输入通义千问 API Key'}
              />
              <label>模型名称</label>
              <input
                value={modelForm.model}
                onChange={(event) => setModelForm({ ...modelForm, model: event.target.value })}
              />
              <label>温度</label>
              <input
                type="number"
                step="0.1"
                value={modelForm.temperature}
                onChange={(event) => setModelForm({ ...modelForm, temperature: Number(event.target.value) })}
              />
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={modelForm.isActive}
                  onChange={(event) => setModelForm({ ...modelForm, isActive: event.target.checked })}
                />
                设为默认模型
              </label>
              <button type="button" onClick={saveModel} disabled={saving}>
                保存模型配置
              </button>
            </div>
          </section>
        ) : null}

        {view === 'logs' ? (
          <section className="panel logs">
            <h2>请求日志</h2>
            <div className="log-table">
              <table>
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>请求</th>
                    <th>状态</th>
                    <th>来源</th>
                  </tr>
                </thead>
                <tbody>
                  {requestLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.createdAt).toLocaleString()}</td>
                      <td>{log.summary}</td>
                      <td>{log.status}</td>
                      <td>{log.host}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2>模型调用</h2>
            <div className="log-table">
              <table>
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>模型</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {aiCalls.map((call) => (
                    <tr key={call.id}>
                      <td>{new Date(call.createdAt).toLocaleString()}</td>
                      <td>{call.modelSetting?.name ?? call.modelSettingId}</td>
                      <td>{call.success ? '成功' : '失败'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {view === 'config' ? (
          <section className="panel">
            <h2>系统设置</h2>
            <div className="config-grid">
              {sysConfig.map((item, index) => (
                <label key={item.key}>
                  <span>{item.key}</span>
                  <input
                    value={item.value}
                    onChange={(event) => {
                      const next = [...sysConfig];
                      next[index] = { ...item, value: event.target.value };
                      setSysConfig(next);
                    }}
                  />
                </label>
              ))}
            </div>
            <button type="button" onClick={saveConfig} disabled={saving}>
              保存配置
            </button>
          </section>
        ) : null}
      </main>
    </div>
  );
};

export default App;
