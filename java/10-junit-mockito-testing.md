# JUnit & Mockito Testing Interview Questions (Q501 – Q575)

---

### Q501. What is JUnit and why is it used?
**Difficulty:** `Basic`
**Category:** JUnit & Mockito Testing

#### Answer
JUnit is the de-facto unit testing framework for Java. It provides annotations (`@Test`, `@BeforeEach`, `@AfterEach`), assertions, and a runner that executes tests and reports results. Unit tests verify small pieces of behavior in isolation so bugs are caught early, refactoring stays safe, and code is documented through examples.

#### Code Example
```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CalcTest {
    @Test
    void addsTwoNumbers() { assertEquals(5, 2 + 3); }
}
```
---

### Q502. What is the difference between JUnit 4 and JUnit 5?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
JUnit 4 is a single monolithic API; JUnit 5 (Jupiter) splits into Platform (launching), Jupiter (programming model), and Vintage (running JUnit 4 tests). JUnit 5 introduces nested tests, parameterized tests, display names, `@BeforeEach`/`@AfterEach` (replacing `@Before`/`@After`), lambda-based assertions via `Assertions.assertAll`, and the extension model (`@ExtendWith`) that replaces `@RunWith` rules.

#### Code Example
```java
// JUnit 5
import org.junit.jupiter.api.*;
class OrderTest {
    @BeforeEach void setUp() { /* per test */ }
    @Test @DisplayName("creates order")
    void creates() { /* ... */ }
}
```
---

### Q503. What are the most common JUnit 5 annotations?
**Difficulty:** `Basic`
**Category:** JUnit & Mockito Testing

#### Answer
Key JUnit 5 annotations include `@Test` (marks a method as a test), `@DisplayName` (human-readable name), `@BeforeEach`/`@AfterEach` (run before/after every test), `@BeforeAll`/`@AfterAll` (run once per class, must be static unless `@TestInstance(PER_CLASS)`), `@Disabled`, `@Nested`, `@Tag`, `@ParameterizedTest` with sources like `@ValueSource` and `@CsvSource`, and `@ExtendWith` to register extensions.

#### Code Example
```java
@DisplayName("user service")
class UserServiceTest {
    @BeforeAll static void init() {}
    @BeforeEach void setUp() {}
    @Test void finds() {}
}
```
---

### Q504. What is the lifecycle of a JUnit 5 test class?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
A new test class instance is created per test method by default (`PER_METHOD`). `@BeforeEach` runs before each method, `@AfterEach` after. `@BeforeAll` and `@AfterAll` run once per class and require static methods unless `@TestInstance(Lifecycle.PER_CLASS)` is used. Extensions like `MockitoExtension` hook into the lifecycle to initialize mocks before each test.

#### Code Example
```java
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class LifecycleTest {
    @BeforeAll void init() { System.out.println("once"); }
    @BeforeEach void setUp() { System.out.println("each"); }
    @Test void a() {}
    @Test void b() {}
}
```
---

### Q505. What is the Arrange-Act-Assert pattern?
**Difficulty:** `Basic`
**Category:** JUnit & Mockito Testing

#### Answer
AAA structures a test in three blocks: Arrange (set up inputs, collaborators, mocks), Act (invoke the unit under test), Assert (verify the outcome). It keeps tests readable and separates setup from behavior verification. Some teams use Given-When-Then (BDD style) which is the same idea with different labels.

#### Code Example
```java
@Test
void withdrawReducesBalance() {
    // Arrange
    var account = new BankAccount(100);
    // Act
    account.withdraw(30);
    // Assert
    assertEquals(70, account.getBalance());
}
```
---

### Q506. What is the difference between `assertEquals` and `assertSame`?
**Difficulty:** `Basic`
**Category:** JUnit & Mockito Testing

#### Answer
`assertEquals(expected, actual)` checks value equality using `.equals()`. `assertSame(expected, actual)` checks reference equality (`==`). Use `assertSame` for singletons, enums, or when verifying the exact returned instance, e.g., that a method returns the same cached object. Use `assertEquals` for value comparisons like numbers, strings, or DTO contents.

#### Code Example
```java
String s1 = new String("x"), s2 = new String("x");
assertEquals(s1, s2);   // passes (value)
assertSame(s1, s2);    // fails (different references)
```
---

### Q507. How do you assert that an exception is thrown in JUnit 5?
**Difficulty:** `Basic`
**Category:** JUnit & Mockito Testing

#### Answer
Use `assertThrows(Class, Executable)` which returns the thrown exception for further assertions. For older code, JUnit 4 used `@Test(expected = ...)` and `ExpectedException` rule. JUnit 5 also offers `assertDoesNotThrow` for the inverse.

#### Code Example
```java
@Test
void divideByZeroThrows() {
    assertThrows(ArithmeticException.class, () -> calc.divide(1, 0));
}

@Test
void exceptionMessageIsDescriptive() {
    var ex = assertThrows(IllegalArgumentException.class, () -> svc.go(null));
    assertTrue(ex.getMessage().contains("null"));
}
```
---

### Q508. What is `assertAll` in JUnit 5?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
`assertAll` groups multiple assertions and reports all failures at once instead of stopping at the first. It is useful for validating complex objects where you want to see every broken field in a single run. Each assertion is a lambda, so failures are reported with their individual messages.

#### Code Example
```java
@Test
void userHasAllFields() {
    var u = svc.find(1);
    assertAll("user",
        () -> assertEquals("Alice", u.getName()),
        () -> assertEquals(30, u.getAge()),
        () -> assertTrue(u.isActive()));
}
```
---

### Q509. What are parameterized tests in JUnit 5?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Parameterized tests run the same test method multiple times with different inputs. Sources include `@ValueSource` (literals), `@EnumSource`, `@MethodSource`, `@CsvSource`, `@CsvFileSource`, and `@ArgumentsSource`. Combined with `@ParameterizedTest`, they replace copy-paste tests and make data-driven verification concise.

