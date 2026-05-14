$ErrorActionPreference = 'Stop'

dotnet new sln -n WukalaGPT
dotnet new classlib -n WukalaGPT.Domain
dotnet new classlib -n WukalaGPT.Application
dotnet new classlib -n WukalaGPT.Infrastructure
dotnet new webapi -n WukalaGPT.API --use-controllers

dotnet sln add WukalaGPT.Domain/WukalaGPT.Domain.csproj
dotnet sln add WukalaGPT.Application/WukalaGPT.Application.csproj
dotnet sln add WukalaGPT.Infrastructure/WukalaGPT.Infrastructure.csproj
dotnet sln add WukalaGPT.API/WukalaGPT.API.csproj

dotnet add WukalaGPT.Application/WukalaGPT.Application.csproj reference WukalaGPT.Domain/WukalaGPT.Domain.csproj
dotnet add WukalaGPT.Infrastructure/WukalaGPT.Infrastructure.csproj reference WukalaGPT.Domain/WukalaGPT.Domain.csproj
dotnet add WukalaGPT.Infrastructure/WukalaGPT.Infrastructure.csproj reference WukalaGPT.Application/WukalaGPT.Application.csproj
dotnet add WukalaGPT.API/WukalaGPT.API.csproj reference WukalaGPT.Application/WukalaGPT.Application.csproj
dotnet add WukalaGPT.API/WukalaGPT.API.csproj reference WukalaGPT.Infrastructure/WukalaGPT.Infrastructure.csproj

$ErrorActionPreference = 'Continue'
Remove-Item WukalaGPT.Domain/Class1.cs -ErrorAction SilentlyContinue
Remove-Item WukalaGPT.Application/Class1.cs -ErrorAction SilentlyContinue
Remove-Item WukalaGPT.Infrastructure/Class1.cs -ErrorAction SilentlyContinue
Remove-Item WukalaGPT.API/Controllers/WeatherForecastController.cs -ErrorAction SilentlyContinue
Remove-Item WukalaGPT.API/WeatherForecast.cs -ErrorAction SilentlyContinue

New-Item -ItemType Directory -Force -Path "WukalaGPT.Domain/Entities"
New-Item -ItemType Directory -Force -Path "WukalaGPT.Domain/Enums"
New-Item -ItemType Directory -Force -Path "WukalaGPT.Domain/Exceptions"

New-Item -ItemType Directory -Force -Path "WukalaGPT.Application/Interfaces"
New-Item -ItemType Directory -Force -Path "WukalaGPT.Application/DTOs"
New-Item -ItemType Directory -Force -Path "WukalaGPT.Application/Features/Auth"
New-Item -ItemType Directory -Force -Path "WukalaGPT.Application/Features/AiChat"
New-Item -ItemType Directory -Force -Path "WukalaGPT.Application/Features/Documents"
New-Item -ItemType Directory -Force -Path "WukalaGPT.Application/Features/Lawyers"
New-Item -ItemType Directory -Force -Path "WukalaGPT.Application/Features/Messaging"
New-Item -ItemType Directory -Force -Path "WukalaGPT.Application/Features/Dashboard"

New-Item -ItemType Directory -Force -Path "WukalaGPT.Infrastructure/Persistence/Configurations"
New-Item -ItemType Directory -Force -Path "WukalaGPT.Infrastructure/Persistence/Migrations"
New-Item -ItemType Directory -Force -Path "WukalaGPT.Infrastructure/Services"

New-Item -ItemType Directory -Force -Path "WukalaGPT.API/Middleware"
New-Item -ItemType Directory -Force -Path "WukalaGPT.API/Extensions"

Write-Host "Setup Completed Successfully"
