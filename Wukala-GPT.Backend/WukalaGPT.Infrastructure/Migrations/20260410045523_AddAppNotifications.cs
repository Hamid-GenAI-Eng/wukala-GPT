using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WukalaGPT.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAppNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Hearings_CaseId_HearingDate",
                table: "Hearings");

            migrationBuilder.DropIndex(
                name: "IX_Hearings_ClientId_HearingDate",
                table: "Hearings");

            migrationBuilder.DropIndex(
                name: "IX_Hearings_FirmId_HearingDate_StartTime",
                table: "Hearings");

            migrationBuilder.DropIndex(
                name: "IX_Hearings_HearingDate_StartTime",
                table: "Hearings");

            migrationBuilder.DropIndex(
                name: "IX_Hearings_LeadLawyerId_HearingDate_StartTime",
                table: "Hearings");

            migrationBuilder.CreateTable(
                name: "AppNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    FirmId = table.Column<Guid>(type: "uuid", nullable: true),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Priority = table.Column<string>(type: "text", nullable: false),
                    ActionUrl = table.Column<string>(type: "text", nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppNotifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Hearings_CaseId_HearingDate",
                table: "Hearings",
                columns: new[] { "CaseId", "HearingDate" },
                filter: "\"IsArchived\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Hearings_ClientId_HearingDate",
                table: "Hearings",
                columns: new[] { "ClientId", "HearingDate" },
                filter: "\"ClientId\" IS NOT NULL AND \"IsArchived\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Hearings_FirmId_HearingDate_StartTime",
                table: "Hearings",
                columns: new[] { "FirmId", "HearingDate", "StartTime" },
                filter: "\"IsArchived\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Hearings_HearingDate_StartTime",
                table: "Hearings",
                columns: new[] { "HearingDate", "StartTime" },
                filter: "\"Status\" = 'Scheduled' AND \"IsArchived\" = false AND \"Reminder24hSentAt\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Hearings_LeadLawyerId_HearingDate_StartTime",
                table: "Hearings",
                columns: new[] { "LeadLawyerId", "HearingDate", "StartTime" },
                filter: "\"Status\" = 'Scheduled' AND \"IsArchived\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_AppNotifications_UserId",
                table: "AppNotifications",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppNotifications");

            migrationBuilder.DropIndex(
                name: "IX_Hearings_CaseId_HearingDate",
                table: "Hearings");

            migrationBuilder.DropIndex(
                name: "IX_Hearings_ClientId_HearingDate",
                table: "Hearings");

            migrationBuilder.DropIndex(
                name: "IX_Hearings_FirmId_HearingDate_StartTime",
                table: "Hearings");

            migrationBuilder.DropIndex(
                name: "IX_Hearings_HearingDate_StartTime",
                table: "Hearings");

            migrationBuilder.DropIndex(
                name: "IX_Hearings_LeadLawyerId_HearingDate_StartTime",
                table: "Hearings");

            migrationBuilder.CreateIndex(
                name: "IX_Hearings_CaseId_HearingDate",
                table: "Hearings",
                columns: new[] { "CaseId", "HearingDate" },
                filter: "is_archived = false");

            migrationBuilder.CreateIndex(
                name: "IX_Hearings_ClientId_HearingDate",
                table: "Hearings",
                columns: new[] { "ClientId", "HearingDate" },
                filter: "client_id IS NOT NULL AND is_archived = false");

            migrationBuilder.CreateIndex(
                name: "IX_Hearings_FirmId_HearingDate_StartTime",
                table: "Hearings",
                columns: new[] { "FirmId", "HearingDate", "StartTime" },
                filter: "is_archived = false");

            migrationBuilder.CreateIndex(
                name: "IX_Hearings_HearingDate_StartTime",
                table: "Hearings",
                columns: new[] { "HearingDate", "StartTime" },
                filter: "status = 'Scheduled' AND is_archived = false AND reminder_24h_sent_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Hearings_LeadLawyerId_HearingDate_StartTime",
                table: "Hearings",
                columns: new[] { "LeadLawyerId", "HearingDate", "StartTime" },
                filter: "status = 'Scheduled' AND is_archived = false");
        }
    }
}
