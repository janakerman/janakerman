---
title: Mono-repo Pipelines with Tekton
date: "2021-05-03"
tags: ['tekton', 'devops', 'CD', 'kubernetes']
---

As a learning exercise, I wanted to see how I could put together a pipeline for a mono-repo with [Tekton](https://tekton.dev/). This post outlines a setup that supports the execution of _multiple_ pipelines from a single Github push event, learning a little bit about Tekton interceptors along the way.

## Tekton

[Tekton](https://tekton.dev/)is a open-source framework for creating CI/CD systems. With Tekton, pipelines are defined as Kubernetes CRDs (Custom Resource Definitions) and tasks are orchestrated as Kubernetes pods. I've been particularly interested in CD automation recently, and Tekton has captured my interest. The usage of CRDs to define a pipeline opens up a lot of possibilities that I hope to explore in future posts.


## The problem

Typically, a CD pipeline would be initiated by a webhook, such as Github's [PushEvent](https://docs.github.com/en/developers/webhooks-and-events/github-event-types#pushevent). This webhook would trigger the repositories pipeline to execute.

Most CI/CD tools have the following features in common:
* A single pipeline definition, usually in YAML (i.e `.gitlab-ci.yaml`, `.travis.yaml`, etc)
* A set of stages that form a DAG (Directed Asyclic Graph)
* Conditional logic to support optional build stages

Modelling mono-repositories with the above features usually results in a pipeline that doesn't provide particularly good visibility of any particularly sub-artifact. Additionally, the pipeline definition can become increasing complex with conditional statements.

To improve on this, I wanted to trigger individual pipelines depending on the sub-directories that were edited within the repository.


## The solution

[Triggers](https://github.com/tektoncd/triggers) is the sub-project of Tekton that is responsible for triggering pipelines in response to external events via webhooks, such as  used in this post. Tekton's own documentation gives good overview of the moving parts.

> EventListeners expose an addressable “Sink” to which incoming events are directed. Users can declare TriggerBindings to extract fields from events, and apply them to TriggerTemplates in order to create Tekton resources. In addition, EventListeners allow lightweight event processing using Event Interceptors.


In the pipeline setup described by this post, there's a single `EventTrigger` that references a unique `Trigger` for each project within the repo. Each `Trigger` references a `TriggerTemplate` configured to create `PipelineRun` for each sub-project's unique `Pipeline`.


![Component diagram](tekton-mono-components.svg)


The interesting part of this post is the `Trigger` configuration. It chains two [interceptors](https://tekton.dev/docs/triggers/eventlisteners/#interceptors); a [webhook interceptor](https://github.com/janakerman/tekton-github-fileschanged-interceptor) that decorates the webhook with the files modified, and a [CEL interceptor](https://tekton.dev/docs/triggers/eventlisteners/#cel-interceptors) that ensures only the `Trigger` for the corresponding sub-project creates a `PipelineRun`.

Below is the `Trigger` for 'project A'.

```
```

Tekton's _webhook interceptor_ allows you to implement a custom as a K8s services. The [webhook interceptor](https://github.com/janakerman/tekton-github-fileschanged-interceptor) written for this post uses Github's [Compare API](https://docs.github.com/en/github/committing-changes-to-your-project/comparing-commits#comparing-commits) to fetch a list of files changed by the push event. It then decorates the request's body with an additional field, `extensions.filesChanged`.

The [CEL interceptor](https://tekton.dev/docs/triggers/eventlisteners/#cel-interceptors) provides a `filter` expression acting as a predicate terminating the `Trigger`'s execution if it fails. Each trigger's CEL interceptor inspects the list of modified files, matching paths beginning with a specific sub-directory. If a push event modified files in both sub-projects, then both pipeliens would execute.


## Evaluation

One of the main benefits of this approach is that a single push event can trigger multiple different pipelines, supporting unique workflows for each sub-project witin the mono-repository. It's easy to find the pipeline execution for a given sub-project using either the Tekton Dashboard or `kubectl`.

TODO: Snapshot of dashboard

Whilst I wouldn't say the setup is very complex, without some familiarity of Tekton the process of adding a new sub-project isn't _super_ simple. I'm not that familiar with Helm, but I _think_ this could made easier if the resources were defined as a Helm Chart taking a mapping of sub-project to pipelines names.

The nice thing about tools like TravisCI / GitlabCI is that the pipeline definitions are easy to discover, defined by convention at the root of a project. This isn't something you get out of the box with Tekton. I feel like there's a gap here for a set of out-of-the-box Tekton trigger set-ups for different repository styles. I don't really have a clear idea here, but some way of defining repositories as CRDs sounds interesting.
