# Java Multithreading & Concurrency Interview Questions (Q151–Q225)

A curated set of 75 interview questions covering thread creation & lifecycle, `Runnable` vs `Callable`, `synchronized`, `volatile`, atomic classes, locks, synchronizers, executors, `CompletableFuture`, concurrency hazards, `ForkJoinPool`, `ThreadLocal`, and Virtual Threads (Java 21).

---

### Q151. What is a Thread in Java and how does it differ from a Process?
**Difficulty:** `Basic`
**Category:** Multithreading & Concurrency

#### Answer
A thread is the smallest unit of execution scheduled by the operating system, living inside a process. A process is an independent program with its own memory space (heap, code, data), whereas threads within the same process share the heap and method area but have private program counters, stacks, and local variables. Threads are lightweight: creating/spawning a thread consumes far fewer resources than a process, and inter-thread communication is cheap (shared memory) but requires synchronization. A JVM runs as a single process with at least one main thread plus background threads (GC, finalizer, etc.).

#### Code Example / Key Takeaways
```java
// Threads share the heap but have isolated stacks.
Thread t = Thread.currentThread();
System.out.println("Name: " + t.getName());
System.out.println("Priority: " + t.getPriority());
System.out.println("State: " + t.getState());
System.out.println("Is daemon: " + t.isDaemon());
```
---
### Q152. What are the different ways to create a Thread in Java?
**Difficulty:** `Basic`
**Category:** Multithreading & Concurrency

#### Answer
Two classic approaches: (1) extend `Thread` and override `run()`, then call `start()`; (2) implement `Runnable` and pass it to a `Thread` constructor. The `Runnable` approach is preferred because it decouples the task from the threading mechanism and lets the class extend another class. Java 8+ lets you use lambda expressions for `Runnable`. A third, modern approach is `Callable` (returns a value, can throw checked exceptions) executed via an `ExecutorService`. Always call `start()`, not `run()` — calling `run()` executes synchronously on the current thread.

#### Code Example / Key Takeaways
```java
// 1. Extending Thread
class MyThread extends Thread {
    public void run() { System.out.println("extends Thread"); }
}
new MyThread().start();

// 2. Implementing Runnable (preferred)
Runnable r = () -> System.out.println("implements Runnable");
new Thread(r).start();

// 3. Callable via ExecutorService (covered later)
```
---
### Q153. What is the difference between calling `start()` and `run()`?
**Difficulty:** `Basic`
**Category:** Multithreading & Concurrency

#### Answer
`start()` registers the thread with the JVM/OS scheduler and causes a new OS thread to be spawned; the scheduler then invokes `run()` asynchronously on that new thread. Calling `run()` directly simply executes the method body on the *current* thread, with no new thread created. So `run()` called directly is plain sequential code, while `start()` is the only way to achieve true concurrency. A thread's `start()` can be called only once — a second call throws `IllegalThreadStateException`.

#### Code Example / Key Takeaways
```java
Runnable r = () -> System.out.println("Running in: " + Thread.currentThread().getName());
Thread t = new Thread(r);
t.run();   // prints "Running in: main" — no new thread
t.start(); // prints "Running in: Thread-0" — new thread (throws if called twice)
```
---
### Q154. Explain the life cycle / states of a Thread.
**Difficulty:** `Basic`
**Category:** Multithreading & Concurrency

#### Answer
A Java thread moves through states defined in `Thread.State`: `NEW` (created, not started), `RUNNABLE` (ready to run or running — JVM does not distinguish), `BLOCKED` (waiting for a monitor lock), `WAITING` (waiting indefinitely via `wait()`, `join()`, `park()`), `TIMED_WAITING` (waiting with a timeout via `sleep()`, `wait(timeout)`, `join(timeout)`), and `TERMINATED` (completed). Note that OS "running" vs "ready" is collapsed into `RUNNABLE`; the `BLOCKED` state is specifically for synchronized-lock contention, not for waiting on conditions.

#### Code Example / Key Takeaways
```java
Thread t = new Thread(() -> {});
System.out.println(t.getState()); // NEW
t.start();
System.out.println(t.getState()); // RUNNABLE (or TERMINATED if already done)
// BLOCKED: waiting for a synchronized lock
// WAITING: Object.wait() / Thread.join() / LockSupport.park()
// TIMED_WAITING: Thread.sleep() / wait(timeout)
```
---
### Q155. What is the difference between `Runnable` and `Callable`?
**Difficulty:** `Basic`
**Category:** Multithreading & Concurrency

#### Answer
Both represent tasks, but `Runnable.run()` returns `void` and cannot throw checked exceptions, while `Callable.call()` returns a result of type `V` and may throw checked exceptions. `Callable` is designed for use with `ExecutorService`/`Future`/`CompletableFuture` where you need a result or need to propagate exceptions. `Runnable` is simpler, used when no result is needed (fire-and-forget). To run a `Callable`, you submit it to an `ExecutorService` which wraps it in a `FutureTask`.

#### Code Example / Key Takeaways
```java
Runnable r = () -> System.out.println("no result");
Callable<Integer> c = () -> { return 42; };

ExecutorService es = Executors.newSingleThreadExecutor();
Future<?> f1 = es.submit(r);        // Future<?> — no useful result
Future<Integer> f2 = es.submit(c);  // Future<Integer> — f2.get() returns 42
es.shutdown();
```
---
### Q156. What is the purpose of the `volatile` keyword?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
`volatile` guarantees **visibility**: a write to a `volatile` variable happens-before every subsequent read of that variable by any thread, ensuring all threads see the latest value without caching in thread-local registers. It also prevents compiler/JIT reordering of instructions around the volatile access. However, `volatile` does **not** provide atomicity for compound operations (e.g., `volatile int i; i++` is still a race). Use `AtomicInteger` or `synchronized` for atomic compound actions. `volatile` is suitable for simple flags, status indicators, or safely publishing an object reference (if the object is immutable after construction).

#### Code Example / Key Takeaways
```java
class Flag { volatile boolean stopped = false; }
Flag f = new Flag();
new Thread(() -> { while (!f.stopped) {} }).start();
f.stopped = true; // visible to the loop thread immediately

// volatile prevents reordering of this write with the construction of Helper
class Helper { int n = 1; }
class Publisher { volatile Helper h; }
```
---
### Q157. What is the difference between `synchronized` and `volatile`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
`synchronized` provides both **mutual exclusion** (only one thread holds the monitor at a time) and **visibility** (a thread exiting a synchronized block flushes writes, and entering one reloads them). `volatile` provides **visibility only**, with no mutual exclusion — multiple threads can read/write concurrently, so compound actions still race. Use `synchronized` when you need to make a *block* of operations atomic; use `volatile` for single-variable status flags where no atomicity is needed. Overuse of `synchronized` hurts throughput; `volatile` is cheaper but limited.

#### Code Example / Key Takeaways
```java
// volatile: safe for a single read/write flag
volatile boolean ready = false;

// synchronized: makes the compound increment atomic + visible
int count = 0;
synchronized void increment() { count++; } // atomic read-modify-write
```
---
### Q158. What is a `synchronized` method and a `synchronized` block?
**Difficulty:** `Basic`
**Category:** Multithreading & Concurrency

#### Answer
A `synchronized` method acquires the monitor (lock) of `this` for instance methods, or the Class object for static methods, for the method's duration. A `synchronized` block acquires the lock of an explicitly specified object only for the statements inside the block, allowing finer-grained locking and better concurrency. Prefer synchronized blocks with a private, dedicated lock object to avoid exposing the lock (e.g., locking on `this` or a public class can be hijacked by external code). The same monitor must be used by all threads that need to be mutually excluded.

#### Code Example / Key Takeaways
```java
// synchronized method (locks on 'this')
public synchronized void foo() { /* critical section */ }

// synchronized static method (locks on Class object)
public static synchronized void bar() { /* ... */ }

// synchronized block with dedicated lock (finer-grained, safer)
private final Object lock = new Object();
public void baz() {
    // non-critical work here (concurrent)
    synchronized (lock) {
        // critical section only
    }
}
```
---
### Q159. What is the difference between a static and an instance `synchronized` method?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
An instance `synchronized` method locks on the specific object instance (`this`), so two threads on *different* instances can run simultaneously. A static `synchronized` method locks on the `Class` object (`MyClass.class`), which is shared across all instances — so it serializes access for all instances of that class. They use different monitors and do **not** block each other: a thread in a static synchronized method and a thread in an instance synchronized method on the same instance can run concurrently. Choose based on whether the shared state being protected is per-instance or class-level.

#### Code Example / Key Takeaways
```java
class Counter {
    private static int global = 0;
    private int local = 0;

    public static synchronized void incGlobal() { global++; } // locks Counter.class
    public synchronized void incLocal() { local++; }           // locks 'this'
}
// Thread A: Counter.incGlobal()  -> locks Class
// Thread B: new Counter().incLocal() -> locks instance; runs concurrently with A
```
---
### Q160. What are atomic classes in `java.util.concurrent.atomic`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
Atomic classes (`AtomicInteger`, `AtomicLong`, `AtomicReference`, `AtomicBoolean`, and array/field updaters) provide lock-free, thread-safe operations on single variables using Compare-And-Swap (CAS) hardware instructions. They support atomic read-modify-write patterns like `incrementAndGet()`, `compareAndSet(expect, update)`, `getAndUpdate(fn)`, etc. They are faster than `synchronized` under low-to-moderate contention because they avoid kernel context switches, but can suffer under high contention due to CAS retry loops. `LongAdder`/`DoubleAdder` and `LongAccumulator`/`DoubleAccumulator` (Java 8) use striped cells for better high-contention scalability.

