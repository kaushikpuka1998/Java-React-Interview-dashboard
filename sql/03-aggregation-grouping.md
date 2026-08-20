# Aggregation & Grouping Interview Questions (Q1 – Q40)

---

### Q1. What are aggregate functions?
**Difficulty:** `Basic`
**Category:** Aggregation & Grouping

#### Answer
Aggregate functions compute a single value over a set of rows: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`. They're used with or without `GROUP BY`.

#### Code Example
```sql
SELECT COUNT(*), AVG(salary), MAX(salary) FROM employees;
```
---

### Q2. What is GROUP BY?
**Difficulty:** `Basic`
**Category:** Aggregation & Grouping

#### Answer
`GROUP BY` partitions rows into groups by one or more columns, and aggregates are computed per group.

#### Code Example
```sql
SELECT department, COUNT(*) FROM employees GROUP BY department;
```
---

### Q3. Difference between WHERE and HAVING
**Difficulty:** `Intermediate`
**Category:** Aggregation & Grouping

#### Answer
`WHERE` filters rows before grouping; `HAVING` filters groups after aggregation. Aggregate conditions must go in `HAVING`.

#### Code Example
```sql
SELECT department, AVG(salary) avg_sal
FROM employees
WHERE status = 'active'          -- row filter
GROUP BY department
HAVING AVG(salary) > 60000;      -- group filter
```
---

### Q4. Sum a column per group
**Difficulty:** `Basic`
**Category:** Aggregation & Grouping

#### Answer
`SUM(col)` totals values within each group defined by `GROUP BY`.

#### Code Example
```sql
SELECT department, SUM(salary) AS total_payroll
FROM employees GROUP BY department;
```
---

### Q5. Average with rounding
**Difficulty:** `Basic`
**Category:** Aggregation & Grouping

#### Answer
`AVG` ignores NULLs. Wrap in `ROUND` for clean output.

#### Code Example
```sql
SELECT department, ROUND(AVG(salary), 2) AS avg_salary
FROM employees GROUP BY department;
```
---

### Q6. Count distinct values per group
**Difficulty:** `Intermediate`
**Category:** Aggregation & Grouping

#### Answer
`COUNT(DISTINCT col)` counts unique non-NULL values within each group.

#### Code Example
```sql
SELECT department, COUNT(DISTINCT job_title) AS distinct_roles
FROM employees GROUP BY department;
```
---

### Q7. How do aggregates handle NULLs?
**Difficulty:** `Advanced`
**Category:** Aggregation & Grouping

#### Answer
Aggregates (except `COUNT(*)`) ignore NULLs. `COUNT(col)` skips NULLs; `AVG`/`SUM` compute over non-NULLs only; `COUNT(*)` counts every row.

#### Code Example
```sql
-- AVG divides by count of non-NULL commissions, not total rows
SELECT AVG(commission) FROM employees;
```
---

### Q8. Group by multiple columns
**Difficulty:** `Intermediate`
**Category:** Aggregation & Grouping

#### Answer
List several columns in `GROUP BY` to form groups per unique combination.

#### Code Example
```sql
SELECT department, gender, COUNT(*) 
FROM employees GROUP BY department, gender;
```
---

### Q9. Filter groups with HAVING and COUNT
**Difficulty:** `Intermediate`
**Category:** Aggregation & Grouping

#### Answer
Use `HAVING COUNT(*) > n` to keep only groups meeting a size threshold, e.g. departments with more than 5 employees.

#### Code Example
```sql
SELECT department, COUNT(*) AS headcount
FROM employees GROUP BY department HAVING COUNT(*) > 5;
```
---

### Q10. Find duplicate values
**Difficulty:** `Intermediate`
**Category:** Aggregation & Grouping

#### Answer
Group by the column(s) and keep groups with `COUNT(*) > 1` to identify duplicates.

#### Code Example
```sql
SELECT email, COUNT(*) AS cnt
FROM users GROUP BY email HAVING COUNT(*) > 1;
```
---

### Q11. Delete duplicate rows keeping one
**Difficulty:** `Experienced`
**Category:** Aggregation & Grouping

#### Answer
Use a window function (`ROW_NUMBER` per duplicate group) and delete rows where the row number > 1, or delete rows whose id isn't the min per group.

#### Code Example
```sql
DELETE FROM users
WHERE id NOT IN (SELECT MIN(id) FROM users GROUP BY email);
```
---

### Q12. Can you use aggregate functions in WHERE?
**Difficulty:** `Intermediate`
**Category:** Aggregation & Grouping

#### Answer
No. `WHERE` runs before aggregation, so aggregates belong in `HAVING` (or a subquery). Putting `SUM()`/`COUNT()` in `WHERE` is a syntax error.

#### Code Example
```sql
-- wrong: WHERE COUNT(*) > 5
SELECT department FROM employees GROUP BY department HAVING COUNT(*) > 5;
```
---

### Q13. Conditional aggregation (pivot with CASE)
**Difficulty:** `Advanced`
**Category:** Aggregation & Grouping

#### Answer
Use `SUM(CASE WHEN ... THEN 1 ELSE 0 END)` or `COUNT(CASE ...)` to compute multiple conditional counts/sums in one query — a manual pivot.

#### Code Example
```sql
SELECT department,
  SUM(CASE WHEN gender='Male' THEN 1 ELSE 0 END) AS males,
  SUM(CASE WHEN gender='Female' THEN 1 ELSE 0 END) AS females