#### Code Example
```java
@ParameterizedTest
@ValueSource(ints = {1, 2, 3, 5})
void isOdd(int n) {
    assertTrue(n % 2 == 1);
}

@ParameterizedTest
@CsvSource({"1,2,3", "0,0,0", "-1,1,0"})
void adds(int a, int b, int sum) { assertEquals(sum, a + b); }
```
---

### Q510. How do you disable or skip a test in JUnit 5?
**Difficulty:** `Basic`
**Category:** JUnit & Mockito Testing

#### Answer
Use `@Disabled` (with an optional reason) to skip a test class or method. For conditional execution, JUnit 5 provides `Assumptions.assumeTrue(...)` which aborts the test if the assumption fails. This is preferred over commenting tests out — disabled tests still appear in reports so future engineers see them.

#### Code Example
```java
@Disabled("feature under migration")
@Test void newFeature() { /* ... */ }

@Test void onMac() {
    Assumptions.assumeTrue(System.getProperty("os.name").contains("Mac"));
    // runs only on macOS
}
```
---

### Q511. What is the JUnit 5 Extension Model?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
Extensions replace JUnit 4's `@RunWith` rules and runners. They hook into lifecycle callbacks like `BeforeEachCallback`, `AfterEachCallback`, `BeforeAllCallback`, `ParameterResolver`, and `TestInstancePostProcessor`. Register with `@ExtendWith(MyExt.class)` on a class or globally via `META-INF/services`. Mockito's `MockitoExtension` is itself a JUnit 5 extension.

#### Code Example
```java
public class TimingExt implements BeforeEachCallback, AfterEachCallback {
    public void beforeEach(ExtensionContext c) { c.getStore(NAMESPACE).put("t", System.nanoTime()); }
    public void afterEach(ExtensionContext c) {
        long ms = (System.nanoTime() - (long) c.getStore(NAMESPACE).get("t")) / 1_000_000;
        System.out.println(c.getDisplayName() + " took " + ms + "ms");
    }
}
```
---

### Q512. What is Mockito and why use it?
**Difficulty:** `Basic`
**Category:** JUnit & Mockito Testing

#### Answer
Mockito is the most popular mocking framework for Java. It creates test doubles (mocks) of classes and interfaces so you can isolate the unit under test from its collaborators (databases, HTTP clients, time). It supports stubbing return values, verifying interactions, argument matchers, and spying on real objects — all without bytecode gymnastics at the user level.

#### Code Example
```java
var repo = mock(UserRepository.class);
when(repo.findById(1L)).thenReturn(Optional.of(new User(1, "Alice")));
var svc = new UserService(repo);
assertEquals("Alice", svc.nameOf(1));
```
---

### Q513. How do you create a mock in Mockito?
**Difficulty:** `Basic`
**Category:** JUnit & Mockito Testing

#### Answer
Use `Mockito.mock(Class)` or the static `mock(Class)` import. With JUnit 5, annotate fields with `@Mock` and register `MockitoExtension` via `@ExtendWith`. Mocks return default values (null, 0, false, empty collection) for unstubbed calls, so you stub only the behavior you care about.

#### Code Example
```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock PaymentGateway gateway;
    @Test void chargesCard() {
        when(gateway.charge(any())).thenReturn(new Receipt("ok"));
        var svc = new OrderService(gateway);
        assertEquals("ok", svc.placeOrder(new Cart(100)).status());
    }
}
```
---

### Q514. What is the difference between a mock and a stub?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
A stub provides canned answers so the SUT can run — it's about state. A mock is a double you also verify interactions on — it's about behavior. In practice, Mockito's `mock()` returns an object that supports both stubbing (`when().thenReturn`) and verification (`verify`). Spies wrap real instances. Pure stubs (e.g., a hand-written `PaymentGateway` subclass) cannot verify calls.

#### Code Example
```java
// Stub-only
PaymentGateway stub = id -> new Receipt("ok");

// Mock — stub + verify
PaymentGateway mock = mock(PaymentGateway.class);
when(mock.charge(any())).thenReturn(new Receipt("ok"));
svc.checkout(cart);
verify(mock).charge(any());
```
---

### Q515. What is a Mockito spy?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
A spy wraps a real instance and delegates to it by default, while still letting you stub specific methods and verify calls. Use `spy(obj)` or `@Spy`. Spies are useful when you need real behavior for most methods but want to override or observe a few — for example, skipping a slow side effect while exercising the rest of the logic.

#### Code Example
```java
List<String> real = new ArrayList<>(List.of("a"));
List<String> sp = spy(real);
sp.add("b");
verify(sp).add("b");
assertEquals(2, sp.size());
```
---

### Q516. How do you stub void methods in Mockito?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Void methods are stubbed with `doThrow(...).when(mock).voidMethod(args)` or `doNothing().when(mock).voidMethod(args)` (the default). You cannot use `when(mock.voidMethod()).thenThrow(...)` because `when()` requires a non-void call site. `doAnswer` is also available for richer behavior.

#### Code Example
```java
EmailSender sender = mock(EmailSender.class);
doThrow(new RuntimeException("SMTP down"))
    .when(sender).send(any());

assertThrows(RuntimeException.class, () -> svc.register(user));
verify(sender).send(any());
```
---

### Q517. How do you stub consecutive calls in Mockito?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Chain `thenReturn(a, b, c)` to return different values on successive invocations, or use `thenReturn(a).thenReturn(b).thenThrow(e)` to mix return-then-throw. After the list is exhausted, the last stubbed value is returned repeatedly. Use this to model retries, pagination, or finite state machines.

#### Code Example
```java
when(repo.find()).thenReturn(opt1, opt2, Optional.empty());
assertEquals(opt1, svc.next());
assertEquals(opt2, svc.next());
assertTrue(svc.next().isEmpty());
```
---

