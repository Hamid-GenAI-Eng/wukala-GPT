using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System.Linq;
using WukalaGPT.Infrastructure.Persistence;
using Hangfire;
using Hangfire.MemoryStorage;

namespace WukalaGPT.IntegrationTests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove the existing PostgreSQL context configuration
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<WukalaDbContext>));

            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // Add an in-memory database for testing resilience without DB dependencies
            services.AddDbContext<WukalaDbContext>(options =>
            {
                options.UseInMemoryDatabase("InMemoryDbForTesting");
            });

            var sp = services.BuildServiceProvider();

            using (var scope = sp.CreateScope())
            {
                var scopedServices = scope.ServiceProvider;
                var db = scopedServices.GetRequiredService<WukalaDbContext>();
                
                // Ensure the database is created
                db.Database.EnsureCreated();
                
                // Optionally seed testing data
                SeedTestData(db);
            }

            // Override Authentication with TestScheme
            services.AddAuthentication(TestAuthHandler.DefaultScheme)
                .AddScheme<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions, TestAuthHandler>(
                    TestAuthHandler.DefaultScheme, options => { });

            // Remove existing Hangfire to avoid attempting connection to real PostgreSql locally during test
            var hangfireDescriptor = services.FirstOrDefault(d => d.ServiceType.Name.Contains("JobStorage"));
            if (hangfireDescriptor != null) services.Remove(hangfireDescriptor);
            
            // Re-add in-memory Hangfire if needed, or simply intercept to avoid crashes
            services.AddHangfire(config => config.UseMemoryStorage());
        });
    }

    private void SeedTestData(WukalaDbContext db)
    {
        // Add minimal testing data so tests can attack specific UUIDs
        var firmA = System.Guid.Parse("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA");
        var firmB = System.Guid.Parse("BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB");

        // Seed 1 client for Firm A
        db.Clients.Add(new Domain.Entities.Client { 
            Id = System.Guid.Parse("C1111111-1111-1111-1111-111111111111"),
            FirmId = firmA,
            FullName = "Firm A Client",
            ClientType = "Individual",
        });

        // Seed 1 client for Firm B
        db.Clients.Add(new Domain.Entities.Client { 
            Id = System.Guid.Parse("C2222222-2222-2222-2222-222222222222"),
            FirmId = firmB,
            FullName = "Firm B Client",
            ClientType = "Individual",
        });

        db.SaveChanges();
    }
}
