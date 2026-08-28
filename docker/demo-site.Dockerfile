FROM harryxu/startbase:latest

ENV DEMO_MODE=true

# Download and extract demo data into /app/data
ADD https://github.com/harryxu/start-base-demo/releases/download/v0.1/st-demo-data.zip /tmp/st-demo-data.zip
RUN python3 -c "import zipfile, os; z = zipfile.ZipFile('/tmp/st-demo-data.zip'); [z.extract(f, '/app') for f in z.namelist() if not f.startswith('__MACOSX') and not os.path.basename(f).startswith('._') and not f.endswith('.DS_Store')]; os.remove('/tmp/st-demo-data.zip')"

COPY docker/demo-entrypoint.sh /demo-entrypoint.sh
RUN chmod +x /demo-entrypoint.sh

ENTRYPOINT ["/demo-entrypoint.sh"]
