$ErrorActionPreference = 'Stop'
dotnet add WukalaGPT.Application/WukalaGPT.Application.csproj package Microsoft.EntityFrameworkCore -v 9.0.0
dotnet add WukalaGPT.Infrastructure/WukalaGPT.Infrastructure.csproj package Microsoft.EntityFrameworkCore.Relational -v 9.0.0
dotnet add WukalaGPT.Infrastructure/WukalaGPT.Infrastructure.csproj package Npgsql.EntityFrameworkCore.PostgreSQL -v 9.0.0
dotnet add WukalaGPT.API/WukalaGPT.API.csproj package Microsoft.EntityFrameworkCore.Design -v 9.0.0

dotnet build
Write-Host "Build Completed"
