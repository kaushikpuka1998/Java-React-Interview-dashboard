# Java Streams & Lambdas Interview Questions (Q1 – Q25)

---

### Q1. Find the sum of all numbers greater than 10 using stream
**Difficulty:** `Basic`
**Category:** Java Streams & Lambdas

#### Answer
Use `filter` to keep elements matching the predicate, then collect (or `mapToInt().sum()` for an actual sum). `filter` keeps only the elements where the lambda returns true.

#### Code Example
```java
List<Integer> numbers = List.of(10, 11, 12, 15);
List<Integer> list = numbers.stream()
        .filter(i -> i > 10)
        .collect(Collectors.toList());
list.forEach(System.out::println);
// Output: 11 12 15
```
---

### Q2. Convert List<Integer> to List<String>
**Difficulty:** `Basic`
**Category:** Java Streams & Lambdas

#### Answer
Use `map` with `String::valueOf` to transform each element, then collect. `map` applies a function to every element and returns a new stream of results.

#### Code Example
```java
List<Integer> numbers = List.of(1, 2, 3, 4, 5);
List<String> list = numbers.stream()
        .map(String::valueOf)
        .collect(Collectors.toList());
list.forEach(System.out::println);
// Output: 1 2 3 4 5
```
---

### Q3. Find all even numbers using Streams
**Difficulty:** `Basic`
**Category:** Java Streams & Lambdas

#### Answer
Filter elements where `i % 2 == 0`. The modulo predicate keeps only even values.

#### Code Example
```java
List<Integer> numbers = List.of(1, 2, 3, 4, 5);
List<Integer> list = numbers.stream()
        .filter(i -> i % 2 == 0)
        .collect(Collectors.toList());
list.forEach(System.out::println);
// Output: 2 4
```
---

### Q4. Find all odd numbers using stream
**Difficulty:** `Basic`
**Category:** Java Streams & Lambdas

#### Answer
Filter with `(i & 1) == 1` (bitwise AND) or `i % 2 != 0`. The lowest bit is 1 for odd numbers.

#### Code Example
```java
List<Integer> numbers = List.of(1, 2, 3, 4, 5);
List<Integer> list = numbers.stream()
        .filter(i -> (i & 1) == 1)
        .collect(Collectors.toList());
list.forEach(System.out::println);
// Output: 1 3 5
```
---

### Q5. Find duplicate elements
**Difficulty:** `Intermediate`
**Category:** Java Streams & Lambdas

#### Answer
Use a `HashSet`'s `add` return value: `add` returns false when the element already exists, so `!seen.add(i)` is true only for duplicates.

#### Code Example
```java
List<Integer> numbers = List.of(1, 2, 3, 3, 5);
Set<Integer> seen = new HashSet<>();
Set<Integer> list = numbers.stream()
        .filter(i -> !seen.add(i))
        .collect(Collectors.toSet());
list.forEach(System.out::println);
// Output: 3
```
---

### Q6. Find unique elements while preserving order
**Difficulty:** `Intermediate`
**Category:** Java Streams & Lambdas

#### Answer
`distinct()` removes duplicates while preserving encounter order. A `HashSet` with `seen.add(i)` also works but a Set doesn't preserve order — prefer `distinct()` into a List.

#### Code Example
```java
List<Integer> numbers = List.of(1, 2, 3, 3, 5);
List<Integer> list = numbers.stream()
        .distinct()
        .collect(Collectors.toList());
list.forEach(System.out::println);
// Output: 1 2 3 5
```
---

### Q7. Find the second-highest number
**Difficulty:** `Intermediate`
**Category:** Java Streams & Lambdas

#### Answer
Remove duplicates, sort in reverse order, `skip(1)` to drop the highest, then take `findFirst`. Returns an `Optional` in case the stream is too small.

#### Code Example
```java
List<Integer> numbers = List.of(1, 2, 3, 3, 5);
Optional<Integer> res = numbers.stream()
        .distinct()
        .sorted(Comparator.reverseOrder())
        .skip(1)
        .findFirst();
System.out.println(res.get());
// Output: 3
```
---