### Q518. What are Mockito argument matchers?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Matchers like `any()`, `anyString()`, `anyLong()`, `eq(value)`, `argThat(predicate)`, `isNull()`, `notNull()` let you stub or verify calls without hardcoding arguments. If you use matchers in a stub, all arguments must be matchers. Mix concrete values and matchers using `eq(...)` to lock in one position while leaving others flexible.

#### Code Example
```java
when(repo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
verify(repo).save(argThat(u -> u.getEmail().endsWith("@x.com")));
```
---

### Q519. How does `verify` work in Mockito?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
`verify(mock).method(args)` asserts that the method was called. You can chain `.times(n)`, `.never()`, `.atLeastOnce()`, `.atMost(n)`, `.timeout(ms)`, and order with `inOrder(mock).verify(mock).method(...)`. Verification checks what actually happened; stubbing dictates what happens. Always verify behavior you actually depend on — not every call.

#### Code Example
```java
svc.process(order);
verify(gateway, times(1)).charge(order.total());
verify(email, never()).send(any());
```
---

### Q520. What is `ArgumentCaptor` and when do you use it?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
`ArgumentCaptor<T>` captures the argument passed to a mock so you can run further assertions on it. Use it when the stubbed return value is not enough — e.g., verifying the contents of a complex object sent to a downstream collaborator. `forClass(...)` (modern) or `@Captor` (JUnit) creates it; `verify(...).capture()` then retrieves it.

#### Code Example
```java
@Captor ArgumentCaptor<Email> emailCap;

@Test void sendsWelcome() {
    svc.register(new User("a@b.com"));
    verify(mailer).send(emailCap.capture());
    assertEquals("a@b.com", emailCap.getValue().to());
}
```
---

### Q521. What is `thenAnswer` and how does it differ from `thenReturn`?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
`thenReturn(v)` always returns the same value. `thenAnswer(invocation -> ...)` lets you compute the return value from the invocation's arguments, perform side effects, or return different values based on state. Use it for callbacks, parameter-dependent logic, or when you need access to the actual call.

#### Code Example
```java
when(calc.divide(anyInt(), anyInt())).thenAnswer(inv -> {
    int a = inv.getArgument(0), b = inv.getArgument(1);
    if (b == 0) throw new ArithmeticException();
    return a / b;
});
```
---

### Q522. How do you verify that a method was never called on a mock?
**Difficulty:** `Basic`
**Category:** JUnit & Mockito Testing

#### Answer
Use `verify(mock, never()).method(args)`. This is a strong negative assertion and is appropriate for invariants like "do not send email when payment fails" or "do not delete when validation fails." Combine with `verifyNoMoreInteractions(mock)` to assert that the mock was not touched after a specific point.

#### Code Example
```java
svc.failingCheckout(cart);
verify(payments, never()).charge(any());
verifyNoMoreInteractions(payments);
```
---

### Q523. What is `verifyNoInteractions` vs `verifyNoMoreInteractions`?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
`verifyNoInteractions(mock)` asserts the mock was never called at all. `verifyNoMoreInteractions(mock)` asserts there are no unverified calls on top of the verified ones. The first is a strong contract; the second is brittle — over-using it makes refactoring painful. Prefer verifying the calls that matter; only assert "nothing else" when it's an explicit requirement.

#### Code Example
```java
verifyNoInteractions(email);              // never called
verify(repo).save(user);
verifyNoMoreInteractions(repo);           // only save(...) was called
```
---

### Q524. How do you test methods that throw checked exceptions?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Wrap the call in a lambda for `assertThrows(...)`. Mockito can stub checked exceptions via `thenThrow(new IOException())`. JUnit requires no special declaration — test methods can throw any `Throwable`. For real production code that throws checked exceptions, ensure the test method's signature or lambda captures the call.

#### Code Example
```java
when(client.fetch()).thenThrow(new IOException("net"));

assertThrows(IOException.class, () -> svc.load());
```
---

### Q525. What is BDDMockito and how does it differ from regular Mockito?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
`BDDMockito` provides `given(...).willReturn(...)` instead of `when(...).thenReturn(...)` and `then(mock).should(...)` instead of `verify(mock)...`. It maps the API to Given-When-Then language for BDD-style tests. Behavior is identical; it's purely a readability choice that some teams prefer for stakeholder-facing test reports.

#### Code Example
```java
given(repo.findById(1L)).willReturn(Optional.of(user));
svc.load(1L);
then(repo).should().findById(1L);
```
---

### Q526. How do you mock static methods in Mockito?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
Use Mockito's inline mock-maker (default since 3.4+) and `mockStatic(Class)`. Wrap usage in a try-with-resources block so the static mock is automatically released after the test. Avoid mocking static methods in new code — prefer injecting a wrapper. When you must (legacy `UUID.randomUUID`, `System.currentTimeMillis`), this is the mechanism.

#### Code Example
```java
try (MockedStatic<UUID> uuid = mockStatic(UUID.class)) {
    uuid.when(UUID::randomUUID).thenReturn(new UUID(0, 42));
    assertEquals("00000000-0000-002a", svc.newId());
}
```
---

### Q527. How do you mock constructors in Mockito?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
With Mockito 3.5+, `mockConstruction(Class.class)` intercepts all `new` calls for that type and returns a mock instead. Wrap in try-with-resources. This is useful for testing classes that internally `new` their dependencies — but the cleaner fix is dependency injection. Use it sparingly for legacy code that resists refactoring.

#### Code Example
```java
try (MockedConstruction<HttpClient> c = mockConstruction(HttpClient.class)) {
    var svc = new ReportService();
    var out = svc.generate();
    assertEquals(1, c.constructed().size());
}
```
---

