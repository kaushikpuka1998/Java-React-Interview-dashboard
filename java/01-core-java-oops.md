# Core Java & OOP Interview Questions (Q1 – Q75)


### Q1. What are the four fundamental OOP principles?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
The four fundamental Object-Oriented Programming principles are:
1. **Encapsulation** - Bundling data and methods within a class and restricting direct access via access modifiers.
2. **Abstraction** - Hiding complex implementation details and showing only essential features.
3. **Inheritance** - A subclass acquires properties/behaviors from a superclass.
4. **Polymorphism** - One interface, many implementations (overloading at compile-time, overriding at runtime).

#### Code Example
```java
public class BankAccount {
    private double balance; // encapsulated
    public void deposit(double amount) { if (amount > 0) balance += amount; }
    public double getBalance() { return balance; }
}

// Abstraction
abstract class Animal { abstract void sound(); }

// Inheritance + Polymorphism
class Dog extends Animal {
    @Override void sound() { System.out.println("Dog barks"); } // polymorphism
}
```

### Q2. Abstract class vs interface in Java?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
Both abstract classes and interfaces are used to achieve abstraction in Java, but they differ in design purpose, implementation capability, and usage.

## Abstract Class

An abstract class is a class that can have both abstract methods (without implementation) and concrete methods (with implementation). It is used when classes share a common relationship and some common behavior.

```java
abstract class Vehicle {
    String brand;

    Vehicle(String brand) {
        this.brand = brand;
    }

    abstract void start();

    void stop() {
        System.out.println("Vehicle stopped");
    }
}

class Car extends Vehicle {
    Car(String brand) {
        super(brand);
    }

    @Override
    void start() {
        System.out.println("Car starts with key");
    }
}
```

Here:
- `Vehicle` provides common behavior (`stop()`)
- Child classes must implement `start()`
- Constructor initializes common data

## Interface

An interface defines a contract that classes must follow. It is mainly used to achieve 100% abstraction and support multiple inheritance of type.

```java
interface Payment {
    void pay();

    default void refund() {
        System.out.println("Refund processed");
    }
}

class CreditCardPayment implements Payment {
    public void pay() {
        System.out.println("Paid using credit card");
    }
}
```

Here:
- Interface defines a contract
- Different classes can provide different implementations

## Key Differences

| Feature | Abstract Class | Interface |
|---------|---------------|-----------|
| Keyword | `abstract class` | `interface` |
| Methods | Abstract + concrete | Abstract, default, static |
| Variables | Instance variables | `public static final` only |
| Constructor | Yes | No |
| Access Modifiers | Any | `public` (except private methods) |
| Multiple Inheritance | Single | Multiple |
| State | Can maintain state | Cannot maintain state |

## When to Use Abstract Class?

Use an abstract class when:
- Classes have a strong **IS-A** relationship
- You want to share common code
- You need common fields/state

**Example:**
```
Animal
├── Dog
└── Cat
```
All animals have: name, age, eat() → `abstract class Animal` makes sense.

## When to Use Interface?

Use an interface when you want to define a **capability**.

**Example:**
```
Flyable
├── Bird
└── Airplane
```
Both can fly, but they are unrelated objects.

```java
interface Flyable {
    void fly();
}
```

## Java 8+ Interface Features

**Before Java 8:** Only abstract methods were allowed.

**After Java 8:**
- **Default Method** – Provide implementation in interface
- **Static Method** – Utility methods on interface

```java
interface A {
    default void display() {
        System.out.println("Default implementation");
    }
    static void show() {
        System.out.println("Static method");
    }
}
```

## Real-World Example (Spring Boot)

**Interface** – Multiple implementations of same contract:
```java
public interface NotificationService {
    void sendNotification(String message);
}
// Implementations: EmailNotificationService, SMSNotificationService, PushNotificationService
```

**Abstract Class** – Shared base logic for related classes:
```java
abstract class BaseController {
    protected void validateRequest() {
        System.out.println("Validation done");
    }
    abstract void process();
}
```

## Short Interview Answer

> "An abstract class is used when we have a common base class where we want to share state and implementation among related classes. An interface defines a contract that multiple unrelated classes can implement. Abstract classes support constructors and instance variables; interfaces support multiple inheritance. Since Java 8, interfaces can also have default and static methods."

### Q3. What is the String pool in Java?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
The String pool is a special heap memory region storing unique string literals. When you create a literal, the JVM reuses an existing identical string if present, saving memory. `new String()` always creates a new object; `intern()` adds it to the pool.

#### Code Example
```java
String a = "hello";
String b = "hello";
String c = new String("hello");
System.out.println(a == b); // true (same pool object)
System.out.println(a == c); // false (different objects)
```

### Q4. Explain method overloading vs overriding.
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
**Overloading** is compile-time polymorphism: multiple methods with same name but different parameter lists within the same class. **Overriding** is runtime polymorphism: a subclass redefines a superclass method with identical signature.

#### Code Example
```java
class Calc {
    int add(int a, int b) { return a + b; }       // overload
    int add(int a, int b, int c) { return a + b + c; } // overload
}
class Animal { void sound() { System.out.println("..."); } }
class Cat extends Animal { @Override void sound() { System.out.println("Meow"); } } // override
```

### Q5. What is the difference between `==` and `.equals()`?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
`==` compares object references (memory addresses). `.equals()` compares logical equality (content), which can be overridden. For Strings, always use `.equals()` to compare values.

#### Code Example
```java
String s1 = new String("x");
String s2 = new String("x");
System.out.println(s1 == s2);      // false
System.out.println(s1.equals(s2)); // true
```

### Q6. How does Java achieve platform independence?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
Java source code compiles to bytecode (.class), which runs on the JVM. The JVM is platform-specific but interprets the same bytecode everywhere, so "write once, run anywhere."

#### Code Example
```
.java (source) -> javac -> .class (bytecode) -> JVM -> native machine code
```

### Q7. What are access modifiers and their scopes?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
- `private`: accessible only within the same class
- `default` (no modifier): accessible within the same package
- `protected`: same package + subclasses
- `public`: accessible everywhere

#### Code Example
```java
public class A {
    private int x;
    protected int y;
    public int z;
    int w; // default
}
```

### Q8. Explain constructor chaining.
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
Constructor chaining is the process of calling one constructor from another constructor within the same class or from a parent class. It is used to reuse constructor logic and initialize objects properly.

