# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Ensure logs and data directories are defined if used by app config
    LOG_DIR=/app/logs \
    DATA_DIR=/app/data

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# build-essential: for compiling python packages (bcrypt, etc.)
# curl: for healthcheck
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Create necessary directories for runtime artifacts
# (These might be mounted as volumes in production)
RUN mkdir -p logs data

# Expose port 8000
EXPOSE 8000

# Healthcheck to ensure the service is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run the application
# Note: Provide .env file at runtime or set environment variables
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
