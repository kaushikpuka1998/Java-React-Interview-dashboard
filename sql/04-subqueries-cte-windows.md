# Subqueries, CTEs & Window Functions Interview Questions (Q1 – Q40)

---

### Q1. What is a subquery?
**Difficulty:** `Basic`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
A subquery is a query nested inside another query (in `SELECT`, `FROM`, `WHERE`, or `HAVING`). It can return a scalar, a row, or a set used by the outer query.

#### Code Example
```sql
SELECT name FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);
```
---

### Q2. Scalar subquery
**Difficulty:** `Basic`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
A scalar subquery returns exactly one value and can be used anywhere a single value is expected.

#### Code Example
```sql
SELECT name, salary, (SELECT MAX(salary) FROM employees) AS top_salary
FROM employees;
```
---

### Q3. Subquery in WHERE with IN
**Difficulty:** `Basic`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
A subquery returning a column of values can feed `IN` to filter the outer query.

#### Code Example
```sql
SELECT name FROM employees
WHERE department_id IN (SELECT id FROM departments WHERE location = 'NY');
```
---

### Q4. Correlated subquery
**Difficulty:** `Advanced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
A correlated subquery references columns from the outer query, so it's re-evaluated per outer row. It's powerful but can be slow if not indexed.

#### Code Example
```sql
SELECT e.name FROM employees e
WHERE e.salary > (SELECT AVG(salary) FROM employees WHERE department = e.department);
```
---

### Q5. Difference between correlated and non-correlated subquery
**Difficulty:** `Advanced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
A non-correlated subquery is independent and runs once. A correlated subquery depends on the outer row and conceptually runs per row. Optimizers often rewrite correlated subqueries as joins.

#### Code Example
```sql
-- non-correlated: runs once
SELECT * FROM orders WHERE amount > (SELECT AVG(amount) FROM orders);
```
---

### Q6. EXISTS vs IN
**Difficulty:** `Advanced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
`EXISTS` checks for existence and short-circuits at the first match (good for correlated checks and large subsets). `IN` compares against a materialized list. `EXISTS` is NULL-safe; `NOT IN` is not.

#### Code Example
```sql
SELECT name FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```
---

### Q7. Subquery in FROM (derived table)
**Difficulty:** `Intermediate`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
A subquery in `FROM` acts as an inline (derived) table that the outer query selects from. It must be aliased.

#### Code Example
```sql
SELECT dept, avg_sal FROM
  (SELECT department AS dept, AVG(salary) AS avg_sal FROM employees GROUP BY department) t
WHERE avg_sal > 50000;
```
---

### Q8. What is a CTE (Common Table Expression)?
**Difficulty:** `Intermediate`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
A CTE is a named temporary result defined with `WITH`, usable later in the same query. It improves readability and lets you reference the same subquery multiple times.

#### Code Example
```sql
WITH high_earners AS (
  SELECT * FROM employees WHERE salary > 80000)
SELECT department, COUNT(*) FROM high_earners GROUP BY department;
```
---

### Q9. CTE vs subquery vs temp table
**Difficulty:** `Advanced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
A subquery is inline and single-use. A CTE names a subquery for readability/reuse within one statement (usually not materialized). A temp table persists across statements and can be indexed but adds overhead.

#### Code Example
```sql
WITH t AS (SELECT ...) SELECT * FROM t JOIN t t2 ON ...; -- reuse within one query
```
---

### Q10. Recursive CTE
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
A recursive CTE references itself to traverse hierarchies/graphs (org charts, category trees). It has an anchor member and a recursive member joined via `UNION ALL`.

#### Code Example
```sql
WITH RECURSIVE org AS (
  SELECT id, name, manager_id, 1 AS lvl FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, e.manager_id, o.lvl + 1
  FROM employees e JOIN org o ON e.manager_id = o.id)
SELECT * FROM org ORDER BY lvl;
```
---

### Q11. What are window functions?
**Difficulty:** `Advanced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Window functions compute values across a set of rows (a "window") related to the current row, without collapsing them like `GROUP BY`. They use `OVER (PARTITION BY ... ORDER BY ...)`.

#### Code Example
```sql
SELECT name, department, salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank
FROM employees;
```
---

### Q12. ROW_NUMBER vs RANK vs DENSE_RANK
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
`ROW_NUMBER` gives unique sequential numbers. `RANK` gives ties the same rank but skips subsequent numbers (1,1,3). `DENSE_RANK` gives ties the same rank without gaps (1,1,2).

#### Code Example
```sql
SELECT name, salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC) rn,
  RANK()       OVER (ORDER BY salary DESC) rnk,
  DENSE_RANK() OVER (ORDER BY salary DESC) drnk
FROM employees;
```
---

### Q13. Find the Nth highest salary with window functions
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Rank rows with `DENSE_RANK` (to handle ties) and filter for the desired rank in an outer query, since you can't filter window results in `WHERE`.

#### Code Example
```sql
SELECT name, salary FROM (
  SELECT name, salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM employees) t