### Q8. Find the second lowest number
**Difficulty:** `Intermediate`
**Category:** Java Streams & Lambdas

#### Answer
Same idea as second-highest but sort ascending (natural order), skip the lowest, then `findFirst`.

#### Code Example
```java
List<Integer> numbers = List.of(1, 2, 3, 3, 5);
Optional<Integer> res = numbers.stream()
        .distinct()
        .sorted()
        .skip(1)
        .findFirst();
System.out.println(res.get());
// Output: 2
```
---

### Q9. Find maximum and minimum
**Difficulty:** `Basic`
**Category:** Java Streams & Lambdas

#### Answer
Use `max`/`min` with a comparator (returns `Optional`), or `mapToInt` to an `IntStream` and call `.max().orElseThrow()` for a primitive result.

#### Code Example
```java
List<Integer> numbers = List.of(1, 2, 3, 3, 5);
Optional<Integer> maximum = numbers.stream().max(Integer::compareTo);
Optional<Integer> minimum = numbers.stream().min(Integer::compareTo);
System.out.println(maximum.get()); // 5
System.out.println(minimum.get()); // 1

int max = numbers.stream().mapToInt(i -> i).max().orElseThrow();
System.out.println(max); // 5
```
---

### Q10. Count numbers greater than a value
**Difficulty:** `Basic`
**Category:** Java Streams & Lambdas

#### Answer
Filter by the condition, then `count()` returns the number of matching elements as a `long`.

#### Code Example
```java
List<Integer> numbers = List.of(1, 2, 3, 3, 5);
long count = numbers.stream()
        .filter(i -> i > 2)
        .count();
System.out.println(count); // 3
```
---

### Q11. Find first element satisfying a condition
**Difficulty:** `Basic`
**Category:** Java Streams & Lambdas

#### Answer
`filter` then `findFirst` returns an `Optional` with the first matching element in encounter order (short-circuits once found).

#### Code Example
```java
List<Integer> numbers = List.of(1, 2, 3, 3, 5);
Optional<Integer> res = numbers.stream()
        .filter(i -> i > 2)
        .findFirst();
System.out.println(res.get()); // 3
```
---

### Q12. Check whether all elements satisfy a condition
**Difficulty:** `Basic`
**Category:** Java Streams & Lambdas

#### Answer
`allMatch(predicate)` returns true if every element matches (short-circuits on the first mismatch). For an empty stream it returns true.

#### Code Example
```java
List<Integer> numbers = List.of(1, 2, 3, 3, 5);
boolean res = numbers.stream().allMatch(n -> n > 0);
System.out.println(res); // true
```
---

### Q13. Check whether any element satisfies a condition
**Difficulty:** `Basic`
**Category:** Java Streams & Lambdas

#### Answer
`anyMatch(predicate)` returns true if at least one element matches, short-circuiting on the first success.

#### Code Example
```java
List<Integer> numbers = List.of(1, 2, 3, 3, 5);
boolean res = numbers.stream().anyMatch(n -> n % 2 == 0);
System.out.println(res); // true
```
---

### Q14. Check whether no element satisfies a condition
**Difficulty:** `Basic`
**Category:** Java Streams & Lambdas

#### Answer
`noneMatch(predicate)` returns true if no element matches. Useful for validating that a collection contains no invalid values.

#### Code Example
```java
List<Integer> numbers = List.of(1, 2, 3, 3, 5);
boolean res = numbers.stream().noneMatch(n -> n < 0);
System.out.println(res); // true
```
---

### Q15. Convert strings to uppercase
**Difficulty:** `Basic`
**Category:** Java Streams & Lambdas

#### Answer
Map each string with the `String::toUpperCase` method reference and collect into a list.

