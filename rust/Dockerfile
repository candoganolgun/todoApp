# Build stage
FROM rust:latest as builder

WORKDIR /usr/src/app
COPY . .

# Clean any existing build artifacts and rebuild
RUN cargo clean && cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install necessary runtime libraries
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /usr/src/app/target/release/todo /app/todo

# Create data directory
RUN mkdir -p /app/data && \
    chmod 777 /app/data

EXPOSE 8080

CMD ["./todo"]