# Wukala-GPT Enterprise Backend

<div align="center">
  <h3>Next-Generation Legal AI & Directory Platform</h3>
  <p>Enterprise-grade .NET 9 Backend Architecture</p>
</div>

---

> 🔒 **CONFIDENTIALITY NOTICE**
> This repository contains proprietary and strictly confidential source code belonging to **HamidTech Ventures**. Unauthorized copying, distribution, or disclosure of this codebase is strictly prohibited.

## 🚀 Architecture Overview

The Wukala-GPT backend is built on a highly scalable, distributed **Clean Architecture** model, designed to support thousands of concurrent users, real-time messaging, and low-latency AI interactions. 

Engineered with **.NET 9**, **PostgreSQL**, and an extensive **Redis** microservices backbone, the platform is optimized for sub-millisecond data retrieval, DDoS protection, and high-availability horizontal scaling.

## 🏗️ Core Technologies

* **Framework:** .NET 9 (C# 13)
* **Database:** PostgreSQL (Entity Framework Core)
* **In-Memory Datastore:** Redis Enterprise
* **Real-time Engine:** SignalR WebSockets
* **Cloud Storage:** Cloudinary
* **Containerization:** Docker & Docker Compose
* **Design Pattern:** Clean Architecture / Domain-Driven Design (DDD)

## ⚡ Enterprise Features

### 1. Robust Security & Authentication
* Stateless **JWT Authentication** with instant cryptographic validation.
* **O(1) Token Blacklisting:** Leverages Redis `IDistributedCache` for instantaneous logout enforcement without heavy database locking.
* Role-Based Access Control (RBAC) securely separating `Admin`, `Lawyer`, and `Client` access tiers.

### 2. High-Performance Caching
* **Pre-Computed Memory Delivery:** AI directory search and metadata endpoints serialize natively into Redis. Repeat queries bypass the relational database entirely, serving requests in microseconds.

### 3. Global DDoS Protection
* Engineered with a custom **Redis Rate Limiting Middleware** utilizing distributed sliding windows. 
* Dynamically throttles standard endpoints while applying ultra-strict traffic policing to computationally expensive AI and File Upload routes.

### 4. Horizontally Scalable Real-Time Messaging (WebSockets)
* Integrated `ChatHub` for asynchronous peer-to-peer and AI communication.
* **Redis Backplane Routing:** Messages broadcast intelligently across multiple load-balanced server instances, ensuring seamless chat performance globally.

### 5. Multi-Layer AI Context Engine
* **Contextual Session Tracking:** Dedicated `IAiContextCacheService` maintains the last 10 messages of sliding user context directly in Redis memory.
* Protects relational DB storage while maximizing prompt-injection context size internally.

### 6. Automated Document Processing
* Built-in file heuristic analyzer processing user uploads safely.
* Automatic constraint verification, real-time virus risk mitigation, and native deep classification (`Contract`, `LegalDoc`, `Image`).
* Cloudinary pipeline integration for encrypted object storage.

## 📦 Project Structure

```text
Wukala-GPT.Backend/
├── WukalaGPT.API/            # Presentation Layer (Controllers, Hubs, Middlewares, DI)
├── WukalaGPT.Application/    # Business Logic (Services, DTOs, Interfaces, Workflows)
├── WukalaGPT.Domain/         # Core Domain (Entities, Enums, Custom Exceptions)
└── WukalaGPT.Infrastructure/ # Data Access (EF Core, Migrations, Postgres, Redis, Cloudinary)
```

## 🛠️ Getting Started

### Prerequisites
* [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
* PostgreSQL Server
* Redis Server
* Docker Desktop (Optional, for containerized deployment)

### Environment Configuration
Ensure `appsettings.json` or your Host Environment Variables contain valid connections:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=WukalaGptDb;Username=postgres;Password=your_password",
    "Redis": "localhost:6379,abortConnect=false"
  },
  "JwtToken": {
    "SecretKey": "YOUR_256_BIT_SECRET...",
    "Issuer": "WukalaGPT",
    "Audience": "WukalaGPT_Users",
    "ExpiryDays": 7
  },
  "Cloudinary": {
    "CloudName": "...",
    "ApiKey": "...",
    "ApiSecret": "..."
  }
}
```

### Running Locally
1. Navigate to the API directory:
   ```bash
   cd WukalaGPT.API
   ```
2. Build the solution:
   ```bash
   dotnet build
   ```
3. Run the API (EF Core will Auto-Migrate the database on startup):
   ```bash
   dotnet run
   ```

### Docker Deployment
Build and run the production-ready image natively:
```bash
docker build -t wukalagpt-api .
docker run -d -p 5285:8080 --name wukalagpt-server wukalagpt-api
```

---
© 2026 HamidTech Ventures. All Rights Reserved.
