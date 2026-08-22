# Spring Framework, Spring Boot & Microservices Interview Questions (Q351–Q425)

---

### Q351. What is Inversion of Control (IoC) in the Spring Framework?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
Inversion of Control (IoC) is a design principle where the responsibility of creating and managing objects is handed over from the application code to the Spring container. Instead of classes instantiating their own dependencies with `new`, the container creates them and "wires" them together. This reduces coupling, improves testability, and centralizes object lifecycle management. The Spring IoC container reads configuration metadata (annotations, Java config, or XML) to know which beans to create and how to inject dependencies.

#### Code Example / Key Takeaways
```java
// Tight coupling (no IoC)
class OrderService {
    private PaymentService payment = new PaymentService(); // manual creation
}

// Loose coupling with IoC
@Component
class OrderService {
    private final PaymentService payment;
    public OrderService(PaymentService payment) { this.payment = payment; }
}
```

---

### Q352. What is Dependency Injection (DI) and What Are Its Types?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer

Dependency Injection (DI) is a design pattern where an object's dependencies are provided from outside instead of the object creating them itself.

In simple words:

> "DI is a technique where the responsibility of creating and managing dependencies is transferred from the class itself to an external container or framework."

It helps achieve loose coupling, better testability, and easier maintenance.

---

### Without Dependency Injection (Tight Coupling)

```java
class EmailService {
    public void sendEmail() {
        System.out.println("Sending email");
    }
}

class NotificationService {
    private EmailService emailService;

    NotificationService() {
        this.emailService = new EmailService();
    }

    public void notifyUser() {
        emailService.sendEmail();
    }
}
```

**Problem:** `NotificationService` is tightly coupled with `EmailService`. If we need `SMSService` or `PushNotificationService`, we must modify `NotificationService`.

---

### With Dependency Injection (Loose Coupling)

```java
interface MessageService {
    void sendMessage();
}

class EmailService implements MessageService {
    public void sendMessage() {
        System.out.println("Sending Email");
    }
}

class NotificationService {
    private MessageService messageService;

    NotificationService(MessageService messageService) {
        this.messageService = messageService;
    }

    public void notifyUser() {
        messageService.sendMessage();
    }
}

public class Main {
    public static void main(String[] args) {
        MessageService service = new EmailService();
        NotificationService notification = new NotificationService(service);
        notification.notifyUser();
    }
}
```

Now `NotificationService` does not care about the implementation.

---

### Types of Dependency Injection

There are mainly three types:

1. **Constructor Injection** (Recommended)
2. **Setter Injection**
3. **Field Injection**

---

### 1. Constructor Injection (Recommended)

Dependency is provided through the constructor.

```java
@Service
class OrderService {
    private final PaymentService paymentService;

    @Autowired
    OrderService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
}
```

**Advantages:**
- ✅ Dependency is mandatory
- ✅ Object is always in a valid state
- ✅ Supports immutability (`final` fields)
- ✅ Easier unit testing

**Example test:**
```java
PaymentService payment = new MockPaymentService();
OrderService service = new OrderService(payment);
```

---

### 2. Setter Injection

Dependency is provided using a setter method.

```java
class OrderService {
    private PaymentService paymentService;

    @Autowired
    public void setPaymentService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
}
```

**Advantages:**
- ✅ Useful for optional dependencies
- ✅ Dependency can be changed later

**Disadvantages:**
- ❌ Object can exist without dependency
- ❌ Mutable state

---

### 3. Field Injection

Dependency is injected directly into the field.

```java
@Service
class OrderService {
    @Autowired
    private PaymentService paymentService;
}
```

**Advantages:**
- Less code
- Easy to write

**Disadvantages:**
- ❌ Difficult to unit test
- ❌ Uses reflection
- ❌ Cannot make field `final`
- ❌ Hides class dependencies

> Most Spring Boot projects avoid field injection.

---

### Dependency Injection in Spring Boot

Spring provides an IoC container called **ApplicationContext** that manages object creation and dependency injection.

```java
@Service
class UserService {
    private final UserRepository repository;

    UserService(UserRepository repository) {
        this.repository = repository;
    }
}
```

Spring automatically:
1. Creates `UserRepository` bean
2. Creates `UserService` bean
3. Injects repository into `UserService`

---

### DI vs IoC

| Dependency Injection | Inversion of Control |
|---------------------|---------------------|
| Technique to provide dependencies | Principle of transferring control |
| Achieved through constructor/setter/field injection | Achieved using frameworks like Spring |
| Part of IoC | Broader concept |

**Example:**
```
Spring IoC Container
          |
          v
Dependency Injection
          |
          v
Object gets required dependency
```

---

### Real-Time Spring Boot Example

**Controller:**
```java
@RestController
class UserController {
    private final UserService userService;

    UserController(UserService userService) {
        this.userService = userService;
    }
}
```

**Service:**
```java
@Service
class UserService {
    private final UserRepository repository;

    UserService(UserRepository repository) {
        this.repository = repository;
    }
}
```

**Repository:**
```java
@Repository
interface UserRepository extends JpaRepository<User, Long> {}
```

**Flow:**
```
UserController
        |
        v
    UserService
        |
        v
 UserRepository
```

Spring creates and injects these objects automatically.

---

### Interview Answer (Short Version)

> "Dependency Injection is a design pattern where dependencies are provided to a class from an external source instead of the class creating them itself. It helps achieve loose coupling and improves testability. The three types of DI are constructor injection, setter injection, and field injection. In Spring Boot, constructor injection is preferred because it makes dependencies mandatory, supports immutability, and makes unit testing easier."

---

### Follow-up Interview Questions

**Q1. Why is constructor injection preferred in Spring Boot?**
- Supports immutable fields
- Makes dependencies mandatory
- Easier mocking in unit tests
- Avoids reflection

**Q2. What is the difference between DI and Service Locator?**
- DI → dependency is given to the object
- Service Locator → object asks for dependency

**Q3. What happens internally when Spring performs DI?**
1. Scans classes using component scanning
2. Creates beans
3. Stores beans in ApplicationContext
4. Resolves dependencies
5. Injects required objects into beans

#### Code Example / Key Takeaways
```java
@Component
class UserService {
    private final UserRepository repo;          // constructor
    private EmailService email;                 // setter

    public UserService(UserRepository repo) { this.repo = repo; }

    @Autowired
    public void setEmailService(EmailService email) { this.email = email; }

    @Autowired private AuditService audit;      // field (discouraged)
}
```

---

