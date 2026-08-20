# Java Collections Framework & Generics Interview Questions (Q76-Q150)

### Q76. What is the Java Collections Framework?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
The Java Collections Framework is the standard set of interfaces, implementations, and algorithms for storing and processing groups of objects. Core interfaces include Collection, List, Set, Queue, Deque, and Map. Implementations such as ArrayList, HashSet, HashMap, PriorityQueue, and TreeMap choose different trade-offs for ordering, uniqueness, lookup speed, memory use, and concurrency. Prefer coding to interfaces so the implementation can change without rewriting callers.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { List<String> names = new ArrayList<>(); names.add("Ava"); names.add("Ben"); System.out.println(names); } }
```

---

### Q77. How does ArrayList work internally?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
ArrayList is a resizable array. It stores elements in a contiguous Object[] and grows when capacity is exceeded, usually by allocating a larger array and copying existing elements. Random access by index is O(1), appending is amortized O(1), and insertion or removal in the middle is O(n) because elements must shift. It allows duplicates and null values.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { List<Integer> list = new ArrayList<>(); list.add(10); list.add(20); list.add(1, 15); System.out.println(list.get(1)); } }
```

---

### Q78. When should you use LinkedList instead of ArrayList?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
LinkedList is a doubly linked list implementing List and Deque. It can add or remove at the ends in O(1), but finding an index is O(n). In practice, ArrayList is usually faster for most list workloads due to cache locality and lower memory overhead. Use LinkedList mainly when you specifically need Deque operations and do frequent additions/removals at both ends, though ArrayDeque is often better for that.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Deque<String> deque = new LinkedList<>(); deque.addFirst("front"); deque.addLast("back"); System.out.println(deque.removeFirst()); } }
```

---

### Q79. Compare ArrayList and LinkedList.
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
ArrayList is backed by an array; LinkedList is backed by nodes. ArrayList gives O(1) random reads and compact memory usage, but middle inserts/removes shift elements. LinkedList gives O(1) insert/remove only when you already have a node position or operate at ends, but random access is O(n) and each element costs extra node references. For interview answers, default to ArrayList unless queue/deque behavior is required.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { List<String> fastReads = new ArrayList<>(); Deque<String> ends = new LinkedList<>(); fastReads.add("x"); ends.addFirst("y"); System.out.println(fastReads.get(0) + ends.peekFirst()); } }
```

---

### Q80. What is Vector and why is it legacy?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
Vector is a synchronized, resizable array from early Java. Its methods are synchronized, which makes individual operations thread-safe but often slower and not enough for compound actions such as check-then-act. Modern code usually uses ArrayList for non-concurrent lists, Collections.synchronizedList for a synchronized wrapper, or CopyOnWriteArrayList/concurrent queues for specific concurrent patterns.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Vector<String> v = new Vector<>(); v.add("legacy"); System.out.println(v.firstElement()); } }
```

---

### Q81. What is CopyOnWriteArrayList?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
CopyOnWriteArrayList is a thread-safe List optimized for many reads and few writes. Every mutating operation copies the underlying array, so iterators see a stable snapshot and never throw ConcurrentModificationException. Reads are fast and lock-free, but writes are expensive and memory-heavy. It is useful for listener lists, routing tables, and configuration snapshots.

#### Code Example / Key Takeaways
```java
import java.util.concurrent.*;
class Demo { public static void main(String[] args) { CopyOnWriteArrayList<String> listeners = new CopyOnWriteArrayList<>(); listeners.add("A"); for (String s : listeners) { listeners.add("B"); System.out.println(s); } System.out.println(listeners); } }
```

---

### Q82. Why should ArrayList initial capacity matter?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
ArrayList grows automatically, but each growth allocates a new array and copies elements. If you know the approximate size, passing an initial capacity reduces reallocations and copies. Capacity is not the same as size: capacity is internal storage; size is the number of elements actually present.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { List<Integer> ids = new ArrayList<>(1000); for (int i = 0; i < 3; i++) ids.add(i); System.out.println(ids.size()); } }
```

---

### Q83. What is fail-fast iteration in lists?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
Most non-concurrent collection iterators are fail-fast. If the collection is structurally modified outside the iterator after iterator creation, the iterator may throw ConcurrentModificationException. This is a bug detector, not a concurrency guarantee. Use Iterator.remove, collect changes separately, or use concurrent/snapshot collections when mutation during iteration is required.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { List<String> xs = new ArrayList<>(List.of("a", "b")); Iterator<String> it = xs.iterator(); while (it.hasNext()) if (it.next().equals("a")) it.remove(); System.out.println(xs); } }
```

---

### Q84. How do you create unmodifiable and immutable lists?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
Collections.unmodifiableList returns a read-only view of an existing list; changes to the backing list are still visible. List.of and List.copyOf create unmodifiable lists that reject nulls and are not backed by the original mutable list. For defensive APIs, prefer List.copyOf so callers cannot mutate state through an alias.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { List<String> mutable = new ArrayList<>(List.of("a")); List<String> copy = List.copyOf(mutable); mutable.add("b"); System.out.println(copy); } }
```

