using System;

namespace GreenMind.ServiceAbstraction.DTOs
{
    public class ReviewResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Position { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? UserImage { get; set; } 
        public DateTime CreatedAt { get; set; }
    }
}