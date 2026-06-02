import cv2
import numpy as np
import base64
from typing import Optional, List
from shared.config import config

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False

class FaceRecognitionService:
    def __init__(self):
        self.model_name = config.FACE_MODEL_NAME
        self.detector_backend = config.FACE_DETECTOR_BACKEND
        self.distance_threshold = config.FACE_DISTANCE_THRESHOLD

    def _base64_to_image(self, image_base64: str) -> Optional[np.ndarray]:
        try:
            image_data = base64.b64decode(image_base64)
            nparr = np.frombuffer(image_data, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"Error decodificando imagen: {e}")
            return None

    def extract_face_encoding(self, image_base64: str) -> Optional[List[float]]:
        if not DEEPFACE_AVAILABLE:
            raise Exception("DeepFace no está disponible")
        image = self._base64_to_image(image_base64)
        if image is None:
            return None
        try:
            embeddings = DeepFace.represent(
                img_path=image,
                model_name=self.model_name,
                detector_backend=self.detector_backend,
                enforce_detection=True,
                align=True
            )
            if embeddings and len(embeddings) > 0:
                return embeddings[0]["embedding"]
            return None
        except Exception as e:
            print(f"Error extrayendo encoding: {e}")
            return None

    def find_matching_user(self, query_encoding: List[float], stored_encodings: List[dict]) -> Optional[int]:
        query_array = np.array(query_encoding)
        query_norm = query_array / np.linalg.norm(query_array)
        best_match = None
        best_distance = float('inf')
        for item in stored_encodings:
            stored_array = np.array(item['face_encoding'])
            stored_norm = stored_array / np.linalg.norm(stored_array)
            similarity = np.dot(query_norm, stored_norm)
            distance = 1 - similarity
            if distance < self.distance_threshold and distance < best_distance:
                best_distance = distance
                best_match = item['user_id']
        return best_match