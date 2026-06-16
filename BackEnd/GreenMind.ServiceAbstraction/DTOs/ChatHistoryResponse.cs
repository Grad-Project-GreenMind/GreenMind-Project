using System.Collections.Generic;
using System.Text.Json.Serialization;


namespace GreenMind.ServiceAbstraction.DTOs
{
    public class ChatHistoryResponse
    {
        [JsonPropertyName("chats")]
        public List<ChatSessionDto> Chats { get; set; } = new();
    }

    public class ChatSessionDto
    {
        [JsonPropertyName("session_id")]
        public string SessionId { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        public string? LastMessageAt { get; set; }

        [JsonPropertyName("messages")]
        public List<ChatMessageDto> Messages { get; set; } = new();
    }

    public class ChatMessageDto
    {
        [JsonPropertyName("sender")]
        public string Sender { get; set; } = string.Empty;

        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;

        [JsonPropertyName("timestamp")]
        public string Timestamp { get; set; } = string.Empty;
    }


    public class AiChatRequest
    {
        [JsonPropertyName("session_id")]
        public string? SessionId { get; set; }

        [JsonPropertyName("user_id")]
        public string? UserId { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("history")] // الـ AI مستني history
        public List<AiHistoryMessage> History { get; set; } = new();

        [JsonPropertyName("metadata")]
        public object? Metadata { get; set; }
    }
    public class AiHistoryMessage
    {
        [JsonPropertyName("sender")] // الـ AI مستني sender
        public string? Sender { get; set; }

        [JsonPropertyName("text")]   // الـ AI مستني text
        public string? Text { get; set; }
    }

    public class GenerateTitleRequest
    {
        [JsonPropertyName("messages")]
        public List<AiTitleMessage> Messages { get; set; } = new();
    }

    public class AiTitleMessage
    {
        [JsonPropertyName("role")]
        public string? Role { get; set; }

        [JsonPropertyName("content")]
        public string? Content { get; set; }
    }

    public class GenerateTitleResponse
    {
        [JsonPropertyName("reply")]
        public string? Title { get; set; }

        [JsonPropertyName("title")]
        public string? AlternativeTitle { get; set; }
    }
}