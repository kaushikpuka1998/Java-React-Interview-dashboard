# LLD — SOLID Principles & Enterprise Patterns Interview Questions (Q28–Q38)

---

### Q28. What are the SOLID principles?
**Difficulty:** `Intermediate`
**Category:** SOLID Principles

#### Answer
SOLID is five OOP design principles for maintainable code:
- **S**ingle Responsibility: a class should have one reason to change.
- **O**pen/Closed: open for extension, closed for modification (add behavior via new code, not edits).
- **L**iskov Substitution: subtypes must be usable anywhere their base type is expected, without breaking behavior.
- **I**nterface Segregation: prefer many small, specific interfaces over one fat one.
- **D**ependency Inversion: depend on abstractions, not concretions.

Together they reduce coupling, ease testing, and localize change.

#### Code Example / Key Takeaways
```java
// Dependency Inversion + Single Responsibility:
interface Repository { void save(Order o); }        // abstraction
class OrderService {
    private final Repository repo;                   // depends on abstraction
    OrderService(Repository repo){ this.repo = repo; }  // injected, not `new`
    void place(Order o){ repo.save(o); }             // one responsibility
}
// Open/Closed: add a new Repository impl without touching OrderService.
```

---

### Q29. Explain the Single Responsibility Principle with a refactor example.
**Difficulty:** `Basic`
**Category:** SOLID Principles

#### Answer
A class should have exactly one responsibility / one reason to change. Mixing concerns (e.g. business logic + persistence + formatting) makes a class fragile: a change to one concern risks the others, and it's hard to test/reuse. Split responsibilities into focused classes that collaborate. This improves cohesion and testability.

#### Code Example / Key Takeaways
```java
// BAD: one class does calculation, persistence, and emailing
class Invoice { double total(){/*...*/} void saveToDb(){/*...*/} void email(){/*...*/} }

// GOOD: one responsibility each
class Invoice        { double total(){ /* calc only */ return 0; } }
class InvoiceRepository { void save(Invoice i){ /* persistence */ } }
class InvoiceMailer  { void send(Invoice i){ /* emailing */ } }
// A change to emailing no longer risks the calculation logic.
```

---

### Q30. Explain the Open/Closed and Liskov Substitution principles.
**Difficulty:** `Intermediate`
**Category:** SOLID Principles

#### Answer
- **Open/Closed**: you should extend behavior by adding new code (new subclasses/strategies), not by editing existing, tested code — often achieved with polymorphism/Strategy.
- **Liskov Substitution**: any subtype must honor the base type's contract, so substituting it doesn't break correctness (no strengthening preconditions or weakening postconditions). The classic violation: `Square extends Rectangle` breaking `setWidth/setHeight` expectations.

#### Code Example / Key Takeaways
```java
// Open/Closed via polymorphism — add shapes without editing area()
interface Shape { double area(); }
class Circle implements Shape { double r; public double area(){ return Math.PI*r*r; } }
class Square implements Shape { double s; public double area(){ return s*s; } }
double totalArea(List<Shape> shapes){ return shapes.stream().mapToDouble(Shape::area).sum(); }
// Adding Triangle requires NO change to totalArea (Open/Closed).
// LSV: every Shape returns a valid area() — substitutable everywhere a Shape is used.
```

---

### Q31. Explain the Interface Segregation and Dependency Inversion principles.
**Difficulty:** `Intermediate`
**Category:** SOLID Principles

#### Answer
- **Interface Segregation**: clients shouldn't depend on methods they don't use. Split fat interfaces so implementers aren't forced to stub irrelevant methods (e.g. don't make a `SimplePrinter` implement `scan()`/`fax()`).
- **Dependency Inversion**: high-level modules and low-level modules should both depend on **abstractions**; details depend on abstractions, not vice versa. This decouples policy from implementation and enables injection/mocking.

#### Code Example / Key Takeaways
```java
// Interface Segregation: small focused interfaces
interface Printer { void print(Doc d); }
interface Scanner { void scan(Doc d); }
class SimplePrinter implements Printer { public void print(Doc d){ /*...*/ } } // no scan() stub

// Dependency Inversion: high-level depends on abstraction, impl injected
interface MessageSender { void send(String to, String body); }
class OrderNotifier {
    private final MessageSender sender;              // abstraction
    OrderNotifier(MessageSender s){ sender = s; }    // inject email/SMS/push impl
}
```

---

### Q32. What is Dependency Injection and how does it relate to IoC?
**Difficulty:** `Intermediate`
**Category:** Enterprise Patterns

#### Answer
Dependency Injection (DI) supplies a class's dependencies from the outside (constructor/setter) instead of the class creating them with `new`. It's the primary way to implement **Inversion of Control** — the framework/container, not the class, controls object creation and wiring. Benefits: loose coupling, easy testing (inject mocks), and swappable implementations. Prefer **constructor injection** for required, immutable dependencies. Spring's container is a DI framework.

#### Code Example / Key Takeaways
```java
// Constructor injection — dependency provided, not constructed internally
class PaymentService {
    private final Gateway gateway;
    PaymentService(Gateway gateway){ this.gateway = gateway; }  // injected
}
// Production wiring: new PaymentService(new StripeGateway());
// Test wiring:       new PaymentService(mockGateway);   // trivially mockable
```

---

### Q33. Explain the MVC architectural pattern.
**Difficulty:** `Basic`
**Category:** Enterprise Patterns

