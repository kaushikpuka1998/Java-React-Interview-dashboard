# LLD — Behavioral Design Patterns Interview Questions (Q15–Q27)

---

### Q15. Explain the Strategy pattern.
**Difficulty:** `Basic`
**Category:** Behavioral Patterns

#### Answer
Strategy defines a family of interchangeable algorithms, encapsulates each behind a common interface, and lets the client select one at runtime. It replaces sprawling `if/else`/`switch` on behavior with polymorphism, and follows Open/Closed — add a new strategy without touching existing code. Classic uses: payment methods, sorting/compression algorithms, pricing/discount rules. In Java, a strategy is often just a lambda / functional interface.

#### Code Example / Key Takeaways
```java
interface DiscountStrategy { double apply(double total); }

class NoDiscount     implements DiscountStrategy { public double apply(double t){ return t; } }
class PercentOff     implements DiscountStrategy {
    private final double pct; PercentOff(double p){ pct=p; }
    public double apply(double t){ return t * (1 - pct); }
}
class Cart {
    private DiscountStrategy strategy = new NoDiscount();
    void setStrategy(DiscountStrategy s){ strategy = s; }   // swap at runtime
    double checkout(double total){ return strategy.apply(total); }
}
Cart cart = new Cart();
cart.setStrategy(new PercentOff(0.10));   // or a lambda: t -> t*0.9
cart.checkout(100);                        // 90
```

---

### Q16. Explain the Observer pattern.
**Difficulty:** `Basic`
**Category:** Behavioral Patterns

#### Answer
Observer defines a **one-to-many** dependency: when a subject's state changes, all registered observers are notified automatically. It decouples the subject from its observers (it knows only the interface), enabling event/notification systems, UI data-binding, and pub/sub. Observers subscribe/unsubscribe dynamically. Watch for memory leaks (unregister observers) and update storms. It's the foundation of reactive/event-driven UIs.

#### Code Example / Key Takeaways
```java
interface Observer { void update(String news); }

class NewsAgency {                                  // subject
    private final List<Observer> observers = new ArrayList<>();
    void subscribe(Observer o){ observers.add(o); }
    void unsubscribe(Observer o){ observers.remove(o); }
    void publish(String news){ observers.forEach(o -> o.update(news)); } // notify all
}
class EmailSubscriber implements Observer {
    public void update(String news){ /* send email with news */ }
}
NewsAgency agency = new NewsAgency();
agency.subscribe(new EmailSubscriber());
agency.publish("Kafka 4.0 released");   // every subscriber notified
```

---

### Q17. Explain the Command pattern.
**Difficulty:** `Intermediate`
**Category:** Behavioral Patterns

#### Answer
Command encapsulates a request as an **object**, decoupling the invoker from the receiver. This lets you parameterize objects with operations, queue or log requests, and support **undo/redo** (each command knows how to execute and reverse itself). Uses: menu/button actions, task queues, transactional operations, macro recording. The invoker just calls `execute()` without knowing the concrete action.

#### Code Example / Key Takeaways
```java
interface Command { void execute(); void undo(); }

class Light { void on(){ /*...*/ } void off(){ /*...*/ } }
class LightOnCommand implements Command {
    private final Light light; LightOnCommand(Light l){ light=l; }
    public void execute(){ light.on(); }
    public void undo(){ light.off(); }              // reversible
}
class Remote {                                      // invoker
    private final Deque<Command> history = new ArrayDeque<>();
    void press(Command c){ c.execute(); history.push(c); }
    void undoLast(){ if(!history.isEmpty()) history.pop().undo(); }
}
Remote r = new Remote();
r.press(new LightOnCommand(new Light()));
r.undoLast();   // undo/redo enabled by encapsulating the action
```

---

### Q18. Explain the Template Method pattern.
**Difficulty:** `Intermediate`
**Category:** Behavioral Patterns

#### Answer
Template Method defines the **skeleton of an algorithm** in a base class method, deferring specific steps to subclasses via abstract (or hook) methods. The overall structure and step order are fixed; subclasses customize the variable steps. It promotes reuse and enforces a consistent flow (the "Hollywood principle": the base class calls the subclass, not vice versa). Uses: framework lifecycle methods, data-processing pipelines, `HttpServlet.service()`.

#### Code Example / Key Takeaways
```java
abstract class DataProcessor {
    // template method: fixed skeleton, steps vary
    public final void process() {
        read();
        transform();      // subclass-specific
        write();
    }
    protected void read(){ /* common */ }
    protected abstract void transform();            // subclasses fill this in
    protected void write(){ /* common */ }
}
class CsvProcessor extends DataProcessor {
    protected void transform(){ /* CSV-specific parsing */ }
}
new CsvProcessor().process();   // structure enforced, only transform() customized
```

---

### Q19. Explain the Chain of Responsibility pattern.
**Difficulty:** `Intermediate`
**Category:** Behavioral Patterns

