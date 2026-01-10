use std::time::{Duration, Instant};

pub struct SpeedLimiter {
    bytes_per_second: u64,
    last_time: Instant,
    remaining_bytes: u64,
    max_buffer: u64,
}

impl SpeedLimiter {
    pub fn new(mbps: f64) -> Self {
        Self {
            bytes_per_second: (mbps * 1024.0 * 1024.0) as u64,
            last_time: Instant::now(),
            remaining_bytes: 0,
            max_buffer: (mbps * 1024.0 * 1024.0 * 2.0) as u64,
        }
    }

    pub async fn wait(&mut self, bytes: u64) {
        let now = Instant::now();
        let elapsed = now.duration_since(self.last_time).as_secs_f64();
        
        self.remaining_bytes = self.remaining_bytes.saturating_sub((elapsed * self.bytes_per_second as f64) as u64);
        self.last_time = now;
        
        if self.remaining_bytes + bytes > self.max_buffer {
            let needed = (self.remaining_bytes + bytes - self.max_buffer) as f64;
            let sleep_time = needed / self.bytes_per_second as f64;
            tokio::time::sleep(Duration::from_secs_f64(sleep_time)).await;
        }
        
        self.remaining_bytes += bytes;
    }
}
