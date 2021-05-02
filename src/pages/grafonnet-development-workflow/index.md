---
title: Grafana Dashboard Workflow
date: "2021-05-02"
tags: ['Grafana', 'Jsonnet', 'devops', 'productivity']
---


As I'm currently working at a company that's undergoing massive growth, I've recently taken a particular interest in developer productivity and the concept of providing engineers with [golden paths](https://engineering.atspotify.com/2020/08/17/how-we-use-golden-paths-to-solve-fragmentation-in-our-software-ecosystem/) to success. Partly inspired by posts on  and partly by the suggestions of some of my colleagues, I've started looking into [Jsonnet](https://jsonnet.org/) + [Grafonnet](https://grafana.github.io/grafonnet-lib/) as a way of providing consistent and reusable dashboards.


An easy development workflow can be the difference between small issues being fixed on discovery and issues stacking up on a forever growing team backlog. Scripting Grafana dashboards is one of the signs of [dashboard maturity](https://grafana.com/docs/grafana/latest/best-practices/dashboard-management-maturity-levels/), but it comes at the cost of complexity and a clunkier workflow. Since a clunky development workflow can significantly impact on the quality of a project over time, I was keen to see what could be done to improve this.

I happened to come across [Grizzly](https://github.com/grafana/grizzly) - a tool that looks to solve some of the toil around managing Jsonnet dashboards. Below I describe a simple development workflow that uses Grizzly's `watch` command to automatically render and apply dashboards to a _local_ Grafana instance as they are edited. When happy, a Make target renders the final JSON dashboards.

This post assumes the following repository structure, separating the Jsonnet files from the rendered JSON.

```
dashboards/
    jsonnet/
        ...
        main.jsonnet
    json/
```


A Docker compose file sets up a local Grafana instance, running Grizzly to build and upload the rendered dashboards, then starting Grizzly to watch for file changes.

```yaml
version: "2"
services:
  grafana:
    image: grafana/grafana:7.5.5
    ports:
    - 3000:3000
    user: "104"
    environment:
      - GF_AUTH_DISABLE_LOGIN_FORM=true
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_NAME=Org.
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
      - GF_USERS_ALLOW_SIGN_UP=false
  grizzly:
    image: grafana/grizzly:0.1.0
    volumes:
    - ".:/src/"
    depends_on:
      - grafana
    environment:
      - GRAFANA_URL=http://grafana:3000
    working_dir: /src/dashboards/
    entrypoint: >
      ash -c "grr apply jsonnet/main.jsonnet &&
        grr watch jsonnet/ jsonnet/main.jsonnet"
```


Any edits to the Jsonnet files under `dashboards/jsonnet/` will be visible after refreshing Grafana. When you're happy, all you need to do is render and commit the JSON files Wrapping this up in a Makefile keeps the workflow memorable and self-documenting.

```Make

watch:
	@docker compose up

render:
	@docker run -v "$(shell pwd):/src/" grafana/grizzly:0.1.0 export dashboards/jsonnet/main.jsonnet dashboards/json/
	@ cp dashboards/json/Dashboard/* dashboards/json
	@rm -rf dashboards/json/Dashboard
```


The `render` target is using Grizzly to render the JSON and copy them into `dashboards/json`, cleaning up the intermediary files. The workflow now (1) `make watch` (2) edit Jsonnet files (3) `make render`. A pre-commit hook that runs `make render` simplifies this workflow even further.


Ideally, you'd be applying these rendered dashboard JSON files as part of your CI/CD automation. I'd recommend Terraform (check out the [Grafana provider](https://registry.terraform.io/providers/grafana/grafana/latest/docs), but you could just use Grizzly (`grr apply`).

## A local instance

Whilst I'd strongly recommend not using this workflow with your production Grafana instance, it's not necessary to use a local Grafana instance either. It really on how many engineers might be making changes concurrently. The downside of using a local Grafana instance is that you don't have real data when viewing your changes. Hopefully, you're using an IaC tool to configure your Grafana instances data sources, so you could simply point it at your local instance.


If your set up is relatively simple, a bash script is probably good enough and doesn't add too much complexity. The script below adds a Prometheus data source - hopefully, it provides some inspiration.

```sh
#!/bin/bash

GRAFANA_URL="http://localhost:3000"

if [ -z "$PROM_URL" ]; then echo '$PROM_URL not set' && exit 1; fi
if [ -z "$PROM_USER" ]; then echo '$PROM_USER not set' && exit 1; fi
if [ -z "$PROM_API_KEY" ]; then echo '$PROM_API_KEY not set' && exit 1; fi

curl -X POST $GRAFANA_URL/api/datasources -H 'Content-Type: application/json' --data "{
  \"name\":\"prometheus\",
  \"type\":\"prometheus\",
  \"access\":\"direct\",
  \"url\":\"$PROM_URL\",
  \"basicAuthUser\":\"$PROM_URL\",
  \"basicAuth\":\"true\",
  \"secureJsonData\":{
	  \"basicAuthPassword\":\"$PROM_API_KEY\",
  }
}"
```


## Gotchas

Since Grizzly [_currently_](https://github.com/grafana/grizzly/issues/64) only accepts a single Jsonnet file as input, it's best to define _all_ of dashboards in a single Jsonnet file. Multiple JSON files can be rendered by nesting the dashboards within a JSON object as below.

```
local grafana = import 'vendor/grafonnet/grafana.libsonnet'

{
	grafanaDashboards+:: {
		'my-service-dashboard.json': {
			uuid: 'service-dashboard',
			title: 'service',
			timezone: 'browser',
			schemaVersion: 16,
		},
		'my-database-dashboard.json': {
			uuid: 'database-dashboard',
			title: 'Database',
			timezone: 'browser',
			schemaVersion: 16,
		},
	},
}
```


Note that not only is the `uuid` field important for Grizzly to work correctly, it's also used as the name for your rendered JSON file.

## Taking it further

Since Grizzly also seems to provide a handy command to generate Grafana snapshots, I think a nice improvement would be generate snapshots of the modified dashboards & automatically add them to a PR, but that might be going overboard. 


Now I've got a smooth workflow set up, my next task is to actually learn Jsonnet, instead of copy + pasting examples!