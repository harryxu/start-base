FROM harryxu/startbase:latest

ENV DEMO_MODE=true

COPY docker/demo-entrypoint.sh /demo-entrypoint.sh
RUN chmod +x /demo-entrypoint.sh

ENTRYPOINT ["/demo-entrypoint.sh"]
