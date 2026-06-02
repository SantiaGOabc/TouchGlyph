from shared.database import get_db_cursor, get_param_placeholder
from datetime import datetime, timezone
import uuid
from typing import Optional, List, Dict, Any

class TeacherRepository:

    @staticmethod
    def _format_ts(value):
        if value is None:
            return None
        if isinstance(value, (int, float)):
            s = str(int(value))
            if len(s) == 13:
                return datetime.fromtimestamp(int(value) / 1000, tz=timezone.utc).isoformat()
            if len(s) == 14:
                return f"{s[0:4]}-{s[4:6]}-{s[6:8]}T{s[8:10]}:{s[10:12]}:{s[12:14]}"
            return s
        try:
            return value.isoformat()
        except AttributeError:
            return str(value)

    # DASHBOARD
    @staticmethod
    def get_dashboard_stats(teacher_id):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                SELECT COUNT(DISTINCT cs.student_id) as total_students
                FROM class_students cs
                JOIN classes c ON cs.class_id = c.id
                WHERE c.teacher_id = {ph}
            """, (teacher_id,))
            total_students = cursor.fetchone()['total_students']
            
            cursor.execute("SELECT COUNT(*) as total_lessons FROM lessons WHERE active=1")
            total_lessons = cursor.fetchone()['total_lessons']
            
            return total_students, total_lessons
        
    @staticmethod
    def get_students_progress(teacher_id):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                SELECT u.id, u.full_name, u.username
                FROM users u
                JOIN class_students cs ON u.id = cs.student_id
                JOIN classes c ON cs.class_id = c.id
                WHERE u.role = 'student' AND c.teacher_id = {ph}
            """, (teacher_id,))
            students = cursor.fetchall()
            if not students:
                return students

            student_ids = [s['id'] for s in students]
            ph_list = ','.join([get_param_placeholder() for _ in student_ids])

            cursor.execute(f"""
                SELECT user_id, COUNT(*) as attempts, IFNULL(SUM(correct),0) as corrects, MAX(ts) as last_ts
                FROM attempts WHERE user_id IN ({ph_list})
                GROUP BY user_id
            """, (*student_ids,))
            attempts_data = {row['user_id']: row for row in cursor.fetchall()}

            cursor.execute(f"""
                SELECT user_id, COUNT(DISTINCT lesson_id) as completed
                FROM sessions WHERE user_id IN ({ph_list}) AND finished_at IS NOT NULL AND completed=1
                GROUP BY user_id
            """, (*student_ids,))
            completed_data = {row['user_id']: row['completed'] for row in cursor.fetchall()}

            for s in students:
                stats = attempts_data.get(s['id'], {})
                attempts = stats.get('attempts', 0) or 0
                corrects = stats.get('corrects', 0) or 0
                accuracy = round(corrects / attempts * 100, 2) if attempts > 0 else 0
                completed = completed_data.get(s['id'], 0) or 0
                last_activity = TeacherRepository._format_ts(stats.get('last_ts'))

                s['attempts'] = attempts
                s['corrects'] = corrects
                s['accuracy'] = accuracy
                s['completed'] = completed
                s['last_activity'] = last_activity
            return students

    # CLASES DEL PROFESOR
    @staticmethod
    def get_teacher_classes(teacher_id: int):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                SELECT c.id, c.name, c.description, c.teacher_id,
                       COUNT(DISTINCT cs.student_id) as student_count,
                       COUNT(DISTINCT cl.lesson_id) as lesson_count
                FROM classes c
                LEFT JOIN class_students cs ON c.id = cs.class_id
                LEFT JOIN class_lessons cl ON c.id = cl.class_id
                WHERE c.teacher_id = {ph}
                GROUP BY c.id
                ORDER BY c.name
            """, (teacher_id,))
            classes = cursor.fetchall()
            if not classes:
                return classes

            class_ids = [cls['id'] for cls in classes]
            ph_list = ','.join([get_param_placeholder() for _ in class_ids])
            cursor.execute(f"""
                SELECT cs.class_id, u.id, u.username, u.full_name,
                       COUNT(DISTINCT sp.lesson_id) as completed_lessons,
                       COALESCE(SUM(sp.score), 0) as total_score
                FROM class_students cs
                JOIN users u ON cs.student_id = u.id
                LEFT JOIN student_progress sp ON u.id = sp.student_id AND sp.completed = 1
                WHERE cs.class_id IN ({ph_list})
                GROUP BY cs.class_id, u.id, u.username, u.full_name
            """, (*class_ids,))
            students_by_class = {}
            for row in cursor.fetchall():
                cid = row['class_id']
                if cid not in students_by_class:
                    students_by_class[cid] = []
                students_by_class[cid].append(row)

            for cls in classes:
                cls['students'] = students_by_class.get(cls['id'], [])
            return classes

    # DETALLE DE ESTUDIANTE
    @staticmethod
    def get_student_detail(student_id: int):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"SELECT id, username, full_name, role, created_at FROM users WHERE id = {ph}", (student_id,))
            student = cursor.fetchone()
            if not student:
                return None
            # Aplicar _format_ts a created_at del estudiante si es necesario
            student['created_at'] = TeacherRepository._format_ts(student.get('created_at'))

            # Progreso por lección
            cursor.execute(f"""
                SELECT s.lesson_id, l.title, s.score, s.started_at, s.finished_at,
                       COUNT(a.id) as total_attempts,
                       IFNULL(SUM(a.correct),0) as correct_attempts
                FROM sessions s
                LEFT JOIN lessons l ON s.lesson_id = l.id
                LEFT JOIN attempts a ON s.id = a.session_id
                WHERE s.user_id = {ph}
                GROUP BY s.id
                ORDER BY s.started_at DESC
            """, (student_id,))
            progress = cursor.fetchall()
            for p in progress:
                p['started_at'] = TeacherRepository._format_ts(p.get('started_at'))
                p['finished_at'] = TeacherRepository._format_ts(p.get('finished_at'))

            # Estadísticas generales
            cursor.execute(f"""
                SELECT COUNT(DISTINCT s.lesson_id) as lessons_attempted,
                       COUNT(DISTINCT CASE WHEN s.finished_at IS NOT NULL THEN s.lesson_id END) as lessons_completed,
                       COUNT(a.id) as total_attempts,
                       IFNULL(SUM(a.correct),0) as correct_attempts,
                       ROUND(IFNULL(SUM(a.correct)*100.0/NULLIF(COUNT(a.id),0),0),2) as overall_accuracy
                FROM sessions s
                LEFT JOIN attempts a ON s.id = a.session_id
                WHERE s.user_id = {ph}
            """, (student_id,))
            overall = cursor.fetchone()
            return {"student": student, "progress": progress, "overall": overall}

    # LECCIONES (CRUD)
    # Devuelve las lecciones que YA están asignadas a alguna clase del profesor
    @staticmethod
    def get_my_class_lessons(teacher_id: int):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                SELECT DISTINCT l.*, COUNT(ls.id) as step_count
                FROM lessons l
                JOIN lesson_steps ls ON l.id = ls.lesson_id
                JOIN class_lessons cl ON l.id = cl.lesson_id
                JOIN classes c ON cl.class_id = c.id
                WHERE c.teacher_id = {ph} AND l.active = 1
                GROUP BY l.id
                ORDER BY l.created_at DESC
            """, (teacher_id,))
            return cursor.fetchall()

    # Devuelve lecciones globales activas que NO están asignadas a ninguna clase del profesor
    @staticmethod
    def get_available_lessons(teacher_id: int):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                SELECT DISTINCT l.*, COUNT(ls.id) as step_count
                FROM lessons l
                JOIN lesson_steps ls ON l.id = ls.lesson_id
                WHERE l.id NOT IN (
                    SELECT cl.lesson_id
                    FROM class_lessons cl
                    JOIN classes c ON cl.class_id = c.id
                    WHERE c.teacher_id = {ph}
                )
                GROUP BY l.id
                ORDER BY l.created_at DESC
            """, (teacher_id,))
            return cursor.fetchall()
        
    @staticmethod
    def unassign_lesson_from_all_classes(teacher_id: int, lesson_id: str):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                DELETE cl
                FROM class_lessons cl
                JOIN classes c ON cl.class_id = c.id
                WHERE cl.lesson_id = {ph} AND c.teacher_id = {ph}
            """, (lesson_id, teacher_id))
            return cursor.rowcount > 0

    @staticmethod
    def get_lesson(lesson_id: str):
        with get_db_cursor() as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"SELECT * FROM lessons WHERE id = {ph}", (lesson_id,))
            lesson = cursor.fetchone()
            if not lesson:
                return None
            lesson['created_at'] = TeacherRepository._format_ts(lesson.get('created_at'))
            cursor.execute(f"SELECT * FROM lesson_steps WHERE lesson_id = {ph} ORDER BY step_index", (lesson_id,))
            steps = cursor.fetchall()
            cursor.execute(f"""
                SELECT u.full_name, s.score, s.finished_at,
                       COUNT(a.id) as total_attempts,
                       IFNULL(SUM(a.correct),0) as correct_attempts
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                LEFT JOIN attempts a ON s.id = a.session_id
                WHERE s.lesson_id = {ph}
                GROUP BY s.user_id
            """, (lesson_id,))
            performance = cursor.fetchall()
            for perf in performance:
                perf['finished_at'] = TeacherRepository._format_ts(perf.get('finished_at'))
            return {"lesson": lesson, "steps": steps, "performance": performance}

    @staticmethod
    def create_lesson(title: str, description: str, difficulty: str, priority: int, steps: List[Dict]):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            lesson_id = str(uuid.uuid4()).replace('-', '')[:8]
            cursor.execute(f"""
                INSERT INTO lessons (id, title, description, difficulty, priority, active)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, 1)
            """, (lesson_id, title, description, difficulty, priority))
            for idx, step in enumerate(steps):
                cursor.execute(f"""
                    INSERT INTO lesson_steps
                    (lesson_id, step_index, type, target, prompt, hint, max_attempts)
                    VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})
                """, (lesson_id, idx, step.get('type','input'), step['target'],
                      step['prompt'], step.get('hint'), step.get('max_attempts', 3)))
            return lesson_id

    @staticmethod
    def update_lesson(lesson_id: str, data: Dict):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            if any(k in data for k in ['title','description','difficulty','priority','active']):
                fields = []
                values = []
                for k in ['title','description','difficulty','priority','active']:
                    if k in data and data[k] is not None:
                        fields.append(f"{k}={ph}")
                        values.append(data[k])
                if fields:
                    values.append(lesson_id)
                    query = "UPDATE lessons SET " + ", ".join(fields) + f" WHERE id={ph}"
                    cursor.execute(query, values)
            if 'steps' in data:
                cursor.execute(f"DELETE FROM lesson_steps WHERE lesson_id = {ph}", (lesson_id,))
                for idx, step in enumerate(data['steps']):
                    cursor.execute(f"""
                        INSERT INTO lesson_steps
                        (lesson_id, step_index, type, target, prompt, hint, max_attempts)
                        VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})
                    """, (lesson_id, idx, step.get('type','input'), step['target'],
                          step['prompt'], step.get('hint'), step.get('max_attempts', 3)))
            return True

    @staticmethod
    def delete_lesson(lesson_id: str):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"UPDATE lessons SET active=0 WHERE id = {ph}", (lesson_id,))
            return cursor.rowcount > 0

    # ASIGNACIÓN
    @staticmethod
    def assign_lesson_to_class(lesson_id: str, class_id: int, due_date: Optional[str] = None):
        with get_db_cursor(commit=True) as cursor:
            ph = get_param_placeholder()
            cursor.execute(f"""
                INSERT INTO class_lessons (class_id, lesson_id, due_date)
                VALUES ({ph}, {ph}, {ph})
                ON DUPLICATE KEY UPDATE active = 1
            """, (class_id, lesson_id, due_date))
            return True