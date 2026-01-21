# Grafana Dashboard for Navigator Metrics

This directory contains configuration for visualizing Navigator session metrics.

## Quick Start

```bash
cd .agent/grafana
docker compose up -d
```

Then open http://localhost:3000 (admin/admin)

## Files

- `docker-compose.yml` - Grafana + Prometheus stack
- `prometheus.yml` - Scrape configuration
- `grafana-datasource.yml` - Prometheus datasource config
- `grafana-dashboards.yml` - Dashboard provider config
- `navigator-dashboard.json` - Navigator metrics dashboard

## Prerequisites

- Docker and Docker Compose installed
- Claude Code with OpenTelemetry export enabled (see `.agent/sops/integrations/opentelemetry-setup.md`)

## Metrics Tracked

- Token usage per session
- Tool call frequency
- Context compaction events
- Session duration
- Error rates
