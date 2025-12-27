# Logs Directory

This directory contains application log files for the Zygotrix Backend.

## Log Files

### `error.log`
- **Level**: ERROR and above (ERROR, CRITICAL)
- **Content**: All error logs from the application
- **Rotation**: Automatically rotates when file reaches 10 MB
- **Retention**: Keeps 5 backup files (error.log.1, error.log.2, etc.)
- **Format**: `YYYY-MM-DD HH:MM:SS - module - LEVEL - file:line - message`

## Log Rotation

The error log uses Python's `RotatingFileHandler` with the following settings:
- **Max file size**: 10 MB
- **Backup count**: 5 files
- **Total storage**: ~50 MB maximum

When `error.log` reaches 10 MB:
1. `error.log` → `error.log.1`
2. `error.log.1` → `error.log.2`
3. ... and so on
4. `error.log.5` is deleted
5. New `error.log` is created

## Configuration

Logging is configured in `app/core/logging_config.py`

To modify logging behavior, edit the `setup_logging()` function.

## Example Error Log Entry

```
2025-01-15 14:23:45 - app.routes.chatbot - ERROR - chatbot.py:225 - Chatbot error: 'ChatResponse' object has no attribute 'response'
```

## Note

Log files (*.log, *.log.*) are excluded from version control via `.gitignore`.
