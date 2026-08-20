# File System, Process & OS Interview Questions (Q1 – Q70)

---

### Q1. What is the `fs` module?
**Difficulty:** `Basic`
**Category:** File System, Process & OS

#### Answer
`fs` provides file system operations: reading, writing, deleting, watching files and directories. It offers callback, synchronous (`*Sync`), and Promise (`fs/promises`) variants.

#### Code Example
```js
const fs = require('node:fs/promises')
const data = await fs.readFile('a.txt', 'utf8')
```
---

### Q2. What are the three API styles of `fs`?
**Difficulty:** `Basic`
**Category:** File System, Process & OS

#### Answer
Callback-based (`fs.readFile(path, cb)`), synchronous (`fs.readFileSync`), and Promise-based (`require('fs/promises')`). Prefer Promises in modern async code; avoid Sync in servers.

#### Code Example
```js
import { readFile } from 'node:fs/promises'
```
---

### Q3. Why avoid `fs.readFileSync` in a web server?
**Difficulty:** `Intermediate`
**Category:** File System, Process & OS

#### Answer
Sync methods block the single event-loop thread until I/O completes, freezing all concurrent requests. Sync I/O is acceptable only at startup (loading config) or in CLI scripts.

#### Code Example
```js
// startup only
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'))
```
---

### Q4. How do you read a file's contents?
**Difficulty:** `Basic`
**Category:** File System, Process & OS

#### Answer
Use `fs.readFile(path, encoding)`. Without an encoding you get a Buffer; with `'utf8'` you get a string. For large files, prefer streaming.

#### Code Example
```js
const text = await fs.readFile('notes.md', 'utf8')
```
---

### Q5. How do you write and append to a file?
**Difficulty:** `Basic`
**Category:** File System, Process & OS

#### Answer
`fs.writeFile` overwrites (or creates) a file; `fs.appendFile` adds to the end. Both accept strings or Buffers.

#### Code Example
```js
await fs.writeFile('log.txt', 'start\n')
await fs.appendFile('log.txt', 'more\n')
```
---

### Q6. How do you check if a file exists?
**Difficulty:** `Intermediate`
**Category:** File System, Process & OS

#### Answer
Prefer trying the operation and handling `ENOENT`, or use `fs.access`. Avoid the old `fs.exists` (deprecated) and avoid check-then-act races (TOCTOU).

#### Code Example
```js
try { await fs.access('f.txt') } catch { /* missing */ }
```
---

### Q7. What is a TOCTOU race in file operations?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
Time-Of-Check to Time-Of-Use: a file's state can change between checking (exists/permissions) and using it, enabling bugs or attacks. Prefer atomic operations that check-and-act in one call, and handle errors instead of pre-checking.

#### Code Example
```js
// atomic: fails if it already exists, no separate check
await fs.writeFile('f', data, { flag: 'wx' })
```
---

### Q8. How do you create a directory (including parents)?
**Difficulty:** `Basic`
**Category:** File System, Process & OS

#### Answer
`fs.mkdir(path, { recursive: true })` creates the directory and any missing parents, and won't error if it already exists.

#### Code Example
```js
await fs.mkdir('a/b/c', { recursive: true })
```
---

### Q9. How do you read the contents of a directory?
**Difficulty:** `Basic`
**Category:** File System, Process & OS

#### Answer
`fs.readdir(path)` returns file/dir names. With `{ withFileTypes: true }` it returns `Dirent` objects so you can distinguish files from directories without extra `stat` calls.

#### Code Example
```js
for (const d of await fs.readdir('.', { withFileTypes: true }))
  if (d.isDirectory()) console.log(d.name)
```
---

### Q10. How do you delete a file or directory?
**Difficulty:** `Basic`
**Category:** File System, Process & OS

#### Answer
`fs.unlink` removes a file; `fs.rm(path, { recursive: true, force: true })` removes files or directory trees, replacing the deprecated `fs.rmdir` recursive option.

#### Code Example
```js
await fs.rm('temp', { recursive: true, force: true })
```
---

### Q11. What does `fs.stat` return?
**Difficulty:** `Intermediate`
**Category:** File System, Process & OS

#### Answer
A `Stats` object with metadata: size, timestamps (`mtime`, `ctime`, `atime`), and type predicates (`isFile()`, `isDirectory()`, `isSymbolicLink()`).