FROM employees GROUP BY department;
```
---

### Q14. Group and order by an aggregate
**Difficulty:** `Basic`
**Category:** Aggregation & Grouping

#### Answer
You can `ORDER BY` an aggregate or its alias to rank groups, e.g. departments by total salary descending.

#### Code Example
```sql
SELECT department, SUM(salary) AS total
FROM employees GROUP BY department ORDER BY total DESC;
```
---

### Q15. Every non-aggregated column must be in GROUP BY
**Difficulty:** `Advanced`
**Category:** Aggregation & Grouping

#### Answer
In standard SQL, columns in `SELECT` that aren't aggregated must appear in `GROUP BY`. MySQL historically relaxed this (ONLY_FULL_GROUP_BY off), which can return arbitrary values — avoid relying on it.

#### Code Example
```sql
-- name isn't functionally dependent on department -> must aggregate or group it
SELECT department, MAX(name) FROM employees GROUP BY department;
```
---

### Q16. Compute min and max per group
**Difficulty:** `Basic`
**Category:** Aggregation & Grouping

#### Answer
`MIN`/`MAX` return the smallest/largest value per group.

#### Code Example
```sql
SELECT department, MIN(salary) AS lowest, MAX(salary) AS highest
FROM employees GROUP BY department;
```
---

### Q17. Percentage of total per group
**Difficulty:** `Experienced`
**Category:** Aggregation & Grouping

#### Answer
Divide a group's aggregate by the grand total using a window function (`SUM(...) OVER ()`) or a subquery for the total.

#### Code Example
```sql
SELECT department, SUM(salary) AS total,
  ROUND(100.0 * SUM(salary) / SUM(SUM(salary)) OVER (), 2) AS pct
FROM employees GROUP BY department;
```
---

### Q18. GROUP BY with ROLLUP (subtotals)
**Difficulty:** `Experienced`
**Category:** Aggregation & Grouping

#### Answer
`GROUP BY ROLLUP(a, b)` adds subtotal and grand-total rows (with NULL group keys) to the result, useful for hierarchical reporting.

#### Code Example
```sql
SELECT department, gender, SUM(salary)
FROM employees GROUP BY ROLLUP(department, gender);
```
---

### Q19. GROUP BY CUBE
**Difficulty:** `Experienced`
**Category:** Aggregation & Grouping

#### Answer
`CUBE(a, b)` produces aggregates for all combinations of the grouping columns (all subtotals across every dimension), unlike ROLLUP's hierarchical subtotals.

#### Code Example
```sql
SELECT department, gender, SUM(salary)
FROM employees GROUP BY CUBE(department, gender);
```
---

### Q20. GROUPING SETS
**Difficulty:** `Experienced`
**Category:** Aggregation & Grouping

#### Answer
`GROUPING SETS` lets you specify exactly which groupings to compute in one query, combining multiple `GROUP BY` results without multiple passes.

#### Code Example
```sql
SELECT department, gender, SUM(salary)
FROM employees GROUP BY GROUPING SETS ((department), (gender), ());
```
---

### Q21. Count rows matching a condition without WHERE
**Difficulty:** `Intermediate`
**Category:** Aggregation & Grouping

#### Answer
Use `COUNT(CASE WHEN cond THEN 1 END)` or `SUM(cond::int)` to count matches while still returning other aggregates over all rows.

#### Code Example
```sql
SELECT COUNT(*) AS total,
       COUNT(CASE WHEN salary > 80000 THEN 1 END) AS high_earners