---

### Q85. How do you safely sort a List?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
Use List.sort or Collections.sort with a Comparator. Sorting mutates the list, so copy first if callers expect the original order to remain unchanged. Comparators should be consistent, handle nulls if nulls are possible, and avoid subtraction for numeric comparison because it can overflow.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { List<String> names = new ArrayList<>(List.of("Bo", "Alice")); names.sort(Comparator.comparingInt(String::length)); System.out.println(names); } }
```

---

### Q86. What makes a Set different from a List?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
A Set stores unique elements and does not expose positional access. Uniqueness is determined either by equals/hashCode for hash-based sets or by comparison for sorted sets. Choose a Set when membership and duplicate prevention matter more than index order.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Set<String> s = new HashSet<>(); s.add("a"); s.add("a"); System.out.println(s.size()); } }
```

---

### Q87. How does HashSet work internally?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
HashSet is backed by a HashMap where each set element is stored as a map key. add, contains, and remove are O(1) on average when hashCode distributes values well. It does not preserve insertion order and allows one null element.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Set<Integer> ids = new HashSet<>(); ids.add(3); ids.add(1); System.out.println(ids.contains(1)); } }
```

---

### Q88. Why must equals and hashCode agree for HashSet?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
HashSet first uses hashCode to find a bucket, then equals to check logical equality inside that bucket. If equal objects have different hash codes, duplicates can appear and lookups can fail. The contract is: if a.equals(b) is true, a.hashCode() must equal b.hashCode().

#### Code Example / Key Takeaways
```java
import java.util.*;
record User(int id, String name) {}
class Demo { public static void main(String[] args) { Set<User> users = new HashSet<>(); users.add(new User(1,"A")); users.add(new User(1,"A")); System.out.println(users.size()); } }
```

---

### Q89. What is LinkedHashSet used for?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
LinkedHashSet combines HashSet uniqueness with predictable iteration order. It keeps a linked list across entries, normally in insertion order. It costs slightly more memory than HashSet but is useful when stable output or predictable tests matter.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Set<String> s = new LinkedHashSet<>(); s.add("b"); s.add("a"); System.out.println(s); } }
```

---

### Q90. How does TreeSet order elements?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
TreeSet is a NavigableSet backed by a balanced tree. It keeps elements sorted by natural ordering or a Comparator. add, contains, and remove are O(log n). Its equality for uniqueness follows comparison: if compare returns 0, the elements are considered duplicates.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Set<String> s = new TreeSet<>(String.CASE_INSENSITIVE_ORDER); s.add("java"); s.add("JAVA"); System.out.println(s); } }
```

---

### Q91. What is EnumSet?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
EnumSet is a high-performance Set specialized for enum values. Internally it uses bit vectors, making it compact and fast. It rejects nulls and can only contain values from a single enum type. Use it instead of HashSet for enum flags.

#### Code Example / Key Takeaways
```java
import java.util.*;
enum Role { USER, ADMIN }
class Demo { public static void main(String[] args) { EnumSet<Role> roles = EnumSet.of(Role.USER, Role.ADMIN); System.out.println(roles.contains(Role.ADMIN)); } }
```

---

### Q92. How do HashSet, LinkedHashSet, and TreeSet compare?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
HashSet is fastest on average but unordered. LinkedHashSet preserves insertion order with a little extra memory. TreeSet keeps elements sorted and supports range queries, but operations are O(log n). Pick by ordering requirement first, then performance.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { System.out.println(new HashSet<>(List.of(3,1,2))); System.out.println(new LinkedHashSet<>(List.of(3,1,2))); System.out.println(new TreeSet<>(List.of(3,1,2))); } }
```

---

### Q93. What are NavigableSet operations?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
NavigableSet adds search methods such as lower, floor, ceiling, higher, pollFirst, pollLast, descendingSet, and range views. TreeSet implements it. These operations are ideal for ordered lookups like nearest value, leaderboard ranges, or time windows.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { NavigableSet<Integer> s = new TreeSet<>(List.of(10,20,30)); System.out.println(s.floor(25)); System.out.println(s.higher(20)); } }
```

---

### Q94. Can Sets contain mutable objects?
**Difficulty:** `Advanced`
**Category:** Collections & Generics

#### Answer
They can, but mutating fields used by equals, hashCode, or compareTo while the object is inside a Set breaks lookup and uniqueness. The object may become stored in the wrong hash bucket or tree position. Prefer immutable keys/elements or remove, mutate, and re-add.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { static class Box { int id; Box(int id){this.id=id;} public boolean equals(Object o){return o instanceof Box b && b.id==id;} public int hashCode(){return id;} } public static void main(String[] args) { Box b=new Box(1); Set<Box> s=new HashSet<>(); s.add(b); b.id=2; System.out.println(s.contains(b)); } }
```

