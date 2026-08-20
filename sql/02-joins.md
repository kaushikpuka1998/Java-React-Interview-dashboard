# Joins Interview Questions (Q1 – Q40)

---

### Q1. What is a JOIN?
**Difficulty:** `Basic`
**Category:** Joins

#### Answer
A JOIN combines rows from two or more tables based on a related column, letting you query normalized data as a single result set.

#### Code Example
```sql
SELECT e.name, d.name AS dept
FROM employees e
JOIN departments d ON e.department_id = d.id;
```
---

### Q2. What is an INNER JOIN?
**Difficulty:** `Basic`
**Category:** Joins

#### Answer
An INNER JOIN returns only rows that have matching values in both tables. Rows without a match on either side are excluded.

#### Code Example
```sql
SELECT o.id, c.name
FROM orders o
INNER JOIN customers c ON o.customer_id = c.id;
```
---

### Q3. What is a LEFT JOIN?
**Difficulty:** `Basic`
**Category:** Joins

#### Answer
A LEFT (OUTER) JOIN returns all rows from the left table plus matching rows from the right; unmatched right columns are NULL.

#### Code Example
```sql
SELECT c.name, o.id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id;
```
---

### Q4. What is a RIGHT JOIN?
**Difficulty:** `Basic`
**Category:** Joins

#### Answer
A RIGHT JOIN returns all rows from the right table plus matches from the left; unmatched left columns are NULL. It's a mirror of LEFT JOIN.

#### Code Example
```sql
SELECT e.name, d.name AS dept
FROM employees e
RIGHT JOIN departments d ON e.department_id = d.id;
```
---

### Q5. What is a FULL OUTER JOIN?
**Difficulty:** `Intermediate`
**Category:** Joins

#### Answer
A FULL OUTER JOIN returns all rows from both tables, matching where possible and filling NULLs where there's no match on either side.

#### Code Example
```sql
SELECT c.name, o.id
FROM customers c
FULL OUTER JOIN orders o ON o.customer_id = c.id;
```
---

### Q6. What is a CROSS JOIN?
**Difficulty:** `Intermediate`
**Category:** Joins

#### Answer
A CROSS JOIN produces the Cartesian product — every row of the first table paired with every row of the second. Useful for generating combinations; dangerous if unintentional.

#### Code Example
```sql
SELECT s.size, c.color FROM sizes s CROSS JOIN colors c;
```
---

### Q7. What is a SELF JOIN?
**Difficulty:** `Intermediate`
**Category:** Joins

#### Answer
A self join joins a table to itself using aliases, useful for hierarchical/related-row queries like employees and their managers.

#### Code Example
```sql
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```
---

### Q8. Difference between INNER JOIN and LEFT JOIN
**Difficulty:** `Basic`
**Category:** Joins

#### Answer
INNER JOIN returns only matched rows; LEFT JOIN returns all left rows including unmatched ones (with NULLs). Use LEFT JOIN when you must keep rows that may lack a related record.

#### Code Example
```sql
-- customers with no orders appear only with LEFT JOIN
SELECT c.name, o.id FROM customers c LEFT JOIN orders o ON o.customer_id = c.id;
```
---

### Q9. Find rows in one table with no match in another
**Difficulty:** `Intermediate`
**Category:** Joins

#### Answer
Use a LEFT JOIN and filter where the right key `IS NULL` (anti-join), returning only unmatched left rows.

#### Code Example
```sql
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL; -- customers who never ordered
```
---

### Q10. Join three or more tables
**Difficulty:** `Intermediate`
**Category:** Joins

#### Answer
Chain JOIN clauses; each adds a table with its own ON condition. Order doesn't change results for inner joins but can affect readability and the optimizer's plan.

#### Code Example
```sql
SELECT o.id, c.name, p.title
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN products p ON o.product_id = p.id;
```
---

### Q11. Join on multiple columns
**Difficulty:** `Intermediate`
**Category:** Joins

#### Answer
Combine conditions in `ON` with `AND` when the relationship spans multiple columns (composite keys).

#### Code Example
```sql
SELECT *
FROM sales s
JOIN targets t ON s.region = t.region AND s.year = t.year;
```
---