Constructor chaining is achieved using:
- `this()` → calls another constructor of the same class
- `super()` → calls a constructor of the parent class

## 1. Constructor Chaining Using `this()`

```java
class Employee {
    String name;
    int age;

    Employee() {
        this("Unknown", 0);
        System.out.println("Default constructor");
    }

    Employee(String name, int age) {
        this.name = name;
        this.age = age;
        System.out.println("Parameterized constructor");
    }
}

public class Main {
    public static void main(String[] args) {
        Employee e = new Employee();
    }
}
```

**Output:**
```
Parameterized constructor
Default constructor
```

**Flow:**
```
new Employee()
        |
        v
Employee()
        |
        | this("Unknown",0)
        v
Employee(String,int)
        |
        v
Object initialized
```

## 2. Constructor Chaining Using `super()`

When a child class object is created, the parent class constructor is called first.

```java
class Person {
    String name;

    Person(String name) {
        this.name = name;
        System.out.println("Person constructor");
    }
}

class Employee extends Person {
    int salary;

    Employee(String name, int salary) {
        super(name);
        this.salary = salary;
        System.out.println("Employee constructor");
    }
}

public class Main {
    public static void main(String[] args) {
        Employee e = new Employee("Kaushik", 100000);
    }
}
```

**Output:**
```
Person constructor
Employee constructor
```

**Flow:**
```
Employee Object Creation
        |
        v
Employee()
        |
        | super(name)
        v
Person()
        |
        v
Employee initialization
```

## Important Rules of Constructor Chaining

### 1. `this()` and `super()` must be the first statement

**Valid:**
```java
class Test {
    Test() {
        this(10);
    }
    Test(int x) {
        System.out.println(x);
    }
}
```

**Invalid:**
```java
class Test {
    Test() {
        System.out.println("Hello");
        this(10); // Compile error
    }
}
```

### 2. Cannot use both `this()` and `super()` in the same constructor

**Invalid:**
```java
class Test {
    Test() {
        this(10);
        super();
    }
}
```
Because both must be the first statement.

### 3. Constructor chaining prevents code duplication

**Without chaining:**
```java
class User {
    User() {
        name = "Default";
        age = 18;
    }
    User(String name) {
        this.name = name;
        age = 18;
    }
}
```

**With chaining:**
```java
class User {
    User() {
        this("Default",18);
    }
    User(String name) {
        this(name,18);
    }
    User(String name,int age) {
        this.name = name;
        this.age = age;
    }
}
```
Common initialization logic exists in one place.

## Real-Time Example (Spring Boot Style)

**Base class:**
```java
class BaseEntity {
    Long id;
    BaseEntity(Long id) {
        this.id = id;
    }
}
```

**Child class:**
```java
class User extends BaseEntity {
    String username;
    User(Long id, String username) {
        super(id);
        this.username = username;
    }
}
```
The child reuses parent initialization using `super()`.

## Short Interview Answer

> "Constructor chaining is a mechanism where one constructor calls another constructor to reuse initialization logic. In Java, `this()` is used to call another constructor in the same class, while `super()` is used to call the parent class constructor. The call must always be the first statement inside the constructor, and it helps reduce code duplication and ensures proper object initialization."

### Q9. What is the `final` keyword used for?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
`final` means "cannot change":
- `final` variable: constant, must be initialized once
- `final` method: cannot be overridden
- `final` class: cannot be subclassed (e.g., `String`)

#### Code Example
```java
final double PI = 3.14159;
final class Immutable {}
// class Sub extends Immutable {} // compile error
```

### Q10. What is `this` and `super`?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
`this` refers to the current instance; `super` refers to the parent class instance. Both can access fields, methods, and constructors.

#### Code Example
```java
class Parent { int val = 10; }
class Child extends Parent {
    int val = 20;
    void show() {
        System.out.println(val);      // 20
        System.out.println(this.val);  // 20
        System.out.println(super.val); // 10
    }
}
```

### Q11. What is immutability and how to create an immutable class?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
Immutability means that once an object is created, its state cannot be changed after initialization. If any modification is required, Java creates a new object instead of changing the existing object.

The best example of immutability in Java is the `String` class.

```java
String name = "Java";
name = name.concat(" Programming");
System.out.println(name); // Output: Java Programming
```

**Internally:**
```
Before:                          After concat():
String Pool                      String Pool
+----------+                     +----------+
| "Java"   |                     | "Java"   |  (unchanged)
+----------+                     +----------+
                                 | "Java Programming"  <-- new object
                                 +----------+
```
The original "Java" object is not modified.

## Why are Immutable Objects Useful?

### 1. Thread Safety
Immutable objects are automatically thread-safe because multiple threads cannot modify their state.

```java
String username = "Kaushik";
// Multiple threads can safely read it
```

### 2. Security
Immutable objects prevent unwanted modification.
- `String` (database URL, file path, credentials)
- Wrapper classes (`Integer`, `Long`)

### 3. Caching
Since values cannot change, JVM can safely reuse objects (e.g., String Pool).

## How to Create an Immutable Class?

Rules for creating an immutable class:

1. **Make the class `final`** — Prevents inheritance and overriding that could break immutability.
   ```java
   final class Employee { }
   ```

2. **Make all fields `private` and `final`**
   ```java
   private final String name;
   private final int age;
   ```
   `final` ensures values are assigned only once.

3. **Initialize fields through constructor only**
   ```java
   public Employee(String name, int age) {
       this.name = name;
       this.age = age;
   }
   ```

4. **Do not provide setter methods**
   ```java
   // Wrong:
   public void setName(String name) { this.name = name; }
   ```

5. **Return defensive copies for mutable objects** — If a class contains mutable objects like `Date`, `List`, `Map`, `Array`, do not expose the original reference.

## Example of Immutable Class

```java
final class Employee {
    private final String name;
    private final int age;

    public Employee(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() { return name; }
    public int getAge() { return age; }
}
```

**Usage:**
```java
public class Main {
    public static void main(String[] args) {
        Employee emp = new Employee("Kaushik", 30);
        System.out.println(emp.getName());
    }
}
```
The object cannot be changed after creation.

## Immutable Class with Mutable Field Example

**Problem:**
```java
import java.util.List;

final class Student {
    private final List<String> subjects;
    Student(List<String> subjects) { this.subjects = subjects; }
    public List<String> getSubjects() { return subjects; }
}

// Problem:
student.getSubjects().add("Java"); // Internal state changes!
```