FROM employees;
```
---

### Q22. Average excluding outliers
**Difficulty:** `Experienced`
**Category:** Aggregation & Grouping

#### Answer
Filter outliers in `WHERE` before aggregating, or use percentiles to trim. `AVG` is sensitive to extremes, so consider `MEDIAN`/`PERCENTILE_CONT`.

#### Code Example
```sql
SELECT AVG(salary) FROM employees
WHERE salary BETWEEN 20000 AND 200000;
```
---

### Q23. Median with PERCENTILE_CONT
**Difficulty:** `Experienced`
**Category:** Aggregation & Grouping

#### Answer
`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY col)` computes the median (an ordered-set aggregate) since SQL has no built-in MEDIAN.

#### Code Example
```sql
SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) AS median_salary
FROM employees;
```
---

### Q24. String aggregation (concatenate group values)
**Difficulty:** `Advanced`
**Category:** Aggregation & Grouping

#### Answer
`STRING_AGG(col, ', ')` (Postgres/SQL Server) or `GROUP_CONCAT` (MySQL) concatenates group values into one string, optionally ordered.

#### Code Example
```sql
SELECT department, STRING_AGG(name, ', ' ORDER BY name) AS members
FROM employees GROUP BY department;
```
---

### Q25. Array aggregation
**Difficulty:** `Advanced`
**Category:** Aggregation & Grouping

#### Answer
`ARRAY_AGG(col)` (Postgres) collects group values into an array, useful for nesting related values without a separate query.

#### Code Example
```sql
SELECT department, ARRAY_AGG(name) AS employee_names
FROM employees GROUP BY department;
```
---

### Q26. Filter aggregates with FILTER clause
**Difficulty:** `Experienced`
**Category:** Aggregation & Grouping

#### Answer
The SQL-standard `FILTER (WHERE ...)` clause restricts which rows an aggregate sees, a cleaner alternative to `CASE` inside the aggregate (Postgres).

#### Code Example
```sql
SELECT department,
  COUNT(*) FILTER (WHERE salary > 80000) AS high_earners
FROM employees GROUP BY department;
```
---

### Q27. Count groups (number of distinct groups)
**Difficulty:** `Intermediate`
**Category:** Aggregation & Grouping

#### Answer
Wrap the grouped query in a subquery and `COUNT(*)`, or use `COUNT(DISTINCT col)` for a single grouping column.

#### Code Example
```sql
SELECT COUNT(DISTINCT department) AS num_departments FROM employees;
```
---

### Q28. Find groups where all rows meet a condition
**Difficulty:** `Experienced`
**Category:** Aggregation & Grouping

#### Answer
Compare total count to conditional count: a group where every row matches has `COUNT(*) = COUNT(CASE WHEN cond THEN 1 END)`.

#### Code Example
```sql
SELECT department FROM employees
GROUP BY department
HAVING COUNT(*) = COUNT(CASE WHEN salary > 40000 THEN 1 END);
```
---

### Q29. Find groups where no row meets a condition
**Difficulty:** `Advanced`
**Category:** Aggregation & Grouping

#### Answer
Use `HAVING COUNT(CASE WHEN cond THEN 1 END) = 0` to keep groups with zero matching rows.

#### Code Example
```sql
SELECT department FROM employees
GROUP BY department
HAVING COUNT(CASE WHEN salary > 150000 THEN 1 END) = 0;
```
---

### Q30. Aggregate over a date/time bucket
**Difficulty:** `Advanced`
**Category:** Aggregation & Grouping

#### Answer
Truncate the timestamp to the desired granularity (`DATE_TRUNC('month', ts)`) and group by it for time-series aggregation.

#### Code Example
```sql
SELECT DATE_TRUNC('month', order_date) AS month, SUM(amount) AS revenue
FROM orders GROUP BY 1 ORDER BY 1;
```
---

### Q31. Group by an expression
**Difficulty:** `Intermediate`
**Category:** Aggregation & Grouping

#### Answer
`GROUP BY` can use expressions (or ordinal positions / aliases in some DBs), e.g. grouping by year extracted from a date.

#### Code Example
```sql
SELECT EXTRACT(YEAR FROM hire_date) AS yr, COUNT(*) 
FROM employees GROUP BY EXTRACT(YEAR FROM hire_date);
```
---

### Q32. HAVING without GROUP BY
**Difficulty:** `Advanced`
**Category:** Aggregation & Grouping

#### Answer
`HAVING` can be used without `GROUP BY` when the whole table is one implicit group, filtering based on a table-wide aggregate.

#### Code Example
```sql
SELECT COUNT(*) FROM orders HAVING COUNT(*) > 1000;
```
---

### Q33. Running total with SUM OVER
**Difficulty:** `Experienced`
**Category:** Aggregation & Grouping

#### Answer
A windowed `SUM(...) OVER (ORDER BY ...)` computes a cumulative running total without collapsing rows — an aggregate used as a window function.

#### Code Example
```sql
SELECT order_date, amount,
  SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders;
