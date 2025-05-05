# KidsTubeV2 GraphQL API

This repository contains the GraphQL API for KidsTube, a platform designed to provide a safe and controlled YouTube viewing experience for children.

## Overview

The GraphQL API serves as a complementary service to the REST API, offering more flexibility in data fetching and a more intuitive way to request nested resources. While the REST API handles most write operations and authentication, this GraphQL service is optimized for complex read operations.

## Features

- **Efficient Data Fetching**: Request exactly what you need in a single queryus
- **Strongly Typed Schema**: Provides built-in documentation and validation
- **Nested Queries**: Fetch related resources in a single request (e.g., playlists with their videos)
- **YouTube Search Integration**: Search YouTube videos directly through GraphQL

## Architecture

The GraphQL API is built with:

- Node.js and Express
- Apollo Server for GraphQL implementation
- MongoDB for data storage (shared with REST API)
- JWT-based authentication

### GraphQL vs REST in KidsTube

This project implements a dual-API strategy:

1. **REST API** handles:
   - Authentication and user management
   - Data mutations (create, update, delete operations)
   - SMS verification
   - Simple resource fetching

2. **GraphQL API** handles:
   - Complex data queries
   - Nested resource fetching
   - YouTube search integration
   - Optimized data retrieval for frontend components

## Setup & Installation

### Prerequisites

- Node.js (v14+ recommended)
- MongoDB instance (shared with REST API)
- Environment variables properly configured

### Environment Variables

Create a `.env` file in the root directory with the following variables: