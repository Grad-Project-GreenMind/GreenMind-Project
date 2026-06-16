using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Text.Json.Serialization;
namespace GreenMind.ServiceAbstraction.DTOs
{
    public class CreateNewChatResponse
    {
        [JsonPropertyName("session_id")]
        public string SessionId { get; set; } = string.Empty;

        [JsonPropertyName("message")]
        public string Message { get; set; } = "New chat created";
    }
}