#### Code Example
```java
List<String> numbers = List.of("a", "b", "c");
List<String> res = numbers.stream()
        .map(String::toUpperCase)
        .collect(Collectors.toList());
res.forEach(System.out::println);
// Output: A B C
```
---

### Q16. Sort strings by length
**Difficulty:** `Intermediate`
**Category:** Java Streams & Lambdas

#### Answer
Use `sorted` with `Comparator.comparingInt(String::length)` to order elements by their length ascending.

#### Code Example
```java
List<String> numbers = List.of("aA", "bBBB", "cA", "M");
List<String> res = numbers.stream()
        .sorted(Comparator.comparingInt(String::length))
        .collect(Collectors.toList());
res.forEach(System.out::println);
// Output: M aA cA bBBB
```
---

### Q17. Sort strings by length in descending order
**Difficulty:** `Intermediate`
**Category:** Java Streams & Lambdas

#### Answer
Chain `.reversed()` onto the comparator to flip the ordering to descending.

#### Code Example
```java
List<String> numbers = List.of("aA", "bBBB", "cA", "m");
List<String> res = numbers.stream()
        .sorted(Comparator.comparingInt(String::length).reversed())
        .collect(Collectors.toList());
res.forEach(System.out::println);
// Output: bBBB cA aA m
```
---

### Q18. Flatten List<List<Integer>>
**Difficulty:** `Intermediate`
**Category:** Java Streams & Lambdas

#### Answer
`flatMap(List::stream)` turns each inner list into a stream and concatenates them into one flat stream of elements.

#### Code Example
```java
List<List<Integer>> numbers = Arrays.asList(
        Arrays.asList(1, 2),
        Arrays.asList(3, 4),
        Arrays.asList(5, 6));
List<Integer> res = numbers.stream()
        .flatMap(List::stream)
        .collect(Collectors.toList());
res.forEach(System.out::println);
// Output: 1 2 3 4 5 6
```
---

### Q19. Find unique words from sentences
**Difficulty:** `Advanced`
**Category:** Java Streams & Lambdas

#### Answer
`flatMap` each sentence into a stream of words (split on whitespace), then collect into a `Set` to deduplicate.

#### Code Example
```java
List<String> sentences = Arrays.asList("Java is powerful", "Java is popular");
Set<String> res = sentences.stream()
        .flatMap(sentence -> Arrays.stream(sentence.split("\\s+")))
        .collect(Collectors.toSet());
res.forEach(System.out::println);
// Output: Java, is, powerful, popular
```
---

### Q20. Character frequency using stream
**Difficulty:** `Advanced`
**Category:** Java Streams & Lambdas

#### Answer
`chars()` gives an `IntStream` of code points; box to `Character`, then group by identity counting occurrences with `Collectors.groupingBy` + `Collectors.counting`.

#### Code Example
```java
String word = "kaushik";
Map<Character, Long> freq = word.chars()
        .mapToObj(c -> (char) c)
        .collect(Collectors.groupingBy(
                Function.identity(), Collectors.counting()));
freq.forEach((ch, count) -> System.out.println(ch + " : " + count));
```
---

### Q21. Word frequency across sentences
**Difficulty:** `Advanced`
**Category:** Java Streams & Lambdas

#### Answer
Split each sentence into words with `flatMap`, then `groupingBy(identity, counting)` builds a word→count map.

#### Code Example
```java
List<String> sentences = Arrays.asList("java is good", "java is powerful", "java is easy");
Map<String, Long> freq = sentences.stream()
        .flatMap(s -> Arrays.stream(s.split("\\s+")))
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
freq.forEach((word, count) -> System.out.println(word + " : " + count));
// Output: java:3 is:3 good:1 powerful:1 easy:1
```
---

### Q22. Find the longest string
**Difficulty:** `Intermediate`
**Category:** Java Streams & Lambdas

#### Answer
Use `max` with `Comparator.comparingInt(String::length)` to get the element with the greatest length.

