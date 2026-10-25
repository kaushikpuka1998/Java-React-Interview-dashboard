// Starting point taken from the resume the owner already has. Members can edit every field.
export function sampleResumeData() {
  return {
    header: {
      name: 'Kaushik Ghosh',
      headline: 'Backend Software Engineer | Java · Spring Boot · Distributed Systems',
      location: 'Bengaluru, India',
      extra: '**Open to relocation: US, Canada, EU**',
      email: 'kaushikstrivers@gmail.com',
      phone: '+91-8618266596',
      links: [
        { label: 'linkedin.com/in/kgstrivers', url: 'https://www.linkedin.com/in/kgstrivers/' },
        { label: 'github.com/kaushikpuka1998', url: 'https://github.com/kaushikpuka1998' },
        { label: 'kaushikpuka1998.github.io/portfolio', url: 'https://kaushikpuka1998.github.io/portfolio/' },
      ],
    },
    summary:
      'Backend engineer with **5 years** building **Java/Spring Boot microservices** for US-headquartered SaaS companies (**Guidewire**, **Tekion**). Cut API latency **98% (712 ms -> 12 ms)**, shipped claims APIs for insurers in Australia and New Zealand, and own production systems built on **Kafka, PostgreSQL, MongoDB, Redis, and Docker**.',
    skills: [
      { label: 'Languages', value: 'Java (8/11/17), SQL, Python, TypeScript, JavaScript, Ruby' },
      { label: 'Backend', value: 'Spring Boot, Spring MVC, Spring Data JPA, Hibernate, REST, Microservices, Node.js, Ruby on Rails' },
      { label: 'Data & Messaging', value: 'PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, Apache Kafka, RabbitMQ' },
      { label: 'Cloud & DevOps', value: 'AWS (EC2, S3, Secrets Manager), Docker, Jenkins, Git, Maven, Gradle, CI/CD' },
      { label: 'Testing & Observability', value: 'JUnit 5, Mockito, Cucumber (BDD), TDD, SonarQube, Swagger/OpenAPI, ELK/Kibana' },
    ],
    experience: [
      {
        role: 'Software Engineer 2', start: 'Mar 2025', end: 'Present',
        company: 'Guidewire Software (NYSE: GWRE)', companyUrl: 'https://www.guidewire.com/',
        meta: 'Java 17, Spring Boot, REST APIs, React, TypeScript', location: 'Bengaluru, India',
        bullets: [
          "Built the **Workers' Compensation claims REST API** for ClaimCenter and ContactManager in a 5-engineer team, **cutting claim processing time 20%** for insurers in Australia and New Zealand.",
          'Owned 4 backend workflows end to end (Policy Verification, Date of Injury, Vulnerability, Time-based Obligations) across PolicyCenter and ClaimCenter, **improving throughput 15%**.',
          "Shipped automatic workflow restart on reopened claims (Java + React/TypeScript, JUnit, Cucumber BDD) and resolved production incidents; **led code reviews and mentored 2 engineers** as technical point of contact for client stakeholders.",
        ],
      },
      {
        role: 'Software Engineer 2', start: 'Nov 2023', end: 'Mar 2025',
        company: 'Tekion Corp', companyUrl: 'https://tekion.com/',
        meta: 'automotive retail cloud for US dealerships · Java, Spring Boot, MongoDB, Kafka', location: 'Bengaluru, India',
        bullets: [
          '**Cut dealer-page API latency 98% (712 ms -> 12 ms)** by replacing offset pagination with cursor-based queries and lazy loading, eliminating full scans on high-cardinality collections.',
          'Built Elasticsearch-backed reporting services for real-time KPI dashboards, **reducing report generation time 60%** and service response times **25%**.',
          'Extended Spring Boot microservices for the dealer sales platform and integrated a program-milestone data API consumed by multiple downstream services.',
          'Raised unit test coverage to **80%** on deal-management services (JUnit 5, Mockito, SonarQube), with **zero post-release defects** across multiple releases.',
        ],
      },
      {
        role: 'Software Development Engineer 1', start: 'Feb 2023', end: 'Nov 2023',
        company: 'Coding Ninjas', companyUrl: 'https://www.codingninjas.com',
        meta: 'edtech platform · Ruby on Rails, Angular, PostgreSQL, Redis, AWS S3', location: 'Gurugram, India',
        bullets: [
          'Built a learner leaderboard end to end (Rails, Angular, PostgreSQL) with Redis caching on high-traffic endpoints, **raising user engagement 40%**.',
          'Led the Articles & Discussions module (**+50% profile-section usage**) and an automated re-engagement email system (**+25% satisfaction**), working directly with product and design.',
        ],
      },
      {
        role: 'Software Engineer', start: 'Sep 2021', end: 'Feb 2023',
        company: 'RailYatri', companyUrl: 'https://www.railyatri.in',
        meta: 'train travel and booking platform · Ruby on Rails, Java, Node.js, MySQL, Redis', location: 'Noida, India',
        bullets: [
          'Re-engineered the booking backend of a high-traffic ticketing system using TDD, **reducing booking time 35%** through API call optimization.',
          'Rebuilt the refund calculator for emergency-quota bookings (**50% fewer complaints**) and shipped a cancellation-notification pipeline on Redis and AWS S3, **lifting retention 15%**.',
        ],
      },
    ],
    projects: [
      {
        name: 'LinkMint -- Self-hosted URL Shortener', url: 'https://github.com/kaushikpuka1998/LinkMint',
        tech: 'FastAPI (async), MongoDB, Redis, React', date: '2026',
        bullets: [
          'Designed base62 short codes with custom aliases, expiry (HTTP 410), bulk shortening, and 30-day click analytics; Redis caching and rate limiting **degrade gracefully** to MongoDB-only operation.',
          'Implemented session auth (bcrypt, HttpOnly cookies) with owner-scoped authorization and an automated test suite covering the full API surface.',
        ],
      },
      {
        name: 'Meetly -- Video Meeting Platform', url: 'https://meetly.co.in',
        tech: 'Node.js, MongoDB, Redis, BullMQ, WebRTC/LiveKit, Docker', date: '2026',
        bullets: [
          'Replaced a per-second cron poll with **Redis-backed delayed jobs**, cutting redundant DB queries from **86,400/day to zero**; made jobs idempotent via an atomic claim for exactly-once delivery.',
          'Deployed self-hosted real-time media infrastructure (WebSocket signaling, WebRTC/LiveKit over UDP); containerized with Docker and shipped via CI/CD.',
        ],
      },
    ],
    education: [
      {
        degree: 'B.Tech. in Computer Science and Engineering', dates: 'Jul 2017 -- Jul 2021',
        school: 'Cooch Behar Government Engineering College', location: 'Cooch Behar, India',
      },
    ],
    achievements: [
      "600+ problems solved on [LeetCode](https://leetcode.com/u/kgstrivers/) | Backend and system design writer, **17K+ followers** on LinkedIn and [Medium](https://kgstrivers.medium.com/).",
    ],
  }
}

// An empty resume for "New resume".
export function blankResumeData() {
  return {
    header: { name: '', headline: '', location: '', extra: '', email: '', phone: '', links: [] },
    summary: '',
    skills: [],
    experience: [],
    projects: [],
    education: [],
    achievements: [],
  }
}