#### Code Example / Key Takeaways
```java
AtomicInteger count = new AtomicInteger(0);
// thread-safe increment without locks
int newVal = count.incrementAndGet(); // returns updated value
// CAS pattern
boolean updated = count.compareAndSet(5, 10); // true if value was 5, now 10

// For high-contention counters, prefer LongAdder (Java 8)
import java.util.concurrent.atomic.LongAdder;
LongAdder adder = new LongAdder();
adder.increment(); // no contention on single CAS
long sum = adder.sum();
```
---
### Q161. How does `AtomicInteger` work internally?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
`AtomicInteger` wraps a `volatile int value` and uses `Unsafe.compareAndSwapInt` (CAS) to perform atomic updates. CAS is a hardware instruction: it atomically checks if the current value equals an expected value, and if so, swaps it to the new value; otherwise it fails and the caller retries. The JVM intrinsic compiles this to a single CPU instruction (`LOCK CMPXCHG` on x86). Methods like `incrementAndGet()` loop: read current, compute next, CAS; on failure, retry. This is lock-free (no thread ever blocks indefinitely waiting for a lock), but not wait-free (a thread may retry many times under contention).

#### Code Example / Key Takeaways
```java
// Simplified conceptual implementation
public class AtomicInteger {
    private volatile int value;
    public final int getAndIncrement() {
        for (;;) {
            int current = value;
            int next = current + 1;
            if (compareAndSet(current, next)) return current;
        }
    }
    public final boolean compareAndSet(int expect, int update) {
        return unsafe.compareAndSwapInt(this, valueOffset, expect, update);
    }
}
// Under the hood: JVM intrinsic -> CPU LOCK CMPXCHG
```
---
### Q162. What is ABA problem and how do you solve it?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
The ABA problem occurs in CAS-based algorithms when a value changes from A to B and back to A; a thread doing CAS(A→C) succeeds because it still sees A, unaware of the intermediate change. This corrupts algorithms that attach meaning to value identity (e.g., lock-free stack pop). Solutions: (1) `AtomicStampedReference` pairs the value with an integer stamp that increments on every update, so A→B→A becomes (A,0)→(B,1)→(A,2) — CAS also checks the stamp. (2) `AtomicMarkableReference` uses a boolean mark instead of a stamp. (3) Avoid mutable references — use immutable value objects so identity change implies value change.

#### Code Example / Key Takeaways
```java
AtomicStampedReference<Integer> ref = new AtomicStampedReference<>(100, 0);
int[] stamp = new int[1];
Integer cur = ref.get(stamp);      // cur=100, stamp[0]=0
// Another thread: 100 -> 200 -> 100 (stamp becomes 2)
boolean ok = ref.compareAndSet(cur, 101, stamp[0], stamp[0] + 1);
// CAS fails because stamp[0]=0 != expected 2, preventing the ABA bug.
```
---
### Q163. What is `ReentrantLock` and how does it differ from `synchronized`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
`ReentrantLock` is an explicit lock from `java.util.concurrent.locks` that can be acquired/released via `lock()`/`unlock()` (always in a `try-finally`). Advantages over `synchronized`: (1) **fairness** option (`new ReentrantLock(true)`) for FIFO ordering; (2) **try-lock with timeout** (`tryLock(timeout)`) to avoid deadlock; (3) **interruptible** locking (`lockInterruptibly()`); (4) `tryLock()` non-blocking attempt; (5) multiple `Condition` objects via `newCondition()` for fine-grained wait/notify. Downsides: you must remember to `unlock()` in `finally` (easy to leak), and it's more verbose. `synchronized` is simpler, auto-released on exceptions/block exit, and JVM-optimized.

#### Code Example / Key Takeaways
```java
ReentrantLock lock = new ReentrantLock(true); // fair
lock.lock();
try {
    // critical section
} finally {
    lock.unlock(); // MUST release, or lock leaks
}

// Differences from synchronized:
// - lock.tryLock(1, TimeUnit.SECONDS) // timeout, avoids deadlock
// - lock.lockInterruptibly()          // can be interrupted
// - lock.newCondition()               // multiple wait sets
```
---
### Q164. What does "reentrant" mean in `ReentrantLock`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
Reentrant means a thread that already holds the lock can acquire it again without deadlocking on itself; the lock keeps a **hold count** that increments on each re-acquisition and decrements on each `unlock()`. The lock is fully released only when the count returns to zero. This lets synchronized methods call each other and nested `synchronized` blocks on the same monitor work. `synchronized` monitors are also reentrant. If a thread not holding the lock calls `unlock()`, `ReentrantLock` throws `IllegalMonitorStateException`.

#### Code Example / Key Takeaways
```java
ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    lock.lock(); // re-acquire: hold count -> 2 (allowed)
    try {
        // nested critical section
    } finally {
        lock.unlock(); // count -> 1
    }
} finally {
    lock.unlock(); // count -> 0, fully released
}
```
---
### Q165. What is a `ReadWriteLock`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
`ReadWriteLock` (`ReentrantReadWriteLock` is the standard impl) maintains a pair of associated locks: a read lock (shared) and a write lock (exclusive). Multiple threads can hold the read lock simultaneously, but the write lock is exclusive — no reads or other writes occur while a write is held. This boosts concurrency for read-heavy data structures (caches, configuration) where writes are rare. Caveats: by default it is unfair and can starve writers; prefer fairness or `ReentrantReadWriteLock(true)` for write-priority if needed. The write lock is reentrant, and it can be downgraded to a read lock but not upgraded.

#### Code Example / Key Takeaways
```java
ReadWriteLock rw = new ReentrantReadWriteLock();
Map<String, String> cache = new HashMap<>();

// Read - many threads allowed concurrently
rw.readLock().lock();
try { return cache.get(key); } finally { rw.readLock().unlock(); }

// Write - exclusive
rw.writeLock().lock();
try { cache.put(key, value); } finally { rw.writeLock().unlock(); }
```
---
### Q166. What is a `Semaphore`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
A `Semaphore` maintains a set of permits. Threads call `acquire()` to take a permit (blocking if none available) and `release()` to return one. It controls access to a resource pool of fixed size, not mutual exclusion per se. A `Semaphore` with 1 permit acts like a mutex (binary semaphore); with N permits it bounds concurrency (e.g., limit to 10 simultaneous connections). Unlike a lock, a semaphore has no notion of ownership — any thread may `release()` a permit even if it didn't `acquire()` it. Constructors support fairness; `tryAcquire()` offers non-blocking/timeout variants.

#### Code Example / Key Takeaways
```java
Semaphore sem = new Semaphore(3); // max 3 concurrent accesses
void access() throws InterruptedException {
    sem.acquire();
    try {
        // use limited resource
    } finally {
        sem.release(); // always release
    }
}
// Binary semaphore (1 permit) ~ mutex
Semaphore mutex = new Semaphore(1);
```
---
### Q167. What is a `CountDownLatch`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
`CountDownLatch` is a one-shot synchronizer initialized with a count. Threads call `countDown()` to decrement the counter; other threads call `await()` to block until the count reaches zero (or a timeout elapses). It is **not reusable** — once it hits zero, all subsequent `await()` calls return immediately and it cannot be reset. Typical uses: (1) start gate where N worker threads wait for a signal to begin together; (2) end gate where a master thread waits for N tasks to finish. For a reusable barrier, use `CyclicBarrier`.

#### Code Example / Key Takeaways
```java
int n = 5;
CountDownLatch start = new CountDownLatch(1); // start gate
CountDownLatch done  = new CountDownLatch(n); // end gate

for (int i = 0; i < n; i++) {
    new Thread(() -> {
        try { start.await(); /* wait for go */ runTask(); }
        finally { done.countDown(); }
    }).start();
}
start.countDown(); // release all workers
done.await();      // wait for all to finish (one-shot, not reusable)
```
---
### Q168. What is a `CyclicBarrier`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
`CyclicBarrier` is a reusable barrier where a fixed number of threads call `await()` and all block until the last one arrives; then all are released simultaneously, and the barrier resets for the next cycle. It supports an optional barrier action (`Runnable`) executed once per cycle by the last arriving thread — useful for merging partial results. Unlike `CountDownLatch`, it is reusable, but a broken barrier (thread times out or is interrupted) throws `BrokenBarrierException` for all waiting threads, requiring barrier.reset() to reuse. Use for phased computations (map-reduce, game loop steps).

#### Code Example / Key Takeaways
```java
// 4 threads, barrier action runs after each phase
CyclicBarrier barrier = new CyclicBarrier(4, () -> System.out.println("All done, next phase"));
for (int i = 0; i < 4; i++) {
    new Thread(() -> {
        for (int phase = 0; phase < 3; phase++) {
            doPhaseWork();
            try { barrier.await(); } // all wait, then proceed
            catch (InterruptedException | BrokenBarrierException e) { Thread.currentThread().interrupt(); }
        }
    }).start();
}
```
---
### Q169. What is the difference between `CountDownLatch` and `CyclicBarrier`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
Key differences: (1) **Reusability**: `CountDownLatch` is one-shot; `CyclicBarrier` resets automatically after each trip. (2) **Waiting style**: Latch has two roles — threads call `countDown()` (producers) and others call `await()` (consumers). Barrier: all threads call `await()` symmetrically. (3) **Barrier action**: `CyclicBarrier` supports an optional `Runnable` executed per cycle; `CountDownLatch` does not. (4) **Failure modes**: `CyclicBarrier.await()` can throw `BrokenBarrierException` if a thread interrupts or times out, invalidating the barrier for all; `CountDownLatch` never breaks — threads just continue once count hits zero.