#### Code Example
```java
List<String> sentences = Arrays.asList("java is good", "java is powerful", "java is easy");
Optional<String> longest = sentences.stream()
        .max(Comparator.comparingInt(String::length));
System.out.println(longest.get()); // java is powerful
```
---

### Q23. Find the shortest string
**Difficulty:** `Intermediate`
**Category:** Java Streams & Lambdas

#### Answer
Same comparator but use `min` to get the element with the smallest length.

#### Code Example
```java
List<String> sentences = Arrays.asList("java is good", "java is powerful", "java is easy");
Optional<String> shortest = sentences.stream()
        .min(Comparator.comparingInt(String::length));
System.out.println(shortest.get()); // java is good
```
---

### Q24. Sort employees by salary descending
**Difficulty:** `Intermediate`
**Category:** Java Streams & Lambdas

#### Answer
Use `sorted` with `Comparator.comparingDouble(Employee::getSalary).reversed()` to order objects by a numeric field, highest first.

#### Code Example
```java
class Employee { String name; String department; double salary; }

List<Employee> result = employees.stream()
        .sorted(Comparator.comparingDouble(Employee::getSalary).reversed())
        .collect(Collectors.toList());
```
---

### Q25. Group, aggregate and transform employees with collectors
**Difficulty:** `Advanced`
**Category:** Java Streams & Lambdas

#### Answer
`Collectors` power common aggregations: `toMap` builds id→name, `groupingBy` buckets by department, and downstream collectors (`averagingDouble`, `summingDouble`, `counting`) compute per-group stats. Combine `groupingBy` with a downstream collector for one-pass aggregation.

#### Code Example
```java
// id -> name
Map<Integer, String> idToName = employees.stream()
        .collect(Collectors.toMap(Employee::getId, Employee::getName));

// department -> employees
Map<String, List<Employee>> byDept = employees.stream()
        .collect(Collectors.groupingBy(Employee::getDepartment));

// department -> average salary
Map<String, Double> avgSalary = employees.stream()
        .collect(Collectors.groupingBy(Employee::getDepartment,
                Collectors.averagingDouble(Employee::getSalary)));

// department -> total salary
Map<String, Double> sumSalary = employees.stream()
        .collect(Collectors.groupingBy(Employee::getDepartment,
                Collectors.summingDouble(Employee::getSalary)));

// department -> headcount
Map<String, Long> deptCount = employees.stream()
        .collect(Collectors.groupingBy(Employee::getDepartment, Collectors.counting()));

// names appearing more than once
Map<String, Long> nameFreq = employees.stream()
        .collect(Collectors.groupingBy(Employee::getName, Collectors.counting()));
nameFreq.entrySet().stream()
        .filter(e -> e.getValue() > 1)
        .forEach(System.out::println);
```
---

### Q26. Partition numbers into even and odd
**Difficulty:** `Advanced`
**Category:** Java Streams & Lambdas

#### Answer
`Collectors.partitioningBy(predicate)` splits a stream into a `Map<Boolean, List<T>>` with exactly two keys (`true`/`false`). It's more efficient than `groupingBy` when there are only two buckets.

#### Code Example
```java
List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6);
Map<Boolean, List<Integer>> parts = numbers.stream()
        .collect(Collectors.partitioningBy(n -> n % 2 == 0));
System.out.println(parts.get(true));  // [2, 4, 6]
System.out.println(parts.get(false)); // [1, 3, 5]
```
---

### Q27. Sum a numeric field with reduce
**Difficulty:** `Advanced`
**Category:** Java Streams & Lambdas

#### Answer
`reduce(identity, accumulator)` folds the stream into a single value. The identity is the start/empty value; the accumulator combines the running result with each element.

#### Code Example
```java
List<Integer> numbers = List.of(1, 2, 3, 4, 5);
int sum = numbers.stream().reduce(0, Integer::sum);
System.out.println(sum); // 15

// product via reduce
int product = numbers.stream().reduce(1, (a, b) -> a * b);
System.out.println(product); // 120
```
---