---

### Q95. How do you remove duplicates while preserving order?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
Use LinkedHashSet when you need uniqueness and original encounter order. Construct it from the list, then optionally create a new ArrayList. This avoids manual contains checks and is usually clearer and faster.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { List<String> xs = List.of("a","b","a"); List<String> unique = new ArrayList<>(new LinkedHashSet<>(xs)); System.out.println(unique); } }
```

---

### Q96. What is a Map?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
A Map stores key-value pairs and is not a subtype of Collection. Keys are unique; values may be duplicated. Common implementations include HashMap for general lookup, LinkedHashMap for predictable order, TreeMap for sorted keys, ConcurrentHashMap for concurrency, and EnumMap for enum keys.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Map<String,Integer> ages = new HashMap<>(); ages.put("Ana", 30); System.out.println(ages.get("Ana")); } }
```

---

### Q97. How does HashMap work internally?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
HashMap stores entries in an array of buckets. It hashes the key, maps the hash to a bucket, and resolves collisions within that bucket. Since Java 8, heavily-collided buckets can become balanced trees when thresholds are met, improving worst-case lookup from O(n) to O(log n). Average get and put are O(1).

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Map<String,Integer> m = new HashMap<>(); m.put("one", 1); m.put("two", 2); System.out.println(m.get("two")); } }
```

---

### Q98. What are HashMap capacity and load factor?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
Capacity is the number of buckets; load factor controls when resizing happens. The default load factor is 0.75, balancing memory and collisions. When size exceeds capacity times load factor, HashMap resizes and rehashes entries. If expected size is known, initialize capacity to reduce resizing.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Map<Integer,String> m = new HashMap<>(128, 0.75f); m.put(1, "a"); System.out.println(m); } }
```

---

### Q99. Can HashMap use null keys and values?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
HashMap permits one null key and multiple null values. This differs from Hashtable and ConcurrentHashMap, which reject null. Null can make missing-value logic ambiguous because get returns null both for absent keys and keys mapped to null; use containsKey when needed.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Map<String,String> m = new HashMap<>(); m.put(null, "root"); m.put("x", null); System.out.println(m.containsKey("x")); } }
```

---

### Q100. Why are mutable keys dangerous in HashMap?
**Difficulty:** `Advanced`
**Category:** Collections & Generics

#### Answer
HashMap lookup depends on the key hash and equality at insertion time. If fields used by hashCode or equals change while the key is in the map, the entry may become unreachable even though it still exists. Use immutable key classes such as records, String, Integer, UUID, or remove and reinsert after mutation.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { record Key(int id) {} public static void main(String[] args) { Map<Key,String> m = new HashMap<>(); m.put(new Key(1), "ok"); System.out.println(m.get(new Key(1))); } }
```

---

### Q101. What is LinkedHashMap?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
LinkedHashMap extends hash-table lookup with a doubly linked list over entries. It preserves insertion order by default and can also maintain access order. Access-order LinkedHashMap is commonly used for simple LRU caches by overriding removeEldestEntry.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Map<String,Integer> m = new LinkedHashMap<>(); m.put("b",2); m.put("a",1); System.out.println(m.keySet()); } }
```

---

### Q102. How do you build a simple LRU cache with LinkedHashMap?
**Difficulty:** `Advanced`
**Category:** Collections & Generics

#### Answer
Create a LinkedHashMap with accessOrder=true and override removeEldestEntry to evict when size exceeds the limit. This is simple and works for single-threaded or externally synchronized use. For high-concurrency or production caching features, use a real cache library.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Map<Integer,String> cache = new LinkedHashMap<>(16, .75f, true) { protected boolean removeEldestEntry(Map.Entry<Integer,String> e) { return size() > 2; } }; cache.put(1,"a"); cache.put(2,"b"); cache.get(1); cache.put(3,"c"); System.out.println(cache.keySet()); } }
```

---

