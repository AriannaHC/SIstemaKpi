from cachetools import TTLCache

cache_general = TTLCache(maxsize=200, ttl=60)


def get_cache(key: str):
    """Devuelve el valor cacheado si existe y sigue vigente, o None."""
    return cache_general.get(key)


def set_cache(key: str, value):
    cache_general[key] = value


def invalidate_cache(*keys: str):
    """Borra una o varias keys específicas del cache (usar tras un update)."""
    for k in keys:
        cache_general.pop(k, None)


def invalidate_cache_prefix(prefix: str):
    """Borra todas las keys que empiecen con cierto prefijo.
    Útil cuando el key incluye variables (ej. por año, por usuario)."""
    keys_a_borrar = [k for k in cache_general.keys() if k.startswith(prefix)]
    for k in keys_a_borrar:
        cache_general.pop(k, None)