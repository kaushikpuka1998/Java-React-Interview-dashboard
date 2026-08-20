# JPA, Hibernate & Spring Security Interview Questions (Q426-Q500)

---

### Q426. What is JPA and how does it relate to Hibernate?
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
JPA (Java Persistence API) is a specification (JSR 338) that defines a standard for ORM in Java. It provides annotations and interfaces for mapping Java objects to relational databases. JPA is just the API — it doesn't provide implementation.

Hibernate is one of the most popular JPA implementations. It was the inspiration for JPA and provides the actual persistence logic. Other implementations include EclipseLink and OpenJPA.

Think of JPA as the interface and Hibernate as the concrete class that implements it.

#### Code Example / Key Takeaways
```java
// JPA is just annotations/interfaces — no implementation
@Entity
public class User {
    @Id @GeneratedValue
    private Long id;
    private String name;
}

// Hibernate provides the implementation
// In persistence.xml or application.yml:
// spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect

// Spring Boot auto-configures Hibernate as default JPA provider
```
---

### Q427. What is ORM and what problem does it solve?
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
ORM (Object-Relational Mapping) is a technique that maps Java objects to database tables, bridging the gap between object-oriented programming and relational databases (the impedance mismatch).

Without ORM, developers write tedious JDBC code for CRUD operations. ORM handles:
- Mapping objects to tables and fields to columns
- Automatic SQL generation
- Transaction management
- Caching for performance
- Lazy loading of relationships

#### Code Example / Key Takeaways
```java
// Without ORM - verbose JDBC
String sql = "SELECT id, name FROM users WHERE id = ?";
PreparedStatement ps = conn.prepareStatement(sql);
ps.setLong(1, userId);
ResultSet rs = ps.executeQuery();

// With ORM - clean and type-safe
User user = entityManager.find(User.class, userId);
// or Spring Data JPA
Optional<User> user = userRepository.findById(userId);
```
---

### Q428. Entity and table mapping
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
@Entity marks a persistent class, while @Table controls its physical table name and constraints. The class needs a no-argument constructor and an identity field.

#### Code Example / Key Takeaways
```java
@Entity
@Table(name = "customers")
class Customer {
    @Id Long id;
    protected Customer() {}
}
```

---

### Q429. Primary key with @Id
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
@Id identifies the column that uniquely identifies each entity. It may be placed on a field or getter, but the choice determines access strategy for all mappings.

#### Code Example / Key Takeaways
```java
@Entity class Account {
    @Id private String iban;
    protected Account() {}
}
```

---

### Q430. IDENTITY key generation
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
IDENTITY delegates key creation to an auto-increment/identity column. Hibernate usually must insert before it knows the identifier, so batching can be less efficient.

#### Code Example / Key Takeaways
```java
@Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
```

---

### Q431. SEQUENCE key generation
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
SEQUENCE obtains identifiers from a database sequence and can allocate blocks with allocationSize, improving batching. It is commonly preferred on PostgreSQL and Oracle.

#### Code Example / Key Takeaways
```java
@Id @GeneratedValue(strategy=GenerationType.SEQUENCE, generator="user_seq")
@SequenceGenerator(name="user_seq", sequenceName="user_seq", allocationSize=50)
Long id;
```

---

### Q432. TABLE key generation
**Difficulty:** `Advanced`
**Category:** JPA, Hibernate & Security

#### Answer
TABLE stores the next identifier in a dedicated table. It is portable but requires row locking and is generally slower than native sequences or identity columns.

#### Code Example / Key Takeaways
```java
@Id @GeneratedValue(strategy=GenerationType.TABLE, generator="ids")
@TableGenerator(name="ids", table="id_gen", pkColumnName="name", valueColumnName="value", pkColumnValue="customer")
Long id;
```

---

### Q433. AUTO key generation
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
AUTO lets the provider select a strategy from the dialect. It is convenient for portable examples, but production schemas should choose and migrate an explicit strategy.

#### Code Example / Key Takeaways
```java
@Id @GeneratedValue(strategy=GenerationType.AUTO) Long id;
```

