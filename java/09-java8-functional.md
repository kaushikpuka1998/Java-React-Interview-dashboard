# Java 8 Functional Programming Interview Questions (Q1 – Q74)

---

### Q1. What are the major features introduced in Java 8?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
Lambda expressions, functional interfaces, the Stream API, method references, default and static methods in interfaces, the `Optional` class, a new Date/Time API (`java.time`), and `CompletableFuture`. Together they brought functional-style programming to Java.

#### Code Example
```java
List.of(1, 2, 3).stream().map(n -> n * 2).forEach(System.out::println);
```
---

### Q2. Why was Java 8 considered a major Java release?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
It introduced a functional programming paradigm alongside OOP, enabling concise, declarative code with lambdas and streams. It also modernized long-standing pain points (dates, nulls, parallelism), making it the most impactful release since generics.
---

### Q3. What is a functional interface?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
An interface with exactly one abstract method (SAM — Single Abstract Method). It can be the target type of a lambda expression or method reference. It may also have default/static methods.

#### Code Example
```java
@FunctionalInterface
interface Calculator { int apply(int a, int b); }
Calculator add = (a, b) -> a + b;
```
---

### Q4. What is the `@FunctionalInterface` annotation?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
A marker annotation that tells the compiler to enforce the single-abstract-method rule. It's optional but recommended: if someone adds a second abstract method, compilation fails.

#### Code Example
```java
@FunctionalInterface
interface Greeting { void say(String name); }
```
---

### Q5. Can a functional interface have multiple default methods?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
Yes. A functional interface can have any number of default methods; only the count of abstract methods is restricted to one.

#### Code Example
```java
@FunctionalInterface
interface Fn { int apply(int x); default int twice(int x){ return apply(apply(x)); } default int id(int x){ return x; } }
```
---

### Q6. Can a functional interface have static methods?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
Yes. Static methods don't count as abstract methods, so a functional interface can declare any number of them (e.g. factory helpers like `Function.identity()`).

#### Code Example
```java
@FunctionalInterface
interface Fn { int apply(int x); static Fn identity(){ return x -> x; } }
```
---

### Q7. Can a functional interface extend another interface?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
Yes, as long as the combined set still has exactly one abstract method. If the parent already declares the single abstract method and the child adds none, it remains functional.

#### Code Example
```java
interface A { int run(); }
@FunctionalInterface
interface B extends A {} // still one abstract method
```
---

### Q8. What is a lambda expression?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
A lambda is an anonymous function — a concise way to implement a functional interface's single method inline, without a named class. It captures behavior as data you can pass around.

#### Code Example
```java
Runnable r = () -> System.out.println("running");
```
---

### Q9. Why were lambda expressions introduced?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
To reduce boilerplate of anonymous inner classes, enable passing behavior as arguments (higher-order functions), and support the Stream API's declarative, functional style. They make code shorter and more readable.
---

### Q10. What is the syntax of a lambda expression?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
`(parameters) -> expression` or `(parameters) -> { statements; }`. Parameter types are usually inferred; single parameters need no parentheses; a single expression needs no braces or `return`.

#### Code Example
```java
x -> x * x                     // one param, expression
(a, b) -> a + b                // two params
() -> System.out.println("hi") // no params
(int x) -> { return x + 1; }   // explicit type + block
```
---

### Q11. What is a method reference?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
A shorthand for a lambda that just calls an existing method. `System.out::println` is equivalent to `x -> System.out.println(x)`. It uses the `::` operator.

#### Code Example
```java
List.of("a", "b").forEach(System.out::println);
```
---

### Q12. What are the different types of method references?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
Four kinds: static (`ClassName::staticMethod`), bound instance (`object::method`), unbound instance (`ClassName::instanceMethod`), and constructor (`ClassName::new`).

#### Code Example
```java
Integer::parseInt        // static
System.out::println      // bound instance
String::toUpperCase      // unbound instance
ArrayList::new           // constructor
```
---

