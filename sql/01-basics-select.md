# SQL Basics & SELECT Interview Questions (Q1 – Q40)

---

### Q1. Select all columns from a table
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
`SELECT *` returns every column. In production prefer listing columns explicitly to avoid fetching unneeeded data and to stay stable if the schema changes.

#### Code Example
```sql
SELECT * FROM employees;
```
---

### Q2. Select specific columns
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
List the column names after `SELECT`. This reduces I/O and makes intent clear.

#### Code Example
```sql
SELECT id, name, salary FROM employees;
```
---

### Q3. Filter rows with WHERE
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
`WHERE` restricts rows to those matching a condition, evaluated before grouping and selection.

#### Code Example
```sql
SELECT name, salary FROM employees WHERE salary > 50000;
```
---

### Q4. Sort results with ORDER BY
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
`ORDER BY column [ASC|DESC]` sorts the result. Default is ascending; use `DESC` for descending and list multiple columns for tie-breaking.

#### Code Example
```sql
SELECT name, salary FROM employees ORDER BY salary DESC, name ASC;
```
---

### Q5. Return only unique values with DISTINCT
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
`DISTINCT` removes duplicate rows from the result set based on the selected columns.

#### Code Example
```sql
SELECT DISTINCT department FROM employees;
```
---

### Q6. Limit the number of rows returned
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
Use `LIMIT n` (MySQL/Postgres) or `FETCH FIRST n ROWS ONLY` / `TOP n` (SQL Server) to cap rows, typically after `ORDER BY`.

#### Code Example
```sql
SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 5;
```
---

### Q7. Skip rows with OFFSET (pagination)
**Difficulty:** `Intermediate`
**Category:** SQL Basics & SELECT

#### Answer
`OFFSET n` skips the first n rows; combined with `LIMIT` it implements page-based pagination. Large offsets are slow because the DB still scans skipped rows.

#### Code Example
```sql
SELECT name FROM employees ORDER BY id LIMIT 10 OFFSET 20; -- page 3, size 10
```
---

### Q8. Filter with multiple conditions (AND / OR)
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
Combine conditions with `AND`/`OR`; use parentheses to control precedence since `AND` binds tighter than `OR`.

#### Code Example
```sql
SELECT * FROM employees
WHERE department = 'Sales' AND (salary > 60000 OR manager_id IS NULL);
```
---

### Q9. Filter a range with BETWEEN
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
`BETWEEN a AND b` is inclusive of both bounds. It's shorthand for `col >= a AND col <= b`.

#### Code Example
```sql
SELECT name, salary FROM employees WHERE salary BETWEEN 40000 AND 60000;
```
---

### Q10. Filter a list with IN
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
`IN (...)` matches any value in the list, a cleaner alternative to multiple `OR`s.

#### Code Example
```sql
SELECT * FROM employees WHERE department IN ('Sales', 'HR', 'Finance');
```
---

### Q11. Pattern matching with LIKE
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
`LIKE` matches patterns: `%` = any sequence of characters, `_` = a single character. Use `ILIKE` (Postgres) for case-insensitive matching.

#### Code Example
```sql
SELECT name FROM employees WHERE name LIKE 'A%';   -- starts with A
SELECT name FROM employees WHERE name LIKE '_a%';  -- 'a' as 2nd char
```
---

### Q12. Handle NULL values (IS NULL / IS NOT NULL)
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
NULL means "unknown"; comparisons with `=` don't work. Use `IS NULL` / `IS NOT NULL`. `NULL = NULL` is not true.

#### Code Example
```sql
SELECT name FROM employees WHERE manager_id IS NULL;
```
---

### Q13. Replace NULLs with a default (COALESCE)
**Difficulty:** `Intermediate`
**Category:** SQL Basics & SELECT

#### Answer
`COALESCE(a, b, ...)` returns the first non-NULL argument, useful for substituting defaults.

#### Code Example
```sql
SELECT name, COALESCE(commission, 0) AS commission FROM employees;
```
---

### Q14. Alias columns and tables (AS)
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
`AS` renames columns/tables in the output or for shorter references. The keyword is optional for table aliases.

#### Code Example
```sql
SELECT e.name AS employee_name, e.salary * 12 AS annual_salary
FROM employees e;
```
---

### Q15. Concatenate strings
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
Use `||` (standard/Postgres/Oracle) or `CONCAT(...)` (MySQL/SQL Server) to join strings.