---

### Q434. @Column options
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
@Column customizes name, nullability, uniqueness, length, and precision. These are mapping hints and should be backed by actual database constraints and migrations.

#### Code Example / Key Takeaways
```java
@Column(name="email_address", nullable=false, unique=true, length=320)
String email;
```

---

### Q435. @GeneratedValue composite keys
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Composite keys use an @EmbeddableId class or multiple @Id fields with @IdClass. The key class must implement equals/hashCode and be serializable. @GeneratedValue applies only to simple keys.

#### Code Example / Key Takeaways
```java
@Embeddable class OrderItemId implements Serializable {
    Long orderId; Long productId;
    // equals, hashCode
}
@Entity @IdClass(OrderItemId.class) class OrderItem {
    @Id Long orderId; @Id Long productId;
}
```

---

### Q436. One-to-one relationship
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
One-to-one maps one row to one related row. Put the foreign key on the owning side with @JoinColumn; make the inverse side mappedBy to avoid a second join column.

#### Code Example / Key Takeaways
```java
@OneToOne @JoinColumn(name="profile_id", nullable=false)
Profile profile;
```

---

### Q437. One-to-many relationship
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
A one-to-many collection is usually inverse and paired with a many-to-one foreign key on the child. mappedBy identifies that child association as owner.

#### Code Example / Key Takeaways
```java
@OneToMany(mappedBy="order")
List<Line> lines = new ArrayList<>();
```

---

### Q438. Many-to-one relationship
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
Many child entities can reference one parent. It is the owning side and normally uses a foreign-key column; prefer LAZY loading for large associations.

#### Code Example / Key Takeaways
```java
@ManyToOne(fetch=FetchType.LAZY, optional=false)
@JoinColumn(name="customer_id")
Customer customer;
```

---

### Q439. Many-to-many relationship
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Many-to-many uses a join table and is convenient for simple links. For attributes on the link, model the join table as an entity instead.

#### Code Example / Key Takeaways
```java
@ManyToMany
@JoinTable(name="user_role",
    joinColumns=@JoinColumn(name="user_id"),
    inverseJoinColumns=@JoinColumn(name="role_id"))
Set<Role> roles;
```

---

### Q440. Cascade operations
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Cascade propagates persistence operations from parent to child; ALL includes remove, which can delete shared data accidentally. Use only the operations the aggregate owns.

#### Code Example / Key Takeaways
```java
@OneToMany(mappedBy="invoice", cascade=CascadeType.ALL, orphanRemoval=true)
List<Item> items;
```

---

### Q441. orphanRemoval
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
orphanRemoval deletes a child removed from an owned collection or whose one-to-one reference is cleared. It is not a replacement for cascade remove and should not be used for shared children.

#### Code Example / Key Takeaways
```java
items.remove(item); // owned orphan is deleted on flush
```

---

### Q442. LAZY versus EAGER fetch
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
LAZY loads an association when accessed, whereas EAGER loads it immediately. LAZY reduces unnecessary work but requires an open persistence context or an explicit fetch query.

#### Code Example / Key Takeaways
```java
@ManyToOne(fetch=FetchType.LAZY) Customer customer;
@OneToMany(fetch=FetchType.LAZY) List<Line> lines;
```

---

### Q443. Owning side and mappedBy
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
The owning side writes the foreign key or join table. mappedBy points to the Java property on that owner; setting only the inverse side does not update the database.

#### Code Example / Key Takeaways
```java
parent.children.add(child);
child.parent = parent; // keep both sides synchronized
```

---

### Q444. Bidirectional relationship sync
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Always update both sides of a bidirectional association in code; the persistence provider only synchronizes from the owning side. Helper methods on the parent prevent mistakes.

#### Code Example / Key Takeaways
```java
@Entity class Order {
    @OneToMany(mappedBy="order") List<Line> lines = new ArrayList<>();
    void addLine(Line l) { lines.add(l); l.setOrder(this); }
}
```

---