### Q13. Lambda vs anonymous inner class?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
A lambda is more concise, has no separate `.class` file, and `this` refers to the enclosing instance. An anonymous class creates its own scope, can implement multiple methods/have state, and its `this` refers to the anonymous instance.

#### Code Example
```java
Runnable a = () -> System.out.println(this);       // enclosing 'this'
Runnable b = new Runnable(){ public void run(){ System.out.println(this); } }; // its own 'this'
```
---

### Q14. What is a closure in Java?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
A closure is a function that captures variables from its enclosing scope. Java lambdas are closures: they can reference effectively-final local variables, "closing over" their values.

#### Code Example
```java
int factor = 3;
Function<Integer,Integer> multiply = n -> n * factor; // captures 'factor'
```
---

### Q15. What is effectively final?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
A local variable that is never reassigned after initialization, even without the `final` keyword. Lambdas and anonymous classes may only capture effectively-final locals.

#### Code Example
```java
int x = 10;            // never reassigned -> effectively final
Runnable r = () -> System.out.println(x);
```
---

### Q16. Why can a lambda access only final/effectively-final local variables?
**Difficulty:** `Advanced`
**Category:** Java 8 Functional Programming

#### Answer
Captured locals are copied into the lambda; the local variable lives on the stack and may be gone when the lambda runs later. Requiring immutability avoids the ambiguity of which value/copy is "current" and prevents subtle concurrency bugs.
---

### Q17. What is a target type?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
The expected functional-interface type of a lambda in a given context (assignment, method argument, return). The compiler infers the lambda's type from this target, since a lambda has no type on its own.

#### Code Example
```java
Runnable r = () -> {};          // target type: Runnable
Callable<String> c = () -> "x"; // same-shaped lambda, different target
```
---

### Q18. Can a lambda exist without a functional interface?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
No. A lambda has no intrinsic type; it must be assigned to (or inferred as) a functional interface. Without a target functional type, it won't compile.
---

### Q19. What is a default method?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
A method in an interface with a body, declared with the `default` keyword. Implementing classes inherit it without overriding, enabling interfaces to gain behavior.

#### Code Example
```java
interface Vehicle { default void start(){ System.out.println("starting"); } }
```
---

### Q20. Why were default methods introduced?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
To allow evolving interfaces without breaking existing implementations. Adding `default` methods (e.g. `List.forEach`, `Collection.stream`) let the JDK enhance interfaces while keeping backward compatibility.
---

### Q21. What is a static method inside an interface?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
A method with a body belonging to the interface itself (not instances), called via the interface name. Useful for utility/factory methods related to the interface.

#### Code Example
```java
interface Util { static int square(int x){ return x * x; } }
int r = Util.square(5);
```
---

### Q22. Can an interface have both default and static methods?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
Yes. An interface can mix abstract, default, and static methods. `Function`, for example, has an abstract `apply`, default `andThen`/`compose`, and static `identity`.
---

### Q23. Can a default method be overridden?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
Yes. An implementing class or sub-interface can override a default method to provide its own behavior; the override wins over the inherited default.

#### Code Example
```java
class Car implements Vehicle { public void start(){ System.out.println("car starts"); } }
```
---

### Q24. Can a static interface method be overridden?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
No. Static methods are not inherited or polymorphic; they belong to the interface. A class can declare its own static method with the same name, but that's hiding, not overriding.
---

### Q25. What happens when two interfaces contain the same default method?
**Difficulty:** `Advanced`
**Category:** Java 8 Functional Programming

#### Answer
The "diamond problem": the class won't compile until it overrides the method. It can delegate to a specific one via `InterfaceName.super.method()`.

#### Code Example
```java
class C implements A, B {
    public void hello(){ A.super.hello(); } // resolve ambiguity explicitly
}
```
---

### Q26. What is `Predicate<T>`?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
A functional interface representing a boolean-valued condition: `boolean test(T t)`. Widely used in `filter`.

#### Code Example
```java
Predicate<Integer> isEven = n -> n % 2 == 0;
System.out.println(isEven.test(4)); // true
```
---

