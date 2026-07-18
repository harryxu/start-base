# Start Base — Backend Dev Instructions

FastAPI backend server for the Start Base homepage dashboard.

## Development

```bash
uv run uvicorn main:app --reload
```

## Running Tests

We use `pytest` to run our test suite. Tests are configured to automatically run against an in-memory SQLite database (`sqlite:///:memory:`) using dependency overrides to prevent any modifications to the development/production database.

To run the tests:

```bash
uv run pytest
```

For verbose output showing each individual test name:

```bash
uv run pytest -v
```
