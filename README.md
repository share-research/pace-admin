# pace-admin
Publication Activity Collection Environment (PACE) Admin Tools and DB

A pilot project under development to investigate ways to streamline and improve the collection, reporting, and analysis of related publication information for the subsequent annual reporting process for campus centers and institutes. It is a time consuming process for each center/institute to determine scholarly productivity by polling faculty, reviewing their CVs, etc., where confidence in the data collected is crucial to ensure good investment decisions of University resources.

This pilot project will prototype a new process that automates data collection from internal and external sources and reporting, as well as integrate validation steps to increase confidence in data considered.

## Starting from scratch

1. Make sure you have [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/).
1. Also install the [Hasura CLI](https://github.com/hasura/graphql-engine/tree/master/cli).
1. You may already have Node on your system but installing the recommended version via [NVM](https://github.com/nvm-sh/nvm) or [NVM Windows](https://github.com/coreybutler/nvm-windows) is preferred. Please install NVM.
1. Clone the repository from [Github](https://github.com/share-research/pace-admin)
1. Run the following to enter the pace-admin directory and initiate a new environment variable file by copying environment template:
    ```    
    cd pace-admin
    cp .env.example .env
    ```
1. Now would be the appropriate time to make changes to your `.env` file; we will provide documentation for the options in the near future.
1. Now install and use the version of node as specified in `./.nvmrc` by running the following from the above pace-admin directory:
    ``` 
    nvm install
    nvm use
    ```
1. Install Yarn, Quasar CLI, and each applications node modules by running:
    ```
    make install
    ```
1. Run:
    ```
    make setup
    make newdb
    ```
1. Open several termanals and run the following commands:
    ```
    make docker && make logs
    make client
    make server
    make migration-console
    ```
1. Now open http://localhost:8000 (or whatever port you chose in your `.env` file) and login using the credentials in the following variables of the .env file:
    ```
    DEV_USER_EMAIL=test@test.com
    DEV_USER_FIRST_NAME=Test
    DEV_USER_LAST_NAME=Testersen
    DEV_USER_PASSWORD=password
    ```

## Production

1. First, make sure `./.env` includes ENV=prod. This not only configures your
environment properly but adds several protections to commands invoked via
`make`.
1. Next, check the rest of the environment varialbes in `./.env`. You'll
certainly need to customize these settings.
## Production - Harvest Data from Scopus

## Production - Generate Thumbnails and harvest PDFs for publications

## Production - Dashboard Data
When you get to a point where publications have been reviewed and approved for a center/institute you can load data into the dashboard by running

    make dashboard-ingest

## Table of Contents (TODO)

* [client](./client/README.md) - the UI tool for administering PACE Administration data.
* [ingest](./ingest/README.md) - responsible for loading data into the adminsitration system.
* [dashboard-search]() - 
* [node-admin-client]() -
* [server]() -
* [build]() - A temporary folder created by running the `templates` folder through the gomplate templating engine.
* [config]() -
* [data]() -
* [gql]() -
* [hasura]() -
* [templates]() - 
* .env.example
* .nvmrc
* docker-compose.*yml
* Makefile
## FAQ (TODO)
### What do I do about the following warning from redis? WARNING overcommit_memory is set to 0! Background save may fail under low memory condition. To fix this issue add 'vm.overcommit_memory = 1' to /etc/sysctl.conf and then reboot or run the command 'sysctl vm.overcommit_memory=1' for this to take effect.

