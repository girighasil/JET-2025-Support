-- Create new enrollment requests table
CREATE TABLE IF NOT EXISTS enrollment_requests (
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  reviewed_by INTEGER,
  reviewed_at TIMESTAMP,
  PRIMARY KEY (user_id, course_id)
);

-- Create index for faster lookups by status
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_status ON enrollment_requests(status);

-- Create index for finding all requests for a specific course
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_course ON enrollment_requests(course_id);

-- Create index for finding all requests by a specific user
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_user ON enrollment_requests(user_id);