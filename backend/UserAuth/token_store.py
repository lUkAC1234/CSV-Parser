import uuid
import threading
from typing import Optional

_LOCK = threading.Lock()
_TOKEN_MAP: dict[str, str] = {} 

def create_token_for(username: str) -> str:
    with _LOCK:
        token = uuid.uuid4().hex
        _TOKEN_MAP[token] = username
        return token

def get_username_by_token(token: str) -> Optional[str]:
    if not token:
        return None
    with _LOCK:
        return _TOKEN_MAP.get(token)

def delete_token(token: str) -> None:
    with _LOCK:
        if token in _TOKEN_MAP:
            del _TOKEN_MAP[token]

def clear_tokens_for_user(username: str) -> None:
    with _LOCK:
        to_delete = [t for t, u in _TOKEN_MAP.items() if u == username]
        for t in to_delete:
            del _TOKEN_MAP[t]