### Q12. Difference between ON and WHERE in a join
**Difficulty:** `Advanced`
**Category:** Joins

#### Answer
For INNER JOIN they're equivalent. For OUTER JOINs, a condition in `ON` filters the match (preserving unmatched rows), while the same condition in `WHERE` runs after the join and can turn a LEFT JOIN into an effective INNER JOIN by removing NULL rows.

#### Code Example
```sql
-- keeps customers with no 2024 orders:
SELECT c.name, o.id FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.order_date >= '2024-01-01';
```
---

### Q13. Join a table to itself for hierarchy
**Difficulty:** `Intermediate`
**Category:** Joins

#### Answer
Self-join on the parent-key column to relate a row to its parent, e.g. employee → manager or category → parent category.

#### Code Example
```sql
SELECT child.name AS category, parent.name AS parent_category
FROM categories child
LEFT JOIN categories parent ON child.parent_id = parent.id;
```
---

### Q14. Count related rows per parent
**Difficulty:** `Intermediate`
**Category:** Joins

#### Answer
LEFT JOIN then `GROUP BY` the parent and `COUNT` the child key (not `*`) so parents with zero children count as 0.

#### Code Example
```sql
SELECT c.name, COUNT(o.id) AS order_count
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.name;
```
---

### Q15. Why COUNT(child.id) instead of COUNT(*) in a LEFT JOIN?
**Difficulty:** `Advanced`
**Category:** Joins

#### Answer
`COUNT(*)` counts the joined rows, so an unmatched parent (one row with NULLs) counts as 1. `COUNT(child.id)` counts non-NULL child keys, correctly yielding 0 for parents with no children.

#### Code Example
```sql
SELECT c.name, COUNT(o.id) AS orders -- 0 for customers with none
FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.name;
```
---

### Q16. Join and aggregate (sum per group)
**Difficulty:** `Intermediate`
**Category:** Joins

#### Answer
Join related tables, then `GROUP BY` a dimension and aggregate a measure, e.g. total order amount per customer.

#### Code Example
```sql
SELECT c.name, SUM(o.amount) AS total_spent
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.name;
```
---

### Q17. Avoid duplicate rows from one-to-many joins
**Difficulty:** `Advanced`
**Category:** Joins

#### Answer
Joining a one-to-many relationship multiplies parent rows. Deduplicate with aggregation (`GROUP BY`), `DISTINCT`, or by pre-aggregating the child table in a subquery before joining.

#### Code Example
```sql
SELECT c.name, sub.total
FROM customers c
JOIN (SELECT customer_id, SUM(amount) total FROM orders GROUP BY customer_id) sub
  ON sub.customer_id = c.id;
```
---

### Q18. Join with a filtered (derived) table
**Difficulty:** `Advanced`
**Category:** Joins

#### Answer
Join to a subquery (derived table) that pre-filters/aggregates data, reducing rows and clarifying intent.

#### Code Example
```sql
SELECT e.name, big.total
FROM employees e
JOIN (SELECT employee_id, SUM(amount) total FROM sales GROUP BY employee_id HAVING SUM(amount) > 100000) big
  ON big.employee_id = e.id;
```
---

### Q19. Semi-join with EXISTS vs JOIN
**Difficulty:** `Advanced`
**Category:** Joins

#### Answer
To check existence of related rows without duplicating parents, use `EXISTS` (a semi-join) instead of a JOIN. It stops at the first match and doesn't multiply rows.

#### Code Example
```sql
SELECT c.name FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```
---

### Q20. Anti-join with NOT EXISTS
**Difficulty:** `Advanced`
**Category:** Joins

#### Answer
`NOT EXISTS` returns parents with no matching child rows and, unlike `NOT IN`, behaves correctly when the subquery can produce NULLs.

#### Code Example
```sql
SELECT c.name FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```
---

### Q21. Difference between NOT IN and NOT EXISTS with NULLs
**Difficulty:** `Experienced`
**Category:** Joins

#### Answer
If the `NOT IN` subquery returns any NULL, the whole predicate becomes UNKNOWN and no rows are returned. `NOT EXISTS` is NULL-safe and generally preferred for anti-joins.

