# Advanced Query Scenarios Interview Questions (Q1 – Q40)

---

### Q1. Find the second highest salary
**Difficulty:** `Intermediate`
**Category:** Advanced Query Scenarios

#### Answer
Take the max salary below the overall max (handles ties), or use `DENSE_RANK`. This is one of the most-asked SQL interview questions.

#### Code Example
```sql
SELECT MAX(salary) AS second_highest
FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);
```
---

### Q2. Find employees earning more than their department average
**Difficulty:** `Advanced`
**Category:** Advanced Query Scenarios

#### Answer
Compare each employee's salary to their department average via a correlated subquery or a window function.

#### Code Example
```sql
SELECT name, department, salary FROM (
  SELECT name, department, salary,
    AVG(salary) OVER (PARTITION BY department) AS avg_sal
  FROM employees) t
WHERE salary > avg_sal;
```
---

### Q3. Find the highest-paid employee in each department
**Difficulty:** `Advanced`
**Category:** Advanced Query Scenarios

#### Answer
Rank within each department and keep rank 1. Use `RANK` if you want to include ties, `ROW_NUMBER` for exactly one.

#### Code Example
```sql
SELECT name, department, salary FROM (
  SELECT *, RANK() OVER (PARTITION BY department ORDER BY salary DESC) rk
  FROM employees) t
WHERE rk = 1;
```
---

### Q4. Find duplicate records
**Difficulty:** `Intermediate`
**Category:** Advanced Query Scenarios

#### Answer
Group by the columns that define a duplicate and keep groups with `COUNT(*) > 1`.

#### Code Example
```sql
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;
```
---

### Q5. Delete duplicate rows, keep the earliest
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Rank duplicates by a tiebreaker and delete all but the first, or delete rows whose id isn't the minimum per duplicate group.

#### Code Example
```sql
DELETE FROM users a
USING users b
WHERE a.email = b.email AND a.id > b.id;
```
---

### Q6. Find customers who never placed an order
**Difficulty:** `Intermediate`
**Category:** Advanced Query Scenarios

#### Answer
Anti-join with LEFT JOIN + `IS NULL`, or `NOT EXISTS` (NULL-safe).

#### Code Example
```sql
SELECT c.name FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```
---

### Q7. Find the most recent order per customer
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Partition by customer, order by date descending, keep `ROW_NUMBER = 1`.

#### Code Example
```sql
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) rn
  FROM orders) t
WHERE rn = 1;
```
---

### Q8. Running total of daily sales
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Windowed cumulative `SUM` ordered by date.

#### Code Example
```sql
SELECT day, amount,
  SUM(amount) OVER (ORDER BY day) AS cumulative
FROM daily_sales;
```
---

### Q9. Month-over-month growth
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Aggregate by month, then use `LAG` to compare to the previous month and compute percentage change.

#### Code Example
```sql
WITH m AS (
  SELECT DATE_TRUNC('month', order_date) mo, SUM(amount) rev
  FROM orders GROUP BY 1)
SELECT mo, rev,
  ROUND(100.0 * (rev - LAG(rev) OVER (ORDER BY mo)) / LAG(rev) OVER (ORDER BY mo), 2) AS growth_pct
FROM m;
```
---

### Q10. Find the top 3 products by revenue
**Difficulty:** `Advanced`
**Category:** Advanced Query Scenarios

#### Answer
Aggregate revenue per product, order descending, and limit to 3 (or rank and filter for ties).

#### Code Example
```sql
SELECT product_id, SUM(amount) AS revenue
FROM order_items GROUP BY product_id
ORDER BY revenue DESC LIMIT 3;
```
---

### Q11. Find gaps between consecutive dates per user
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Use `LAG` over the date ordered per user and compute the interval difference.

#### Code Example
```sql
SELECT user_id, login_date,
  login_date - LAG(login_date) OVER (PARTITION BY user_id ORDER BY login_date) AS gap
FROM logins;
```
---

### Q12. Find consecutive login streaks
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Subtract `ROW_NUMBER()` from the date to form a constant group per consecutive run, then aggregate min/max and count per group.

#### Code Example
```sql
SELECT user_id, MIN(d) AS streak_start, COUNT(*) AS length
FROM (SELECT user_id, d,
        d - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY d)) * INTERVAL '1 day' AS grp
      FROM login_days) t
GROUP BY user_id, grp;
```
---

### Q13. Pivot monthly sales into columns
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Conditional aggregation with one `SUM(CASE ...)` per target column.

#### Code Example
```sql
SELECT product_id,
  SUM(CASE WHEN EXTRACT(MONTH FROM d)=1 THEN amt END) AS jan,
  SUM(CASE WHEN EXTRACT(MONTH FROM d)=2 THEN amt END) AS feb
FROM sales GROUP BY product_id;
```
---

### Q14. Unpivot columns into rows
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
`UNION ALL` one query per column, or use `UNPIVOT`/`LATERAL` to turn wide columns into (key, value) rows.