### Q445. Join table customization
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
@JoinTable customizes the join table name, columns, and constraints for many-to-many or unidirectional one-to-many. Prefer explicit names for clarity in migrations.

#### Code Example / Key Takeaways
```java
@ManyToMany
@JoinTable(name="order_product",
    joinColumns=@JoinColumn(name="order_id"),
    inverseJoinColumns=@JoinColumn(name="product_id"))
Set<Product> products;
```

---

### Q446. Embeddable value object
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
@Embeddable maps a value type into the owner table rather than a separate table. It has no independent identity and is persisted with its owner.

#### Code Example / Key Takeaways
```java
@Embeddable class Address {
    String city; String country;
}
@Embedded Address address;
```

---

### Q447. Element collection
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
@ElementCollection persists basic values or embeddables in a collection table. Elements have no identity and the collection is commonly replaced as a unit.

#### Code Example / Key Takeaways
```java
@ElementCollection
@CollectionTable(name="user_phone", joinColumns=@JoinColumn(name="user_id"))
Set<String> phones;
```

---

### Q448. AttributeOverride
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
@AttributeOverride renames or changes a field of an embedded value for a particular owner, useful when embedding the same type twice.

#### Code Example / Key Takeaways
```java
@Embedded
@AttributeOverrides(@AttributeOverride(name="city", column=@Column(name="billing_city")))
Address billing;
```

---

### Q449. Nested embeddables
**Difficulty:** `Advanced`
**Category:** JPA, Hibernate & Security

#### Answer
Embeddables can contain other embeddables, letting domain value objects remain cohesive while columns stay in the owner table. Override nested paths when names collide.

#### Code Example / Key Takeaways
```java
@Embeddable class Contact {
    @Embedded Address address;
}
@Embedded Contact contact;
```

---

### Q450. JPQL basics
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
JPQL queries entities and their attributes, not table names and columns. Parameters should be named or positional; binding avoids injection and type conversion errors.

#### Code Example / Key Takeaways
```java
List<Customer> cs = em.createQuery(
    "select c from Customer c where c.email=:e", Customer.class)
    .setParameter("e", email).getResultList();
```

---

### Q451. JPQL joins
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
JPQL joins navigate mapped associations and can filter or select related data. join fetch also initializes the association, but collection fetch joins can duplicate root rows.

#### Code Example / Key Takeaways
```java
select o from Order o join o.customer c where c.id = :id
```

---

### Q452. JPQL bulk update
**Difficulty:** `Advanced`
**Category:** JPA, Hibernate & Security

#### Answer
Bulk UPDATE and DELETE operate directly in the database and bypass entity callbacks, dirty checking, and managed state. Clear or refresh the persistence context afterward.

#### Code Example / Key Takeaways
```java
int n = em.createQuery(
    "update Account a set a.active=false where a.lastLogin < :d")
    .setParameter("d", date).executeUpdate();
em.clear();
```

---

### Q453. HQL extensions
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Hibernate Query Language is JPQL-compatible but offers provider-specific features. Use JPQL for portability and HQL only when a Hibernate capability is intentional.

#### Code Example / Key Takeaways
```java
session.createQuery("from Customer c where c.email like :prefix", Customer.class)
    .setParameter("prefix", "a%").list();
```

---

### Q454. Criteria API
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Criteria builds type-safe dynamic queries without string concatenation. It is verbose but useful when predicates and joins are assembled conditionally.

#### Code Example / Key Takeaways
```java
CriteriaBuilder cb = em.getCriteriaBuilder();
CriteriaQuery<Customer> q = cb.createQuery(Customer.class);
Root<Customer> c = q.from(Customer.class);
q.where(cb.equal(c.get("active"), true));
List<Customer> r = em.createQuery(q).getResultList();
```

---

### Q455. Static metamodel
**Difficulty:** `Advanced`
**Category:** JPA, Hibernate & Security

#### Answer
The generated JPA metamodel replaces string property names in Criteria queries with compile-time symbols. Configure annotation processing to generate Customer_.

#### Code Example / Key Takeaways
```java
Root<Customer> c = q.from(Customer.class);
q.select(c).where(cb.equal(c.get(Customer_.active), true));
```

