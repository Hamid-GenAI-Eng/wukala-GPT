using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WukalaGPT.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedAdminUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "City", "CreatedAt", "Email", "FirstName", "IsActive", "IsEmailVerified", "LastName", "OtpCode", "OtpExpiry", "PasswordHash", "PasswordResetToken", "PhoneNumber", "ResetTokenExpiry", "Role", "UpdatedAt" },
                values: new object[] { new Guid("00000000-0000-0000-0000-000000000001"), "System", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "wukalagpt@codeenvision.com", "System", true, true, "Admin", null, null, "$2a$11$UnkrHBxYqqG1BlE.ykHDxuiXAwaNYhhwAIWxG.oRBbkk8OFprZgLi", null, "0000000000", null, 0, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"));
        }
    }
}