### Q528. How do you test private methods?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Don't. Test private methods indirectly via the public API that uses them. If a private method is complex enough to warrant its own test, extract it into a package-private helper class and test that. Using reflection (`Method.setAccessible(true)`) to invoke private methods couples tests to implementation and breaks on every refactor.

#### Code Example
```java
// Instead of reflection, refactor:
class BigService {
    public Result run(Input in) { return compute(in, dep); }
    Result compute(Input in, Dep d) { /* testable */ }
}
```
---

### Q529. How do you reset a mock between tests?
**Difficulty:** `Basic`
**Category:** JUnit & Mockito Testing

#### Answer
With `MockitoExtension`, mocks are recreated per test automatically. If you manage mocks manually, call `Mockito.reset(mock)` in `@BeforeEach` or `@AfterEach`. Reset is rarely needed and is often a smell — if two tests need different stubs, create two test methods with separate setups rather than reusing state.

#### Code Example
```java
@BeforeEach void resetMocks() { Mockito.reset(payments, email); }
```
---

### Q530. What is `doReturn` vs `thenReturn`?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
`when(mock.method()).thenReturn(v)` records the stub using the actual method call. `doReturn(v).when(mock).method(...)` bypasses the real method and is required for spies (because calling the real method on a spy can have side effects) and for stubbing methods with primitive return types in some edge cases. Prefer `thenReturn` for ordinary mocks.

#### Code Example
```java
List<String> sp = spy(new ArrayList<>());
doReturn(42).when(sp).size();   // bypasses real size()

when(mock.getCount()).thenReturn(42); // preferred for plain mocks
```
---

### Q531. How do you match collections in Mockito?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Use `anyList()`, `anyMap()`, `anySet()`, `anyCollection()`, or `argThat(c -> c.containsAll(expected))` for finer assertions. For deep equality on complex objects, consider AssertJ's `usingRecursiveComparison()` in the assertion step rather than fighting with matchers.

#### Code Example
```java
verify(repo).saveAll(argThat(it -> StreamSupport.stream(it.spliterator(), false)
                                                  .allMatch(u -> u.isActive())));
```
---

### Q532. What is the difference between `mock` and `@Mock` vs `@MockBean`?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
`mock(Class)` is the imperative API. `@Mock` is the annotation form used with `MockitoExtension` (pure unit test). `@MockBean` is from Spring's test framework (`@WebMvcTest`, `@SpringBootTest`) — it replaces a bean in the Spring context with a Mockito mock and is reset after each test. Mixing them up is a common source of "mock not applied" bugs.

#### Code Example
```java
@ExtendWith(MockitoExtension.class)            // unit
class A { @Mock Dep d; }

@WebMvcTest(Controller.class)                  // Spring slice
class B { @MockBean Dep d; }
```
---

### Q533. How do you verify call order in Mockito?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Use `InOrder` from `Mockito.inOrder(mock1, mock2, ...)`. This asserts that interactions happened in a specific relative sequence, useful when state transitions or side-effect ordering matters. Avoid ordering assertions when not required — they make tests brittle.

#### Code Example
```java
InOrder order = inOrder(payments, inventory);
order.verify(inventory).reserve(item);
order.verify(payments).charge(amount);
```
---

### Q534. How do you test asynchronous code with JUnit and Mockito?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
Use `Awaitility` to poll until an async condition is met, or `CompletableFuture.get(timeout)`. Verify that mocks are invoked once the async path completes. Avoid `Thread.sleep` for synchronization — it's flaky. For Spring, `MockMvc` with `asyncDispatch` or `@Async` methods combined with `Awaitility.await().untilAsserted(...)` is the standard pattern.

#### Code Example
```java
svc.fireAndForget(order);
await().atMost(2, SECONDS).untilAsserted(() -> verify(mailer).send(any()));
```
---

### Q535. How do you test time-dependent code?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
Inject a `Clock` (or use `java.time.Clock.systemUTC()`) and pass a fixed clock in tests. Avoid `System.currentTimeMillis()` and `LocalDate.now()` in production code — they can't be tested deterministically. Mockito can stub `Clock` with `doReturn(fixedInstant).when(clock).instant()`. Java 9+ provides `Clock.fixed(...)` for tests.

#### Code Example
```java
Clock clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
var svc = new SubscriptionService(clock);
assertTrue(svc.isActive(new Subscription(start, end)));
```
---

### Q536. What is AssertJ and how does it compare to JUnit assertions?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
AssertJ is a fluent assertions library: `assertThat(order.total()).isEqualTo(100).isGreaterThan(50)`. It produces better failure messages than JUnit's plain assertions, supports rich collection and exception assertions, and integrates with JUnit 4/5 and TestNG. Many teams use JUnit as the runner and AssertJ as the assertion engine.

#### Code Example
```java
assertThat(order.items())
    .hasSize(3)
    .extracting(Item::name)
    .containsExactly("A", "B", "C");
```
---

### Q537. How do you assert exceptions with AssertJ?
**Difficulty:** `Basic`
**Category:** JUnit & Mockito Testing

#### Answer
AssertJ offers `assertThatThrownBy(() -> ...).isInstanceOf(X.class).hasMessageContaining("y")` and `assertThatNoException().isThrownBy(...)`. It's more readable than JUnit's `assertThrows` when you need multiple chained assertions on the thrown exception.

#### Code Example
```java
assertThatThrownBy(() -> svc.parse(null))
    .isInstanceOf(IllegalArgumentException.class)
    .hasMessageContaining("null")
    .hasNoCause();
```
---

### Q538. What is the test pyramid and how does it relate to JUnit/Mockito?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
The test pyramid says: many fast unit tests at the base (JUnit + Mockito), fewer integration tests in the middle (Spring + Testcontainers), and a thin top of end-to-end tests (Selenium, Postman). Mocks help unit tests stay fast and isolated; integration tests use real collaborators. Aim for ~70% unit, ~20% integration, ~10% e2e as a rough guide.