---

### Q456. Native SQL query
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Native queries use database SQL directly and are appropriate for vendor features, complex reporting, or tuned statements. Map the result carefully and avoid database-specific lock-in without need.

#### Code Example / Key Takeaways
```java
List<Customer> r = em.createNativeQuery(
    "select * from customers where status=?", Customer.class)
    .setParameter(1, "ACTIVE").getResultList();
```

---

### Q457. Named query
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
Named queries are defined once and validated or parsed early by the provider. They centralize frequently reused statements and can improve query plan reuse.

#### Code Example / Key Takeaways
```java
@NamedQuery(name="Customer.active", query="select c from Customer c where c.active=true")
```

---

### Q458. N+1 select problem
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
N+1 occurs when one query loads N parents and each lazy association triggers another query. Detect it with SQL logging and fix the access pattern rather than making everything eager.

#### Code Example / Key Takeaways
```java
List<Order> orders = repo.findAll();
orders.forEach(o -> o.getLines().size()); // potentially N+1
```

---

### Q459. Fetch join solution
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
A fetch join loads an association in the original query. Use distinct for collection joins and paginate cautiously because SQL row multiplication breaks many pagination strategies.

#### Code Example / Key Takeaways
```java
@Query("select distinct o from Order o join fetch o.lines")
List<Order> withLines();
```

---

### Q460. EntityGraph
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
@EntityGraph declares an attribute loading plan independently of JPQL. It is readable for repository methods and can override default fetch behavior for a use case.

#### Code Example / Key Takeaways
```java
@EntityGraph(attributePaths="lines")
Optional<Order> findById(Long id);
```

---

### Q461. Batch fetching
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Hibernate batch fetching groups lazy association loads into IN queries, reducing round trips without one huge join. Tune batch size and verify SQL for your database.

#### Code Example / Key Takeaways
```java
@BatchSize(size=25)
@OneToMany(mappedBy="order")
List<Line> lines;
```

---

### Q462. DTO projections for reads
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Selecting a DTO avoids managing full entities and avoids accidental lazy loads. Constructor expressions are portable JPQL and ideal for read-only API responses.

#### Code Example / Key Takeaways
```java
select new com.acme.OrderView(o.id, c.name)
from Order o join o.customer c
```

---

### Q463. Subselect fetching
**Difficulty:** `Advanced`
**Category:** JPA, Hibernate & Security

#### Answer
@Fetch(FetchMode.SUBSELECT) loads a collection with a single additional query using a subselect derived from the original query. It works well for larger collections when the parent query has no join fetch.

#### Code Example / Key Takeaways
```java
@OneToMany(mappedBy="order")
@Fetch(FetchMode.SUBSELECT)
List<Line> lines;
```

---

### Q464. Persistence context L1 cache
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
Each EntityManager has a first-level cache. Repeated find calls for the same identity return the managed instance; it is mandatory, scoped to the persistence context, and not shared between requests.

#### Code Example / Key Takeaways
```java
Customer a = em.find(Customer.class, 1L);
Customer b = em.find(Customer.class, 1L);
assert a == b;
```

---

### Q465. Second-level cache
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
L2 cache is shared across persistence contexts and must be explicitly configured. Cache entities only when their change rate and access pattern justify invalidation complexity.

#### Code Example / Key Takeaways
```java
@Cacheable
@org.hibernate.annotations.Cache(usage=CacheConcurrencyStrategy.READ_WRITE)
class Country {}
```

---

### Q466. Ehcache L2 provider
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Ehcache can provide a durable, configurable Hibernate second-level cache through JCache or a native integration. Configure regions, expiry, and provider properties; it is not a substitute for database correctness.

#### Code Example / Key Takeaways
```java
spring.jpa.properties.hibernate.cache.use_second_level_cache=true
spring.jpa.properties.hibernate.javax.cache.provider=org.ehcache.jsr107.EhcacheCachingProvider
```

---

