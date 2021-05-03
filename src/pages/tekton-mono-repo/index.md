---
title: Mono-repo Pipelines with Tekton
date: "2021-05-08"
tags: ['tekton' 'devops', 'CD', 'kubernetes']
---

As a learning exercise, I wanted to see how I could put together a pipeline for a mono-repo with [Tekton](https://tekton.dev/). This post outlines a way of acheiving that, learning a little bit about Tekton interceptors along the way.

## Tekton

[Tekton](https://tekton.dev/)is a open-source framework for creating CI/CD systems. With Tekton, pipelines are defined as Kubernetes CRDs (Custom Resource Definitions) and orchestrates the tasks as Kubernetes pods. I've been particularly interested in Tekton recently...


## The problem

Most CI/CD tools have the following features in common:
* A single pipeline definition, usually in YAML (i.e `.gitlab-ci.yaml`, `.travis.yaml`, etc)
* A set of stages that form a DAG (Directed Asyclic Graph)
* Conditional logic to support optional build stages

I consider a mono-repository as any Git repository that has more than one artifact. Modelling mono-repositories with the above features usually results in a pipeline that doesn't provide particularly good visibility of any particularly sub-artifact. Additionally, the pipeline definition can become increasing complex with conditional statements.

To improve on this, I wanted to trigger individual pipelines depending on the sub-directories that were edited within the repository.


## The solution

[Triggers](https://github.com/tektoncd/triggers) is the sub-project of Tekton that is responsible for triggering pipelines in response to external events via webhooks. Tekton's own documentation gives good overview of the moving parts.

> EventListeners expose an addressable “Sink” to which incoming events are directed. Users can declare TriggerBindings to extract fields from events, and apply them to TriggerTemplates in order to create Tekton resources. In addition, EventListeners allow lightweight event processing using Event Interceptors.




![Component diagram](tekton-mono-components.svg)


## Alternatives

Parnet/child


## Downsides

* Different ingresses to support many mono-repos
