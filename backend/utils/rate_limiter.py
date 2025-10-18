import threading
import time
from dataclasses import dataclass


@dataclass
class TokenBucket:
    capacity: int
    refill_rate: float
    tokens: float
    last_refill: float


class RateLimiter:
    def __init__(self, capacity: int, refill_interval: float = 60.0) -> None:
        self.capacity = capacity
        self.refill_rate = capacity / refill_interval
        self.buckets: dict[str, TokenBucket] = {}
        self.lock = threading.Lock()

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        with self.lock:
            bucket = self.buckets.get(key)
            if bucket is None:
                bucket = TokenBucket(self.capacity, self.refill_rate, self.capacity, now)
                self.buckets[key] = bucket

            elapsed = now - bucket.last_refill
            if elapsed > 0:
                bucket.tokens = min(self.capacity, bucket.tokens + elapsed * bucket.refill_rate)
                bucket.last_refill = now

            if bucket.tokens >= 1:
                bucket.tokens -= 1
                return True
            return False
