using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WukalaGPT.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixInvalidCourtType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"Hearings\" SET \"CourtType\" = 'district' WHERE \"CourtType\" = 'civil';");
            migrationBuilder.Sql("UPDATE \"Hearings\" SET \"CourtType\" = 'district' WHERE \"CourtType\" = 'sessions';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
