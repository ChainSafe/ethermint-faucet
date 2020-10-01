# ethermint-faucet

Ethermint Faucet Monorepo

## Requirements

- Node > 12
- Yarn > 1

## Mono Repo Structure 🏗

The repository is broken up into 4 main packages, managed using yarn workspaces. You can find these in the `packages` directory. These packages are as follows:

#### 1\) **`packages/api`**

NodeJS Express Api that handles faucet requests from clients as well requesting faucet funds when its own funds are running low.

#### 2\) **`packages/ui`**

ReactJS + Typescript front end to make requests for funding from the API

## Running the API

- Run `yarn` at the root to install all project dependencies
- Use the `/packages/api/.env.example` as a template to generate an `.env` file with necessary info
- Run `yarn start:api` to start the API Server

## Building the UI

- Run `yarn` at the root to install dependencies
- Configure `/packages/ui/.env` as per the `.env.example`
- Run `yarn build:ui` to generate a production build
- Deploy `packages/ui/build` to your favorite static website host