#### Code Example
```text
       /\        E2E (slow, brittle, few)
      /  \
     /----\      Integration (real DB, real MQ)
    /      \
   /--------\    Unit (Mockito, fast, many)
```
---

### Q539. What is integration testing with Spring Boot?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Spring Boot integration tests use `@SpringBootTest` to load the full context, or slice annotations like `@WebMvcTest`, `@DataJpaTest`, `@DataMongoTest` to load only relevant beans. `@MockBean` swaps real beans for Mockito mocks inside the context. `@Testcontainers` brings up real Postgres/Redis in Docker for genuine integration tests.

#### Code Example
```java
@SpringBootTest
class OrderIT {
    @Autowired OrderController controller;
    @MockBean PaymentGateway gateway;

    @Test void places() throws Exception {
        when(gateway.charge(any())).thenReturn(new Receipt("ok"));
        // call controller and assert response
    }
}
```
---

### Q540. What is `@WebMvcTest`?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
`@WebMvcTest(ControllerX.class)` loads only the web layer: the controller, `WebMvcConfigurer`, filters, and `MockMvc`. Other beans (services, repositories) are not loaded — you must `@MockBean` the dependencies. It is faster than `@SpringBootTest` and is the right tool for testing request mapping, validation, and serialization.

#### Code Example
```java
@WebMvcTest(UserController.class)
class UserControllerTest {
    @Autowired MockMvc mvc;
    @MockBean UserService svc;

    @Test void getsUser() throws Exception {
        when(svc.find(1)).thenReturn(new User(1, "Alice"));
        mvc.perform(get("/users/1")).andExpect(status().isOk())
           .andExpect(jsonPath("$.name").value("Alice"));
    }
}
```
---

### Q541. How do you test REST controllers with MockMvc?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
`MockMvc` simulates HTTP requests without starting a server. Use `mockMvc.perform(get("/x"))`, chain `.andExpect(status().isOk())`, `.andExpect(jsonPath("$.field").value("v"))`, `.andDo(print())`. For POST with body, use `content(json).contentType(APPLICATION_JSON)`. For full HTTP-level tests including network, prefer `TestRestTemplate` or `@SpringBootTest(webEnvironment = RANDOM_PORT)`.

#### Code Example
```java
mvc.perform(post("/orders")
    .contentType(APPLICATION_JSON)
    .content("{\"qty\":2}"))
    .andExpect(status().isCreated())
    .andExpect(header().exists("Location"));
```
---

### Q542. What is `@DataJpaTest`?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
`@DataJpaTest` is a slice annotation that loads only JPA-related beans: `EntityManager`, `DataSource`, repositories. By default it uses an in-memory H2 database and rolls back each test in a transaction. Pair with `@AutoConfigureTestDatabase(replace = NONE)` to use Testcontainers' real Postgres. It's the standard way to test repository custom queries.

#### Code Example
```java
@DataJpaTest
class UserRepoTest {
    @Autowired UserRepository repo;
    @Test void findsByEmail() {
        repo.save(new User("a@b.com"));
        assertTrue(repo.findByEmail("a@b.com").isPresent());
    }
}
```
---

### Q543. What is Testcontainers?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
Testcontainers spins up real services (Postgres, Redis, Kafka, Elasticsearch) inside Docker containers for tests. It eliminates the gap between mocks and production by exercising actual database SQL, network behavior, and schema. `@Container static PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16")` and `@DynamicPropertySource` wire it into Spring.

#### Code Example
```java
@Container
static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16");

@DynamicPropertySource
static void props(DynamicPropertyRegistry r) {
    r.add("spring.datasource.url", pg::getJdbcUrl);
    r.add("spring.datasource.username", pg::getUsername);
    r.add("spring.datasource.password", pg::getPassword);
}
```
---

### Q544. How do you mock final classes and methods in Mockito?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
Mockito's default mock-maker can't mock final classes/methods. Enable the inline mock-maker by adding `mockito-inline` to your test dependencies (Mockito 5+ has it built in) and creating `src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker` with `mock-maker-inline`. Avoid mocking finals — they're often a code smell.

#### Code Example
```java
// resources/mockito-extensions/org.mockito.plugins.MockMaker
// mock-maker-inline

final StringHelper h = mock(StringHelper.class);
when(h.uppercase(anyString())).thenReturn("X");
```
---

### Q545. What is `Mockito.doNothing()` and why does it exist?
**Difficulty:** `Basic`
**Category:** JUnit & Mockito Testing

#### Answer
Void methods are stubbed with `doNothing()` because `when(mock.voidMethod())` cannot record a stub from a void call. `doNothing()` is the default behavior for void methods on a plain mock, so it's mainly used to override a previous stub or to make intent explicit. `doThrow(...)`, `doAnswer(...)`, `doCallRealMethod()` follow the same pattern.

#### Code Example
```java
doNothing().when(logger).warn(anyString()); // explicit no-op
doThrow(new IOException()).when(client).send(any());
```
---

### Q546. How do you write data-driven tests with JUnit 5 and Mockito?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
Combine `@ParameterizedTest` with `@MethodSource` that yields `Arguments.of(mockSetup, input, expected)` for each row. Inside the test, configure the mock per row, run the call, and assert. This scales edge cases (empty inputs, boundary values, error paths) without repeating boilerplate.

#### Code Example
```java
static Stream<Arguments> cases() {
    return Stream.of(
        Arguments.of(0, "free"),
        Arguments.of(100, "paid"),
        Arguments.of(-1, "error"));
}
```
---

### Q547. How do you test code that uses `System.currentTimeMillis()`?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
Refactor: inject `Clock` and use `clock.millis()`. In tests, pass `Clock.fixed(...)`. If refactoring is impossible, mock `System` via a static mock and stub `currentTimeMillis`. The injection route is always preferred — it's deterministic and survives JVM upgrades.

