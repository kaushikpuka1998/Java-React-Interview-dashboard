# Java 8 to Java 21 Modern Features Interview Questions

This document contains interview questions Q226 through Q300 covering modern Java features introduced from Java 8 through Java 21: lambda expressions, functional interfaces, default/static interface methods, the Stream API, Optional, method references, records, pattern matching, sealed classes, text blocks, the `var` keyword, sequenced collections, and virtual threads.

### Q226. What are Lambda Expressions in Java 8 and how do they work?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Lambda expressions introduce functional programming to Java, allowing you to treat functionality as a method argument or code as data. They provide a concise way to represent anonymous functions. A lambda consists of a parameter list, an arrow token (`->`), and a body. They reduce boilerplate from anonymous inner classes and are only usable with functional interfaces (interfaces with exactly one abstract method). The compiler infers parameter types, and lambdas can capture variables from the enclosing scope provided those variables are effectively final.

#### Code Example / Key Takeaways
```java
// Anonymous inner class vs lambda
Runnable r1 = new Runnable() {
    @Override public void run() { System.out.println("Hello"); }
};
Runnable r2 = () -> System.out.println("Hello");

// With parameters and a block body
BiFunction<Integer, Integer, Integer> add = (a, b) -> {
    int sum = a + b;
    return sum;
};

// Capturing effectively final variable
int factor = 2;
Function<Integer, Integer> times = x -> x * factor; // factor must not be reassigned
```
---

### Q227. What is a Functional Interface and how does it differ from a regular interface?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
A functional interface has exactly one abstract method (a "single abstract method" or SAM type). It is the target type for lambda expressions and method references. While it may declare any number of default, static, or `java.lang.Object` methods, only one method may be abstract. The `@FunctionalInterface` annotation is optional but recommended: it signals intent and causes a compile error if the interface is later given a second abstract method.

#### Code Example / Key Takeaways
```java
@FunctionalInterface
interface StringFormatter {
    String format(String input); // the single abstract method

    default String formatUpper(String s) { return s.toUpperCase(); } // allowed
    static String empty() { return ""; }                            // allowed
    boolean equals(Object obj);                                      // allowed: from Object
}

StringFormatter f = s -> s.trim();
```

---

### Q228. Describe the built-in `Function<T, R>` interface and its default methods.
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Function<T, R>` represents a function that accepts one argument of type `T` and produces a result of type `R`. Its single abstract method is `R apply(T t)`. It provides two useful default methods: `andThen(Function)` composes so that the current function runs first then the other, and `compose(Function)` runs the other function first. A static `identity()` returns a function that returns its input unchanged.

#### Code Example / Key Takeaways
```java
Function<Integer, Integer> times2 = x -> x * 2;
Function<Integer, Integer> plus1  = x -> x + 1;

Function<Integer, Integer> composed = times2.andThen(plus1); // (x*2)+1
System.out.println(composed.apply(5)); // 11

Function<String, String> id = Function.identity();
System.out.println(id.apply("hi")); // hi
```
---

### Q229. How does the `Predicate<T>` interface work and what default methods does it provide?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Predicate<T>` represents a boolean-valued test on a single argument via `boolean test(T t)`. It offers default/static composition methods: `and(Predicate)` (logical AND), `or(Predicate)` (logical OR), `negate()` (logical NOT), and the static `Predicate.isEqual(Object)`. Predicates are heavily used with `Stream.filter` to select elements.

#### Code Example / Key Takeaways
```java
Predicate<Integer> positive = n -> n > 0;
Predicate<Integer> even     = n -> n % 2 == 0;

Predicate<Integer> posEven = positive.and(even);
Predicate<Integer> notPos  = positive.negate();

List<Integer> nums = List.of(-2, -1, 0, 1, 2, 3, 4);
nums.stream().filter(posEven).forEach(System.out::println); // 2, 4
```
---

### Q230. What is the `Consumer<T>` interface used for?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Consumer<T>` represents an operation that accepts a single input argument and returns no result. Its abstract method is `void accept(T t)`. It is commonly used for side effects such as printing or collecting. The default method `andThen(Consumer)` returns a composed consumer that performs the current action then the passed one.

#### Code Example / Key Takeaways
```java
Consumer<String> shout = s -> System.out.println(s.toUpperCase());
Consumer<String> greet = s -> System.out.println("Hi " + s);

List.of("alice", "bob").forEach(shout);

Consumer<String> both = shout.andThen(greet);
both.accept("carol"); // CAROL then Hi carol
```
---

### Q231. When would you use the `Supplier<T>` interface?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Supplier<T>` represents a supplier of results; it takes no arguments and returns a value via `T get()`. It is useful for deferred or lazy computation, generating values on demand, and providing factory methods. Because it accepts no input, it is the natural choice for lazy initialization and for factories passed to constructors or methods.

#### Code Example / Key Takeaways
```java
Supplier<Double> random = () -> Math.random();
System.out.println(random.get());

Supplier<List<String>> listFactory = () -> new ArrayList<>();
List<String> a = listFactory.get();
List<String> b = listFactory.get(); // fresh list each call
```
---

### Q232. What is the difference between `Function`, `BiFunction`, and `UnaryOperator`?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Function<T,R>` takes one argument and returns a possibly different type. `BiFunction<T,U,R>` takes two arguments and returns a result. `UnaryOperator<T>` is a specialization of `Function<T,T>` where the argument and result are the same type, providing `andThen`/`compose`. Similarly `BinaryOperator<T>` extends `BiFunction<T,T,T>` and adds `minBy`/`maxBy` static helpers. Choosing the right type communicates intent and avoids unsafe casting.

#### Code Example / Key Takeaways
```java
Function<String, Integer> length = String::length;
BiFunction<Integer, Integer, Integer> sum = Integer::sum;
UnaryOperator<Integer> square = x -> x * x;
BinaryOperator<Integer> max = BinaryOperator.maxBy(Integer::compare);
```
---

### Q233. What are Default Methods in interfaces and why were they introduced?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Default methods, declared with the `default` keyword, let interfaces provide a concrete implementation for a method. They were introduced primarily to allow the Collections API to be evolved with lambda-friendly methods (like `forEach`, `stream`) without breaking every existing implementation. A class implementing the interface can use, override, or ignore the default. If a class implements two interfaces with conflicting default methods, the class must override the method to resolve the ambiguity.

#### Code Example / Key Takeaways
```java
interface Greeter {
    default void greet() { System.out.println("Hello"); }
}
class EnglishGreeter implements Greeter { } // inherits greet()

interface A { default void m() { System.out.println("A"); } }
interface B { default void m() { System.out.println("B"); } }
class C implements A, B {
    public void m() { A.super.m(); } // must resolve conflict explicitly
}
```
---

### Q234. What are Static Methods in interfaces?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Static interface methods are utility methods associated with the interface itself, not with instances. They cannot be overridden by implementing classes and are invoked through the interface name (e.g., `Comparator.comparing(...)`). They were added in Java 8 so interfaces could carry factory and helper logic that previously lived in separate utility classes such as `Collections` or `Paths`.

#### Code Example / Key Takeaways
```java
Comparator<String> byLength = Comparator.comparing(String::length);
List<String> list = List.of("a", "ccc", "bb");
list.stream().sorted(byLength).forEach(System.out::println);
```
---

