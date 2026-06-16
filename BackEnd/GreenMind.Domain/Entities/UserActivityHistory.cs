using System;
using System.ComponentModel.DataAnnotations;

namespace GreenMind.Domain.Entities
{
    public class UserActivityHistory
    {
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; } 
        public User? User { get; set; }

        [Required]
        public string? Type { get; set; } 

        [Required]
        public string? Text { get; set; } 

        [Required]
        public string? Date { get; set; } 

        public string? Image { get; set; } 
    }
}