#### Answer
MVC separates an application into **Model** (data + business rules), **View** (presentation/UI), and **Controller** (handles input, coordinates model and view). This separation of concerns improves testability, parallel development, and reuse (multiple views over one model). The controller receives a request, updates/reads the model, and selects a view to render. Variants: MVP, MVVM (used in frontend frameworks). Spring MVC is a canonical example.

#### Code Example / Key Takeaways
```java
// Model
record Order(String id, double total) {}
// Controller — handles input, coordinates model + view
@RestController
class OrderController {
    private final OrderService service;             // model/business layer
    OrderController(OrderService s){ service = s; }
    @GetMapping("/orders/{id}")
    Order get(@PathVariable String id){ return service.find(id); }  // returns to view
}
// View = the JSON/HTML rendering of the returned model.
```

---

### Q34. Explain the Repository pattern.
**Difficulty:** `Intermediate`
**Category:** Enterprise Patterns

#### Answer
Repository mediates between the domain and data-mapping layers, providing a **collection-like interface** for accessing aggregates ("save this order", "find orders by customer") while hiding the persistence mechanism (SQL, JPA, NoSQL). It centralizes query logic, decouples business code from the database, and makes swapping/mock­ing storage easy. Spring Data repositories are a direct implementation.

#### Code Example / Key Takeaways
```java
// Domain-facing abstraction (collection-like)
interface OrderRepository {
    Optional<Order> findById(String id);
    List<Order> findByCustomer(String customerId);
    Order save(Order o);
}
// Business code depends only on the interface, not on JDBC/JPA:
class OrderService {
    private final OrderRepository repo;
    OrderService(OrderRepository r){ repo = r; }
    Order place(Order o){ return repo.save(o); }
}
// Spring Data: interface OrderRepository extends JpaRepository<Order,String> {}
```

---

### Q35. What is the difference between DAO and Repository patterns?
**Difficulty:** `Intermediate`
**Category:** Enterprise Patterns

#### Answer
Both abstract data access, but at different levels:
- **DAO (Data Access Object)**: lower-level, typically **one per table/entity**, exposing CRUD operations close to the database structure.
- **Repository**: higher-level, domain-oriented, works with **aggregates** and speaks the ubiquitous language of the domain; it may use one or more DAOs internally and can encapsulate richer domain queries.

In practice they overlap; DAO is persistence-centric, Repository is domain-centric (DDD).

#### Code Example / Key Takeaways
```java
// DAO — table/CRUD oriented, persistence-centric
interface OrderDao {
    void insert(OrderRow row); OrderRow selectById(String id); void update(OrderRow row);
}
// Repository — domain/aggregate oriented, speaks business language
interface OrderRepository {
    Order findById(String id);            // returns a domain aggregate
    List<Order> findUnshippedFor(String customerId);   // domain query
}
// Repository may delegate to DAO(s) under the hood.
```

---

### Q36. Explain the DTO pattern and why it's used.
**Difficulty:** `Basic`
**Category:** Enterprise Patterns

#### Answer
A DTO (Data Transfer Object) is a simple, behavior-less object that carries data across boundaries (API responses, service-to-service, layers). It decouples your API/wire contract from internal domain/entity models — so you can expose only needed fields, avoid leaking persistence details (lazy-loading, sensitive columns), aggregate data from multiple sources, and evolve internals without breaking clients. Map between entity and DTO explicitly (or via MapStruct).

#### Code Example / Key Takeaways
```java
// Internal entity (persistence) stays hidden
class OrderEntity { String id; String customerId; String internalNotes; double total; }

// DTO exposes only what the API should return (no internalNotes)
record OrderDto(String id, double total) {}

OrderDto toDto(OrderEntity e){ return new OrderDto(e.id, e.total); }
// API returns OrderDto -> internal fields never leak; contract stays stable.
```

---

### Q37. What is the Unit of Work pattern?
**Difficulty:** `Hard`
**Category:** Enterprise Patterns

#### Answer
Unit of Work tracks all changes (inserts/updates/deletes) made during a business transaction and commits them as **one atomic operation**, coordinating a single database transaction and often reducing round-trips. It ensures consistency (all-or-nothing) and manages the identity/dirty-tracking of objects. JPA's `EntityManager`/persistence context and Spring's `@Transactional` are implementations — changes within a transaction are flushed together on commit.

#### Code Example / Key Takeaways
```java
// @Transactional = Unit of Work: all changes commit atomically or roll back
@Transactional
public void transfer(String from, String to, long cents) {
    Account a = repo.find(from);
    Account b = repo.find(to);
    a.debit(cents);                 // tracked
    b.credit(cents);                // tracked
    // Both persisted together on commit; any exception rolls back BOTH.
}
```

---

### Q38. What is the difference between design patterns and architectural patterns?
**Difficulty:** `Intermediate`
**Category:** Enterprise Patterns

#### Answer
- **Design patterns (LLD)**: class/object-level solutions to recurring code design problems (GoF: Strategy, Observer, Factory…). Scope: within a component/module.
- **Architectural patterns (HLD)**: system-level structures organizing the whole application or multiple services (Layered, MVC, Microservices, Event-Driven, CQRS, Sidecar, Client-Server). Scope: the system.

Design patterns shape code; architectural patterns shape systems. Both aim for maintainability, scalability, and separation of concerns at their respective altitudes.

#### Code Example / Key Takeaways
```text
Design patterns (LLD)          Architectural patterns (HLD)
class/object interactions      system/component organization
Strategy, Observer, Factory    Layered, MVC, Microservices, EDA, CQRS, Sidecar
scope: a module                scope: the whole system
```

---
