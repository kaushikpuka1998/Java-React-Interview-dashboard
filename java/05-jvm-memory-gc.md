# JVM Architecture & Garbage Collection (Q301–Q350)

---

### Q301. What are the main memory areas of the JVM?
**Difficulty:** `Basic`
**Category:** JVM Architecture & GC

#### Answer
The JVM divides memory into several runtime data areas. The most important are:
- **Heap**: shared across all threads; holds all object instances and arrays. This is where GC happens.
- **Stack (Java Virtual Machine Stack)**: per-thread; holds frames with local variables, operand stack, and return info.
- **Metaspace** (since Java 8, replacing PermGen): stores class metadata (methods, bytecode, symbols).
- **Code Cache**: holds native code produced by the JIT compiler.
- **Program Counter (PC) Register**: per-thread; points to the current instruction.
- **Native Method Stack**: for native (JNI) method calls.

Thread-private areas (PC, stack, native stack) are reclaimed when the thread ends. Heap and metaspace are shared and managed by GC.

#### Code Example / Key Takeaways
```java
// Inspect memory areas using JVM flags at startup:
// java -Xmx512m -Xms512m -XX:MaxMetaspaceSize=128m -XX:+PrintGCDetails MyApp
//
// Programmatic peek at the runtime memory:
public class MemoryAreas {
    public static void main(String[] args) {
        Runtime rt = Runtime.getRuntime();
        System.out.println("Max heap:  " + rt.maxMemory()  / 1024 / 1024 + " MB");
        System.out.println("Total heap:" + rt.totalMemory()/ 1024 / 1024 + " MB");
        System.out.println("Free heap: " + rt.freeMemory() / 1024 / 1024 + " MB");
        long threadId = Thread.currentThread().getId(); // own PC + stack
        System.out.println("Thread id: " + threadId);
    }
}
```

---

### Q302. What is the difference between the heap and the stack?
**Difficulty:** `Basic`
**Category:** JVM Architecture & GC

#### Answer
- **Heap** is shared by all threads and holds objects/arrays. Allocation is dynamic; lifetime is managed by GC. Access is slower and it can throw `OutOfMemoryError`.
- **Stack** is per-thread; each method call pushes a frame holding local primitives and object references (not the objects themselves). It is LIFO, fast, and fixed-size per thread (`-Xss`). Excessive recursion throws `StackOverflowError`.

A common confusion: a `List<String>` reference lives on the stack; the `ArrayList` object and its elements live on the heap.

#### Code Example / Key Takeaways
```java
public class HeapVsStack {
    public static void main(String[] args) {
        int x = 10;                 // primitive 'x' -> stack
        StringBuilder sb = new StringBuilder(); // reference on stack, object on heap
        sb.append("hello");
    }
    // Deep recursion exhausts the STACK, not the heap:
    static void recurse(int n) { recurse(n + 1); } // -> StackOverflowError
}
```

---

### Q303. What is Metaspace and how does it differ from PermGen?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
Before Java 8, class metadata lived in a fixed-size **PermGen** (part of the heap), causing `OutOfMemoryError: PermGen space`. Since Java 8, **Metaspace** uses native memory (outside the heap), auto-growing by default up to the OS limit (or `-XX:MaxMetaspaceSize`). This removed most PermGen OOMs. Metaspace is still collected by GC, but only when classes are unloaded (e.g., when their classloader is collected).

Key flags: `-XX:MetaspaceSize` (initial threshold that triggers GC), `-XX:MaxMetaspaceSize`, `-XX:MinMetaspaceFreeRatio`.

#### Code Example / Key Takeaways
```text
// Java 7 (PermGen):                      Java 8+ (Metaspace):
// -XX:PermSize=64m                        -XX:MetaspaceSize=64m
// -XX:MaxPermSize=256m                    -XX:MaxMetaspaceSize=256m
// String pool + class meta in heap        Class meta in native memory
// -> OutOfMemoryError: PermGen space      -> auto-grows, bounded by MaxMetaspaceSize
```

---

### Q304. What is the Code Cache and what fills it?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
The **Code Cache** is a native-memory region holding machine code compiled by the JIT compilers (C1/C2). When a method is "hot" enough, the JIT compiles its bytecode into optimized native code, which is stored here and executed instead of interpreted bytecode. If the code cache fills (`-XX:ReservedCodeCacheSize`, default ~240 MB), the JIT stops compiling and the JVM falls back to the slower interpreter — a subtle performance cliff.

Flags: `-XX:ReservedCodeCacheSize`, `-XX:+UseCodeCacheFlushing`.

#### Code Example / Key Takeaways
```text
// Tune the code cache when you have MANY hot methods (meta-frameworks, big apps):
// java -XX:ReservedCodeCacheSize=512m -XX:+UseCodeCacheFlushing MyApp
//
// Watch with JIT logging:
// java -XX:+PrintCompilation -XX:+UnlockDiagnosticVMOptions -XX:+PrintCodeCache MyApp
```

---

### Q305. What are Compressed OOPs and why do they matter?
**Difficulty:** `Advanced`
**Category:** JVM Architecture & GC

#### Answer
**Compressed Ordinary Object Pointers (Compressed OOPs)** encode 64-bit heap pointers into 32-bit values by assuming all objects are 8-byte aligned. This shifts the pointer left by 3 bits, so 32 bits can address up to 32 GB (2³² × 8). Benefits: smaller object headers and references → better CPU cache density and throughput. Enabled by default on 64-bit JVMs when heap < ~32 GB. Beyond 32 GB the JVM disables them, making each reference 8 bytes — so a 32 GB heap can actually hold *fewer* objects than a 31 GB one. This is the famous "heap looks bigger but holds less" effect.

Flag: `-XX:+UseCompressedOops` (default on).

#### Code Example / Key Takeaways
```text
// Sweet spot: keep heap under 32 GB to keep compressed oops.
// java -Xmx31g -XX:+UseCompressedOops MyApp   // oops remain 32-bit
// java -Xmx40g                                // compressed oops auto-disabled
//
// Verify it is on:
// java -Xmx31g -XX:+PrintFlagsFinal -version | grep UseCompressedOops
// -> bool UseCompressedOops = true
```

---

### Q306. What is the object header and how does it affect memory?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
Every Java object has a header: a **mark word** (8 bytes: hashcode, GC age, locking state, biased-lock info) and a **klass pointer** (8 bytes, or 4 bytes with compressed oops). So an empty `new Object()` is 16 bytes (8 + 4 + 4 padding) with compressed oops, or 16 bytes (8 + 8) without. Arrays add a 4-byte length field. The header overhead matters a lot for small objects (e.g., an `Integer` is 16 bytes overhead for 4 bytes of data). This is why object churn and tiny wrappers are expensive.