### Q103. What is TreeMap?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
TreeMap is a NavigableMap backed by a red-black tree. It stores keys sorted by natural order or a Comparator. get, put, and remove are O(log n). It is useful for sorted iteration and range queries such as subMap, headMap, and tailMap.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { NavigableMap<Integer,String> m = new TreeMap<>(); m.put(20,"b"); m.put(10,"a"); System.out.println(m.firstEntry()); } }
```

---

### Q104. How does ConcurrentHashMap differ from HashMap?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
ConcurrentHashMap supports safe concurrent access without synchronizing the whole map for every operation. It rejects null keys and values to avoid ambiguity in concurrent reads. Retrievals are highly concurrent, and updates lock only affected internal regions/nodes. Iterators are weakly consistent, not fail-fast.

#### Code Example / Key Takeaways
```java
import java.util.concurrent.*;
class Demo { public static void main(String[] args) { ConcurrentHashMap<String,Integer> m = new ConcurrentHashMap<>(); m.put("a", 1); m.compute("a", (k,v) -> v + 1); System.out.println(m); } }
```

---

### Q105. What is EnumMap?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
EnumMap is a Map optimized for enum keys. It stores values in an array indexed by enum ordinal, so it is fast, compact, and preserves enum declaration order. It rejects null keys but allows null values. Use it instead of HashMap whenever all keys are from one enum type.

#### Code Example / Key Takeaways
```java
import java.util.*;
enum Day { MON, TUE }
class Demo { public static void main(String[] args) { EnumMap<Day,String> m = new EnumMap<>(Day.class); m.put(Day.MON, "work"); System.out.println(m); } }
```

---

### Q106. How do getOrDefault, putIfAbsent, and computeIfAbsent differ?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
getOrDefault reads a value or returns a fallback without mutating. putIfAbsent writes a value only when no mapping exists or the current value is null for maps that allow null. computeIfAbsent lazily computes and stores a value only when absent, which is ideal for grouping or memoizing.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Map<String,List<Integer>> m = new HashMap<>(); m.computeIfAbsent("x", k -> new ArrayList<>()).add(1); System.out.println(m.getOrDefault("y", List.of())); } }
```

---

### Q107. How do you iterate over a Map efficiently?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
Use entrySet when both key and value are needed; it avoids a second lookup for each key. Use keySet when only keys are needed and values when only values are needed. Do not assume HashMap iteration order.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Map<String,Integer> m = Map.of("a",1,"b",2); for (Map.Entry<String,Integer> e : m.entrySet()) System.out.println(e.getKey()+"="+e.getValue()); } }
```

---

### Q108. What are Map views?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
keySet, values, and entrySet are backed views of the map, not independent copies. Removing from a mutable view removes from the map. Adding is generally unsupported through views except by putting into the map itself. Copy the view if you need a snapshot.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Map<String,Integer> m = new HashMap<>(Map.of("a",1,"b",2)); m.keySet().remove("a"); System.out.println(m); } }
```

---

### Q109. What is hash collision handling in HashMap?
**Difficulty:** `Advanced`
**Category:** Collections & Generics

#### Answer
A collision occurs when different keys map to the same bucket. HashMap stores colliding entries in that bucket and checks equality to find the correct key. With enough collisions and sufficient table size, Java can treeify the bucket to reduce lookup cost. Good hashCode implementations keep collisions rare.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { static class K { int id; K(int id){this.id=id;} public int hashCode(){return 1;} public boolean equals(Object o){return o instanceof K k && k.id==id;} } public static void main(String[] args) { Map<K,String> m=new HashMap<>(); m.put(new K(1),"a"); System.out.println(m.get(new K(1))); } }
```

---

### Q110. What is IdentityHashMap?
**Difficulty:** `Advanced`
**Category:** Collections & Generics

#### Answer
IdentityHashMap compares keys with == instead of equals and uses identity-based hashing. It is not a general-purpose Map. It is useful for object graph traversal, serialization bookkeeping, or cycle detection where distinct object instances must remain distinct even if equals says they are equal.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Map<String,Integer> m = new IdentityHashMap<>(); m.put(new String("x"), 1); m.put(new String("x"), 2); System.out.println(m.size()); } }
```

---

### Q111. What is WeakHashMap?
**Difficulty:** `Advanced`
**Category:** Collections & Generics

#### Answer
WeakHashMap stores keys as weak references. If a key is no longer strongly reachable elsewhere, the garbage collector may remove its entry. It is useful for metadata associated with objects without preventing their collection. It should not be used when entries must remain reliably present.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Map<Object,String> m = new WeakHashMap<>(); Object key = new Object(); m.put(key, "metadata"); System.out.println(m.containsKey(key)); } }
```

---

### Q112. How do equals and compareTo affect TreeMap keys?
**Difficulty:** `Advanced`
**Category:** Collections & Generics

#### Answer
TreeMap uses compareTo or Comparator to decide both order and key uniqueness. If compare returns 0, TreeMap treats keys as the same even if equals would return false. A comparator inconsistent with equals can be valid but surprising, so document it and use it deliberately.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Map<String,Integer> m = new TreeMap<>(String.CASE_INSENSITIVE_ORDER); m.put("java",1); m.put("JAVA",2); System.out.println(m); } }
```

---

