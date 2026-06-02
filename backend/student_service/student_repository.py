import uuid
from shared.database import get_db_cursor, get_param_placeholder
class StudentRepository:

    @staticmethod
    def get_lessons(student_id: int, show_completed: bool):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                SELECT DISTINCT
                    l.id, l.title, l.description, l.difficulty,
                    l.priority, l.created_at,
                    COUNT(ls.id) AS total_steps
                FROM lessons l
                LEFT JOIN lesson_steps ls ON l.id = ls.lesson_id
                LEFT JOIN class_lessons cl ON l.id = cl.lesson_id
                LEFT JOIN class_students cs ON cl.class_id = cs.class_id
                WHERE cs.student_id = {ph} AND l.active = 1
                GROUP BY l.id, l.title, l.description, l.difficulty, l.priority, l.created_at
                ORDER BY l.priority, l.created_at
            """, (student_id,))
            lessons = cursor.fetchall()

            if not lessons:
                return {"lessons": [], "stats": {"completed": 0, "total_score": 0, "total": 0}}

            lesson_ids = [l['id'] for l in lessons]
            ph_list = ','.join([get_param_placeholder() for _ in lesson_ids])
            cursor.execute(f"""
                SELECT lesson_id, completed, score
                FROM sessions
                WHERE user_id = {ph} AND lesson_id IN ({ph_list})
                  AND finished_at IS NOT NULL AND completed = 1
                ORDER BY finished_at DESC
            """, (student_id, *lesson_ids))
            completion_map = {}
            for row in cursor.fetchall():
                if row['lesson_id'] not in completion_map:
                    completion_map[row['lesson_id']] = row

            for lesson in lessons:
                comp = completion_map.get(lesson['id'])
                lesson['completed'] = 1 if comp else 0
                lesson['score'] = comp['score'] if comp else 0

            if show_completed:
                filtered_lessons = [l for l in lessons if l['completed'] == 1]
            else:
                filtered_lessons = [l for l in lessons if l['completed'] == 0]

            total_lessons = len(lessons)

            cursor.execute(f"""
                SELECT
                    COUNT(*) AS completed,
                    COALESCE(SUM(sp.score), 0) AS total_score
                FROM student_progress sp
                WHERE sp.student_id = {ph} AND sp.completed = 1
            """, (student_id,))
            stats = cursor.fetchone()

            return {
                "lessons": filtered_lessons,
                "stats": {
                    "completed": stats['completed'] or 0,
                    "total_score": stats['total_score'] or 0,
                    "total": total_lessons
                }
            }

    @staticmethod
    def start_session(student_id: int, lesson_id: str):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            session_id = str(uuid.uuid4()).replace('-', '')[:16]
            cursor.execute(f"""
                INSERT INTO sessions (id, lesson_id, user_id, started_at, score, completed)
                VALUES ({ph}, {ph}, {ph}, CURRENT_TIMESTAMP, 0, 0)
            """, (session_id, lesson_id, student_id))
            return session_id

    @staticmethod
    def get_session(session_id: str):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                SELECT s.*, l.title AS lesson_title
                FROM sessions s
                JOIN lessons l ON s.lesson_id = l.id
                WHERE s.id = {ph}
            """, (session_id,))
            return cursor.fetchone()

    @staticmethod
    def get_current_step_index(session_id: str):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                SELECT COUNT(DISTINCT step_index) AS step_index
                FROM attempts
                WHERE session_id = {ph}
            """, (session_id,))
            return cursor.fetchone()['step_index']

    @staticmethod
    def count_correct_attempts(session_id: str):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                SELECT COUNT(*) AS correct_count
                FROM attempts
                WHERE session_id = {ph} AND correct = 1
            """, (session_id,))
            return cursor.fetchone()['correct_count']

    @staticmethod
    def get_lesson_step(lesson_id: str, step_index: int):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                SELECT * FROM lesson_steps
                WHERE lesson_id = {ph} AND step_index = {ph}
            """, (lesson_id, step_index))
            return cursor.fetchone()

    @staticmethod
    def count_step_attempts(session_id: str, step_index: int):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                SELECT COUNT(*) AS attempt_count
                FROM attempts
                WHERE session_id = {ph} AND step_index = {ph}
            """, (session_id, step_index))
            return cursor.fetchone()['attempt_count']

    @staticmethod
    def get_total_steps(lesson_id: str):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                SELECT COUNT(*) AS total_steps
                FROM lesson_steps
                WHERE lesson_id = {ph}
            """, (lesson_id,))
            return cursor.fetchone()['total_steps']
    @staticmethod
    def has_completed_lesson(student_id: int, lesson_id: str) -> bool:
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                SELECT 1 FROM student_progress
                WHERE student_id = {ph} AND lesson_id = {ph} AND completed = 1
            """, (student_id, lesson_id))
            return cursor.fetchone() is not None

    @staticmethod
    def mark_session_finished(session_id: str):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                UPDATE sessions
                SET finished_at = CURRENT_TIMESTAMP, completed = 1
                WHERE id = {ph} AND finished_at IS NULL
            """, (session_id,))

    @staticmethod
    def update_student_progress(student_id: int, lesson_id: str, score: int, session_id: str):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            # Contar intentos de la sesión
            cursor.execute(f"SELECT COUNT(*) as cnt FROM attempts WHERE session_id = {ph}", (session_id,))
            attempts = cursor.fetchone()['cnt']

            from shared.database import get_upsert_query
            query = get_upsert_query(
                "student_progress",
                "student_id, lesson_id, completed, score, attempts, completed_at",
                f"{ph}, {ph}, 1, {ph}, {ph}, CURRENT_TIMESTAMP"
            )
            cursor.execute(query, (student_id, lesson_id, score, attempts))

    @staticmethod
    def insert_attempt(session_id: str, lesson_id: str, user_id: int, step_index: int,
                       answer: str, is_correct: bool, attempts: int):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                INSERT INTO attempts
                (session_id, lesson_id, user_id, step_index, answer, correct, attempts, ts)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, CURRENT_TIMESTAMP)
            """, (session_id, lesson_id, user_id, step_index, answer, 1 if is_correct else 0, attempts))

    @staticmethod
    def increment_session_score(session_id: str):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                UPDATE sessions
                SET score = score + 1
                WHERE id = {ph}
            """, (session_id,))

    @staticmethod
    def count_completed_steps(session_id: str):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                SELECT COUNT(DISTINCT step_index) AS completed_steps
                FROM attempts
                WHERE session_id = {ph} AND correct = 1
            """, (session_id,))
            return cursor.fetchone()['completed_steps']