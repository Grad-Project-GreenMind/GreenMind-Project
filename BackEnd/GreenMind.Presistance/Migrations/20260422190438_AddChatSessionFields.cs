using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GreenMind.Presistance.Migrations
{
    /// <inheritdoc />
    public partial class AddChatSessionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFromUser",
                table: "ChatLogs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SessionId",
                table: "ChatLogs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsFromUser",
                table: "ChatLogs");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "ChatLogs");
        }
    }
}
