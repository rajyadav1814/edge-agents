FROM supabase/postgres:15.1.0.73

# Note: Environment variables for PostgreSQL credentials should be passed at runtime
# rather than hardcoded in the Dockerfile for security reasons

# Create directories
RUN mkdir -p /docker-entrypoint-initdb.d
RUN mkdir -p /var/lib/postgresql/data

# Copy SQL files for initialization
COPY ./sql/*.sql /docker-entrypoint-initdb.d/

# Set up volume for persistent data
VOLUME ["/var/lib/postgresql/data"]

# Expose PostgreSQL port
EXPOSE 5432

# Set up healthcheck
HEALTHCHECK --interval=5s --timeout=5s --retries=5 \
  CMD pg_isready -U postgres -h localhost || exit 1

# Add a script to import SQL files
COPY ./import-sql.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/import-sql.sh

# Set the entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["postgres"]