### Q28. Join strings with a delimiter, prefix and suffix
**Difficulty:** `Intermediate`
**Category:** Java Streams & Lambdas

#### Answer
`Collectors.joining(delimiter, prefix, suffix)` concatenates the stream of strings into one string with separators and optional wrapping.

#### Code Example
```java
List<String> names = List.of("Rahul", "Amit", "Priya");
String csv = names.stream()
        .collect(Collectors.joining(", ", "[", "]"));
System.out.println(csv); // [Rahul, Amit, Priya]
```
---

### Q29. Get statistics (count, sum, min, max, avg) in one pass
**Difficulty:** `Advanced`
**Category:** Java Streams & Lambdas

#### Answer
`Collectors.summarizingInt/Double` (or `IntStream.summaryStatistics()`) computes count, sum, min, max, and average in a single traversal, returning an `IntSummaryStatistics`.

#### Code Example
```java
List<Integer> numbers = List.of(1, 2, 3, 4, 5);
IntSummaryStatistics stats = numbers.stream()
        .collect(Collectors.summarizingInt(i -> i));
System.out.println(stats.getSum());     // 15
System.out.println(stats.getAverage()); // 3.0
System.out.println(stats.getMax());     // 5
```
---

### Q30. Build a Map handling duplicate keys (merge function)
**Difficulty:** `Advanced`
**Category:** Java Streams & Lambdas

#### Answer
`Collectors.toMap` throws `IllegalStateException` on duplicate keys unless you supply a merge function to resolve collisions (e.g. keep the first, sum values).

#### Code Example
```java
List<String> words = List.of("apple", "banana", "avocado", "cherry");
Map<Character, String> byFirst = words.stream()
        .collect(Collectors.toMap(
                w -> w.charAt(0),
                w -> w,
                (existing, replacement) -> existing)); // keep first on clash
System.out.println(byFirst); // {a=apple, b=banana, c=cherry}
```
---

### Q31. Group by a field and map to another (downstream mapping)
**Difficulty:** `Advanced`
**Category:** Java Streams & Lambdas

#### Answer
`groupingBy(classifier, Collectors.mapping(mapper, toList()))` groups then transforms each group's elements, e.g. department → list of employee names.

#### Code Example
```java
Map<String, List<String>> deptNames = employees.stream()
        .collect(Collectors.groupingBy(
                Employee::getDepartment,
                Collectors.mapping(Employee::getName, Collectors.toList())));
System.out.println(deptNames);
```
---

### Q32. Find the highest-paid employee per department
**Difficulty:** `Advanced`
**Category:** Java Streams & Lambdas

#### Answer
Use `groupingBy` with the downstream `Collectors.maxBy(comparator)`, which yields an `Optional` per group. Wrap with `collectingAndThen` to unwrap the Optional if desired.

#### Code Example
```java
Map<String, Optional<Employee>> topPaid = employees.stream()
        .collect(Collectors.groupingBy(
                Employee::getDepartment,
                Collectors.maxBy(Comparator.comparingDouble(Employee::getSalary))));
topPaid.forEach((dept, emp) ->
        System.out.println(dept + " -> " + emp.map(Employee::getName).orElse("none")));
```
---

### Q33. Two-level (nested) grouping
**Difficulty:** `Experienced`
**Category:** Java Streams & Lambdas

#### Answer
Nest `groupingBy` inside `groupingBy` to bucket by two keys, producing a `Map<K1, Map<K2, List<T>>>` — e.g. department then gender.

#### Code Example
```java
Map<String, Map<String, List<Employee>>> byDeptThenGender = employees.stream()
        .collect(Collectors.groupingBy(
                Employee::getDepartment,
                Collectors.groupingBy(Employee::getGender)));
System.out.println(byDeptThenGender);
```
---

### Q34. Count occurrences and sort the result by frequency
**Difficulty:** `Advanced`
**Category:** Java Streams & Lambdas

