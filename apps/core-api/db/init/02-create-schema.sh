#!/usr/bin/env bash
set -euo pipefail

create_schema() {
  local database="$1"

  echo "Creating schema in database: $database"

  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$database" <<'EOSQL'
CREATE TYPE pago_status AS ENUM (
  'PENDIENTE',
  'EN_PROCESO_PAGO',
  'PAGADO',
  'FACTURADO',
  'FINALIZADO',
  'FALLIDO'
);

CREATE TABLE pagos (
  id         uuid           PRIMARY KEY,
  detail     varchar        NOT NULL,
  amount     numeric(19, 4) NOT NULL,
  status     pago_status    NOT NULL,
  created_at timestamptz    NOT NULL DEFAULT now(),
  updated_at timestamptz    NOT NULL DEFAULT now()
);

CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pagos_set_updated_at
  BEFORE UPDATE ON pagos
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE outbox (
  id           uuid        PRIMARY KEY,
  aggregate_id uuid        NOT NULL,
  event_type   varchar     NOT NULL,
  payload      jsonb       NOT NULL,
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz NULL
);

CREATE INDEX outbox_pending_idx
  ON outbox (occurred_at)
  WHERE published_at IS NULL;
EOSQL
}

create_schema "$POSTGRES_DB"
create_schema "$POSTGRES_DB_TEST"
