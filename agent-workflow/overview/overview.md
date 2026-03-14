# ozone-crypto - Project Overview

## Purpose

The package provides a set of bash scripts and typescript libraries that are helpful in Open Finance contexts for things ranging from generating certificates, publishing JWKS, cryptographic operations on JWTs etc.

## Key Features

- JWT cryptographic operations
A typescript library that provides sign, verify, decode, encrypt and decrypt operations

- Certificate utilities
A CLI utility to convert PEM to JWK format

- Certificate Publisher
A CLI utility that generates a signing, encryption and transport key and certs. Places the certs in an S3 bucket.

## Architecture

The project provides a set of typescript libraries to carry out the functions listed above.

The CLI utilities are built on top of the libraries and provide an interface for users to interact with the underlying functionality. 

The certificate publisher utility interacts with AWS S3 to store the generated certificates as JWKS

## Technology Stack
Typescript
aws-cli
bash
openssl
jq (if required)

## Getting Started
`yarn install @ozoneapi/ozone-crypto` to install the package and its dependencies.


### Prerequisites
- Node.js 20 or higher
- AWS CLI configured with access to the S3 bucket for certificate publishing
- openssl
- yarn or npm

### Running Tests
`yarn run test` to run the test suite and validate functionality. Tests cover all major features and edge cases to ensure reliability and security of cryptographic operations.

## User Personas
- **Application Developers**: Developers that need to use JWS, JWE, JWKS and other related standards in their applications. They can use the libraries for cryptographic operations and the CLI utilities for certificate management. 
The target users are developers building applications that require a simple common library to deal with cryptographic operations in the context of Open Finance and API security.
- **Infrstructure Engineers**: Engineers responsible for managing the deployment of JWKS keystores can use the utility to generate and publish certificates to S3 which can be surfaced out over a url

