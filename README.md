# SaolaJS

> Nodejs Microservice Framework

## Introduction

Saola.JS (formerly Devebot) is tiny microservice framework for Nodejs. It is designed under some important principles:

* High modularity
* Reusable
* Easy to integrate

![Architecture](https://raw.github.com/saolajs/saola-core/master/docs/modules/ROOT/assets/images/devebot-architecture.png)


Based on the Saola framework, the application is decomposed into `plugins`, each of which implements a particular feature. The framework provides `bridges` which wrap or connect to other services such as REST API or database servers.