### Q113. How do you merge counts in a Map?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
Use merge for frequency maps and accumulation. It inserts the initial value when absent and combines old and new values when present. This avoids verbose containsKey checks and is safe for concise counting logic.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Map<String,Integer> counts = new HashMap<>(); for (String w : List.of("a","b","a")) counts.merge(w, 1, Integer::sum); System.out.println(counts); } }
```

---

### Q114. What makes Hashtable legacy?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
Hashtable is synchronized and does not allow null keys or values. Like Vector, it is a legacy class whose synchronized methods rarely provide the right concurrency model for compound operations. Prefer HashMap, ConcurrentHashMap, or explicit synchronization depending on the requirement.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Hashtable<String,Integer> h = new Hashtable<>(); h.put("a",1); System.out.println(h.get("a")); } }
```

---

### Q115. How do immutable Map factories work?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
Map.of and Map.ofEntries create unmodifiable maps that reject null keys and values and duplicate keys. They are compact and clear for constants and small maps. Iteration order is unspecified unless documented by a specific implementation, so do not rely on it.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Map<String,Integer> m = Map.of("a",1,"b",2); System.out.println(m.get("a")); } }
```

---

### Q116. What is the Queue interface?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
Queue represents elements waiting to be processed, usually FIFO. offer/poll/peek are preferred because they return special values instead of throwing when an operation cannot be completed. add/remove/element throw exceptions on failure.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Queue<String> q = new ArrayDeque<>(); q.offer("job"); System.out.println(q.poll()); } }
```

---

### Q117. How does PriorityQueue work?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
PriorityQueue orders elements by natural order or Comparator, not insertion order. The head is the least element according to that ordering by default. It is backed by a binary heap, so offer and poll are O(log n), peek is O(1), and iteration is not sorted.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Queue<Integer> pq = new PriorityQueue<>(); pq.addAll(List.of(5,1,3)); System.out.println(pq.poll()); } }
```

---

### Q118. How do you create a max-heap PriorityQueue?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
PriorityQueue is a min-heap by default. Provide Comparator.reverseOrder for a max-heap. Avoid subtraction comparators like (a,b)->b-a because integer overflow can break ordering.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Queue<Integer> pq = new PriorityQueue<>(Comparator.reverseOrder()); pq.addAll(List.of(5,1,3)); System.out.println(pq.poll()); } }
```

---

### Q119. What is ArrayDeque?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
ArrayDeque is a resizable-array implementation of Deque. It is usually faster than Stack and LinkedList for stack or queue behavior. It does not allow null elements because null is used by methods such as poll to mean no element.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Deque<String> stack = new ArrayDeque<>(); stack.push("a"); stack.push("b"); System.out.println(stack.pop()); } }
```

---

### Q120. Why prefer ArrayDeque over Stack?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
Stack is a legacy synchronized Vector subclass. ArrayDeque provides cleaner Deque methods and better performance for single-threaded stack usage. Use push, pop, and peek for stack behavior or offer/poll for queue behavior.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { Deque<Integer> stack = new ArrayDeque<>(); stack.push(1); stack.push(2); System.out.println(stack.pop()); } }
```

---

### Q121. What is BlockingQueue?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
BlockingQueue is a concurrent queue whose operations can wait for space or elements. put blocks until space is available; take blocks until an element is available. It is commonly used for producer-consumer designs and avoids manual wait/notify code.

#### Code Example / Key Takeaways
```java
import java.util.concurrent.*;
class Demo { public static void main(String[] args) throws Exception { BlockingQueue<String> q = new ArrayBlockingQueue<>(1); q.put("job"); System.out.println(q.take()); } }
```

---

### Q122. Compare ArrayBlockingQueue and LinkedBlockingQueue.
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
ArrayBlockingQueue is bounded and backed by an array; its capacity is fixed. LinkedBlockingQueue is node-based and optionally bounded, but the no-arg constructor creates a very large capacity that can hide backpressure. Prefer explicit bounds in server code to avoid memory growth.

#### Code Example / Key Takeaways
```java
import java.util.concurrent.*;
class Demo { public static void main(String[] args) { BlockingQueue<Integer> q = new ArrayBlockingQueue<>(2); q.offer(1); q.offer(2); System.out.println(q.offer(3)); } }
```

---

### Q123. What is PriorityBlockingQueue?
**Difficulty:** `Advanced`
**Category:** Collections & Generics

#### Answer
PriorityBlockingQueue is an unbounded blocking queue that orders elements by priority. take blocks when empty, but put does not block for capacity because it is unbounded. Since equal-priority ordering is not guaranteed, include a sequence number if stable ordering matters.

#### Code Example / Key Takeaways
```java
import java.util.concurrent.*;
class Demo { public static void main(String[] args) throws Exception { PriorityBlockingQueue<Integer> q = new PriorityBlockingQueue<>(); q.put(3); q.put(1); System.out.println(q.take()); } }
```

---

### Q124. What is SynchronousQueue?
**Difficulty:** `Advanced`
**Category:** Collections & Generics

#### Answer
SynchronousQueue has no internal capacity. Each put must rendezvous with a take, so it directly hands off work between threads. It is useful in executor designs where tasks should not queue internally and producers should block until a consumer is ready.