#### Code Example
```sql
SELECT id, 'q1' AS quarter, q1 AS amt FROM sales
UNION ALL SELECT id, 'q2', q2 FROM sales;
```
---

### Q15. Find median salary
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Use `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary)`, or emulate with row numbering picking the middle row(s).

#### Code Example
```sql
SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) AS median FROM employees;
```
---

### Q16. Find employees with the same salary
**Difficulty:** `Advanced`
**Category:** Advanced Query Scenarios

#### Answer
Group by salary and keep groups with more than one employee, or self-join on equal salary and different id.

#### Code Example
```sql
SELECT salary, STRING_AGG(name, ', ') AS people
FROM employees GROUP BY salary HAVING COUNT(*) > 1;
```
---

### Q17. Find the manager with the most reports
**Difficulty:** `Advanced`
**Category:** Advanced Query Scenarios

#### Answer
Self-join or group by `manager_id`, count reports, order descending.

#### Code Example
```sql
SELECT m.name, COUNT(*) AS reports
FROM employees e JOIN employees m ON e.manager_id = m.id
GROUP BY m.name ORDER BY reports DESC LIMIT 1;
```
---

### Q18. Traverse an org hierarchy
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
A recursive CTE walks from a root down the reporting chain, tracking depth/path.

#### Code Example
```sql
WITH RECURSIVE tree AS (
  SELECT id, name, manager_id, 1 lvl FROM employees WHERE id = 1
  UNION ALL
  SELECT e.id, e.name, e.manager_id, t.lvl+1
  FROM employees e JOIN tree t ON e.manager_id = t.id)
SELECT * FROM tree;
```
---

### Q19. Calculate retention (users active in consecutive periods)
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Self-join or use `EXISTS` to check activity in period N and N+1 per user, then aggregate.

#### Code Example
```sql
SELECT COUNT(DISTINCT a.user_id) AS retained
FROM monthly_active a
JOIN monthly_active b ON a.user_id = b.user_id AND b.month = a.month + 1;
```
---

### Q20. Find the first purchase date per customer
**Difficulty:** `Advanced`
**Category:** Advanced Query Scenarios

#### Answer
`MIN(order_date)` grouped by customer, or `FIRST_VALUE` window if you need it alongside other order fields.

#### Code Example
```sql
SELECT customer_id, MIN(order_date) AS first_purchase
FROM orders GROUP BY customer_id;
```
---

### Q21. Cohort analysis by signup month
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Assign each user a cohort (signup month), then join activity and count actives per cohort per subsequent month.

#### Code Example
```sql
WITH cohort AS (
  SELECT id, DATE_TRUNC('month', signup_date) AS cohort_month FROM users)
SELECT c.cohort_month, DATE_TRUNC('month', a.event_date) AS active_month, COUNT(DISTINCT a.user_id)
FROM cohort c JOIN events a ON a.user_id = c.id
GROUP BY 1, 2;
```
---

### Q22. Find rows where a value changed
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Compare each row to the previous with `LAG` and keep rows where the value differs — change-detection over an ordered series.

#### Code Example
```sql
SELECT * FROM (
  SELECT *, LAG(status) OVER (PARTITION BY order_id ORDER BY ts) AS prev
  FROM order_events) t
WHERE status IS DISTINCT FROM prev;
```
---

### Q23. Deduplicate keeping the row with max value
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
`ROW_NUMBER()` partitioned by the key ordered by the value descending, keep `rn = 1`.

#### Code Example
```sql
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY price DESC) rn
  FROM price_history) t
WHERE rn = 1;
```
---

### Q24. Find products never sold
**Difficulty:** `Intermediate`
**Category:** Advanced Query Scenarios

#### Answer
Anti-join products against order items with `NOT EXISTS`.

#### Code Example
```sql
SELECT p.name FROM products p
WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.id);
```
---

### Q25. Compute year-to-date totals
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Windowed running sum partitioned by year, ordered by date.

#### Code Example
```sql
SELECT order_date, amount,
  SUM(amount) OVER (PARTITION BY EXTRACT(YEAR FROM order_date) ORDER BY order_date) AS ytd
FROM orders;
```
---

### Q26. Rank customers into quartiles by spend
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Aggregate spend per customer, then `NTILE(4)` over spend to segment them.

#### Code Example
```sql
SELECT customer_id, total,
  NTILE(4) OVER (ORDER BY total DESC) AS quartile
FROM (SELECT customer_id, SUM(amount) total FROM orders GROUP BY customer_id) s;
```
---

### Q27. Find overlapping date ranges
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Self-join and check `a.start <= b.end AND b.start <= a.end` (with an id inequality to avoid self/duplicate pairs).

#### Code Example
```sql
SELECT a.id, b.id FROM bookings a
JOIN bookings b ON a.room_id = b.room_id AND a.id < b.id
WHERE a.start_time < b.end_time AND b.start_time < a.end_time;
```
---

### Q28. Fill missing dates with zero (gap filling)
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Generate a full date series (`generate_series`/calendar table) and LEFT JOIN the data, coalescing missing values to 0.