### Q467. Caffeine caching
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Caffeine is an in-memory high-performance cache often used through Spring Cache. It is generally application-local; use a distributed cache when multiple nodes must share entries.

#### Code Example / Key Takeaways
```java
@Cacheable(cacheNames="countries", key="#id")
Country get(Long id) {
    return repo.findById(id).orElseThrow();
}
```

---

### Q468. Query cache
**Difficulty:** `Advanced`
**Category:** JPA, Hibernate & Security

#### Answer
Hibernate query cache stores query result identifiers, not complete rows, and depends on L2 entity cache for objects. Updates invalidate regions, so use it only for stable, repeated queries.

#### Code Example / Key Takeaways
```java
query.setHint("org.hibernate.cacheable", true);
```

---

### Q469. Cache concurrency strategies
**Difficulty:** `Advanced`
**Category:** JPA, Hibernate & Security

#### Answer
READ_ONLY suits immutable data; NONSTRICT_READ_WRITE tolerates brief staleness; READ_WRITE adds coordination; TRANSACTIONAL requires a compatible transactional cache. Choose based on consistency needs.

#### Code Example / Key Takeaways
```java
@Cache(usage=CacheConcurrencyStrategy.READ_ONLY)
class Currency {}
```

---

### Q470. @Transactional boundary
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
@Transactional binds an EntityManager and transaction to a service method. Keep the boundary around a business operation, not a controller, and remember self-invocation bypasses proxies.

#### Code Example / Key Takeaways
```java
@Transactional
public void transfer(long from, long to, BigDecimal amount) {
    debit(from, amount);
    credit(to, amount);
}
```

---

### Q471. Transaction propagation
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
REQUIRED joins or creates a transaction; REQUIRES_NEW suspends the current one; SUPPORTS is optional; MANDATORY requires one; NEVER rejects one. Pick semantics deliberately for side effects.

#### Code Example / Key Takeaways
```java
@Transactional(propagation=Propagation.REQUIRES_NEW)
void writeAudit(Audit a) {}
```

---

### Q472. Transaction isolation
**Difficulty:** `Advanced`
**Category:** JPA, Hibernate & Security

#### Answer
Isolation controls visibility of concurrent changes: READ_COMMITTED is a common default, REPEATABLE_READ prevents non-repeatable reads, and SERIALIZABLE is strongest but costly. Database support varies.

#### Code Example / Key Takeaways
```java
@Transactional(isolation=Isolation.READ_COMMITTED)
void reserve() {
    // atomic DB update
}
```

---

### Q473. Rollback rules
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Spring rolls back unchecked exceptions by default. Configure rollbackFor for checked exceptions, and avoid catching failures unless you rethrow or mark rollback-only.

#### Code Example / Key Takeaways
```java
@Transactional(rollbackFor=IOException.class)
void importFile() throws IOException {}
```

---

### Q474. Read-only transactions
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
readOnly=true communicates intent and may enable provider optimizations; it does not universally enforce that no writes occur. Do not rely on it as authorization or data protection.

#### Code Example / Key Takeaways
```java
@Transactional(readOnly=true)
List<Customer> search(String text) {
    return repo.findByNameContaining(text);
}
```

---

### Q475. Transaction timeout
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
A timeout limits transaction duration and helps release locks under slow work. It is a guardrail, not a performance fix; keep remote calls outside database transactions.

#### Code Example / Key Takeaways
```java
@Transactional(timeout=5)
void updateInventory() {}
```

---

### Q476. Declarative vs programmatic transactions
**Difficulty:** `Advanced`
**Category:** JPA, Hibernate & Security

#### Answer
Declarative @Transactional is the default and sufficient for most cases. Programmatic TransactionTemplate gives fine-grained control when business logic needs multiple commit boundaries in one method.

#### Code Example / Key Takeaways
```java
@Autowired PlatformTransactionManager tx;
TransactionTemplate tt = new TransactionTemplate(tx);
tt.execute(status -> { /* work */ return result; });
```

---

### Q477. Repository abstraction
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
JpaRepository supplies CRUD, paging, sorting, and flush operations for an entity and identifier. Spring creates the implementation from the interface.

