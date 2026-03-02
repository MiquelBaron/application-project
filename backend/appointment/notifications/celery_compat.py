"""Compatibility helpers to allow running without Celery installed in local/test envs."""

try:
    from celery import shared_task  # type: ignore
except ModuleNotFoundError:
    class _FallbackTask:
        def __init__(self, fn):
            self._fn = fn

        def __call__(self, *args, **kwargs):
            return self._fn(*args, **kwargs)

        def delay(self, *args, **kwargs):
            return self._fn(*args, **kwargs)

        def run(self, *args, **kwargs):
            return self._fn(*args, **kwargs)

    def shared_task(*decorator_args, **decorator_kwargs):
        def decorator(fn):
            return _FallbackTask(fn)

        if decorator_args and callable(decorator_args[0]) and len(decorator_args) == 1 and not decorator_kwargs:
            return decorator(decorator_args[0])

        return decorator