#### Answer
Group-count into a map, then stream its entries, sort by value descending, and collect back into an ordered `LinkedHashMap` to preserve the sorted order.

#### Code Example
```java
List<String> items = List.of("a", "b", "a", "c", "b", "a");
Map<String, Long> sorted = items.stream()
        .collect(Collectors.groupingBy(s -> s, Collectors.counting()))
        .entrySet().stream()
        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
        .collect(Collectors.toMap(
                Map.Entry::getKey, Map.Entry::getValue,
                (a, b) -> a, LinkedHashMap::new));
System.out.println(sorted); // {a=3, b=2, c=1}
```
---

### Q35. Multi-field sorting with thenComparing
**Difficulty:** `Advanced`
**Category:** Java Streams & Lambdas

#### Answer
Chain `Comparator.comparing(...).thenComparing(...)` to sort by a primary key, breaking ties with a secondary key — e.g. by department, then salary descending.

#### Code Example
```java
List<Employee> sorted = employees.stream()
        .sorted(Comparator.comparing(Employee::getDepartment)
                .thenComparing(Comparator.comparingDouble(Employee::getSalary).reversed()))
        .collect(Collectors.toList());
sorted.forEach(System.out::println);
```
---

### Q36. flatMap over map entries to invert a multimap
**Difficulty:** `Experienced`
**Category:** Java Streams & Lambdas

#### Answer
Stream `entrySet()`, `flatMap` each value list into (value, key) pairs, then collect — a common technique to invert a `Map<K, List<V>>` into `Map<V, K>`.

#### Code Example
```java
Map<String, List<Integer>> deptIds = Map.of(
        "HR", List.of(1, 2), "IT", List.of(3, 4));
Map<Integer, String> idToDept = deptIds.entrySet().stream()
        .flatMap(e -> e.getValue().stream()
                .map(id -> Map.entry(id, e.getKey())))
        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
System.out.println(idToDept); // {1=HR, 2=HR, 3=IT, 4=IT}
```
---

### Q37. takeWhile and dropWhile
**Difficulty:** `Advanced`
**Category:** Java Streams & Lambdas

#### Answer
`takeWhile` keeps a prefix while the predicate holds (stops at the first failure); `dropWhile` discards that prefix and keeps the rest. Both are for ordered streams (Java 9+).

#### Code Example
```java
List<Integer> numbers = List.of(2, 4, 6, 7, 8, 10);
System.out.println(numbers.stream().takeWhile(n -> n % 2 == 0).toList()); // [2, 4, 6]
System.out.println(numbers.stream().dropWhile(n -> n % 2 == 0).toList()); // [7, 8, 10]
```
---

### Q38. Generate an infinite stream with iterate and limit
**Difficulty:** `Advanced`
**Category:** Java Streams & Lambdas

#### Answer
`Stream.iterate(seed, next)` produces an infinite sequence; bound it with `limit`. The 3-arg `iterate(seed, hasNext, next)` (Java 9+) adds a built-in stop condition.

#### Code Example
```java
// first 5 powers of 2
List<Integer> powers = Stream.iterate(1, n -> n * 2)
        .limit(5)
        .toList();
System.out.println(powers); // [1, 2, 4, 8, 16]

// iterate with predicate (Java 9+)
Stream.iterate(1, n -> n <= 20, n -> n + 5).forEach(System.out::println); // 1 6 11 16
```
---

### Q39. Three-argument reduce for parallel-safe accumulation
**Difficulty:** `Experienced`
**Category:** Java Streams & Lambdas

#### Answer
`reduce(identity, accumulator, combiner)` supports a different result type and parallel execution: the accumulator folds elements into partial results, the combiner merges partials. The combiner must be associative and consistent with the accumulator.

#### Code Example
```java
List<String> words = List.of("java", "stream", "api");
int totalChars = words.stream()
        .reduce(0, (sum, w) -> sum + w.length(), Integer::sum);
System.out.println(totalChars); // 13
```
---