#### Code Example / Key Takeaways
```java
interface CustomerRepository extends JpaRepository<Customer, Long> {}
```

---

### Q478. Derived query methods
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
Spring Data parses method names into predicates. Use clear names for simple queries; switch to @Query when names become unreadable.

#### Code Example / Key Takeaways
```java
List<Customer> findByActiveTrueAndNameContainingIgnoreCase(String name);
```

---

### Q479. @Query repository query
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
@Query defines JPQL on a repository method and supports named parameters. Use a modifying query for updates and manage its persistence context explicitly.

#### Code Example / Key Takeaways
```java
@Query("select c from Customer c where c.email=:email")
Optional<Customer> findByEmail(@Param("email") String email);
```

---

### Q480. Modifying repository query
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
@Modifying marks UPDATE or DELETE queries so Spring executes them as writes. clearAutomatically prevents stale managed entities after bulk SQL.

#### Code Example / Key Takeaways
```java
@Modifying(clearAutomatically=true)
@Query("delete from Customer c where c.active=false")
int deleteInactive();
```

---

### Q481. Paging and sorting
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
Pageable applies limit/offset and sorting while Page includes a count query. Slice avoids the count when callers only need to know whether another page exists.

#### Code Example / Key Takeaways
```java
Page<Customer> findByActiveTrue(Pageable page);
```

---

### Q482. Specifications
**Difficulty:** `Advanced`
**Category:** JPA, Hibernate & Security

#### Answer
JpaSpecificationExecutor composes reusable Criteria predicates for optional filters. It keeps dynamic search logic out of string-built JPQL.

#### Code Example / Key Takeaways
```java
Specification<Customer> active = (r, q, cb) -> cb.isTrue(r.get("active"));
repo.findAll(active);
```

---

### Q483. Interface projections
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Interface projections select only requested properties and expose a lightweight view. Nested projections can traverse associations but may still trigger joins or loads.

#### Code Example / Key Takeaways
```java
interface NameView { String getName(); }
List<NameView> findByActiveTrue();
```

---

### Q484. Class and record projections
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Class projections use constructor expressions or repository support to create immutable result objects. They are useful at service boundaries where entities should not escape.

#### Code Example / Key Takeaways
```java
record CustomerView(Long id, String name) {}
@Query("select new com.acme.CustomerView(c.id, c.name) from Customer c")
List<CustomerView> views();
```

---

### Q485. Query by example
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Query by Example builds a dynamic predicate from a probe instance with matching rules. It is convenient for filter forms but less explicit than specifications for complex queries.

#### Code Example / Key Takeaways
```java
Example<Customer> ex = Example.of(new Customer(null, "A%", true));
repo.findAll(ex);
```

---

### Q486. Auditing timestamps
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
Spring Data auditing populates creation and modification timestamps when auditing is enabled. Use an auditable base class or annotations and ensure the entity is managed through Spring Data.

#### Code Example / Key Takeaways
```java
@CreatedDate Instant createdAt;
@LastModifiedDate Instant updatedAt;
```

---

### Q487. AuditorAware
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
AuditorAware supplies the current principal for @CreatedBy and @LastModifiedBy. Return empty for system jobs or unauthenticated operations rather than inventing a user.

#### Code Example / Key Takeaways
```java
class CurrentAuditor implements AuditorAware<String> {
    public Optional<String> getCurrentAuditor() {
        return Optional.of("system");
    }
}
```

---

### Q488. Enable JPA auditing
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
@EnableJpaAuditing activates entity listeners that fill audit fields. Register AuditorAware when actor identity is required.

#### Code Example / Key Takeaways
```java
@Configuration @EnableJpaAuditing
class AuditConfig {}
```

---

### Q489. Auditing entity listener
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
AuditingEntityListener connects lifecycle callbacks to Spring Data's auditing handler. Add it to entities or a mapped superclass, and do not confuse it with database triggers.

#### Code Example / Key Takeaways
```java
@EntityListeners(AuditingEntityListener.class)
@MappedSuperclass class Audited {
    @CreatedDate Instant created;
}
```

