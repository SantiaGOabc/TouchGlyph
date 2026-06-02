import unicodedata
from .student_repository import StudentRepository

class StudentService:
    def __init__(self):
        self.repo = StudentRepository()

    def get_student_lessons(self, student_id: int, show_completed: bool):
        return self.repo.get_lessons(student_id, show_completed)

    def begin_session(self, student_id: int, lesson_id: str):
        return self.repo.start_session(student_id, lesson_id)

    def get_next_prompt(self, session_id: str):
        session = self.repo.get_session(session_id)
        if not session:
            return None, "Session not found"

        lesson_id = session['lesson_id']
        user_id = session['user_id']
        current_step = self.repo.get_current_step_index(session_id)
        total_steps = self.repo.get_total_steps(lesson_id)

        step = self.repo.get_lesson_step(lesson_id, current_step)
        if not step:
            self.repo.mark_session_finished(session_id)
            completed_steps = self.repo.count_completed_steps(session_id)
            if completed_steps >= total_steps:
                already_completed = self.repo.has_completed_lesson(user_id, lesson_id)
                if not already_completed:
                    self.repo.update_student_progress(user_id, lesson_id, session['score'], session_id)
            return {"finished": True, "score": session.get('score', 0), "user_id": user_id}, None

        attempts = self.repo.count_step_attempts(session_id, current_step)

        return {
            "finished": False,
            "prompt": step['prompt'],
            "target": step['target'],
            "hint": step.get('hint'),
            "type": step.get('type', 'input'),
            "step_type": step.get('type', 'input'),
            "step_index": step['step_index'],
            "max_attempts": step.get('max_attempts', 3),
            "attempts": attempts,
            "score": session.get('score', 0),
            "user_id": user_id,
            "total_steps": total_steps
        }, None

    def submit_answer(self, session_id: str, answer: str):
        session = self.repo.get_session(session_id)
        if not session:
            return {"error": "Session not found"}, 404

        lesson_id = session['lesson_id']
        user_id = session['user_id']
        current_step = self.repo.get_current_step_index(session_id)

        step = self.repo.get_lesson_step(lesson_id, current_step)
        if not step:
            return {"finished": True}, 200

        target = unicodedata.normalize('NFKC', (step['target'] or "").upper())
        answer_norm = unicodedata.normalize('NFKC', answer.strip().upper())

        prev_attempts = self.repo.count_step_attempts(session_id, current_step)
        attempts_now = prev_attempts + 1
        is_correct = True if step.get('type') == 'read' else (answer_norm == target)

        self.repo.insert_attempt(session_id, lesson_id, user_id, current_step,
                                answer_norm, is_correct, attempts_now)

        result = {
            "correct": is_correct,
            "attempts": attempts_now,
            "max_attempts": step.get('max_attempts', 3)
        }

        if is_correct:
            self.repo.increment_session_score(session_id)
            next_step = self.repo.get_lesson_step(lesson_id, current_step + 1)
            if not next_step:
                self.repo.mark_session_finished(session_id)
                already_completed = self.repo.has_completed_lesson(user_id, lesson_id)
                if not already_completed:
                    self.repo.update_student_progress(
                        user_id, 
                        lesson_id, 
                        session['score'] + 1, 
                        session_id
                    )
                result['finished'] = True
        else:
            if attempts_now >= step.get('max_attempts', 3):
                result['hint'] = step.get('hint') or f"La respuesta correcta es: {target}"

        return result, 200

    def skip_step(self, session_id: str):
        session = self.repo.get_session(session_id)
        if not session:
            return {"error": "Session not found"}, 404

        lesson_id = session['lesson_id']
        user_id = session['user_id']
        current_step = self.repo.get_current_step_index(session_id)

        self.repo.insert_attempt(session_id, lesson_id, user_id, current_step,
                                 '__SKIP__', False, 1)
        return {"ok": True}, 200