WHERE rnk = 3; -- 3rd highest
```
---

### Q14. Top N per group
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Partition by the group, order within it, and filter by `ROW_NUMBER`/`RANK` ≤ N — a classic "top-N-per-category" pattern.

#### Code Example
```sql
SELECT * FROM (
  SELECT name, department, salary,
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) rn
  FROM employees) t
WHERE rn <= 3;
```
---

### Q15. PARTITION BY explained
**Difficulty:** `Advanced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
`PARTITION BY` splits rows into groups for the window function, resetting the calculation per partition — like `GROUP BY` but without collapsing rows.

#### Code Example
```sql
SELECT name, department,
  COUNT(*) OVER (PARTITION BY department) AS dept_size
FROM employees;
```
---

### Q16. LAG and LEAD
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
`LAG(col, n)` accesses a previous row's value; `LEAD(col, n)` a following row's — great for period-over-period comparisons.

#### Code Example
```sql
SELECT order_date, amount,
  amount - LAG(amount) OVER (ORDER BY order_date) AS change
FROM daily_sales;
```
---

### Q17. Running total (cumulative sum)
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
`SUM(col) OVER (ORDER BY ...)` accumulates values row by row. Add `PARTITION BY` to reset the running total per group.

#### Code Example
```sql
SELECT order_date, amount,
  SUM(amount) OVER (ORDER BY order_date
       ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM orders;
```
---

### Q18. Moving average
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Use a windowed `AVG` with a frame (`ROWS BETWEEN n PRECEDING AND CURRENT ROW`) to smooth a series over a sliding window.

#### Code Example
```sql
SELECT day, value,
  AVG(value) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS ma7
FROM metrics;
```
---

### Q19. FIRST_VALUE and LAST_VALUE
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
`FIRST_VALUE`/`LAST_VALUE` return the first/last value in the window frame. For a correct `LAST_VALUE`, set the frame to `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`.

#### Code Example
```sql
SELECT name, department, salary,
  FIRST_VALUE(name) OVER (PARTITION BY department ORDER BY salary DESC) AS top_earner
FROM employees;
```
---

### Q20. NTILE for bucketing
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
`NTILE(n)` distributes ordered rows into n roughly equal buckets — useful for quartiles/percentile bands.

#### Code Example
```sql
SELECT name, salary, NTILE(4) OVER (ORDER BY salary) AS quartile
FROM employees;
```
---

### Q21. Why can't you use window functions in WHERE?
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Window functions are computed after `WHERE`/`GROUP BY`/`HAVING` (during `SELECT`), so you must wrap them in a subquery or CTE to filter on their results.

#### Code Example
```sql
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (ORDER BY salary DESC) rn FROM employees) t
WHERE rn = 1;
```
---

### Q22. Difference between GROUP BY and window functions
**Difficulty:** `Advanced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
`GROUP BY` collapses rows into one per group. Window functions add aggregate/analytic columns while preserving all detail rows, so you keep row-level data plus group context.

#### Code Example
```sql
SELECT name, salary, AVG(salary) OVER (PARTITION BY department) AS dept_avg
FROM employees; -- every employee row kept
```
---

### Q23. Second highest salary without window functions
**Difficulty:** `Advanced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Use a subquery: the max salary less than the overall max, which correctly skips ties.

#### Code Example
```sql
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
```
---

### Q24. Nth highest salary with LIMIT/OFFSET
**Difficulty:** `Intermediate`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Order distinct salaries descending and use `OFFSET n-1 LIMIT 1`. Use `DISTINCT` so ties don't shift the position.

#### Code Example
```sql
SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 2; -- 3rd
```
---

### Q25. Correlated subquery to rank rows
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Before window functions, ranks were computed by counting how many rows have a greater value in a correlated subquery.

#### Code Example
```sql
SELECT e.name, e.salary,
  (SELECT COUNT(DISTINCT salary) FROM employees WHERE salary >= e.salary) AS rank
FROM employees e;
```
---

### Q26. Using a CTE for readability
**Difficulty:** `Intermediate`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Break a complex query into named CTE steps, each transforming the previous, making logic easier to follow and test.

#### Code Example
```sql
WITH paid AS (SELECT * FROM orders WHERE status='paid'),
     per_cust AS (SELECT customer_id, SUM(amount) t FROM paid GROUP BY customer_id)
SELECT * FROM per_cust WHERE t > 1000;
```
---

### Q27. Multiple CTEs in one query
**Difficulty:** `Intermediate`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Define several CTEs separated by commas after a single `WITH`; later CTEs can reference earlier ones.

#### Code Example
```sql
WITH a AS (SELECT ...),
     b AS (SELECT ... FROM a ...)
SELECT * FROM b;
```
---

### Q28. Recursive CTE to generate a number/date series
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
A recursive CTE can generate sequences (numbers, dates) when the DB lacks `generate_series`, useful for gap-filling reports.