#### Code Example
```sql
SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM employees;
```
---

### Q16. Compute values in SELECT (arithmetic)
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
You can include expressions in `SELECT`; they're evaluated per row.

#### Code Example
```sql
SELECT name, salary, salary * 0.10 AS bonus FROM employees;
```
---

### Q17. Conditional logic with CASE
**Difficulty:** `Intermediate`
**Category:** SQL Basics & SELECT

#### Answer
`CASE WHEN ... THEN ... ELSE ... END` returns different values per row based on conditions — SQL's if/else.

#### Code Example
```sql
SELECT name,
  CASE WHEN salary >= 80000 THEN 'High'
       WHEN salary >= 50000 THEN 'Medium'
       ELSE 'Low' END AS band
FROM employees;
```
---

### Q18. Convert case and trim strings
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
`UPPER`/`LOWER` change case; `TRIM`/`LTRIM`/`RTRIM` remove whitespace. Handy for normalizing text before comparison.

#### Code Example
```sql
SELECT UPPER(name) AS upper_name, TRIM(department) AS dept FROM employees;
```
---

### Q19. Extract a substring
**Difficulty:** `Intermediate`
**Category:** SQL Basics & SELECT

#### Answer
`SUBSTRING(str FROM start FOR length)` (or `SUBSTR`) extracts part of a string; positions are usually 1-based.

#### Code Example
```sql
SELECT SUBSTRING(name FROM 1 FOR 3) AS prefix FROM employees;
```
---

### Q20. Get the length of a string
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
`LENGTH(str)` (or `LEN` in SQL Server) returns the number of characters.

#### Code Example
```sql
SELECT name, LENGTH(name) AS name_len FROM employees;
```
---

### Q21. Round and format numbers
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
`ROUND(value, decimals)` rounds; `CEIL`/`FLOOR` go up/down. Use for currency and display formatting.

#### Code Example
```sql
SELECT name, ROUND(salary / 12.0, 2) AS monthly FROM employees;
```
---

### Q22. Get the current date/time
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
`CURRENT_DATE`, `CURRENT_TIMESTAMP` (or `NOW()`) return the current date/time from the database server.

#### Code Example
```sql
SELECT name, hire_date, CURRENT_DATE - hire_date AS days_employed FROM employees;
```
---

### Q23. Extract parts of a date
**Difficulty:** `Intermediate`
**Category:** SQL Basics & SELECT

#### Answer
`EXTRACT(YEAR FROM date)` (or `YEAR()`/`MONTH()`) pulls date components, useful for grouping by year/month.

#### Code Example
```sql
SELECT name, EXTRACT(YEAR FROM hire_date) AS hire_year FROM employees;
```
---

### Q24. Filter by date range
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
Compare date columns with literals or use `BETWEEN`. Prefer half-open ranges (`>= start AND < next_day`) to correctly include timestamps.

#### Code Example
```sql
SELECT * FROM orders WHERE order_date >= '2024-01-01' AND order_date < '2024-02-01';
```
---

### Q25. Count rows
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
`COUNT(*)` counts all rows; `COUNT(col)` counts non-NULL values of a column; `COUNT(DISTINCT col)` counts unique non-NULL values.

#### Code Example
```sql
SELECT COUNT(*) AS total, COUNT(DISTINCT department) AS depts FROM employees;
```
---

### Q26. Order NULLs first or last
**Difficulty:** `Intermediate`
**Category:** SQL Basics & SELECT

#### Answer
`ORDER BY col NULLS LAST` (Postgres/Oracle) controls NULL placement. In MySQL, sort on `col IS NULL` first to emulate it.

#### Code Example
```sql
SELECT name, commission FROM employees ORDER BY commission DESC NULLS LAST;
```
---

### Q27. Filter with NOT
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
`NOT` negates a condition; combine with `IN`, `LIKE`, `BETWEEN`. Beware `NOT IN` with NULLs, which can return no rows unexpectedly.

#### Code Example
```sql
SELECT * FROM employees WHERE department NOT IN ('HR', 'Legal');
```
---

### Q28. Use column aliases in ORDER BY
**Difficulty:** `Intermediate`
**Category:** SQL Basics & SELECT