### Q235. How does Java resolve method invocation when multiple interfaces provide the same default method?
**Difficulty:** `Advanced`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Java uses a strict set of rules: (1) Most specific class wins over interfaces, so an overriding class method takes precedence. (2) Among interfaces, a default method in a more specific (sub)interface wins over a less specific (super)interface. (3) If two independent interfaces declare the same default and neither is more specific, the compiler forces the implementing class to override the method; otherwise it is a compile-time error. The `InterfaceName.super.method()` syntax explicitly invokes a specific interface's default.

#### Code Example / Key Takeaways
```java
interface Animal { default void sound() { System.out.println("..."); } }
interface Pet extends Animal { default void sound() { System.out.println("pet"); } }
interface Robot { default void sound() { System.out.println("beep"); } }

class Cat implements Pet, Robot {
    public void sound() { Pet.super.sound(); } // must override: Pet and Robot conflict
}
```
---

### Q236. What is the Stream API and what problems does it solve?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
The Stream API (in `java.util.stream`) provides a declarative, functional approach to processing sequences of data. A stream is not a data structure but a pipeline of operations over a source (collection, array, generator). It solves the verbosity of iterative loops by expressing what to compute rather than how, and it enables easy parallelization via `parallelStream()`. Streams are lazy (intermediate operations are not executed until a terminal operation is invoked) and consume-once (cannot be reused after a terminal operation).

#### Code Example / Key Takeaways
```java
List<String> names = List.of("Alice", "Bob", "Charlie");
long count = names.stream()
                  .filter(n -> n.length() > 3)
                  .count();
System.out.println(count); // 2
```
---

### Q237. Explain the difference between intermediate and terminal stream operations.
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Intermediate operations (`filter`, `map`, `flatMap`, `sorted`, `distinct`, `peek`, `limit`, `skip`) return a new stream and are always lazy—they do not process data until a terminal operation runs. Terminal operations (`forEach`, `collect`, `reduce`, `count`, `findFirst`, `anyMatch`, `toArray`) trigger the pipeline and produce a non-stream result (or side effect). After a terminal operation, the stream is considered consumed and can no longer be used.

#### Code Example / Key Takeaways
```java
List<Integer> nums = List.of(1, 2, 3, 4);
nums.stream()
    .filter(n -> n % 2 == 0)   // intermediate (lazy)
    .map(n -> n * 10)          // intermediate (lazy)
    .forEach(System.out::println); // terminal (executes pipeline)
```
---

### Q238. How does the `map` operation work in the Stream API?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`map(Function)` transforms each element of a stream into another object by applying a function, producing a new stream of the same size. It performs a one-to-one transformation. It is commonly used to extract fields, convert types, or compute derived values. The element type of the resulting stream may differ from the source.

#### Code Example / Key Takeaways
```java
List<String> words = List.of("hello", "world");
List<Integer> lengths = words.stream()
                             .map(String::length)
                             .toList();
System.out.println(lengths); // [5, 5]
```
---

### Q239. How does `flatMap` differ from `map`?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`flatMap(Function)` maps each element to a stream and then flattens all the resulting streams into a single stream. It is used for one-to-many transformations—for example, splitting sentences into words or extracting elements from nested collections. `map` would produce a stream of streams, whereas `flatMap` produces a single merged stream.

#### Code Example / Key Takeaways
```java
List<List<Integer>> matrix = List.of(List.of(1, 2), List.of(3, 4));
List<Integer> flat = matrix.stream()
                           .flatMap(List::stream)
                           .toList();
System.out.println(flat); // [1, 2, 3, 4]

List<String> sentences = List.of("hello world", "foo bar");
List<String> words = sentences.stream()
                              .flatMap(s -> Arrays.stream(s.split(" ")))
                              .toList();
```
---

### Q240. What is the `filter` operation and how is it used with a Predicate?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`filter(Predicate)` retains only the elements of a stream for which the predicate evaluates to `true`, producing a new stream of the same or smaller size. It does not modify the source; instead it lazily selects elements that satisfy the condition. Combined with other intermediate operations, `filter` is the primary mechanism for selecting data within a pipeline.

#### Code Example / Key Takeaways
```java
List<Integer> nums = List.of(1, 2, 3, 4, 5, 6);
List<Integer> evens = nums.stream()
                          .filter(n -> n % 2 == 0)
                          .toList();
System.out.println(evens); // [2, 4, 6]
```
---

### Q241. Explain the `reduce` operation with its three overloads.
**Difficulty:** `Advanced`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`reduce` performs a reduction (fold) that combines stream elements into a single result using an associative accumulator. The three overloads are: (1) `reduce(identity, accumulator)` returns the accumulated value with an identity that is both the initial value and the result for an empty stream; (2) `reduce(accumulator)` returns an `Optional<T>` (no identity, useful when the stream may be empty); (3) `reduce(identity, accumulator, combiner)` for parallel streams where the combiner merges partial results from different threads. The accumulator must be associative and the identity must satisfy `accumulator.apply(identity, x) == x`.

#### Code Example / Key Takeaways
```java
List<Integer> nums = List.of(1, 2, 3, 4);
int sum1 = nums.stream().reduce(0, Integer::sum);            // identity 0
Optional<Integer> sum2 = nums.stream().reduce(Integer::sum); // Optional[10]
String joined = nums.stream()
                    .map(String::valueOf)
                    .reduce("", (a, b) -> a + b);            // "1234"
System.out.println(sum1 + " " + sum2 + " " + joined);
```
---

### Q242. How does the `collect` operation work, and what are Collectors?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`collect` is a terminal operation that mutably accumulates stream elements into a result container (such as a `List`, `Set`, `Map`, or a summary). A `Collector` (from `java.util.stream.Collectors`) describes the reduction: a supplier for the container, an accumulator, a combiner for parallel execution, and a finisher. Common collectors include `toList()`, `toSet()`, `toMap()`, `joining()`, `groupingBy()`, `partitioningBy()`, and `summarizingInt()`.

#### Code Example / Key Takeaways
```java
List<String> names = List.of("Alice", "Bob", "Ann");
List<String> upper = names.stream().collect(Collectors.toList());
Set<String> unique = names.stream().collect(Collectors.toSet());
String csv = names.stream().collect(Collectors.joining(", "));
System.out.println(csv); // Alice, Bob, Ann
```
---

### Q243. What does `Collectors.groupingBy` do and what variations exist?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`groupingBy(classifier)` groups elements by a key derived from each element, returning a `Map<K, List<T>>`. Variations include `groupingBy(classifier, downstream)` to perform a downstream reduction on each group (e.g., `counting()`, `mapping()`, `summingInt()`), and `groupingBy(classifier, mapFactory, downstream)` to control the returned map type. `partitioningBy(Predicate)` is a specialized two-bucket grouping (true/false).

#### Code Example / Key Takeaways
```java
List<String> names = List.of("Alice", "Bob", "Ann", "Brian");
Map<Character, List<String>> byFirst =
    names.stream().collect(Collectors.groupingBy(s -> s.charAt(0)));
System.out.println(byFirst); // {A=[Alice, Ann], B=[Bob, Brian]}

Map<Boolean, Long> countByLength =
    names.stream().collect(Collectors.partitioningBy(s -> s.length() > 3, Collectors.counting()));
```
---