#### Code Example
```sql
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 10)
SELECT n FROM seq;
```
---

### Q29. Detect gaps in a sequence
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Compare each value to the next via `LEAD`; a gap exists where `next - current > 1`.

#### Code Example
```sql
SELECT id AS gap_start, next_id AS gap_end FROM (
  SELECT id, LEAD(id) OVER (ORDER BY id) AS next_id FROM tickets) t
WHERE next_id - id > 1;
```
---

### Q30. Islands and gaps problem
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Group consecutive rows ("islands") by subtracting `ROW_NUMBER()` from the sequential value; equal differences belong to the same run.

#### Code Example
```sql
SELECT MIN(day) AS start, MAX(day) AS end
FROM (SELECT day, day - ROW_NUMBER() OVER (ORDER BY day) * INTERVAL '1 day' AS grp
      FROM active_days) t
GROUP BY grp;
```
---

### Q31. Deduplicate keeping the latest row
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
`ROW_NUMBER()` partitioned by the dedup key, ordered by recency, then keep `rn = 1`.

#### Code Example
```sql
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY email ORDER BY updated_at DESC) rn
  FROM users) t
WHERE rn = 1;
```
---

### Q32. Compare each row to the group max
**Difficulty:** `Advanced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Use `MAX(col) OVER (PARTITION BY group)` to attach the group max to each row, then compute a difference or flag.

#### Code Example
```sql
SELECT name, department, salary,
  MAX(salary) OVER (PARTITION BY department) - salary AS below_top
FROM employees;
```
---

### Q33. Percent of total using window SUM
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Divide each value by `SUM(col) OVER ()` (whole set) or `OVER (PARTITION BY group)` for share within group.

#### Code Example
```sql
SELECT department, salary,
  ROUND(100.0 * salary / SUM(salary) OVER (PARTITION BY department), 2) AS pct_of_dept
FROM employees;
```
---

### Q34. Cumulative distribution and PERCENT_RANK
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
`CUME_DIST` gives the fraction of rows ≤ current; `PERCENT_RANK` gives relative rank (0..1). Useful for percentiles/scoring.

#### Code Example
```sql
SELECT name, salary,
  ROUND(PERCENT_RANK() OVER (ORDER BY salary)::numeric, 2) AS pct_rank
FROM employees;
```
---

### Q35. Window frame: ROWS vs RANGE
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
`ROWS` counts physical rows in the frame; `RANGE` groups rows with the same `ORDER BY` value (peers) together. They differ when ordering values tie.

#### Code Example
```sql
SUM(x) OVER (ORDER BY d ROWS BETWEEN 1 PRECEDING AND CURRENT ROW)   -- physical
SUM(x) OVER (ORDER BY d RANGE BETWEEN 1 PRECEDING AND CURRENT ROW)  -- value-based
```
---

### Q36. Difference between two consecutive rows
**Difficulty:** `Advanced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Subtract `LAG(col)` from the current value to get the row-to-row delta (e.g. daily growth).

#### Code Example
```sql
SELECT day, revenue,
  revenue - LAG(revenue) OVER (ORDER BY day) AS daily_change
FROM sales;
```
---

### Q37. Rank with ties broken by a second column
**Difficulty:** `Advanced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Add tie-breaker columns to the window `ORDER BY` so `ROW_NUMBER`/`RANK` produce a deterministic order.

#### Code Example
```sql
SELECT name,
  ROW_NUMBER() OVER (ORDER BY salary DESC, hire_date ASC) AS rn
FROM employees;
```
---

### Q38. Reuse a window with WINDOW clause
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Define a named window once in a `WINDOW` clause and reference it from multiple functions to avoid repetition.

#### Code Example
```sql
SELECT name, salary,
  RANK() OVER w, DENSE_RANK() OVER w
FROM employees
WINDOW w AS (PARTITION BY department ORDER BY salary DESC);
```
---

### Q39. Correlated subquery vs window function performance
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
A per-row correlated subquery can be O(n²); a window function computes over sorted partitions in roughly one pass, so window functions are usually faster and clearer for ranking/running totals.

#### Code Example
```sql
-- prefer this over a COUNT(*) correlated subquery
SELECT name, RANK() OVER (ORDER BY salary DESC) FROM employees;
```
---

### Q40. Pivot rows to columns
**Difficulty:** `Experienced`
**Category:** Subqueries, CTEs & Window Functions

#### Answer
Pivot with conditional aggregation (`SUM(CASE WHEN ...)`) or a dedicated `PIVOT` operator (SQL Server/Oracle), turning distinct row values into columns.

#### Code Example
```sql
SELECT department,
  SUM(CASE WHEN gender='Male' THEN 1 ELSE 0 END) AS male,
  SUM(CASE WHEN gender='Female' THEN 1 ELSE 0 END) AS female
FROM employees GROUP BY department;
```
---