### Q40. Write a custom Collector
**Difficulty:** `Experienced`
**Category:** Java Streams & Lambdas

#### Answer
`Collector.of(supplier, accumulator, combiner, finisher)` builds a bespoke reduction. The supplier creates the mutable container, accumulator adds elements, combiner merges containers (parallel), finisher produces the final result.

#### Code Example
```java
Collector<Integer, ?, String> toRange = Collector.of(
        () -> new int[]{Integer.MAX_VALUE, Integer.MIN_VALUE},
        (acc, i) -> { acc[0] = Math.min(acc[0], i); acc[1] = Math.max(acc[1], i); },
        (a, b) -> new int[]{Math.min(a[0], b[0]), Math.max(a[1], b[1])},
        acc -> acc[0] + ".." + acc[1]);
String range = List.of(4, 1, 9, 3).stream().collect(toRange);
System.out.println(range); // 1..9
```
---

### Q41. collectingAndThen to produce an immutable result
**Difficulty:** `Advanced`
**Category:** Java Streams & Lambdas

#### Answer
`Collectors.collectingAndThen(downstream, finisher)` post-processes a collector's result — e.g. wrap the collected list in `Collections.unmodifiableList` for an immutable view.

#### Code Example
```java
List<Integer> immutable = List.of(1, 2, 3, 4).stream()
        .filter(n -> n % 2 == 0)
        .collect(Collectors.collectingAndThen(
                Collectors.toList(), Collections::unmodifiableList));
System.out.println(immutable); // [2, 4]
```
---

### Q42. Parallel stream and when it helps (or hurts)
**Difficulty:** `Experienced`
**Category:** Java Streams & Lambdas

#### Answer
`parallelStream()` splits work across the common ForkJoinPool for CPU-bound, large, easily-splittable data with stateless, associative operations. For small data, ordered/stateful ops, or I/O it often hurts due to overhead and contention. Never mutate shared state inside it.

#### Code Example
```java
long count = LongStream.rangeClosed(1, 10_000_000)
        .parallel()
        .filter(n -> n % 2 == 0)
        .count();
System.out.println(count); // 5000000
```
---

### Q43. Why peek should not be used for logic
**Difficulty:** `Experienced`
**Category:** Java Streams & Lambdas

#### Answer
`peek` is intended for debugging. It may be skipped entirely when the pipeline can compute results without traversing (e.g. `count()` on a sized stream), and its ordering/execution isn't guaranteed under parallelism — so never rely on it for side-effecting logic.

#### Code Example
```java
long c = Stream.of(1, 2, 3)
        .peek(x -> System.out.println("peeked " + x)) // may NOT print in some JDKs
        .count();
System.out.println(c); // 3
```
---

### Q44. Collectors.teeing to compute two aggregates at once
**Difficulty:** `Experienced`
**Category:** Java Streams & Lambdas

#### Answer
`Collectors.teeing(c1, c2, merger)` (Java 12+) runs two collectors over the same stream in one pass and merges their results — e.g. compute sum and count together to derive an average.

#### Code Example
```java
double avg = Stream.of(2, 4, 6, 8)
        .collect(Collectors.teeing(
                Collectors.summingInt(i -> i),
                Collectors.counting(),
                (sum, cnt) -> (double) sum / cnt));
System.out.println(avg); // 5.0
```
---

### Q45. Safely chain nullable lookups with Optional
**Difficulty:** `Advanced`
**Category:** Java Streams & Lambdas

#### Answer
`Optional.map`/`flatMap`/`orElseGet` chain transformations that short-circuit on absence, avoiding nested null checks. `filter` can also drop values not matching a condition.

#### Code Example
```java
Optional<Employee> emp = employees.stream()
        .filter(e -> e.getDepartment().equals("Finance"))
        .max(Comparator.comparingDouble(Employee::getSalary));

String name = emp.map(Employee::getName)
        .filter(n -> !n.isBlank())
        .orElse("No employee");
System.out.println(name);
```
---
