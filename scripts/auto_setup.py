#!/usr/bin/env python3
"""Interactive deployment helper for the 事情分解工具 project."""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / 'backend'
FRONTEND_DIR = ROOT / 'frontend'
VENV_DIR = BACKEND_DIR / '.venv'
ENV_FILE = ROOT / '.env'


def prompt(message: str, default: str | None = None, secret: bool = False) -> str:
    suffix = f" [{default}]" if default else ""
    try:
        if secret:
            import getpass

            value = getpass.getpass(f"{message}{suffix}: ")
        else:
            value = input(f"{message}{suffix}: ")
    except EOFError:
        value = ''
    if not value and default is not None:
        return default
    return value.strip()


def run_command(command: list[str], cwd: Path | None = None) -> None:
    print(f"\n> Running: {' '.join(command)}")
    subprocess.check_call(command, cwd=str(cwd) if cwd else None)


def setup_backend(provider: str, env_vars: dict[str, str]) -> None:
    python_executable = sys.executable
    if os.name == 'nt':
        python_executable = python_executable.replace('python.exe', 'python.exe')
    if not VENV_DIR.exists():
        run_command([python_executable, '-m', 'venv', str(VENV_DIR)])
    pip_executable = VENV_DIR / ('Scripts' if os.name == 'nt' else 'bin') / ('pip.exe' if os.name == 'nt' else 'pip')
    run_command([str(pip_executable), 'install', '-r', 'requirements.txt'], cwd=BACKEND_DIR)

    env_lines = [f"PROVIDER={provider.upper()}"]
    for key, value in env_vars.items():
        if value:
            env_lines.append(f"{key}={value}")
    ENV_FILE.write_text("\n".join(env_lines), encoding='utf-8')
    print(f"环境变量已写入 {ENV_FILE}")


def setup_frontend() -> None:
    npm = 'npm.cmd' if os.name == 'nt' else 'npm'
    run_command([npm, 'install'], cwd=FRONTEND_DIR)


def main() -> None:
    print('=== 事情分解工具 自动化部署 ===')
    provider = prompt('选择主力模型提供商 (QWEN/OpenAI)', 'QWEN').upper()
    env_vars: dict[str, str] = {}
    if provider == 'QWEN':
        env_vars['QWEN_API_KEY'] = prompt('请输入 Qwen API Key', secret=True)
        env_vars['QWEN_BASE_URL'] = prompt('自定义 Qwen Base URL (留空使用默认)', '')
    else:
        env_vars['OPENAI_API_KEY'] = prompt('请输入 OpenAI API Key', secret=True)
        env_vars['OPENAI_BASE_URL'] = prompt('自定义 OpenAI Base URL (留空使用默认)', '')

    setup_backend(provider, env_vars)
    setup_frontend()

    print('\n部署准备完成。可使用以下命令启动：')
    if os.name == 'nt':
        print(f"{VENV_DIR / 'Scripts' / 'python.exe'} -m waitress --listen=0.0.0.0:8000 backend.app:app")
    else:
        print(f"{VENV_DIR / 'bin' / 'python'} -m waitress --listen=0.0.0.0:8000 backend.app:app")
    print('前端：在 frontend 目录运行 npm run dev 或 npm run build & npm run preview')


if __name__ == '__main__':
    main()