#### Answer
Chain of Responsibility passes a request along a chain of handlers; each handler either processes it or forwards it to the next. It decouples sender from receiver and lets you add/reorder handlers freely. Uses: middleware/filter pipelines (auth → logging → validation), event bubbling, approval workflows, exception handling. Each handler focuses on one concern (Single Responsibility).

#### Code Example / Key Takeaways
```java
abstract class Handler {
    protected Handler next;
    Handler setNext(Handler n){ this.next = n; return n; }
    abstract void handle(Request r);
    protected void forward(Request r){ if (next != null) next.handle(r); }
}
class AuthHandler extends Handler {
    void handle(Request r){ if (r.authed()) forward(r); else r.reject("401"); }
}
class RateLimitHandler extends Handler {
    void handle(Request r){ if (r.underLimit()) forward(r); else r.reject("429"); }
}
class BusinessHandler extends Handler {
    void handle(Request r){ r.serve(); }
}
Handler chain = new AuthHandler();
chain.setNext(new RateLimitHandler()).setNext(new BusinessHandler());
chain.handle(request);   // flows through the pipeline
```

---

### Q20. Explain the State pattern.
**Difficulty:** `Intermediate`
**Category:** Behavioral Patterns

#### Answer
State lets an object alter its behavior when its internal state changes — it appears to change class. Each state is a separate object encapsulating the behavior valid in that state and the transitions to other states, replacing large conditional blocks on a "status" field. Uses: order lifecycle (placed→paid→shipped), vending machines, document workflows, TCP connection states. It makes valid transitions explicit and adding states clean.

#### Code Example / Key Takeaways
```java
interface OrderState { OrderState next(); String name(); }

class Placed  implements OrderState { public OrderState next(){ return new Paid(); }    public String name(){ return "PLACED"; } }
class Paid    implements OrderState { public OrderState next(){ return new Shipped(); } public String name(){ return "PAID"; } }
class Shipped implements OrderState { public OrderState next(){ return this; }          public String name(){ return "SHIPPED"; } }

class Order {
    private OrderState state = new Placed();
    void advance(){ state = state.next(); }   // behavior depends on current state
    String status(){ return state.name(); }
}
Order o = new Order(); o.advance(); o.advance();   // PLACED -> PAID -> SHIPPED
```

---

### Q21. Explain the Iterator pattern.
**Difficulty:** `Basic`
**Category:** Behavioral Patterns

#### Answer
Iterator provides a way to access elements of a collection sequentially **without exposing its internal representation**. The collection returns an iterator object that knows how to traverse it (`hasNext()`/`next()`), so client code is decoupled from whether it's an array, list, or tree. Java's `Iterator`/`Iterable` and the for-each loop are built on this. It also allows multiple simultaneous traversals.

#### Code Example / Key Takeaways
```java
class Playlist implements Iterable<String> {
    private final String[] songs;
    Playlist(String... s){ songs = s; }
    public Iterator<String> iterator() {           // hides internal array
        return new Iterator<>() {
            int i = 0;
            public boolean hasNext(){ return i < songs.length; }
            public String next(){ return songs[i++]; }
        };
    }
}
for (String song : new Playlist("a","b","c")) { /* traverse without knowing internals */ }
```

---

### Q22. Explain the Mediator pattern.
**Difficulty:** `Intermediate`
**Category:** Behavioral Patterns

#### Answer
Mediator centralizes complex communication between objects into a mediator object, so components refer only to the mediator instead of to each other — turning a many-to-many web of dependencies into a hub-and-spoke. It reduces coupling and makes interactions easier to change. Uses: chat rooms (users talk via the room), UI dialogs coordinating widgets, air-traffic control. Caution: the mediator can become a god object if overloaded.

#### Code Example / Key Takeaways
```java
class ChatRoom {                                    // mediator
    private final List<User> users = new ArrayList<>();
    void register(User u){ users.add(u); u.setRoom(this); }
    void send(String msg, User from) {              // routes between users
        users.stream().filter(u -> u != from).forEach(u -> u.receive(msg));
    }
}
class User {
    private final String name; private ChatRoom room;
    User(String n){ name=n; }
    void setRoom(ChatRoom r){ room = r; }
    void send(String m){ room.send(name+": "+m, this); }  // no direct user refs
    void receive(String m){ /* show */ }
}
```

---

### Q23. Explain the Memento pattern.
**Difficulty:** `Intermediate`
**Category:** Behavioral Patterns

#### Answer
Memento captures and externalizes an object's internal state so it can be **restored later**, without violating encapsulation (the state is stored in an opaque memento object). It powers undo/redo, checkpoints, and snapshots. Three roles: **Originator** (creates/restores mementos), **Memento** (immutable state snapshot), **Caretaker** (stores mementos, e.g. an undo stack) without inspecting them.