---

### Q490. Authentication versus authorization
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
Authentication establishes who the caller is; authorization decides what that principal may do. Spring Security stores the authenticated principal in SecurityContext for downstream checks.

#### Code Example / Key Takeaways
```java
SecurityContextHolder.getContext().getAuthentication().getName();
```

---

### Q491. Security filter chain
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
The filter chain intercepts requests before controllers, extracts credentials, establishes security context, applies CSRF/session rules, and enforces authorization. Order matters.

#### Code Example / Key Takeaways
```java
@Bean SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http.authorizeHttpRequests(a -> a
        .requestMatchers("/public/**").permitAll()
        .anyRequest().authenticated()).build();
}
```

---

### Q492. Password encoding
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
Passwords must be stored as slow, salted one-way hashes, never plaintext or reversible encryption. DelegatingPasswordEncoder supports an algorithm id and future migration.

#### Code Example / Key Takeaways
```java
PasswordEncoder encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
String hash = encoder.encode(rawPassword);
```

---

### Q493. Method security
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Method security enforces authorization at service methods, including calls not originating from HTTP. Enable it and express rules with roles or authorities.

#### Code Example / Key Takeaways
```java
@EnableMethodSecurity
@PreAuthorize("hasRole('ADMIN')")
void deleteUser(long id) {}
```

---

### Q494. CSRF and stateless APIs
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
CSRF protects browser sessions because browsers attach cookies automatically. A stateless bearer-token API commonly disables CSRF only when it does not authenticate through cookies.

#### Code Example / Key Takeaways
```java
http.csrf(csrf -> csrf.disable())
    .oauth2ResourceServer(o -> o.jwt());
```

---

### Q495. JWT structure
**Difficulty:** `Basic`
**Category:** JPA, Hibernate & Security

#### Answer
A JWT has base64url header, claims payload, and signature separated by dots. The signature authenticates integrity; claims such as exp and iss still require validation.

#### Code Example / Key Takeaways
```java
String[] parts = token.split("\\.");
assert parts.length == 3; // header.payload.signature
```

---

### Q496. JWT validation
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Validate signature, issuer, audience, expiration, and required scopes using a trusted key source. Never trust decoded payload claims before signature verification.

#### Code Example / Key Takeaways
```java
JwtDecoder decoder = JwtDecoders.fromIssuerLocation("https://issuer.example");
```

---

### Q497. OAuth2 resource server
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
A resource server accepts access tokens issued by an authorization server and maps validated scopes/claims to authorities. It does not issue tokens.

#### Code Example / Key Takeaways
```java
http.oauth2ResourceServer(o -> o
    .jwt(jwt -> jwt.jwtAuthenticationConverter(converter)));
```

---

### Q498. OAuth2 scopes and authorities
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Scopes represent delegated permissions and are commonly mapped to SCOPE_x authorities. Keep endpoint requirements least-privilege and distinguish roles from scopes.

#### Code Example / Key Takeaways
```java
@PreAuthorize("hasAuthority('SCOPE_orders.read')")
List<Order> orders() {}
```

---

### Q499. JWT method security
**Difficulty:** `Advanced`
**Category:** JPA, Hibernate & Security

#### Answer
Combine request and method checks so defense in depth protects service calls. Use a stable claim-to-authority converter and test missing, expired, and insufficient scopes.

#### Code Example / Key Takeaways
```java
@PreAuthorize("#owner == authentication.name or hasAuthority('SCOPE_admin')")
Order read(String owner) {}
```

---

### Q500. Spring Security test support
**Difficulty:** `Intermediate`
**Category:** JPA, Hibernate & Security

#### Answer
Spring Security test annotations like @WithMockUser and @WithUserDetails simulate authentication in integration tests without a full login flow. Use them to verify authorization logic.

#### Code Example / Key Takeaways
```java
@Test @WithMockUser(roles="ADMIN")
void adminCanDelete() { ... }

@Test @WithMockUser(username="alice")
void userSeesOwnData() { ... }
```