CREATE DATABASE {{ .Env.KEYCLOAK_DATABASE }};
GRANT ALL PRIVILEGES ON DATABASE {{ .Env.KEYCLOAK_DATABASE }} TO {{ .Env.POSTGRES_USER }};