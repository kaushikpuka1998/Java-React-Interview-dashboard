# LLD — Structural Design Patterns Interview Questions (Q7–Q14)

---

### Q7. Explain the Adapter pattern.
**Difficulty:** `Basic`
**Category:** Structural Patterns

#### Answer
Adapter converts the interface of a class into another interface the client expects, letting incompatible interfaces work together — like a plug adapter. Use it to integrate a third-party/legacy class whose API you can't change into your codebase's expected interface. It wraps the adaptee and translates calls. (In DDD, an anti-corruption layer is an adapter at a service boundary.)

#### Code Example / Key Takeaways
```java
// Target interface our app expects
interface PaymentGateway { boolean pay(long cents); }

// Incompatible third-party class we can't modify
class StripeApi { void charge(double dollars, String cur) { /* ... */ } }

// Adapter translates our interface -> the third-party API
class StripeAdapter implements PaymentGateway {
    private final StripeApi stripe = new StripeApi();
    public boolean pay(long cents) {
        stripe.charge(cents / 100.0, "USD");   // translate call/units
        return true;
    }
}
PaymentGateway gw = new StripeAdapter();   // app code stays gateway-agnostic
```

---

### Q8. What is the Bridge pattern?
**Difficulty:** `Hard`
**Category:** Structural Patterns

#### Answer
Bridge decouples an **abstraction** from its **implementation** so the two can vary independently, replacing a combinatorial explosion of subclasses with composition. Instead of `RedCircle, BlueCircle, RedSquare, BlueSquare…`, you have a `Shape` abstraction holding a `Color` implementor. Adding a shape or a color is then linear, not multiplicative. Use it when both dimensions change independently.

#### Code Example / Key Takeaways
```java
interface Color { String fill(); }                 // implementation side
class Red  implements Color { public String fill(){ return "red"; } }
class Blue implements Color { public String fill(){ return "blue"; } }

abstract class Shape {                              // abstraction side
    protected final Color color;                    // bridge (composition)
    Shape(Color c){ this.color = c; }
    abstract String draw();
}
class Circle extends Shape {
    Circle(Color c){ super(c); }
    String draw(){ return "Circle in " + color.fill(); }
}
// New shape OR new color added independently — no NxM subclasses.
Shape s = new Circle(new Blue());
```

---

### Q9. Explain the Composite pattern.
**Difficulty:** `Intermediate`
**Category:** Structural Patterns

#### Answer
Composite lets you treat individual objects (leaves) and compositions of objects (nodes) **uniformly** through a common interface, forming a tree structure. Clients call the same method on a single item or a whole subtree without knowing the difference. Ideal for hierarchies: file systems (files/folders), UI component trees, org charts, menus.

#### Code Example / Key Takeaways
```java
interface FileNode { int size(); }                 // common interface

class File implements FileNode {                    // leaf
    private final int size;
    File(int s){ size=s; }
    public int size(){ return size; }
}
class Folder implements FileNode {                  // composite
    private final List<FileNode> children = new ArrayList<>();
    void add(FileNode n){ children.add(n); }
    public int size(){ return children.stream().mapToInt(FileNode::size).sum(); }
}
Folder root = new Folder();
root.add(new File(10)); root.add(new File(20));
root.size();   // 30 — same call works on file or folder subtree
```

---

### Q10. Explain the Decorator pattern.
**Difficulty:** `Intermediate`
**Category:** Structural Patterns

#### Answer
Decorator dynamically **adds responsibilities** to an object by wrapping it in a decorator that implements the same interface and delegates to the wrapped object, adding behavior before/after. It's a flexible alternative to subclassing for extending behavior — you can stack decorators in any combination at runtime (Open/Closed). Java I/O (`BufferedInputStream` wrapping `FileInputStream`) is the classic example.

#### Code Example / Key Takeaways
```java
interface Coffee { double cost(); String desc(); }
class Espresso implements Coffee {
    public double cost(){ return 2.0; } public String desc(){ return "espresso"; }
}
abstract class CoffeeDecorator implements Coffee {
    protected final Coffee inner;                   // same interface, wraps one
    CoffeeDecorator(Coffee c){ inner = c; }
}
class Milk extends CoffeeDecorator {
    Milk(Coffee c){ super(c); }
    public double cost(){ return inner.cost() + 0.5; }        // add behavior
    public String desc(){ return inner.desc() + "+milk"; }
}
class Sugar extends CoffeeDecorator {
    Sugar(Coffee c){ super(c); }
    public double cost(){ return inner.cost() + 0.2; }
    public String desc(){ return inner.desc() + "+sugar"; }
}
// Stack decorators at runtime:
Coffee c = new Sugar(new Milk(new Espresso()));   // cost 2.7, "espresso+milk+sugar"
```