#### Code Example / Key Takeaways
```java
// Use CountDownLatch when: one group signals completion, another waits (fire-once)
// Use CyclicBarrier when: all threads must meet repeatedly (phased algorithms)
```
---
### Q170. What is an `ExecutorService` and why would you use it instead of raw threads?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
`ExecutorService` is an interface in `java.util.concurrent` that abstracts thread management: you submit `Runnable`/`Callable` tasks and it schedules them on a managed pool of worker threads. Benefits over creating threads manually: (1) thread reuse avoids the high cost of creating/destroying threads per task; (2) bounded pools prevent resource exhaustion; (3) it returns `Future` results for `Callable`; (4) rich lifecycle control (`shutdown()`/`shutdownNow()`); (5) built-in scheduling (`ScheduledExecutorService`). Raw `new Thread()` per task scales poorly and leaks resources under load. Always prefer an executor for production code.

#### Code Example / Key Takeaways
```java
ExecutorService pool = Executors.newFixedThreadPool(10);
Future<Integer> f = pool.submit(() -> compute());
Integer result = f.get(); // blocks for result
pool.shutdown();          // no new tasks, finish submitted ones
pool.awaitTermination(1, TimeUnit.MINUTES);
```
---
### Q171. What are the common factory methods in `Executors`?
**Difficulty:** `Basic`
**Category:** Multithreading & Concurrency

#### Answer
`Executors` provides static factory methods for common executor configurations:
- `newFixedThreadPool(n)` — exactly `n` threads; excess tasks queue unbounded (OOM risk).
- `newCachedThreadPool()` — creates threads on demand, reuses idle ones (60s keep-alive); unbounded pool size (OOM risk under burst).
- `newSingleThreadExecutor()` — one thread, FIFO queue; guarantees sequential execution.
- `newWorkStealingPool()` — `ForkJoinPool` for parallel tasks (uses all processors).
- `newScheduledThreadPool(n)` — for delayed/periodic tasks.
Prefer `ThreadPoolExecutor` directly for production to control queue bounds and rejection policies.

#### Code Example / Key Takeaways
```java
ExecutorService fixed = Executors.newFixedThreadPool(4);
ExecutorService cached = Executors.newCachedThreadPool();
ExecutorService single = Executors.newSingleThreadExecutor();
ScheduledExecutorService scheduled = Executors.newScheduledThreadPool(2);
// WARNING: Fixed & Single use unbounded LinkedBlockingQueue — can OOM.
// Cached creates unlimited threads — can OOM.
// In production: use ThreadPoolExecutor with bounded queue.
```
---
### Q172. Explain the `ThreadPoolExecutor` parameters.
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
`ThreadPoolExecutor(corePoolSize, maxPoolSize, keepAliveTime, unit, workQueue, threadFactory, handler)`:
- **corePoolSize**: target number of always-kept-alive threads (even idle).
- **maxPoolSize**: upper bound on threads when queue is full.
- **keepAliveTime/unit**: idle timeout for *non-core* threads before termination.
- **workQueue**: `BlockingQueue` for tasks when all core threads busy (`SynchronousQueue` bypasses queuing; `LinkedBlockingQueue` is unbounded; `ArrayBlockingQueue` is bounded).
- **threadFactory**: creates threads (naming, daemon, priority).
- **handler** (RejectedExecutionHandler): what happens when queue is full and pool maxed: `AbortPolicy` (throws, default), `CallerRunsPolicy` (caller runs task), `DiscardPolicy`, `DiscardOldestPolicy`.
Behavior: tasks use core threads → then queue → then grow to max → then reject.

#### Code Example / Key Takeaways
```java
ThreadPoolExecutor ex = new ThreadPoolExecutor(
    4,                       // corePoolSize
    16,                      // maxPoolSize
    60, TimeUnit.SECONDS,    // keepAlive for non-core
    new ArrayBlockingQueue<>(100), // bounded queue
    Executors.defaultThreadFactory(),
    new ThreadPoolExecutor.CallerRunsPolicy()); // backpressure
```
---
### Q173. What is a `Future`?
**Difficulty:** `Basic`
**Category:** Multithreading & Concurrency

#### Answer
A `Future<V>` represents the result of an asynchronous computation. After submitting a `Callable`/`Runnable` to an `ExecutorService`, you get a `Future` to: `get()` (blocks until done, possibly throwing `ExecutionException` wrapping the task's exception), `get(timeout, unit)` (throws `TimeoutException`), `cancel(mayInterruptIfRunning)`, `isDone()`, and `isCancelled()`. The base `Future` is limited: blocking `get()`, no chaining, no combining. `CompletableFuture` (covered later) addresses these gaps.

#### Code Example / Key Takeaways
```java
ExecutorService es = Executors.newSingleThreadExecutor();
Future<String> f = es.submit(() -> "result");
try {
    String r = f.get(5, TimeUnit.SECONDS); // blocks, with timeout
} catch (TimeoutException e) {
    f.cancel(true); // attempt cancellation
} catch (ExecutionException e) {
    Throwable cause = e.getCause(); // the task's real exception
}
```
---
### Q174. What is `CompletableFuture`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
`CompletableFuture` (Java 8) extends `Future` and implements `CompletionStage`, providing a fluent, non-blocking API for asynchronous programming. You can chain dependent stages (`thenApply`, `thenAccept`, `thenRun`), combine independent futures (`thenCombine`, `thenCompose`, `allOf`, `anyOf`), handle exceptions (`exceptionally`, `handle`), and complete manually (`complete`, `completeExceptionally`). It runs callbacks on the thread that completes the stage (or a supplied executor), and supports both `Runnable` (void) and functional (value) chains. It replaces callback hell and `Future.get()` blocking.

#### Code Example / Key Takeaways
```java
CompletableFuture<String> f = CompletableFuture.supplyAsync(() -> fetchData())
    .thenApply(data -> transform(data))
    .thenAccept(System.out::println)
    .exceptionally(ex -> { log(ex); return "fallback"; });

// Combine two independent futures
CompletableFuture<Integer> a = CompletableFuture.supplyAsync(() -> 1);
CompletableFuture<Integer> b = CompletableFuture.supplyAsync(() -> 2);
CompletableFuture<Integer> sum = a.thenCombine(b, (x, y) -> x + y);
// sum.get() -> 3 (non-blocking composition)

// allOf / anyOf for multiple futures
CompletableFuture.allOf(f1, f2, f3).join();
```
---
### Q175. How does `thenApply`, `thenAccept`, `thenRun` differ?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
All three chain an action after a stage completes, but differ in input/output:
- `thenApply(Function<T,R>)` — consumes the result, returns a transformed value (maps `T` → `R`).
- `thenAccept(Consumer<T>)` — consumes the result, returns nothing (`CompletableFuture<Void>`); terminal side-effect.
- `thenRun(Runnable)` — ignores the result, just runs after completion; for pure side-effects like logging or cleanup.
There are also async variants (`thenApplyAsync`, etc.) that run on a supplied or `ForkJoinPool.commonPool()` executor rather than the completing thread.

#### Code Example / Key Takeaways
```java
CompletableFuture.supplyAsync(() -> "abc")
    .thenApply(s -> s.toUpperCase())  // Function: "ABC"
    .thenAccept(s -> System.out.println(s)) // Consumer: prints ABC
    .thenRun(() -> System.out.println("done")); // Runnable: prints done
```
---
### Q176. What is the difference between `thenCompose` and `thenCombine`?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
`thenCompose(Function<T, CompletionStage<U>>)` flattens a dependent future — the result of the first stage is fed into a function that *returns another future*, yielding a single flat future (`Future<U>`). It's like `flatMap` for futures (sequential dependency: B needs A's result).
`thenCombine(CompletionStage<U>, BiFunction<T,U,V>)` joins two *independent* futures and combines their results when both complete; the two futures run in parallel and combine (`Future<V>`). It's like `zip`/`map2`.
Use `thenCompose` for chaining dependent steps; `thenCombine`/`thenAcceptBoth` for merging concurrent results.

#### Code Example / Key Takeaways
```java
// thenCompose: sequential dependency (flatMap)
CompletableFuture<User> f = fetchUserId()
    .thenCompose(id -> fetchUser(id));   // Future<Id> -> Future<User>

// thenCombine: parallel, merge results
CompletableFuture<Double> price = fetchPrice();
CompletableFuture<Integer> qty = fetchQty();
CompletableFuture<Double> total = price.thenCombine(qty, (p, q) -> p * q);
```
---
### Q177. What is deadlock and how do you prevent it?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
Deadlock occurs when two or more threads are blocked forever, each waiting for a lock held by another. Four Coffman conditions must hold simultaneously: mutual exclusion, hold-and-wait, no preemption, circular wait. Prevention strategies: (1) **Lock ordering** — always acquire locks in a consistent global order; (2) **Timeout-based locks** — use `tryLock(timeout)` to avoid indefinite wait; (3) **Avoid nested locks** — design to hold at most one lock; (4) **Lock coarsening/granularity** — sometimes fewer, broader locks reduce nesting; (5) **Detect & recover** — JVM has no built-in deadlock detection, but `jstack` / `ThreadMXBean` can diagnose; design for `LockSupport.parkNanos` instead of indefinite blocking.

