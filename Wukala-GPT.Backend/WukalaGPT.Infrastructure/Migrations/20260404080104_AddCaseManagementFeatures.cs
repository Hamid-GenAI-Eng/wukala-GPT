using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WukalaGPT.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCaseManagementFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Classification",
                table: "LegalDocuments",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "LegalCaseId",
                table: "LegalDocuments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Firms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Firms", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LegalCases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FirmId = table.Column<Guid>(type: "uuid", nullable: false),
                    LeadLawyerId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: true),
                    ClientNameRaw = table.Column<string>(type: "text", nullable: true),
                    CaseNumber = table.Column<string>(type: "text", nullable: true),
                    Title = table.Column<string>(type: "text", nullable: false),
                    CourtName = table.Column<string>(type: "text", nullable: true),
                    CaseType = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    FirNumber = table.Column<string>(type: "text", nullable: true),
                    FilingDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    NextDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    JudgeName = table.Column<string>(type: "text", nullable: true),
                    OpposingCounsel = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LegalCases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LegalCases_ClientProfiles_ClientId",
                        column: x => x.ClientId,
                        principalTable: "ClientProfiles",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_LegalCases_Users_LeadLawyerId",
                        column: x => x.LeadLawyerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CaseAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CaseId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CaseAssignments_LegalCases_CaseId",
                        column: x => x.CaseId,
                        principalTable: "LegalCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CaseAssignments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CaseDeadlines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CaseId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedToId = table.Column<Guid>(type: "uuid", nullable: true),
                    Title = table.Column<string>(type: "text", nullable: false),
                    DueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDone = table.Column<bool>(type: "boolean", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseDeadlines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CaseDeadlines_LegalCases_CaseId",
                        column: x => x.CaseId,
                        principalTable: "LegalCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CaseDeadlines_Users_AssignedToId",
                        column: x => x.AssignedToId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CaseLinks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CaseId = table.Column<Guid>(type: "uuid", nullable: false),
                    LinkedCaseId = table.Column<Guid>(type: "uuid", nullable: false),
                    LinkType = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CaseLinks_LegalCases_CaseId",
                        column: x => x.CaseId,
                        principalTable: "LegalCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CaseLinks_LegalCases_LinkedCaseId",
                        column: x => x.LinkedCaseId,
                        principalTable: "LegalCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CaseNotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CaseId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorId = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    IsPrivate = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CaseNotes_LegalCases_CaseId",
                        column: x => x.CaseId,
                        principalTable: "LegalCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CaseNotes_Users_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CaseTimelineEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CaseId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    EventType = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    EventDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseTimelineEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CaseTimelineEvents_LegalCases_CaseId",
                        column: x => x.CaseId,
                        principalTable: "LegalCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CaseTimelineEvents_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_LegalDocuments_LegalCaseId",
                table: "LegalDocuments",
                column: "LegalCaseId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseAssignments_CaseId_UserId",
                table: "CaseAssignments",
                columns: new[] { "CaseId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CaseAssignments_UserId",
                table: "CaseAssignments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseDeadlines_AssignedToId",
                table: "CaseDeadlines",
                column: "AssignedToId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseDeadlines_CaseId",
                table: "CaseDeadlines",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseLinks_CaseId_LinkedCaseId",
                table: "CaseLinks",
                columns: new[] { "CaseId", "LinkedCaseId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CaseLinks_LinkedCaseId",
                table: "CaseLinks",
                column: "LinkedCaseId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseNotes_AuthorId",
                table: "CaseNotes",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseNotes_CaseId",
                table: "CaseNotes",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseTimelineEvents_CaseId",
                table: "CaseTimelineEvents",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseTimelineEvents_CreatedById",
                table: "CaseTimelineEvents",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_LegalCases_ClientId",
                table: "LegalCases",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_LegalCases_LeadLawyerId",
                table: "LegalCases",
                column: "LeadLawyerId");

            migrationBuilder.AddForeignKey(
                name: "FK_LegalDocuments_LegalCases_LegalCaseId",
                table: "LegalDocuments",
                column: "LegalCaseId",
                principalTable: "LegalCases",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LegalDocuments_LegalCases_LegalCaseId",
                table: "LegalDocuments");

            migrationBuilder.DropTable(
                name: "CaseAssignments");

            migrationBuilder.DropTable(
                name: "CaseDeadlines");

            migrationBuilder.DropTable(
                name: "CaseLinks");

            migrationBuilder.DropTable(
                name: "CaseNotes");

            migrationBuilder.DropTable(
                name: "CaseTimelineEvents");

            migrationBuilder.DropTable(
                name: "Firms");

            migrationBuilder.DropTable(
                name: "LegalCases");

            migrationBuilder.DropIndex(
                name: "IX_LegalDocuments_LegalCaseId",
                table: "LegalDocuments");

            migrationBuilder.DropColumn(
                name: "Classification",
                table: "LegalDocuments");

            migrationBuilder.DropColumn(
                name: "LegalCaseId",
                table: "LegalDocuments");
        }
    }
}
