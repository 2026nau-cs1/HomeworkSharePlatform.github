-- StudyShare Sample Data (MySQL 8.0)
USE studyshare;

-- Insert sample materials with English descriptions to avoid encoding issues
INSERT INTO `Materials` (`title`, `description`, `course_code`, `department`, `type`, `file_format`, `uploader_id`, `uploader_name`, `semester`, `professor`, `download_count`, `average_rating`, `rating_count`, `status`, `is_trending`)
VALUES
  ('Data Structures and Algorithms Notes', 'Complete notes covering arrays, linked lists, trees, graphs', 'CS201', 'Computer Science', 'notes', 'PDF', 1, 'Student Li', 'Fall 2024', 'Prof. Wang', 2341, 4.90, 128, 'approved', TRUE),
  ('Advanced Mathematics Exam Collection', 'Final exam problems from 2019-2024 with solutions', 'MATH101', 'Mathematics', 'exam', 'PDF', 1, 'Student Zhang', '2023-2024', 'Prof. Chen', 1987, 4.80, 96, 'approved', TRUE),
  ('Microeconomics Study Guide', 'Supply, demand, market structure, game theory', 'ECON201', 'Economics', 'guide', 'DOCX', 1, 'Student Wang', 'Spring 2024', 'Prof. Liu', 1654, 4.60, 74, 'approved', TRUE),
  ('Operating Systems - Process Management', 'Process scheduling, memory paging, virtual memory', 'CS301', 'Computer Science', 'notes', 'PDF', 1, 'Student Li', 'Fall 2024', 'Prof. Wang', 847, 4.90, 52, 'approved', FALSE),
  ('Linear Algebra Exams', 'Matrix operations, eigenvalues, linear transformations', 'MATH202', 'Mathematics', 'exam', 'PDF', 1, 'Student Zhang', '2023-2024', 'Prof. Chen', 1203, 4.80, 61, 'approved', FALSE),
  ('English CET-4 Preparation Guide', 'Vocabulary, reading, writing preparation', 'ENG101', 'Foreign Languages', 'guide', 'DOCX', 1, 'Student Wang', 'June 2025', 'Prof. Li', 432, 4.50, 38, 'approved', FALSE),
  ('Quantum Mechanics PPT Slides', 'Wave functions, Schrodinger equation', 'PHYS301', 'Physics', 'slides', 'PPTX', 1, 'Student Zhao', 'Fall 2024', 'Prof. Zhang', 678, 4.70, 45, 'approved', FALSE),
  ('Corporate Law Notes', 'Company establishment, equity structure', 'LAW201', 'Law School', 'notes', 'PDF', 1, 'Student Chen', 'Spring 2024', 'Prof. Wu', 321, 4.40, 29, 'approved', FALSE),
  ('Organic Chemistry Reaction Mechanisms', 'Nucleophilic substitution, elimination reactions', 'CHEM201', 'Chemistry', 'guide', 'PDF', 1, 'Student Liu', 'Fall 2024', 'Prof. Zhou', 543, 4.60, 41, 'approved', FALSE),
  ('Macroeconomics Review Notes', 'GDP, monetary policy, fiscal policy', 'ECON301', 'Economics', 'notes', 'DOCX', 1, 'Student Sun', 'Spring 2024', 'Prof. Liu', 892, 4.75, 67, 'approved', FALSE);