#### Code Example / Key Takeaways
```java
import java.util.concurrent.*;
class Demo { public static void main(String[] args) throws Exception { SynchronousQueue<String> q = new SynchronousQueue<>(); new Thread(() -> { try { q.put("handoff"); } catch (InterruptedException ignored) {} }).start(); System.out.println(q.take()); } }
```

---

### Q125. What is DelayQueue?
**Difficulty:** `Advanced`
**Category:** Collections & Generics

#### Answer
DelayQueue stores Delayed elements and only releases each element after its delay expires. It is unbounded and useful for scheduled retries, timeout handling, and expiring items. Elements must implement getDelay and compareTo consistently.

#### Code Example / Key Takeaways
```java
import java.util.concurrent.*;
class Demo { static class Task implements Delayed { public long getDelay(TimeUnit u){ return 0; } public int compareTo(Delayed d){ return 0; } } public static void main(String[] args) throws Exception { DelayQueue<Task> q = new DelayQueue<>(); q.put(new Task()); System.out.println(q.take().getClass().getSimpleName()); } }
```

---

### Q126. Why use generics?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
Generics provide compile-time type safety and remove most casts. A List<String> can only accept strings, so mistakes are caught before runtime. Generics also make APIs self-documenting because type relationships are visible in method signatures.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { List<String> names = new ArrayList<>(); names.add("Ada"); String first = names.get(0); System.out.println(first.toUpperCase()); } }
```

---

### Q127. What is a bounded type parameter?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
A bounded type parameter restricts acceptable types. <T extends Number> means T must be Number or a subclass. Bounds let generic code call methods from the bound while preserving specific type information.

#### Code Example / Key Takeaways
```java
class Demo { static <T extends Number> double twice(T n) { return n.doubleValue() * 2; } public static void main(String[] args) { System.out.println(twice(21)); } }
```

---

### Q128. What are multiple bounds in generics?
**Difficulty:** `Advanced`
**Category:** Collections & Generics

#### Answer
A type parameter can have multiple bounds, with at most one class bound first and then interfaces. For example, <T extends Number & Comparable<T>> requires both numeric behavior and comparability. This lets methods rely on several capabilities without accepting unrelated types.

#### Code Example / Key Takeaways
```java
class Demo { static <T extends Number & Comparable<T>> T max(T a, T b) { return a.compareTo(b) >= 0 ? a : b; } public static void main(String[] args) { System.out.println(max(3, 7)); } }
```

---

### Q129. What is an unbounded wildcard?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
The wildcard ? means an unknown type. List<?> is useful when code only needs to read objects or use size/iteration without adding typed values. You cannot add arbitrary elements except null because the compiler does not know the actual element type.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { static void printSize(List<?> xs) { System.out.println(xs.size()); } public static void main(String[] args) { printSize(List.of(1,2,3)); } }
```

---

### Q130. What is an upper-bounded wildcard?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
? extends T accepts T or any subtype of T. It is best for producers: you can read values as T, but cannot safely add T values because the actual list might be a more specific subtype. This is the extends part of PECS.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { static double sum(List<? extends Number> nums) { double s=0; for (Number n: nums) s+=n.doubleValue(); return s; } public static void main(String[] args) { System.out.println(sum(List.of(1,2,3))); } }
```

---

### Q131. What is a lower-bounded wildcard?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
? super T accepts T or any supertype of T. It is best for consumers: you can add T values safely, but reads come back only as Object. This is the super part of PECS.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { static void addInts(List<? super Integer> out) { out.add(1); out.add(2); } public static void main(String[] args) { List<Number> nums = new ArrayList<>(); addInts(nums); System.out.println(nums); } }
```

---

### Q132. What does PECS mean?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
PECS means Producer Extends, Consumer Super. If a parameter produces values for your method to read, use ? extends T. If it consumes values your method writes, use ? super T. If both reading and writing exact type values are needed, use a concrete generic type such as List<T>.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { static <T> void copy(List<? extends T> src, List<? super T> dst) { for (T x : src) dst.add(x); } public static void main(String[] args) { List<Number> out = new ArrayList<>(); copy(List.of(1,2), out); System.out.println(out); } }
```

---

### Q133. What is type erasure?
**Difficulty:** `Advanced`
**Category:** Collections & Generics

#### Answer
Java implements generics mostly by type erasure. Generic type information is checked at compile time and erased to raw types or bounds in bytecode. This preserves backward compatibility but means you cannot directly create new T(), use primitive type arguments, or check instanceof List<String>.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { List<String> a = new ArrayList<>(); List<Integer> b = new ArrayList<>(); System.out.println(a.getClass() == b.getClass()); } }
```

---