#### Code Example
```java
try (MockedStatic<System> sys = mockStatic(System.class, CALLS_REAL_METHODS)) {
    sys.when(System::currentTimeMillis).thenReturn(1_000_000L);
    assertEquals("1970-01-01", svc.today());
}
```
---

### Q548. What is the difference between `@BeforeEach` and `@BeforeAll`?
**Difficulty:** `Basic`
**Category:** JUnit & Mockito Testing

#### Answer
`@BeforeEach` runs before every test method — use it for per-test setup like creating fresh mocks. `@BeforeAll` runs once per class — use it for expensive shared setup like starting a Testcontainer. In JUnit 5, `@BeforeAll` methods must be static unless `@TestInstance(Lifecycle.PER_CLASS)` is set.

#### Code Example
```java
@BeforeAll static void startContainer() { /* once */ }
@BeforeEach void freshMocks() { Mockito.reset(repo); }
```
---

### Q549. How do you test `Optional` returns?
**Difficulty:** `Basic`
**Category:** JUnit & Mockito Testing

#### Answer
Use `assertThat(opt).isPresent()` / `isEmpty()` (AssertJ) or `assertTrue(opt.isPresent())` (JUnit). For the inner value, chain `.get()` after asserting presence, or use `assertThat(opt).contains(value)`. Never call `.get()` without checking first — it throws `NoSuchElementException`.

#### Code Example
```java
Optional<User> u = svc.find(1);
assertThat(u).isPresent().get().extracting(User::name).isEqualTo("Alice");
```
---

### Q550. How do you test methods that throw multiple exception types?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Use AssertJ's `assertThatThrownBy` for fluent chained assertions, or write one parameterized test per exception type. Map inputs to expected exception classes via `@MethodSource`, then assert each scenario with `assertThrows` or AssertJ. For Java's "exhaustive" pattern matching with sealed types, also verify the resulting state or downstream calls.

#### Code Example
```java
assertThatThrownBy(() -> svc.parse("bad")).isInstanceOf(ParseException.class);
assertThatThrownBy(() -> svc.parse(null)).isInstanceOf(IllegalArgumentException.class);
```
---

### Q551. What is `Mockito.verifyZeroInteractions`?
**Difficulty:** `Basic`
**Category:** JUnit & Mockito Testing

#### Answer
`verifyZeroInteractions(mock)` is the deprecated predecessor of `verifyNoInteractions(mock)` — same semantics, asserts the mock was never called. Use the modern name in new code; the old form still works for backward compatibility but emits a deprecation warning.

#### Code Example
```java
verifyNoInteractions(auditLog); // modern
verifyZeroInteractions(auditLog); // legacy, deprecated
```
---

### Q552. How do you test Java streams and lambdas?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Treat the stream as data: given a known input list, call the function that returns the stream, collect to a `List`/set, and assert contents. Use AssertJ's `containsExactly` for ordered checks and `containsExactlyInAnyOrder` for unordered. For infinite streams, use `Stream.limit(n)` and verify expected behavior.

#### Code Example
```java
List<Integer> out = svc.squares(List.of(1, 2, 3));
assertThat(out).containsExactly(1, 4, 9);
```
---

### Q553. What is mutation testing?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
Mutation testing tools (PIT, Stryker) inject small changes (mutations) into your code — flip `==` to `!=`, replace `>` with `>=`, negate a condition — then run your tests. If tests still pass, the mutation survived, meaning your tests missed a behavior. Mutation score measures how effectively tests detect injected faults, complementing line/branch coverage.

#### Code Example
```bash
mvn org.pitest:pitest-maven:mutationCoverage
# target/pit-reports/index.html shows mutants killed vs survived
```
---

### Q554. What is test coverage and what is a healthy target?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Coverage measures which lines/branches were exercised by tests: line coverage, branch coverage, and path coverage. Targets of 80%+ line coverage are common, but coverage doesn't equal quality — a test that calls a method without asserting anything has 100% coverage and zero value. Use coverage as a floor, mutation testing as the real signal.

#### Code Example
```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.11</version>
</plugin>
```
---

### Q555. How do you test Spring Security-protected endpoints?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
Use Spring Security Test: `@WithMockUser`, `@WithJwt`, `@WithUserDetails`, or `SecurityMockMvcRequestPostProcessors.user(...).roles("ADMIN")`. For method security, mock the `SecurityContext` directly with `SecurityContextHolder.getContext().setAuthentication(...)`. Combine with `@WebMvcTest` and `MockMvc` to verify that secured endpoints reject anonymous requests with 401/403.

#### Code Example
```java
mvc.perform(get("/admin").with(user("admin").roles("ADMIN")))
    .andExpect(status().isOk());

mvc.perform(get("/admin"))
    .andExpect(status().isUnauthorized());
```
---

### Q556. What is `@MockBean` and how does it differ from `@Mock`?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
`@Mock` is a pure unit-test annotation that creates a Mockito mock and injects it via reflection (requires `MockitoExtension`). `@MockBean` is from `org.springframework.boot.test.mock.mockito` — it replaces a bean in the Spring `ApplicationContext` with a Mockito mock and resets it after each test. `@MockBean` is slower (context loading) but necessary for integration/slice tests where Spring resolves the dependency.

#### Code Example
```java
@Mock UserRepo repo;             // unit, no Spring
@MockBean UserRepo repo;         // Spring slice/integration
```
---

### Q557. How do you test logging behavior?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Avoid asserting on log output directly — it's brittle. Instead, inject a `Logger` or use a logging façade like SLF4J's `ILoggerFactory` test appender. For Logback, attach a `ListAppender<ILoggingEvent>` to the logger and assert on captured events. For Mockito-based verification, inject the SLF4J logger wrapper as a dependency.

