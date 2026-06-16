using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GreenMind.Presistance.Migrations
{
    /// <inheritdoc />
    public partial class AddChatTitleToLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ChatTitle",
                table: "ChatLogs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ChatTitle",
                table: "ChatLogs");
        }
    }
}
