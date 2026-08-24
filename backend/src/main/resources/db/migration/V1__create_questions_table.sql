-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(100) PRIMARY KEY,
    number INTEGER NOT NULL,
    display_number INTEGER NOT NULL,
    sort_key INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    difficulty VARCHAR(50),
    category VARCHAR(200),
    tech VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_questions_tech ON questions(tech);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_number ON questions(number);
CREATE INDEX IF NOT EXISTS idx_questions_sort_key ON questions(sort_key);
CREATE INDEX IF NOT EXISTS idx_questions_tech_number ON questions(tech, number);