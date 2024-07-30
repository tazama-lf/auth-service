<!-- SPDX-License-Identifier: Apache-2.0 -->

# Auth-Service

<div align="center">
<img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/frmscoe/auth-service/node.js.yml">
</div>

## Overview
Handles credential exchange for a token in Tazama.

#### Setting Up

```sh
git clone https://github.com/frmscoe/auth-service
cd auth-service
```
You then need to configure your environment: a [sample](.env.template) configuration file has been provided and you may adapt that to your environment. Copy it to `.env` and modify as needed:

```sh
cp .env.template .env
```
A [registry](https://github.com/frmscoe/docs) of environment variables is provided to provide more context for what each variable is used for.

##### Additional Variables

| Variable | Purpose | Example
| ------ | ------ | ------ |
| `AUTH_URL` | Base URL where KeyCloak is hosted | `https://keycloak.example.com:8080`
| `KEYCLOAK_REALM` | KeyCloak Realm for Tazama | `tazama`
| `CLIENT_ID` | KeyCloak defined client for auth-lib | `auth-lib-client`
| `CLIENT_SECRET` | The secret of the KeyCloak client | `someClientGeneratedSecret123`
| `CERT_PATH_PRIVATE` | The pem file path for signing Tazama tokens | `/path/to/private-key.pem`

#### Build and Start

```sh
npm i
npm run build
npm run start
```

## API

### 1. Auth Login

#### Description

Login using Username and Password to receive a Tazama token.

#### Request

- **Method:** POST
- **URL:** `/v1/auth/login`
- **Headers:** 
  - `Content-Type: application/json`
- **Body:**
``` JSON
{
    "username": "testUser",
    "password": "testUserPassword"
}
```

#### Response

- **Status Code:** 200 OK
- **Content-Type:** application/json
- **Body:**
```
eyJhbGciOiJSUz...ukUfoow
```

## Internal Process Flow

### Sequence Diagram

```mermaid
sequenceDiagram

    actor Person_OR_Service_APP as Person/Service
    actor Operator as Operator
    participant Auth_Service as Auth-Service
    participant Auth_Provider as KeyCloak

    Person_OR_Service_APP ->> Auth_Service: 1. Login request with credentials
    Auth_Service ->> Auth_Provider: Exchange credentials by token
    alt Invalid Credentials
        Auth_Provider ->> Auth_Service: ERR: Invalid Credentials
        Auth_Service ->> Person_OR_Service_APP: ERR: 401 Not Authorized    
    end
    Auth_Provider ->> Auth_Service: Receive token in ext format
    Auth_Service ->> Person_OR_Service_APP: Token issuance in Tazama format
```
## Troubleshooting
#### npm install
Ensure generated token has read package rights

#### npm build
Ensure that you're on the current LTS version of Node.JS