#### Code Example
```java
Logger log = (Logger) LoggerFactory.getLogger(Svc.class);
var appender = new ListAppender<ILoggingEvent>(); appender.start();
log.addAppender(appender);
svc.run();
assertThat(appender.list).extracting(ILoggingEvent::getMessage)
    .contains("started");
```
---

### Q558. What is the Given-When-Then style?
**Difficulty:** `Basic`
**Category:** JUnit & Mockito Testing

#### Answer
Given-When-Then is BDD-flavored test structure: Given (preconditions/arrange), When (action/act), Then (assertion). It maps cleanly to user stories ("Given a logged-in user, when they click checkout, then an order is created") and produces readable tests that double as living documentation. JUnit + AssertJ + BDDMockito are the typical toolchain.

#### Code Example
```java
@Test void appliesDiscount() {
    // Given
    var cart = new Cart(100, true); // premium
    // When
    var total = svc.total(cart);
    // Then
    assertEquals(90, total);
}
```
---

### Q559. How do you mock `RestTemplate` / `WebClient`?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
For `RestTemplate`, mock `RestTemplate` itself and stub `exchange(...)` to return a `ResponseEntity`. For `WebClient`, the preferred modern approach is `WireMock` or `MockWebServer` to stub actual HTTP at the network layer. Mockito-based mocking works but couples tests to internal calls; WireMock tests the contract.

#### Code Example
```java
when(rest.exchange(eq("/x"), eq(GET), any(), eq(Dto.class)))
    .thenReturn(ResponseEntity.ok(new Dto("ok")));
```
---

### Q560. What is WireMock?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
WireMock is an HTTP mock server for integration testing. You configure stubs (`wireMockServer.stubFor(get("/users/1").willReturn(okJson(...)))`) and point your HTTP client at it. It records/replays real interactions, supports fault injection and verification. It is the canonical tool for testing code that depends on third-party HTTP APIs without hitting them.

#### Code Example
```java
WireMockServer wm = new WireMockServer(8089); wm.start();
configureFor(8089);
stubFor(get(urlEqualTo("/u/1")).willReturn(aResponse().withStatus(200).withBody("{}")));
```
---

### Q561. How do you write good test names?
**Difficulty:** `Basic`
**Category:** JUnit & Mockito Testing

#### Answer
Name tests after behavior, not the method: `withdraw_reducesBalance_byAmount` is clearer than `testWithdraw`. JUnit 5's `@DisplayName("withdrawing $30 from a $100 account leaves $70")` reads like a sentence and shows up in IDE reports. Avoid numbers (`test1`, `test2`) — they signal copy-paste without thought.

#### Code Example
```java
@Test
@DisplayName("withdraw reduces balance by amount")
void withdraw_reducesBalance_byAmount() { /* ... */ }
```
---

### Q562. What is the FIRST principle of unit testing?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
FIRST stands for Fast (millisecond tests), Independent (no shared state between tests), Repeatable (same result every run, no flake), Self-validating (boolean pass/fail, no manual inspection), Timely (written alongside or just before production code). Mockito-based unit tests excel at F, I, R, S. E2E and integration tests sacrifice F for realism.

#### Code Example
```java
// FAST: pure in-memory; INDEPENDENT: fresh mocks each test;
// REPEATABLE: no clock/file/network; SELF-VALIDATING: assertions
```
---

### Q563. How do you avoid flaky tests?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Eliminate timing dependencies (no `Thread.sleep`), avoid shared mutable state, isolate filesystem/network with Testcontainers/WireMock, and use deterministic clocks. When a test must wait, use Awaitility with explicit timeouts. Mark flaky tests as `@Tag("flaky")` and quarantine them — never let "sometimes passes" become acceptable in CI.

#### Code Example
```java
await().atMost(5, SECONDS)
    .pollInterval(100, MILLIS)
    .untilAsserted(() -> verify(mailer).send(any()));
```
---

### Q564. How do you test code that reads environment variables?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Inject configuration as a typed bean (Spring `@ConfigurationProperties`) and override it in tests via `@TestPropertySource(properties = "app.x=y")` or `@DynamicPropertySource`. Avoid `System.getenv()` directly in production code — it hides dependencies and complicates tests. When forced, mock `System.getenv` via a static mock.

#### Code Example
```java
@TestPropertySource(properties = "app.timeout=500")
class TimeoutIT {
    @Autowired AppProps props;
    @Test void reads() { assertEquals(500, props.timeout()); }
}
```
---

### Q565. How do you write tests for void methods that have side effects?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Stub the side-effecting collaborator (e.g., `mailer.send`) with `doNothing()`, run the SUT, then `verify(mailer).send(expectedArg)`. Use `ArgumentCaptor` to inspect the argument if it's complex. Don't assert on log output unless that's the explicit contract; prefer verifying the collaborator.

#### Code Example
```java
svc.register(user);
verify(repo).save(user);
verify(mailer).send(argThat(e -> e.to().equals(user.email())));
```
---

### Q566. What is `@SpringBootTest(webEnvironment = RANDOM_PORT)`?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
This annotation spins up the full Spring context and binds Tomcat to a random free port. Use `TestRestTemplate` or `WebTestClient` to hit real HTTP. It's heavier than `@WebMvcTest` (loads the whole context) but verifies the wiring from controller down to repositories. Pair with Testcontainers for real database tests.

#### Code Example
```java
@SpringBootTest(webEnvironment = RANDOM_PORT)
class AppIT {
    @LocalServerPort int port;
    @Autowired TestRestTemplate rest;

    @Test void health() {
        assertThat(rest.getForEntity("/actuator/health", String.class)
                     .getStatusCode()).isEqualTo(OK);
    }
}
```
---

