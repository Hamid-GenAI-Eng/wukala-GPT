using System;
using BCrypt.Net;

class Program 
{
    static void Main() 
    {
        string hash = BCrypt.Net.BCrypt.HashPassword("Admin@123");
        Console.WriteLine($"Generated Hash for Admin@123: {hash}");
    }
}
