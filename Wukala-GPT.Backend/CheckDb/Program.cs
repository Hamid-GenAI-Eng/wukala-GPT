using System;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using WukalaGPT.Infrastructure.Persistence;
using WukalaGPT.Domain.Entities;
using WukalaGPT.API;

class Program
{
    static void Main()
    {
        var optionsBuilder = new DbContextOptionsBuilder<WukalaDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Database=WukalaGPT;Username=postgres;Password=u6mJQUA2");

        using var context = new WukalaDbContext(optionsBuilder.Options);
        
        var users = context.Users.ToList();
        Console.WriteLine($"Total users in DB: {users.Count}");
        foreach (var u in users) {
            Console.WriteLine($"User: {u.Email}");
        }
    }
}
