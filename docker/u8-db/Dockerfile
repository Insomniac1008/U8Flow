FROM python:3.12-alpine

WORKDIR /app

RUN pip install --no-cache-dir python-tds==1.16.1

COPY sql_guard.py u8_presets.py storage.py mssql_driver.py mcp_handler.py server.py /app/

EXPOSE 9395

CMD ["python3", "/app/server.py"]
