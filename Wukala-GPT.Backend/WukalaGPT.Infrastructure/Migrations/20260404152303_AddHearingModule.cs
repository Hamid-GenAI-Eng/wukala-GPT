using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WukalaGPT.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHearingModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateOnly>(
                name: "NextDate",
                table: "LegalCases",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "Hearings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FirmId = table.Column<Guid>(type: "uuid", nullable: false),
                    CaseId = table.Column<Guid>(type: "uuid", nullable: false),
                    LeadLawyerId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: true),
                    HearingType = table.Column<string>(type: "text", nullable: true),
                    CourtType = table.Column<string>(type: "text", nullable: false),
                    CourtName = table.Column<string>(type: "text", nullable: false),
                    CourtRoom = table.Column<string>(type: "text", nullable: true),
                    JudgeName = table.Column<string>(type: "text", nullable: true),
                    HearingDate = table.Column<DateOnly>(type: "date", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    DurationMins = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Priority = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    Instructions = table.Column<string>(type: "text", nullable: true),
                    Reminder24hSentAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Reminder2hSentAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Hearings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Hearings_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Hearings_Firms_FirmId",
                        column: x => x.FirmId,
                        principalTable: "Firms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Hearings_LegalCases_CaseId",
                        column: x => x.CaseId,
                        principalTable: "LegalCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Hearings_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Hearings_Users_LeadLawyerId",
                        column: x => x.LeadLawyerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "HearingAdjournments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginalHearingId = table.Column<Guid>(type: "uuid", nullable: false),
                    NewHearingId = table.Column<Guid>(type: "uuid", nullable: true),
                    FirmId = table.Column<Guid>(type: "uuid", nullable: false),
                    AdjournedById = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginalDate = table.Column<DateOnly>(type: "date", nullable: false),
                    OriginalTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    NewDate = table.Column<DateOnly>(type: "date", nullable: true),
                    NewTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    Reason = table.Column<string>(type: "text", nullable: false),
                    ReasonDetail = table.Column<string>(type: "text", nullable: true),
                    CourtOrderRef = table.Column<string>(type: "text", nullable: true),
                    AdjournedByCourt = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HearingAdjournments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HearingAdjournments_Firms_FirmId",
                        column: x => x.FirmId,
                        principalTable: "Firms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HearingAdjournments_Hearings_NewHearingId",
                        column: x => x.NewHearingId,
                        principalTable: "Hearings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_HearingAdjournments_Hearings_OriginalHearingId",
                        column: x => x.OriginalHearingId,
                        principalTable: "Hearings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HearingAdjournments_Users_AdjournedById",
                        column: x => x.AdjournedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HearingAdjournments_AdjournedById",
                table: "HearingAdjournments",
                column: "AdjournedById");

            migrationBuilder.CreateIndex(
                name: "IX_HearingAdjournments_FirmId_CreatedAt",
                table: "HearingAdjournments",
                columns: new[] { "FirmId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_HearingAdjournments_NewHearingId",
                table: "HearingAdjournments",
                column: "NewHearingId");

            migrationBuilder.CreateIndex(
                name: "IX_HearingAdjournments_OriginalHearingId",
                table: "HearingAdjournments",
                column: "OriginalHearingId");

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
                name: "IX_Hearings_CreatedById",
                table: "Hearings",
                column: "CreatedById");

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HearingAdjournments");

            migrationBuilder.DropTable(
                name: "Hearings");

            migrationBuilder.AlterColumn<DateTime>(
                name: "NextDate",
                table: "LegalCases",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true);
        }
    }
}
