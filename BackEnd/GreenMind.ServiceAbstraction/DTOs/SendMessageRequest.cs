using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json.Serialization;
namespace GreenMind.ServiceAbstraction.DTOs
{
    public class SendMessageRequest
    {
        [JsonPropertyName("session_id")]
        public string? SessionId { get; set; }

        [JsonPropertyName("user_id")]
        public string? UserId { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;
    }
}