### Q244. What is the difference between `collect` and `reduce` for building a Collection?
**Difficulty:** `Advanced`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`reduce` is meant for immutable reduction producing a single value and is general-purpose but awkward for mutable containers because it typically creates a new accumulator at each step, which is inefficient and not parallel-friendly. `collect` is designed specifically for mutable reduction: it provides a mutable container via a supplier and folds elements into it, making it both efficient and naturally parallel. Generally prefer `collect`/`Collectors.toList()` over `reduce` for gathering into collections.

#### Code Example / Key Takeaways
```java
// Inefficient: creates a new list at every step
List<Integer> bad = List.of(1,2,3).stream()
    .reduce(new ArrayList<Integer>(),
            (list, e) -> { list.add(e); return list; },
            (l1, l2) -> { l1.addAll(l2); return l1; });

// Idiomatic and efficient
List<Integer> good = List.of(1,2,3).stream().collect(Collectors.toList());
```
---

### Q245. What is the `Optional` class and why was it introduced?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Optional<T>` is a container object that may or may not hold a non-null value. It was introduced to represent the absence of a value explicitly, reducing `NullPointerException`s and eliminating ambiguous `null` returns. Instead of returning `null`, APIs can return `Optional.empty()` to signal "no value." It encourages the caller to handle the absent case explicitly. Note that `Optional` is intended for return types, not for fields, method parameters, or collection elements.

#### Code Example / Key Takeaways
```java
Optional<String> name = Optional.ofNullable(findName(42));
name.ifPresent(System.out::println);
String result = name.orElse("default");
```
---

### Q246. What are the common methods of the `Optional` class?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Key methods include: `of(value)` (throws if null), `ofNullable(value)` (allows null → empty), `empty()`, `isPresent()`, `ifPresent(Consumer)`, `get()` (throws if empty—avoid), `orElse(default)`, `orElseGet(Supplier)` (lazy default), `orElseThrow()` / `orElseThrow(Supplier)`, `map(Function)`, `flatMap(Function)`, `filter(Predicate)`, and `stream()` (since Java 9, turns Optional into a 0/1 element stream). `orElseGet` is preferred over `orElse` when computing the default is expensive.

#### Code Example / Key Takeaways
```java
Optional<User> user = findUser(1);
String email = user
    .map(User::email)
    .filter(e -> e.contains("@"))
    .orElseGet(() -> generateTempEmail()); // lazy
```
---

### Q247. Why should you avoid using `Optional.get()` and what are safer alternatives?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Optional.get()` throws `NoSuchElementException` if the Optional is empty, which is little better than a `NullPointerException` and defeats the purpose of `Optional`. Safer alternatives express intent: `orElse(default)` or `orElseGet(Supplier)` for a fallback, `ifPresent(Consumer)` for side effects, `orElseThrow(Supplier)` when absence is genuinely exceptional, and `isPresent()` checks only when necessary. Since Java 10, `orElseThrow()` with no args exists for the exceptional case.

#### Code Example / Key Takeaways
```java
Optional<String> opt = Optional.empty();
// String v = opt.get(); // NoSuchElementException - avoid

String v = opt.orElse("fallback");
opt.ifPresent(System.out::println);
String must = opt.orElseThrow(() -> new IllegalStateException("missing"));
```
---

### Q248. What are Method References and what are the four kinds?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Method references are a shorthand notation for lambdas that simply call an existing method. They improve readability. The four kinds are: (1) Static method reference: `ClassName::staticMethod`; (2) Instance method of a particular object: `instance::method`; (3) Instance method of an arbitrary object of a given type: `ClassName::instanceMethod` (the object becomes the first argument); (4) Constructor reference: `ClassName::new`. The target type must be a functional interface compatible with the method signature.

#### Code Example / Key Takeaways
```java
List<String> names = List.of("a", "b");
names.forEach(System.out::println);        // instance method of particular object

List<String> upper = names.stream()
                          .map(String::toUpperCase)   // instance method of arbitrary object
                          .toList();
List<Integer> nums = names.stream().map(Integer::parseInt).toList(); // static
Supplier<List<String>> factory = ArrayList::new;                     // constructor
```
---

### Q249. How does `String::toUpperCase` as a method reference differ from `s -> s.toUpperCase()`?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
They are functionally equivalent and the compiler produces essentially the same bytecode. `String::toUpperCase` is a method reference of the "instance method of an arbitrary receiver of type String" kind: the stream element (the `String`) becomes the implicit `this` on which `toUpperCase()` is invoked. The lambda `s -> s.toUpperCase()` makes this explicit. Method references are preferred when they make the code clearer; lambdas are used when more complex logic is needed.

#### Code Example / Key Takeaways
```java
Stream<String> s = Stream.of("a", "b");
s.map(String::toUpperCase).forEach(System.out::println); // cleaner
// Equivalent lambda:
Stream.of("a","b").map(s2 -> s2.toUpperCase()).forEach(System.out::println);
```
---

### Q250. What are Records in Java and what problem do they solve?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Records (preview in Java 14, final in Java 16) are a concise way to model immutable data carriers. A record automatically derives the canonical constructor, private final fields, accessor methods (named after the component, not `getX`), `equals`, `hashCode`, and `toString`. They eliminate the boilerplate of traditional POJOs used purely to hold data. Records are implicitly final and cannot extend other classes (but can implement interfaces). They are ideal for DTOs, value objects, and stream aggregate results.

#### Code Example / Key Takeaways
```java
// Before: lots of boilerplate
public class Person {
    private final String name;
    private final int age;
    public Person(String name, int age) { this.name = name; this.age = age; }
    public String getName() { return name; }
    public int getAge() { return age; }
    // equals, hashCode, toString...
}

// After: one line, same behavior
public record Person(String name, int age) { }
```

---

### Q251. How do you define a Record and what is auto-generated?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
A record is declared with the `record` keyword followed by a name and a parenthesized list of components. For `record Point(int x, int y)`, the compiler generates: a private final field for each component, a public accessor `x()` and `y()` (not `getX`), a canonical constructor `Point(int x, int y)`, plus `equals`, `hashCode`, and `toString`. You may add additional constructors, static fields/methods, and instance methods, and you may override the auto-generated members.

#### Code Example / Key Takeaways
```java
public record Point(int x, int y) { }

Point p = new Point(1, 2);
System.out.println(p.x());        // 1
System.out.println(p);            // Point[x=1, y=2]
```

---

### Q252. Can a Record have custom constructors or additional methods?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Yes. A record may declare an additional (non-canonical) constructor, but any additional constructor must eventually delegate to the canonical constructor via `this(...)`. You can use a compact canonical constructor to validate or normalize components without redeclaring parameters. You can also add static methods, static fields, and instance methods, and override `equals`/`hashCode`/`toString` if needed. You cannot add instance fields that are not components.

#### Code Example / Key Takeaways
```java
public record Range(int lo, int hi) {
    public Range {                       // compact canonical constructor
        if (lo > hi) throw new IllegalArgumentException("lo > hi");
    }
    public int size() { return hi - lo; } // additional method
}
```

---