### Q353. What is the difference between Constructor, Setter and Field injection?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
- **Constructor**: Dependencies are final/immutable, injected at creation, ideal for required beans, enables easy unit testing without a Spring context, and prevents partially-initialized objects. This is the recommended approach.
- **Setter**: Allows optional dependencies and post-construction reconfiguration; useful when a dependency is optional or circular references exist.
- **Field**: Shortest syntax but cannot be used for `final` fields, makes unit testing without reflection difficult, and hides the class's dependencies. Spring itself discourages it.

#### Code Example / Key Takeaways
```java
// Preferred: constructor injection
@Service
public class AccountService {
    private final AccountRepository repo;
    public AccountService(AccountRepository repo) { this.repo = repo; }
}
```

---

### Q354. What is the Spring IoC container and the difference between BeanFactory and ApplicationContext?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
The **IoC container** is the core of Spring and is responsible for instantiating, configuring, and assembling beans. There are two main interfaces:

- **BeanFactory**: The basic container; lazy-instantiates beans on first request. Lightweight, suitable for resource-constrained environments.
- **ApplicationContext**: A superset of BeanFactory that adds enterprise features: event propagation, internationalization (MessageSource), AOP integration, and eager singleton instantiation by default. This is what most applications use (e.g., `AnnotationConfigApplicationContext`, `ClassPathXmlApplicationContext`).

#### Code Example / Key Takeaways
```java
ApplicationContext ctx =
    new AnnotationConfigApplicationContext(AppConfig.class);
UserService svc = ctx.getBean(UserService.class);
```

---

### Q355. How does Spring resolve which bean to inject when multiple candidates exist?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
When multiple beans of the same type exist, Spring throws a `NoUniqueBeanDefinitionException`. You resolve ambiguity with:
- `@Primary` – marks one bean as the default choice.
- `@Qualifier("name")` – explicitly names the bean to inject.
- Custom qualifier annotations for type-safe selection.

#### Code Example / Key Takeaways
```java
@Primary @Component
class MySQLRepo implements UserRepository {}

@Component @Qualifier("mongo")
class MongoRepo implements UserRepository {}

@Autowired
public UserService(@Qualifier("mongo") UserRepository repo) { ... }
```

---

### Q356. What is `@Component` and how does component scanning work?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
`@Component` is a generic stereotype annotation that marks a class as a Spring-managed bean. Component scanning (enabled by `@ComponentScan` or `@SpringBootApplication`) automatically detects classes annotated with `@Component` (and its specializations) on the classpath and registers them as beans. The default scan starts from the package of the configuration class and recurses downward.

#### Code Example / Key Takeaways
```java
@Configuration
@ComponentScan("com.example.service")
public class AppConfig {}

@Component
public class NotificationService {}
```

---

### Q357. What is the difference between `@Component`, `@Service`, `@Repository` and `@Controller`?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
All four are stereotypes that register a class as a bean. The difference is semantic and behavioral:
- `@Component`: generic stereotype.
- `@Service`: marks a service-layer/business-logic class.
- `@Repository`: marks a persistence-layer class; additionally enables automatic translation of persistence exceptions into Spring's `DataAccessException` hierarchy.
- `@Controller`: marks a web MVC controller that returns views; `@RestController` is its REST variant returning data directly.

Using the specific annotations conveys intent and unlocks targeted features (e.g., AOP pointcuts by stereotype, exception translation for repositories).

#### Code Example / Key Takeaways
```java
@Repository public class UserRepository { /* DAO */ }
@Service public class UserService { /* business logic */ }
@RestController public class UserController { /* REST endpoints */ }
```

---

### Q358. What is `@Configuration` and `@Bean`?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
`@Configuration` marks a class as a source of bean definitions. Methods annotated with `@Bean` inside it return objects that Spring registers as beans in the container. This is Java-based configuration (an alternative to XML). It is used for third-party classes you cannot annotate, or when you need explicit control over bean construction. `@Configuration` classes use CGLIB proxying so that calling `@Bean` methods returns the same singleton instance.

#### Code Example / Key Takeaways
```java
@Configuration
public class AppConfig {
    @Bean
    public DataSource dataSource() {
        return new HikariDataSource();
    }
}
```

---

### Q359. Explain the Spring Bean Lifecycle.
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
The bean lifecycle is:
1. Container reads configuration and instantiates the bean.
2. Dependencies are injected (populate properties).
3. If `BeanNameAware`, `BeanFactoryAware`, etc., callbacks fire.
4. `BeanPostProcessor.postProcessBeforeInitialization` runs.
5. `@PostConstruct` / `InitializingBean.afterPropertiesSet` runs.
6. `BeanPostProcessor.postProcessAfterInitialization` runs (AOP proxies are applied here).
7. Bean is ready for use.
8. On container shutdown: `@PreDestroy` / `DisposableBean.destroy` runs.

#### Code Example / Key Takeaways
```java
@Component
public class CacheManager {
    @PostConstruct public void init() { loadCache(); }
    @PreDestroy public void cleanup() { flushCache(); }
}
```

---

### Q360. How do you customize bean initialization and destruction?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
Three ways:
1. JSR-250 annotations `@PostConstruct` and `@PreDestroy` (recommended, least coupled).
2. `InitializingBean` / `DisposableBean` interfaces (couples to Spring).
3. `initMethod` / `destroyMethod` attributes on `@Bean` (useful for third-party classes).

Order: interface methods run before annotation methods, which run before `initMethod`.

#### Code Example / Key Takeaways
```java
@Bean(initMethod = "start", destroyMethod = "stop")
public Server server() { return new Server(); }
```

---

### Q361. What are the different Spring Bean scopes?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
- **singleton** (default): one shared instance per Spring container.
- **prototype**: a new instance is created every time it is requested.
- **request**: one instance per HTTP request (web only).
- **session**: one instance per HTTP session (web only).
- **application**: one instance per `ServletContext` (web only).
- **websocket**: one instance per WebSocket session.

Use prototype for stateful beans; singleton for stateless services.

#### Code Example / Key Takeaways
```java
@Component @Scope("prototype")
public class Command { /* stateful per use */ }

@Component @Scope("singleton") // default
public class ConfigService {}
```

---