### Q134. What are raw types and why avoid them?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
A raw type is a generic type used without type arguments, such as List instead of List<String>. Raw types disable generic type checking and can cause ClassCastException later. They exist for backward compatibility with pre-generics code; modern code should avoid them except at legacy boundaries.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { List<String> safe = new ArrayList<>(); safe.add("x"); System.out.println(safe.get(0)); } }
```

---

### Q135. What is a generic method?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
A generic method declares its own type parameter before the return type. It can infer types from arguments and is useful when the type relationship belongs to one method rather than the whole class.

#### Code Example / Key Takeaways
```java
class Demo { static <T> T first(T a, T b) { return a; } public static void main(String[] args) { String s = first("a", "b"); System.out.println(s); } }
```

---

### Q136. How are ConcurrentHashMap iterators different?
**Difficulty:** `Advanced`
**Category:** Collections & Generics

#### Answer
ConcurrentHashMap iterators are weakly consistent. They do not throw ConcurrentModificationException and may reflect some, all, or none of the updates made after iterator creation. This is useful for concurrent monitoring and traversal, but not for exact snapshots.

#### Code Example / Key Takeaways
```java
import java.util.concurrent.*;
class Demo { public static void main(String[] args) { ConcurrentHashMap<String,Integer> m = new ConcurrentHashMap<>(); m.put("a",1); for (String k : m.keySet()) { m.put("b",2); System.out.println(k); } } }
```

---

### Q137. How do atomic updates work in ConcurrentHashMap?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
Use compute, computeIfAbsent, merge, or replace to perform per-key atomic updates. Avoid get-then-put because another thread can modify the value between calls. The mapping function should be short and should not depend on external locks.

#### Code Example / Key Takeaways
```java
import java.util.concurrent.*;
class Demo { public static void main(String[] args) { ConcurrentHashMap<String,Integer> counts = new ConcurrentHashMap<>(); counts.merge("x", 1, Integer::sum); counts.merge("x", 1, Integer::sum); System.out.println(counts); } }
```

---

### Q138. When is CopyOnWriteArrayList a good concurrent choice?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
It is good when reads and iteration dominate and writes are rare. Iterators are snapshot-based, so readers avoid locking and are insulated from concurrent modifications. It is bad for high write volume because every mutation copies the array.

#### Code Example / Key Takeaways
```java
import java.util.concurrent.*;
class Demo { public static void main(String[] args) { CopyOnWriteArrayList<String> xs = new CopyOnWriteArrayList<>(); xs.add("v1"); for (String x : xs) xs.add("v2"); System.out.println(xs); } }
```

---

### Q139. What is ConcurrentLinkedQueue?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
ConcurrentLinkedQueue is an unbounded, non-blocking FIFO queue based on linked nodes. It is safe for multiple producers and consumers and uses lock-free algorithms. poll returns null when empty; use BlockingQueue if consumers should wait.

#### Code Example / Key Takeaways
```java
import java.util.concurrent.*;
class Demo { public static void main(String[] args) { ConcurrentLinkedQueue<String> q = new ConcurrentLinkedQueue<>(); q.offer("a"); System.out.println(q.poll()); } }
```

---

### Q140. What is ConcurrentSkipListMap?
**Difficulty:** `Advanced`
**Category:** Collections & Generics

#### Answer
ConcurrentSkipListMap is a concurrent, sorted NavigableMap implemented with a skip-list. It gives expected O(log n) operations and supports range queries under concurrent access. Use it when you need both ordering and concurrency; otherwise ConcurrentHashMap is usually faster.

#### Code Example / Key Takeaways
```java
import java.util.concurrent.*;
class Demo { public static void main(String[] args) { ConcurrentSkipListMap<Integer,String> m = new ConcurrentSkipListMap<>(); m.put(2,"b"); m.put(1,"a"); System.out.println(m.firstKey()); } }
```

---

### Q141. What is ConcurrentSkipListSet?
**Difficulty:** `Advanced`
**Category:** Collections & Generics

#### Answer
ConcurrentSkipListSet is a concurrent sorted set backed by ConcurrentSkipListMap. It supports NavigableSet operations such as ceiling and subSet while allowing concurrent access. It is useful for sorted registries, time windows, and leaderboards with concurrent updates.

#### Code Example / Key Takeaways
```java
import java.util.concurrent.*;
class Demo { public static void main(String[] args) { ConcurrentSkipListSet<Integer> s = new ConcurrentSkipListSet<>(); s.add(10); s.add(5); System.out.println(s.ceiling(6)); } }
```

---

### Q142. When should you choose blocking vs non-blocking concurrent collections?
**Difficulty:** `Advanced`
**Category:** Collections & Generics

#### Answer
Choose BlockingQueue when threads should wait for work or backpressure. Choose non-blocking collections such as ConcurrentLinkedQueue when threads should keep running and handle empty results themselves. Blocking designs are simpler for producer-consumer pipelines; non-blocking designs can fit event loops and low-latency systems.

#### Code Example / Key Takeaways
```java
import java.util.concurrent.*;
class Demo { public static void main(String[] args) { BlockingQueue<String> blocking = new LinkedBlockingQueue<>(10); ConcurrentLinkedQueue<String> nonBlocking = new ConcurrentLinkedQueue<>(); System.out.println(blocking.offer("a") && nonBlocking.offer("b")); } }
```

---

### Q143. Vector vs ArrayList: which should modern code use?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
Use ArrayList for normal single-threaded lists. Vector synchronizes individual methods, which adds overhead and does not automatically make compound workflows correct. If sharing across threads, choose a collection designed for the access pattern or synchronize externally around the full operation.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { List<String> list = new ArrayList<>(); list.add("modern"); System.out.println(list); } }
```