### Q253. How are Records used effectively with the Stream API?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Records make excellent intermediate or final results in stream pipelines because they are immutable and come with `equals`/`hashCode`/`toString` for free. They are commonly used as keys in `groupingBy`, as the element type after a `map`, or to bundle multiple computed values for downstream collectors like `summarizing` or `toMap`. Their value-based equality also makes them handy as `Set`/map keys for deduplication.

#### Code Example / Key Takeaways
```java
record Person(String name, int age) { }
List<Person> people = List.of(new Person("Ann", 30), new Person("Bob", 25));
Map<String, Integer> nameToAge = people.stream()
    .collect(Collectors.toMap(Person::name, Person::age));
```

---

### Q254. What is Pattern Matching for `instanceof` (Java 16+) and how does it improve code?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Pattern matching for `instanceof` (standard in Java 16, preview earlier) lets you combine a type test with a binding of a typed variable in a single expression: `if (obj instanceof String s) { ... use s ... }`. The bound variable `s` is in scope only when the test succeeds and does not need an explicit cast. This removes the boilerplate `if (obj instanceof String) { String s = (String) obj; }` and reduces casting errors.

#### Code Example / Key Takeaways
```java
Object obj = "hello";
if (obj instanceof String s) {
    System.out.println(s.length()); // no cast needed
}
```

---

### Q255. How does Pattern Matching for `switch` work in Java 17/21?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Pattern matching for `switch` (preview in Java 17, finalized in Java 21) allows `case` labels to be type patterns and guards. You write `case String s -> ...`, `case Integer i -> ...`, and use `when` guards for refinements like `case Integer i when i > 0 -> ...`. The switch can mix type patterns, constants, and `default`/`case null` handling. It removes the need for chained `if (x instanceof ...)` blocks and provides exhaustiveness checking for sealed type hierarchies.

#### Code Example / Key Takeaways
```java
static String classify(Object o) {
    return switch (o) {
        case Integer i when i > 0 -> "positive int";
        case Integer i            -> "non-positive int";
        case String s             -> "string: " + s;
        case null                 -> "null";
        default                   -> "other";
    };
}
```

---

### Q256. What is the `case null` handling in modern switch expressions?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Traditional `switch` on a reference would throw `NullPointerException` if the selector was null and there was no null case. Modern pattern switch requires you to explicitly handle null: you can add `case null -> ...`, or, if you omit it, the compiler inserts an implicit null check that throws `NullPointerException` (to preserve the legacy behavior) unless a `case null` is present. This makes null handling explicit and avoids accidental NPEs.

#### Code Example / Key Takeaways
```java
String result = switch (input) {     // input may be null
    case null  -> "was null";
    case "x"   -> "X";
    default    -> "other";
};
```

---

### Q257. What are Sealed Classes (Java 17) and what problem do they solve?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Sealed classes (finalized in Java 17) restrict which other classes or interfaces may extend or implement them, using the `sealed` modifier and a `permits` clause. They solve the problem of wanting inheritance for a known, closed set of subtypes (e.g., an algebraic data type) while preventing arbitrary third-party subclasses. This enables exhaustive pattern matching in `switch` because the compiler knows all permitted subtypes. Subtypes must be `final`, `sealed`, or `non-sealed`.

#### Code Example / Key Takeaways
```java
public sealed interface Shape permits Circle, Rectangle, Square { }
public final class Circle    extends Shape { }
public final class Rectangle extends Shape { }
public non-sealed class Square extends Shape { }
```

---

### Q258. What are the rules for permitted subclasses of a sealed type?
**Difficulty:** `Advanced`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Each permitted subclass must be accessible to the sealed class and must declare itself as `final`, `sealed`, or `non-sealed`. A `final` subclass cannot be further extended; a `sealed` subclass must itself declare its own `permits`; a `non-sealed` subclass opens the hierarchy to arbitrary extension (breaking closure). All permitted subclasses must reside in the same module (or same package if unnamed module) as the sealed parent, and the `permits` list must name exactly the direct subclasses.

#### Code Example / Key Takeaways
```java
public sealed class Expr permits Const, Add, Var { }
public final class Const extends Expr { }
public sealed class Add extends Expr permits AddInt, AddDbl { }
public non-sealed class Var extends Expr { } // open to extension
```

---

### Q259. How do Sealed Classes enable exhaustive `switch` pattern matching?
**Difficulty:** `Advanced`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Because a sealed type's permitted subclasses are known at compile time, a `switch` over that type with a `case` for each permitted subtype (plus optionally `default`) is provably exhaustive. When all subtypes are covered, you can omit `default` and the compiler will error if a new subtype is later added without handling it—turning a runtime bug into a compile-time error. This is the Java equivalent of algebraic data type matching.

#### Code Example / Key Takeaways
```java
double area(Shape s) {
    return switch (s) {                       // exhaustive over permits
        case Circle c    -> Math.PI * c.r() * c.r();
        case Rectangle r -> r.w() * r.h();
        case Square sq   -> sq.side() * sq.side();
        // no default needed; compiler knows all cases
    };
}
```

---

### Q260. What are Text Blocks (Java 15) and how do they improve multi-line strings?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Text blocks, finalized in Java 15, let you write multi-line string literals using triple double-quotes (`"""`). They automatically handle newlines and reduce the need for concatenation and escape sequences. Indentation is managed by incidentally removing common leading whitespace based on the closing delimiter's position. Text blocks also simplify embedding JSON, SQL, HTML, or XML in code.

#### Code Example / Key Takeaways
```java
String json = """
    {
      "name": "Alice",
      "age": 30
    }
    """;
System.out.println(json);
```

---

### Q261. How does Java handle indentation and escaping in Text Blocks?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
For indentation, Java computes the minimum indentation of all non-blank content lines (relative to the closing `"""`) and strips that amount from every line—a process called incidental whitespace removal. You can shift the block by positioning the closing delimiter. Escape sequences like `\n` and `\"` still work but are usually unnecessary. The `\` at the end of a line suppresses the line terminator (for a single logical line), and `String.translateEscapes()` (Java 15) handles escapes. The result is a normal `String`.

#### Code Example / Key Takeaways
```java
String sql = """
    SELECT id, name \
    FROM users \
    WHERE active = true
    """;
// produced String has no newlines between clauses (line continuation via \)
```

---

### Q262. What is the `var` keyword (Java 10) and what are its limitations?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`var` is local-variable type inference: the compiler infers the type from the initializer, so you write `var list = new ArrayList<String>();` instead of spelling out the type. It is limited to local variables with initializers, indexes in enhanced `for` loops, and locals in `try-with-resources`. You cannot use `var` for fields, method parameters, return types, or without an initializer. The type is still static and strongly typed—`var` is not `dynamic` or a `Object` wildcard.

#### Code Example / Key Takeaways
```java
var name = "Alice";            // String
var numbers = List.of(1, 2, 3);// List<Integer>
for (var n : numbers) { }      // int
// var x; // error: needs initializer
```

---

### Q263. When should you avoid using `var`?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Avoid `var` when the inferred type is not obvious from the initializer, which hurts readability—e.g., `var result = someMethod();` where the method's return type is unclear. Also avoid it when the code relies on a specific type for overloading or when mixing numeric types where the literal type (`var x = 5L` vs `var x = 5`) matters. A good rule: use `var` when it makes code cleaner, keep explicit types when the type carries meaning or aids comprehension.

#### Code Example / Key Takeaways
```java
// Less clear
var data = fetch(); // what type? avoid
// Clearer
List<User> users = fetchUsers(); // explicit type helps here
```

---

### Q264. What are Sequenced Collections (Java 21) and which interfaces were added?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Sequenced Collections (Java 21) fill a gap where the collections framework lacked a universal type for collections with a defined encounter order. Three interfaces were added: `SequencedCollection` (extends `Collection`, has `reversed()`, `addFirst`, `addLast`, `getFirst`, `getLast`, `removeFirst`, `removeLast`), `SequencedSet` (extends `SequencedCollection` and `Set`), and `SequencedMap` (with `reversed()`, `firstEntry`, `lastEntry`, `putFirst`, `putLast`). `List`, `Deque`, `LinkedHashSet`, and `SortedMap` now implement these, providing uniform first/last and reverse-view access.

#### Code Example / Key Takeaways
```java
// Uniform first/last access across List and LinkedHashSet
SequencedCollection<String> list = new ArrayList<>(List.of("a", "b", "c"));
SequencedSet<String> set = new LinkedHashSet<>(List.of("a", "b", "c"));