**Correct Approach: Defensive Copy**
```java
import java.util.List;
import java.util.ArrayList;

final class Student {
    private final List<String> subjects;
    Student(List<String> subjects) { this.subjects = new ArrayList<>(subjects); }
    public List<String> getSubjects() { return new ArrayList<>(subjects); }
}
```
Now the internal list cannot be modified externally.

## String Immutability Example

```java
String s1 = "Hello";
s1.toUpperCase();
System.out.println(s1); // Output: Hello (unchanged)
```

Because `toUpperCase()` creates a new `String`.

```java
String s2 = s1.toUpperCase();
System.out.println(s2); // Output: HELLO
```

## Immutable vs Mutable Objects

| Immutable | Mutable |
|:---|:---|
| State cannot change | State can change |
| Thread-safe | Need synchronization |
| Creates new object on modification | Same object is modified |
| Example: `String`, `Integer` | Example: `StringBuilder`, `ArrayList` |

## Short Interview Answer

> "An immutable object is an object whose state cannot be changed after creation. To create an immutable class, we make the class final, keep fields private and final, initialize them through a constructor, avoid setters, and use defensive copying for mutable fields. Immutable objects are useful because they are thread-safe, secure, and can be safely shared between multiple threads."

### Q12. Difference between checked and unchecked exceptions?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
**Checked exceptions** (extend `Exception`) are verified at compile-time and must be handled or declared (`IOException`). **Unchecked exceptions** (extend `RuntimeException`) occur at runtime (`NullPointerException`, `ArrayIndexOutOfBoundsException`) and need not be declared.

#### Code Example
```java
void read() throws IOException { // checked - must declare
    Files.readAllBytes(Path.of("x"));
}
void div(int a, int b) {
    int r = a / b; // ArithmeticException - unchecked, no need to declare
}
```

### Q13. What is the `try-with-resources` statement?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
`try-with-resources` is a feature introduced in **Java 7** that automatically closes resources after they are used. It works with any object that implements the `AutoCloseable` interface (or `Closeable`), such as:
- File streams
- Database connections
- Buffered readers
- Sockets
- Input/output streams

It eliminates the need to explicitly close resources inside a `finally` block and helps prevent resource leaks.

## Traditional Approach (Before Java 7)
```java
import java.io.*;

public class Main {
    public static void main(String[] args) {
        BufferedReader br = null;
        try {
            br = new BufferedReader(new FileReader("file.txt"));
            System.out.println(br.readLine());
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                if (br != null) {
                    br.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
```

**Problems:**
- More boilerplate code
- Easy to forget closing resources
- Resource leaks can happen

## Using Try-With-Resources
```java
import java.io.*;

public class Main {
    public static void main(String[] args) {
        try (BufferedReader br =
             new BufferedReader(new FileReader("file.txt"))) {
            System.out.println(br.readLine());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```
Here the JVM automatically calls `br.close()` when the `try` block finishes.

## How Does It Work Internally?
```java
try (Resource r = new Resource()) {
    // use resource
}
```
is internally converted by the compiler into:
```java
Resource r = new Resource();
try {
    // use resource
} finally {
    r.close();
}
```
So the resource closing happens automatically.

## Multiple Resources
You can declare multiple resources separated by a semicolon. They are all closed automatically.
```java
try (
    FileInputStream fis = new FileInputStream("input.txt");
    FileOutputStream fos = new FileOutputStream("output.txt")
) {
    // copy file
} catch (IOException e) {
    e.printStackTrace();
}
```

## Resource Closing Order
Resources are closed in **reverse order** of creation — the last opened resource is closed first.
```java
try (
    ResourceA a = new ResourceA();
    ResourceB b = new ResourceB()
) {
}
// Closing order: ResourceB.close()  ->  ResourceA.close()
```

## Creating a Custom AutoCloseable Resource
```java
class DatabaseConnection implements AutoCloseable {
    public void connect() {
        System.out.println("Database connected");
    }

    @Override
    public void close() {
        System.out.println("Database connection closed");
    }
}

public class Main {
    public static void main(String[] args) {
        try (DatabaseConnection db = new DatabaseConnection()) {
            db.connect();
        }
    }
}
```
**Output:**
```
Database connected
Database connection closed
```

## Exception Handling in Try-With-Resources
If both the `try` block and the `close()` method throw exceptions, the exception from the `try` block is the **main** exception, and the close exception is stored as a **suppressed** exception.
```java
try (Resource r = new Resource()) {
    throw new RuntimeException("Try exception");
}
```
The close exception can be accessed using `exception.getSuppressed();`.

## Real-Time Example (Database Connection)
**Without try-with-resources:**
```java
Connection con = null;
try {
    con = dataSource.getConnection();
    // execute query
} finally {
    con.close();
}
```
**With try-with-resources:**
```java
try (Connection con = dataSource.getConnection()) {
    // execute query
}
```
The connection is automatically returned to the connection pool.

## Short Interview Answer
> "try-with-resources was introduced in Java 7 to automatically close resources after use. Any resource implementing `AutoCloseable` can be used inside the `try` block. The compiler automatically generates the closing logic using a `finally` block internally. It reduces boilerplate code and prevents resource leaks."

## Common Follow-up Questions
**Q1. Which interface is required for try-with-resources?**
→ `AutoCloseable`

**Q2. Difference between `Closeable` and `AutoCloseable`?**

| AutoCloseable | Closeable |
| --- | --- |
| Introduced in Java 7 | Older I/O-specific interface |
| `close() throws Exception` | `close() throws IOException` |
| Used for all resources | Used mainly for I/O resources |

**Q3. Can we use try-with-resources without `catch`?**
Yes, if the exception is handled using `throws`.
```java
public void readFile() throws IOException {
    try (FileReader fr = new FileReader("a.txt")) {
    }
}
```

### Q14. Explain the `Exception` hierarchy in Java.
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
Java provides a well-defined exception hierarchy to handle errors and exceptional situations during program execution.

The root class of all errors and exceptions in Java is:

**java.lang.Throwable**

The hierarchy looks like this:

```
                    Object
                       |
                   Throwable
                       |
          +------------+------------+
          |                         |
       Error                    Exception
          |                         |
          |                 +-------+--------+
          |                 |                |
     OutOfMemoryError   RuntimeException   Other Exceptions
     StackOverflowError       |                |
     ...                     |                |
                         NullPointerException IOException
                         ArithmeticException  SQLException
                         ArrayIndexOutOfBoundsException
                         ClassCastException
```

