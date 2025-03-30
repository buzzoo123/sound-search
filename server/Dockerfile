FROM python:3.9-slim

# Set environment variable
ENV NIXPACKS_POETRY_VERSION=1.3.1

# Install necessary dependencies
RUN apt-get update && apt-get install -y build-essential

# Create virtual environment and install poetry
RUN python -m venv --copies /opt/venv && . /opt/venv/bin/activate && pip install poetry==$NIXPACKS_POETRY_VERSION && poetry install --no-dev --no-interaction --no-ansi

COPY . /app/
WORKDIR /app
