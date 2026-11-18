// Sites source publishing with no recursive deletion. Credentials are read only from stdin.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync, cpSync, writeFileSync, realpathSync } from 'node:fs';
import path from 'node:path';

let credential;
try {
  const input = await new Promise((resolve, reject) => {
    let text = '';
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stderr.write('Ready for Site workflow JSON on stdin (input is hidden).\n');
    const done = () => { if (process.stdin.isTTY) process.stdin.setRawMode(false); process.stdin.pause(); resolve(text); };
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { text += chunk; if (text.includes('\u0003')) reject(new Error('Cancelled')); else if (text.includes('\n') || text.includes('\r')) done(); });
    process.stdin.on('end', done);
    process.stdin.resume();
  });
  const request = JSON.parse(input);
  credential = request.credential;
  const projectRoot = realpathSync(process.cwd());
  const manifest = JSON.parse(readFileSync('.openai/hosting.json', 'utf8'));
  if (manifest.project_id !== request.project_id || manifest.static?.directory !== 'dist') throw new Error('Unexpected Site manifest');
  if (!['http_extra_header', 'work_proxy'].includes(credential?.auth_mode) || !credential.branch || credential.branch.startsWith('-')) throw new Error('Invalid Site credential');
  if (credential.auth_mode === 'http_extra_header' && (!credential.token || /[\r\n\0]/.test(credential.token))) throw new Error('Invalid token');
  const remote = new URL(credential.remote_url);
  if (remote.protocol !== 'https:' || remote.username || remote.password || remote.search || remote.hash) throw new Error('Invalid source URL');
  if (credential.token_expires_at && Date.parse(credential.token_expires_at) <= Date.now()) throw new Error('Credential expired');
  if (!existsSync('.git')) await command('git', ['init', '--initial-branch', credential.branch]);
  const gitRoot = (await command('git', ['rev-parse', '--show-toplevel'])).trim();
  if (realpathSync(gitRoot) !== projectRoot) throw new Error('Unexpected Git root');
  const advertised = (await git(['ls-remote', '--heads', credential.remote_url, `refs/heads/${credential.branch}`])).trim();
  const localHead = await command('git', ['rev-parse', '--verify', 'HEAD'], {allowFailure: true});
  if (advertised && advertised.split(/\s+/)[0] !== localHead.trim()) throw new Error('Remote and local source differ; preserve both and reconcile');
  await command('git', ['add', '--all', '--', '.']);
  const changes = (await command('git', ['diff', '--cached', '--name-only'])).trim();
  if (changes) await command('git', ['-c', 'user.name=Louis Li', '-c', 'user.email=louis962911@gmail.com', 'commit', '-m', 'Build personal engineering portfolio and knowledge notebook']);
  const sha = (await command('git', ['rev-parse', 'HEAD'])).trim();
  if ((await command('git', ['status', '--porcelain'])).trim()) throw new Error('Source changed while committing');
  await git(['push', credential.remote_url, `${sha}:refs/heads/${credential.branch}`]);
  const pushed = (await git(['ls-remote', '--heads', credential.remote_url, `refs/heads/${credential.branch}`])).trim().split(/\s+/)[0];
  if (pushed !== sha) throw new Error('Could not verify pushed source');
  const stage = path.resolve('.staging', sha.slice(0, 12));
  if (existsSync(stage)) throw new Error('Staging path already exists; choose a new attempt without deleting');
  mkdirSync(stage, {recursive: true});
  cpSync('dist', path.join(stage, 'dist'), {recursive: true, errorOnExist: true, force: false});
  mkdirSync(path.join(stage, 'dist/.openai'), {recursive: true});
  writeFileSync(path.join(stage, 'dist/.openai/hosting.json'), JSON.stringify(manifest, null, 2) + '\n');
  const archive = path.resolve('..', `louis-li-site-${sha.slice(0, 12)}.tar.gz`);
  if (existsSync(archive)) throw new Error('Archive already exists; preserve previous artifact');
  await command(process.platform === 'win32' ? 'tar.exe' : 'tar', ['-C', stage, '-czf', archive, 'dist']);
  const entries = await command(process.platform === 'win32' ? 'tar.exe' : 'tar', ['-tzf', archive]);
  if (!entries.split(/\r?\n/).includes('dist/.openai/hosting.json')) throw new Error('Missing hosting manifest in archive');
  if ((await command('git', ['status', '--porcelain'])).trim()) throw new Error('Source changed while packaging');
  console.log(JSON.stringify({project_id: manifest.project_id, commit_sha: sha, archive}));
} catch (error) {
  const message = String(error.message).split(credential?.token || '\0').join('[redacted]');
  console.error(message);
  process.exitCode = 1;
}

async function git(args) {
  const env = {...process.env, GIT_TERMINAL_PROMPT: '0'};
  for (const key of Object.keys(env)) if (key.startsWith('GIT_TRACE') || key === 'GIT_CURL_VERBOSE') delete env[key];
  const auth = ['-c', 'credential.helper=', '-c', 'http.extraHeader=', '-c', 'http.followRedirects=false'];
  if (credential.auth_mode === 'http_extra_header') {
    env.SITES_GIT_AUTHORIZATION = `Authorization: Bearer ${credential.token}`;
    auth.push(`--config-env=http.${credential.remote_url}.extraHeader=SITES_GIT_AUTHORIZATION`);
  }
  return command('git', [...auth, ...args], {env});
}

function command(executable, args, {env = process.env, allowFailure = false} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']});
    let output = '', error = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { error += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 || allowFailure ? resolve(output) : reject(new Error(error || `${executable} failed`)));
  });
}