### Q27. What is `Function<T,R>`?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
Represents a transformation from an input of type T to a result of type R: `R apply(T t)`. Used in `map`.

#### Code Example
```java
Function<String,Integer> length = String::length;
System.out.println(length.apply("java")); // 4
```
---

### Q28. What is `Consumer<T>`?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
Represents an operation that accepts one input and returns nothing (side effect only): `void accept(T t)`. Used in `forEach`.

#### Code Example
```java
Consumer<String> print = System.out::println;
print.accept("hi");
```
---

### Q29. What is `Supplier<T>`?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
Represents a source of values, taking no input and returning a result: `T get()`. Used for lazy generation/defaults.

#### Code Example
```java
Supplier<Double> random = Math::random;
System.out.println(random.get());
```
---

### Q30. Difference between Predicate and Function?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
`Predicate<T>` always returns a `boolean` (`test`), used for conditions. `Function<T,R>` returns any type R (`apply`), used for transformations. A Predicate is essentially a `Function<T, Boolean>` specialized for filtering.
---

### Q31. Difference between Consumer and Supplier?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
`Consumer<T>` takes input and returns nothing (consumes/uses a value). `Supplier<T>` takes nothing and produces a value. They are opposites: one is a sink, the other a source.
---

### Q32. What is `UnaryOperator<T>`?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
A specialization of `Function<T,T>` where input and output are the same type. Used in operations like `List.replaceAll`.

#### Code Example
```java
UnaryOperator<String> upper = String::toUpperCase;
System.out.println(upper.apply("java")); // JAVA
```
---

### Q33. What is `BinaryOperator<T>`?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
A specialization of `BiFunction<T,T,T>` where both inputs and the result share one type. Used in `reduce`.

#### Code Example
```java
BinaryOperator<Integer> sum = Integer::sum;
System.out.println(sum.apply(3, 4)); // 7
```
---

### Q34. What is `BiFunction<T,U,R>`?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
Represents a function taking two inputs (types T and U) and producing a result R: `R apply(T t, U u)`.

#### Code Example
```java
BiFunction<Integer,Integer,String> combine = (a, b) -> (a + b) + "";
System.out.println(combine.apply(2, 3)); // "5"
```
---

### Q35. What is `BiPredicate<T,U>`?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
A predicate of two arguments: `boolean test(T t, U u)`. Useful for conditions involving two values.

#### Code Example
```java
BiPredicate<String,Integer> longerThan = (s, n) -> s.length() > n;
System.out.println(longerThan.test("java", 2)); // true
```
---

### Q36. What is `BiConsumer<T,U>`?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
Accepts two inputs and returns nothing: `void accept(T t, U u)`. Used by `Map.forEach` to consume key-value pairs.

#### Code Example
```java
BiConsumer<String,Integer> print = (k, v) -> System.out.println(k + "=" + v);
Map.of("a", 1).forEach(print);
```
---

### Q37. Difference between `Function` and `UnaryOperator`?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
`Function<T,R>` maps T to a possibly different type R. `UnaryOperator<T>` extends `Function<T,T>`, constraining input and output to the same type — a convenience for same-type transformations.
---

### Q38. Difference between `BiFunction` and `BinaryOperator`?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
`BiFunction<T,U,R>` takes two inputs of any types and returns any type. `BinaryOperator<T>` extends `BiFunction<T,T,T>` — both inputs and the output are the same type, used for combining like values (e.g. reduce).
---

