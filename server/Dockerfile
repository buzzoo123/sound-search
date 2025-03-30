FROM python:3.9-slim

# Set environment variable for Poetry version
ENV NIXPACKS_POETRY_VERSION=1.3.1

# Install necessary dependencies
RUN apt-get update && apt-get install -y build-essential

# Create virtual environment, install poetry and project dependencies
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install poetry==$NIXPACKS_POETRY_VERSION && \
    /opt/venv/bin/poetry install --no-dev --no-interaction --no-ansi

# Copy project files into the container
COPY . /app/
WORKDIR /app