#### Code Example / Key Takeaways
```java
import java.lang.instrument.Instrumentation;

public class ObjectSize {
    // Add: java -javaagent:sizeof.jar -XX:+UseCompressedOops MyApp
    static Instrumentation inst;
    public static void premain(String a, Instrumentation i) { inst = i; }
    public static void main(String[] args) {
        System.out.println("Object:    " + inst.getObjectSize(new Object()));    // 16
        System.out.println("Integer:   " + inst.getObjectSize(Integer.valueOf(1)));// 16
        System.out.println("int[0]:    " + inst.getObjectSize(new int[0]));        // 16 (header+len+pad)
    }
}
```

---

### Q307. What is the difference between a Java process's native memory and the Java heap?
**Difficulty:** `Advanced`
**Category:** JVM Architecture & GC

#### Answer
The **Java heap** is only one consumer of a process's total memory. The OS sees the whole process, which also includes: thread stacks (`-Xss` each, ×number of threads), Metaspace, Code Cache, GC control structures, direct ByteBuffers (`-XX:MaxDirectMemorySize`), JIT, and the JVM native libraries. A process can OOM on the OS even when the heap is not full — the classic "why is my 4 GB heap using 8 GB RSS?" question. Tools: `jcmd <pid> VM.native_memory summary` (Native Memory Tracking).

#### Code Example / Key Takeaways
```text
// Enable Native Memory Tracking and inspect:
// java -XX:NativeMemoryTracking=detail -XX:MaxDirectMemorySize=256m MyApp
// jcmd <pid> VM.native_memory summary
//
// Sample output categories:
//   Java Heap    (reserved/committed)
//   Class        (metaspace)
//   Thread       (stacks)
//   Code         (code cache)
//   Internal     (direct buffers, GC)
```

---

### Q308. What are escape analysis and scalar replacement?
**Difficulty:** `Advanced`
**Category:** JVM Architecture & GC

#### Answer
**Escape analysis** (C2, enabled via `-XX:+DoEscapeAnalysis`, default on) determines whether an object's reference escapes the method/thread. If a newly-created object does not escape, the JIT can: (1) **stack-allocate** it instead of heap-allocating, and (2) **scalar-replace** it — break it into its individual fields (scalars) held in registers/locals, eliminating the object entirely. This removes allocation and GC pressure. If the object *does* escape (returned, stored in a field, passed to another thread), it must be heap-allocated.

#### Code Example / Key Takeaways
```java
public class EscapeAnalysis {
    // 'p' does not escape -> scalar replacement / stack allocation possible.
    static int sum(int a, int b) {
        Point p = new Point(a, b); // may be eliminated entirely
        return p.x + p.y;
    }
    static Point leak(int a, int b) {
        return new Point(a, b);    // escapes -> heap allocated
    }
    static class Point { int x, y; Point(int x,int y){this.x=x;this.y=y;} }
}
// Demonstrate allocation elimination:
// java -XX:+PrintGCDetails -XX:-DoEscapeAnalysis EscapeAnalysis   // more GC
// java -XX:+PrintGCDetails -XX:+DoEscapeAnalysis EscapeAnalysis   // fewer/faster
```

---

### Q309. How is memory laid out for a multithreaded program in the JVM?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
Each thread gets its own **PC register** and **JVM stack** (with one frame per nested method call). Threads share the **heap**, **metaspace**, and **code cache**. The stack size is set by `-Xss` (default ~1 MB on Linux). Too many threads × stack size → native `OutOfMemoryError: unable to create new native thread`. Work-stealing / GC threads also consume native memory. Local variables of primitive type are thread-private; object references on the stack point into the shared heap.

#### Code Example / Key Takeaways
```java
public class ThreadMemory {
    static int shared = 0; // in heap (class static field)
    public static void main(String[] args) throws Exception {
        Runnable r = () -> {
            int local = 42;          // on THIS thread's stack
            System.out.println(local);
        };
        Thread t = new Thread(r);
        t.start(); t.join();
        // -Xss controls per-thread stack: java -Xss256k MyApp
    }
}
```

---

### Q310. What is a memory barrier / happens-before and how does it relate to the JVM memory model?
**Difficulty:** `Advanced`
**Category:** JVM Architecture & GC

#### Answer
The **JVM Memory Model (JMM, JSR-133)** defines **happens-before** rules guaranteeing one thread's writes are visible to another. It is implemented with **memory barriers** (CPU/fence instructions) inserted by the JIT around volatile fields, synchronized blocks, and `final` fields. Key rules: program order (within a thread), monitor lock (unlock happens-before subsequent lock), volatile write happens-before volatile read, thread start/join, and `final` field safe publication. Without a happens-before edge, the JIT/CPU may reorder or cache reads, causing subtle bugs. This is about *visibility and ordering*, not just heap/stack layout.

#### Code Example / Key Takeaways
```java
public class HappensBefore {
    private volatile boolean ready = false;
    private int value = 0;

    void writer() {
        value = 42;          // write
        ready = true;        // volatile write -> barrier: flushes 'value'
    }
    void reader() {
        if (ready) {         // volatile read -> sees prior writes
            System.out.println(value); // always 42
        }
    }
}
```

---

### Q311. What is object reachability and how does GC determine live objects?
**Difficulty:** `Basic`
**Category:** JVM Architecture & GC

#### Answer
An object is **reachable** if it can be accessed through a chain of references starting from **GC roots**. Unreachable objects are considered garbage and eligible for collection. Reachability is computed by a **mark** phase that traverses the object graph from roots; anything not marked is dead. Note "eligible" ≠ "collected" — collection happens later during a GC cycle. `System.gc()` is only a *suggestion*.

#### Code Example / Key Takeaways
```java
public class Reachability {
    public static void main(String[] args) {
        Object a = new Object(); // 'a' is a root reference -> reachable
        Object b = a;            // b points to same object
        a = null;
        // object still reachable via 'b'
        b = null;
        // now unreachable -> eligible for GC on next cycle
    }
}
```

---

### Q312. What are GC roots?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
**GC roots** are the starting points of the reachability graph. They include:
- Local variables and parameters on active thread stacks.
- Active Java threads themselves.
- Static fields of loaded classes.
- JNI (native) references / global JNI handles.
- Synchronized monitors (objects held as locks).
- Objects referenced by the JVM itself (e.g., classloaders, some internal structures).

Anything reachable by following references from these roots is live; everything else is garbage.

#### Code Example / Key Takeaways
```java
public class GCRoots {
    static Object staticRoot = new Object(); // GC root: static field (class-level)
    public static void main(String[] args) {
        Object localRoot = new Object();     // GC root: local var on stack
        synchronized (localRoot) {           // monitor held -> also a root
            // while here, localRoot is strongly reachable
        }
    }
}
```

---