### Q39. How does `Predicate.and()` work?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
`and` returns a composed predicate that is true only if both predicates are true, short-circuiting (the second isn't evaluated if the first is false).

#### Code Example
```java
Predicate<Integer> positive = n -> n > 0;
Predicate<Integer> even = n -> n % 2 == 0;
System.out.println(positive.and(even).test(4)); // true
```
---

### Q40. How does `Predicate.or()` work?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
`or` returns a composed predicate that is true if either predicate is true, short-circuiting when the first is true.

#### Code Example
```java
Predicate<Integer> neg = n -> n < 0;
Predicate<Integer> big = n -> n > 100;
System.out.println(neg.or(big).test(150)); // true
```
---

### Q41. How does `Predicate.negate()` work?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
`negate` returns a predicate representing the logical inverse of the original.

#### Code Example
```java
Predicate<Integer> even = n -> n % 2 == 0;
System.out.println(even.negate().test(3)); // true (3 is odd)
```
---

### Q42. What are primitive functional interfaces?
**Difficulty:** `Advanced`
**Category:** Java 8 Functional Programming

#### Answer
Specialized functional interfaces for primitive types (`IntPredicate`, `IntFunction`, `IntUnaryOperator`, `ToIntFunction`, `IntConsumer`, `IntSupplier`, etc.) that avoid autoboxing overhead by working directly with `int`/`long`/`double`.

#### Code Example
```java
IntPredicate isPositive = n -> n > 0; // no Integer boxing
```
---

### Q43. Why do `IntPredicate`, `IntFunction`, `IntConsumer`, etc. exist?
**Difficulty:** `Advanced`
**Category:** Java 8 Functional Programming

#### Answer
To eliminate the performance cost of autoboxing/unboxing between primitives and wrapper objects in hot code paths (like large streams), reducing memory churn and improving speed.
---

### Q44. How do you create your own functional interface?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
Declare an interface with a single abstract method and (optionally) annotate it `@FunctionalInterface`. Then it can be targeted by lambdas.

#### Code Example
```java
@FunctionalInterface
interface TriFunction<A,B,C,R> { R apply(A a, B b, C c); }
TriFunction<Integer,Integer,Integer,Integer> sum3 = (a, b, c) -> a + b + c;
```
---

### Q45. Can a functional interface have methods inherited from Object?
**Difficulty:** `Advanced`
**Category:** Java 8 Functional Programming

#### Answer
Yes. Abstract declarations that override `Object`'s public methods (`equals`, `hashCode`, `toString`) don't count toward the single-abstract-method rule, so the interface stays functional.

#### Code Example
```java
@FunctionalInterface
interface Fn { int apply(int x); boolean equals(Object o); } // still functional
```
---

### Q46. Why is `Comparator` considered a functional interface?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
It has a single abstract method `int compare(T a, T b)` (its other methods are default/static), so it can be implemented with a lambda.

#### Code Example
```java
Comparator<String> byLen = (a, b) -> a.length() - b.length();
```
---

### Q47. Why is `Runnable` a functional interface?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
It declares one abstract method `void run()` and no others, making it a valid target for a lambda or method reference.

#### Code Example
```java
Runnable r = () -> System.out.println("task");
new Thread(r).start();
```
---

### Q48. Write a lambda to sort employees by salary.
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
Pass a `Comparator` lambda (or `Comparator.comparing`) to `sort`. Prefer `comparingDouble` for numeric fields to avoid boxing.

#### Code Example
```java
employees.sort(Comparator.comparingDouble(Employee::getSalary));
// or: employees.sort((a, b) -> Double.compare(a.getSalary(), b.getSalary()));
```
---

### Q49. Write a lambda to filter employees by age.
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
Use a `Predicate` lambda in `stream().filter(...)`.

#### Code Example
```java
List<Employee> adults = employees.stream()
        .filter(e -> e.getAge() >= 18)
        .collect(Collectors.toList());
```
---

### Q50. Write a lambda to calculate the square of a number.
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
A `Function<Integer,Integer>` (or `IntUnaryOperator`) that returns `n * n`.

#### Code Example
```java
Function<Integer,Integer> square = n -> n * n;
System.out.println(square.apply(5)); // 25
```
---

### Q51. Write a lambda to check whether a number is even.
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
A `Predicate<Integer>` returning `n % 2 == 0`.

#### Code Example
```java
Predicate<Integer> isEven = n -> n % 2 == 0;
System.out.println(isEven.test(6)); // true
```
---

### Q52. Write a lambda to find the maximum of two numbers.
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
A `BinaryOperator<Integer>` using `Math.max`.

#### Code Example
```java
BinaryOperator<Integer> max = Math::max;
System.out.println(max.apply(3, 9)); // 9
```
---

### Q53. Write a lambda that accepts two Strings and concatenates them.
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
A `BinaryOperator<String>` or `BiFunction<String,String,String>` that joins the two inputs.

#### Code Example
```java
BinaryOperator<String> concat = (a, b) -> a + b;
System.out.println(concat.apply("Java", "8")); // Java8
```
---

### Q54. Can lambda parameters have explicit types?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
Yes. You may declare types explicitly `(int x, int y) -> x + y`, or use `var` (Java 11+). But you must be consistent — either all parameters are typed or all rely on inference.

#### Code Example
```java
BinaryOperator<Integer> add = (Integer a, Integer b) -> a + b;
```
---

### Q55. Can lambda have multiple statements?
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
Yes, using a block body with braces and an explicit `return` (if it returns a value).

#### Code Example
```java
Function<Integer,Integer> f = n -> { int r = n * 2; return r + 1; };
```
---

### Q56. Can lambda throw checked exceptions?
**Difficulty:** `Advanced`
**Category:** Java 8 Functional Programming

#### Answer
Only if the target functional interface's method declares that checked exception. Standard interfaces like `Function` don't declare any, so lambdas targeting them can't throw checked exceptions directly.

#### Code Example
```java
Callable<String> c = () -> readFile(); // Callable declares 'throws Exception' -> OK
```
---

### Q57. How do you handle checked exceptions inside lambda?
**Difficulty:** `Advanced`
**Category:** Java 8 Functional Programming

#### Answer
Wrap the checked exception in an unchecked one inside a try/catch, or use a custom "throwing" functional interface that declares the exception, or a utility wrapper.

#### Code Example
```java
Function<String,String> read = path -> {
    try { return Files.readString(Path.of(path)); }
    catch (IOException e) { throw new UncheckedIOException(e); }
};
```
---

### Q58. What happens when a lambda captures a local variable?
**Difficulty:** `Advanced`
**Category:** Java 8 Functional Programming

#### Answer
The variable's value is copied into the lambda at capture time, and it must be effectively final. The lambda uses that captured snapshot even after the enclosing method returns.

#### Code Example
```java
int base = 10;
Supplier<Integer> s = () -> base; // captures value 10
```
---

### Q59. Can a lambda modify an instance variable?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
Yes. Instance (and static) fields are not subject to the effectively-final rule; a lambda can read and mutate them through the enclosing object.

#### Code Example
```java
class Counter { int count; Runnable inc = () -> count++; }
```
---

### Q60. Can a lambda modify a static variable?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
Yes. Static fields belong to the class, not the stack, so lambdas may read and modify them freely (mind thread-safety).

#### Code Example
```java
class C { static int total; Runnable add = () -> total += 5; }
```
---

### Q61. Can a lambda modify a local variable?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
No. Captured local variables must be effectively final, so a lambda can read but not reassign them. A common workaround is a single-element array or an `AtomicInteger`.

#### Code Example
```java
AtomicInteger sum = new AtomicInteger();
List.of(1, 2, 3).forEach(n -> sum.addAndGet(n)); // mutate via holder
```
---

### Q62. Lambda variable scope vs anonymous class variable scope?
**Difficulty:** `Advanced`
**Category:** Java 8 Functional Programming

#### Answer
A lambda shares the enclosing method's scope — its variables live in the same scope, so you can't redeclare an enclosing variable name. An anonymous class introduces a new scope and can shadow enclosing names.

#### Code Example
```java
int x = 1;
Runnable r = () -> { /* int x = 2; would be a compile error (same scope) */ };
```
---

### Q63. What does `this` refer to inside a lambda?
**Difficulty:** `Advanced`
**Category:** Java 8 Functional Programming

#### Answer
`this` refers to the enclosing instance (the class where the lambda is defined), because a lambda does not create a new scope.

#### Code Example
```java
class Outer { Runnable r = () -> System.out.println(this.getClass()); } // Outer
```
---

### Q64. What does `this` refer to inside an anonymous inner class?
**Difficulty:** `Advanced`
**Category:** Java 8 Functional Programming

#### Answer
`this` refers to the anonymous class instance itself, not the enclosing object. To reach the outer instance you use `Outer.this`.

#### Code Example
```java
Runnable r = new Runnable(){ public void run(){ System.out.println(this.getClass()); } }; // the anonymous class
```
---

### Q65. What is a method reference? (recap)
**Difficulty:** `Basic`
**Category:** Java 8 Functional Programming

#### Answer
A compact, readable alternative to a lambda that simply invokes an existing method or constructor, written with `::`. The compiler matches the referenced method's signature to the target functional interface.

#### Code Example
```java
Function<String,Integer> len = String::length; // instead of s -> s.length()
```
---

### Q66. Explain `ClassName::staticMethod`.
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
A reference to a static method. The functional interface's arguments become the static method's arguments.

#### Code Example
```java
Function<String,Integer> parse = Integer::parseInt; // s -> Integer.parseInt(s)
```
---

### Q67. Explain `object::instanceMethod`.
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
A bound instance reference: the method is called on a specific, already-known object. The lambda's arguments are passed to that method.

#### Code Example
```java
Consumer<String> printer = System.out::println; // s -> System.out.println(s)
```
---

### Q68. Explain `ClassName::instanceMethod`.
**Difficulty:** `Advanced`
**Category:** Java 8 Functional Programming

#### Answer
An unbound instance reference: the first argument becomes the receiver on which the method is invoked, and remaining arguments are passed along.

#### Code Example
```java
Function<String,String> up = String::toUpperCase; // s -> s.toUpperCase()
Comparator<String> c = String::compareTo;         // (a, b) -> a.compareTo(b)
```
---

### Q69. Explain `ClassName::new`.
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
A constructor reference: the target interface's method arguments are forwarded to a matching constructor, producing a new instance.

#### Code Example
```java
Supplier<List<String>> list = ArrayList::new;   // () -> new ArrayList<>()
Function<Integer,int[]> arr = int[]::new;         // n -> new int[n]
```
---

### Q70. Convert a lambda into a method reference.
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
When a lambda merely forwards its parameters to a single method call, replace it with a method reference for clarity.

#### Code Example
```java
// lambda
Function<String,Integer> a = s -> Integer.parseInt(s);
// method reference
Function<String,Integer> b = Integer::parseInt;
```
---

### Q71. When should you prefer method references?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
Prefer them when a lambda does nothing but call an existing method with the same arguments — they're shorter and more expressive. Keep a lambda when you transform arguments or add logic.

#### Code Example
```java
names.forEach(System.out::println);          // prefer reference
names.forEach(n -> System.out.println("* " + n)); // lambda needed (extra logic)
```
---

### Q72. Can constructors be referenced?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
Yes, via `ClassName::new`. The compiler selects the constructor whose signature matches the functional interface's method.

#### Code Example
```java
Function<String,StringBuilder> sb = StringBuilder::new; // s -> new StringBuilder(s)
```
---

### Q73. What is a constructor reference?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
A method reference of the form `Type::new` that refers to a constructor, letting a factory-style functional interface (`Supplier`, `Function`) create objects without an explicit lambda.

#### Code Example
```java
Supplier<Employee> factory = Employee::new;
Employee e = factory.get();
```
---

### Q74. Difference between a lambda expression and a method reference?
**Difficulty:** `Intermediate`
**Category:** Java 8 Functional Programming

#### Answer
Both implement a functional interface. A lambda defines an inline body (and can transform arguments or add logic); a method reference is a shorthand that delegates directly to an existing method/constructor with matching arguments. Every method reference can be written as a lambda, but not every lambda simplifies to a method reference.

#### Code Example
```java
Function<String,Integer> lambda = s -> s.length(); // inline body
Function<String,Integer> ref    = String::length;   // delegates to existing method
```
---