#### Answer
`ORDER BY` can reference a `SELECT` alias (it's evaluated after projection), unlike `WHERE`, which cannot use aliases.

#### Code Example
```sql
SELECT name, salary * 12 AS annual FROM employees ORDER BY annual DESC;
```
---

### Q29. Return a constant/computed column
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
You can select literals or expressions without a table reference for testing, or add a constant tag column to results.

#### Code Example
```sql
SELECT name, 'active' AS status FROM employees;
```
---

### Q30. Filter with comparison operators
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
Standard operators: `=`, `<>`/`!=`, `<`, `>`, `<=`, `>=`. Use them in `WHERE`/`HAVING`.

#### Code Example
```sql
SELECT name FROM employees WHERE salary <> 50000;
```
---

### Q31. Combine result sets with UNION
**Difficulty:** `Intermediate`
**Category:** SQL Basics & SELECT

#### Answer
`UNION` stacks two result sets (same columns/types) and removes duplicates; `UNION ALL` keeps duplicates and is faster.

#### Code Example
```sql
SELECT name FROM employees
UNION
SELECT name FROM contractors;
```
---

### Q32. Difference between UNION and UNION ALL
**Difficulty:** `Intermediate`
**Category:** SQL Basics & SELECT

#### Answer
`UNION` deduplicates (extra sort/hash cost); `UNION ALL` returns everything including duplicates and is more performant when you know rows are distinct or duplicates are acceptable.

#### Code Example
```sql
SELECT city FROM customers
UNION ALL
SELECT city FROM suppliers; -- keeps duplicates
```
---

### Q33. INTERSECT and EXCEPT
**Difficulty:** `Advanced`
**Category:** SQL Basics & SELECT

#### Answer
`INTERSECT` returns rows common to both queries; `EXCEPT` (`MINUS` in Oracle) returns rows in the first not in the second. Both deduplicate.

#### Code Example
```sql
SELECT id FROM active_users
EXCEPT
SELECT id FROM banned_users;
```
---

### Q34. Cast/convert data types
**Difficulty:** `Intermediate`
**Category:** SQL Basics & SELECT

#### Answer
`CAST(expr AS type)` (or `::type` in Postgres) converts between types, e.g. text to number or date.

#### Code Example
```sql
SELECT CAST(salary AS VARCHAR) AS salary_text, order_date::DATE FROM orders;
```
---

### Q35. Filter using a computed condition
**Difficulty:** `Intermediate`
**Category:** SQL Basics & SELECT

#### Answer
You can put expressions in `WHERE`, but applying functions to a column can prevent index use. Prefer sargable predicates (compare the raw column to a computed constant).

#### Code Example
```sql
-- non-sargable: WHERE YEAR(order_date) = 2024
SELECT * FROM orders WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01';
```
---

### Q36. Return top N per simple sort
**Difficulty:** `Intermediate`
**Category:** SQL Basics & SELECT

#### Answer
Combine `ORDER BY` with `LIMIT`/`FETCH FIRST`/`TOP`. Ensure a deterministic order (add a tie-breaker) for stable results.

#### Code Example
```sql
SELECT name, salary FROM employees ORDER BY salary DESC, id LIMIT 3;
```
---

### Q37. Use aliases with expressions and functions
**Difficulty:** `Basic`
**Category:** SQL Basics & SELECT

#### Answer
Give computed columns clear aliases so the result set has meaningful names for downstream code.

#### Code Example
```sql
SELECT name, ROUND(salary * 1.1, 2) AS raised_salary FROM employees;
```
---

### Q38. Filter rows by string length
**Difficulty:** `Intermediate`
**Category:** SQL Basics & SELECT

#### Answer
Use `LENGTH()` in the `WHERE` clause. Note applying a function to the column may bypass indexes.

#### Code Example
```sql
SELECT name FROM employees WHERE LENGTH(name) > 10;
```
---

### Q39. Replace substring values
**Difficulty:** `Intermediate`
**Category:** SQL Basics & SELECT

#### Answer
`REPLACE(str, from, to)` substitutes all occurrences of a substring — useful for cleaning/formatting text.

#### Code Example
```sql
SELECT REPLACE(phone, '-', '') AS digits FROM customers;
```
---

### Q40. Order of SQL clause evaluation
**Difficulty:** `Advanced`
**Category:** SQL Basics & SELECT

#### Answer
Logical order: `FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT`. This is why `WHERE` can't use `SELECT` aliases but `ORDER BY` can.

#### Code Example
```sql
-- WHERE runs before SELECT, so it can't reference the alias 'annual'
SELECT salary * 12 AS annual FROM employees WHERE salary > 40000 ORDER BY annual;
```
---