#### Code Example
```sql
-- risky if orders.customer_id has NULLs:
SELECT * FROM customers WHERE id NOT IN (SELECT customer_id FROM orders);
```
---

### Q22. Join using USING clause
**Difficulty:** `Intermediate`
**Category:** Joins

#### Answer
`USING(col)` is shorthand for `ON a.col = b.col` when the join columns share a name, and it collapses them into a single output column.

#### Code Example
```sql
SELECT * FROM orders JOIN customers USING (customer_id);
```
---

### Q23. Natural join and why to avoid it
**Difficulty:** `Advanced`
**Category:** Joins

#### Answer
`NATURAL JOIN` auto-joins on all same-named columns. It's risky because schema changes can silently alter the join condition; prefer explicit `ON`/`USING`.

#### Code Example
```sql
SELECT * FROM orders NATURAL JOIN customers; -- fragile, avoid in production
```
---

### Q24. Join to find matching pairs (e.g. same city)
**Difficulty:** `Advanced`
**Category:** Joins

#### Answer
Self-join on the shared attribute with an inequality on ids to avoid pairing a row with itself and to avoid mirror duplicates.

#### Code Example
```sql
SELECT a.name, b.name, a.city
FROM customers a
JOIN customers b ON a.city = b.city AND a.id < b.id;
```
---

### Q25. Left join with default values
**Difficulty:** `Intermediate`
**Category:** Joins

#### Answer
Wrap nullable right-side columns in `COALESCE` to supply defaults for unmatched rows.

#### Code Example
```sql
SELECT c.name, COALESCE(SUM(o.amount), 0) AS total
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.name;
```
---

### Q26. Join and filter on the right table correctly
**Difficulty:** `Advanced`
**Category:** Joins

#### Answer
To keep left rows while filtering the right table, put the right-table condition in `ON`, not `WHERE`; a `WHERE` filter on the right side removes unmatched (NULL) rows.

#### Code Example
```sql
SELECT c.name, o.id FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid';
```
---

### Q27. Join two tables and pick the latest related row
**Difficulty:** `Experienced`
**Category:** Joins

#### Answer
Use a lateral/correlated subquery or window function to fetch only the most recent child per parent, avoiding fan-out from all children.

#### Code Example
```sql
SELECT c.name, last_o.amount
FROM customers c
JOIN LATERAL (
  SELECT amount FROM orders o WHERE o.customer_id = c.id
  ORDER BY o.order_date DESC LIMIT 1
) last_o ON true;
```
---

### Q28. Join with aggregation and HAVING
**Difficulty:** `Advanced`
**Category:** Joins

#### Answer
Filter aggregated join results with `HAVING`, e.g. customers whose total spend exceeds a threshold.

#### Code Example
```sql
SELECT c.name, SUM(o.amount) AS total
FROM customers c JOIN orders o ON o.customer_id = c.id
GROUP BY c.name
HAVING SUM(o.amount) > 10000;
```
---

### Q29. Multiple LEFT JOINs
**Difficulty:** `Advanced`
**Category:** Joins

#### Answer
Chaining multiple LEFT JOINs keeps all base rows while attaching optional related data from several tables. Watch for row multiplication when several joined tables are one-to-many.

#### Code Example
```sql
SELECT e.name, d.name AS dept, p.name AS project
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN projects p ON p.lead_id = e.id;
```
---

### Q30. Emulate FULL OUTER JOIN in MySQL
**Difficulty:** `Experienced`
**Category:** Joins

#### Answer
MySQL lacks FULL OUTER JOIN; emulate it by `UNION`-ing a LEFT JOIN with a RIGHT JOIN (or a LEFT JOIN of the swapped tables with an anti-join filter).

#### Code Example
```sql
SELECT c.name, o.id FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
UNION
SELECT c.name, o.id FROM customers c RIGHT JOIN orders o ON o.customer_id = c.id;
```
---

### Q31. Join performance: indexing join keys
**Difficulty:** `Experienced`
**Category:** Joins

#### Answer
Index the columns used in `ON` (usually the foreign key on the child side; primary keys are already indexed). Without indexes the optimizer may resort to slow nested-loop or full scans.

