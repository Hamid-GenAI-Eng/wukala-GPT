using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WukalaGPT.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddClientCrmFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LegalCases_ClientProfiles_ClientId",
                table: "LegalCases");

            migrationBuilder.CreateTable(
                name: "Clients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FirmId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: false),
                    FullName = table.Column<string>(type: "text", nullable: false),
                    ClientType = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: true),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    Whatsapp = table.Column<string>(type: "text", nullable: true),
                    Cnic = table.Column<string>(type: "text", nullable: true),
                    CompanyName = table.Column<string>(type: "text", nullable: true),
                    ContactPerson = table.Column<string>(type: "text", nullable: true),
                    Address = table.Column<string>(type: "text", nullable: true),
                    City = table.Column<string>(type: "text", nullable: true),
                    Province = table.Column<string>(type: "text", nullable: true),
                    Tags = table.Column<string[]>(type: "text[]", nullable: false),
                    AcquisitionSource = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    PortalEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    PortalEmail = table.Column<string>(type: "text", nullable: true),
                    RetentionFlagged = table.Column<bool>(type: "boolean", nullable: false),
                    RetentionFlaggedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    OnboardedAt = table.Column<DateOnly>(type: "date", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false),
                    ArchivedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clients", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ConflictChecks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FirmId = table.Column<Guid>(type: "uuid", nullable: false),
                    CheckedById = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientName = table.Column<string>(type: "text", nullable: false),
                    ClientCnic = table.Column<string>(type: "text", nullable: true),
                    OpposingParty = table.Column<string>(type: "text", nullable: true),
                    Result = table.Column<string>(type: "text", nullable: false),
                    RiskLevel = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    MatchedClients = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    MatchedCases = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConflictChecks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ClientInteractions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    FirmId = table.Column<Guid>(type: "uuid", nullable: false),
                    LoggedById = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Summary = table.Column<string>(type: "text", nullable: false),
                    Outcome = table.Column<string>(type: "text", nullable: true),
                    DurationMins = table.Column<int>(type: "integer", nullable: true),
                    InteractionDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    NextAction = table.Column<string>(type: "text", nullable: true),
                    NextActionDate = table.Column<DateOnly>(type: "date", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientInteractions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientInteractions_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClientPortalDocumentAccesses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    DocumentId = table.Column<Guid>(type: "uuid", nullable: false),
                    FirmId = table.Column<Guid>(type: "uuid", nullable: false),
                    SharedById = table.Column<Guid>(type: "uuid", nullable: false),
                    SharedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    RevokedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientPortalDocumentAccesses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientPortalDocumentAccesses_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClientPortalDocumentAccesses_LegalDocuments_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "LegalDocuments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClientInteractions_ClientId",
                table: "ClientInteractions",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientPortalDocumentAccesses_ClientId_DocumentId",
                table: "ClientPortalDocumentAccesses",
                columns: new[] { "ClientId", "DocumentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClientPortalDocumentAccesses_DocumentId",
                table: "ClientPortalDocumentAccesses",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_FirmId_IsArchived",
                table: "Clients",
                columns: new[] { "FirmId", "IsArchived" });

            migrationBuilder.AddForeignKey(
                name: "FK_LegalCases_Clients_ClientId",
                table: "LegalCases",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LegalCases_Clients_ClientId",
                table: "LegalCases");

            migrationBuilder.DropTable(
                name: "ClientInteractions");

            migrationBuilder.DropTable(
                name: "ClientPortalDocumentAccesses");

            migrationBuilder.DropTable(
                name: "ConflictChecks");

            migrationBuilder.DropTable(
                name: "Clients");

            migrationBuilder.AddForeignKey(
                name: "FK_LegalCases_ClientProfiles_ClientId",
                table: "LegalCases",
                column: "ClientId",
                principalTable: "ClientProfiles",
                principalColumn: "Id");
        }
    }
}