### Q313. Describe the Mark-Sweep-Compact algorithm.
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
Three classic phases:
- **Mark**: traverse from GC roots, mark every reachable object.
- **Sweep**: walk the heap, reclaim memory of unmarked (dead) objects, adding them to a free list.
- **Compact**: move live objects together to eliminate fragmentation, updating references.

Mark-Sweep alone leaves fragmentation; Compact fixes it but is expensive (must update all pointers). This trio underlies most collectors' old-generation handling.

#### Code Example / Key Takeaways
```text
Mark-Sweep-Compact lifecycle:
  Heap before: [L][D][L][D][D][L]   (L=live, D=dead)
  Mark:        [L][ ][L][ ][ ][L]
  Sweep:       [L][_][L][_][_][L]   (free list grows)
  Compact:     [L][L][L][_][_][_]   (no fragmentation, refs updated)
```

---

### Q314. What is the difference between strong, soft, weak, and phantom references?
**Difficulty:** `Advanced`
**Category:** JVM Architecture & GC

#### Answer
Java has four reference strengths, giving you varying control over GC eligibility:
- **Strong** (`new Object()`): never collected while reachable.
- **Soft** (`SoftReference`): collected only when the JVM *needs* memory; great for caches.
- **Weak** (`WeakReference`): collected on the next GC regardless; basis of `WeakHashMap`.
- **Phantom** (`PhantomReference`): enqueued after finalization for post-mortem cleanup; must go through a `ReferenceQueue` and doesn't give access to the object.

#### Code Example / Key Takeaways
```java
import java.lang.ref.*;
import java.util.WeakHashMap;

public class References {
    public static void main(String[] args) {
        Object strong = new Object();
        SoftReference<Object> soft = new SoftReference<>(new Object());
        WeakReference<Object> weak = new WeakReference<>(new Object());
        PhantomReference<Object> phantom = new PhantomReference<>(
            new Object(), new ReferenceQueue<>());

        System.gc();
        System.out.println(soft.get());  // maybe non-null
        System.out.println(weak.get());  // almost certainly null now
        System.out.println(phantom.get()); // ALWAYS null

        WeakHashMap<Object,String> cache = new WeakHashMap<>();
        cache.put(new Object(), "v"); // entry vanishes when key is GC'd
    }
}
```

---

### Q315. What is finalization and why is it discouraged?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
`finalize()` was a hook called by the GC before reclaiming an object. It is discouraged because: (1) calls are unpredictable and may never run (fast exit, no GC); (2) objects with a non-trivial `finalize()` are promoted to a finalization queue, surviving an extra GC cycle (hurts performance); (3) it can resurrect objects; (4) it serializes cleanup on a single thread. Modern Java uses **try-with-resources** / `AutoCloseable` and `java.lang.ref.Cleaner` / `PhantomReference` instead. `finalize()` is deprecated since Java 9 and will be removed.

#### Code Example / Key Takeaways
```java
import java.lang.ref.Cleaner;

public class NoFinalize {
    private static final Cleaner cleaner = Cleaner.create();
    private final Cleaner.Cleanable cleanable;
    private final Resource res;

    NoFinalize() {
        res = new Resource();
        cleanable = cleaner.register(this, res::close); // runs when GC'd
    }
    // Prefer explicit close(); Cleaner is a fallback only.
    public void close() { cleanable.clean(); }

    static class Resource { void close() { System.out.println("cleaned"); } }

    // DON'T: protected void finalize() { ... } // deprecated, slow, unreliable
}
```

---

### Q316. What is the generational hypothesis?
**Difficulty:** `Basic`
**Category:** JVM Architecture & GC

#### Answer
The **weak generational hypothesis** observes that most objects die young (short-lived), and few references point from old objects to young ones. The JVM exploits this by splitting the heap into **young** and **old** generations, collecting the young generation frequently and cheaply (most objects die there), and the old generation rarely. This makes GC far more efficient than a single monolithic heap scan.

#### Code Example / Key Takeaways
```text
Generational hypothesis (empirically ~98% of objects die young):
  Young Gen: collected often, fast, cheap (most garbage here)
  Old Gen:   collected rarely, slow, expensive (long-lived survivors)
```

---

### Q317. Describe the young generation layout: Eden and Survivor spaces.
**Difficulty:** `Basic`
**Category:** JVM Architecture & GC

#### Answer
The **young generation** is split into:
- **Eden**: where new objects are allocated.
- **Survivor spaces (S0, S1)**: hold objects that survived a young GC. Only one survivor space is active at a time; a young GC copies live Eden + active survivor objects into the inactive survivor space (or promotes them to old gen if too old/full). This is a **copying collector** — Eden is emptied each young GC. Default ratio: young ≈ 1/3 of heap, Eden : survivors ≈ 8 : 1 : 1.

#### Code Example / Key Takeaways
```text
Young Gen layout (default):
  +---------+-------+-------+
  |  Eden   |  S0   |  S1   |
  | 80%     | 10%   | 10%   |
  +---------+-------+-------+
After a Minor GC: live objects copied S0->S1 (or promoted to Old), Eden+S0 cleared.
```

---

### Q318. What is a Minor GC, Major GC, and Full GC?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
- **Minor GC**: collects the **young generation** only. Frequent, fast, stop-the-world.
- **Major GC**: collects the **old generation** only (terminology varies by collector).
- **Full GC**: collects **entire heap + metaspace**. Rare, slow, long pauses.
In HotSpot, "Major GC" and "Full GC" are often conflated; the logs (`-Xlog:gc*`) are the source of truth. A Full GC is what you want to avoid in latency-sensitive apps.

#### Code Example / Key Takeaways
```text
// Modern GC logging (Java 9+ unified logging):
// java -Xlog:gc*:file=gc.log:time,uptime,level -jar MyApp.jar
//
// Sample:
// [0.3s] GC(0) Pause Young (Allocation Failure) 25M->5M(100M) 12ms   <- Minor
// [1.2s] GC(3) Pause Full (Ergonomics)           90M->40M(512M) 220ms <- Full
```

---