#### Code Example / Key Takeaways
```java
// Deadlock example
Object a = new Object(), b = new Object();
Thread t1 = new Thread(() -> { synchronized(a) { synchronized(b) {} } });
Thread t2 = new Thread(() -> { synchronized(b) { synchronized(a) {} } });
// t1 holds a, wants b; t2 holds b, wants a -> deadlock

// Prevention: consistent lock ordering
// Always lock a before b (or compare hash codes for arbitrary objects)
synchronized (a) { synchronized (b) { } }
// Both threads use same order -> no circular wait
```
---
### Q178. What is the difference between deadlock, livelock, and starvation?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
- **Deadlock**: threads are permanently blocked waiting on each other's locks; none make progress and none are "active" (they're parked/blocked).
- **Livelock**: threads are *active* and keep responding to each other but make no real progress — like two people stepping aside in the same direction repeatedly. Often from over-eager retry/back-off logic where each thread gives up its lock to avoid deadlock and immediately retries.
- **Starvation**: a thread is perpetually denied access to a resource because higher-priority or luckier threads always win (e.g., unfair lock, `synchronized` favoring some threads). The thread is runnable but never scheduled. Fair locks and `ReentrantLock(true)` mitigate starvation.

#### Code Example / Key Takeaways
```java
// Livelock: both yield endlessly
while (conflict) { /* give up resource */ Thread.yield(); } // neither progresses

// Starvation example: many high-priority writers starve a low-priority reader
// under an unfair lock. Fix: ReentrantLock(true) or priority adjustment.
```
---
### Q179. What is `wait()`, `notify()`, and `notifyAll()` and how are they used?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
These are `Object` methods for inter-thread coordination and **must be called from within a `synchronized` block or method on the same monitor**. `wait()` releases the monitor and blocks the thread until another thread calls `notify()`/`notifyAll()` on the same object. `notify()` wakes one (arbitrary) waiting thread; `notifyAll()` wakes all. Always call `wait()` in a **loop** checking the condition (guards against spurious wakeups and missed signals). Prefer `notifyAll()` unless you have a single specific waiter. Modern code usually prefers `Condition`, `BlockingQueue`, or higher-level concurrent collections instead.

#### Code Example / Key Takeaways
```java
final Object lock = new Object();
boolean ready = false;

// Consumer
synchronized (lock) {
    while (!ready) lock.wait(); // ALWAYS loop, not if
    // proceed
}

// Producer
synchronized (lock) {
    ready = true;
    lock.notifyAll(); // wake all waiters
}
```
---
### Q180. What is a `Condition` and how does it differ from `wait/notify`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
`Condition` (from `Lock.newCondition()`) is the `Lock` API's analog of `Object.wait/notify`. Differences: (1) a `Lock` can have multiple `Condition` objects (separate wait-sets) for different predicates — e.g., `notEmpty` and `notFull` for a bounded buffer — instead of one shared monitor wait-set; (2) `Condition` methods are `await()`, `signal()`, `signalAll()` (clearer names); (3) `await()` throws `InterruptedException` which you must handle; (4) `Condition` requires explicit `Lock` ownership, making locking discipline visible. Use `Condition` when you need multiple wait queues per lock.

#### Code Example / Key Takeaways
```java
ReentrantLock lock = new ReentrantLock();
Condition notEmpty = lock.newCondition();
Condition notFull  = lock.newCondition();

void put(E e) {
    lock.lock();
    try {
        while (full) notFull.await();
        add(e);
        notEmpty.signal();
    } finally { lock.unlock(); }
}
// wait-set per condition avoids "signal to wrong thread" issue with notify()
```
---
### Q181. What is the `ForkJoinPool` and `ForkJoinTask`?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
`ForkJoinPool` (Java 7) is an `ExecutorService` specialized for divide-and-conquer tasks that **fork** (split into subtasks) and **join** (wait for results). Its worker threads use **work-stealing**: each worker has its own deque; idle workers steal tasks from busy workers' deques, keeping CPUs saturated and reducing contention. Tasks extend `RecursiveTask<V>` (returns result) or `RecursiveAction` (void) and override `compute()`, recursively splitting when the problem is large (`threshold`) and solving directly when small. `ForkJoinPool.commonPool()` is the shared default used by parallel streams and `CompletableFuture` async without explicit executor.

#### Code Example / Key Takeaways
```java
class SumTask extends RecursiveTask<Long> {
    final long[] a; final int lo, hi;
    SumTask(long[] a, int lo, int hi) { this.a=a; this.lo=lo; this.hi=hi; }
    protected Long compute() {
        if (hi - lo <= 1000) { // threshold
            long s = 0; for (int i=lo; i<hi; i++) s += a[i]; return s;
        }
        int mid = (lo+hi)/2;
        SumTask left = new SumTask(a, lo, mid);
        SumTask right = new SumTask(a, mid, hi);
        left.fork();               // async execute
        long r = right.compute();  // compute current thread
        long l = left.join();      // wait for forked
        return l + r;
    }
}
Long total = new ForkJoinPool().invoke(new SumTask(arr, 0, arr.length));
```
---
### Q182. What is work-stealing in `ForkJoinPool`?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
Work-stealing is the scheduling algorithm of `ForkJoinPool`: each worker thread maintains a double-ended queue (deque) of tasks. A worker pushes new forked subtasks to the *top* of its own deque and pops from the top (LIFO, cache-friendly). When a worker runs out of work, it *steals* a task from the *bottom* of another worker's deque (FIFO). This minimizes contention (owners use one end, thieves the other) and balances load automatically. It's why `ForkJoinPool` scales well for many small tasks, and is the backbone of parallel streams. Caveat: tasks must be independent (no shared mutable state) and ideally of balanced size for good stealing.

#### Code Example / Key Takeaways
```java
// Owner pushes/pops from TOP (LIFO); thieves steal from BOTTOM (FIFO).
// Idle worker scans other workers' deques to "steal" work.
ForkJoinPool pool = ForkJoinPool.commonPool();
// parallel stream uses commonPool (work-stealing) under the hood
List<Integer> result = list.parallelStream().map(x -> x*2).toList();
```
---
### Q183. What is `ThreadLocal` and when would you use it?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
`ThreadLocal<T>` provides thread-confined variables: each thread accessing the `ThreadLocal` gets its own independent copy, so there's no sharing and thus no synchronization needed. Typical uses: per-thread state like user session, transaction ID, `SimpleDateFormat` (not thread-safe), database connection/source binding (Spring's `TransactionSynchronizationManager`), and profiling/tracing context. Caution: in thread pools, a `ThreadLocal` set on a worker thread persists across tasks and can leak memory or leak data between unrelated tasks — always `remove()` in a `finally` block. `InheritableThreadLocal` propagates values from parent to child threads (but not across executor thread handoffs).

#### Code Example / Key Takeaways
```java
private static final ThreadLocal<SimpleDateFormat> FMT =
    ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));

String format(Date d) {
    return FMT.get().format(d); // each thread has its own formatter
}
// ALWAYS clean up in thread pools:
try {
    context.set(value);
    doWork();
} finally {
    context.remove(); // prevent leak / cross-task data bleed
}
```
---
### Q184. What is `InheritableThreadLocal`?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
`InheritableThreadLocal` extends `ThreadLocal` so that when a new thread is created from a parent thread, the child receives a *copy* of the parent's values (via `childValue(parentValue)` override). This works for plain `new Thread()` but **does not propagate across thread pool hand-offs** — if a task is submitted to an `ExecutorService`, the worker thread is not a child of the submitting thread. For thread-pool-safe context propagation, use `TransmittableThreadLocal` (third-party) or Java 21's `ScopedValue` (preview).

#### Code Example / Key Takeaways
```java
InheritableThreadLocal<String> traceId = new InheritableThreadLocal<>() {
    @Override protected String childValue(String parent) { return parent + "-child"; }
};
traceId.set("req-1");
new Thread(() -> System.out.println(traceId.get())).start(); // prints "req-1-child"
// But: Executors.newSingleThreadExecutor().submit(() -> traceId.get()) -> null!
```
---
### Q185. What are Virtual Threads in Java 21?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
Virtual threads (Project Loom, JEP 444, Java 21) are lightweight, JVM-managed threads that are not 1:1 mapped to OS threads. A virtual thread is cheap to create (millions can exist) because its stack is stored on the Java heap and is *unmounted* from its carrier (platform) thread when it blocks on I/O, allowing the carrier to run other virtual threads. This makes the "one thread per request" model scale to huge concurrency without the OS-thread bottleneck. Create via `Thread.ofVirtual().start(runnable)` or `Executors.newVirtualThreadPerTaskExecutor()`. They are not a replacement for CPU-bound work — they shine for I/O-bound, blocking-style code.

#### Code Example / Key Takeaways
```java
// Java 21
try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 1_000_000; i++) {
        exec.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1)); // cheap: unmounts carrier
            return "ok";
        });
    }
}
// Thread.ofVirtual().name("vt-", 0).start(() -> doWork());
```
---
### Q186. How do virtual threads differ from platform threads?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
Platform threads (the traditional `Thread`) are 1:1 with OS threads: each has a large native stack (typically 1–2 MB), limited by OS/kernel resources (a few thousand typically). Virtual threads are many-to-one: many virtual threads share a small pool of carrier (platform) threads. Virtual threads have tiny, growable Java-heap stacks and can be created in the millions. When a virtual thread blocks on I/O (socket, file, `LockSupport.park`), it unmounts from its carrier, freeing it to run another virtual thread. CPU-bound work still occupies a carrier, so virtual threads do not magically parallelize CPU-heavy tasks. Pinning (holding a `synchronized` monitor or native frame) prevents unmounting and can stall the carrier.

