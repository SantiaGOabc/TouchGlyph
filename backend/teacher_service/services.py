from .repositories import TeacherRepository
from shared.sanitize import sanitize_text
from typing import Optional, List, Dict

class TeacherService:
    def __init__(self):
        self.repo = TeacherRepository()

    #  Dashboard 
    def get_dashboard(self, teacher_id):
        total_students, total_lessons = self.repo.get_dashboard_stats(teacher_id)
        students = self.repo.get_students_progress(teacher_id)
        return {
            "total_students": total_students,
            "total_lessons": total_lessons,
            "active_sessions": len(students),
            "students": students
        }

    #  Clases 
    def get_my_class_lessons(self, teacher_id: int):
        return self.repo.get_my_class_lessons(teacher_id)

    def get_available_lessons(self, teacher_id: int):
        return self.repo.get_available_lessons(teacher_id)
    
    def unassign_lesson(self, teacher_id: int, lesson_id: str):
        return self.repo.unassign_lesson_from_all_classes(teacher_id, lesson_id)

    def get_teacher_classes(self, teacher_id: int):
        return self.repo.get_teacher_classes(teacher_id)

    #  Estudiante 
    def get_student_detail(self, student_id: int):
        return self.repo.get_student_detail(student_id)

    #  Lecciones 
    def list_lessons(self):
        return self.repo.get_all_lessons()

    def get_lesson(self, lesson_id: str):
        return self.repo.get_lesson(lesson_id)

    def create_lesson(self, data: Dict):
        # Validaciones
        if not data.get('title'):
            raise ValueError("El título es requerido")
        if not data.get('steps') or len(data['steps']) == 0:
            raise ValueError("Debe incluir al menos un paso")
        priority = data.get('priority', 1)
        if priority not in [0,1,2,3]:
            raise ValueError("La prioridad debe ser 0-3")
        sanitized_steps = [
            {
                "type": s.get("type", "input"),
                "target": sanitize_text(s.get("target", "")),
                "prompt": sanitize_text(s.get("prompt", "")),
                "hint": sanitize_text(s.get("hint", "")) if s.get("hint") else None,
                "max_attempts": s.get("max_attempts", 3),
            }
            for s in data['steps']
        ]
        return self.repo.create_lesson(
            title=sanitize_text(data['title']),
            description=sanitize_text(data.get('description', '')),
            difficulty=data.get('difficulty', 'beginner'),
            priority=priority,
            steps=sanitized_steps
        )

    def update_lesson(self, lesson_id: str, data: Dict):
        return self.repo.update_lesson(lesson_id, data)

    def delete_lesson(self, lesson_id: str):
        return self.repo.delete_lesson(lesson_id)

    #  Asignación 
    def assign_lesson_to_class(self, lesson_id: str, class_id: int, due_date: Optional[str] = None):
        return self.repo.assign_lesson_to_class(lesson_id, class_id, due_date)