### Q319. What is object tenuring and the tenuring threshold?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
Objects that survive multiple young GCs are eventually **tenured** (promoted) to the old generation. The **tenuring threshold** is the number of young-GC survivals before promotion (tracked as an object's "age" in its header, max 15). `-XX:MaxTenuringThreshold` sets the cap. Premature promotion floods the old gen; overly high thresholds keep objects bouncing between survivor spaces. Adaptive sizing (`-XX:+UseAdaptiveSizePolicy`, default) tunes this automatically.

#### Code Example / Key Takeaways
```text
// java -XX:MaxTenuringThreshold=15 -XX:+PrintTenuringDistribution MyApp
//
// Log shows age histogram each minor GC:
// Desired survivor size 5M, new threshold 15 (max 15)
// - age   1:   2M bytes,   2M total
// - age   2: 500K bytes, 2.5M total
// Objects reaching threshold -> promoted to Old Gen.
```

---

### Q320. What is a promotion failure and how does it cause a Full GC?
**Difficulty:** `Advanced`
**Category:** JVM Architecture & GC

#### Answer
During a Minor GC, surviving young objects must be promoted into the old generation. If the old gen lacks contiguous space (fragmentation) or is nearly full, a **promotion failure** occurs. The JVM then triggers a **Full GC** to compact the old gen and make room — turning a cheap minor pause into a long full pause. This is a classic cause of unpredictable latency spikes. Mitigations: larger old gen, lower promotion rate, or a collector with concurrent old-gen collection (G1/ZGC/Shenandoah).

#### Code Example / Key Takeaways
```text
// Promotion failure symptom in logs:
// [2.1s] GC(5) Pause Young (Allocation Failure)
// [2.1s] GC(5) Promotion failed
// [2.1s] GC(6) Pause Full (Allocation Failure) ... long pause
//
// Fix paths:
//  - increase old gen (lower -XX:NewRatio)
//  - reduce allocation rate (object reuse, pooling)
//  - switch to G1/ZGC with concurrent old-gen collection
```

---

### Q321. Compare Serial, Parallel, CMS, G1, ZGC, and Shenandoah collectors.
**Difficulty:** `Advanced`
**Category:** JVM Architecture & GC

#### Answer
- **Serial** (`-XX:+UseSerialGC`): single-threaded; young + old. Simplest, lowest overhead for tiny heaps/CLI tools.
- **Parallel (Throughput)** (`-XX:+UseParallelGC`): multi-threaded young + old, focuses on max throughput, longer STW pauses.
- **CMS** (`-XX:+UseConcMarkSweepGC`, removed in Java 14): concurrent old-gen marking to reduce pause, but fragments and can fall back to Full GC. Deprecated.
- **G1** (`-XX:+UseG1GC`, default since Java 9): region-based, incremental, predictable pause goals via `-XX:MaxGCPauseMillis`.
- **ZGC** (`-XX:+UseZGC`, production since Java 15): concurrent, sub-millisecond pauses regardless of heap size (TB-scale), uses colored pointers + load barriers.
- **Shenandoah** (OpenJDK, `-XX:+UseShenandoahGC`): concurrent compaction, low pauses, region-based like G1 but with concurrent move.

#### Code Example / Key Takeaways
```text
// Select a collector:
// java -XX:+UseSerialGC        MyApp   // tiny apps, single core
// java -XX:+UseParallelGC      MyApp   // batch/throughput
// java -XX:+UseG1GC            MyApp   // balanced default (Java 9+)
// java -XX:+UseZGC             MyApp   // low-latency, large heaps
// java -XX:+UseShenandoahGC    MyApp   // low-latency (Red Hat/OpenJDK)
//
// CMS removed in JDK 14 -> do not use in modern Java.
```

---

### Q322. How does the Serial GC work?
**Difficulty:** `Basic`
**Category:** JVM Architecture & GC

#### Answer
Serial GC uses a **single thread** for both young (copying) and old (mark-sweep-compact) collections, pausing all application threads (STW) during each. It has the smallest footprint and simplest implementation, making it ideal for small heaps (< 100 MB), single-processor machines, or short-lived CLI tools. It is a poor choice for multi-core servers where parallel collectors shine.

#### Code Example / Key Takeaways
```text
// Enable Serial GC:  java -XX:+UseSerialGC -Xmx64m MyApp
// Best for: embedded, CLI utilities, constrained containers.
// Avoid for: web servers, multi-core, latency-sensitive services.
```

---

### Q323. How does the Parallel (Throughput) GC work?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
Parallel GC (a.k.a. "Throughput Collector") uses **multiple threads** for both minor and full GCs, maximizing throughput (work done per unit time) at the cost of longer stop-the-world pauses. It was the default in Java 8. Key tunables: `-XX:ParallelGCThreads`, and adaptive sizing goals `-XX:MaxGCPauseMillis` and `-XX:GCTimeRatio` (e.g., 99 = 1% time in GC).

#### Code Example / Key Takeaways
```text
// java -XX:+UseParallelGC -XX:ParallelGCThreads=8 -XX:GCTimeRatio=99 MyApp
//   GCTimeRatio=99 -> GC time <= 1% of total (throughput goal)
//   MaxGCPauseMillis=N -> hint for pause goal (best-effort)
// Goal: maximize throughput, accept longer STW pauses.
```

---

### Q324. How does the Concurrent Mark Sweep (CMS) collector work and why was it removed?
**Difficulty:** `Advanced`
**Category:** JVM Architecture & GC

#### Answer
CMS collected the **old generation concurrently** with the application to minimize pause times. Phases: initial mark (STW, short) → concurrent mark → remark (STW, short) → concurrent sweep. It did **not** compact, so the old gen fragmented over time, eventually forcing a long stop-the-world **Full GC** to defragment. Combined with its complexity and bugginess, it was deprecated in Java 9 and **removed in Java 14**, superseded by G1/ZGC/Shenandoah.

#### Code Example / Key Takeaways
```text
// Deprecated/removed:  java -XX:+UseConcMarkSweepGC MyApp
//   error: 'CMS' is deprecated and will likely be removed in a future release
//   removed entirely in JDK 14.
// Problems: old-gen fragmentation -> promotion failures -> Full GC.
// Modern replacement: G1 (default) or ZGC/Shenandoah for low latency.
```

---

### Q325. How does G1 GC organize the heap and why is it the default?
**Difficulty:** `Advanced`
**Category:** JVM Architecture & GC

#### Answer
**G1 (Garbage-First)** splits the heap into ~2048 equal **regions** (each 1–32 MB), each dynamically tagged as Eden, Survivor, Old, or Humongous (for large objects > half a region). Instead of collecting generations wholesale, G1 tracks region **liveness** and collects the regions with the most garbage first ("garbage-first"). It can meet a **pause-time goal** (`-XX:MaxGCPauseMillis`, default 200 ms) by limiting how many regions it evacuates per cycle, using a **mixed collection** that reclaims both young and some old regions. It compacts concurrently-ish (evacuation), avoiding fragmentation. Default since Java 9.

#### Code Example / Key Takeaways
```text
// G1 region view:
// [E][E][S][O][H][E][O][O][E][S]...   each ~1-32 MB
// Collector picks high-garbage regions first to hit pause goal.
// java -XX:+UseG1GC -XX:MaxGCPauseMillis=100 -XX:G1HeapRegionSize=4m MyApp
```

---

### Q326. What is a humongous object in G1 and how is it handled?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
In G1, an object larger than **half a region** is a **humongous object**, allocated directly into one or more contiguous **Humongous regions** (outside young/old). Humongous objects are expensive: they are collected only during a Full GC or a **concurrent marking / mixed cycle**, and can fragment the heap quickly. Allocating many short-lived large arrays is a known G1 anti-pattern. Mitigation: increase region size (`-XX:G1HeapRegionSize`) or reduce large allocations.

#### Code Example / Key Takeaways
```java
public class Humongous {
    public static void main(String[] args) {
        // A 3 MB array in a 4 MB region -> humongous (needs > 2 MB)
        byte[] big = new byte[3 * 1024 * 1024]; // allocated in humongous regions
        // Many of these churn -> G1 pressure; consider pooling or bigger regions.
    }
}
// java -Xmx1g -XX:+UseG1GC -XX:G1HeapRegionSize=8m Humongous
// Logs: "Humongous regions: N" with -Xlog:gc*=info
```

---

### Q327. How does ZGC achieve sub-millisecond pauses?
**Difficulty:** `Advanced`
**Category:** JVM Architecture & GC

#### Answer
ZGC's hallmark is **concurrent** collection: almost all work (marking, relocation/compaction, reference remapping) happens *while the app runs*, with only tiny (sub-ms) STW pauses for root scanning. Two key mechanisms:
- **Colored pointers**: 64-bit pointers embed metadata (mark, remap, relocated bits) in unused high bits, so the GC can track object state without modifying the object.
- **Load barriers**: every object load is intercepted to fix up references pointing to relocated objects (self-healing pointers).
This keeps pause times independent of heap size — from MBs to multi-TB.

#### Code Example / Key Takeaways
```text
// java -XX:+UseZGC -Xmx16g -XX:+UnlockExperimentalVMOptions MyApp  (JDK 11-15 exp)
// java -XX:+UseZGC -Xmx16g MyApp                                (JDK 15+ prod)
//
// ZGC phases (all concurrent except tiny pauses):
//   - Concurrent Mark     (colored pointers + load barriers)
//   - Concurrent Relocate (move objects, leave forwarding info)
//   - Load barrier fixes stale refs on access (self-healing)
// Result: typical pauses < 1-2 ms regardless of heap size.
```

---

### Q328. How does Shenandoah GC differ from G1 and ZGC?
**Difficulty:** `Advanced`
**Category:** JVM Architecture & GC

#### Answer
Shenandoah is a **low-pause, concurrent compaction** collector (originally Red Hat, now in OpenJDK). Like G1 it uses regions, but its differentiator is **concurrent evacuation** of old regions (G1 only evacuates young + selected old in mixed GCs; Shenandoah moves live objects concurrently with the app). It uses a **Brooks pointer** (a forwarding pointer field in each object) plus read/write barriers to make concurrent moves safe. ZGC achieves similar goals with colored pointers + load barriers instead. Both target < 10 ms pauses; Shenandoah historically ran on a wider range of JDK versions and heaps.

#### Code Example / Key Takeaways
```text
// java -XX:+UseShenandoahGC -Xmx8g MyApp
//
// Shenandoah phases (concurrent):
//   Init Mark (STW) -> Concurrent Mark -> Final Mark (STW)
//   Concurrent Compaction (evacuate regions concurrently)
//   Brooks pointer + barriers handle in-flight refs.
// vs ZGC: colored-pointer load barrier vs Brooks-pointer R/W barrier.
```

---

### Q329. What is the String Deduplication feature in G1?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
**String deduplication** (`-XX:+UseStringDeduplication`, G1-only) scans the heap for equal `String` contents and makes them share the same underlying `char[]`/`byte[]` (the strings themselves remain distinct objects, only the backing array is merged). This can significantly cut heap usage for apps with many duplicate strings (e.g., XML/JSON parsers). It adds minor overhead during GC and only applies to strings that have survived a young GC (to avoid deduplicating short-lived strings).

#### Code Example / Key Takeaways
```text
// java -XX:+UseG1GC -XX:+UseStringDeduplication -XX:+PrintStringDeduplicationStatistics MyApp
//
// Trade-off: small GC CPU overhead for potentially large memory savings.
// Only with G1 (and Shenandoah has a similar feature).
// Not a substitute for interning when you need identity equality.
```

---

### Q330. What are the trade-offs between throughput-oriented and latency-oriented collectors?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
- **Throughput-oriented** (Parallel): maximize application work per second; accept longer STW pauses. Best for batch jobs, offline processing, where total runtime matters more than individual pause.
- **Latency-oriented** (G1, ZGC, Shenandoah): minimize individual pause times to keep response times predictable; accept some throughput overhead (concurrent work, barriers). Best for interactive services, trading systems, user-facing apps.
Choose based on SLAs: if p99 latency matters → ZGC/G1; if batch throughput matters → Parallel.

#### Code Example / Key Takeaways
```text
Throughput vs latency decision:
  Batch / ETL / CI        -> Parallel GC (max work/sec)
  Web/API with SLA p99    -> G1 (default, ~100-200ms) or ZGC (<2ms)
  HFT / real-time service -> ZGC or Shenandoah

Tune intent, not just flags:
  Parallel: -XX:GCTimeRatio=99
  G1/ZGC:   -XX:MaxGCPauseMillis=50
```

---

### Q331. How do you size the heap with -Xms and -Xmx?
**Difficulty:** `Basic`
**Category:** JVM Architecture & GC

#### Answer
- `-Xms` sets the **initial** heap size; `-Xmx` the **maximum**. The JVM starts at `-Xms` and grows up to `-Xmx` as needed.
- For server apps, set **`-Xms` = `-Xmx`** to avoid runtime resizing pauses and to commit all memory up front (more predictable). For containers, don't exceed the container memory limit or the OOM killer will terminate the process.
- Also consider `-XX:MaxRAMPercentage` (Java 10+) to size the heap relative to the container's RAM automatically.

#### Code Example / Key Takeaways
```text
// Fixed heap (avoids resize pauses):
// java -Xms4g -Xmx4g MyApp
//
// Container-aware (Java 10+): use a % of container RAM
// java -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 MyApp
//
// NEVER: -Xmx larger than the container limit -> OOM kill by the OS.
```

---

### Q332. How do you set a GC pause-time goal?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
Pause-time goals tell the collector to prefer shorter pauses, often by doing less work per cycle:
- **G1**: `-XX:MaxGCPauseMillis=200` (default 200 ms) — a *soft* goal; G1 shrinks young gen to meet it.
- **ZGC**: `-XX:MaxGCPauseMillis=10` (default ~none hard, inherently low).
- **Parallel**: also accepts the flag but it's a hint; throughput collector prioritizes overall time.
The goal is best-effort: the JVM will trade throughput/heap headroom to approach it but won't violate correctness. Setting it unrealistically low forces very frequent, tiny collections.

#### Code Example / Key Takeaways
```text
// G1 targeting 100 ms pauses:
// java -XX:+UseG1GC -XX:MaxGCPauseMillis=100 -Xmx8g MyApp
//
// Watch realized pauses in logs:
// java -Xlog:gc*:MyApp  -> "Pause Young ... 45ms" vs goal 100ms
// If real pauses >> goal, either lower allocation rate or accept the goal.
```

---

### Q333. What is the NewRatio and how does it affect GC?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
`-XX:NewRatio=N` sets the ratio of **old generation to young generation** (old : young = N : 1). Default is 2 (old is 2× young, so young ≈ 1/3 of heap). A **larger NewRatio** shrinks the young gen → fewer but longer minor GCs, more promotion. A **smaller NewRatio** enlarges young gen → more frequent but cheaper minor GCs, with more room for objects to die young. Tuned for allocation-heavy vs long-lived workloads. (G1 also accepts `-XX:NewSize`/`-XX:MaxNewSize` but manages regions adaptively.)

#### Code Example / Key Takeaways
```text
// -XX:NewRatio=2  -> old:young = 2:1  (young = 1/3 heap, default)
// -XX:NewRatio=1  -> old:young = 1:1  (young = 1/2 heap, more room to die young)
// -XX:NewRatio=3  -> young smaller, more promotion to old
//
// java -Xmx6g -XX:NewRatio=2 -XX:+UseParallelGC MyApp
```

---

### Q334. What GC logging options should you enable in production?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
Use **unified JVM logging** (`-Xlog`) introduced in Java 9 (retire the old `-XX:+PrintGCDetails`, removed in Java 9+):
- `-Xlog:gc*:file=gc.log:time,uptime,level:filecount=5,filesize=10M` — full GC detail, rotated logs.
- For overhead-sensitive prod, log at `info` (not `debug`/`trace`).
- Add `-Xlog:safepoint*` to see STW pause sources beyond GC.
Always capture GC logs in production — they are the primary forensic tool for OOMs and latency spikes, with negligible overhead at `info`.

#### Code Example / Key Takeaways
```text
// Recommended production GC logging:
// java -Xlog:gc*,gc+heap=info,safepoint:file=/var/log/myapp/gc-%t.log:time,tid,level:filecount=10,filesize=20M -jar MyApp.jar
//
// Parse with: GCViewer, GCEasy (gceasy.io), or Prometheus + jmx_exporter.
// Key metrics: pause time, frequency, heap before/after, promotion rate.
```

---

### Q335. How do you read a GC log line (G1 example)?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
A typical G1 `info` line:
`[2026-08-20T10:00:01.234+0000][gc,start] GC(12) Pause Young (Normal) (G1 Evacuation Pause)`
`[gc ] GC(12) Eden: 200.0M(200.0M)->0.0B(220.0M) Survivors: 0.0B->20.0M Heap: 600.0M(1.0G)->420.0M(1.0G)`
`[gc ] GC(12) Pause Young (Normal) (G1 Evacuation Pause) 12.345ms`
Reading it: a **young evacuation pause** collected Eden (200M→0) and reduced total heap (600M→420M) in **12.3 ms**. "Heap: before->after (capacity)" tells you live set and headroom. Mixed collections show Old reclaimed too.

#### Code Example / Key Takeaways
```text
Fields to watch:
  Pause Young / Mixed / Full  -> which collection
  Eden: A->B (C)              -> used before->after (capacity)
  Heap: A->B (C)              -> total used before->after (max)
  final "Xms" number          -> STW pause duration (tune against goal)
//
// High 'after' Heap with frequent Full GCs => memory leak / heap too small.
```

---

### Q336. What is survivor space sizing and the TargetSurvivorRatio?
**Difficulty:** `Advanced`
**Category:** JVM Architecture & GC

#### Answer
The **survivor spaces** hold age-1+ objects between young GCs. `-XX:TargetSurvivorRatio` (default 50) is the desired occupancy of a survivor space; if live objects exceed it after a young GC, the **tenuring threshold is lowered** so more objects promote to old gen early, preventing survivor overflow. This is part of G1/Parallel adaptive sizing. If survivors overflow, objects get promoted prematurely even if young — a promotion-rate problem. Tuning is usually left to the adaptive policy unless you see unwanted early promotions.

#### Code Example / Key Takeaways
```text
// java -XX:TargetSurvivorRatio=50 -XX:MaxTenuringThreshold=15 MyApp
//
// If logs show tenuring threshold dropping to 1 quickly:
//   -> survivor spaces too small OR objects live too long
//   -> raise young gen (lower -XX:NewRatio) to give them room to die young.
```

---

### Q337. How does -XX:+UseAdaptiveSizePolicy work?
**Difficulty:** `Advanced`
**Category:** JVM Architecture & GC

#### Answer
Enabled by default with Parallel and G1, **UseAdaptiveSizePolicy** lets the JVM continuously retune generation sizes, tenuring threshold, and survivor ratios at runtime to meet the pause-time (`MaxGCPauseMillis`) and throughput (`GCTimeRatio`) goals. It reacts to live-set and allocation-rate measurements after each GC. Practical implication: manual `-Xmn`/survivor tuning is often counterproductive because the policy will override it; set high-level goals and let it adapt, only pinning sizes when you have strong evidence.

#### Code Example / Key Takeaways
```text
// Let the JVM adapt (default):
// java -XX:+UseParallelGC -XX:+UseAdaptiveSizePolicy -XX:GCTimeRatio=99 MyApp
//
// Disable to pin your own sizes (experts only):
// java -XX:-UseAdaptiveSizePolicy -Xmn2g -XX:SurvivorRatio=8 MyApp
//   (-Xmn sets fixed young gen = Eden+Survivors)
```

---

### Q338. What is GC throughput vs latency and how do you measure them?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
- **Throughput** = (time doing app work) / (total time). High throughput = GC overhead low (e.g., 99% app time). Measured via `-XX:GCTimeRatio` target or from logs (total GC time / uptime).
- **Latency** = length of individual STW pauses (and their frequency). Measured as p50/p95/p99 pause times from GC logs.
A collector optimizing throughput (Parallel) may have long pauses; one optimizing latency (ZGC) sacrifices some throughput to keep pauses tiny. You cannot maximize both — pick per SLA. Measure with GC logs + Prometheus/Grafana or GCEasy.

#### Code Example / Key Takeaways
```text
// Throughput target:
//   -XX:GCTimeRatio=99  => GC <= ~1% of time
// Latency target:
//   -XX:MaxGCPauseMillis=50
//
// From logs compute:
//   throughput = 100 * (1 - totalGCTime/uptime)%
//   p99 latency = 99th percentile of individual pause durations
```

---

### Q339. What is the class loading process (loading, linking, initialization)?
**Difficulty:** `Basic`
**Category:** JVM Architecture & GC

#### Answer
Class loading has three phases:
1. **Loading**: find the `.class` bytes (via classloader) and create a `Class` object in metaspace.
2. **Linking**: (a) **verification** — bytecode is valid/safe; (b) **preparation** — static fields get default zero values and memory; (c) **resolution** — symbolic references resolved to direct (can be lazy).
3. **Initialization**: run static initializers and static field assignments (`<clinit>`), under a lock so only one thread initializes a class.
A class is usable only after initialization completes.

#### Code Example / Key Takeaways
```java
public class LoadingPhases {
    static int x = compute();          // runs during INITIALIZATION
    static int compute() { return 42; }
    static { System.out.println("initialized"); } // <clinit>

    public static void main(String[] args) throws Exception {
        // Loading + linking happen lazily on first active use:
        Class<?> c = Class.forName("LoadingPhases"); // triggers init
        System.out.println(c.getSimpleName());
    }
}
```

---

### Q340. What are the built-in class loaders and their hierarchy?
**Difficulty:** `Basic`
**Category:** JVM Architecture & GC

#### Answer
Three built-in loaders, parent-child by delegation:
- **Bootstrap (Primordial)**: loads core JDK classes from `jmods`/`rt.jar` (C++ implemented, `null` from Java).
- **Platform/Extension** (`PlatformClassLoader` in Java 9+, formerly `ExtClassLoader`): loads JDK modules/platform classes.
- **Application/System** (`AppClassLoader`): loads your app classes and classpath entries.
Custom loaders extend `ClassLoader` and delegate to a parent. The hierarchy is **not** inheritance but a `parent` reference chain.

#### Code Example / Key Takeaways
```java
public class Loaders {
    public static void main(String[] args) {
        ClassLoader app = Loaders.class.getClassLoader();
        System.out.println("App:      " + app);                     // AppClassLoader
        System.out.println("Platform: " + app.getParent());         // PlatformClassLoader
        System.out.println("Bootstrap:" + app.getParent().getParent()); // null
    }
}
```

---

### Q341. Explain the delegation model (parent-first) of class loading.
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
The **parent-delegation model**: when asked to load class `C`, a loader first delegates to its **parent**; only if the parent cannot find `C` does the loader attempt to load it itself. This prevents duplication and protects core classes (you cannot replace `java.lang.String` because Bootstrap loads it first). It enforces namespace isolation and security. Violating it (e.g., loading a core class in a child) throws `SecurityException` / `LinkageError` ("attempted duplicate class definition").

#### Code Example / Key Takeaways
```java
// Pseudocode of loadClass:
protected Class<?> loadClass(String name, boolean resolve) {
    Class<?> c = findLoadedClass(name);          // 1. already loaded?
    if (c == null) {
        try { c = parent.loadClass(name); }      // 2. delegate UP first
        catch (ClassNotFoundException e) {
            c = findClass(name);                 // 3. only now, load self
        }
    }
    if (resolve) resolveClass(c);
    return c;
}
```

---

### Q342. How do you write a custom ClassLoader?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
Extend `ClassLoader` and override `findClass(String name)` to locate and define bytes (never break delegation by overriding `loadClass` unless you intend to). Read the `.class` bytes, call `defineClass(...)`, and the JVM handles linking/initialization. Common uses: hot-reload, plugin isolation, loading from non-file sources (network, encrypted jars), and per-tenant isolation. Each classloader defines its own namespace, so the same class loaded by two loaders are distinct types.

#### Code Example / Key Takeaways
```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class CustomLoader extends ClassLoader {
    private final Path dir;
    CustomLoader(ClassLoader parent, Path dir) { super(parent); this.dir = dir; }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        try {
            byte[] bytes = Files.readAllBytes(dir.resolve(name.replace('.', '/') + ".class"));
            return defineClass(name, bytes, 0, bytes.length); // links + prepares
        } catch (IOException e) { throw new ClassNotFoundException(name, e); }
    }
}
// Usage: new CustomLoader(getClass().getClassLoader(), Path.of("/plugins")).loadClass("com.x.Plugin");
```

---

### Q343. What is a ClassNotFoundException vs NoClassDefFoundError?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
- **ClassNotFoundException** is a **checked exception** thrown when an *explicit* load is attempted at runtime (e.g., `Class.forName`, `loadClass`, reflection, deserialization) and the class is not found.
- **NoClassDefFoundError** is an **Error** (unchecked) thrown when the JVM *expected* a class to already be linked/initialized (e.g., it was present at compile time) but cannot find its definition at runtime — often because a static initializer threw, or the class vanished from the classpath after compile.
Roughly: explicit dynamic load fails → exception; implicit runtime reference fails → error.

#### Code Example / Key Takeaways
```java
public class CNFvsNCD {
    public static void main(String[] args) throws Exception {
        try {
            Class.forName("DoesNotExist"); // explicit -> ClassNotFoundException
        } catch (ClassNotFoundException e) { System.out.println("checked: " + e); }

        Missing m = new Missing(); // if Missing failed to link/init -> NoClassDefFoundError
    }
}
// NoClassDefFoundError commonly caused by: missing JAR at runtime,
// a thrown exception in a static initializer of the class.
```

---

### Q344. What is the danger of classloader leaks in long-running apps?
**Difficulty:** `Advanced`
**Category:** JVM Architecture & GC

#### Answer
A **classloader leak** happens when a long-lived object (e.g., a static field in a core classloader, a thread, or a JNDI/registry entry) holds a reference to a class or instance loaded by a child (e.g., webapp) classloader. That keeps the entire child classloader — and all its loaded classes and their static state — reachable, so metaspace never gets collected even after the webapp is "undeployed." Repeated redeploys then exhaust Metaspace (`OutOfMemoryError: Metaspace`). Common culprits: unclosed threads, `ThreadLocal` not removed, JDBC drivers registered in a parent, static caches. Fix: remove refs on shutdown, use `ThreadLocal.remove()`, clean up registries.

#### Code Example / Key Takeaways
```java
public class Leak {
    // Anti-pattern: static ThreadLocal in a shared (parent) classloader
    // holding a value from a child (webapp) classloader -> leak on redeploy.
    private static final ThreadLocal<byte[]> CACHE = ThreadLocal.withInitial(() -> new byte[1024*1024]);

    void use() {
        CACHE.get();
        // MUST: CACHE.remove() when done, or the webapp classloader is pinned.
    }
}
// Detect via: jmap -clstats <pid>  (classes per loader) or Eclipse MAT on a heap dump.
```

---

### Q345. What are the C1 and C2 JIT compilers?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
The HotSpot JVM uses two JIT compilers:
- **C1 (Client)**: fast to compile, performs light optimizations. Used for quick startup and less-hot methods.
- **C2 (Server)**: slower to compile but applies aggressive, heavy optimizations (inlining, loop unrolling, escape analysis, vectorization). Used for hot methods where the compile cost pays off.
The JVM starts in **interpreted** mode and compiles methods to native code once they're "hot" (called enough times, tracked by invocation/branch counters). C2 produces much faster code than C1.

#### Code Example / Key Takeaways
```text
// Force a single compiler if needed:
// java -Xint            MyApp   // interpreter only (slow, for debugging)
// java -Xcomp           MyApp   // compile everything eagerly (slow startup)
// java -client / -server (legacy selects C1/C2 bias;modern JDKs ignore)
//
// Normal: tiered (C1 then C2) is the default and best for most apps.
```

---

### Q346. What is tiered compilation?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
**Tiered compilation** (`-XX:+TieredCompilation`, default on since Java 8) combines C1 and C2: a method is first compiled quickly by **C1** at low optimization levels (so it runs fast without long warmup), then, if it stays hot, recompiled by **C2** at high optimization. This gives fast startup (C1) plus peak performance (C2) without waiting for full C2 compilation. Levels: 0 = interpreter, 1-3 = C1 (increasing opts), 4 = C2. Watch with `-XX:+PrintCompilation`.

#### Code Example / Key Takeaways
```java
public class Tiered {
    public static void main(String[] args) {
        long sum = 0;
        for (int i = 0; i < 1_000_000; i++) {       // loop gets C1 then C2
            sum += compute(i);
        }
        System.out.println(sum);
    }
    static long compute(long x) { return x * x + 1; } // inlined by C2 when hot
}
// java -XX:+TieredCompilation -XX:+PrintCompilation Tiered
```

---

### Q347. How does the JVM decide what to compile (hot methods, counters)?
**Difficulty:** `Advanced`
**Category:** JVM Architecture & GC

#### Answer
Each method/branch has **invocation counters** and **back-edge (loop) counters**. When a counter crosses a threshold (`-XX:CompileThreshold`, default 10,000 for C2 under non-tiered; tiered uses different level-trigger points), the method is queued for JIT compilation. Because counters are **decayed** (halved periodically), bursty methods don't stay permanently "hot." Once compiled, future calls use the native code; the interpreter still runs until the on-stack replacement (OSR) or next invocation. This is why there's a **warmup period** before peak performance in benchmarks.

#### Code Example / Key Takeaways
```text
// Tune how "hot" a method must be (non-tiered baseline):
// java -XX:CompileThreshold=5000 MyApp   // compile sooner
//
// Watch compilation decisions:
// java -XX:+PrintCompilation -XX:+UnlockDiagnosticVMOptions -XX:+PrintInlining MyApp
//   Output: "123  3  %      Tiered.run @ 2 (MyApp)"  (level 3 C1, OSR %)
//
// Key lesson: measure AFTER warmup, or you benchmark the interpreter.
```

---

### Q348. What is On-Stack Replacement (OSR)?
**Difficulty:** `Advanced`
**Category:** JVM Architecture & GC

#### Answer
**On-Stack Replacement** lets the JVM switch a *long-running method already on the stack* from interpreted to compiled code **in the middle of its execution** — most importantly for hot loops. Without OSR, a method already running a tight loop would keep interpreting until it returned and was called again. OSR compiles the loop body (with a special entry point) and transfers control mid-execution. This is why a single long-running loop still gets optimized without needing to restart.

#### Code Example / Key Takeaways
```java
public class OSR {
    public static void main(String[] args) {
        long sum = 0;
        // This loop may be interpreted first, then OSR-swapped to compiled
        // mid-loop once the back-edge counter trips:
        for (long i = 0; i < 2_000_000_000L; i++) {
            sum += i;
        }
        System.out.println(sum);
    }
}
// java -XX:+PrintCompilation OSR   -> look for '%' (OSR) compile entries.
```

---

### Q349. What are the common types of OutOfMemoryError and their causes?
**Difficulty:** `Intermediate`
**Category:** JVM Architecture & GC

#### Answer
- `java.lang.OutOfMemoryError: Java heap space` — live objects exceed `-Xmx`; true leak or heap too small.
- `: GC overhead limit exceeded` — >98% of time in GC but <2% heap reclaimed; thrashing.
- `: Metaspace` — too many classes / classloader leak; raise `-XX:MaxMetaspaceSize`.
- `: Unable to create new native thread` — too many threads or `-Xss` too big vs OS limits.
- `: Direct buffer memory` — off-heap `ByteBuffer.allocateDirect` exceeds `-XX:MaxDirectMemorySize`.
- `: Requested array size exceeds VM limit` — attempted huge array (`> Integer.MAX_VALUE-headers`).
- `: Out of swap space` / `: heap dump` — native/OS memory exhaustion.

#### Code Example / Key Takeaways
```text
// Reproduce a few:
// java -Xmx32m OOMJavaHeap      -> Java heap space
// java -XX:MaxMetaspaceSize=8m ManyClasses -> Metaspace
// java -XX:MaxDirectMemorySize=10m BigDirect -> Direct buffer memory
//
// Diagnose: capture heap dump on OOM and analyze:
// java -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/dump.hprof MyApp
```

---

### Q350. What profiling and diagnostic tools are available for JVM memory/GC?
**Difficulty:** `Advanced`
**Category:** JVM Architecture & GC

#### Answer
Built-in (JDK/bin):
- **jstat** — GC/heap/compilation stats live (`jstat -gcutil <pid> 1s`).
- **jmap** — heap histogram, `jmap -dump:live,format=b,file=d.hprof <pid>`, `-clstats`.
- **jcmd** — Swiss army knife: `VM.native_memory`, `GC.heap_dump`, `Thread.print`, `VM.flags`.
- **jstack** — thread dumps / deadlock detection.
- **jconsole / jvisualvm / Java Mission Control (JMC)** — GUI monitoring, flight recordings (JFR).
- **jfr** — low-overhead Java Flight Recorder for production profiling.
Third-party: **Eclipse MAT** (heap dump analysis, leak suspects), **async-profiler** (CPU/alloc/lock), **GCViewer/GCEasy** (GC logs), **Prometheus + jmx_exporter** (metrics).

#### Code Example / Key Takeaways
```text
// Live GC view:
// jstat -gcutil <pid> 1000
//   S0  S1  E   O   M    YGC YGCT FGC FGCT GCT
//   0  12  45  60  92    120 3.4  5  2.1 5.5
//
// Heap dump + analyze:
// jmap -dump:live,format=b,file=/tmp/d.hprof <pid>
//   -> open in Eclipse MAT, run "Leak Suspects Report"
//
// Continuous low-overhead profiling:
// java -XX:StartFlightRecording=duration=60s,filename=rec.jfr MyApp
//   -> open in JMC
//
// Allocation profiling (no GC needed):
// asprof -e alloc -d 30 -f alloc.html <pid>
```