```
---

### Q34. Average per group alongside detail rows
**Difficulty:** `Experienced`
**Category:** Aggregation & Grouping

#### Answer
Use `AVG(...) OVER (PARTITION BY group)` to attach a group average to every detail row without a self-join or `GROUP BY`.

#### Code Example
```sql
SELECT name, department, salary,
  AVG(salary) OVER (PARTITION BY department) AS dept_avg
FROM employees;
```
---

### Q35. Count NULLs in a column
**Difficulty:** `Intermediate`
**Category:** Aggregation & Grouping

#### Answer
`COUNT(*) - COUNT(col)` gives the NULL count, since `COUNT(col)` skips NULLs. Or `SUM(CASE WHEN col IS NULL THEN 1 ELSE 0 END)`.

#### Code Example
```sql
SELECT COUNT(*) - COUNT(commission) AS null_commissions FROM employees;
```
---

### Q36. Group data into ranges/buckets
**Difficulty:** `Advanced`
**Category:** Aggregation & Grouping

#### Answer
Derive a bucket with `CASE` or `WIDTH_BUCKET`/`FLOOR`, then group by it to build histograms.

#### Code Example
```sql
SELECT FLOOR(salary / 20000) * 20000 AS band, COUNT(*)
FROM employees GROUP BY FLOOR(salary / 20000) GROUP BY 1;
```
---

### Q37. Total with grand total row using UNION
**Difficulty:** `Advanced`
**Category:** Aggregation & Grouping

#### Answer
`UNION ALL` a grand-total query onto the grouped result (or use `ROLLUP`) to append an overall total.

#### Code Example
```sql
SELECT department, SUM(salary) FROM employees GROUP BY department
UNION ALL
SELECT 'ALL', SUM(salary) FROM employees;
```
---

### Q38. Weighted average
**Difficulty:** `Experienced`
**Category:** Aggregation & Grouping

#### Answer
Compute `SUM(value * weight) / SUM(weight)` rather than a plain `AVG`, when rows contribute unequally.

#### Code Example
```sql
SELECT product_id, SUM(price * quantity) / SUM(quantity) AS avg_price
FROM order_items GROUP BY product_id;
```
---

### Q39. Aggregate then join back to detail
**Difficulty:** `Experienced`
**Category:** Aggregation & Grouping

#### Answer
Compute group aggregates in a subquery/CTE, then join back to detail rows to compare each row against its group stat (e.g. above-average earners).

#### Code Example
```sql
WITH dept_avg AS (
  SELECT department, AVG(salary) avg_sal FROM employees GROUP BY department)
SELECT e.name, e.salary
FROM employees e JOIN dept_avg d ON e.department = d.department
WHERE e.salary > d.avg_sal;
```
---

### Q40. Why is GROUP BY slow and how to speed it up?
**Difficulty:** `Experienced`
**Category:** Aggregation & Grouping

#### Answer
`GROUP BY` may sort/hash large inputs. Speed it up with indexes on grouping columns (enabling index-ordered grouping), filtering rows early in `WHERE`, pre-aggregating, or materialized views for repeated heavy aggregations.

#### Code Example
```sql
CREATE INDEX idx_emp_dept ON employees(department);
EXPLAIN SELECT department, COUNT(*) FROM employees GROUP BY department;
```
---
