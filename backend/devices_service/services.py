from .esp32_client import ESP32Client

class DevicesService:
    def __init__(self):
        self.client = ESP32Client()

    def toggle_point(self, punto: int):
        if punto < 0 or punto > 5:
            return {"error": "El punto debe estar entre 0 y 5"}
        return self.client.toggle_punto(punto)

    def send_letter(self, letra: str):
        return self.client.set_letra(letra)

    def clear_all(self):
        return self.client.clear_points()

    def get_status(self):
        return self.client.get_estado()

    def get_device_status(self):
        return self.client.check_connection()