#### Code Example
```sql
SELECT d::date, COALESCE(SUM(amount), 0) AS revenue
FROM generate_series('2024-01-01','2024-01-31',INTERVAL '1 day') d
LEFT JOIN orders o ON o.order_date = d::date
GROUP BY d ORDER BY d;
```
---

### Q29. Get the difference between max and min per group
**Difficulty:** `Intermediate`
**Category:** Advanced Query Scenarios

#### Answer
`MAX(col) - MIN(col)` per group gives the range/spread.

#### Code Example
```sql
SELECT department, MAX(salary) - MIN(salary) AS salary_range
FROM employees GROUP BY department;
```
---

### Q30. Find top spender per city
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Aggregate spend by city+customer, rank within city, keep rank 1.

#### Code Example
```sql
SELECT * FROM (
  SELECT city, customer_id, SUM(amount) total,
    RANK() OVER (PARTITION BY city ORDER BY SUM(amount) DESC) rk
  FROM orders GROUP BY city, customer_id) t
WHERE rk = 1;
```
---

### Q31. Calculate conversion rate
**Difficulty:** `Advanced`
**Category:** Advanced Query Scenarios

#### Answer
Divide converted counts by total counts using conditional aggregation, casting to a decimal to avoid integer division.

#### Code Example
```sql
SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE converted) / COUNT(*), 2) AS conversion_pct
FROM sessions;
```
---

### Q32. Avoid integer division pitfalls
**Difficulty:** `Advanced`
**Category:** Advanced Query Scenarios

#### Answer
Integer / integer truncates. Multiply by `1.0` or cast one operand to numeric/float to get a decimal result.

#### Code Example
```sql
SELECT 3 / 2 AS wrong, 3 * 1.0 / 2 AS right; -- 1 vs 1.5
```
---

### Q33. Update rows based on another table (correlated update)
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Use `UPDATE ... FROM`/subquery to set values from a related table, matching on the key.

#### Code Example
```sql
UPDATE employees e
SET department_name = d.name
FROM departments d
WHERE e.department_id = d.id;
```
---

### Q34. Upsert (insert or update on conflict)
**Difficulty:** `Advanced`
**Category:** Advanced Query Scenarios

#### Answer
`INSERT ... ON CONFLICT DO UPDATE` (Postgres) or `INSERT ... ON DUPLICATE KEY UPDATE` (MySQL) / `MERGE` inserts new rows and updates existing ones atomically.

#### Code Example
```sql
INSERT INTO inventory(sku, qty) VALUES ('A1', 5)
ON CONFLICT (sku) DO UPDATE SET qty = inventory.qty + EXCLUDED.qty;
```
---

### Q35. Bulk delete with a join condition
**Difficulty:** `Advanced`
**Category:** Advanced Query Scenarios

#### Answer
`DELETE ... USING`/subquery removes rows matched against another table, e.g. orders of inactive customers.

#### Code Example
```sql
DELETE FROM orders o
USING customers c
WHERE o.customer_id = c.id AND c.status = 'inactive';
```
---

### Q36. Find the mode (most frequent value)
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Group by the value, order by count descending, limit 1 — or `MODE() WITHIN GROUP (ORDER BY col)` in Postgres.

#### Code Example
```sql
SELECT MODE() WITHIN GROUP (ORDER BY department) AS most_common_dept FROM employees;
```
---

### Q37. Compare current vs previous period side by side
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Aggregate per period, then self-join (or `LAG`) to align this period with the prior one for comparison.

#### Code Example
```sql
WITH m AS (SELECT DATE_TRUNC('month',d) mo, SUM(amt) rev FROM sales GROUP BY 1)
SELECT mo, rev, LAG(rev) OVER (ORDER BY mo) AS prev_rev FROM m;
```
---

### Q38. Explain query performance
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
`EXPLAIN ANALYZE` shows the execution plan with actual timings and row counts, revealing sequential scans, join methods, and where indexes are (or aren't) used.

#### Code Example
```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_id = 42;
```
---

### Q39. When does an index NOT get used?
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
When you apply a function to the indexed column, use leading wildcards (`LIKE '%x'`), have low selectivity, mismatched types, or stale statistics. Keep predicates sargable and statistics fresh, or add a functional/partial index.

#### Code Example
```sql
-- non-sargable: index on created_at unused
WHERE DATE(created_at) = '2024-01-01'
-- sargable rewrite:
WHERE created_at >= '2024-01-01' AND created_at < '2024-01-02'
```
---

### Q40. Optimize a slow aggregation query
**Difficulty:** `Experienced`
**Category:** Advanced Query Scenarios

#### Answer
Index filter/group/join columns, filter early, avoid `SELECT *`, pre-aggregate in a CTE, consider a covering index or materialized view, and check the plan with `EXPLAIN ANALYZE` to confirm the fix.

#### Code Example
```sql
CREATE INDEX idx_orders_cust_date ON orders(customer_id, order_date);
CREATE MATERIALIZED VIEW cust_totals AS
  SELECT customer_id, SUM(amount) total FROM orders GROUP BY customer_id;
```
---
