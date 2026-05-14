using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WukalaGPT.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLawyerProfileModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ActiveCases",
                table: "LawyerProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Badges",
                table: "LawyerProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CasesWon",
                table: "LawyerProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "ConsultationFee",
                table: "LawyerProfiles",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsAvailableForNewCases",
                table: "LawyerProfiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsProfileVisible",
                table: "LawyerProfiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ProfilePhotoUrl",
                table: "LawyerProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ReceiveEmailNotifications",
                table: "LawyerProfiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ResponseTime",
                table: "LawyerProfiles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "Educations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LawyerProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    InstituteName = table.Column<string>(type: "text", nullable: false),
                    DegreeName = table.Column<string>(type: "text", nullable: false),
                    Grades = table.Column<string>(type: "text", nullable: false),
                    DegreeImageUrl = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Educations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Educations_LawyerProfiles_LawyerProfileId",
                        column: x => x.LawyerProfileId,
                        principalTable: "LawyerProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Experiences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LawyerProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    FirmCompany = table.Column<string>(type: "text", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsCurrent = table.Column<bool>(type: "boolean", nullable: false),
                    ShortBio = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Experiences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Experiences_LawyerProfiles_LawyerProfileId",
                        column: x => x.LawyerProfileId,
                        principalTable: "LawyerProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Specialities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Specialities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LawyerSpecialities",
                columns: table => new
                {
                    LawyerProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    SpecialityId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LawyerSpecialities", x => new { x.LawyerProfileId, x.SpecialityId });
                    table.ForeignKey(
                        name: "FK_LawyerSpecialities_LawyerProfiles_LawyerProfileId",
                        column: x => x.LawyerProfileId,
                        principalTable: "LawyerProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LawyerSpecialities_Specialities_SpecialityId",
                        column: x => x.SpecialityId,
                        principalTable: "Specialities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Educations_LawyerProfileId",
                table: "Educations",
                column: "LawyerProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_Experiences_LawyerProfileId",
                table: "Experiences",
                column: "LawyerProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_LawyerSpecialities_SpecialityId",
                table: "LawyerSpecialities",
                column: "SpecialityId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Educations");

            migrationBuilder.DropTable(
                name: "Experiences");

            migrationBuilder.DropTable(
                name: "LawyerSpecialities");

            migrationBuilder.DropTable(
                name: "Specialities");

            migrationBuilder.DropColumn(
                name: "ActiveCases",
                table: "LawyerProfiles");

            migrationBuilder.DropColumn(
                name: "Badges",
                table: "LawyerProfiles");

            migrationBuilder.DropColumn(
                name: "CasesWon",
                table: "LawyerProfiles");

            migrationBuilder.DropColumn(
                name: "ConsultationFee",
                table: "LawyerProfiles");

            migrationBuilder.DropColumn(
                name: "IsAvailableForNewCases",
                table: "LawyerProfiles");

            migrationBuilder.DropColumn(
                name: "IsProfileVisible",
                table: "LawyerProfiles");

            migrationBuilder.DropColumn(
                name: "ProfilePhotoUrl",
                table: "LawyerProfiles");

            migrationBuilder.DropColumn(
                name: "ReceiveEmailNotifications",
                table: "LawyerProfiles");

            migrationBuilder.DropColumn(
                name: "ResponseTime",
                table: "LawyerProfiles");
        }
    }
}
