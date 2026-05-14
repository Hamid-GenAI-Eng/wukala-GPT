using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WukalaGPT.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSavedProfilesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SavedProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    LawyerId = table.Column<Guid>(type: "uuid", nullable: false),
                    SavedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavedProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SavedProfiles_Users_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SavedProfiles_Users_LawyerId",
                        column: x => x.LawyerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SavedProfiles_ClientId",
                table: "SavedProfiles",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_SavedProfiles_LawyerId",
                table: "SavedProfiles",
                column: "LawyerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SavedProfiles");
        }
    }
}
