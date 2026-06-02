# TouchGlyph — Plataforma de Aprendizaje Braille

Sistema de enseñanza de Braille con reconocimiento facial y display Braille ESP32.
Frontend React + TypeScript, backend Flask en microservicios.

## Arquitectura

```
integrador_IA/
├── frontend/          React 18 + Vite 7 + TypeScript
├── backend/           5 microservicios Flask + shared/
│   ├── user_service/      Puerto 8000  — Auth password y facial
│   ├── admin_service/     Puerto 5001  — CRUD usuarios, clases, dispositivos
│   ├── teacher_service/   Puerto 5002  — Lecciones, dashboard, progreso
│   ├── student_service/   Puerto 5003  — Sesiones de aprendizaje
│   ├── devices_service/   Puerto 5004  — Comunicación ESP32 Braille
│   └── shared/            Auth, DB, schemas, sanitize, utils
```

## Inicio rápido

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env         # o usar el .env existente
python init_db.py               # crear tablas
.\start_all.ps1                 # inicia los 5 servicios
```

### Frontend

```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

### Datos de prueba

```bash
cd backend
python seed.py                  # crea usuarios, clases y lecciones demo
```

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | 123456 | Administrador |
| teacher1 | 123456 | Profesor |
| student1 | 123456 | Estudiante |
| student2 | 123456 | Estudiante |

## Tests

```bash
cd backend
pytest tests/ -v                # 98 tests
pytest tests/ --cov=. --cov-report=html  # cobertura
```

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, TypeScript, Vite 7, react-router-dom 7, TanStack Query 5, axios, react-i18next |
| Backend | Flask, SQLite / MySQL, JWT + httpOnly cookies, DeepFace (Facenet512) |
| Display | ESP32, comunicación TCP |

Ver `backend/README.md` para documentación detallada del backend.
