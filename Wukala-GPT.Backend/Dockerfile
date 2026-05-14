# Use the official ASP.NET Core runtime as a base image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
# Explicitly enforce Port 8080 for Azure App Service Linux Containers
EXPOSE 8080

# Use the official .NET SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy the solution and project files first to cache dependencies (Docker layer caching)
COPY ["WukalaGPT.sln", "./"]
COPY ["WukalaGPT.API/WukalaGPT.API.csproj", "WukalaGPT.API/"]
COPY ["WukalaGPT.Application/WukalaGPT.Application.csproj", "WukalaGPT.Application/"]
COPY ["WukalaGPT.Domain/WukalaGPT.Domain.csproj", "WukalaGPT.Domain/"]
COPY ["WukalaGPT.Infrastructure/WukalaGPT.Infrastructure.csproj", "WukalaGPT.Infrastructure/"]

# Restore the NuGet packages for the API and its dependencies (ignoring tests)
RUN dotnet restore "WukalaGPT.API/WukalaGPT.API.csproj"

# Copy the remaining project files
COPY . .

# Build the project
WORKDIR "/src/WukalaGPT.API"
RUN dotnet build "WukalaGPT.API.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "WukalaGPT.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage: Use the runtime image and copy the published output
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Ensure the app prioritizes port 8080 for Azure ping checks
ENV ASPNETCORE_URLS=http://+:8080

# Command to run the application
ENTRYPOINT ["dotnet", "WukalaGPT.API.dll"]