list.getFirst();          // "a"
list.getLast();           // "c"
set.reversed();           // reverse view: [c, b, a]
```

---

### Q265. How does the `reversed()` view work in Sequenced Collections?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`reversed()` returns a reverse-ordered *view* of the collection, not a copy. Mutations to the original are reflected in the reversed view and vice versa. This is efficient and uniform across `List`, `SequencedSet`, and `SequencedMap`. It replaces ad-hoc reverse iteration and makes encounter-order operations consistent. Because it is a view, calling `reversed().reversed()` yields a view back to the original orientation.

#### Code Example / Key Takeaways
```java
SequencedCollection<String> seq = new ArrayList<>(List.of("a", "b", "c"));
SequencedCollection<String> rev = seq.reversed();
System.out.println(rev);      // [c, b, a]
rev.addFirst("z");            // affects the original list too
System.out.println(seq);      // [z, a, b, c]
```

---

### Q266. What are Virtual Threads (Java 21) and how do they differ from platform threads?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Virtual threads (Project Loom, finalized in Java 21) are lightweight, user-mode threads managed by the JVM rather than the operating system. They are cheap to create (millions can exist) and are scheduled on a small pool of carrier OS threads (platform threads) via the ForkJoinPool. When a virtual thread blocks on I/O, the JVM unmounts it from its carrier, allowing the carrier to run other virtual threads—so blocking is cheap. Platform threads remain for CPU-bound or native-code-heavy tasks. Virtual threads dramatically improve throughput for I/O-bound concurrent code.

#### Code Example / Key Takeaways
```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10_000; i++) {
        executor.submit(() -> {
            Thread.sleep(Duration.ofMillis(100)); // cheap blocking
            return "done";
        });
    }
} // all tasks complete; executor closed
```

---

### Q267. How do you create and run a Virtual Thread?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
You can create a virtual thread in three main ways: (1) `Thread.startVirtualThread(Runnable)`, (2) `Thread.ofVirtual().start(Runnable)`, or (3) via `Executors.newVirtualThreadPerTaskExecutor()` which creates a new virtual thread per submitted task. Virtual threads are daemon threads by default and cannot be pooled like platform threads—you create a fresh one per task. `Thread.isVirtual()` distinguishes them at runtime.

#### Code Example / Key Takeaways
```java
Thread vt = Thread.startVirtualThread(() -> System.out.println("running"));
Thread.ofVirtual().name("worker").start(() -> {});

try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    ex.submit(() -> "task");
}
```

---

### Q268. What are the best practices and pitfalls when using Virtual Threads?
**Difficulty:** `Advanced`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Best practices: use one virtual thread per task (do not pool them), avoid `synchronized` blocks on shared monitors inside hot paths (they pin the carrier thread—use `ReentrantLock` instead if long-held), and be cautious with thread-local usage (millions of virtual threads make thread-locals expensive). Don't use virtual threads for CPU-bound work where they offer no benefit. Avoid `Thread.sleep` in tight loops for signaling; prefer `LockSupport`. Virtual threads are not faster for computation, only for concurrency under blocking.

#### Code Example / Key Takeaways
```java
// Pinning problem: synchronized pins carrier thread
synchronized (lock) { doBlockingIo(); } // avoid in virtual threads

// Prefer ReentrantLock
lock.lock();
try { doBlockingIo(); } finally { lock.unlock(); }
```

---

### Q269. How do Virtual Threads relate to the existing `ExecutorService` API?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Virtual threads integrate cleanly with the existing concurrency API: `Executors.newVirtualThreadPerTaskExecutor()` returns an `ExecutorService` so existing code using `submit`/`invokeAll` works unchanged. The executor creates a new virtual thread per task rather than reusing pool threads. You should call `close()` (it is `AutoCloseable`) to wait for all tasks to finish. This backward compatibility lets you adopt virtual threads without rewriting concurrency logic.

#### Code Example / Key Takeaways
```java
try (ExecutorService es = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<String>> futures = IntStream.range(0, 100)
        .mapToObj(i -> es.submit(() -> "r" + i))
        .toList();
    for (Future<String> f : futures) System.out.println(f.get());
}
```

---

### Q270. What is the `Stream.toList()` method (Java 16) and how does it differ from `Collectors.toList()`?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Stream.toList()` (Java 16) is a convenience terminal operation that returns an immutable `List`. It is simpler than `Collectors.toList()`, which returns a mutable `List` (mutable per spec). Because `toList()` returns an unmodifiable list, attempting to add/remove throws `UnsupportedOperationException`. Use `toList()` when you want a result you won't mutate; use `Collectors.toList()` or `Collectors.toCollection(...)` when you need a mutable list.

#### Code Example / Key Takeaways
```java
List<Integer> imm = Stream.of(1, 2, 3).toList();   // unmodifiable
List<Integer> mut = Stream.of(1,2,3).collect(Collectors.toList()); // mutable
// imm.add(4); // throws UnsupportedOperationException
```

---

### Q271. What is the `Stream.takeWhile` and `dropWhile` (Java 9) operations?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`takeWhile(predicate)` returns the longest prefix of elements that satisfy the predicate, stopping at the first element that fails (best for ordered streams). `dropWhile(predicate)` drops the longest prefix that satisfies the predicate and returns the remainder. They are order-sensitive unlike `filter`, which evaluates every element. They are useful when processing streams where a condition holds for an initial segment.

#### Code Example / Key Takeaways
```java
List<Integer> nums = List.of(1, 2, 3, 4, 1);
System.out.println(nums.stream().takeWhile(n -> n < 3).toList()); // [1, 2]
System.out.println(nums.stream().dropWhile(n -> n < 3).toList()); // [3, 4, 1]
```

---

### Q272. What are the new `Optional` methods added in Java 9/10/11?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Several enhancements: `Optional.stream()` (Java 9) converts empty to an empty stream and present to a single-element stream, making it easy to flatMap optionals. `Optional.ifPresentOrElse(action, emptyAction)` (Java 9) runs one of two actions. `Optional.or(Supplier)` (Java 9) returns this optional or a fallback supplier. `Optional.orElseThrow()` with no args (Java 10) throws `NoSuchElementException` if empty. These reduce branching when working with optional values.

