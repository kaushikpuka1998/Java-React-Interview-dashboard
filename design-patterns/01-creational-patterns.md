# LLD — Creational Design Patterns Interview Questions (Q1–Q6)

---

### Q1. What is the Singleton pattern and how do you implement it correctly?
**Difficulty:** `Basic`
**Category:** Creational Patterns

#### Answer
Singleton ensures a class has **exactly one instance** and provides a global access point to it — used for shared resources like configuration, logging, connection pools, or caches. The correct, thread-safe, lazy, reflection- and serialization-safe implementation in Java is an **enum** (Effective Java). If you need a class, use the **static holder idiom** (lazy + thread-safe without synchronization) or a double-checked-locking `volatile` field. Avoid naive lazy init (not thread-safe) and beware that singletons are effectively global state (hard to test/mock).

#### Code Example / Key Takeaways
```java
// Best: enum singleton — thread-safe, serialization/reflection-proof
enum Config {
    INSTANCE;
    private final Properties props = load();
    public String get(String k) { return props.getProperty(k); }
    private Properties load() { /* ... */ return new Properties(); }
}
// Usage: Config.INSTANCE.get("db.url");

// Alternative: lazy holder idiom (thread-safe, no locking)
class Logger {
    private Logger() {}
    private static class Holder { static final Logger I = new Logger(); }
    public static Logger get() { return Holder.I; }
}
```

---

### Q2. Explain the Factory Method pattern.
**Difficulty:** `Basic`
**Category:** Creational Patterns

#### Answer
Factory Method defines an interface for creating an object but lets subclasses (or a factory method) decide **which concrete class** to instantiate. It decouples client code from concrete types — the client depends on an abstraction and asks a factory for an instance, so adding a new product doesn't change client code (Open/Closed). Use it when a class can't anticipate the object type it must create, or to centralize/standardize object creation.

#### Code Example / Key Takeaways
```java
interface Notification { void send(String msg); }
class Email implements Notification { public void send(String m){ /*...*/ } }
class Sms   implements Notification { public void send(String m){ /*...*/ } }
class Push  implements Notification { public void send(String m){ /*...*/ } }

class NotificationFactory {
    static Notification create(String type) {           // one place decides the type
        return switch (type) {
            case "email" -> new Email();
            case "sms"   -> new Sms();
            case "push"  -> new Push();
            default -> throw new IllegalArgumentException(type);
        };
    }
}
// Client depends only on the interface:
Notification n = NotificationFactory.create("sms"); n.send("hi");
```

---

### Q3. What is the Abstract Factory pattern and how does it differ from Factory Method?
**Difficulty:** `Intermediate`
**Category:** Creational Patterns

#### Answer
Abstract Factory provides an interface to create **families of related objects** without specifying their concrete classes — e.g. a `WindowsFactory` produces a matching `WindowsButton` + `WindowsCheckbox`, a `MacFactory` produces Mac variants. It guarantees the products used together are compatible. Difference: **Factory Method** creates one product via inheritance (a method); **Abstract Factory** creates several related products via composition (an object with multiple create methods). Use Abstract Factory when your system must be independent of how a whole family of products is created.

#### Code Example / Key Takeaways
```java
interface Button   { void render(); }
interface Checkbox { void render(); }

interface GUIFactory {            // creates a FAMILY of related widgets
    Button createButton();
    Checkbox createCheckbox();
}
class WindowsFactory implements GUIFactory {
    public Button createButton()     { return new WindowsButton(); }
    public Checkbox createCheckbox() { return new WindowsCheckbox(); }
}
class MacFactory implements GUIFactory {
    public Button createButton()     { return new MacButton(); }
    public Checkbox createCheckbox() { return new MacCheckbox(); }
}
// Client gets a consistent family; no mixing Win button with Mac checkbox.
GUIFactory f = isWindows ? new WindowsFactory() : new MacFactory();
f.createButton().render(); f.createCheckbox().render();
```

---

### Q4. Explain the Builder pattern and when to use it.
**Difficulty:** `Intermediate`
**Category:** Creational Patterns

#### Answer
Builder constructs a complex object step by step, separating construction from representation. It's ideal when a class has **many (especially optional) parameters** — avoiding the "telescoping constructor" anti-pattern and confusing positional args. The builder exposes fluent, named setters and a `build()` that returns an immutable object, and can validate invariants before construction. Use it for objects with many optional fields or that must be immutable.

#### Code Example / Key Takeaways
```java
class Pizza {
    private final int size; private final boolean cheese, pepperoni, mushroom;
    private Pizza(Builder b){ size=b.size; cheese=b.cheese; pepperoni=b.pepperoni; mushroom=b.mushroom; }

    static class Builder {
        private final int size;                 // required
        private boolean cheese, pepperoni, mushroom;  // optional
        Builder(int size){ this.size = size; }
        Builder cheese(boolean v){ this.cheese=v; return this; }      // fluent
        Builder pepperoni(boolean v){ this.pepperoni=v; return this; }
        Builder mushroom(boolean v){ this.mushroom=v; return this; }
        Pizza build(){
            if (size <= 0) throw new IllegalStateException("bad size"); // validate
            return new Pizza(this);
        }
    }
}
Pizza p = new Pizza.Builder(12).cheese(true).mushroom(true).build();
```

---

### Q5. What is the Prototype pattern?
**Difficulty:** `Intermediate`
**Category:** Creational Patterns

#### Answer
Prototype creates new objects by **cloning an existing instance** (the prototype) instead of instantiating from scratch. It's useful when object creation is expensive (heavy initialization, DB/network load) or when you need many similar objects — you configure one and copy it. Key concern: **deep vs shallow copy** (nested mutable references must be deep-copied to avoid shared-state bugs). In Java you can implement `Cleanable`/`clone()` or a copy constructor.

#### Code Example / Key Takeaways
```java
interface Prototype<T> { T copy(); }

class Document implements Prototype<Document> {
    private String title;
    private List<String> sections;                 // mutable -> must deep copy
    Document(String t, List<String> s){ title=t; sections=s; }
    public Document copy() {
        return new Document(title, new ArrayList<>(sections)); // DEEP copy
    }
}
Document template = new Document("Report", List.of("Intro"));
Document copy = template.copy();   // cheap clone instead of rebuilding from scratch
```

---

### Q6. Explain the difference between the main Creational patterns (when to pick which).
**Difficulty:** `Intermediate`
**Category:** Creational Patterns

#### Answer
- **Singleton**: exactly one shared instance.
- **Factory Method**: pick one concrete product behind an interface (subclass/method decides).
- **Abstract Factory**: create a whole **family** of compatible products.
- **Builder**: assemble a complex object step-by-step (many optional fields, immutability).
- **Prototype**: clone an existing configured instance (expensive creation).

Rule: many params → Builder; one-of-many types → Factory Method; families → Abstract Factory; expensive-to-create → Prototype; single global instance → Singleton.

#### Code Example / Key Takeaways
```text
Need                                   -> Pattern
one shared instance                    -> Singleton
choose a concrete type via interface   -> Factory Method
a family of related objects            -> Abstract Factory
complex object, many optional fields   -> Builder
copy a costly-to-build instance        -> Prototype
```

---
