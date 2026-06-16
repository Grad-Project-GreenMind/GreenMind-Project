using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GreenMind.Presistance.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewTablesAndEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Reviews",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Reviews",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "Reviews",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Position",
                table: "Reviews",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Email",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "Position",
                table: "Reviews");
        }
    }
}