---

### Q144. Hashtable vs HashMap vs ConcurrentHashMap?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
Hashtable is legacy, synchronized, and rejects null. HashMap is unsynchronized and permits null. ConcurrentHashMap is designed for concurrent access, rejects null, and scales better than synchronizing an entire map. Pick HashMap by default; pick ConcurrentHashMap for shared mutable maps.

#### Code Example / Key Takeaways
```java
import java.util.*;
import java.util.concurrent.*;
class Demo { public static void main(String[] args) { Map<String,Integer> local = new HashMap<>(); Map<String,Integer> shared = new ConcurrentHashMap<>(); local.put("a",1); shared.put("b",2); System.out.println(local.size()+shared.size()); } }
```

---

### Q145. What do Collections.synchronizedXxx wrappers do?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
Collections.synchronizedList, synchronizedSet, and synchronizedMap return wrappers that synchronize each method on a common lock. Iteration still requires manually synchronizing on the wrapper during the whole traversal. These wrappers are useful for simple compatibility but concurrent collections are often better.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { List<String> list = Collections.synchronizedList(new ArrayList<>()); list.add("x"); synchronized (list) { for (String s : list) System.out.println(s); } } }
```

---

### Q146. What is the difference between fail-fast and fail-safe terminology?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
Java documentation usually says fail-fast for ordinary iterators and weakly consistent or snapshot for concurrent iterators. Fail-safe is an informal term, not a precise guarantee. CopyOnWriteArrayList iterates over a snapshot; ConcurrentHashMap iterators are weakly consistent.

#### Code Example / Key Takeaways
```java
import java.util.*;
import java.util.concurrent.*;
class Demo { public static void main(String[] args) { CopyOnWriteArrayList<Integer> xs = new CopyOnWriteArrayList<>(List.of(1)); for (int x : xs) xs.add(2); System.out.println(xs); } }
```

---

### Q147. How do streams integrate with collections?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
Collections expose stream() and parallelStream() for functional-style processing. Streams do not store data; they process elements from the source through intermediate operations and a terminal operation. Avoid mutating the source while streaming unless the source is concurrent and the operation is designed for it.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { List<String> names = List.of("Ana", "Bob"); List<String> upper = names.stream().map(String::toUpperCase).toList(); System.out.println(upper); } }
```

---

### Q148. How do Collectors create collections?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
Collectors turn stream results into lists, sets, maps, groups, or custom collections. toList does not promise a mutable list in modern Java Stream.toList; Collectors.toCollection lets you choose the exact implementation when mutability or ordering matters.

#### Code Example / Key Takeaways
```java
import java.util.*;
import java.util.stream.*;
class Demo { public static void main(String[] args) { Set<String> set = Stream.of("b","a","b").collect(Collectors.toCollection(LinkedHashSet::new)); System.out.println(set); } }
```

---

### Q149. How do you collect a stream into a Map safely?
**Difficulty:** `Intermediate`
**Category:** Collections & Generics

#### Answer
Collectors.toMap needs key mapper, value mapper, and often a merge function for duplicate keys. Without a merge function, duplicate keys throw IllegalStateException. Provide a map supplier when the result order or implementation matters.

#### Code Example / Key Takeaways
```java
import java.util.*;
import java.util.stream.*;
class Demo { public static void main(String[] args) { Map<Character,String> m = Stream.of("ape","ant").collect(Collectors.toMap(s -> s.charAt(0), s -> s, (a,b) -> a + "," + b, LinkedHashMap::new)); System.out.println(m); } }
```

---

### Q150. What immutable collection options exist in modern Java?
**Difficulty:** `Basic`
**Category:** Collections & Generics

#### Answer
Modern Java provides List.of, Set.of, Map.of, copyOf methods, and stream terminal toList for unmodifiable results. These collections reject mutation and usually reject nulls. Use them for constants, defensive copies, and API return values that callers should not modify.

#### Code Example / Key Takeaways
```java
import java.util.*;
class Demo { public static void main(String[] args) { List<String> xs = List.of("a", "b"); Set<String> ys = Set.copyOf(xs); Map<String,Integer> zs = Map.of("size", xs.size()); System.out.println(ys + " " + zs); } }
```

---