### 1. Throwable

`Throwable` is the parent class for all exceptions and errors.

It provides methods like:

- `getMessage()`
- `printStackTrace()`
- `getCause()`

**Example:**

```java
try {
    
} catch(Throwable t) {
    
    t.printStackTrace();
}
```

### 2. Error

`Error` represents serious problems that applications usually cannot recover from.

These are generally caused by JVM or system-level issues.

**Examples:**

- `OutOfMemoryError`
- `StackOverflowError`

**OutOfMemoryError Example:**

```java
List<byte[]> list = new ArrayList<>();

while(true) {
    list.add(new byte[1024 * 1024]);
}
```

When JVM runs out of memory:

```
java.lang.OutOfMemoryError
```

**StackOverflowError Example:**

```java
public void test() {
    test();
}
```

Infinite recursion causes:

```
java.lang.StackOverflowError
```

### 3. Exception

`Exception` represents conditions that applications can handle.

**Examples:**

- File not found
- Database connection failure
- Invalid input

Exception has two main categories:

```
Exception
   |
   +----------------+
   |                |
Checked          Unchecked
Exceptions      Exceptions
```

### 4. Checked Exceptions

Checked exceptions are checked at compile time.

The compiler forces the developer to handle them using:

- try-catch
- throws

**Examples:**

- `IOException`
- `SQLException`
- `ClassNotFoundException`

**Example:**

```java
import java.io.*;

class Main {

    public static void main(String[] args) {

        try {

            FileReader file = new FileReader("test.txt");

        } catch(IOException e) {

            e.printStackTrace();
        }
    }
}
```

If not handled:

**Compilation error**

### 5. Unchecked Exceptions

Unchecked exceptions occur during runtime.

They are subclasses of:

**RuntimeException**

**Examples:**

- `NullPointerException`
- `ArithmeticException`
- `ArrayIndexOutOfBoundsException`
- `ClassCastException`

**NullPointerException Example:**

```java
String name = null;

System.out.println(name.length());
```

Output:

```
NullPointerException
```

**ArithmeticException Example:**

```java
int x = 10 / 0;
```

Output:

```
ArithmeticException
```

**ArrayIndexOutOfBoundsException Example:**

```java
int arr[] = {1,2,3};

System.out.println(arr[5]);
```

Output:

```
ArrayIndexOutOfBoundsException
```

### Checked vs Unchecked Exception

| Feature | Checked Exception | Unchecked Exception |
|---------|-------------------|---------------------|
| Checked when | Compile time | Runtime |
| Parent class | Exception | RuntimeException |
| Handling required | Yes | No |
| Examples | IOException, SQLException | NullPointerException, ArithmeticException |

### Common Exception Hierarchy Example

```
Throwable
│
├── Error
│   ├── OutOfMemoryError
│   └── StackOverflowError
│
└── Exception
    │
    ├── IOException
    ├── SQLException
    ├── ClassNotFoundException
    │
    └── RuntimeException
        ├── NullPointerException
        ├── ArithmeticException
        ├── IllegalArgumentException
        └── IndexOutOfBoundsException
```

### Custom Exception Example

We can create our own exceptions by extending Exception or RuntimeException.

**Checked Custom Exception**

```java
class InvalidAgeException extends Exception {

    InvalidAgeException(String message) {
        super(message);
    }
}
```

**Usage:**

```java
if(age < 18) {
    throw new InvalidAgeException("Age not valid");
}
```

**Runtime Custom Exception**

```java
class InvalidUserException extends RuntimeException {

    InvalidUserException(String message) {
        super(message);
    }
}
```

#### Interview Answer (Short Version)

> "In Java, all exceptions and errors are derived from the Throwable class. Throwable has two major subclasses: Error and Exception. Errors represent serious JVM-level problems like OutOfMemoryError and StackOverflowError, which applications usually cannot recover from. Exceptions represent recoverable problems and are divided into checked exceptions and unchecked exceptions. Checked exceptions are verified at compile time, while unchecked exceptions occur at runtime and extend RuntimeException."

### Common Follow-up Interview Questions

**Q1. Difference between Error and Exception?**

- Error → JVM/system problem, generally not handled.
- Exception → Application-level problem, can be handled.

**Q2. Why is RuntimeException unchecked?**

Because many runtime errors are programming mistakes that should be fixed rather than forced to handle.

**Q3. Can we catch Error?**

Yes, but it is generally not recommended except for specific cases like logging or cleanup.

### Q15. What is method hiding vs method overriding?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
Static methods are not overridden — they are **hidden**. If a subclass defines a static method with the same signature, the parent's is hidden, and resolution is based on the reference type (compile-time), not the object type.

#### Code Example
```java
class A { static void m() { System.out.println("A"); } }
class B extends A { static void m() { System.out.println("B"); } }
A a = new B();
a.m(); // prints "A" (static binding on reference type A)
```

