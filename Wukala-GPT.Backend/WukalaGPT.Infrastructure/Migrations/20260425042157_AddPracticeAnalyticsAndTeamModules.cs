using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WukalaGPT.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPracticeAnalyticsAndTeamModules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "FirmId",
                table: "Users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StaffRole",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Outcome",
                table: "LegalCases",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "FirmActivityLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FirmId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "text", nullable: false),
                    Target = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FirmActivityLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FirmActivityLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FirmExpenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FirmId = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ExpenseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FirmExpenses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StaffTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FirmId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    AssignedToUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StaffTasks_Users_AssignedByUserId",
                        column: x => x.AssignedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StaffTasks_Users_AssignedToUserId",
                        column: x => x.AssignedToUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                columns: new[] { "FirmId", "StaffRole" },
                values: new object[] { null, null });

            migrationBuilder.CreateIndex(
                name: "IX_FirmActivityLogs_FirmId_CreatedAt",
                table: "FirmActivityLogs",
                columns: new[] { "FirmId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_FirmActivityLogs_UserId",
                table: "FirmActivityLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_FirmExpenses_FirmId_ExpenseDate",
                table: "FirmExpenses",
                columns: new[] { "FirmId", "ExpenseDate" });

            migrationBuilder.CreateIndex(
                name: "IX_StaffTasks_AssignedByUserId",
                table: "StaffTasks",
                column: "AssignedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffTasks_AssignedToUserId",
                table: "StaffTasks",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffTasks_FirmId_DueDate",
                table: "StaffTasks",
                columns: new[] { "FirmId", "DueDate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FirmActivityLogs");

            migrationBuilder.DropTable(
                name: "FirmExpenses");

            migrationBuilder.DropTable(
                name: "StaffTasks");

            migrationBuilder.DropColumn(
                name: "FirmId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "StaffRole",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Outcome",
                table: "LegalCases");
        }
    }
}