#### Code Example / Key Takeaways
```java
// Platform: expensive, limited
Thread.ofPlatform().name("p-", 0).start(() -> {});
// Virtual: cheap, many
Thread.ofVirtual().name("v-", 0).start(() -> {});
// Mixed: virtual threads run ON platform carrier threads internally
```
---
### Q187. What is pinning in virtual threads and why does it matter?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
A virtual thread is *pinned* to its carrier when it cannot unmount — typically because it holds a `synchronized` monitor or is executing a native (JNI) method. While pinned, blocking I/O keeps the carrier occupied, reducing the pool of available carriers and potentially starving other virtual threads. Java 21's `synchronized` pins; Java 24+ (JEP 491) unpins `synchronized`. Workarounds: (1) replace `synchronized` with `ReentrantLock` (does not pin); (2) keep synchronized blocks short and CPU-only; (3) avoid blocking I/O inside `synchronized`. JDK Flight Recorder (`jdk.VirtualThreadPinned` event) can detect pinning.

#### Code Example / Key Takeaways
```java
// BAD: synchronized + blocking I/O = pinned virtual thread
synchronized (this) {
    socket.read(); // carrier cannot unmount
}

// GOOD: ReentrantLock does not pin
lock.lock();
try { socket.read(); } finally { lock.unlock(); }
```
---
### Q188. What is `happens-before` in the Java Memory Model?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
The Java Memory Model (JMM, JLS 17) defines *happens-before* as a partial order guaranteeing visibility: if action A happens-before action B, then B is guaranteed to see the effects of A. Key happens-before rules: (1) program order in a single thread; (2) unlock of a monitor happens-before subsequent lock of the same monitor; (3) write to `volatile` happens-before subsequent read of that `volatile`; (4) `Thread.start()` happens-before any action in the started thread; (5) last action in a thread happens-before `join()` returns in another; (6) transitivity. Without a happens-before edge, the compiler/CPU may reorder, and a thread may see stale values.

#### Code Example / Key Takeaways
```java
int x = 0; volatile boolean ready = false;
// Thread A:
x = 42;
ready = true; // volatile write happens-before subsequent volatile read
// Thread B:
if (ready) { // volatile read
    System.out.println(x); // guaranteed to see 42
}
```
---
### Q189. What is a race condition vs data race?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
A **data race** is a JMM term: two threads access the same memory location concurrently, at least one is a write, and there is no happens-before relationship. Data races cause stale or inconsistent visibility. A **race condition** is a higher-level logic bug: correctness depends on the relative timing of events, even if individual operations are thread-safe (for example, a check-then-act sequence using separate `containsKey` and `put` calls). You can have a race condition without a data race (TOCTOU). Fix data races with `volatile`/`synchronized`/atomics; fix race conditions with atomic compound operations (`putIfAbsent`, `computeIfAbsent`, `AtomicInteger.incrementAndGet`) or by locking the entire compound sequence.

#### Code Example / Key Takeaways
```java
// Data race: unsynchronized write + read of shared field
int x; // Thread A writes, Thread B reads — no happens-before

// Race condition: check-then-act with individually thread-safe operations
if (!map.containsKey(k)) map.put(k, v); // another thread may insert between calls
// Fix: map.putIfAbsent(k, v) — atomic compound
// Or synchronize the whole check-and-put block on one shared lock
```
---
### Q190. What is `Thread.sleep()` vs `Object.wait()` vs `LockSupport.park()`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
`Thread.sleep(ms)` pauses the *current* thread for a duration; it does **not** release any locks, cannot be woken by `notify()`, and is interruptible (`InterruptedException`). `Object.wait()` must be called while holding the object's monitor; it **releases** the monitor, waits until notified or timeout, then re-acquires the monitor. `LockSupport.park()` is a low-level primitive used by `Lock`/`Condition`/`Future`; it parks the thread until `unpark(thread)` or interrupt, does not require a monitor, and is not tied to a timeout unless `parkNanos`. Use `sleep` for delays, `wait`/`notify` for monitor-based coordination, `park` for building synchronizers.

#### Code Example / Key Takeaways
```java
Thread.sleep(1000);          // does not release locks; interruptible
synchronized (obj) { obj.wait(); } // releases monitor, waits for notify
LockSupport.park();          // parks until unpark or interrupt
LockSupport.unpark(otherThread);
```
---
### Q191. How does interruption work in Java?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
Interruption is cooperative: `Thread.interrupt()` sets the interrupt status flag. Blocking methods (`sleep`, `wait`, `join`, `BlockingQueue.take`, `Lock.lockInterruptibly`) throw `InterruptedException` and *clear* the flag. Non-blocking code must poll `Thread.interrupted()` (clears flag) or `isInterrupted()` (does not). Best practice: catch `InterruptedException`, restore the interrupt status (`Thread.currentThread().interrupt()`), and exit — never swallow it. Cancellation of `Future` with `cancel(true)` interrupts the worker. Virtual threads honor interruption the same way.

#### Code Example / Key Takeaways
```java
void work() {
    try {
        while (!Thread.currentThread().isInterrupted()) {
            BlockingQueue.take(); // throws InterruptedException if interrupted
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt(); // restore flag
        return; // exit cooperatively
    }
}
```
---
### Q192. What is `join()` and how does it work?
**Difficulty:** `Basic`
**Category:** Multithreading & Concurrency

#### Answer
`t.join()` blocks the current thread until thread `t` terminates (or a timeout elapses). Internally it waits on `t` as a monitor (`wait()`) until `t` finishes and the JVM `notifyAll`s. `join()` is interruptible. Overloads: `join()`, `join(millis)`, `join(millis, nanos)`. Use it to wait for spawned threads to complete before proceeding — but prefer `ExecutorService.invokeAll`/`CountDownLatch`/`CompletableFuture.allOf` for production. Calling `join()` on a thread that hasn't started or has already terminated returns immediately.

#### Code Example / Key Takeaways
```java
Thread t = new Thread(() -> doWork());
t.start();
t.join(); // current thread waits until t terminates
t.join(1000); // wait at most 1 second
```
---
### Q193. What are daemon vs user threads?
**Difficulty:** `Basic`
**Category:** Multithreading & Concurrency

#### Answer
User (non-daemon) threads keep the JVM alive; the JVM exits only after all user threads have terminated. Daemon threads are background workers (GC, finalizer, `Timer` if `setDaemon(true)`) that the JVM will kill when no user threads remain — they do not prevent JVM shutdown. Set daemon status with `t.setDaemon(true)` *before* `start()`; after start it throws `IllegalThreadStateException`. A thread inherits the daemon status of its creator. Executor threads are typically user threads; if you want a pool that doesn't keep the JVM alive, wrap the `ThreadFactory` to set daemon.

#### Code Example / Key Takeaways
```java
Thread t = new Thread(() -> { while (true) { /* background */ } });
t.setDaemon(true); // MUST before start
t.start();
// JVM can exit even if t is still looping
```
---
### Q194. What is `Phaser` and when would you use it?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
`Phaser` is a more flexible, reusable barrier that supports a **dynamic number of parties** (register/deregister at runtime) and multiple phases. Threads call `arriveAndAwaitAdvance()` to wait for the current phase to complete, then all advance together. Unlike `CyclicBarrier`, parties can be added (`register()`) or removed (`arriveAndDeregister()`) mid-run, making it suitable for tree-structured or dynamically sized parallel algorithms. `onAdvance(phase, registeredParties)` can terminate the phaser when it returns `true`. Use Phaser when party count is not known up front or changes over time.

#### Code Example / Key Takeaways
```java
Phaser phaser = new Phaser(1); // register self
for (int i = 0; i < n; i++) {
    phaser.register();
    new Thread(() -> {
        doWork();
        phaser.arriveAndDeregister();
    }).start();
}
phaser.arriveAndAwaitAdvance(); // wait for all workers
```
---
### Q195. What is `Exchanger`?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
`Exchanger<V>` is a two-party synchronizer that lets two threads swap objects at a rendezvous point. Thread A calls `exchange(a)` and blocks until thread B calls `exchange(b)`; then A receives `b` and B receives `a`. Typical use: producer/consumer pipelines with double-buffering — producer fills a buffer, exchanges it with consumer's empty buffer, and they swap roles without extra copying. Timeout and interruptible variants exist. Only two parties — for N-way, use `CyclicBarrier` or a queue.

#### Code Example / Key Takeaways
```java
Exchanger<List<Integer>> ex = new Exchanger<>();
// Producer
List<Integer> buf = new ArrayList<>();
while (true) {
    fill(buf);
    buf = ex.exchange(buf); // swap full for empty
}
// Consumer
List<Integer> empty = new ArrayList<>();
while (true) {
    empty = ex.exchange(empty); // swap empty for full
    drain(empty);
}
```
---
### Q196. What are concurrent collections (`ConcurrentHashMap`, `CopyOnWriteArrayList`, `BlockingQueue`)?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
`java.util.concurrent` collections are thread-safe without wrapping in `Collections.synchronizedXxx`:
- **`ConcurrentHashMap`**: lock-striping (Java 7) / CAS + synchronized bins (Java 8+); allows concurrent reads and a bounded number of concurrent writes. Iterators are weakly consistent (no `ConcurrentModificationException`).
- **`CopyOnWriteArrayList`/`CopyOnWriteArraySet`**: every mutation copies the entire array; reads are lock-free. Great for rare writes, frequent reads (listeners).
- **`BlockingQueue`** (`ArrayBlockingQueue`, `LinkedBlockingQueue`, `SynchronousQueue`, `PriorityBlockingQueue`, `DelayQueue`): producer-consumer queues with blocking `put`/`take`.
Never wrap a concurrent collection in extra `synchronized` unless you need a compound atomic operation not provided by the API.