### Q567. How do you test Kafka producers and consumers with JUnit?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
Mock `KafkaTemplate.send(...)` for producers with Mockito and verify the record payload. For consumers, use `EmbeddedKafkaBroker` (Spring) or Testcontainers' Kafka to publish a message and assert that the listener processed it. `@EmbeddedKafka` provides an in-memory broker for fast feedback; Testcontainers is closer to production.

#### Code Example
```java
@EmbeddedKafka
class ProducerTest {
    @Autowired KafkaTemplate<String, String> t;
    @Test void sends() throws Exception {
        t.send("topic", "key", "v").get();
        // assert via consumer in another thread or Awaitility
    }
}
```
---

### Q568. What is `@DirtiesContext` and when should you use it?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
`@DirtiesContext(classMode = AFTER_CLASS)` tells Spring to evict the `ApplicationContext` after the test class. Use it when a test mutates shared state (singletons, caches) that would otherwise leak into other test classes. It's a code smell indicator — most tests should be self-contained without it. Prefer per-test cleanup with `@AfterEach`.

#### Code Example
```java
@DirtiesContext(classMode = AFTER_CLASS)
class MutatingEnvIT { /* ... */ }
```
---

### Q569. What is the difference between unit and integration tests in Spring?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Unit tests load no Spring context, use `@ExtendWith(MockitoExtension.class)`, run in milliseconds, and isolate one class. Integration tests load Spring (`@SpringBootTest` or slice annotations), exercise real wiring, and run in seconds. Naming convention often uses `IT` suffix (`OrderServiceIT`) so they can be run separately via `mvn verify -Pintegration`.

#### Code Example
```text
src/test/java/.../OrderServiceTest.java   // unit
src/test/java/.../OrderServiceIT.java    // integration
```
---

### Q570. How do you verify a method was called with specific arguments using matchers?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Combine matchers with `verify`: `verify(mock).save(eq(user))`. If you mix matchers and concrete values, all arguments after the first matcher must also use matchers — Mockito throws `InvalidUseOfMatchersException` otherwise. Use `argThat(predicate)` for custom checks Mockito doesn't provide natively.

#### Code Example
```java
verify(mailer).send(argThat(e ->
    e.subject().equals("welcome") && e.to().endsWith("@x.com")));
```
---

### Q571. How do you test exception messages and causes?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
Capture the exception via `assertThrows`/`assertThatThrownBy`, then assert on `.getMessage()`, `.getCause()`, `.getSuppressed()`, or specific fields. For complex causes, AssertJ's `hasCauseInstanceOf(X.class)` and `hasRootCauseInstanceOf(Y.class)` are concise. Avoid asserting on exact full messages — couple to substrings.

#### Code Example
```java
var ex = assertThrows(IllegalStateException.class, () -> svc.run());
assertThat(ex).hasMessageContaining("not initialized")
              .hasCauseInstanceOf(IOException.class);
```
---

### Q572. What is `@TestInstance(Lifecycle.PER_CLASS)`?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
It tells JUnit 5 to reuse one test instance for all methods in a class. `@BeforeAll`/`@AfterAll` no longer need to be `static`. Useful when tests share expensive setup that can't be static (e.g., non-static fields with `@TempDir`). Trade-off: state can leak between tests, so reset in `@BeforeEach`.

#### Code Example
```java
@TestInstance(Lifecycle.PER_CLASS)
class HeavySetupTest {
    @BeforeAll void init() { /* not static now */ }
    @BeforeEach void reset() { /* reset per-test state */ }
}
```
---

### Q573. How do you test conditional logic with `@EnabledIf` and `@DisabledIf`?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
JUnit 5 supports `@EnabledIfEnvironmentVariable`, `@DisabledIfSystemProperty`, `@EnabledOnOs(OS.LINUX)`, `@EnabledOnJre(JRE.JAVA_17)`, and `@DisabledIf` with a custom condition. Use them sparingly — environment-dependent tests are flaky in CI. Prefer OS/JRE gating; environment-variable gates are common in integration suites.

#### Code Example
```java
@Test
@EnabledOnOs(OS.MAC)
void macOnlyFeature() {}

@Test
@EnabledIfEnvironmentVariable(named = "CI", matches = "true")
void runsOnCI() {}
```
---

### Q574. How do you test thread-safety with JUnit?
**Difficulty:** `Advanced`
**Category:** JUnit & Mockito Testing

#### Answer
Use multiple threads in the test: `ExecutorService` with N workers, count down latches, and assert no exceptions and correct final state. Combine with stress loops (`@RepeatedTest(1000)`) or tools like JCStress for fine-grained JMM checks. Mockito mocks are not thread-safe by default; avoid sharing them across threads without synchronization.

#### Code Example
```java
@RepeatedTest(100)
void concurrentIncrement() throws Exception {
    var pool = Executors.newFixedThreadPool(8);
    var start = new CountDownLatch(1);
    var done = new CountDownLatch(8);
    for (int i = 0; i < 8; i++) {
        pool.submit(() -> { start.await(); counter.inc(); done.countDown(); return null; });
    }
    start.countDown(); done.await();
    assertEquals(8, counter.get());
}
```
---

### Q575. What is the test-driven development (TDD) red-green-refactor cycle?
**Difficulty:** `Intermediate`
**Category:** JUnit & Mockito Testing

#### Answer
TDD cycles through three steps: Red (write a failing test for the next behavior), Green (write the simplest production code to pass it), Refactor (clean up duplication while tests stay green). With JUnit + Mockito, this loop is fast — milliseconds per cycle. The discipline forces small increments, ensures every line of production code is justified by a test, and keeps tests as the executable spec.

#### Code Example
```text
RED    → @Test void adds() { assertEquals(2, calc.add(1, 1)); }  // fails
GREEN  → class Calc { int add(int a, int b) { return a + b; } } // passes
REFACTOR → extract AddOperation, keep tests green
```
---