#### Code Example
```sql
CREATE INDEX idx_orders_customer ON orders(customer_id);
```
---

### Q32. Nested loop vs hash vs merge join
**Difficulty:** `Experienced`
**Category:** Joins

#### Answer
Nested loop is best for small/indexed inputs; hash join suits large unsorted sets joined on equality; merge join is efficient for large pre-sorted/indexed inputs. The optimizer chooses based on statistics; `EXPLAIN` reveals which it picks.

#### Code Example
```sql
EXPLAIN SELECT * FROM orders o JOIN customers c ON o.customer_id = c.id;
```
---

### Q33. Join with a range condition
**Difficulty:** `Advanced`
**Category:** Joins

#### Answer
Joins can use inequalities (non-equi joins), e.g. matching a value to a band/tier table where it falls between bounds.

#### Code Example
```sql
SELECT e.name, t.grade
FROM employees e
JOIN salary_tiers t ON e.salary BETWEEN t.min_salary AND t.max_salary;
```
---

### Q34. Deduplicate a join result
**Difficulty:** `Intermediate`
**Category:** Joins

#### Answer
Use `DISTINCT` or aggregate to collapse duplicate rows produced by one-to-many joins when you only need unique parent rows.

#### Code Example
```sql
SELECT DISTINCT c.id, c.name
FROM customers c JOIN orders o ON o.customer_id = c.id;
```
---

### Q35. Join to a numbers/calendar table
**Difficulty:** `Experienced`
**Category:** Joins

#### Answer
Join to a generated calendar/numbers table to include periods (e.g. days/months) that have no data, producing gap-free reports with zeros.

#### Code Example
```sql
SELECT d.day, COALESCE(COUNT(o.id), 0) AS orders
FROM calendar d
LEFT JOIN orders o ON o.order_date = d.day
GROUP BY d.day ORDER BY d.day;
```
---

### Q36. Combine data with a UNION vs JOIN — which to use?
**Difficulty:** `Intermediate`
**Category:** Joins

#### Answer
JOIN combines columns from related tables (widening rows); UNION stacks rows from similar-shaped queries (lengthening the result). Use JOIN for relationships, UNION for concatenating sets.

#### Code Example
```sql
-- JOIN adds columns; UNION adds rows
SELECT name FROM employees UNION SELECT name FROM contractors;
```
---

### Q37. Find common rows between two tables
**Difficulty:** `Intermediate`
**Category:** Joins

#### Answer
An INNER JOIN on the key (or `INTERSECT`) returns rows present in both tables.

#### Code Example
```sql
SELECT a.id FROM table_a a JOIN table_b b ON a.id = b.id;
```
---

### Q38. Join with conditional aggregation
**Difficulty:** `Experienced`
**Category:** Joins

#### Answer
Combine a join with `SUM(CASE WHEN ...)` to compute multiple conditional measures in one pass (pivot-like).

#### Code Example
```sql
SELECT c.name,
  SUM(CASE WHEN o.status='paid' THEN o.amount ELSE 0 END) AS paid,
  SUM(CASE WHEN o.status='refunded' THEN o.amount ELSE 0 END) AS refunded
FROM customers c JOIN orders o ON o.customer_id = c.id
GROUP BY c.name;
```
---

### Q39. Join order and the optimizer
**Difficulty:** `Experienced`
**Category:** Joins

#### Answer
For inner joins, the written order doesn't dictate execution — the cost-based optimizer reorders based on statistics and indexes. Keeping statistics fresh and indexing keys matters more than manual ordering.

#### Code Example
```sql
ANALYZE orders; -- refresh statistics so the optimizer picks a good join order
```
---

### Q40. Join to explode an array/JSON (lateral)
**Difficulty:** `Experienced`
**Category:** Joins

#### Answer
Use a lateral join (`CROSS JOIN LATERAL` / `unnest` / `json_array_elements`) to expand array or JSON values into rows joined back to the parent.

#### Code Example
```sql
SELECT p.id, tag
FROM posts p
CROSS JOIN LATERAL unnest(p.tags) AS tag;
```
---
