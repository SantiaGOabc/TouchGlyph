# Braille Learning Platform — Backend

Microservicios Flask para enseñanza de Braille con reconocimiento facial y display Braille ESP32.

## Arquitectura

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| `user_service` | 8000 | Autenticación (password + facial), registro de usuarios |
| `admin_service` | 5001 | CRUD de usuarios, clases, dispositivos |
| `teacher_service` | 5002 | Gestión de lecciones, dashboard, progreso |
| `student_service` | 5003 | Sesiones de aprendizaje, ejercicios |
| `devices_service` | 5004 | Comunicación con display Braille ESP32 |

Todos los servicios comparten módulos en `shared/` (auth, base de datos, config, schemas).

## Requisitos

- Python 3.11+
- pip

## Instalación

```bash
# Clonar el repo
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores correspondientes
```

## Variables de Entorno (`.env`)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Clave para firmar JWT (64 hex chars) | **requerido** |
| `DB_TYPE` | `sqlite` o `mysql` | `sqlite` |
| `CORS_ORIGINS` | Orígenes permitidos (coma separados) | `http://localhost:5173` |
| `FACE_MODEL_NAME` | Modelo DeepFace | `Facenet512` |
| `ESP32_IP` | IP del display Braille | `192.168.4.1` |
| `DEBUG` | Modo debug | `False` |
| `LOG_LEVEL` | Nivel de logging | `INFO` |
| `RATE_LIMIT_AUTH` | Límite de requests en auth endpoints | `10 per minute` |

Ver `.env.example` para la lista completa.

## Ejecución

```bash
# Iniciar todos los servicios (ventanas separadas)
python -m user_service.app
python -m admin_service.app
python -m teacher_service.app
python -m student_service.app
python -m devices_service.app

# O con script de PowerShell (Windows)
.\start_all.ps1
.\stop_all.ps1
```

## Tests

```bash
# Ejecutar todos los tests
pytest tests/ -v

# Con cobertura
pytest tests/ --cov=. --cov-report=html

# Tests específicos
pytest tests/unit/ -v
pytest tests/integration/ -v
```

## Documentación de la API (Swagger)

Cada servicio expone su documentación interactiva:

| Servicio | URL |
|----------|-----|
| User Service | `http://localhost:8000/apidocs/` |
| Admin Service | `http://localhost:5001/apidocs/` |
| Teacher Service | `http://localhost:5002/apidocs/` |
| Student Service | `http://localhost:5003/apidocs/` |
| Devices Service | `http://localhost:5004/apidocs/` |

## Health Checks

Cada servicio expone un endpoint `/api/health` que devuelve estado del servicio y conectividad con la base de datos.

## Rate Limiting

- Endpoints públicos (register, login, face login): **10 requests/minuto por IP**
- Default (endpoints autenticados): **60 requests/minuto por IP**
- Se maneja en memoria; no requiere Redis.

## Despliegue (Docker)

En el directorio `deploy/`:

```bash
docker-compose -f deploy/docker-compose.yml up --build
```

Esto levanta los 5 servicios + nginx como gateway en el puerto 80.