### Q362. What is the difference between singleton and prototype scope?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
A **singleton** bean is instantiated once and the same instance is injected everywhere — ideal for stateless services. A **prototype** bean is created fresh on every lookup/injection — ideal for stateful objects. Caveat: when a singleton depends on a prototype, the prototype is injected only once (at the singleton's creation). To get a new prototype per call, use `ObjectFactory`/`Provider` or lookup method injection.

#### Code Example / Key Takeaways
```java
@Autowired private ObjectFactory<Command> commandFactory;
public void run() { Command c = commandFactory.getObject(); } // new each time
```

---

### Q363. What are request and session scopes in Spring?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
**request** scope creates a new bean instance for each HTTP request; the bean lives for the duration of that request. **session** scope creates one instance per user HTTP session, shared across requests from that user. Both require a web-aware `ApplicationContext` and are commonly used for storing per-user or per-request state (e.g., a shopping cart as a session bean). You often must use `ObjectFactory`/`Provider` when injecting these into singletons.

#### Code Example / Key Takeaways
```java
@Component @Scope(value = WebApplicationContext.SCOPE_SESSION, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class ShoppingCart {}
```

---

### Q364. What is `@Lazy` and when would you use it?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
`@Lazy` defers bean instantiation until it is first requested rather than at container startup. It is used to:
- Reduce startup time for large applications.
- Resolve circular dependency issues in some cases.
- Avoid initializing expensive resources until needed.

You can apply it on `@Bean` definitions, `@Component`, or on injection points.

#### Code Example / Key Takeaways
```java
@Bean @Lazy
public HeavyReportService heavyReportService() { return new HeavyReportService(); }
```

---

### Q365. What is `@Primary` and `@Qualifier`?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
Both resolve ambiguity when multiple beans of the same type exist. `@Primary` designates a default bean to use when no specific qualifier is given. `@Qualifier` names the exact bean to inject. `@Qualifier` takes precedence over `@Primary` and is more explicit. You can also create custom qualifier annotations for type-safe selection.

#### Code Example / Key Takeaways
```java
@Primary @Bean public PaymentGateway paypal() { return new Paypal(); }
@Bean @Qualifier("stripe") public PaymentGateway stripe() { return new Stripe(); }

@Autowired @Qualifier("stripe") PaymentGateway gateway;
```

---

### Q366. Explain `@Autowired`, `@Resource` and `@Inject`.
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
- `@Autowired` (Spring-specific): default by type; falls back to name; supports `required=false`.
- `@Resource` (JSR-250): default by name, then by type; comes from Java EE.
- `@Inject` (JSR-330): like `@Autowired` but no `required` attribute; portable across DI frameworks.

For portability, prefer `@Inject`; for Spring-only apps, `@Autowired` is fine.

#### Code Example / Key Takeaways
```java
@Autowired private OrderRepository repo;   // by type
@Resource(name="userRepo") private UserRepository ur; // by name
@Inject private AuditService audit;        // JSR-330
```

---

### Q367. What is `@Value` and how is it used?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
`@Value` injects values into fields, constructor params, or method params from properties files, environment variables, system properties, or SpEL expressions. It supports `${property:default}` placeholder syntax and `#{spEL}` expressions.

#### Code Example / Key Takeaways
```java
@Value("${app.timeout:30}")
private int timeout;

@Value("#{systemProperties['user.home']}")
private String homeDir;

@Value("${app.name}")
private String appName;
```

---

### Q368. What is Spring Boot and how does it differ from Spring?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
Spring is the core framework providing IoC, DI, AOP, etc. **Spring Boot** is a layer on top that simplifies setup: it offers opinionated defaults, embedded servers (Tomcat/Netty), starter dependencies, auto-configuration, and production-ready features (metrics, health checks). It reduces boilerplate and lets you create a runnable app with minimal configuration.

#### Code Example / Key Takeaways
```java
@SpringBootApplication
public class MyApp {
    public static void main(String[] args) {
        SpringApplication.run(MyApp.class, args);
    }
}
```

---

### Q369. Explain `@SpringBootApplication`.
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
`@SpringBootApplication` is a convenience annotation that combines three annotations:
- `@Configuration` – marks the class as a bean source.
- `@EnableAutoConfiguration` – enables Spring Boot's auto-configuration.
- `@ComponentScan` – scans the package and sub-packages for components.

It is typically placed on the main application class. Component scanning starts from its package, so the main class should live in a base package above all others.

#### Code Example / Key Takeaways
```java
@SpringBootApplication // = @Configuration + @EnableAutoConfiguration + @ComponentScan
public class Application { public static void main(String[] a){ SpringApplication.run(Application.class,a);} }
```

---

### Q370. How does Spring Boot Auto-Configuration work?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
Auto-configuration uses `@EnableAutoConfiguration`, which imports `AutoConfigurationImportSelector`. This selector reads `META-INF/spring.factories` (or `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` in newer versions) to find candidate auto-configuration classes. Each class is conditionally applied using `@ConditionalOnClass`, `@ConditionalOnMissingBean`, `@ConditionalOnProperty`, etc. So a bean is auto-configured only if its required classes are on the classpath and the user hasn't defined their own.

#### Code Example / Key Takeaways
```java
@Configuration
@ConditionalOnClass(DataSource.class)
@ConditionalOnMissingBean(DataSource.class)
public class DataSourceAutoConfiguration { /* configures HikariCP if none provided */ }
```

---

### Q371. What is the role of `spring.factories` / `AutoConfiguration.imports`?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
These files register auto-configuration classes so Boot can discover them without component scanning. `META-INF/spring.factories` was the legacy mechanism (keyed by `org.springframework.boot.autoconfigure.EnableAutoConfiguration`). Boot 2.7+ deprecates it in favor of `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`, which simply lists fully-qualified class names, one per line. This improves startup performance and clarity.

#### Code Example / Key Takeaways
```text
# META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.example.autoconfig.MyServiceAutoConfiguration
```

---

### Q372. What are Spring Boot Starters?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
Starters are curated dependency descriptors that bundle a group of libraries needed for a particular functionality, with compatible versions managed by the parent `spring-boot-starter-parent`. Examples: `spring-boot-starter-web` (web + Tomcat + Jackson), `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `spring-boot-starter-test`. They eliminate version conflicts and reduce `pom.xml`/`build.gradle` complexity.

#### Code Example / Key Takeaways
```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

---

### Q373. How do you externalize configuration in Spring Boot?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
Spring Boot externalizes config via properties/yaml files, environment variables, command-line arguments, and more. The precedence order (low to high) includes: `application.properties`, profile-specific files, environment variables, and command-line arguments. You can use `@Value` or inject an `Environment`/`@ConfigurationProperties` object. Externalized config lets the same artifact run in different environments.

#### Code Example / Key Takeaways
```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/db
    username: ${DB_USER}
```

---

### Q374. What is `@ConfigurationProperties`?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
`@ConfigurationProperties` binds a hierarchical group of properties to a strongly-typed Java bean, supporting relaxed binding, validation (`@Validated`), and type conversion. It is superior to multiple `@Value` annotations for grouped, structured configuration. Enable it with `@EnableConfigurationProperties` or by annotating the class with `@Component`.

#### Code Example / Key Takeaways
```java
@ConfigurationProperties(prefix = "app.mail")
@Validated
public class MailProperties {
    @NotBlank private String host;
    private int port = 25;
    // getters/setters
}
```

---

### Q375. What is the difference between `@Value` and `@ConfigurationProperties`?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
`@Value` injects a single scalar value with SpEL support but no validation or structured binding. `@ConfigurationProperties` binds a whole subtree of properties to a POJO with type-safe access, validation, and relaxed binding (`app.mail-host` vs `app.mail.host`). Use `@Value` for a quick single value; use `@ConfigurationProperties` for feature/domain configuration.

#### Code Example / Key Takeaways
```java
@Value("${app.mail.host}") private String host;        // single value
@ConfigurationProperties("app.mail") MailProps props;  // structured
```

---

### Q376. What is the `application.properties` vs `application.yml` difference?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
Both configure the application. `application.properties` uses `key=value` flat syntax; `application.yml` uses YAML hierarchical indentation, which is more readable for nested structures. YAML requires correct indentation (2 spaces) and does not allow tabs. YAML support is provided by the `snakeyaml` dependency bundled in Boot.

#### Code Example / Key Takeaways
```properties
# properties
server.port=8081
spring.datasource.url=jdbc:h2:mem:test
```
```yaml
# yml
server:
  port: 8081
spring:
  datasource:
    url: jdbc:h2:mem:test
```

---

### Q377. How does Spring Boot handle profiles?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
Profiles isolate environment-specific configuration and beans. You activate a profile via `spring.profiles.active` property, `SPRING_PROFILES_ACTIVE` env var, or `--spring.profiles.active=dev` argument. Configuration can live in `application-{profile}.yml`, and beans can be annotated with `@Profile("dev")` to load conditionally.

#### Code Example / Key Takeaways
```java
@Bean @Profile("dev") public DataSource devDs() { return new H2(); }
@Bean @Profile("prod") public DataSource prodDs() { return new Mysql(); }
```
```yaml
# application-dev.yml
spring:
  datasource:
    url: jdbc:h2:mem:devdb
```

---

### Q378. What is `@Profile` and how is it used?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
`@Profile` designates that a component, `@Bean` method, or `@Configuration` class should only be registered when the specified profile(s) are active. It accepts a single profile or an array, and supports negation (`!prod`). It is the mechanism for environment-specific wiring.

#### Code Example / Key Takeaways
```java
@Configuration
@Profile("test")
public class TestConfig {
    @Bean public EmailService email() { return new NoOpEmailService(); }
}
```

---

### Q379. What are the embedded servers in Spring Boot?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
Spring Boot embeds a servlet container so the app runs as a standalone JAR with no external server. For servlet stacks, **Tomcat** is the default (via `spring-boot-starter-web`); **Jetty** and **Undertow** can replace it. For reactive stacks (`spring-boot-starter-webflux`), **Netty** is the default. This enables fat-jar deployment and simpler operations.

#### Code Example / Key Takeaways
```xml
<!-- swap Tomcat for Jetty -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
  <exclusions><exclusion><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-tomcat</artifactId></exclusion></exclusions>
</dependency>
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-jetty</artifactId></dependency>
```

---

### Q380. How do you change the embedded server port?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
Set `server.port` in `application.properties`/`yml`. Use `server.port=0` to pick a random available port (useful in integration tests). You can also configure it programmatically via `WebServerFactoryCustomizer` or by setting the `SERVER_PORT` environment variable.

#### Code Example / Key Takeaways
```properties
server.port=9090
# server.port=0 -> random port
```

---

### Q381. What is `@RestController`?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
`@RestController` is a convenience stereotype combining `@Controller` and `@ResponseBody`. It indicates that every handler method returns the serialized response body (typically JSON via Jackson) directly, rather than a view name. It is the primary annotation for building REST APIs in Spring Boot.

#### Code Example / Key Takeaways
```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) { return service.findById(id); }
}
```

---

### Q382. Explain `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`.
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
These are composed mapping annotations (shortcuts over `@RequestMapping(method=...)`) that bind handler methods to specific HTTP methods:
- `@GetMapping` → HTTP GET (read)
- `@PostMapping` → HTTP POST (create)
- `@PutMapping` / `@PatchMapping` → HTTP PUT/PATCH (update)
- `@DeleteMapping` → HTTP DELETE (remove)

They support path patterns, consumes/produces media types, and headers.

#### Code Example / Key Takeaways
```java
@PostMapping(consumes = "application/json", produces = "application/json")
public ResponseEntity<User> create(@RequestBody User user) { ... }
```

---

### Q383. What is `@PathVariable` and `@RequestParam`?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
`@PathVariable` extracts a value from the URI template (e.g., `/users/{id}`). `@RequestParam` extracts query parameters (e.g., `/users?page=2`). `@PathVariable` is for resource identification in the path; `@RequestParam` is for optional filters, pagination, or sorting. Both support `required`, `defaultValue`, and type conversion.

#### Code Example / Key Takeaways
```java
@GetMapping("/{id}")
public User get(@PathVariable Long id,
                @RequestParam(defaultValue = "0") int page) { ... }
```

---

### Q384. What is `@RequestBody` and `@ResponseBody`?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
`@RequestBody` binds the HTTP request body (typically JSON) to a method argument using `HttpMessageConverter`s (Jackson by default). `@ResponseBody` writes the return value directly into the response body instead of a view. With `@RestController`, `@ResponseBody` is implicit on every method. These drive JSON serialization in REST APIs.

#### Code Example / Key Takeaways
```java
@PostMapping
public User create(@RequestBody UserDto dto) {
    return service.create(dto); // serialized to JSON automatically
}
```

---

### Q385. What is `ResponseEntity` and when should you use it?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
`ResponseEntity<T>` represents the full HTTP response: status code, headers, and body. Use it when you need fine-grained control over the response — setting custom headers, cookies, status codes (201 Created, 204 No Content, 409 Conflict), or conditional responses. For simple cases, returning the POJO directly suffices.

#### Code Example / Key Takeaways
```java
@PostMapping
public ResponseEntity<User> create(@RequestBody User u) {
    User saved = service.save(u);
    URI loc = URI.create("/users/" + saved.getId());
    return ResponseEntity.created(loc).body(saved);
}
```

---

### Q386. How do you handle exceptions in Spring REST with `@ExceptionHandler`?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
`@ExceptionHandler` annotated methods in a controller handle specific exceptions thrown by that controller's methods. For global handling, use `@ControllerAdvice`/`@RestControllerAdvice` with `@ExceptionHandler` to centralize error responses across all controllers. Return `ResponseEntity` with an appropriate status and a structured error body.

#### Code Example / Key Takeaways
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorDto> handle(UserNotFoundException ex) {
        return ResponseEntity.status(404).body(new ErrorDto(ex.getMessage()));
    }
}
```

---

### Q387. What is `@ControllerAdvice` / `@RestControllerAdvice`?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
`@ControllerAdvice` is a specialization of `@Component` that allows you to apply `@ExceptionHandler`, `@InitBinder`, and `@ModelAttribute` methods globally across many controllers. `@RestControllerAdvice` adds `@ResponseBody`, making it ideal for REST APIs (returns JSON error bodies). It centralizes cross-cutting controller concerns.

#### Code Example / Key Takeaways
```java
@RestControllerAdvice
public class ApiAdvice {
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String,String>> badReq(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
```

---

### Q388. What is `@ResponseStatus`?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
`@ResponseStatus` maps an exception (or handler method) to a specific HTTP status code and optional reason. When placed on a custom exception class, Spring returns the given status whenever that exception is thrown. It is simpler than `@ExceptionHandler` for straightforward status mapping but offers no control over the response body.

#### Code Example / Key Takeaways
```java
@ResponseStatus(value = HttpStatus.NOT_FOUND, reason = "User not found")
public class UserNotFoundException extends RuntimeException {}
```

---

### Q389. How do you validate request bodies in Spring?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
Use Bean Validation (Jakarta Validation / Hibernate Validator). Annotate the DTO with constraints (`@NotNull`, `@Size`, `@Email`) and mark the controller parameter with `@Valid` (or `@Validated`). If validation fails, Spring throws `MethodArgumentNotValidException`, which you can catch in an `@ExceptionHandler` to return a 400 with field errors.

#### Code Example / Key Takeaways
```java
public record CreateUser(@NotBlank @Email String email, @Size(min=6) String password) {}

@PostMapping
public ResponseEntity<Void> create(@Valid @RequestBody CreateUser req) { ... }
```

---

### Q390. What is Spring AOP and what problem does it solve?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
Aspect-Oriented Programming (AOP) modularizes cross-cutting concerns (logging, security, transactions, monitoring) that cut across many classes. Instead of scattering this code, AOP lets you define an "aspect" that runs at defined points. Spring AOP uses dynamic proxies (JDK or CGLIB) and supports method-execution join points only.

#### Code Example / Key Takeaways
```java
@Aspect
@Component
public class LoggingAspect {
    @Before("execution(* com.example.service.*.*(..))")
    public void log(JoinPoint jp) { System.out.println("call " + jp.getSignature()); }
}
```

---

### Q391. What are Aspect, JoinPoint, Advice, and Pointcut?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
- **Aspect**: a modularization of a cross-cutting concern (a class annotated `@Aspect`).
- **Join point**: a point in program execution (in Spring, a method execution) where an aspect can be applied.
- **Advice**: the action taken at a join point (`@Before`, `@After`, `@AfterReturning`, `@AfterThrowing`, `@Around`).
- **Pointcut**: an expression that matches a set of join points (where the advice should run).

#### Code Example / Key Takeaways
```java
@Aspect @Component
public class PerfAspect {
    @Around("execution(* com.example.service.*.*(..))")  // pointcut
    public Object time(ProceedingJoinPoint pjp) throws Throwable { // advice
        long t = System.nanoTime();
        Object r = pjp.proceed();                          // join point
        System.out.println((System.nanoTime()-t)/1e6 + "ms");
        return r;
    }
}
```

---

### Q392. What are the different types of Advice?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
- **@Before** – runs before the join point.
- **@After** – runs after the join point completes (always, like `finally`).
- **@AfterReturning** – runs after normal return; can access the return value.
- **@AfterThrowing** – runs if the method throws an exception.
- **@Around** – wraps the join point; can control whether it proceeds, modify arguments/return, and measure time. Most powerful.

#### Code Example / Key Takeaways
```java
@AfterReturning(pointcut="...", returning="result")
public void after(Object result) { /* use result */ }

@AfterThrowing(pointcut="...", throwing="ex")
public void onError(Exception ex) { /* handle */ }
```

---

### Q393. What is a Pointcut expression and what is the `execution` designator?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
A pointcut expression selects join points. The `execution` designator is the most common: `execution(modifiers? return-type declaring-type? method-name(params) throws?)`. Wildcards (`*`, `..`) help. Other designators: `within`, `this`, `target`, `args`, `annotation`, `@annotation`. Example: `execution(* com.example.service..*(..))` matches all methods in `service` and sub-packages.

#### Code Example / Key Takeaways
```java
@Pointcut("execution(public * com.example..*Service.*(..))")
public void serviceMethods() {}

@Before("serviceMethods()")
public void before() {}
```

---

### Q394. What is the difference between Spring AOP and AspectJ?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
- **Spring AOP**: runtime weaving via proxies; only supports method-execution join points on Spring beans; simpler, no separate compilation step.
- **AspectJ**: full AOP with compile-time or load-time weaving; supports field access, constructor, static init join points; works on non-Spring objects. More powerful but more complex.

Use Spring AOP for typical enterprise cross-cutting concerns; use AspectJ when you need non-method join points or to advise objects not managed by Spring.

#### Code Example / Key Takeaways
```java
// Spring AOP: proxy-based, method join points only
@EnableAspectJAutoProxy
@Configuration
public class AopConfig {}
```

---

### Q395. What is `@EnableAspectJAutoProxy` and proxying (JDK vs CGLIB)?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
`@EnableAspectJAutoProxy` enables Spring AOP. Spring creates proxies: **JDK dynamic proxies** (default when the bean implements an interface) and **CGLIB** (when no interface, or to proxy concrete classes). Since Boot 2.0, proxying defaults to CGLIB (`spring.aop.proxy-target-class=true`). CGLIB subclasses the class, so `final` methods cannot be advised.

#### Code Example / Key Takeaways
```java
@EnableAspectJAutoProxy(proxyTargetClass = true) // force CGLIB
@Configuration
public class AopConfig {}
```

---

### Q396. What is `@Transactional` and how does Spring manage transactions?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
`@Transactional` demarcates a method (or class) as a single transaction. Spring uses AOP to create a proxy that begins a transaction before the method, commits on success, and rolls back on a runtime exception (by default; checked exceptions do not roll back unless configured). It relies on a `PlatformTransactionManager`. Key attributes: `propagation`, `isolation`, `readOnly`, `rollbackFor`, `timeout`.

#### Code Example / Key Takeaways
```java
@Service
public class TransferService {
    @Transactional(propagation = Propagation.REQUIRED, isolation = Isolation.READ_COMMITTED)
    public void transfer(Long from, Long to, BigDecimal amt) { ... }
}
```

---

### Q397. What are transaction propagation levels?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
Propagation defines how a transaction relates to an existing one:
- **REQUIRED** (default): join existing or create new.
- **REQUIRES_NEW**: suspend existing, always create new.
- **NESTED**: nested transaction with savepoint.
- **SUPPORTS**: use existing, else non-transactional.
- **NOT_SUPPORTED**: suspend existing, run non-transactional.
- **MANDATORY**: must exist, else throw.
- **NEVER**: must not exist, else throw.

#### Code Example / Key Takeaways
```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void audit(String msg) { /* independent tx */ }
```

---

### Q398. What are transaction isolation levels?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
Isolation controls visibility of changes between concurrent transactions, mapped to standard SQL levels:
- **DEFAULT**: DB default.
- **READ_UNCOMMITTED**: may read uncommitted (dirty reads possible).
- **READ_COMMITTED**: no dirty reads.
- **REPEATABLE_READ**: no dirty/non-repeatable reads.
- **SERIALIZABLE**: full isolation, slowest.

Higher isolation reduces anomaly risk but lowers concurrency.

#### Code Example / Key Takeaways
```java
@Transactional(isolation = Isolation.REPEATABLE_READ)
public Account read(Long id) { ... }
```

---

### Q399. What is the difference between `@Component` and `@Bean`?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
`@Component` is used on a class you own so Spring auto-detects it via component scanning. `@Bean` is used inside a `@Configuration` class to explicitly instantiate and register a bean — typically for third-party classes you cannot annotate (e.g., `DataSource`, `RestTemplate`). `@Bean` gives full control over construction logic.

#### Code Example / Key Takeaways
```java
@Component              // you own this class
public class MyService {}

@Bean                   // explicit, for external class
public RestTemplate restTemplate() { return new RestTemplate(); }
```

---

### Q400. How do you create a custom auto-configuration?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
To provide auto-configuration (e.g., for a library):
1. Create a `@Configuration` class guarded by `@ConditionalOnClass` / `@ConditionalOnMissingBean`.
2. Register it in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`.
3. Optionally use `@EnableConfigurationProperties` to bind config.
This lets users get beans automatically only when conditions are met, while still allowing override.

#### Code Example / Key Takeaways
```java
@Configuration
@ConditionalOnClass(MyClient.class)
@EnableConfigurationProperties(MyProps.class)
public class MyAutoConfig {
    @Bean @ConditionalOnMissingBean
    public MyClient client(MyProps p) { return new MyClient(p.getUrl()); }
}
```

---

### Q401. What is `@Conditional` and conditional annotations?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
`@Conditional` registers a bean only when a specified `Condition` matches. Spring Boot extends this with ready-made annotations: `@ConditionalOnClass`, `@ConditionalOnMissingBean`, `@ConditionalOnProperty`, `@ConditionalOnResource`, `@ConditionalOnWebApplication`, `@ConditionalOnExpression`. These power auto-configuration logic.

#### Code Example / Key Takeaways
```java
@Bean
@ConditionalOnProperty(name = "feature.cache.enabled", havingValue = "true")
public CacheService cacheService() { return new CacheService(); }
```

---

### Q402. What is a circular dependency and how does Spring handle it?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
A circular dependency occurs when two or more beans depend on each other (A → B → A). Spring resolves singleton circular references via "early references" (exposing a partially-constructed bean through a singleton factory). This works for constructor injection only if you use `@Lazy` on one side, since constructor cycles cannot be resolved normally and will throw `BeanCurrentlyInCreationException`. Setter/field injection can be resolved. The best fix is to redesign to remove the cycle.

#### Code Example / Key Takeaways
```java
@Component
public class A {
    public A(@Lazy B b) {} // break constructor cycle with @Lazy
}
```

---

### Q403. How do you test a Spring Boot application?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
Spring Boot testing uses `@SpringBootTest` to load the full application context (or a sliced context). Slices load only relevant layers: `@WebMvcTest` (controllers), `@DataJpaTest` (JPA), `@JsonTest`, `@RestClientTest`. Use `MockMvc` for HTTP testing, `@MockBean` to mock dependencies, and `@TestPropertySource`/`@DynamicPropertySource` for test config. `spring-boot-starter-test` bundles JUnit 5, Mockito, and AssertJ.

#### Code Example / Key Takeaways
```java
@WebMvcTest(UserController.class)
class UserControllerTest {
    @Autowired MockMvc mvc;
    @MockBean UserService service;

    @Test void get_ok() throws Exception {
        when(service.findById(1L)).thenReturn(new User(1L,"a"));
        mvc.perform(get("/api/users/1")).andExpect(status().isOk());
    }
}
```

---

### Q404. What is `@DataJpaTest` and `@WebMvcTest`?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
These are test slices that load only a subset of the Spring context for speed:
- `@DataJpaTest`: configures an in-memory JPA setup (H2), repositories, `TestEntityManager`; good for repository tests.
- `@WebMvcTest`: loads only web layer (controllers, filters, MVC infrastructure), not services; use `@MockBean` for dependencies.

Slices dramatically reduce startup time versus `@SpringBootTest`.

#### Code Example / Key Takeaways
```java
@DataJpaTest
class UserRepoTest {
    @Autowired TestEntityManager em;
    @Autowired UserRepository repo;
}
```

---

### Q405. What is Actuator and what endpoints does it provide?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
Spring Boot Actuator exposes operational endpoints for monitoring and management. Key endpoints: `/health` (app status), `/info` (build info), `/metrics` (counters/gauges), `/env`, `/beans`, `/mappings`, `/loggers`, `/shutdown` (disabled by default). In Boot 2+, most are disabled except `health` and `info` by default; enable with `management.endpoints.web.exposure.include=*`.

#### Code Example / Key Takeaways
```properties
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=always
```

---

### Q406. What is the difference between `@SpringBootTest` and test slices?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
`@SpringBootTest` starts the full application context (optionally with a real embedded server via `webEnvironment`), making it closest to production but slowest. Test slices (`@WebMvcTest`, `@DataJpaTest`, etc.) start a minimal, targeted context for speed and isolation. Use slices for unit/integration tests of specific layers; use `@SpringBootTest` for end-to-end/context-load tests.

#### Code Example / Key Takeaways
```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class AppE2E { @LocalServerPort int port; }
```

---

### Q407. What is Microservices Architecture?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
Microservices is an architectural style where an application is composed of small, independently deployable services, each owning its own data and communicating over lightweight protocols (HTTP/REST, messaging). Benefits: independent scaling, technology diversity, fault isolation, and team autonomy. Trade-offs: distributed complexity, network latency, data consistency challenges, and operational overhead.

#### Code Example / Key Takeaways
```text
Monolith ──> [Auth Svc] [Order Svc] [Payment Svc] [Inventory Svc]
             each: own DB, own deploy, talk via REST/gRPC
```

---

### Q408. What is Service Discovery and how does Eureka work?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
Service Discovery lets services locate each other by logical name instead of hardcoded host/port. **Netflix Eureka** is a registry: services register themselves with a Eureka Server on startup and send heartbeats. Clients query the registry to resolve service instances. Spring Cloud provides `@EnableEurekaServer` (registry) and `@EnableDiscoveryClient` (client) with `spring-cloud-starter-netflix-eureka-*`.

#### Code Example / Key Takeaways
```java
@EnableEurekaServer
@SpringBootApplication
public class DiscoveryServer { public static void main(String[] a){ SpringApplication.run(DiscoveryServer.class,a);} }
```
```yaml
# client
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka
```

---

### Q409. What is an API Gateway and what does it do?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
An API Gateway is a single entry point that routes requests to downstream microservices, handling cross-cutting concerns: routing, load balancing, authentication/authorization, rate limiting, request/response transformation, caching, and logging. Spring Cloud Gateway (reactive, built on WebFlux/Netty) is the modern choice, replacing the legacy Zuul. It uses Route/Predicate/Filter model.

#### Code Example / Key Takeaways
```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          filters:
            - name: CircuitBreaker
              args:
                name: orderCB
```

---

### Q410. What is Spring Cloud Config Server?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
Config Server provides externalized, centralized configuration for microservices. It serves config from a Git repository (or Vault/file) to clients over HTTP. Clients (`@EnableConfigServer` on the server; `spring-cloud-config-client` on clients) fetch their config at startup. It supports profiles, encryption, and refresh via Spring Cloud Bus. This keeps configuration out of individual service artifacts.

#### Code Example / Key Takeaways
```java
@EnableConfigServer
@SpringBootApplication
public class ConfigServer { public static void main(String[] a){ SpringApplication.run(ConfigServer.class,a);} }
```
```yaml
# client bootstrap
spring:
  cloud:
    config:
      uri: http://localhost:8888
      name: order-service
```

---

### Q411. What is a Circuit Breaker and how does Resilience4j work?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
A circuit breaker prevents a service from repeatedly calling a failing dependency, failing fast and allowing recovery. **Resilience4j** provides `CircuitBreaker` with states CLOSED, OPEN, HALF_OPEN, plus `Retry`, `Bulkhead`, `RateLimiter`, and `TimeLimiter`. When failures exceed a threshold, the breaker opens; after a wait, it goes half-open to test recovery. Integrate via `@CircuitBreaker(name="svc")` or the Spring Cloud Circuit Breaker abstraction.

#### Code Example / Key Takeaways
```java
@CircuitBreaker(name = "paymentService", fallbackMethod = "fallback")
public String charge() { return paymentClient.charge(); }

public String fallback(Throwable t) { return "default"; }
```

---

### Q412. What are the Circuit Breaker states?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
- **CLOSED**: normal operation; calls pass through; failures are counted.
- **OPEN**: failure threshold exceeded; calls fail fast without invoking the dependency. After a configured `waitDuration`, transitions to HALF_OPEN.
- **HALF_OPEN**: a limited number of test calls are allowed; if they succeed, back to CLOSED; if they fail, back to OPEN.

This protects the system and gives the downstream time to recover.

#### Code Example / Key Takeaways
```yaml
resilience4j.circuitbreaker:
  instances:
    paymentService:
      failureRateThreshold: 50
      waitDurationInOpenState: 5s
      slidingWindowType: COUNT_BASED
      slidingWindowSize: 10
```

---

### Q413. What is Distributed Tracing and how do Sleuth/Zipkin work?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
Distributed tracing tracks a request as it flows across multiple microservices, helping diagnose latency and failures. **Spring Cloud Sleuth** (Micrometer Tracing in newer versions) adds trace/span IDs to logs and propagates them via headers across service calls. **Zipkin** is a backend that collects and visualizes these spans. Together, you see the full call tree and per-service timing.

#### Code Example / Key Takeaways
```yaml
# application.yml
management:
  tracing:
    sampling:
      probability: 1.0
spring:
  zipkin:
    base-url: http://localhost:9411
```
```text
TraceId=abc SpanId=123 service=order -> service=payment (parent span)
```

---

### Q414. What is an API Gateway vs Load Balancer?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
A **Load Balancer** (e.g., client-side Ribbon/Spring Cloud LoadBalancer, or hardware/cloud LB) distributes traffic across instances of a single service for scalability/availability. An **API Gateway** is an application-layer facade that routes to many different services and applies cross-cutting policies (auth, throttling, transformation). The gateway often uses a load balancer internally (note `lb://service-name` in routes) to pick an instance.

#### Code Example / Key Takeaways
```yaml
# Gateway route uses client-side load balancing
uri: lb://order-service   # lb = Spring Cloud LoadBalancer
```

---

### Q415. What is `@LoadBalanced` RestTemplate?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
Annotating a `RestTemplate` bean with `@LoadBalanced` enables client-side load balancing: instead of a concrete URL, you call by service name (e.g., `http://order-service/api/orders`), and Spring Cloud LoadBalancer resolves it to a registered instance and balances across replicas. It works by intercepting requests via `LoadBalancerInterceptor`.

#### Code Example / Key Takeaways
```java
@Bean @LoadBalanced
public RestTemplate restTemplate() { return new RestTemplate(); }

// usage
restTemplate.getForObject("http://order-service/api/orders", List.class);
```

---

### Q416. What is Spring Cloud and how does it relate to microservices?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
Spring Cloud is a collection of tools that implement common distributed-system patterns on top of Spring Boot: service discovery (Eureka), config (Config Server), gateway (Spring Cloud Gateway), circuit breakers (Resilience4j), load balancing, distributed tracing (Sleuth/Zipkin), and messaging. It standardizes microservices building blocks so teams don't reinvent them.

#### Code Example / Key Takeaways
```xml
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

---

### Q417. What is the difference between monolith and microservices?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
A **monolith** is a single deployable unit with one codebase and one database — simpler to develop, test, and deploy, but harder to scale parts independently and riskier to change. **Microservices** split functionality into independent services with separate data stores and deployments — better scalability, isolation, and team autonomy, but add distributed-system complexity (networking, data consistency, observability). Choose based on team size, scale, and domain complexity.

#### Code Example / Key Takeaways
```text
Monolith: 1 app + 1 DB, scale all-or-nothing
Microservices: N apps + N DBs, scale per service
```

---

### Q418. How do microservices communicate?
**Difficulty:** `Intermediate`
**Category:** Spring Framework & Microservices

#### Answer
Two main styles:
- **Synchronous (HTTP/REST, gRPC)**: request/response, easy to use, but creates runtime coupling and latency chains.
- **Asynchronous (messaging: Kafka, RabbitMQ, Spring AMQP)**: event-driven, decoupled, resilient, but adds eventual consistency and broker complexity.

Spring supports both via `RestTemplate`/`WebClient` (sync) and `Spring Kafka`/`Spring AMQP` (async). Choose sync for request/response needs; async for high-throughput, decoupled workflows.

#### Code Example / Key Takeaways
```java
// Async with Spring Kafka
@KafkaListener(topics = "orders")
public void onOrder(OrderEvent e) { process(e); }
```

---

### Q419. What is eventual consistency in microservices?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
Since each microservice owns its own database, cross-service transactions cannot use a single ACID transaction. Instead, systems become *eventually consistent*: an update propagates asynchronously (via events/messaging) and all data stores converge to a consistent state after a short delay. Patterns include Saga (choreography or orchestration), outbox, and CDC (Change Data Capture). This trades immediate consistency for availability and resilience.

#### Code Example / Key Takeaways
```java
@Transactional
public void placeOrder(Order o) {
    repo.save(o);
    outbox.save(new OutboxEvent("OrderPlaced", o)); // published later
}
```

---

### Q420. What is the Saga pattern?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
The Saga pattern manages a distributed transaction spanning multiple services without a global lock. It sequences local transactions; each step publishes an event that triggers the next. If a step fails, compensating transactions undo prior steps. Two styles: **Choreography** (services react to events, decentralized) and **Orchestration** (a central orchestrator directs steps). Spring integrates via event buses (Spring Cloud Stream/Kafka) or orchestrators.

#### Code Example / Key Takeaways
```text
Choreography: OrderPlaced -> [Inventory] reserved -> [Payment] charged
Failure: PaymentFailed -> Inventory.compensate()
```

---

### Q421. How do you secure microservices with Spring Security / OAuth2?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
Microservices typically use **OAuth2 / JWT**: an Authorization Server issues tokens; the API Gateway validates them and forwards user context. Each service uses `spring-boot-starter-security` + `spring-boot-starter-oauth2-resource-server` to validate JWTs (`spring.security.oauth2.resourceserver.jwt.issuer-uri`). Centralized auth at the gateway plus per-service method security (`@PreAuthorize`) enforces fine-grained access.

#### Code Example / Key Takeaways
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://auth-server:9000
```
```java
@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/admin")
public List<User> all() { ... }
```

---

### Q422. What is CQRS and Event Sourcing?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
**CQRS** (Command Query Responsibility Segregation) separates write (command) and read (query) models, often using different datastores optimized for each, improving performance and scalability. **Event Sourcing** stores state as a sequence of immutable events rather than current state; the current state is replayed from events. They complement each other: commands emit events (sourced), and a read model is built from them. Spring supports via Axon Framework or custom event handlers.

#### Code Example / Key Takeaways
```java
@EventHandler
public void on(OrderPlaced e) { readModel.insert(e.toView()); }
```

---

### Q423. What is Spring Boot DevTools?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
Spring Boot DevTools improves developer experience: automatic restart on classpath changes, LiveReload of browser, sensible defaults for development (disabled caching for templates), and a `RemoteDebug` option. It is intended only for development — exclude it from production builds. Add `spring-boot-devtools` as an `optional` dependency.

#### Code Example / Key Takeaways
```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-devtools</artifactId>
  <optional>true</optional>
</dependency>
```

---

### Q424. How do you package and run a Spring Boot application?
**Difficulty:** `Basic`
**Category:** Spring Framework & Microservices

#### Answer
Spring Boot produces a fat/uber JAR via `spring-boot-maven-plugin` (or Gradle plugin) that includes the embedded server and all dependencies. Run with `java -jar app.jar`. Profiles and config can be overridden at runtime (`--spring.profiles.active=prod`, `--server.port=8080`). Containers (Docker) wrap the JAR for cloud deployment; Buildpacks are supported out of the box with `mvn spring-boot:build-image`.

#### Code Example / Key Takeaways
```bash
./mvnw package
java -jar target/app.jar --spring.profiles.active=prod
```

---

### Q425. What are the 12-factor app principles relevant to Spring Boot microservices?
**Difficulty:** `Advanced`
**Category:** Spring Framework & Microservices

#### Answer
Key 12-factor principles Spring Boot naturally supports:
1. **Codebase**: one repo per service.
2. **Dependencies**: declared in Maven/Gradle.
3. **Config**: externalized via properties/env (Spring Boot excels here).
4. **Backing services**: treated as attached resources (datasource beans).
5. **Build/Release/Run**: separated; fat JAR + profile.
6. **Processes**: stateless; use request/session scopes carefully.
7. **Port binding**: embedded server exposes via port.
8. **Concurrency**: scale horizontally.
9. **Disposability**: fast startup/shutdown (important for containers).
10. **Dev/prod parity**: same artifact across environments.

Spring Boot's externalized config, actuators, and embedded servers make most of these trivial.

#### Code Example / Key Takeaways
```properties
# Config from environment (factor III)
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USER}
```