#### Code Example / Key Takeaways
```java
Optional<String> o = Optional.empty();
o.ifPresentOrElse(System.out::println, () -> System.out.println("none"));
Optional<String> fallback = o.or(() -> Optional.of("def"));
Stream<String> s = o.stream(); // empty stream
```

---

### Q273. How does `Collectors.toMap` handle duplicate keys and how can you control it?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
The two-arg `toMap(keyMapper, valueMapper)` throws `IllegalStateException` on duplicate keys. To control this, use the three-arg overload `toMap(keyMapper, valueMapper, mergeFunction)`, where the merge function decides how to combine values for the same key. A four-arg overload also accepts a `mapFactory` to choose the returned map type (e.g., `LinkedHashMap::new` for ordering). The merge function receives the existing and new value and returns the value to keep.

#### Code Example / Key Takeaways
```java
Map<String, Integer> byName = people.stream()
    .collect(Collectors.toMap(Person::name, Person::age, (a, b) -> a)); // keep first
Map<String, Integer> lhm = people.stream()
    .collect(Collectors.toMap(Person::name, Person::age, (a,b)->b, LinkedHashMap::new));
```

---

### Q274. What is the difference between `map` and `peek` in streams?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`peek(Consumer)` is an intermediate operation intended for observing elements as they flow through the pipeline (e.g., logging or debugging) without modifying them; it returns the same stream of unchanged elements. `map(Function)` is for transforming elements into new values and changing the stream type. Using `peek` to mutate state is discouraged; use `map` when you want to change data and `forEach` (terminal) when you only want a side effect at the end.

#### Code Example / Key Takeaways
```java
List<Integer> result = Stream.of(1, 2, 3)
    .peek(n -> System.out.println("before: " + n))
    .map(n -> n * 2)
    .peek(n -> System.out.println("after: " + n))
    .toList();
```

---

### Q275. How do you use `Comparator` with method references for sorting streams?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Comparator.comparing(keyExtractor)` builds a comparator from a function that extracts a comparable key, and you can pass a method reference as the extractor. Chain with `thenComparing` for secondary sort. `Comparator.reverseOrder()` and `reversed()` flip ordering. This is far cleaner than writing anonymous comparators and integrates directly with `Stream.sorted`.

#### Code Example / Key Takeaways
```java
List<Person> sorted = people.stream()
    .sorted(Comparator.comparing(Person::age).thenComparing(Person::name))
    .toList();
List<String> desc = words.stream()
    .sorted(Comparator.reverseOrder())
    .toList();
```

---

### Q276. What are some useful `Collectors` for numeric aggregation?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
For numeric aggregation: `summingInt/Long/Double`, `averagingInt/...`, `summarizingInt/...` (returns `IntSummaryStatistics` with count/sum/avg/min/max), `counting()`, and `reducing(...)`. These are useful as downstream collectors in `groupingBy`. For grouping with aggregation, combine them: `groupingBy(Person::city, summingInt(Person::age))`.

#### Code Example / Key Takeaways
```java
IntSummaryStatistics stats = people.stream()
    .collect(Collectors.summarizingInt(Person::age));
System.out.println(stats.getAverage() + " " + stats.getMax());
Map<String, Double> avgByCity = people.stream()
    .collect(Collectors.groupingBy(Person::city, Collectors.averagingInt(Person::age)));
```

---

### Q277. How does `Collectors.partitioningBy` differ from `groupingBy`?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`partitioningBy(Predicate)` is a specialized form of grouping that always produces a `Map<Boolean, List<T>>` with exactly two keys: `true` and `false`. It is slightly more efficient and clearer when you simply want to split elements into "matching" vs "non-matching". `groupingBy(classifier)` produces a `Map<K, List<T>>` keyed by arbitrary classifier results (any type), and works for more than two buckets. `partitioningBy` also accepts a downstream collector.

#### Code Example / Key Takeaways
```java
List<String> names = List.of("Alice", "Bob", "Ann", "Brian");

// partitioningBy: exactly two buckets
Map<Boolean, List<String>> p = names.stream()
    .collect(Collectors.partitioningBy(s -> s.startsWith("A")));
// {false=[Bob, Brian], true=[Alice, Ann]}

// groupingBy: arbitrary keys
Map<Character, List<String>> g = names.stream()
    .collect(Collectors.groupingBy(s -> s.charAt(0)));
// {A=[Alice, Ann], B=[Bob, Brian]}
```

---

### Q278. What is `flatMap` commonly used for with `Optional` and `Stream`?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Optional.flatMap(Function)` chains another `Optional` returning function: it returns the inner `Optional` rather than wrapping it, avoiding `Optional<Optional<T>>`. In streams, `flatMap` converts each element to a stream and concatenates them. Together, `Optional::stream` (Java 9) and `flatMap` let you flatten a `Stream<Optional<T>>` into a `Stream<T>`, filtering out empties: `streamOfOptionals.flatMap(Optional::stream)`.

#### Code Example / Key Takeaways
```java
List<Optional<String>> opts = List.of(Optional.of("a"), Optional.empty(), Optional.of("b"));
List<String> present = opts.stream()
    .flatMap(Optional::stream)
    .toList(); // ["a", "b"]
```

---

### Q279. How do you handle checked exceptions in lambda expressions?
**Difficulty:** `Advanced`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Lambdas can only throw checked exceptions if the target functional interface's method declares them. Since standard interfaces like `Runnable`, `Function`, `Consumer` do not declare checked exceptions, you cannot directly throw them. Workarounds: (1) Wrap the checked exception in an unchecked one (e.g., `throw new RuntimeException(e)`), (2) Use a wrapper method that catches and wraps, (3) Define your own functional interface that declares the checked exception, (4) Use try-catch inside the lambda body. There is no built-in mechanism in the standard functional interfaces to pass checked exceptions through.

#### Code Example / Key Takeaways
```java
Function<String, Integer> parse = s -> {
    try { return Integer.parseInt(s); }
    catch (NumberFormatException e) { throw new RuntimeException(e); }
};

// Or define your own
@FunctionalInterface interface CheckedFunction<T,R,E extends Exception> {
    R apply(T t) throws E;
}
```

---

### Q280. What is the difference between `Stream.of` and `Arrays.stream` for creating streams?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Stream.of(T...)` works for object arrays and varargs of objects. `Arrays.stream(array)` has overloads for primitive arrays (`int[]`, `long[]`, `double[]`) producing `IntStream`/`LongStream`/`DoubleStream`, and an `Object[]` overload that returns `Stream<T>`. For primitives, `Arrays.stream` is the direct way to get a primitive stream; `Stream.of(int[])` would treat the array as a single element. For object varargs, `Stream.of` is more convenient.

#### Code Example / Key Takeaways
```java
int[] arr = {1, 2, 3};
IntStream is = Arrays.stream(arr);   // correct for primitives
// Stream.of(arr) would be Stream<int[]>, not IntStream

String[] objs = {"a", "b"};
Stream<String> s1 = Stream.of(objs);
Stream<String> s2 = Arrays.stream(objs);
```

---

