// ponytail: in-memory data, swap for DB if persistence needed
export const questions = [
  // Java Core
  {
    id: 1,
    category: "Java Core",
    question: "What is the difference between JDK, JRE, and JVM?",
    answer: `JVM (Java Virtual Machine) is the runtime engine that executes Java bytecode. It's platform-specific and provides the "write once, run anywhere" capability.

JRE (Java Runtime Environment) includes JVM + core libraries needed to run Java applications. It's for users who only need to run Java programs.

JDK (Java Development Kit) includes JRE + development tools (compiler, debugger, javadoc). It's for developers who need to compile and develop Java applications.`
  },
  {
    id: 2,
    category: "Java Core",
    question: "Explain the difference between abstract classes and interfaces in Java.",
    answer: `Abstract Classes:
- Can have both abstract and concrete methods
- Can have instance variables and constructors
- Single inheritance only
- Can have any visibility (public, protected, private)

Interfaces (Java 8+):
- All methods are implicitly public abstract (except default and static)
- Can have default methods with implementation
- Can have static methods and constant variables
- Multiple implementation allowed
- No instance variables (only public static final constants)

Use abstract classes when you share code among related classes. Use interfaces for unrelated classes or when you need multiple inheritance.

---

**Quick Comparison Table**

| Feature | Abstract Class | Interface |
|---------|---------------|-----------|
| Keyword | abstract class | interface |
| Methods | Abstract + concrete | Abstract, default, static |
| Variables | Instance variables | public static final only |
| Constructor | Yes | No |
| Access Modifiers | Any | public (except private methods) |
| Multiple Inheritance | Single | Multiple |
| State | Can maintain state | Cannot maintain state |

---

**Abstract Class Example**
\`\`\`java
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
\`\`\`

**Interface Example**
\`\`\`java
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
\`\`\`

---

**When to Use Each**

**Abstract Class** – Strong IS-A relationship, shared code/state:
\`\`\`text
Animal
├── Dog
└── Cat
\`\`\`
All animals share: name, age, eat()

**Interface** – Define a capability for unrelated classes:
\`\`\`text
Flyable
├── Bird
└── Airplane
\`\`\`

---

**Java 8+ Interface Features**
- **Default methods**: Provide implementation in interface
- **Static methods**: Utility methods on interface

---

**Real-World Example (Spring Boot)**

**Interface** – Multiple implementations of same contract:
\`\`\`java
public interface NotificationService {
    void sendNotification(String message);
}

// Implementations
EmailNotificationService
SMSNotificationService
PushNotificationService
\`\`\`

**Abstract Class** – Shared base logic for related classes:
\`\`\`java
abstract class BaseController {
    protected void validateRequest() {
        System.out.println("Validation done");
    }
    abstract void process();
}
\`\`\`

---

**Short Interview Answer**
> "An abstract class is used when we have a common base class where we want to share state and implementation among related classes. An interface defines a contract that multiple unrelated classes can implement. Abstract classes support constructors and instance variables; interfaces support multiple inheritance. Since Java 8, interfaces can also have default and static methods."`
  },
  {
    id: 3,
    category: "Java Core",
    question: "What is the difference between checked and unchecked exceptions?",
    answer: `Checked Exceptions:
- Must be declared in method signature or handled with try-catch
- Compiler enforces handling
- Examples: IOException, SQLException, ClassNotFoundException
- Recoverable conditions

Unchecked Exceptions (RuntimeExceptions):
- Not required to be declared or handled
- Examples: NullPointerException, ArrayIndexOutOfBoundsException, IllegalArgumentException
- Usually programming bugs
- Can be caught but not required`
  },
  {
    id: 4,
    category: "Java Core",
    question: "What is the purpose of the 'static' keyword in Java?",
    answer: `The static keyword makes a member belong to the class rather than instances:
- Static variables: One copy shared by all instances (class variables)
- Static methods: Can be called without creating an instance
- Static blocks: Run once when class is loaded
- Static nested classes: Nested class that doesn't need outer instance

Common use: constants (static final), utility methods, main method.`
  },
  {
    id: 5,
    category: "Java Core",
    question: "Explain the Java garbage collection mechanism.",
    answer: `Garbage Collection (GC) automatically reclaims memory from objects no longer referenced:

GC Algorithm basics:
1. Mark: Identify all reachable objects from GC roots
2. Sweep: Remove unreachable objects
3. Compact: Move objects to reduce fragmentation

Generational GC:
- Young Generation: Short-lived objects (Eden, Survivor spaces)
- Old Generation: Long-lived objects
- Most objects die young, so this is efficient

Common collectors:
- Serial GC: Single thread, stop-the-world
- Parallel GC: Multi-threaded, throughput-focused
- G1 GC: Region-based, balanced latency/throughput
- ZGC: Scalable, low-latency`
  },
  // React
  {
    id: 6,
    category: "React",
    question: "What is the difference between useState and useReducer?",
    answer: `useState:
- Simple state management for independent values
- Returns [state, setState]
- Best for primitive values or simple state
- setState can take value or function

useReducer:
- Complex state logic with multiple sub-values
- Returns [state, dispatch]
- Best for complex state transitions
- Logic centralized in reducer function
- Enables testing reducers in isolation
- Useful when next state depends on previous`
  },
  {
    id: 7,
    category: "React",
    question: "Explain the React component lifecycle.",
    answer: `Class Components (legacy):
- constructor → render → componentDidMount → (updates) → componentWillUnmount

Hooks (modern):
- useEffect handles most lifecycle

Mount:
- Component renders first time
- useEffect(() => {}, []) runs once

Update:
- State/props change triggers re-render
- useEffect(() => {}, [deps]) runs when deps change

Unmount:
- Component removed from DOM
- useEffect(() => return cleanup, []) cleanup runs

Key hooks: useEffect, useLayoutEffect (sync after DOM mutations), useMemo, useCallback for optimization.`
  },
  {
    id: 8,
    category: "React",
    question: "What is the Virtual DOM and how does React use it?",
    answer: `Virtual DOM is a lightweight JavaScript representation of the real DOM.

How it works:
1. State changes create new virtual DOM tree
2. React compares new vs previous virtual DOM (diffing)
3. React calculates minimum changes needed (reconciliation)
4. React updates only changed elements in real DOM

Benefits:
- Minimizes direct DOM manipulation (slow)
- Batches updates
- Enables declarative UI
- Cross-platform (React Native uses same concept)

React's diffing algorithm:
- Same element type → preserve
- Different type → replace
- Keys help identify moved items`
  },
  {
    id: 9,
    category: "React",
    question: "What is the difference between controlled and uncontrolled components?",
    answer: `Controlled Component:
- Form data handled by React state
- Value comes from props, changes via callbacks
- Single source of truth in React
- Easier to validate and transform

Example:
<input value={name} onChange={e => setName(e.target.value)} />

Uncontrolled Component:
- Form data handled by DOM itself
- Uses ref to access values
- Less code, more like traditional HTML
- Useful for integrations with non-React code

Example:
<input ref={inputRef} />
const value = inputRef.current.value

Prefer controlled components for complex forms.`
  },
  {
    id: 10,
    category: "React",
    question: "Explain React hooks rules and why they exist.",
    answer: `Hooks Rules:
1. Only call hooks at top level (not in loops, conditions, nested functions)
2. Only call hooks from React functions (components or custom hooks)

Why:
- React relies on call order to track state between renders
- Calling conditionally would break this order
- Ensures hooks are called same number of times each render

ESLint plugin (eslint-plugin-react-hooks) enforces these rules.

Custom hooks:
- Start with "use" (useAuth, useFetch)
- Can call other hooks internally
- Share stateful logic between components`
  },
  // Spring Boot
  {
    id: 11,
    category: "Spring Boot",
    question: "What is dependency injection and how does Spring implement it?",
    answer: `Dependency Injection (DI) is a design pattern where a framework manages object dependencies rather than objects creating them themselves.

Spring implements DI via:
1. Constructor Injection (preferred)
   @Service
   public class UserService {
     private final UserRepository userRepo;
     public UserService(UserRepository userRepo) {
       this.userRepo = userRepo;
     }
   }

2. Setter Injection
   @Autowired
   public void setUserRepository(UserRepository userRepo) {...}

3. Field Injection (not recommended)
   @Autowired
   private UserRepository userRepo;

Benefits: Loose coupling, testability, flexibility`
  },
  {
    id: 12,
    category: "Spring Boot",
    question: "What is the difference between @Component, @Service, and @Repository?",
    answer: `@Component - Generic stereotype for any Spring-managed bean
@Service - Specialized for service layer beans (semantic)
@Repository - Specialized for DAO/data access beans (adds exception translation)
@Controller - For web controllers (MVC)
@RestController - Combination of @Controller + @ResponseBody

All are stereotypes of @Component. Spring treats them similarly but:
- @Repository: Adds automatic exception translation (SQLException → DataAccessException)
- @Service, @Controller: Allow future enhancements (logging, transactions)
- Better for AOP targeting specific layers`
  },
  {
    id: 13,
    category: "Spring Boot",
    question: "Explain Spring Boot auto-configuration.",
    answer: `Auto-configuration attempts to automatically configure Spring application based on:
1. Dependencies in classpath (spring-boot-starter-*)
2. Your @EnableAutoConfiguration or @SpringBootApplication
3. Property configurations (application.properties/yml)

How it works:
- @SpringBootApplication = @ComponentScan + @EnableAutoConfiguration + @Configuration
- Auto-configurations defined in META-INF/spring.factories or spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports (Spring Boot 3+)
- Conditional annotations (@ConditionalOnClass, @ConditionalOnProperty) control activation

You can exclude: @SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
Or via: spring.autoconfigure.exclude property`
  },
  // JavaScript
  {
    id: 14,
    category: "JavaScript",
    question: "Explain the difference between var, let, and const.",
    answer: `var:
- Function-scoped
- Hoisted (initialized as undefined)
- Can be redeclared
- Avoid in modern JS

let:
- Block-scoped
- Hoisted but in "temporal dead zone" (ReferenceError if accessed before)
- Can be reassigned
- Preferred for variables that change

const:
- Block-scoped
- Cannot be reassigned (but object properties can mutate)
- Must be initialized at declaration
- Preferred for values that won't change

Key: Use const by default, let when reassignment needed, never var.`
  },
  {
    id: 15,
    category: "JavaScript",
    question: "What is closure in JavaScript?",
    answer: `A closure is a function that remembers variables from its outer scope even after the outer function has returned.

Example:
function createCounter() {
  let count = 0;
  return function() {
    return ++count;
  };
}
const counter = createCounter();
counter(); // 1
counter(); // 2

Use cases:
- Data privacy / encapsulation
- Function factories
- Event handlers
- Maintaining state in callbacks

Every function in JavaScript forms a closure.`
  },
  {
    id: 16,
    category: "JavaScript",
    question: "Explain async/await vs Promises.",
    answer: `Promises:
- Represent eventual completion of async operations
- .then() chaining can get nested
- Promise.all(), Promise.race() for parallelism

async/await:
- Syntactic sugar over Promises
- Looks like synchronous code
- try/catch for error handling
- Makes async code more readable

Key differences:
- async functions always return a Promise
- await pauses execution until Promise resolves
- Cannot use await outside async function
- try/catch syncs error handling

Best practice: async/await for readability, Promise methods for parallelism.`
  },
  {
    id: 17,
    category: "JavaScript",
    question: "What is the event loop in JavaScript?",
    answer: `JavaScript is single-threaded but handles async via event loop:

1. Call Stack: Executes synchronous code
2. Web APIs: Handles async operations (setTimeout, fetch)
3. Task Queue: Queues callback tasks
4. Microtask Queue: Promises, queueMicrotask
5. Event Loop: Moves tasks from queues to call stack

Execution order:
1. Sync code on call stack
2. Microtasks (Promises)
3. Macrotasks (setTimeout, I/O)

Note: Async/await with await behaves like creating microtasks. Multiple async operations with await execute sequentially; use Promise.all() for parallelism.`
  },
  // Database
  {
    id: 18,
    category: "Database",
    question: "Explain the difference between SQL and NoSQL databases.",
    answer: `SQL (Relational):
- Structured data with schemas
- ACID transactions
- Tables with rows and columns
- Complex queries with JOINs
- Examples: PostgreSQL, MySQL, Oracle
- Vertical scaling

NoSQL (Non-relational):
- Flexible/Schema-less or JSON-like
- Eventual consistency (usually)
- Key-value, document, column, graph
- Horizontal scaling
- Examples: MongoDB, Redis, Cassandra

Choose SQL for: Structured data, complex relationships, transactions
Choose NoSQL for: Unstructured data, high scale, rapid development`
  },
  {
    id: 19,
    category: "Database",
    question: "What is database indexing and why is it important?",
    answer: `Index is a data structure that improves query speed at the cost of storage and write overhead.

How it works:
- Like book's index page
- B-tree most common (O(log n) lookups)
- Hash indexes for exact matches

Types:
- Single-column: Index on one column
- Composite: Index on multiple columns (order matters)
- Unique: No duplicates allowed
- Primary: UNIQUE + NOT NULL, clustered by default

When to index:
- Columns in WHERE, JOIN, ORDER BY
- High-cardinality (many unique values) columns

When NOT to index:
- Small tables
- Frequently updated columns
- Low-cardinality (boolean, gender)`
  },
  {
    id: 20,
    category: "Database",
    question: "What are ACID properties in databases?",
    answer: `ACID ensures reliable database transactions:

Atomicity:
- All operations succeed or all fail
- No partial states
- Example: Bank transfer either completes fully or not at all

Consistency:
- Database moves from one valid state to another
- Constraints, triggers maintain integrity
- No orphaned records

Isolation:
- Concurrent transactions don't interfere
- Each sees consistent snapshot
- Levels: READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE

Durability:
- Committed data survives crashes
- Write-ahead logs, backups
- fsync() ensures disk persistence`
  }
]