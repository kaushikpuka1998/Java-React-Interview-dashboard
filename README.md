# 1,000 Java & React Interview Questions Repository

https://interviewreader.up.railway.app/

Welcome to the ultimate **Java & React Interview Questions** repository! This collection contains **1,000** curated interview questions (500 Java, 500 React) organized into topic-focused markdown files.

---

## ☕ Java Interview Questions (500 Questions)

| Topic File | Range | Questions | Key Areas |
|:-----------|:------|:----------|:----------|
| [01. Core Java & OOP](./java/01-core-java-oops.md) | Q1‑Q75 | 75 | OOP principles, Inheritance, Polymorphism, Abstraction, Interfaces, String Pool, Exceptions |
| [02. Collections & Generics](./java/02-collections-framework.md) | Q76‑Q150 | 75 | List, Set, Map, Queue, HashMap internals, ConcurrentHashMap, Generics |
| [03. Multithreading & Concurrency](./java/03-multithreading-concurrency.md) | Q151‑Q225 | 75 | Threads, Synchronization, ExecutorService, CompletableFuture, Virtual Threads |
| [04. Java 8-21 Features](./java/04-java8-to-21-features.md) | Q226‑Q300 | 75 | Lambdas, Streams, Optional, Records, Sealed Classes, Pattern Matching |
| [05. JVM Architecture & GC](./java/05-jvm-memory-gc.md) | Q301‑Q350 | 50 | Heap, Stack, G1/ZGC Garbage Collectors, ClassLoaders, JVM Tuning |
| [06. Spring Framework & Microservices](./java/06-spring-framework.md) | Q351‑Q425 | 75 | IoC, DI, Spring Boot, REST APIs, Microservices patterns |
| [07. JPA, Hibernate & Security](./java/07-jpa-hibernate-db.md) | Q426‑Q500 | 75 | ORM, Entity mappings, N+1 problem, Spring Security, JWT, OAuth2 |

---

## ⚛️ React Interview Questions (500 Questions)

| Topic File | Range | Questions | Key Areas |
|:-----------|:------|:----------|:----------|
| [01. React Basics & JSX](./react/01-react-basics-jsx.md) | Q1‑Q75 | 75 | Virtual DOM, Fiber, JSX, Components, Props, Controlled inputs |
| [02. State, Props & Lifecycle](./react/02-state-props-lifecycle.md) | Q76‑Q150 | 75 | useState, Lifecycle methods, Events, Automatic batching |
| [03. Hooks Deep Dive](./react/03-react-hooks-in-depth.md) | Q151‑Q230 | 80 | useEffect, useMemo, useCallback, useRef, Custom Hooks |
| [04. Performance & Optimization](./react/04-performance-optimization.md) | Q231‑Q300 | 70 | React.memo, Code splitting, Lazy loading, Virtualization |
| [05. State Management & Ecosystem](./react/05-state-management-ecosystem.md) | Q301‑Q370 | 70 | Redux Toolkit, Context API, Zustand, TanStack Query |
| [06. Routing, Forms & Testing](./react/06-routing-forms-testing.md) | Q371‑Q435 | 65 | React Router, React Hook Form, Jest, React Testing Library |
| [07. Advanced Patterns & Next.js](./react/07-advanced-patterns-nextjs.md) | Q436‑Q500 | 65 | HOCs, Render Props, Compound Components, Next.js App Router |

---

## Question Format

Each question follows this structure:
- **Title & Tags**: Question number, descriptive title, difficulty (Basic/Intermediate/Advanced)
- **Detailed Answer**: Comprehensive explanation with real-world relevance
- **Code Example**: Runnable Java or React code snippet

---

## 🚀 Running the App

The questions are bundled into a Vite + React frontend that loads all 1,000 questions from local markdown files.

```bash
# Install dependencies (one time)
npm install

# Generate questions.json from markdown and start the dev server
npm run dev
```

Then open http://localhost:5173 — all 1,000 questions load instantly, filterable by category, searchable, with difficulty tags.

To rebuild `questions.json` after editing markdown files:
```bash
npm run data
```

---

## How to Use

1. Browse the topic files directly on GitHub or in your editor
2. Each file is self-contained with 50-80 questions
3. Use the difficulty tags to filter by experience level
4. Code examples are runnable with Java 17+ or React 18+
5. Run the app to browse/search/filter the full collection interactively
# Java-React-Interview-dashboard