### Q281. What are Primitive Streams (`IntStream`, `LongStream`, `DoubleStream`) and why use them?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Primitive streams avoid boxing/unboxing overhead for `int`, `long`, `double` values. They provide specialized methods: `sum()`, `average()`, `min()`, `max()`, `range()`, `rangeClosed()`, and `toArray()`. Converting between object and primitive streams uses `mapToInt`, `boxed()`, etc. Primitive streams are significantly faster and use less memory for numeric-heavy workloads.

#### Code Example / Key Takeaways
```java
IntStream.rangeClosed(1, 100).sum();          // 5050
IntStream.of(1, 2, 3).average().orElse(0);    // 2.0
int[] squares = IntStream.range(0, 5).map(i -> i*i).toArray();
```

---

### Q282. How do you convert between object streams and primitive streams?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
To go from object to primitive: `mapToInt(ToIntFunction)`, `mapToLong`, `mapToDouble`. To go from primitive to object: `boxed()` (e.g., `IntStream.boxed()` returns `Stream<Integer>`). The `mapToObj` methods on primitive streams convert to object streams. These conversions are necessary when mixing numeric pipelines with generic collections.

#### Code Example / Key Takeaways
```java
List<Integer> nums = List.of(1, 2, 3);
int sum = nums.stream().mapToInt(Integer::intValue).sum(); // object -> primitive
Stream<Integer> back = IntStream.of(1,2,3).boxed();        // primitive -> object
```

---

### Q283. What is the `Collectors.joining` method and how is it used?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Collectors.joining()` concatenates the string representations of stream elements. The no-arg version joins with no delimiter. Overloads accept a delimiter, and a delimiter + prefix + suffix. It is the idiomatic replacement for `StringBuilder` loops and is more readable and parallel-friendly.

#### Code Example / Key Takeaways
```java
List<String> parts = List.of("a", "b", "c");
String csv = parts.stream().collect(Collectors.joining(", "));
String wrapped = parts.stream().collect(Collectors.joining(", ", "[", "]"));
System.out.println(csv);     // a, b, c
System.out.println(wrapped); // [a, b, c]
```

---

### Q284. What are the `minBy` and `maxBy` collectors and how are they used?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Collectors.minBy(Comparator)` and `Collectors.maxBy(Comparator)` are reduction collectors that return an `Optional` containing the minimum or maximum element according to the comparator. They are useful as downstream collectors in `groupingBy` to find the min/max per group. For the whole stream, `Stream.min/max` is simpler; `minBy/maxBy` shine when you need the extremum per group.

#### Code Example / Key Takeaways
```java
Map<String, Optional<Person>> oldestByCity = people.stream()
    .collect(Collectors.groupingBy(Person::city, Collectors.maxBy(Comparator.comparing(Person::age))));
```

---

### Q285. How does `Stream.distinct()` work and what determines equality?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`distinct()` returns a stream of unique elements by removing duplicates based on `equals()`. It is a stateful intermediate operation (it must remember seen elements). For ordered streams, the first occurrence is kept; for unordered streams (like those from `Set`), the choice is nondeterministic but duplicates are removed. For records, `equals` compares component values, making `distinct` effective for deduplication.

#### Code Example / Key Takeaways
```java
List<String> unique = Stream.of("a", "b", "a", "c").distinct().toList(); // [a, b, c]
```

---

### Q286. What is the difference between `sorted()` and `sorted(Comparator)`?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`sorted()` sorts elements using their natural order (requires elements to implement `Comparable`). `sorted(Comparator)` sorts using the provided comparator, which allows custom ordering or sorting types that don't implement `Comparable`. Both are stateful intermediate operations; `sorted()` on an unordered source may still produce a deterministic order.

#### Code Example / Key Takeaways
```java
List.of(3, 1, 2).stream().sorted().toList();                    // [1, 2, 3]
List.of("b", "a").stream().sorted(Comparator.reverseOrder()).toList(); // [b, a]
```

---

### Q287. What is the purpose of `Stream.iterate` and `Stream.generate`?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Stream.iterate(seed, unaryOperator)` produces an infinite sequential stream by repeatedly applying the function to the previous result (e.g., `iterate(0, n -> n + 2)` yields even numbers). `Stream.generate(supplier)` produces an infinite stream by repeatedly invoking a `Supplier` (e.g., `generate(Math::random)`). Both are unordered unless limited. Java 9 added `iterate(seed, predicate, unaryOperator)` which stops when the predicate fails, giving a finite stream.

#### Code Example / Key Takeaways
```java
Stream.iterate(0, n -> n + 2).limit(5).toList();      // [0, 2, 4, 6, 8]
Stream.iterate(0, n -> n < 10, n -> n + 2).toList();  // Java 9: [0, 2, 4, 6, 8]
Stream.generate(() -> (int)(Math.random()*10)).limit(5).toList(); // random
```

---

### Q288. How do you make a Stream parallel and when is it beneficial?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Call `parallelStream()` on a collection or `.parallel()` on an existing stream. Parallel streams use a common `ForkJoinPool` and split the work into chunks processed by multiple threads. They are beneficial for CPU-intensive operations on large datasets with minimal synchronization (e.g., numeric reductions, complex mappings). They add overhead, so they can be slower for small streams or I/O-bound work where virtual threads (Java 21) are better suited.

#### Code Example / Key Takeaways
```java
long sum = LongStream.rangeClosed(1, 10_000_000).parallel().sum(); // CPU-bound, large data
// For I/O-bound: use virtual threads instead of parallel streams
```

---

### Q289. What is the common `ForkJoinPool` used by parallel streams and how can you isolate workloads?
**Difficulty:** `Advanced`
**Category:** Modern Java Features (Java 8-21)

#### Answer
All parallel streams share the common `ForkJoinPool.commonPool()` (configured via system properties like `java.util.concurrent.ForkJoinPool.common.parallelism`). This means a long-running parallel stream can starve other parallel work. To isolate, submit the parallel stream task to a custom `ForkJoinPool`: `new ForkJoinPool(n).submit(() -> stream.parallel()...).join()`. This prevents thread starvation in mixed workloads.

#### Code Example / Key Takeaways
```java
ForkJoinPool pool = new ForkJoinPool(4);
pool.submit(() -> bigData.parallelStream().map(heavy).toList()).join();
```

---

### Q290. What is the `Record Patterns` feature in Java 21 and how does it work?
**Difficulty:** `Advanced`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Record patterns (Java 21) allow deconstructing a record directly in a pattern: `case Point(int x, int y) -> ...`. The components are bound to variables matching their types. You can also use nested record patterns: `case Pair(Point(int x, int y), String label) -> ...`. Record patterns compose with type patterns, `switch` expressions, and `instanceof`. They eliminate boilerplate accessor calls for destructuring.

#### Code Example / Key Takeaways
```java
record Point(int x, int y) {}
static String quadrant(Point p) {
    return switch (p) {
        case Point(var x, var y) when x > 0 && y > 0 -> "I";
        case Point(var x, var y) when x < 0 && y > 0 -> "II";
        // ...
    };
}
```

---

### Q291. What are `switch` expressions with `yield` and how do they differ from statements?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Switch expressions (Java 12/14) return a value and use `->` for single expressions or `{ ... yield value; }` for blocks. They must be exhaustive (cover all cases) and cannot fall through. A `yield` statement provides the value for a block case. This replaces the old switch statement with `break` and separate assignment. The expression form is preferred for assignments and ternary-like logic.

