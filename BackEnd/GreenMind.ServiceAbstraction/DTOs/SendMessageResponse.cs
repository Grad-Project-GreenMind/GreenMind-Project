using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace GreenMind.ServiceAbstraction.DTOs
{
    public class SendMessageResponse
    {
        [JsonPropertyName("session_id")]
        public string SessionId { get; set; } = string.Empty;

        [JsonPropertyName("reply")]
        public string Reply { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "success";

        [JsonPropertyName("analysis")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public AnalysisResult? Analysis { get; set; }

        [JsonPropertyName("follow_up_question")]
       
        public string? FollowUpQuestion { get; set; }
    }

    public class AnalysisResult
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("confidence")]
        public double Confidence { get; set; }

        [JsonPropertyName("result")]
        public string Result { get; set; } = string.Empty;
    }
}