#### Code Example / Key Takeaways
```java
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
map.putIfAbsent("a", 1);
map.compute("a", (k, v) -> v == null ? 1 : v + 1); // atomic compound
map.merge("a", 1, Integer::sum);

CopyOnWriteArrayList<Listener> listeners = new CopyOnWriteArrayList<>();
listeners.forEach(Listener::onEvent); // snapshot, no CME

BlockingQueue<Task> q = new ArrayBlockingQueue<>(100);
q.put(task);   // blocks if full
Task t = q.take(); // blocks if empty
```
---
### Q197. How does `ConcurrentHashMap` work internally (Java 8+)?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
Java 8+ `ConcurrentHashMap` uses a table of bins. Empty bins are filled with CAS. Colliding keys form a linked list; if a bin grows past `TREEIFY_THRESHOLD` (8) and table is large enough, it treeifies into a red-black tree (`TreeBin`) for O(log n) lookup. Writes lock the *bin* (`synchronized` on the first node) rather than the whole map. Size is computed via a `CounterCell` array (similar to `LongAdder`) to avoid a global lock. Iterators are weakly consistent — they may or may not see concurrent updates, but they never throw `ConcurrentModificationException` and never return the same key twice.

#### Code Example / Key Takeaways
```java
// Java 8+ ConcurrentHashMap
// - CAS for empty bins
// - synchronized(bin-head) for colliding bins
// - treeify at 8, untreeify at 6
// - size via striped CounterCells (LongAdder-like)
ConcurrentHashMap<K,V> m = new ConcurrentHashMap<>();
m.computeIfAbsent(k, this::load); // lock-free-ish compound
```
---
### Q198. What is the difference between `HashMap`, `Hashtable`, `Collections.synchronizedMap`, and `ConcurrentHashMap`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
- **`HashMap`**: not thread-safe; concurrent mutation can cause infinite loops (pre-Java 8) or lost updates. Fine for single-thread.
- **`Hashtable`**: fully synchronized (legacy); every method locks the entire table — correct but slow; `null` keys/values forbidden.
- **`Collections.synchronizedMap(map)`**: wraps any map with a mutex on every method; compound operations (`if (!contains) put`) still race unless you lock the wrapper yourself.
- **`ConcurrentHashMap`**: designed for concurrency — finer-grained locking, compound atomic methods (`putIfAbsent`, `compute`), no `null`s, weakly consistent iterators. Default choice for concurrent maps.

#### Code Example / Key Takeaways
```java
// Hashtable / synchronizedMap: whole-map lock, compound ops still racy
Map<K,V> sync = Collections.synchronizedMap(new HashMap<>());
synchronized (sync) { if (!sync.containsKey(k)) sync.put(k, v); } // extra lock needed

// ConcurrentHashMap: built-in atomic compounds
ConcurrentHashMap<K,V> chm = new ConcurrentHashMap<>();
chm.putIfAbsent(k, v);
```
---
### Q199. What is `StampedLock`?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
`StampedLock` (Java 8) is an optimistic read-write lock that returns a `long` stamp on acquire. Modes: (1) **write lock** (exclusive); (2) **read lock** (pessimistic shared); (3) **optimistic read** (`tryOptimisticRead`) — no lock, just a stamp; after reading, `validate(stamp)` checks if a write occurred in between. If invalid, fall back to a pessimistic read. Optimistic reads are extremely cheap for read-heavy, write-rare data. Caveats: not reentrant, no `Condition`, deadlock-prone if you mix modes incorrectly, and a thread holding a read lock cannot upgrade without deadlock (must convert via `tryConvertToWriteLock`).

#### Code Example / Key Takeaways
```java
StampedLock sl = new StampedLock();
double x, y;
double distance() {
    long stamp = sl.tryOptimisticRead();
    double cx = x, cy = y;
    if (!sl.validate(stamp)) { // write happened — fall back
        stamp = sl.readLock();
        try { cx = x; cy = y; } finally { sl.unlockRead(stamp); }
    }
    return Math.hypot(cx, cy);
}
```
---
### Q200. What is `ThreadFactory` and why customize it?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
`ThreadFactory` is an interface (`newThread(Runnable)`) used by executors to create worker threads. The default factory produces unnamed, non-daemon, normal-priority threads (`pool-N-thread-M`). Custom factories let you: (1) set meaningful names for debugging (`jstack`/`jconsole`); (2) set daemon status; (3) set priority; (4) set `UncaughtExceptionHandler`; (5) wrap `Runnable` to restore `ThreadLocal`s. Always name threads in production — unnamed threads make dumps unreadable.

#### Code Example / Key Takeaways
```java
ThreadFactory named = r -> {
    Thread t = new Thread(r);
    t.setName("worker-" + t.getId());
    t.setUncaughtExceptionHandler((th, ex) -> log.error(th.getName(), ex));
    t.setDaemon(false);
    return t;
};
ExecutorService es = Executors.newFixedThreadPool(8, named);
```
---
### Q201. What is `RejectedExecutionHandler`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
When a `ThreadPoolExecutor` cannot accept a task (queue full and pool at `maxPoolSize`, or after `shutdown()`), it invokes the `RejectedExecutionHandler`. Built-in policies:
- **`AbortPolicy`** (default): throws `RejectedExecutionException`.
- **`CallerRunsPolicy`**: the *calling* thread runs the task — natural backpressure.
- **`DiscardPolicy`**: silently drop the task.
- **`DiscardOldestPolicy`**: drop the oldest queued task and retry.
Choose based on whether losing work is acceptable. `CallerRunsPolicy` is a good default for bounded work that must not be lost.

#### Code Example / Key Takeaways
```java
new ThreadPoolExecutor(4, 8, 60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(100),
    new ThreadPoolExecutor.CallerRunsPolicy()); // backpressure: caller runs
```
---
### Q202. How do you shut down an `ExecutorService` correctly?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
Never just abandon a pool — threads will keep the JVM alive. Pattern: (1) `shutdown()` — stop accepting new tasks, finish queued ones; (2) `awaitTermination(timeout)` — wait for completion; (3) if timeout, `shutdownNow()` — interrupt running tasks and return unexecuted ones; (4) `awaitTermination` again. Java 19+ `ExecutorService` is `AutoCloseable` — `try-with-resources` calls `close()` which does this dance. Always restore interrupt status if `awaitTermination` is interrupted.

#### Code Example / Key Takeaways
```java
ExecutorService es = Executors.newFixedThreadPool(4);
try {
    // submit work
} finally {
    es.shutdown();
    try {
        if (!es.awaitTermination(30, TimeUnit.SECONDS)) {
            es.shutdownNow();
            es.awaitTermination(10, TimeUnit.SECONDS);
        }
    } catch (InterruptedException e) {
        es.shutdownNow();
        Thread.currentThread().interrupt();
    }
}
// Java 19+: try (var es = Executors.newVirtualThreadPerTaskExecutor()) { ... }
```
---
### Q203. What is `ScheduledExecutorService`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
`ScheduledExecutorService` (`Executors.newScheduledThreadPool(n)`) schedules tasks with delays or periodically. Methods: `schedule(task, delay, unit)` (one-shot delayed), `scheduleAtFixedRate` (period measured from *start* of previous run — can overlap if a run exceeds the period), `scheduleWithFixedDelay` (period measured from *end* of previous run — never overlaps). Prefer `ScheduledThreadPoolExecutor` over `java.util.Timer` (Timer is single-threaded and a thrown exception kills it). Catch exceptions inside the task — an uncaught exception silently cancels subsequent periodic runs.

#### Code Example / Key Takeaways
```java
ScheduledExecutorService sch = Executors.newScheduledThreadPool(2);
sch.schedule(() -> log("once"), 5, TimeUnit.SECONDS);
sch.scheduleAtFixedRate(this::tick, 0, 1, TimeUnit.SECONDS); // every 1s from start
sch.scheduleWithFixedDelay(this::tick, 0, 1, TimeUnit.SECONDS); // 1s after previous ends
```
---
### Q204. What is `invokeAll` vs `invokeAny`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
Both take a collection of `Callable`s. `invokeAll` submits all, waits for *all* to complete (or timeout), and returns a list of `Future`s in the same order — some may have failed (`ExecutionException` on `get()`). `invokeAny` returns the result of the *first successful* task and cancels the rest; if all fail, it throws `ExecutionException`. Use `invokeAll` for fan-out-and-gather; `invokeAny` for racing redundant sources (first successful DNS lookup, first healthy replica).

