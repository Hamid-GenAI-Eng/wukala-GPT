using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WukalaGPT.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAdminPasswordHash : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "PasswordHash",
                value: "$2a$11$QdbURztZ8cP/kN2svQ/p.uMOfPJJH5rZ7wkx4sRb53FIBr.6BfH5q");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "PasswordHash",
                value: "$2a$11$UnkrHBxYqqG1BlE.ykHDxuiXAwaNYhhwAIWxG.oRBbkk8OFprZgLi");
        }
    }
}
