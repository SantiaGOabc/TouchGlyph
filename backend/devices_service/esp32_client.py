import requests
import time
from typing import Optional, Dict, Any
from shared.config import config

class ESP32Client:
    def __init__(self):
        self.base_url = config.ESP32_BASE_URL
        self.timeout = config.ESP32_TIMEOUT

    def _call(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Realiza una petición GET al ESP32 y retorna la respuesta JSON."""
        try:
            url = f"{self.base_url}/{endpoint}"
            response = requests.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": f"No se pudo conectar con el dispositivo: {str(e)}"}

    def toggle_punto(self, punto: int) -> Dict:
        """Activa/desactiva un punto Braille (1-6)."""
        return self._call("toggle", {"punto": punto})

    def set_letra(self, letra: str) -> Dict:
        """Envía una letra para mostrar en el dispositivo."""
        letra = letra.upper()
        if not letra.isalpha() or len(letra) != 1:
            return {"error": "Letra inválida, debe ser una sola letra A-Z"}
        return self._call("letra", {"char": letra})

    def clear_points(self) -> Dict:
        """Limpia todos los puntos activos."""
        return self._call("clear")

    def get_estado(self) -> Dict:
        """Obtiene el estado actual del dispositivo."""
        return self._call("estado")

    def check_connection(self) -> Dict:
        """Verifica la conexión con el ESP32 y retorna información de estado."""
        start = time.time()
        estado = self.get_estado()
        response_time = round((time.time() - start) * 1000, 2)
        if "error" in estado:
            return {
                "conectado": False,
                "error": estado["error"],
                "dispositivo": "ESP32 Braille",
                "ip": config.ESP32_IP
            }
        return {
            "conectado": True,
            "dispositivo": "ESP32 Braille",
            "ip": config.ESP32_IP,
            "tiempo_respuesta_ms": response_time,
            "estado_actual": estado
        }