#### Code Example
```js
const s = await fs.stat('a.txt')
console.log(s.size, s.isFile())
```
---

### Q12. What is the difference between `fs.stat` and `fs.lstat`?
**Difficulty:** `Advanced`
**Category:** File System, Process & OS

#### Answer
`stat` follows symbolic links and reports the target's info; `lstat` reports the link itself. Use `lstat` when you need to detect symlinks.

#### Code Example
```js
const s = await fs.lstat('link'); s.isSymbolicLink() // true for the link
```
---

### Q13. How do you rename or move a file?
**Difficulty:** `Basic`
**Category:** File System, Process & OS

#### Answer
`fs.rename(old, new)` renames or moves within the same filesystem atomically. Across filesystems it may fail with `EXDEV`, requiring a copy-then-delete.

#### Code Example
```js
await fs.rename('a.txt', 'archive/a.txt')
```
---

### Q14. How do you copy a file?
**Difficulty:** `Basic`
**Category:** File System, Process & OS

#### Answer
`fs.copyFile(src, dest)` copies a single file; `fs.cp(src, dest, { recursive: true })` copies directory trees.

#### Code Example
```js
await fs.cp('src', 'backup', { recursive: true })
```
---

### Q15. How do you watch a file or directory for changes?
**Difficulty:** `Advanced`
**Category:** File System, Process & OS

#### Answer
`fs.watch` emits events on changes (efficient, OS-backed, but can miss/duplicate events and vary by platform). `fs.watchFile` polls stats (reliable but heavier). Libraries like chokidar smooth over platform quirks.

#### Code Example
```js
fs.watch('config.json', (event, filename) => reload())
```
---

### Q16. What is a file descriptor?
**Difficulty:** `Advanced`
**Category:** File System, Process & OS

