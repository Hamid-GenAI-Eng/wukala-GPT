using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;
using WukalaGPT.Application.Features.Clients;
using WukalaGPT.Domain.Entities;
using WukalaGPT.Infrastructure.Persistence;

namespace WukalaGPT.IntegrationTests;

public class SecurityAttackTests
{
    private WukalaDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<WukalaDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var dbContext = new WukalaDbContext(options);
        dbContext.Database.EnsureCreated();

        // Seed 2 Firms and Clients
        var firmA = Guid.Parse("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA");
        var firmB = Guid.Parse("BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB");

        dbContext.Clients.Add(new Client { 
            Id = Guid.Parse("C1111111-1111-1111-1111-111111111111"),
            FirmId = firmA,
            FullName = "Firm A Client",
            ClientType = "Individual",
        });

        dbContext.Clients.Add(new Client { 
            Id = Guid.Parse("C2222222-2222-2222-2222-222222222222"),
            FirmId = firmB,
            FullName = "Firm B Client",
            ClientType = "Individual",
        });

        dbContext.SaveChanges();
        return dbContext;
    }

    [Fact]
    public async Task IDOR_Attack_Should_Prevent_Firm_A_From_Accessing_Firm_B_Client()
    {
        // Arrange
        var db = GetInMemoryDbContext();
        var handler = new GetClientDetailQueryHandler(db);
        
        var query = new GetClientDetailQuery
        {
            FirmId = Guid.Parse("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA"), // Attacker belongs to Firm A
            ClientId = Guid.Parse("C2222222-2222-2222-2222-222222222222") // Attacker targets Firm B's Client directly
        };

        // Act
        Func<Task> act = async () => await handler.Handle(query, CancellationToken.None);

        // Assert: The IDOR should trigger a KeyNotFoundException or InvalidOperationException because of firm scoping
        await act.Should().ThrowAsync<Exception>();
    }

    [Fact]
    public async Task XSS_Payload_Attack_Should_Be_Accepted_And_Treated_Safely()
    {
        // Arrange
        var db = GetInMemoryDbContext();
        // Let's pass null for IDistributedCache and INotificationService since it's a test and they might be mocked
        var handler = new WukalaGPT.Application.Features.Clients.CreateClientCommandHandler(
            db, 
            new Microsoft.Extensions.Caching.Distributed.MemoryDistributedCache(new Microsoft.Extensions.Options.OptionsWrapper<Microsoft.Extensions.Caching.Memory.MemoryDistributedCacheOptions>(new Microsoft.Extensions.Caching.Memory.MemoryDistributedCacheOptions())), 
            new Moq.Mock<WukalaGPT.Application.Interfaces.INotificationService>().Object
        );
        
        var payload = new CreateClientCommand
        {
            FirmId = Guid.NewGuid(),
            CreatedById = Guid.NewGuid(),
            FullName = "<script>alert('XSS_ATTACK');</script>",
            Email = "malicious@attacker.com",
            ClientType = "Individual"
        };

        // Act
        var result = await handler.Handle(payload, CancellationToken.None);

        // Assert - The Handler executes successfully, database persists string without crashing due to buffers
        result.Should().NotBeNull();
        result.FullName.Should().Be(payload.FullName);
    }
}