### Q16. What is a singleton class and how to implement it?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
A singleton ensures only one instance exists. Common approaches: eager initialization, lazy initialization with double-checked locking, or the enum approach (Joshua Bloch's preferred, serialization-safe).

#### Code Example
```java
public enum Singleton { INSTANCE; }
// or
public class Singleton {
    private static volatile Singleton instance;
    private Singleton() {}
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) instance = new Singleton();
            }
        }
        return instance;
    }
}
```

### Q17. What is the difference between `StringBuilder` and `StringBuffer`?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
Both build mutable strings. `StringBuilder` is not thread-safe (faster, Java 5+) and `StringBuffer` is thread-safe (synchronized methods, legacy). For single-threaded use, prefer `StringBuilder`.

#### Code Example
```java
StringBuilder sb = new StringBuilder();
sb.append("Hello").append(" ").append("World");
String result = sb.toString();
```

### Q18. How does autoboxing and unboxing work?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
Autoboxing automatically converts primitives to wrapper objects (e.g., `int` → `Integer`). Unboxing does the reverse. Added in Java 5. Be careful with `null` unboxing (throws `NullPointerException`).

#### Code Example
```java
Integer i = 10;        // autoboxing (int -> Integer)
int j = i;             // unboxing (Integer -> int)
List<Integer> list = new ArrayList<>();
list.add(5);           // autoboxing
```

### Q19. What is the difference between `HashMap` and `Hashtable`?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
`HashMap` is non-synchronized, allows one null key and multiple null values, and is faster. `Hashtable` is thread-safe (synchronized), does not allow null keys/values, and is legacy.

#### Code Example
```java
Map<String, Integer> map = new HashMap<>();
map.put(null, 1); // OK
// Hashtable: map.put(null, 1); // throws NullPointerException
```

### Q20. What is a marker interface?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
A marker interface has no methods or fields; it marks a class for special treatment by the JVM or frameworks. Examples: `Serializable`, `Cloneable`, `Remote`.

#### Code Example
```java
public class Person implements Serializable {
    private String name;
} // marks Person as serializable
```

### Q21. Explain the `Object` class methods.
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
Every Java class inherits from `Object`. Key methods: `equals()`, `hashCode()`, `toString()`, `clone()`, `finalize()` (deprecated), `getClass()`, `notify()`, `wait()`, `notifyAll()`.

#### Code Example
```java
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Person p)) return false;
    return name.equals(p.name);
}
@Override
public int hashCode() { return Objects.hash(name); }
```

### Q22. What is the difference between `equals()` and `hashCode()` contract?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
If two objects are equal via `equals()`, they must have the same `hashCode()`. The reverse is not required. Violating this breaks hash-based collections like `HashMap` and `HashSet`.

#### Code Example
```java
// Always override both together
@Override public boolean equals(Object o) { /* ... */ }
@Override public int hashCode() { return Objects.hash(id); }
```

### Q23. What is method reference in Java?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
Method references (`::`) are shorthand for lambda expressions that call a single method. Forms: static (`Class::method`), instance (`obj::method`), constructor (`Class::new`), arbitrary instance (`Class::method`).

#### Code Example
```java
List<String> names = Arrays.asList("a", "b");
names.forEach(System.out::println); // method reference
```

### Q24. What is the `instanceof` operator?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
`instanceof` checks whether an object is an instance of a specific class or interface (including subclasses). Returns boolean. Useful before casting to avoid `ClassCastException`.

#### Code Example
```java
Object o = "text";
if (o instanceof String s) {
    System.out.println(s.length()); // pattern matching (Java 16+)
}
```

### Q25. Explain the difference between `throw` and `throws`.
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
`throw` is used to explicitly throw an exception instance. `throws` is used in a method signature to declare that the method may throw checked exceptions.

#### Code Example
```java
void validate(int age) throws IllegalArgumentException {
    if (age < 0) throw new IllegalArgumentException("negative age");
}
```

### Q26. What is the difference between `final`, `finally`, and `finalize`?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
- `final`: restricts modification (variable/method/class)
- `finally`: block that always executes after try/catch (cleanup)
- `finalize()`: deprecated Object method called by GC before reclaiming memory

#### Code Example
```java
try { /* code */ }
finally { System.out.println("always runs"); }
```

### Q27. What is a static block and when is it used?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
A static block (`static {}`) runs once when the class is loaded by the JVM. Used for static initialization that cannot fit in a single expression.

#### Code Example
```java
class Config {
    static Properties props;
    static {
        props = new Properties();
        props.setProperty("env", "prod");
    }
}
```

### Q28. Can a constructor be `private`? Why?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
Yes. A private constructor prevents external instantiation. Used in singletons, factory methods, and utility classes (where all methods are static).

#### Code Example
```java
public class Utility {
    private Utility() {} // no instantiation
    public static int add(int a, int b) { return a + b; }
}
```

### Q29. What is the difference between `int` and `Integer`?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
`int` is a primitive (stores value directly, default 0, no methods). `Integer` is a wrapper class (object, default null, has methods like `parseInt`). Autoboxing bridges them.

#### Code Example
```java
int a = 5;
Integer b = Integer.valueOf(5);
int c = Integer.parseInt("10");
```

### Q30. What is a `record` in Java (Java 16+)?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
A `record` is a concise immutable data carrier. The compiler auto-generates private final fields, a canonical constructor, `equals()`, `hashCode()`, and `toString()`. Great for DTOs.

#### Code Example
```java
public record User(String name, int age) {}
User u = new User("Alice", 30);
System.out.println(u.name()); // accessor, not getter
```

### Q31. What is shadowing in Java?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
Shadowing occurs when a local variable or parameter has the same name as a field, hiding it within that scope. Use `this.` to access the shadowed field.

#### Code Example
```java
class Example {
    int x = 10;
    void setX(int x) { this.x = x; } // parameter shadows field
}
```

### Q32. Explain covariance and contravariance in Java.
**Difficulty:** `Advanced`
**Category:** Core Java & OOP

#### Answer
Covariance: a method can return a subtype of the declared return type (e.g., `Object` → `String`). Contravariance: a parameter can accept a supertype. Arrays are covariant; generics are invariant.

#### Code Example
```java
class A { Object get() { return null; } }
class B extends A { @Override String get() { return ""; } } // covariant return
```

### Q33. What is the Difference Between Deep Copy and Shallow Copy in Java?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer

What is the Difference Between Deep Copy and Shallow Copy in Java?

Copying an object means creating a new object with the same data as an existing object.

The difference between shallow copy and deep copy is how they handle reference-type fields (objects inside objects).

### 1. Shallow Copy

A shallow copy creates a new object, but the nested objects/references inside it are shared with the original object.

Only the top-level object is copied.

**Example:**
```java
class Address {
    String city;

    Address(String city) {
        this.city = city;
    }
}

class Employee implements Cloneable {
    String name;
    Address address;

    Employee(String name, Address address) {
        this.name = name;
        this.address = address;
    }

    public Object clone() throws CloneNotSupportedException {
        return super.clone();
    }
}
```

**Usage:**
```java
public class Main {
    public static void main(String[] args) throws Exception {
        Address address = new Address("Bangalore");
        Employee emp1 = new Employee("Kaushik", address);
        Employee emp2 = (Employee) emp1.clone();

        emp2.address.city = "Pune";
        System.out.println(emp1.address.city);
    }
}
```

**Output:**
```
Pune
```

**Why?**
Because both objects share the same `Address` object.

**Memory:**
```
emp1
 |
 |---- Address("Pune")
              ^
              |
emp2 ----------|
```

Changing `emp2.address` affects `emp1.address`.


### 2. Deep Copy

A deep copy creates a completely independent copy of the object, including all nested objects.

Changes in the copied object do not affect the original object.

**Example:**
```java
class Employee {
    String name;
    Address address;

    Employee(String name, Address address) {
        this.name = name;
        this.address = new Address(address.city);
    }
}
```

**Usage:**
```java
Address address = new Address("Bangalore");
Employee emp1 = new Employee("Kaushik", address);
Employee emp2 = new Employee(emp1.name, emp1.address);

emp2.address.city = "Pune";
System.out.println(emp1.address.city);
```

**Output:**
```
Bangalore
```

**Memory:**
```
emp1
 |
 |---- Address("Bangalore")

emp2
 |
 |---- Address("Pune")
```

They have separate objects.


#### Shallow Copy vs Deep Copy

| Feature | Shallow Copy | Deep Copy |
|---------|-------------|-----------|
| Object copied | Yes | Yes |
| Nested objects copied | No | Yes |
| References shared | Yes | No |
| Memory usage | Less | More |
| Performance | Faster | Slower |
| Changes affect original | Yes | No |
| Implementation | `clone()` (default) | Manual copying / serialization |


#### Example with Collections

**Shallow Copy**
```java
List<String> list1 = new ArrayList<>();
list1.add("Java");
List<String> list2 = list1;
list2.add("Spring");
System.out.println(list1);
```

**Output:**
```
[Java, Spring]
```

Both references point to the same list.

**Using `new ArrayList<>`**
```java
List<String> list1 = new ArrayList<>();
list1.add("Java");
List<String> list2 = new ArrayList<>(list1);
list2.add("Spring");
System.out.println(list1);
```

**Output:**
```
[Java]
```

This creates a separate list.


#### Deep Copy with Serialization

Another approach:
- `ObjectOutputStream`
- `ObjectInputStream`

**Example:**
```java
Employee copy = (Employee) objectInputStream.readObject();
```

Serialization creates completely separate objects.


#### Java `clone()` and Copying

Java provides `Object.clone()` which creates a shallow copy by default.

**Example:**
```java
Employee emp2 = (Employee) emp1.clone();
```

**For deep copy, we need to override `clone()`:**
```java
@Override
protected Object clone() {
    Employee emp = new Employee();
    emp.name = this.name;
    emp.address = new Address(this.address.city);
    return emp;
}
```


#### Real-Time Example

**Shallow Copy Use Case:**
- Caching or read-only objects where shared references are acceptable.

**Deep Copy Use Case:**
- Creating independent configurations
- Copying user profiles
- Transaction snapshots
- Undo/redo functionality


#### Interview Answer (Short Version)

> "A shallow copy creates a new object but copies references of nested objects, so both objects share the same internal objects. A deep copy creates a completely independent object by copying all nested objects as well. In Java, `Object.clone()` provides a shallow copy by default, while deep copying requires manual copying, copy constructors, or serialization."


#### Common Follow-up Questions

**Q1. Does `clone()` create a deep copy?**
→ No, Java's default `clone()` creates a shallow copy.

**Q2. Which is faster: shallow copy or deep copy?**
→ Shallow copy, because it only copies references.

**Q3. Why is deep copy more expensive?**
→ Because it creates new objects for all referenced objects.

#### Code Example
```java
// Shallow: clone() default
// Deep: manually copy nested objects or use serialization
class Address implements Cloneable {
    String city;
    protected Object clone() throws CloneNotSupportedException {
        return super.clone();
    }
}
```

### Q34. What is the `transient` keyword?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
`transient` marks a field to be skipped during serialization. Useful for sensitive data (passwords) or derived/computed fields.

#### Code Example
```java
class User implements Serializable {
    String name;
    transient String password; // not serialized
}
```

### Q35. What is the difference between `Comparable` and `Comparator`?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
`Comparable` defines natural ordering of a class (one method: `compareTo`). `Comparator` is external sorting logic (separate class, multiple orderings possible).

#### Code Example
```java
class Person implements Comparable<Person> {
    int age;
    public int compareTo(Person o) { return Integer.compare(age, o.age); }
}
Comparator<Person> byName = (p1, p2) -> p1.name.compareTo(p2.name);
```

### Q36. What is the purpose of the `volatile` keyword?
**Difficulty:** `Advanced`
**Category:** Core Java & OOP

#### Answer
`volatile` ensures a variable is read/written directly from main memory (not CPU cache), guaranteeing visibility across threads. It does NOT provide atomicity (use `Atomic` classes for that).

#### Code Example
```java
class Flag {
    volatile boolean running = true;
    void stop() { running = false; }
}
```

### Q37. What is the difference between `Stack` and `Heap` memory?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
**Stack** stores local variables and method call frames; thread-private, fast, automatically cleaned on method exit. **Heap** stores objects; shared across threads, managed by GC.

#### Code Example
```java
void method() {
    int x = 5;        // stack
    Object o = new Object(); // reference on stack, object on heap
}
```

### Q38. What are enums and when to use them?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
Enums define a fixed set of constants with type safety. They can have fields, methods, and implement interfaces. Prefer enums over `int` constants for readability and safety.

#### Code Example
```java
enum Day { MONDAY, TUESDAY, WEDNESDAY }
Day today = Day.MONDAY;
switch (today) { case MONDAY: break; }
```

### Q39. What is reflection in Java?
**Difficulty:** `Advanced`
**Category:** Core Java & OOP

#### Answer
Reflection allows inspecting/modifying runtime behavior of classes (fields, methods, constructors) at runtime. Used by frameworks (Spring, JUnit). It has performance overhead and breaks encapsulation.

#### Code Example
```java
Class<?> clazz = Class.forName("java.lang.String");
Method[] methods = clazz.getDeclaredMethods();
```

### Q40. What is the difference between `public static void main(String[] args)` components?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
`public`: accessible from JVM. `static`: no instance needed. `void`: no return value. `main`: entry point name. `String[] args`: command-line arguments.

#### Code Example
```java
public static void main(String[] args) {
    for (String arg : args) System.out.println(arg);
}
```

### Q41. What is a nested class vs inner class?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
A **static nested class** doesn't need an outer instance. A **non-static inner class** has an implicit reference to the outer instance, can access its private members.

#### Code Example
```java
class Outer {
    static class Nested {}    // no outer ref
    class Inner {}            // has outer ref
}
```

### Q42. What is the difference between `null` and empty string?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
`null` means no reference (points to nothing; calling methods on it throws NPE). Empty string `""` is a valid String object with zero length.

#### Code Example
```java
String a = null;    // no object
String b = "";      // valid object, length 0
// a.length(); // NullPointerException
```

### Q43. What is the diamond problem and how does Java avoid it?
**Difficulty:** `Advanced`
**Category:** Core Java & OOP

#### Answer
The diamond problem occurs with multiple inheritance of classes (ambiguity over which parent method to call). Java avoids it by allowing only single class inheritance but permitting multiple interface implementation. With default methods, conflicts are resolved explicitly via `Interface.super.method()`.

#### Code Example
```java
interface A { default void foo() {} }
interface B { default void foo() {} }
class C implements A, B {
    public void foo() { A.super.foo(); } // must resolve explicitly
}
```

### Q44. What is a lambda expression?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
A lambda is a concise way to express an anonymous function (a block of code passed as an argument). It implements a functional interface. Syntax: `(params) -> expression`.

#### Code Example
```java
List<Integer> nums = Arrays.asList(1, 2, 3);
nums.forEach(n -> System.out.println(n * 2));
```

### Q45. What is a functional interface?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
An interface with exactly one abstract method (SAM). Can have default/static methods. `@FunctionalInterface` annotation enforces this. Examples: `Runnable`, `Callable`, `Comparator`, `Function`.

#### Code Example
```java
@FunctionalInterface
interface Greeting { void say(String name); }
Greeting g = name -> System.out.println("Hi " + name);
```

### Q46. What is the difference between `sleep()` and `wait()`?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
`sleep()` (Thread class) pauses the current thread for a specified time without releasing the lock. `wait()` (Object class) releases the lock and waits for `notify()`/`notifyAll()`.

#### Code Example
```java
Thread.sleep(1000); // keeps lock
synchronized (obj) { obj.wait(); } // releases lock
```

### Q47. What is the difference between `ArrayList` and `LinkedList`?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
`ArrayList` uses a dynamic array (fast random access O(1), slow insertion in middle O(n)). `LinkedList` uses nodes (fast insert/delete O(1), slow access O(n)).

#### Code Example
```java
List<String> arr = new ArrayList<>();  // random access heavy
List<String> link = new LinkedList<>(); // frequent insert/delete
```

### Q48. What is the `super` keyword used for in constructors?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
`super()` calls the parent class constructor. It must be the first statement in a subclass constructor. If omitted, the compiler inserts an implicit `super()` (no-arg) call.

#### Code Example
```java
class Animal { Animal(String n) {} }
class Dog extends Animal { Dog() { super("Dog"); } }
```

### Q49. What is the difference between compile-time and runtime polymorphism?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
**Compile-time** (static) polymorphism: method overloading resolved at compile time. **Runtime** (dynamic) polymorphism: method overriding resolved at runtime based on the actual object type via vtable dispatch.

#### Code Example
```java
// Overloading - compile time
// Overriding - runtime (JVM picks actual object's method)
```

### Q50. What is the purpose of `@Override` annotation?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
`@Override` tells the compiler you intend to override a superclass/interface method. If the signature doesn't match, the compiler errors — catching typos at compile time.

#### Code Example
```java
@Override
public String toString() { return "MyClass"; }
```

### Q51. What is a deadlock and how to avoid it?
**Difficulty:** `Advanced`
**Category:** Core Java & OOP

#### Answer
A deadlock is when two or more threads block forever, each waiting for a lock held by another. Avoid by: locking in consistent order, using `tryLock` with timeout, minimizing lock scope, and using higher-level concurrency utilities.

#### Code Example
```java
// Deadlock: Thread1 locks A then B, Thread2 locks B then A
// Solution: always acquire locks in same order (A then B)
```

### Q52. What is the difference between `Error` and `Exception`?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
Both extend `Throwable`. `Error` represents serious JVM failures (`OutOfMemoryError`, `StackOverflowError`) — typically unrecoverable. `Exception` represents conditions a program might handle.

#### Code Example
```java
try {
    recursiveCall(); // StackOverflowError - can't really handle
} catch (Exception e) { }
```

### Q53. What is the `assert` keyword?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
`assert` validates assumptions during development. `assert condition;` throws `AssertionError` if false. Disabled by default; enable with `-ea` JVM flag. Not for production error handling.

#### Code Example
```java
assert x > 0 : "x must be positive"; // custom message
```

### Q54. What is the difference between `var` (Java 10+) and explicit type?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
`var` uses local type inference — the compiler determines the type from the initializer. Type is still static (not dynamic). Only allowed for local variables with initializers.

#### Code Example
```java
var list = new ArrayList<String>(); // inferred as ArrayList<String>
var name = "Java";                   // inferred as String
```

### Q55. What is a strong reference vs weak reference?
**Difficulty:** `Advanced`
**Category:** Core Java & OOP

#### Answer
**Strong**: normal reference, GC won't collect while reachable. **Weak** (`WeakReference`): collected on next GC even if referenced. Used in caches (`WeakHashMap`). **Soft**: collected only when memory is low. **Phantom**: for pre-cleanup notifications.

#### Code Example
```java
WeakReference<ExpensiveObj> ref = new WeakReference<>(new ExpensiveObj());
// GC may reclaim the object even though ref exists
```

### Q56. What is the `strictfp` keyword?
**Difficulty:** `Advanced`
**Category:** Core Java & OOP

#### Answer
`strictfp` ensures floating-point calculations follow IEEE 754 exactly across platforms (no platform-specific extended precision). Rarely needed today since Java 17 made strict FP the default.

#### Code Example
```java
public strictfp class MathUtils { }
```

### Q57. What is the difference between `import` and `static import`?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
`import` brings a class into scope. `import static` brings static members (methods/fields) directly, allowing unqualified use. Overuse reduces readability.

#### Code Example
```java
import static java.lang.Math.PI;
import static java.lang.Math.sqrt;
double r = sqrt(PI);
```

### Q58. What is a sealed class (Java 17)?
**Difficulty:** `Advanced`
**Category:** Core Java & OOP

#### Answer
A sealed class restricts which classes can extend it via the `permits` clause. Enables exhaustive pattern matching and controlled hierarchies. Combines open inheritance with safety.

#### Code Example
```java
public sealed class Shape permits Circle, Square {}
final class Circle extends Shape {}
final class Square extends Shape {}
```

### Q59. What is the difference between `ExecutionException` and `InterruptedException`?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
`InterruptedException` is thrown when a thread is interrupted while waiting (sleep/wait). `ExecutionException` wraps an exception thrown by a task submitted to an executor.

#### Code Example
```java
try { future.get(); }
catch (InterruptedException e) { Thread.currentThread().interrupt(); }
catch (ExecutionException e) { Throwable cause = e.getCause(); }
```

### Q60. What is the difference between a mutable and immutable object?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
Mutable objects can change state after creation (`StringBuilder`, arrays). Immutable objects cannot (`String`, `Integer`, `LocalDate`). Immutability aids thread-safety and caching.

#### Code Example
```java
String s = "a";
s = s + "b"; // new object created, original unchanged
```

### Q61. What is the purpose of `Math.random()` vs `Random` class?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
`Math.random()` returns a double in [0,1) using an internal `Random`. The `Random` class offers more control (seeds, `nextInt`, `nextGaussian`, streams). For cryptography, use `SecureRandom`.

#### Code Example
```java
double d = Math.random();
Random r = new Random(42); // seeded
int n = r.nextInt(100);
```

### Q62. What is a static factory method?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
A static method that returns an instance of the class (e.g., `LocalDate.now()`, `List.of()`). Advantages: meaningful names, can return cached/subtype, not required to create new object each call.

#### Code Example
```java
public static User createAdmin() { return new User("admin", Role.ADMIN); }
List<String> list = List.of("a", "b"); // static factory
```

### Q63. What is the difference between `String`, `StringBuffer`, and `StringBuilder` thread-safety?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
`String` is immutable (thread-safe by nature). `StringBuffer` is synchronized (thread-safe but slower). `StringBuilder` is not synchronized (fastest, use in single-threaded code).

#### Code Example
```java
String s = "immutable";
StringBuilder sb = new StringBuilder(); // fast
StringBuffer sbf = new StringBuffer();   // synchronized
```

### Q64. What is the concept of "fail-fast" in Java?
**Difficulty:** `Advanced`
**Category:** Core Java & OOP

#### Answer
Fail-fast iterators (e.g., `ArrayList`'s) throw `ConcurrentModificationException` immediately if the collection is structurally modified during iteration (except via the iterator's own methods).

#### Code Example
```java
for (String s : list) {
    list.add("x"); // ConcurrentModificationException
}
```

### Q65. What is the difference between `clone()` and copy constructor?
**Difficulty:** `Advanced`
**Category:** Core Java & OOP

#### Answer
`clone()` (from `Cloneable`) is fragile, needs casting, doesn't call constructors. A copy constructor (e.g., `Person(Person other)`) is explicit, type-safe, and easier to maintain.

#### Code Example
```java
class Person {
    Person(Person other) { this.name = other.name; } // copy constructor
}
```

### Q66. What is the difference between a class and an object?
**Difficulty:** `Basic`
**Category:** Core Java & OOP

#### Answer
A **class** is a blueprint/template defining structure and behavior. An **object** is a concrete instance of a class occupying memory with its own state.

#### Code Example
```java
class Car {}          // blueprint
Car myCar = new Car(); // object/instance
```

### Q67. What is the `default` method in interfaces?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
Introduced in Java 8, `default` methods provide implementation in interfaces without breaking existing implementers. Enables interface evolution and multiple inheritance of behavior.

#### Code Example
```java
interface Vehicle {
    default void start() { System.out.println("Starting..."); }
}
```

### Q68. What is the difference between `Class.forName()` and `ClassLoader.loadClass()`?
**Difficulty:** `Advanced`
**Category:** Core Java & OOP

#### Answer
`Class.forName()` initializes the class (runs static blocks) by default. `ClassLoader.loadClass()` only loads it without initialization. JDBC uses `forName()` to register drivers.

#### Code Example
```java
Class<?> c1 = Class.forName("com.mysql.Driver"); // initializes
Class<?> c2 = getClass().getClassLoader().loadClass("com.mysql.Driver");
```

### Q69. What is the purpose of the `native` keyword?
**Difficulty:** `Advanced`
**Category:** Core Java & OOP

#### Answer
`native` declares a method implemented in platform-specific C/C++ code (JNI). Used for low-level OS interactions (e.g., `Object.hashCode()` in hotspot JVM).

#### Code Example
```java
public native int hashCode(); // implemented in C
```

### Q70. What is the difference between `abstract` method and `default` method?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
An `abstract` method has no body and must be implemented by subclasses. A `default` method has a body and is optional to override.

#### Code Example
```java
interface I {
    void mustImplement();     // abstract
    default void optional() {} // default
}
```

### Q71. What is the concept of "composition over inheritance"?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
Favoring composition (has-a relationship) over inheritance (is-a) promotes flexibility and reduces tight coupling. Inheritance breaks encapsulation; composition allows runtime behavior changes.

#### Code Example
```java
class Engine {}
class Car { private Engine engine; } // composition (has-a)
```

### Q72. What is the difference between a pass-by-value and pass-by-reference?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
Java is **always pass-by-value**. For objects, the value is the reference (memory address), so changes to the object's fields are visible, but reassigning the parameter doesn't affect the caller's reference.

#### Code Example
```java
void modify(List<String> l) { l.add("x"); } // visible
void reassign(List<String> l) { l = new ArrayList<>(); } // not visible to caller
```

### Q73. What is the `switch` expression (Java 14+)?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
Switch expressions (vs statements) return a value using `->` syntax and `yield`, are exhaustive with `default` or enum coverage, and can be assigned. Arrow case doesn't fall through.

#### Code Example
```java
int days = switch (month) {
    case 1, 3, 5, 7, 8, 10, 12 -> 31;
    case 2 -> 28;
    default -> 30;
};
```

### Q74. What is the difference between `getClass()` and `instanceof`?
**Difficulty:** `Intermediate`
**Category:** Core Java & OOP

#### Answer
`getClass()` returns the exact runtime class (no subclass match). `instanceof` returns true for the class and all its subclasses.

#### Code Example
```java
Object o = new ArrayList<>();
System.out.println(o instanceof List);    // true
System.out.println(o.getClass() == List.class); // false (it's ArrayList)
```

### Q75. What is a memory leak in Java and how to prevent it?
**Difficulty:** `Advanced`
**Category:** Core Java & OOP

#### Answer
Even with GC, leaks occur when objects are unintentionally retained (static collections, unclosed resources, listeners not removed, thread-local not cleaned). Prevent via weak references, try-with-resources, and careful lifecycle management.

#### Code Example
```java
// Leak: static Map holds references forever
static Map<String, Object> cache = new HashMap<>();
// Fix: use WeakHashMap or bounded cache with eviction
```
