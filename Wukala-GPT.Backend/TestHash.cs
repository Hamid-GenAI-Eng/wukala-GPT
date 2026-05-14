using System;
using System.Security.Cryptography;

class Test
{
    static void Main()
    {
        string pw = "TST@1!!!";
        string dbHash = "$2a$11$UnkrHBxYqqG1BlE.ykHDxuiXAwaNYhhwAIWxG.oRBbkk8OFprZgLi";
        bool match = BCrypt.Net.BCrypt.Verify(pw, dbHash);
        Console.WriteLine($"Match: {match}");
    }
}