#### Code Example / Key Takeaways
```java
String result = switch (day) {
    case MONDAY, FRIDAY -> "busy";
    case SATURDAY, SUNDAY -> "weekend";
    default -> { yield "midweek"; } // block with yield
};
```

---

### Q292. What is the difference between `yield`, `return`, and `break` in modern switch?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
In a `switch` expression: `yield` returns a value from a block case and exits the switch expression (required for block cases). `break` with a value (`break value`) is not allowed in expressions; it was a preview syntax replaced by `yield`. `return` exits the *enclosing method*, not just the switch. In a traditional switch statement, `break` exits the switch; `yield` is not allowed there.

#### Code Example / Key Takeaways
```java
// Switch expression - must yield
int x = switch (v) { case 1 -> { yield 10; } default -> 0; };

// Switch statement - uses break
switch (v) { case 1: System.out.println("one"); break; }
```

---

### Q293. How do you use `Collectors.mapping` as a downstream collector?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Collectors.mapping(mapper, downstream)` transforms each element before passing it to the downstream collector. It is commonly used with `groupingBy` when you want to group by one property but collect a different property. It allows decoupling the key from the collected value. For example, `groupingBy(Person::city, mapping(Person::name, toList()))` gives `Map<String, List<String>>`.

#### Code Example / Key Takeaways
```java
Map<String, List<String>> namesByCity = people.stream()
    .collect(Collectors.groupingBy(Person::city, Collectors.mapping(Person::name, Collectors.toList())));
```

---

### Q294. What is the `Optional.or` method and how does it differ from `orElse`/`orElseGet`?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Optional.or(Supplier<Optional<T>>)` returns this Optional if present, otherwise returns the Optional produced by the supplier. Unlike `orElse`/`orElseGet` which unwrap and return the contained value `T`, `or` returns an `Optional<T>`, preserving the Optional container. This enables chaining multiple optional fallbacks: `opt1.or(() -> opt2).or(() -> opt3)`.

#### Code Example / Key Takeaways
```java
Optional<String> a = Optional.empty();
Optional<String> b = Optional.of("b");
Optional<String> c = a.or(() -> b); // Optional["b"]
```

---

### Q295. How do you use `Collectors.collectingAndThen` for post-processing?
**Difficulty:** `Advanced`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Collectors.collectingAndThen(downstream, finisher)` applies a finisher function to the result of the downstream collector. It is useful for transforming the collector's output, e.g., making an immutable copy: `collectingAndThen(toList(), Collections::unmodifiableList)`. It can also adapt to different return types or enforce invariants after collection. It runs after the downstream reduction completes.

#### Code Example / Key Takeaways
```java
List<String> unmod = stream.collect(Collectors.collectingAndThen(Collectors.toList(), Collections::unmodifiableList));
```

---

### Q296. What are the rules for `switch` exhaustiveness with sealed types?
**Difficulty:** `Advanced`
**Category:** Modern Java Features (Java 8-21)

#### Answer
A switch on a sealed type is exhaustive if every permitted subtype is covered by a case. If the switch is exhaustive, no `default` is required. If a new permitted subtype is added to the sealed hierarchy and the switch is not updated, it becomes a compile-time error—ensuring no case is missed. For non-sealed types, `default` is required unless all possible values are covered (e.g., `enum` switches are exhaustive by default).

#### Code Example / Key Takeaways
```java
sealed interface Shape permits Circle, Square {}
record Circle(int r) implements Shape {}
record Square(int s) implements Shape {}

double area(Shape sh) {
    return switch (sh) {
        case Circle c -> Math.PI * c.r() * c.r();
        case Square s -> s.s() * s.s();
        // no default needed; exhaustive
    };
}
```

---

### Q297. How does `Stream.concat` work and what are its constraints?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`Stream.concat(a, b)` creates a lazily concatenated stream whose elements are all elements of `a` followed by all elements of `b`. It is an ordered stream if both inputs are ordered. The resulting stream is a sequential stream even if inputs are parallel; you must call `.parallel()` again if needed. The spliterator is composed, so it may have poorer performance characteristics than a single source.

#### Code Example / Key Takeaways
```java
Stream<Integer> combined = Stream.concat(Stream.of(1, 2), Stream.of(3, 4));
combined.forEach(System.out::print); // 1 2 3 4
```

---

### Q298. What is the `java.time` API and how does it relate to functional programming?
**Difficulty:** `Basic`
**Category:** Modern Java Features (Java 8-21)

#### Answer
The `java.time` API (Java 8) is a modern, immutable, thread-safe date/time API. While not part of the Stream/Functional interfaces, it integrates well: `LocalDate`, `LocalDateTime`, `Instant`, `Duration`, `Period` are all immutable value types. They work naturally with lambdas (e.g., `Stream.iterate(LocalDate.now(), d -> d.plusDays(1))`) and streams. It replaces the flawed `java.util.Date`/`Calendar`.

#### Code Example / Key Takeaways
```java
LocalDate start = LocalDate.of(2024, 1, 1);
Stream.iterate(start, d -> d.plusWeeks(1))
      .limit(4)
      .forEach(System.out::println);
```

---

### Q299. What are some common stream anti-patterns to avoid?
**Difficulty:** `Advanced`
**Category:** Modern Java Features (Java 8-21)

#### Answer
Common anti-patterns: (1) Using streams for simple loops where `for` is clearer; (2) Modifying external state inside `peek`/`forEach` (side effects break parallelism); (3) Using `parallelStream()` without measuring—overhead can outweigh benefit; (4) Calling `stream()` on a collection while mutating it (concurrent modification); (5) Using `findFirst` on unordered parallel streams (nondeterministic); (6) Collecting to a list then mutating it—use `toList()` or a concurrent collector; (7) Ignoring that streams are consume-once.

#### Code Example / Key Takeaways
```java
// Bad: side effect in peek
List<String> bad = new ArrayList<>();
Stream.of("a", "b").peek(bad::add).count();

// Good: collect directly
List<String> good = Stream.of("a", "b").toList();
```

---

### Q300. What is the `SequencedMap` interface and its new methods in Java 21?
**Difficulty:** `Intermediate`
**Category:** Modern Java Features (Java 8-21)

#### Answer
`SequencedMap` (Java 21) extends `Map` and adds encounter-order semantics plus first/last access. New methods: `sequencedKeySet()` (returns `SequencedSet<K>`), `sequencedValues()` (returns `SequencedCollection<V>`), `sequencedEntrySet()` (returns `SequencedSet<Entry<K,V>>`), `firstEntry()`, `lastEntry()`, `pollFirstEntry()`, `pollLastEntry()`, `putFirst(K, V)`, `putLast(K, V)`, and `reversed()` (returns a reversed view). Implementations include `LinkedHashMap`, `TreeMap`, `IdentityHashMap`. It enables uniform first/last access regardless of underlying implementation.

#### Code Example / Key Takeaways
```java
SequencedMap<String, Integer> map = new LinkedHashMap<>();
map.put("a", 1); map.put("b", 2);
map.putFirst("z", 0);          // z, a, b
Map.Entry<String, Integer> first = map.firstEntry(); // z=0
SequencedMap<String, Integer> rev = map.reversed();  // b, a, z
```




