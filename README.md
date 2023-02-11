# @saola/core

> Saola Microservice Framework

## Introduction

Saola (formerly Devebot) is tiny microservice framework for the Node.JS. It is designed under some important principles:

* High modularity
* Easy to integrate
* Reusable

![Architecture](https://raw.github.com/saola-tools/saola-core/master/docs/modules/ROOT/assets/images/devebot-architecture.png)


Based on the Saola framework, the application is decomposed into `plugins`, each of which implements a particular feature. The framework provides `linkers` which wrap or connect to other services such as the REST API services or the database servers.