---

### Q11. Explain the Facade pattern.
**Difficulty:** `Basic`
**Category:** Structural Patterns

#### Answer
Facade provides a **simple, unified interface** to a complex subsystem, hiding its internal classes and interactions behind one entry point. Clients use the easy facade instead of orchestrating many low-level objects, reducing coupling and cognitive load. It doesn't add functionality — it simplifies access. Example: an `OrderFacade.placeOrder()` that internally coordinates inventory, payment, and shipping services.

#### Code Example / Key Takeaways
```java
// Complex subsystem
class Inventory { void reserve(String id){ /*...*/ } }
class Payment   { void charge(String id){ /*...*/ } }
class Shipping  { void schedule(String id){ /*...*/ } }

// Facade: one simple method hides the orchestration
class OrderFacade {
    private final Inventory inv = new Inventory();
    private final Payment pay = new Payment();
    private final Shipping ship = new Shipping();
    public void placeOrder(String id) {           // client calls just this
        inv.reserve(id); pay.charge(id); ship.schedule(id);
    }
}
new OrderFacade().placeOrder("A1");   // client unaware of subsystem details
```

---

### Q12. Explain the Flyweight pattern.
**Difficulty:** `Hard`
**Category:** Structural Patterns

#### Answer
Flyweight minimizes memory by **sharing** common, immutable parts of many similar objects (intrinsic state) and passing the varying parts (extrinsic state) in from outside. Instead of millions of objects each holding duplicate data, you cache and reuse shared instances. Classic uses: characters/glyphs in a text editor, particles in a game, or Java's `Integer.valueOf` cache. Requires clearly separating shared (intrinsic) from context-specific (extrinsic) state.

#### Code Example / Key Takeaways
```java
// Intrinsic (shared) state — cached and reused
record TreeType(String name, String texture) {}   // immutable, shared

class TreeFactory {
    private static final Map<String, TreeType> cache = new HashMap<>();
    static TreeType of(String name, String texture) {
        return cache.computeIfAbsent(name + texture, k -> new TreeType(name, texture));
    }
}
// Extrinsic (varying) state passed in per instance:
void draw(TreeType type, int x, int y) { /* render type at x,y */ }
// 1,000,000 trees share a handful of TreeType objects.
```

---

### Q13. Explain the Proxy pattern and its common variants.
**Difficulty:** `Intermediate`
**Category:** Structural Patterns

#### Answer
Proxy provides a **surrogate** for another object to control access to it, implementing the same interface. Variants: **Virtual** (lazy-load an expensive object on first use), **Protection** (access control/authorization), **Remote** (represent an object in another address space — RPC stubs), and **Caching/Logging** (add cross-cutting behavior). Unlike Decorator (adds behavior), Proxy primarily controls access. Spring AOP proxies are a real-world example.

#### Code Example / Key Takeaways
```java
interface Image { void display(); }
class RealImage implements Image {                 // expensive to create
    RealImage(String f){ loadFromDisk(f); }
    public void display(){ /* show */ }
    private void loadFromDisk(String f){ /* heavy */ }
}
class ImageProxy implements Image {                // virtual proxy: lazy load
    private final String file; private RealImage real;
    ImageProxy(String f){ file = f; }
    public void display() {
        if (real == null) real = new RealImage(file);  // created only on first use
        real.display();
    }
}
Image img = new ImageProxy("big.png");   // no disk load until display() is called
```

---

### Q14. Compare Adapter, Decorator, Facade, and Proxy — they all "wrap".
**Difficulty:** `Intermediate`
**Category:** Structural Patterns

#### Answer
All wrap an object but with different intent:
- **Adapter**: changes the interface so incompatible types work together.
- **Decorator**: keeps the interface, **adds behavior/responsibilities** (stackable).
- **Facade**: introduces a **new simpler interface** over a complex subsystem.
- **Proxy**: keeps the interface, **controls access** (lazy, security, remote, caching).

Intent is the differentiator: convert (Adapter), enhance (Decorator), simplify (Facade), control (Proxy).

#### Code Example / Key Takeaways
```text
Pattern    Same interface?   Intent
Adapter    NO (converts)     make incompatible interfaces work together
Decorator  YES               add responsibilities dynamically (stack them)
Facade     NEW simpler one   hide a complex subsystem behind one entry point
Proxy      YES               control access (lazy load / auth / remote / cache)
```

---