#### Answer
A file descriptor (fd) is an integer handle to an open file/socket from the OS. `fs.open` returns one; you must `close` it to avoid leaking descriptors (there's an OS limit).

#### Code Example
```js
const fh = await fs.open('a.txt', 'r')
try { /* read */ } finally { await fh.close() }
```
---

### Q17. What are file open flags like `r`, `w`, `a`, `wx`?
**Difficulty:** `Advanced`
**Category:** File System, Process & OS

#### Answer
`r` read, `w` write/truncate, `a` append, `x` fail if exists. Combinations like `wx` create exclusively (atomic "create if not exists"), and `r+`/`w+` allow read+write.

#### Code Example
```js
await fs.writeFile('lock', '', { flag: 'wx' }) // errors if lock exists
```
---

### Q18. How do you read a large file efficiently?
**Difficulty:** `Advanced`
**Category:** File System, Process & OS

#### Answer
Use `fs.createReadStream` to process in chunks with constant memory, optionally through `readline` for line-based data, rather than loading it all with `readFile`.

#### Code Example
```js
for await (const line of readline.createInterface({ input: fs.createReadStream('big.log') })) {}
```
---

### Q19. How do you handle file paths cross-platform?
**Difficulty:** `Intermediate`
**Category:** File System, Process & OS

#### Answer
Use the `path` module (`join`, `resolve`, `sep`, `basename`, `extname`) instead of hardcoding `/` or `\`, so code works on Windows and POSIX.

#### Code Example
```js
const p = path.join(dir, 'sub', 'file.txt')
```
---

### Q20. What is `path.normalize`?
**Difficulty:** `Intermediate`
**Category:** File System, Process & OS

#### Answer
`path.normalize` resolves `.` and `..` segments and collapses duplicate separators into a canonical path, useful before comparing or using user-supplied paths.

#### Code Example
```js
path.normalize('a//b/../c') // 'a/c'
```
---

### Q21. How do you prevent path traversal attacks?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
Resolve the requested path against a base directory and verify the result still starts with that base, rejecting `../` escapes. Never concatenate user input directly into file paths.

#### Code Example
```js
const full = path.resolve(base, userPath)
if (!full.startsWith(base + path.sep)) throw new Error('traversal')
```
---

### Q22. What is the difference between `path.extname` and manual splitting?
**Difficulty:** `Basic`
**Category:** File System, Process & OS

#### Answer
`path.extname` reliably returns the extension including the dot (handling edge cases like dotfiles and multiple dots), avoiding brittle manual `split('.')` logic.

#### Code Example
```js
path.extname('archive.tar.gz') // '.gz'
path.extname('.env')            // ''
```
---

### Q23. How do you create a temporary file/directory?
**Difficulty:** `Advanced`
**Category:** File System, Process & OS

#### Answer
Use `fs.mkdtemp(prefix)` for a unique temp directory (typically under `os.tmpdir()`), then write files inside it. This avoids name collisions.

#### Code Example
```js
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'app-'))
```
---

### Q24. What is `os.tmpdir()`?
**Difficulty:** `Basic`
**Category:** File System, Process & OS

#### Answer
It returns the operating system's default directory for temporary files (e.g. `/tmp` on Linux), which the OS may clean periodically.

#### Code Example
```js
console.log(os.tmpdir()) // '/tmp'
```
---

### Q25. How do you set file permissions?
**Difficulty:** `Advanced`
**Category:** File System, Process & OS

#### Answer
Use `fs.chmod(path, mode)` with an octal mode (e.g. `0o600`) on POSIX systems. On Windows, permission bits are largely ignored.

#### Code Example
```js
await fs.chmod('secret.key', 0o600) // owner read/write only
```
---

### Q26. What does `process.cwd()` return and can it change?
**Difficulty:** `Intermediate`
**Category:** File System, Process & OS

#### Answer
It returns the process's current working directory. `process.chdir(dir)` changes it, affecting relative path resolution. Prefer absolute paths (via `__dirname`) to avoid surprises.

#### Code Example
```js
process.chdir('/app'); console.log(process.cwd()) // '/app'
```
---

### Q27. How do you spawn a child process?
**Difficulty:** `Advanced`
**Category:** File System, Process & OS

#### Answer
`child_process.spawn(cmd, args)` launches a process and streams its stdio (good for large output). `exec` buffers output, `execFile` runs a binary directly, `fork` spawns a Node child with an IPC channel.

#### Code Example
```js
const { spawn } = require('node:child_process')
spawn('ls', ['-la']).stdout.pipe(process.stdout)
```
---

### Q28. What is the difference between `spawn` and `exec`?
**Difficulty:** `Advanced`
**Category:** File System, Process & OS

#### Answer
`spawn` streams stdout/stderr (constant memory, good for long/large output). `exec` runs a shell command and buffers all output in memory (convenient but risky for large output and shell injection).

#### Code Example
```js
exec('git log', (err, stdout) => {}) // buffered
spawn('git', ['log'])                 // streamed
```
---

### Q29. Why prefer `execFile`/`spawn` with an args array over `exec` with a string?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
`exec` runs through a shell, so interpolated user input enables command injection. `execFile`/`spawn` pass args directly to the binary without shell parsing, preventing injection.

#### Code Example
```js
execFile('convert', [userFile, 'out.png']) // safe, no shell
```
---

### Q30. What is `child_process.fork`?
**Difficulty:** `Advanced`
**Category:** File System, Process & OS

#### Answer
`fork` spawns a new Node process running a module, with a built-in IPC channel for `send`/`message`. It is used to run separate Node scripts and communicate via message passing.

#### Code Example
```js
const child = fork('worker.js')
child.send({ task: 1 }); child.on('message', console.log)
```
---

### Q31. How do child processes communicate (IPC)?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
Forked children use `process.send`/`on('message')` over an IPC channel with structured cloning of messages. Spawned processes communicate via stdio streams or sockets.

#### Code Example
```js
// in child
process.on('message', m => process.send({ echo: m }))
```
---

### Q32. What is the `cluster` module?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
`cluster` forks multiple worker processes that share a server port, letting a Node app use all CPU cores. The primary process distributes incoming connections among workers.

#### Code Example
```js
if (cluster.isPrimary) for (let i = 0; i < os.cpus().length; i++) cluster.fork()
else http.createServer(handler).listen(3000)
```
---

### Q33. How does the cluster module share a port across workers?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
The primary creates the listening socket and hands connections to workers (round-robin by default on non-Windows), or workers share the descriptor. The OS/primary balances the load.

#### Code Example
```js
cluster.schedulingPolicy = cluster.SCHED_RR
```
---

### Q34. What is the difference between cluster and worker threads?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
Cluster forks full processes (isolated memory, good for scaling I/O-bound servers across cores). Worker threads share memory within one process (lower overhead, good for CPU-bound tasks). Choose by workload and isolation needs.

#### Code Example
```js
// I/O scaling -> cluster; CPU crunching -> worker_threads
```
---

### Q35. How do you pass data between worker threads?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
Via `postMessage`/`on('message')` (structured clone), `workerData` at creation, or shared memory with `SharedArrayBuffer` + `Atomics` for zero-copy communication.

#### Code Example
```js
new Worker('./w.js', { workerData: { rows } })
```
---

### Q36. What is `SharedArrayBuffer` and `Atomics`?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
`SharedArrayBuffer` is memory shared between threads without copying; `Atomics` provides atomic read/write/wait operations to coordinate access safely and avoid data races.

#### Code Example
```js
const shared = new Int32Array(new SharedArrayBuffer(4))
Atomics.add(shared, 0, 1)
```
---

### Q37. How do you get system information?
**Difficulty:** `Basic`
**Category:** File System, Process & OS

#### Answer
The `os` module exposes `platform()`, `arch()`, `cpus()`, `totalmem()`, `freemem()`, `hostname()`, `uptime()`, and `networkInterfaces()`.

#### Code Example
```js
console.log(os.platform(), os.cpus().length, os.freemem())
```
---

### Q38. How do you read memory usage of the Node process?
**Difficulty:** `Intermediate`
**Category:** File System, Process & OS

#### Answer
`process.memoryUsage()` returns `rss`, `heapTotal`, `heapUsed`, `external`, and `arrayBuffers` in bytes — useful for monitoring and leak detection.

#### Code Example
```js
console.log(process.memoryUsage().rss / 1e6, 'MB RSS')
```
---

### Q39. What is RSS vs heap in memory usage?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
RSS (Resident Set Size) is total physical memory the process holds (code, stack, heap, buffers). Heap is the V8-managed JS object memory. External/arrayBuffers cover off-heap allocations like Buffers.

#### Code Example
```js
const { rss, heapUsed, external } = process.memoryUsage()
```
---

### Q40. How do you handle process signals for graceful shutdown?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
Listen for `SIGINT`/`SIGTERM`, stop accepting connections, drain in-flight work, close resources, then exit. Add a timeout to force-exit if cleanup hangs.

#### Code Example
```js
process.on('SIGTERM', async () => { await server.close(); process.exit(0) })
```
---

### Q41. What is `process.pid` and `process.ppid`?
**Difficulty:** `Basic`
**Category:** File System, Process & OS

#### Answer
`process.pid` is the current process ID; `process.ppid` is the parent's. Useful for logging, process management, and IPC coordination.

#### Code Example
```js
console.log(`pid ${process.pid}, parent ${process.ppid}`)
```
---

### Q42. How do you measure CPU usage of the current process?
**Difficulty:** `Advanced`
**Category:** File System, Process & OS

#### Answer
`process.cpuUsage()` returns user/system microseconds; call it before and after work and diff to get consumption. `process.resourceUsage()` gives more detail.

#### Code Example
```js
const start = process.cpuUsage(); work(); console.log(process.cpuUsage(start))
```
---

### Q43. How do you set and read environment variables at runtime?
**Difficulty:** `Basic`
**Category:** File System, Process & OS

#### Answer
Read/write `process.env`. Values are strings; changes affect the current process (and children spawned afterward) but not the parent shell.

#### Code Example
```js
process.env.FEATURE = 'on'
```
---

### Q44. How do you load a `.env` file?
**Difficulty:** `Intermediate`
**Category:** File System, Process & OS

#### Answer
Use a loader like `dotenv`, or Node's built-in `--env-file` flag (recent versions), which parses key=value pairs into `process.env` at startup. Never commit secret `.env` files.

#### Code Example
```js
$ node --env-file=.env app.js
```
---

### Q45. What is the standard way to structure config for multiple environments?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
Read all config from environment variables (12-factor), with sensible defaults and validation at startup. Avoid committing environment-specific secrets; use per-environment env files or a secrets manager.

#### Code Example
```js
const config = { port: Number(process.env.PORT ?? 3000), db: process.env.DB_URL }
```
---

### Q46. How do you run a shell command and capture its output as a Promise?
**Difficulty:** `Advanced`
**Category:** File System, Process & OS

#### Answer
Promisify `exec` (or use `execFile`), awaiting `{ stdout, stderr }`. Prefer `execFile` with args to avoid shell injection.

#### Code Example
```js
const { stdout } = await promisify(execFile)('node', ['-v'])
```
---

### Q47. How do you handle a child process that hangs?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
Set a `timeout` (spawn/exec option) or an external timer that calls `child.kill('SIGKILL')`. Also handle `error`, `exit`, and non-zero exit codes.

#### Code Example
```js
const child = spawn('slow', [], { timeout: 5000, killSignal: 'SIGKILL' })
```
---

### Q48. What are exit codes and how do you set them?
**Difficulty:** `Intermediate`
**Category:** File System, Process & OS

#### Answer
Exit codes signal success (0) or failure (non-zero) to the OS/parent. Set via `process.exit(code)` or `process.exitCode = code` (graceful). CLIs use them so scripts can detect failure.

#### Code Example
```js
if (invalid) process.exitCode = 2
```
---

### Q49. How do you detect the platform and adjust behavior?
**Difficulty:** `Intermediate`
**Category:** File System, Process & OS

#### Answer
Check `process.platform` (`win32`, `linux`, `darwin`) or `os.platform()`/`os.type()` to branch on OS-specific paths, commands, or line endings.

#### Code Example
```js
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
```
---

### Q50. What is `os.EOL`?
**Difficulty:** `Basic`
**Category:** File System, Process & OS

#### Answer
`os.EOL` is the platform's line terminator (`\n` on POSIX, `\r\n` on Windows). Use it when generating text files meant to match native conventions.

#### Code Example
```js
fs.writeFile('out.txt', lines.join(os.EOL))
```
---

### Q51. How do you get the number of CPU cores for scaling?
**Difficulty:** `Intermediate`
**Category:** File System, Process & OS

#### Answer
`os.cpus().length` (or `os.availableParallelism()` in newer Node) gives core count, used to size cluster workers or thread pools.

#### Code Example
```js
const workers = os.availableParallelism()
```
---

### Q52. What is `process.stdin` used for?
**Difficulty:** `Intermediate`
**Category:** File System, Process & OS

#### Answer
`process.stdin` is a readable stream of input piped/typed into the process. Read it for CLI input or piped data; combine with `readline` for line-based reading.

#### Code Example
```js
process.stdin.on('data', d => console.log('got', d.toString()))
```
---

### Q53. How do you read piped input vs interactive input?
**Difficulty:** `Advanced`
**Category:** File System, Process & OS

#### Answer
Check `process.stdin.isTTY`: true means an interactive terminal (prompt the user); false means piped/redirected data (read the stream to end).

#### Code Example
```js
if (process.stdin.isTTY) prompt(); else readPipedData()
```
---

### Q54. How do you handle uncaught exceptions in a worker/cluster setup?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
Log the error and let the worker exit; the primary listens for `exit` and forks a replacement. This keeps the service available while replacing crashed workers.

#### Code Example
```js
cluster.on('exit', () => cluster.fork()) // respawn
```
---

### Q55. What is a zombie/orphan process and how do you avoid it?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
A zombie is a finished child not yet reaped by its parent; an orphan is a child whose parent died. Avoid by handling `exit` events, killing children on shutdown, and using process managers/`detached` correctly.

#### Code Example
```js
process.on('exit', () => child.kill())
```
---

### Q56. How do you make a long-running background process survive terminal close?
**Difficulty:** `Advanced`
**Category:** File System, Process & OS

#### Answer
Spawn with `{ detached: true, stdio: 'ignore' }` and call `child.unref()`, or use a process manager (pm2, systemd). This decouples the child from the parent's lifecycle.

#### Code Example
```js
const c = spawn('node', ['job.js'], { detached: true, stdio: 'ignore' }); c.unref()
```
---

### Q57. What is `process.umask()`?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
The umask controls default permission bits stripped from newly created files/dirs. `process.umask()` reads it; setting it affects security of created files (e.g. preventing world-readable secrets).

#### Code Example
```js
console.log(process.umask().toString(8)) // e.g. '22'
```
---

### Q58. How do you atomically write a file to avoid corruption?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
Write to a temp file in the same directory, then `fs.rename` it over the target (rename is atomic on the same filesystem). A crash mid-write leaves the original intact.

#### Code Example
```js
await fs.writeFile(tmp, data); await fs.rename(tmp, 'config.json')
```
---

### Q59. How do you tail a growing log file?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
Track the last read position, watch the file for changes, and read only the new bytes with a read stream starting at that offset, handling truncation/rotation.

#### Code Example
```js
fs.watch('app.log', () => readFrom(lastPos))
```
---

### Q60. How do you handle file locking in Node?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
Node has no built-in advisory locks; use exclusive create (`flag: 'wx'`) as a lock file, an OS lock via a native module (`proper-lockfile`), or coordinate through a database.

#### Code Example
```js
await fs.writeFile('app.lock', String(process.pid), { flag: 'wx' })
```
---

### Q61. What is the `glob` pattern and how do you match files?
**Difficulty:** `Intermediate`
**Category:** File System, Process & OS

#### Answer
Globs (`**/*.js`) match file paths by pattern. Node's `fs` now offers `fs.glob`, or use libraries like `fast-glob` for recursive matching with ignore rules.

#### Code Example
```js
for await (const f of fs.glob('src/**/*.test.js')) console.log(f)
```
---

### Q62. How do you recursively walk a directory tree?
**Difficulty:** `Advanced`
**Category:** File System, Process & OS

#### Answer
Use `fs.readdir(dir, { withFileTypes: true, recursive: true })` (modern) or write a recursive function that descends into subdirectories, guarding against symlink loops.

#### Code Example
```js
const files = await fs.readdir('src', { recursive: true })
```
---

### Q63. How do you handle EMFILE (too many open files)?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
Limit concurrent file operations (a queue/pool), always close descriptors, and optionally raise the OS `ulimit`. EMFILE means you exhausted the descriptor limit by opening files faster than closing.

#### Code Example
```js
const limit = pLimit(50)
await Promise.all(files.map(f => limit(() => fs.readFile(f))))
```
---

### Q64. What is the difference between hard links and symbolic links?
**Difficulty:** `Advanced`
**Category:** File System, Process & OS

#### Answer
A hard link is another name for the same inode/data (both must be deleted to free it). A symlink is a pointer to a path that can dangle if the target is removed. `fs.link` vs `fs.symlink` create them.

#### Code Example
```js
await fs.symlink('target.txt', 'alias.txt')
```
---

### Q65. How do you stream-copy with progress reporting?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
Pipe a read stream through a counting Transform to a write stream, emitting progress from bytes transferred vs total file size.

#### Code Example
```js
read.on('data', c => { copied += c.length; report(copied / total) })
```
---

### Q66. What are `process.stdout.columns` / `rows` used for?
**Difficulty:** `Intermediate`
**Category:** File System, Process & OS

#### Answer
They report terminal dimensions (when stdout is a TTY), letting CLIs wrap text, draw progress bars, or lay out tables. They're undefined when output is piped.

#### Code Example
```js
const width = process.stdout.columns ?? 80
```
---

### Q67. How do you gracefully restart workers on deploy (zero-downtime)?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
Fork new workers, wait until they're listening, then signal old workers to stop accepting new connections and exit after draining. Process managers (pm2 reload) automate this rolling restart.

#### Code Example
```js
pm2 reload app // zero-downtime rolling restart
```
---

### Q68. How do you handle `SIGKILL` vs `SIGTERM`?
**Difficulty:** `Advanced`
**Category:** File System, Process & OS

#### Answer
`SIGTERM` is catchable and requests graceful shutdown; `SIGKILL` (and `SIGSTOP`) cannot be caught or handled — the OS terminates immediately. Design cleanup around SIGTERM; treat SIGKILL as a hard stop.

#### Code Example
```js
process.on('SIGTERM', shutdown) // SIGKILL can't be intercepted
```
---

### Q69. How do you detect if code runs in the primary or a worker?
**Difficulty:** `Intermediate`
**Category:** File System, Process & OS

#### Answer
Use `cluster.isPrimary` (formerly `isMaster`) / `cluster.isWorker`, or in worker threads check `worker_threads.isMainThread`.

#### Code Example
```js
if (cluster.isPrimary) setupWorkers(); else runServer()
```
---

### Q70. What is `process.report` used for?
**Difficulty:** `Experienced`
**Category:** File System, Process & OS

#### Answer
`process.report` generates a diagnostic report (JSON) of the process state — stack traces, heap stats, resource usage, OS info — on demand or on crashes/signals, aiding post-mortem debugging in production.

#### Code Example
```js
process.report.writeReport('./diagnostic.json')
```
---