#### Code Example / Key Takeaways
```java
List<Callable<String>> tasks = List.of(() -> "a", () -> "b");
List<Future<String>> all = es.invokeAll(tasks); // wait for both
String first = es.invokeAny(tasks);             // first success, cancel rest
```
---
### Q205. What is `CompletionService`?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
`ExecutorCompletionService` wraps an `Executor` and a `BlockingQueue` of completed `Future`s. As each submitted task finishes, its `Future` is placed on the completion queue, so you can `take()` results in *completion order* rather than submission order. Useful when you want to process results as they arrive (don't wait for the slowest). Contrast with `invokeAll`, which returns in submission order after all complete.

#### Code Example / Key Takeaways
```java
CompletionService<String> cs = new ExecutorCompletionService<>(es);
int n = 10;
for (int i = 0; i < n; i++) cs.submit(() -> fetch(i));
for (int i = 0; i < n; i++) {
    String r = cs.take().get(); // next completed, not next submitted
    process(r);
}
```
---
### Q206. What is double-checked locking and is it safe in Java?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
Double-checked locking (DCL) is a singleton idiom: check without lock, if null then lock and check again, then initialize. Pre-Java 5 it was broken because the constructor write could be reordered with the reference write, so another thread could see a non-null reference to a partially constructed object. Java 5+ JMM makes it safe **if the instance field is `volatile`**, because a volatile write happens-before subsequent volatile reads, publishing the fully constructed object. Prefer enum singleton or holder-class (lazy, thread-safe without explicit locks) unless you have a measured need for DCL.

#### Code Example / Key Takeaways
```java
class Dcl {
    private static volatile Dcl instance; // volatile is REQUIRED
    static Dcl get() {
        if (instance == null) {
            synchronized (Dcl.class) {
                if (instance == null) instance = new Dcl();
            }
        }
        return instance;
    }
}
// Safer: holder class
class Holder {
    private static class H { static final Holder I = new Holder(); }
    static Holder get() { return H.I; }
}
```
---
### Q207. What is `AtomicReference` and when is it useful?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
`AtomicReference<V>` holds a single object reference that can be updated atomically via CAS (`compareAndSet`, `getAndSet`, `updateAndGet`). Use it to atomically swap immutable snapshots (config objects, caches) without locks. Combined with immutable data, it implements lock-free publish: writers construct a new object, CAS it in; readers always see a consistent snapshot. For ABA, use `AtomicStampedReference`. `AtomicReferenceArray` is the array analog.

#### Code Example / Key Takeaways
```java
record Config(int timeout, String url) {}
AtomicReference<Config> cfg = new AtomicReference<>(new Config(30, "http://x"));
// lock-free update
cfg.updateAndGet(old -> new Config(old.timeout() + 10, old.url()));
Config snap = cfg.get(); // readers never see a torn Config
```
---
### Q208. What is `LongAdder` and when should you prefer it over `AtomicLong`?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
`LongAdder` (Java 8) is a scalable counter that internally uses a `base` plus a striped array of `Cell`s. Under contention, threads increment different cells (via probing), avoiding a single hot CAS location. `sum()` aggregates all cells (may miss concurrent updates — weakly consistent). Prefer `LongAdder` for high-contention, write-heavy counters (request counts, metrics) where you mostly increment and occasionally read the total. Prefer `AtomicLong` when you need a precise current value often, or CAS-based algorithms (`compareAndSet`). `DoubleAdder`/`LongAccumulator` follow the same idea.

#### Code Example / Key Takeaways
```java
LongAdder hits = new LongAdder();
hits.increment();        // cheap under contention
long total = hits.sum(); // approximate under concurrent writes
// vs AtomicLong: one CAS location, retries under contention
```
---
### Q209. What is `Thread.yield()` and `Thread.priority`?
**Difficulty:** `Basic`
**Category:** Multithreading & Concurrency

#### Answer
`Thread.yield()` is a hint to the scheduler that the current thread is willing to yield its remaining time slice. The JVM/OS may ignore it; never use it for correctness (not a lock, not a wait). Thread priority (`MIN_PRIORITY=1`, `NORM=5`, `MAX=10`) is also a hint; many OSes ignore or coarsen it, and relying on it for correctness is a bug. Starvation can occur if you mix high and low priorities under a non-fair scheduler. Prefer proper synchronization and fair locks over priority tricks.

#### Code Example / Key Takeaways
```java
Thread.currentThread().setPriority(Thread.MAX_PRIORITY); // hint only
Thread.yield(); // hint only — never for correctness
```
---
### Q210. What is `LockSupport`?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
`LockSupport` is the lowest-level parking primitive used to implement locks, `Future`, `CompletableFuture`, `ForkJoinPool`, etc. `park()` parks the current thread; `unpark(t)` makes a permit available so the next `park()` of `t` returns immediately (or wakes it if already parked). Unlike `wait/notify`, `unpark` is *not* lost if it happens before `park` — a permit is stored. No monitor is required. Interrupt unparks and sets the interrupt flag without throwing. Building custom synchronizers on `LockSupport` + `AtomicInteger` is how AQS (`AbstractQueuedSynchronizer`) works.

#### Code Example / Key Takeaways
```java
Thread worker = Thread.currentThread();
LockSupport.park();          // wait for permit
LockSupport.unpark(worker);  // grant permit (safe if called first)
// AQS: FIFO queue of waiters + park/unpark
```
---
### Q211. What is `AbstractQueuedSynchronizer` (AQS)?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
AQS is the framework behind `ReentrantLock`, `Semaphore`, `CountDownLatch`, `ReentrantReadWriteLock`, `FutureTask`, etc. It maintains a FIFO wait queue of threads (CLH-style) and an `int state` that subclasses interpret (e.g., hold count, permit count). Subclasses implement `tryAcquire`/`tryRelease` (exclusive) or `tryAcquireShared`/`tryReleaseShared` (shared). AQS handles queuing, parking (`LockSupport`), fairness, and interruption. Understanding AQS explains why `ReentrantLock` can have conditions, why `Semaphore` has no owner, and why these primitives share similar performance characteristics.

#### Code Example / Key Takeaways
```java
// Conceptual: ReentrantLock is an AQS subclass
// state = hold count; exclusive owner thread
// tryAcquire: if state==0 CAS 0->1 and set owner; if owner==current, state++
// tryRelease: state--; if 0, clear owner, unpark successor
class Mutex extends AbstractQueuedSynchronizer {
    protected boolean tryAcquire(int a) { return compareAndSetState(0, 1); }
    protected boolean tryRelease(int a) { setState(0); return true; }
}
```
---
### Q212. What is `CompletionStage` vs `CompletableFuture`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
`CompletionStage` is the interface defining the async chaining contract (`thenApply`, `thenCombine`, `exceptionally`, etc.). `CompletableFuture` is the standard concrete implementation that also implements `Future` (blocking `get()`). You can write code that accepts `CompletionStage` for flexibility (other impls like `CompletionStage` from reactive libs). `CompletableFuture` adds manual completion (`complete`, `completeExceptionally`) and `Future` methods. Prefer `CompletionStage` in APIs to decouple from the implementation.

#### Code Example / Key Takeaways
```java
// API takes CompletionStage — caller can pass CompletableFuture or other impl
CompletionStage<String> fetch() { return CompletableFuture.supplyAsync(() -> "x"); }
// CompletableFuture = CompletionStage + Future (blocking get, cancel)
```
---
### Q213. How do you handle exceptions in `CompletableFuture` chains?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
Exceptions in a stage propagate to the next stage that has an exception handler. Handlers: `exceptionally(Function<Throwable, T>)` returns a recovery value (stage completes normally with it); `handle(BiFunction<T, Throwable, U>)` receives both value and exception (exactly one is null) and returns a new value; `whenComplete(BiConsumer<T, Throwable>)` is a terminal side-effect that propagates the result/exception unchanged. If no handler is present, the final `Future.get()` throws `ExecutionException` wrapping the cause. `get()` on a completed exceptionally future rethrows the cause wrapped in `CompletionException` (subclass of `RuntimeException`).

#### Code Example / Key Takeaways
```java
CompletableFuture.supplyAsync(() -> { throw new IOException("fail"); })
    .exceptionally(ex -> "fallback")          // recover value
    .thenAccept(System.out::println);         // prints "fallback"

// handle: both value and ex available
CompletableFuture.supplyAsync(() -> 1/0)
    .handle((v, ex) -> ex == null ? v : -1);

// whenComplete: terminal logging, propagates unchanged
CompletableFuture.supplyAsync(() -> "ok")
    .whenComplete((v, ex) -> log.info("done: " + v));
```
---
### Q214. What is `allOf` and `anyOf` in `CompletableFuture`?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
`CompletableFuture.allOf(f1, f2, ...)` returns a `CompletableFuture<Void>` that completes when *all* given futures complete (or any fails). Use `allOf(...).join()` to wait for a batch, then inspect individual futures for results. `anyOf(f1, f2, ...)` returns a `CompletableFuture<Object>` that completes with the result of the *first* to complete (success or failure); use for timeout races or redundant calls. Note: `allOf` does not cancel others on failure; `anyOf` does not cancel the rest on completion — you may want to cancel manually.

#### Code Example / Key Takeaways
```java
CompletableFuture<String> a = CompletableFuture.supplyAsync(() -> "a");
CompletableFuture<String> b = CompletableFuture.supplyAsync(() -> "b");
CompletableFuture<Void> both = CompletableFuture.allOf(a, b);
both.join(); // wait for both
List<String> results = List.of(a.join(), b.join());

CompletableFuture<Object> first = CompletableFuture.anyOf(a, b);
Object fast = first.join(); // first result
```
---
### Q215. What is `StructuredTaskScope` (Java 21/24)?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
`StructuredTaskScope` (JEP 453, preview Java 21, finalized Java 24) implements **structured concurrency**: a scope that owns a set of subtasks and guarantees all complete (or are cancelled) before the scope exits. `try (var scope = new StructuredTaskScope.ShutdownOnFailure()) { Future<A> a = scope.fork(() -> fetchA()); Future<B> b = scope.fork(() -> fetchB()); scope.join(); }` — on any failure, `ShutdownOnFailure` cancels the others; `ShutdownOnSuccess` cancels remaining on first success. This eliminates orphaned threads and resource leaks. Scopes are nestable and enforce that children outlive parents.

#### Code Example / Key Takeaways
```java
// Java 24+ finalized
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Future<String> user = scope.fork(() -> fetchUser(id));
    Future<List<Order>> orders = scope.fork(() -> fetchOrders(id));
    scope.join();            // wait for all, propagate exceptions
    scope.throwIfFailed();   // throw first exception if any
    return new Profile(user.get(), orders.get());
}
```
---
### Q216. What is `ScopedValue` (Java 21+)?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
`ScopedValue` (JEP 446, preview Java 21, finalized Java 24) provides **implicit context propagation** across virtual threads without `ThreadLocal`. It is a write-once (per scope) immutable key-value pair that is captured when a `ScopedValue.where(key, value).run(() -> ...)` scope is entered, and automatically visible to all virtual threads created within that scope (including those in `StructuredTaskScope`). It avoids the memory leak and cross-task contamination of `ThreadLocal` in thread pools. Use for request IDs, auth tokens, DB sessions.

#### Code Example / Key Takeaways
```java
// Java 24+ finalized
static final ScopedValue<String> TRACE_ID = ScopedValue.newInstance();

void handle(Request req) {
    ScopedValue.where(TRACE_ID, req.traceId()).run(() -> {
        // any virtual thread spawned here sees TRACE_ID
        StructuredTaskScope.ShutdownOnFailure scope = new StructuredTaskScope.ShutdownOnFailure();
        scope.fork(() -> log(TRACE_ID.get())); // "abc-123"
        scope.join();
    });
}
```
---
### Q217. What is the Memory Consistency Error and how to avoid it?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
A memory consistency error occurs when different threads have inconsistent views of shared data due to lack of a happens-before relationship (reordering, caching). Avoiding it means establishing happens-before edges: use `synchronized`, `volatile`, atomic classes, or concurrent collections; follow the safe-publication rules (final fields, `volatile`, thread-confined). The key is not just "atomicity" but "visibility" — without a happens-before edge, there is no guarantee a thread sees another's writes.

#### Code Example / Key Takeaways
```java
// Inconsistent view without happens-before
boolean ready = false; int value = 0;
// Writer: value = 42; ready = true;
// Reader: if (ready) System.out.println(value); // may print 0 or 42!
// Fix: make ready volatile (write happens-before read) -> reader sees 42.
```
---
### Q218. What is safe publication in Java?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
Safe publication means ensuring that when one thread makes an object visible to another, the other sees the object in a fully constructed, consistent state. Ways to safely publish: (1) store in a `static final` field (JMM guarantees final-field semantics + class-init lock); (2) store in a `volatile` field or `AtomicReference`; (3) store in a properly locked field; (4) put in a thread-safe collection (`ConcurrentHashMap`, `BlockingQueue`); (5) publish through a thread's `start()` or `join()`. Danger: letting `this` escape during construction (e.g., registering `this` in the constructor) exposes a partially constructed object.

#### Code Example / Key Takeaways
```java
// Safe: static final (class init lock + final semantics)
static final Config CFG = new Config();
// Safe: volatile publish
volatile Resource r;
r = new Resource(); // any thread reading r sees full object
// UNSAFE: this escapes constructor -> partial construction visible
class Bad { Bad() { registry.register(this); } }
```
---
### Q219. What is `final` field semantics in the JMM?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
The JMM guarantees that a `final` field initialized in the constructor is visible to other threads *without further synchronization*, provided the object reference does not escape during construction. The write of the final field in the constructor happens-before the first read of that field by another thread, and the constructor's actions happen-before the object becomes visible. This is why immutable objects with all fields `final` are inherently thread-safe after safe publication.

#### Code Example / Key Takeaways
```java
class Immutable {
    final int x;
    final String s;
    Immutable(int x, String s) {
        this.x = x;
        this.s = s;
    }
}
// Thread A: Immutable i = new Immutable(1, "a");
// Thread B: reads i.x, i.s — guaranteed to see 1 and "a" without volatile/sync
```
---
### Q220. What is false sharing and how do you avoid it?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
False sharing occurs when independent variables updated by different threads reside on the same CPU cache line (typically 64 bytes). Even though the variables are logically independent, writes invalidate the shared cache line, causing heavy cache-coherence traffic and poor performance. Java 8 introduced `@Contended` (internal annotation) to pad fields, but it requires `-XX:-RestrictContended`. `LongAdder` avoids this via padded striped cells. Avoid by grouping read-mostly fields, padding hot counters, using `LongAdder`, and measuring with JMH — false sharing is a performance issue, not a correctness bug.

#### Code Example / Key Takeaways
```java
// False sharing: x and y likely same cache line; two threads update separately
class Counters { volatile long x, y; }
// Avoid: LongAdder has padded cells (better for hot counters)
LongAdder requests = new LongAdder();
requests.increment();
// Or @jdk.internal.vm.annotation.Contended with JVM flag (not portable API)
```
---
### Q221. How do you detect deadlocks in production?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
No automatic runtime deadlock detection in JVM, but tooling exists: (1) `jstack <pid>` — thread dump shows "BLOCKED" on locks; look for cycles. (2) `ThreadMXBean.findDeadlockedThreads()` / `findMonitorDeadlockedThreads()` — programmatic; returns thread IDs in a deadlock cycle. (3) VisualVM / JConsole — "Detect Deadlock" button. (4) JVM flags: `-XX:+UnlockDiagnosticVMOptions -XX:+LogVMOutput` for deadlock logging (experimental). Add a monitoring thread that periodically checks `ThreadMXBean` and alerts/logs.

#### Code Example / Key Takeaways
```java
ThreadMXBean mx = ManagementFactory.getThreadMXBean();
long[] deadlocked = mx.findDeadlockedThreads();
if (deadlocked != null) {
    ThreadInfo[] infos = mx.getThreadInfo(deadlocked);
    for (ThreadInfo ti : infos) System.err.println(ti);
}
```
---
### Q222. What is `CompletableFuture` `thenComposeAsync` vs `thenCompose`?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
`thenCompose` executes the dependent function on the *same thread* that completes the previous stage (which may be a caller thread, a ForkJoinPool worker, or a custom executor's thread). `thenComposeAsync` submits the dependent function to an `Executor` (default: `ForkJoinPool.commonPool()`) — ensuring it runs asynchronously and avoiding "blocking" the completing thread. Use `thenComposeAsync` when the next stage may block or is CPU-intensive, to keep the upstream thread (or common pool) free. Overloads let you supply a custom executor.

#### Code Example / Key Takeaways
```java
// runs on same thread that completed fetchId
fetchId().thenCompose(id -> fetchUser(id));

// runs on commonPool (or supplied executor), not on fetchId's thread
fetchId().thenComposeAsync(id -> fetchUser(id));
fetchId().thenComposeAsync(id -> fetchUser(id), myExecutor);
```
---
### Q223. What is the difference between `Thread.startVirtualThread` and `Thread.ofVirtual().start`?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
Java 21 introduced two ways: `Thread.startVirtualThread(Runnable)` (static factory, creates and starts in one call, unnamed) and `Thread.ofVirtual().name("vt-", 0).start(Runnable)` (builder API for naming, inheriting thread-local behavior, `ThreadGroup`, etc.). `startVirtualThread` is a shortcut; `ofVirtual()` returns a `Thread.Builder.OfVirtual` for configuration. Both schedule on the virtual-thread scheduler. The builder also supports `start(() -> ...)` and `unstarted(() -> ...)` if you need a reference before starting.

#### Code Example / Key Takeaways
```java
// Java 21+
Thread.startVirtualThread(() -> System.out.println("hi")); // quick one-off
Thread vt = Thread.ofVirtual().name("worker-", 0).unstarted(() -> work());
vt.start(); // later
```
---
### Q224. When should you NOT use virtual threads?
**Difficulty:** `Advanced`
**Category:** Multithreading & Concurrency

#### Answer
Virtual threads are for I/O-bound, blocking-style code with many concurrent tasks. Avoid or use platform threads when: (1) **CPU-bound** workloads — virtual threads don't add parallelism beyond core count; use a bounded `ForkJoinPool`/fixed pool. (2) **Pinning** — code that holds `synchronized` or native frames while doing blocking I/O stalls carriers (Java 21). (3) **Thread-local heavy usage** — millions of virtual threads each with large `ThreadLocal`s can blow heap; clean up with `remove()`. (4) **Tight loops without blocking** — retains carrier, no benefit. (5) **Synchronized thread pools** — `Executors.newVirtualThreadPerTaskExecutor()` is the right fit, not a fixed-size virtual pool.

#### Code Example / Key Takeaways
```java
// WRONG: CPU-bound, no blocking — virtual threads add nothing
try (var e = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 1000; i++) e.submit(() -> heavyCpuLoop()); // use fixed pool
}
// RIGHT: I/O-bound blocking
e.submit(() -> { db.query(); http.get(); }); // virtual threads shine
```
---
### Q225. What are best practices for writing concurrent Java code?
**Difficulty:** `Intermediate`
**Category:** Multithreading & Concurrency

#### Answer
Key principles: (1) **Prefer immutability** — final fields, no setters; safe publication eliminates synchronization. (2) **Use thread-safe libraries** — concurrent collections, `CompletableFuture`, `ExecutorService` — don't roll your own locks unless necessary. (3) **Minimize shared mutable state** — thread confinement, `ThreadLocal`, or copy-on-write. (4) **Use the right synchronizer** — `CountDownLatch` for one-shot wait, `CyclicBarrier` for phases, `Semaphore` for resource limits, `Phaser` for dynamic parties. (5) **Avoid premature optimization** — `synchronized` is fast enough for most; profile first. (6) **Always clean up** — `shutdown()`, `ThreadLocal.remove()`, close resources. (7) **Test under concurrency** — JMH for performance, `jcstress` for correctness, ThreadSanitizer for data races.

#### Code Example / Key Takeaways
```java
// Example: immutable config + thread-safe map + CompletableFuture
record Config(String url, int timeout) {}
Config cfg = new Config("http://api", 30);

ConcurrentHashMap<String, Object> cache = new ConcurrentHashMap<>();
cache.computeIfAbsent(key, k -> load(k)); // atomic

CompletableFuture.supplyAsync(() -> fetch(cfg))
    .thenApply(this::transform)
    .exceptionally(ex -> fallback)
    .thenAccept(this::store);
```
---