#### Code Example / Key Takeaways
```java
class Editor {                                      // originator
    private String content = "";
    void type(String t){ content += t; }
    Memento save(){ return new Memento(content); }              // snapshot
    void restore(Memento m){ content = m.state(); }             // rollback
    record Memento(String state) {}                             // opaque snapshot
}
Editor e = new Editor();
Deque<Editor.Memento> undo = new ArrayDeque<>();  // caretaker
e.type("Hello"); undo.push(e.save());
e.type(" World"); e.restore(undo.pop());          // back to "Hello"
```

---

### Q24. Explain the Visitor pattern.
**Difficulty:** `Hard`
**Category:** Behavioral Patterns

#### Answer
Visitor lets you add new operations to an object structure **without modifying the element classes**. Elements accept a visitor and dispatch to the visitor's type-specific method (double dispatch). It's useful when you have a stable class hierarchy but frequently add new operations (e.g. AST traversal: type-check, generate code, pretty-print). Trade-off: adding a new element type forces changing every visitor, so it favors stable structures with changing operations.

#### Code Example / Key Takeaways
```java
interface Visitor { void visit(Book b); void visit(Fruit f); }
interface Item { void accept(Visitor v); }

class Book  implements Item { double price=20; public void accept(Visitor v){ v.visit(this);} }
class Fruit implements Item { double kg=2;    public void accept(Visitor v){ v.visit(this);} }

class PriceVisitor implements Visitor {             // new operation, no element edits
    double total = 0;
    public void visit(Book b){ total += b.price; }
    public void visit(Fruit f){ total += f.kg * 3; }
}
List<Item> cart = List.of(new Book(), new Fruit());
PriceVisitor pv = new PriceVisitor();
cart.forEach(i -> i.accept(pv));   // double dispatch computes total
```

---

### Q25. Explain the Interpreter pattern.
**Difficulty:** `Hard`
**Category:** Behavioral Patterns

#### Answer
Interpreter defines a grammar for a simple language and an interpreter that evaluates sentences in it, representing each grammar rule as a class in an expression tree. Use it for small, well-defined languages: rule engines, query/filter expressions, calculators, regex-like matchers. It's clean for simple grammars but becomes unwieldy for complex ones (use a real parser generator instead).

#### Code Example / Key Takeaways
```java
interface Expr { int eval(); }
class Num  implements Expr { int v; Num(int v){this.v=v;} public int eval(){ return v; } }
class Add  implements Expr {
    Expr l, r; Add(Expr l, Expr r){ this.l=l; this.r=r; }
    public int eval(){ return l.eval() + r.eval(); }    // grammar rule as a class
}
class Mul  implements Expr {
    Expr l, r; Mul(Expr l, Expr r){ this.l=l; this.r=r; }
    public int eval(){ return l.eval() * r.eval(); }
}
// (2 + 3) * 4  as an expression tree:
Expr e = new Mul(new Add(new Num(2), new Num(3)), new Num(4));
e.eval();   // 20
```

---

### Q26. What is the difference between Strategy and State patterns (they look identical)?
**Difficulty:** `Hard`
**Category:** Behavioral Patterns

#### Answer
Structurally both delegate to an interchangeable object, but intent differs:
- **Strategy**: the client chooses **which algorithm** to use; strategies are independent and unaware of each other; the choice usually doesn't change on its own.
- **State**: the object's **behavior changes with its internal state**, and states typically **trigger transitions** to other states; the client doesn't pick the state, the state machine drives it.

Strategy = "how to do something" (pluggable algorithm); State = "what to do based on current status" (self-transitioning lifecycle).

#### Code Example / Key Takeaways
```text
Strategy                              State
client picks the algorithm            object's state picks behavior
strategies don't know each other      states transition to one another
stable during an operation            changes as the object's status changes
e.g. sort/compress/pricing algorithm  e.g. order placed->paid->shipped
```

---

### Q27. What are the three GoF categories and how do you choose a behavioral pattern?
**Difficulty:** `Intermediate`
**Category:** Behavioral Patterns

#### Answer
GoF groups patterns into **Creational** (object creation), **Structural** (object composition), and **Behavioral** (object interaction/responsibility). For behavioral selection: pluggable algorithm → **Strategy**; notify many on change → **Observer**; encapsulate a request/undo → **Command**; fixed algorithm with varying steps → **Template Method**; pass request through handlers → **Chain of Responsibility**; behavior by status → **State**; traverse without exposing internals → **Iterator**; centralize N-to-N comms → **Mediator**; snapshot/restore → **Memento**; new ops over a stable hierarchy → **Visitor**; evaluate a mini-language → **Interpreter**.

#### Code Example / Key Takeaways
```text
Need                                   -> Behavioral pattern
swap algorithm at runtime              -> Strategy
notify many observers of a change      -> Observer
encapsulate action / undo-redo         -> Command
fixed skeleton, custom steps           -> Template Method
request through a handler pipeline      -> Chain of Responsibility
behavior depends on status + transitions-> State
sequential access, hide internals      -> Iterator
centralize object communication        -> Mediator
capture/restore state                  -> Memento
add operations to stable classes       -> Visitor
evaluate a simple grammar              -> Interpreter
```

---
